from rest_framework import routers
from .views import CompanyViewSet, WingViewSet
from django.urls import path, include

router = routers.DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'wings', WingViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
