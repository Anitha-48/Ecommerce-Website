import base64
import hashlib
import hmac
import json
import uuid
from datetime import timedelta
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from .serializer import RegisterSerializer
from .models import Cart, Wishlist, Contact, Order, OrderItem
from .serializer import CartSerializer, WishlistSerializer
from .serializer import CheckoutSerializer, OrderSerializer, ContactSerializer
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404


DELIVERY_FEE = Decimal("40.00")


class RazorpayConfigurationError(Exception):
    pass


class RazorpayGatewayError(Exception):
    pass


def _razorpay_request(resource, payload=None):
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET
    if not key_id or not key_secret:
        raise RazorpayConfigurationError

    credentials = base64.b64encode(
        f"{key_id}:{key_secret}".encode("utf-8")
    ).decode("ascii")
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(
        f"https://api.razorpay.com/v1/{resource}",
        data=data,
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
        },
        method="POST" if data is not None else "GET",
    )

    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, json.JSONDecodeError) as error:
        raise RazorpayGatewayError from error


def _cart_total(cart):
    subtotal = sum(
        (Decimal(item.product.price) * item.quantity for item in cart),
        Decimal("0.00"),
    )
    return (subtotal + DELIVERY_FEE).quantize(Decimal("0.01"))


def _create_order(user, checkout_data, cart, total, payment_method, gateway_order_id=""):
    order = Order.objects.create(
        user=user,
        address=checkout_data["address"],
        phone=checkout_data["phone"],
        total_price=total,
        payment_method=payment_method,
        razorpay_order_id=gateway_order_id,
    )
    OrderItem.objects.bulk_create(
        [
            OrderItem(
                order=order,
                product=item.product,
                product_name=item.product.name,
                unit_price=item.product.price,
                quantity=item.quantity,
            )
            for item in cart
        ]
    )
    return order


def _remove_ordered_cart_items(order):
    for order_item in order.orderitem_set.all():
        cart_item = Cart.objects.select_for_update().filter(
            user=order.user,
            product=order_item.product,
        ).first()
        if cart_item is None:
            continue
        if cart_item.quantity <= order_item.quantity:
            cart_item.delete()
        else:
            cart_item.quantity -= order_item.quantity
            cart_item.save(update_fields=["quantity"])


def _mark_order_paid(order_id, payment_id, user=None):
    with transaction.atomic():
        orders = Order.objects.select_for_update()
        if user is not None:
            orders = orders.filter(user=user)
        order = orders.get(pk=order_id)
        if order.payment_status != Order.PaymentStatus.PAID:
            order.payment_status = Order.PaymentStatus.PAID
            order.razorpay_payment_id = payment_id
            order.status = Order.Status.CONFIRMED
            order.save(
                update_fields=[
                    "payment_status",
                    "razorpay_payment_id",
                    "status",
                ]
            )
            _remove_ordered_cart_items(order)
        return order


#  JWT TOKENs
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

### Contact

@api_view(["POST"])
def contact(request):
    serializer = ContactSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Saved"})
    return Response(serializer.errors)



####  register---------

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response({
            "message": "User registered successfully"
        })

    return Response(serializer.errors, status=400)


#  LOGIN ----------


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user:
        tokens = get_tokens_for_user(user)

        return Response({
            "access": tokens["access"],
            "refresh": tokens["refresh"],
            "is_admin": user.is_staff,
            "username": user.username ##profile username
        })

    return Response({"error": "Invalid Credentials"}, status=401)





### LOG OUT----------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)

        token.blacklist()   # 🔐 BLOCK TOKEN

        return Response({"message": "Logout successful"})

    except Exception as e:
        return Response({"error": str(e)}, status=400)
    









####----------------------------

###     PRODUCTS   ####

from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Product
from .serializer import ProductSerializer

#  GET ALL PRODUCTS
@api_view(['GET'])
@permission_classes([AllowAny])
def get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True,  context={"request": request})
    return Response(serializer.data)

# GET ONE PRODUCT 
@api_view(['GET'])
@permission_classes([AllowAny])
def getone_product(request, pk):
    product = get_object_or_404(Product, id=pk)
    serializer = ProductSerializer(product,context={"request": request})
    return Response(serializer.data)

## CREATE PRODUCT
@api_view(['POST'])
@permission_classes([IsAdminUser]) 
def create_product(request):
    
    serializer = ProductSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors)



