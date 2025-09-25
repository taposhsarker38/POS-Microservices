from django.urls import path, include
from rest_framework import routers
from .views import PermissionViewSet, RoleViewSet, AuditCreateView, CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView, MeView, RegisterView, VerifyEmailView, MakeServiceTokenView
from .views_misc import WhoAmIView, PasswordResetRequestView, PasswordResetConfirmView, ChangePasswordView, AdminCreateUserView

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
    path('whoami/', WhoAmIView.as_view(), name='whoami'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('admin/create-user/', AdminCreateUserView.as_view(), name='admin_create_user'),
]
