from django.urls import path, include
from rest_framework import routers
from .views import PermissionViewSet, RoleViewSet, AuditCreateView, CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView, MeView, RegisterView, VerifyEmailView, MakeServiceTokenView

router = routers.DefaultRouter()
router.register(r'permissions', PermissionViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('audit/', AuditCreateView.as_view(), name='audit-create'),
    path('token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('make-service-token/', MakeServiceTokenView.as_view(), name='make_service_token'),
]
