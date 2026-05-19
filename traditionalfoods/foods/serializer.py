from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, Cart, Wishlist, Order, OrderItem,Contact


#  REGISTER SERIALIZER
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

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
    class Meta:
        model = OrderItem
        fields = ["product", "quantity"]


# 🧾 ORDER SERIALIZER
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ["id", "address", "phone", "total_price", "items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        user = self.context["request"].user

        # ✅ CREATE ORDER
        order = Order.objects.create(user=user, **validated_data)

        # ✅ CREATE ORDER ITEMS
        for item in items_data:
            OrderItem.objects.create(
                order=order,
                product=item["product"],   # 🔥 FIX (no extra query)
                quantity=item["quantity"]
            )

        return order
    

