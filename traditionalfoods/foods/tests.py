import json
import hashlib
import hmac
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Cart, Order, OrderItem, Product


class CheckoutApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="buyer", password="safe-pass-123")
        self.product = Product.objects.create(
            name="Millet snack",
            category="Snacks",
            price=Decimal("120.00"),
            picture="pictures/millet.png",
        )
        self.cart_item = Cart.objects.create(
            user=self.user,
            product=self.product,
            quantity=2,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.checkout_data = {
            "address": "12 Market Road, Chennai",
            "phone": "+91 98765 43210",
        }

    def test_cod_order_uses_cart_prices_and_clears_purchased_quantities(self):
        response = self.client.post(
            "/order/",
            {
                **self.checkout_data,
                "payment_method": "cod",
                "total_price": "1.00",
                "items": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        order = Order.objects.get(pk=response.data["order_id"])
        self.assertEqual(order.total_price, Decimal("280.00"))
        self.assertEqual(order.payment_method, Order.PaymentMethod.CASH_ON_DELIVERY)
        self.assertEqual(order.payment_status, Order.PaymentStatus.PENDING)
        order_item = OrderItem.objects.get(order=order)
        self.assertEqual(order_item.quantity, 2)
        self.assertEqual(order_item.product_name, "Millet snack")
        self.assertEqual(order_item.unit_price, Decimal("120.00"))
        self.assertFalse(Cart.objects.filter(user=self.user).exists())

        self.product.price = Decimal("999.00")
        self.product.save(update_fields=["price"])
        order_response = self.client.get("/my-orders/")
        self.assertEqual(
            order_response.data[0]["items"][0]["product_price"],
            Decimal("120.00"),
        )

    def test_checkout_requires_a_nonempty_cart(self):
        self.cart_item.delete()

        response = self.client.post(
            "/order/",
            {**self.checkout_data, "payment_method": "cod"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    @override_settings(
        RAZORPAY_KEY_ID="rzp_test_id",
        RAZORPAY_KEY_SECRET="test-secret",
    )
    @patch("foods.views._razorpay_request")
    def test_razorpay_payment_is_verified_before_cart_is_cleared(self, gateway_request):
        gateway_request.side_effect = [
            {"id": "order_gateway1"},
            {
                "id": "pay_gateway1",
                "order_id": "order_gateway1",
                "amount": 28000,
                "currency": "INR",
                "status": "captured",
            },
        ]
        created = self.client.post(
            "/order/",
            {**self.checkout_data, "payment_method": "razorpay"},
            format="json",
        )

        self.assertEqual(created.status_code, 201)
        order = Order.objects.get(pk=created.data["order_id"])
        self.assertTrue(Cart.objects.filter(pk=self.cart_item.pk).exists())

        payment_id = "pay_gateway1"
        signature = hmac.new(
            b"test-secret",
            f"order_gateway1|{payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        verified = self.client.post(
            "/payments/razorpay/verify/",
            {
                "order_id": order.id,
                "razorpay_order_id": "order_gateway1",
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature,
            },
            format="json",
        )

        self.assertEqual(verified.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PaymentStatus.PAID)
        self.assertEqual(order.status, Order.Status.CONFIRMED)
        self.assertEqual(order.razorpay_payment_id, payment_id)
        self.assertFalse(Cart.objects.filter(user=self.user).exists())

    @override_settings(
        RAZORPAY_KEY_ID="rzp_test_id",
        RAZORPAY_KEY_SECRET="test-secret",
    )
    @patch("foods.views._razorpay_request")
    def test_invalid_razorpay_signature_does_not_mark_order_paid(self, gateway_request):
        gateway_request.return_value = {"id": "order_gateway1"}
        created = self.client.post(
            "/order/",
            {**self.checkout_data, "payment_method": "razorpay"},
            format="json",
        )
        order = Order.objects.get(pk=created.data["order_id"])

        response = self.client.post(
            "/payments/razorpay/verify/",
            {
                "order_id": order.id,
                "razorpay_order_id": order.razorpay_order_id,
                "razorpay_payment_id": "pay_gateway1",
                "razorpay_signature": "invalid",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PaymentStatus.PENDING)
        self.assertEqual(gateway_request.call_count, 1)

    @override_settings(RAZORPAY_WEBHOOK_SECRET="webhook-secret")
    def test_signed_payment_webhook_records_payment_idempotently(self):
        order = Order.objects.create(
            user=self.user,
            address=self.checkout_data["address"],
            phone=self.checkout_data["phone"],
            total_price=Decimal("280.00"),
            payment_method=Order.PaymentMethod.RAZORPAY,
            razorpay_order_id="order_gateway1",
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            product_name=self.product.name,
            unit_price=self.product.price,
            quantity=2,
        )
        payload = json.dumps({
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_gateway1",
                        "order_id": "order_gateway1",
                        "amount": 28000,
                        "currency": "INR",
                        "status": "captured",
                    }
                }
            },
        })
        signature = hmac.new(
            b"webhook-secret",
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()

        response = self.client.post(
            "/payments/razorpay/webhook/",
            payload,
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE=signature,
        )
        duplicate = self.client.post(
            "/payments/razorpay/webhook/",
            payload,
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(duplicate.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PaymentStatus.PAID)
        self.assertFalse(Cart.objects.filter(user=self.user).exists())


class AdminAnalyticsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username="customer",
            email="customer@example.com",
            password="safe-pass-123",
        )
        self.staff = User.objects.create_user(
            username="staff",
            password="safe-pass-123",
            is_staff=True,
        )

    def test_analytics_are_staff_only_and_include_store_metrics(self):
        self.client.force_authenticate(self.customer)
        forbidden = self.client.get("/admin-api/analytics/")
        self.assertEqual(forbidden.status_code, 403)

        self.client.force_authenticate(self.staff)
        response = self.client.get("/admin-api/analytics/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["customers"], 1)
        self.assertEqual(response.data["summary"]["products"], 0)
        self.assertEqual(response.data["summary"]["orders"], 0)
        self.assertEqual(response.data["customers"][0]["email"], "customer@example.com")
        self.assertEqual(len(response.data["sales_by_day"]), 7)
