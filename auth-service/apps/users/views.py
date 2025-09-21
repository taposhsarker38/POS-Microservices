from django.conf import settings
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Permission, Role, AuditLog, User
from .serializers import PermissionSerializer, RoleSerializer, AuditCreateSerializer, RegisterSerializer, UserSerializer
from django.core import signing
from django.core.mail import send_mail
from django.urls import reverse
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

EMAIL_CONFIRM_SALT = 'email-confirm-salt'
EMAIL_CONFIRM_EXP_SECONDS = 60 * 60 * 24

def generate_email_token(user):
    payload = {'user_id': str(user.id)}
    return signing.dumps(payload, salt=EMAIL_CONFIRM_SALT)

def verify_email_token(token, max_age=EMAIL_CONFIRM_EXP_SECONDS):
    try:
        return signing.loads(token, salt=EMAIL_CONFIRM_SALT, max_age=max_age)
    except Exception:
        return None

def send_verification_email(user, request):
    token = generate_email_token(user)
    verify_path = reverse('verify-email')
    verify_url = f"{request.scheme}://{request.get_host()}{verify_path}?token={token}"
    subject = "Verify your email"
    message = f"Hi {user.username},\n\nPlease verify your email: {verify_url}\n\nExpires in 24h."
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    def perform_create(self, serializer):
        user = serializer.save()
        try:
            send_verification_email(user, self.request)
        except Exception:
            pass
    def create(self, request, *args, **kwargs):
        super().create(request,*args,**kwargs)
        return Response({'detail':'Verification email sent if email valid'}, status=status.HTTP_201_CREATED)

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        token = request.GET.get('token')
        data = verify_email_token(token) if token else None
        if not data:
            return Response({'detail':'Invalid or expired token'}, status=400)
        user_id = data.get('user_id')
        try:
            u = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail':'User not found'}, status=404)
        u.email_verified = True
        u.is_active = True
        u.save()
        return Response({'detail':'Email verified'}, status=200)

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all().order_by('code')
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.prefetch_related('permissions').all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

class AuditCreateView(generics.CreateAPIView):
    serializer_class = AuditCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    def perform_create(self, serializer):
        # Only service accounts or staff allowed
        user = self.request.user
        role_name = user.role.name if getattr(user,'role',None) else None
        if not (user.is_staff or role_name == 'service_account'):
            raise PermissionDenied("Only service accounts can post audit logs")
        serializer.save()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        role = getattr(user, 'role', None)
        perms = list(role.permissions.values_list('code', flat=True)) if role else []
        token['role'] = role.name if role else None
        token['permissions'] = perms
        token['user_id'] = str(user.id)
        return token

class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    print("CookieTokenObtainPairView")

    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)
        # Set refresh in cookie (if present)
        if resp.status_code == 200 and 'refresh' in resp.data:
            refresh = resp.data['refresh']
            resp.set_cookie('refresh_token', refresh, httponly=True, secure=not settings.DEBUG, samesite='Lax')
            # keep access in body
            resp.data = {'access': resp.data.get('access')}
        return resp

class CookieTokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        refresh = request.COOKIES.get('refresh_token')
        if not refresh:
            return Response({'detail':'Refresh token not provided.'}, status=401)
        try:
            token = RefreshToken(refresh)
        except Exception:
            return Response({'detail':'Invalid refresh token.'}, status=401)
        new_access = str(token.access_token)
        cookie_max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
        secure_flag = not settings.DEBUG
        resp = Response({'access': new_access})
        resp.set_cookie('refresh_token', str(token), httponly=True, secure=secure_flag, samesite='Lax', max_age=cookie_max_age)
        return resp

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        refresh = request.COOKIES.get('refresh_token')
        if refresh:
            try:
                rt = RefreshToken(refresh)
                rt.blacklist()
            except Exception:
                pass
        resp = Response({'detail':'Logged out'}, status=200)
        resp.delete_cookie('refresh_token')
        return resp

class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user

class MakeServiceTokenView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        if not request.user.is_staff:
            return Response({'detail':'admin only'},status=403)
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'detail':'username & password required'},status=400)
        u, created = User.objects.get_or_create(username=username, defaults={'is_active':True})
        if created:
            u.set_password(password); u.save()
        refresh = RefreshToken.for_user(u)
        return Response({'access':str(refresh.access_token),'refresh':str(refresh)} , status=201)
