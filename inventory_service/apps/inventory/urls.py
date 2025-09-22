from django.urls import path, include
from rest_framework import routers
from .views import CategoryViewSet, ProductViewSet, StockViewSet, InventoryChangeRequestViewSet, SupplierViewSet, ProductSupplierViewSet, PurchaseOrderViewSet, PurchaseReceiptViewSet, StockLedgerView, BillOfMaterialViewSet, ProductionOrderViewSet

router = routers.DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'stock', StockViewSet, basename='stock')
router.register(r'icr', InventoryChangeRequestViewSet, basename='inventory-change-request')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'product-suppliers', ProductSupplierViewSet, basename='product-supplier')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'purchase-receipts', PurchaseReceiptViewSet, basename='purchase-receipt')
router.register(r'boms', BillOfMaterialViewSet, basename='bom')
router.register(r'production-orders', ProductionOrderViewSet, basename='production-order')

# and add ledger path:


urlpatterns = [
    path('', include(router.urls)),
    path('api/v1/stock/ledger/', StockLedgerView.as_view(), name='stock-ledger')
]

