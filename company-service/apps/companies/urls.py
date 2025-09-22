from django.urls import path, include
from rest_framework import routers
from .views import CompanyViewSet, WingViewSet, CurrencyViewSet, InvoiceSettingsViewSet, EmployeeViewSet, AuthWebhookAPIView

router = routers.DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'wings', WingViewSet)
router.register(r"currencies", CurrencyViewSet, basename="currency")
router.register(r"invoice-settings", InvoiceSettingsViewSet, basename="invoice-settings")
router.register(r"employees", EmployeeViewSet, basename="employee")

urlpatterns = [
    path('', include(router.urls)),
    path("api/webhooks/auth/", AuthWebhookAPIView.as_view(), name="auth-webhook"),
]
