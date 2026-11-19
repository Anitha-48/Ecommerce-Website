from django.urls import path
from . import views

urlpatterns = [
    # path('', views.home, name='home'),   
    path('login/', views.login, name='login'),   
    path('register/', views.register, name='register'), 
    path('dashboard/', views.dashboard),
    path('logout/', views.logout),
    path('cart/', views.get_cart),
    path('addtocart/', views.add_to_cart),
    path('addtocartupdate/<int:pk>/',views.update_cart),
    path('addtocartdelete/<int:pk>/', views.delete_cart),
    path('wishlist/', views.get_wishlist),
    path('addwishlist/', views.add_to_wishlist),
    path('deletewishlist/<int:pk>/',views. remove_wishlist),
    path('order/',views.place_order),
    path('payments/razorpay/verify/', views.verify_razorpay_payment),
    path('payments/razorpay/webhook/', views.razorpay_webhook),
    path('my-orders/', views.get_my_orders),
    path('admin-api/analytics/', views.admin_analytics),
    path('admin-api/orders/<int:pk>/', views.update_order_status),
    path('contact/',views.contact),




     ## CRUD FOR ADMIIN
    path('all_products/',views.get_products,name='get_all_products' ),
    path('one_products/<int:pk>/',views.getone_product ,name='get_one_product'),
    path('create_products/',views.create_product,name='create_product'),
    path('update_products/<int:pk>/',views.update_product ,name='update_product'),
    path('delete_products/<int:pk>/',views.delete_product ,name='delete_product'),
]
