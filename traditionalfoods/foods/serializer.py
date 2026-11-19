from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Product, Cart, Wishlist, Order, OrderItem, Contact


#  REGISTER SERIALIZER
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
#  CONTACT SERIALIZER 
class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = "__all__"




#  PRODUCT SERIALIZER
class ProductSerializer(serializers.ModelSerializer):
       class Meta:
        model = Product
        fields = "__all__"

     


# 🛒 CART SERIALIZER
class CartSerializer(serializers.ModelSerializer):
    product_price = serializers.ReadOnlyField(source='product.price')
    product_name = serializers.ReadOnlyField(source='product.name')
    picture = serializers.ImageField(source='product.picture', read_only=True)

    class Meta:
        model = Cart
        fields = "__all__"


# ❤️ WISHLIST SERIALIZER
class WishlistSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_price = serializers.ReadOnlyField(source='product.price')
    picture = serializers.ImageField(source='product.picture', read_only=True)
    class Meta:
        model = Wishlist
        fields = "__all__"


# 🔹 ORDER ITEM SERIALIZER (🔥 FIX)
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(read_only=True)
    product_price = serializers.ReadOnlyField(source="unit_price")

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "product_price", "quantity"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source="orderitem_set", many=True, read_only=True)
    username = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Order
        fields = [
            "id",
            "username",
            "address",
            "phone",
            "total_price",
            "payment_method",
            "payment_status",
            "status",
            "created_at",
            "items",
        ]


class CheckoutSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=1000)
    phone = serializers.CharField(max_length=30)
    payment_method = serializers.ChoiceField(choices=("cod", "razorpay"))

    def validate_address(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Delivery address is required.")
        return value

    def validate_phone(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        return value