## UPDATE PRODUCT

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def update_product(request, pk):

    try:
        product = Product.objects.get(id=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)
    
    #  ADD DEBUG HERE
    print("DATA:", request.data)
    print("FILES:", request.FILES)
    print("PRODUCT:", product)

    serializer = ProductSerializer(
       instance=product,         # ✅ explicit
        data=request.data,
        partial=True,
        context={"request":request}     # ✅ IMPORTANT for image field
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=200)
    print(serializer.errors)  # 🔥 DEBUG LINE
    return Response(serializer.errors, status=400)

   


## DELETE PRODUCT   
@api_view(['DELETE'])
@permission_classes([IsAdminUser]) 
def delete_product(request, pk):
    product = Product.objects.get(id=pk)
    product.delete()
    return Response({"message": "Product deleted successfully"})



####    DASHBOARD   ####----------------

#  DASHBOARD (USER)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    return Response({
        "message": f"Welcome {request.user.username}"
    })


#  GET CART
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart = Cart.objects.filter(user=request.user)
    serializer = CartSerializer(cart, many=True)
    return Response(serializer.data)


#  ADD TO CART
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    try:
        product_id = int(request.data.get("product"))
    except (TypeError, ValueError):
        return Response(
            {"error": "A valid product is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not Product.objects.filter(pk=product_id).exists():
        return Response(
            {"error": "Product not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    cart_item, created = Cart.objects.get_or_create(
        user=request.user,
        product_id=product_id
    )

    if not created:
        cart_item.quantity += 1
        cart_item.save()

    return Response({"message": "Added to cart"})

##UPDATE CART

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart(request, pk):
    try:
        quantity = int(request.data.get("quantity"))
    except (TypeError, ValueError):
        return Response(
            {"error": "Quantity must be a positive whole number."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if quantity < 1:
        return Response(
            {"error": "Quantity must be at least one."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    item = get_object_or_404(Cart, id=pk, user=request.user)
    item.quantity = quantity
    item.save()
    return Response({"message": "Updated"})

## DELETE CART

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_cart(request, pk):
    item = Cart.objects.get(id=pk, user=request.user)
    item.delete()
    return Response({"message": "Removed"})



####  WISHLIST    #####


#  GET WISHLIST
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wishlist(request):
    items = Wishlist.objects.filter(user=request.user)
    serializer = WishlistSerializer(items, many=True)
    return Response(serializer.data)

 ### ADD TO WISHLIST

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_wishlist(request):
    try:
        product_id = int(request.data.get("product"))
    except (TypeError, ValueError):
        return Response(
            {"error": "A valid product is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not Product.objects.filter(pk=product_id).exists():
        return Response(
            {"error": "Product not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    obj, created = Wishlist.objects.get_or_create(
        user=request.user,
        product_id=product_id
    )

    if not created:
        return Response({"message": "Already in wishlist"})

    return Response({"message": "Added to wishlist"})

## DELETE WISHLIST

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_wishlist(request, pk):
    item = get_object_or_404(Wishlist, id=pk, user=request.user)
    item.delete()
    return Response({"message": "Removed"})



### CHECKOUT


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def place_order(request):
    checkout = CheckoutSerializer(data=request.data)
    if not checkout.is_valid():
        return Response(checkout.errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        cart = list(
            Cart.objects.select_for_update()
            .select_related("product")
            .filter(user=request.user)
        )
        if not cart:
            return Response(
                {"error": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total = _cart_total(cart)
        if checkout.validated_data["payment_method"] == Order.PaymentMethod.CASH_ON_DELIVERY:
            order = _create_order(
                request.user,
                checkout.validated_data,
                cart,
                total,
                Order.PaymentMethod.CASH_ON_DELIVERY,
            )
            _remove_ordered_cart_items(order)
            return Response(
                {"message": "Order placed successfully", "order_id": order.id},
                status=status.HTTP_201_CREATED,
            )
        cart_signature = [
            (item.pk, item.product_id, item.quantity)
            for item in cart
        ]

    amount_paise = int(total * 100)
    try:
        gateway_order = _razorpay_request(
            "orders",
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"order-{request.user.pk}-{uuid.uuid4().hex[:16]}",
            },
        )
    except RazorpayConfigurationError:
        return Response(
            {"error": "Online payments are not configured on this server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except RazorpayGatewayError:
        return Response(
            {"error": "The payment provider could not create an order. Please try again."},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    gateway_order_id = (
        gateway_order.get("id")
        if isinstance(gateway_order, dict)
        else None
    )
    if (
        not isinstance(gateway_order_id, str)
        or not gateway_order_id.startswith("order_")
        or not gateway_order_id[6:].isalnum()
    ):
        return Response(
            {"error": "The payment provider returned an invalid order."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    with transaction.atomic():
        cart = list(
            Cart.objects.select_for_update()
            .select_related("product")
            .filter(user=request.user)
        )
        if not cart:
            return Response(
                {"error": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        total = _cart_total(cart)
        current_cart_signature = [
            (item.pk, item.product_id, item.quantity)
            for item in cart
        ]
        if (
            amount_paise != int(total * 100)
            or current_cart_signature != cart_signature
        ):
            return Response(
                {"error": "Your cart changed. Please retry checkout."},
                status=status.HTTP_409_CONFLICT,
            )
        order = _create_order(
            request.user,
            checkout.validated_data,
            cart,
            total,
            Order.PaymentMethod.RAZORPAY,
            gateway_order_id=gateway_order_id,
        )

    return Response(
        {
            "order_id": order.id,
            "razorpay_order_id": gateway_order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": settings.RAZORPAY_KEY_ID,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_razorpay_payment(request):
    order = get_object_or_404(
        Order,
        id=request.data.get("order_id"),
        user=request.user,
        payment_method=Order.PaymentMethod.RAZORPAY,
    )
    if order.payment_status == Order.PaymentStatus.PAID:
        return Response({"message": "Payment already verified", "order_id": order.id})

    payment_id = request.data.get("razorpay_payment_id", "")
    gateway_order_id = request.data.get("razorpay_order_id", "")
    signature = request.data.get("razorpay_signature", "")
    if (
        not isinstance(payment_id, str)
        or not payment_id.startswith("pay_")
        or not payment_id[4:].isalnum()
        or not isinstance(signature, str)
        or not isinstance(gateway_order_id, str)
        or gateway_order_id != order.razorpay_order_id
        or not settings.RAZORPAY_KEY_SECRET
    ):
        return Response(
            {"error": "Payment verification details are invalid."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        f"{gateway_order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected_signature, signature):
        return Response(
            {"error": "Payment signature verification failed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        payment = _razorpay_request(f"payments/{payment_id}")
        expected_amount = int(order.total_price * 100)
        if (
            payment.get("order_id") != gateway_order_id
            or payment.get("amount") != expected_amount
            or payment.get("currency") != "INR"
        ):
            return Response(
                {"error": "Payment details do not match this order."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if payment.get("status") == "authorized":
            payment = _razorpay_request(
                f"payments/{payment_id}/capture",
                {"amount": expected_amount, "currency": "INR"},
            )
        if payment.get("status") != "captured":
            return Response(
                {"error": "Payment has not been captured."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except RazorpayConfigurationError:
        return Response(
            {"error": "Online payments are not configured on this server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except RazorpayGatewayError:
        return Response(
            {"error": "The payment provider could not verify this payment."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    _mark_order_paid(order.pk, payment_id, user=request.user)

    return Response({"message": "Payment verified", "order_id": order.id})


@api_view(["POST"])
@permission_classes([AllowAny])
def razorpay_webhook(request):
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    signature = request.headers.get("X-Razorpay-Signature", "")
    if not webhook_secret:
        return Response(
            {"error": "Payment webhooks are not configured on this server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        request.body,
        hashlib.sha256,
    ).hexdigest()
    if not signature or not hmac.compare_digest(expected_signature, signature):
        return Response(
            {"error": "Webhook signature verification failed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        event = json.loads(request.body)
    except json.JSONDecodeError:
        return Response(
            {"error": "Webhook payload is invalid."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(event, dict):
        return Response(
            {"error": "Webhook payload is invalid."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if event.get("event") not in {"payment.captured", "order.paid"}:
        return Response({"message": "Event ignored"})

    payload = event.get("payload")
    payment_payload = payload.get("payment") if isinstance(payload, dict) else None
    payment = (
        payment_payload.get("entity")
        if isinstance(payment_payload, dict)
        else None
    )
    if not isinstance(payment, dict):
        return Response({"message": "Payment data not present"})
    if payment.get("status") != "captured":
        return Response({"message": "Payment is not captured"})
    try:
        order = Order.objects.get(
            razorpay_order_id=payment.get("order_id"),
            payment_method=Order.PaymentMethod.RAZORPAY,
        )
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if (
        payment.get("amount") != int(order.total_price * 100)
        or payment.get("currency") != "INR"
        or not isinstance(payment.get("id"), str)
        or not payment["id"].startswith("pay_")
        or not payment["id"][4:].isalnum()
    ):
        return Response(
            {"error": "Payment details do not match this order."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    _mark_order_paid(order.pk, payment["id"])
    return Response({"message": "Payment recorded"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_orders(request):
    orders = (
        Order.objects.filter(user=request.user)
        .prefetch_related("orderitem_set__product")
        .order_by("-created_at")
    )
    return Response(OrderSerializer(orders, many=True).data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_analytics(request):
    today = timezone.localdate()
    start_date = today - timedelta(days=6)
    daily_sales = (
        Order.objects.filter(
            created_at__date__gte=start_date,
            payment_status=Order.PaymentStatus.PAID,
        )
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(total=Sum("total_price"))
        .order_by("day")
    )
    sales_by_day = {item["day"].isoformat(): item["total"] for item in daily_sales}
    recent_orders = (
        Order.objects.select_related("user")
        .prefetch_related("orderitem_set__product")
        .order_by("-created_at")[:10]
    )
    customers = User.objects.filter(is_staff=False, is_superuser=False).order_by(
        "-date_joined"
    )[:10]
    paid_orders = Q(orderitem__order__payment_status=Order.PaymentStatus.PAID)
    products = Product.objects.annotate(
        units_sold=Sum("orderitem__quantity", filter=paid_orders),
        order_count=Count(
            "orderitem__order_id",
            filter=paid_orders,
            distinct=True,
        ),
    ).order_by("-units_sold", "name")
    paid_revenue = (
        Order.objects.filter(payment_status=Order.PaymentStatus.PAID)
        .aggregate(total=Sum("total_price"))["total"]
        or Decimal("0.00")
    )
    pending_revenue = (
        Order.objects.filter(
            payment_method=Order.PaymentMethod.CASH_ON_DELIVERY,
            payment_status=Order.PaymentStatus.PENDING,
        )
        .exclude(status=Order.Status.CANCELLED)
        .aggregate(total=Sum("total_price"))["total"]
        or Decimal("0.00")
    )

    return Response(
        {
            "summary": {
                "customers": User.objects.filter(
                    is_staff=False, is_superuser=False
                ).count(),
                "products": Product.objects.count(),
                "orders": Order.objects.count(),
                "paid_revenue": paid_revenue,
                "pending_cod_revenue": pending_revenue,
            },
            "sales_by_day": [
                {
                    "date": (start_date + timedelta(days=offset)).isoformat(),
                    "total": sales_by_day.get(
                        (start_date + timedelta(days=offset)).isoformat(),
                        Decimal("0.00"),
                    ),
                }
                for offset in range(7)
            ],
            "orders": OrderSerializer(recent_orders, many=True).data,
            "customers": [
                {
                    "id": customer.id,
                    "username": customer.username,
                    "email": customer.email,
                    "joined_at": customer.date_joined,
                }
                for customer in customers
            ],
            "products": [
                {
                    "id": product.id,
                    "name": product.name,
                    "category": product.category,
                    "price": product.price,
                    "units_sold": product.units_sold or 0,
                    "order_count": product.order_count or 0,
                }
                for product in products
            ],
        }
    )


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def update_order_status(request, pk):
    order = get_object_or_404(Order, pk=pk)
    new_status = request.data.get("status")
    valid_statuses = {choice[0] for choice in Order.Status.choices}
    if not isinstance(new_status, str) or new_status not in valid_statuses:
        return Response(
            {"error": "Invalid order status."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    order.status = new_status
    update_fields = ["status"]
    if (
        new_status == Order.Status.DELIVERED
        and order.payment_method == Order.PaymentMethod.CASH_ON_DELIVERY
    ):
        order.payment_status = Order.PaymentStatus.PAID
        update_fields.append("payment_status")
    order.save(update_fields=update_fields)
    return Response({"id": order.id, "status": order.status})









