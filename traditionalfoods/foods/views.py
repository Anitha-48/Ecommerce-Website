from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from .serializer import RegisterSerializer
from .models import Cart, Wishlist ,  Contact
from .serializer import CartSerializer, WishlistSerializer
from .serializer import OrderSerializer  ,ContactSerializer
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404




#  JWT TOKENs
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

### Conctatct 

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
    data = request.data
    product_id = data.get("product")
    
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
    item = Cart.objects.get(id=pk, user=request.user)
    item.quantity = request.data.get("quantity")
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
    product_id = request.data.get("product")

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
    item = Wishlist.objects.get(id=pk, user=request.user)
    item.delete()
    return Response({"message": "Removed"})



###    PLACE ORDER


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_order(request):
    serializer = OrderSerializer(
        data=request.data,
        context={"request": request}   # 🔥 IMPORTANT
    )

    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Order placed successfully"})

    return Response(serializer.errors, status=400)









