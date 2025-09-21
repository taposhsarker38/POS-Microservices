from django.urls import path, include
from rest_framework import routers
from .views import CategoryViewSet, ProductViewSet, StockViewSet, InventoryChangeRequestViewSet

router = routers.DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'stock', StockViewSet, basename='stock')
router.register(r'icr', InventoryChangeRequestViewSet, basename='inventory-change-request')

urlpatterns = [path('', include(router.urls))]
