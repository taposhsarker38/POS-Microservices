from django.urls import path, include
from rest_framework import routers
from .views import CompanyViewSet, WingViewSet

router = routers.DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'wings', WingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
