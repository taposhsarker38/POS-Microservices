from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import throttle_classes
from rest_framework.throttling import AnonRateThrottle

from .serializers import RegisterSerializer, UserSerializer
from .models import User
from .utils import send_verification_email, verify_email_token

# 1) Register view — creates inactive user and sends verification email
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]  # rate-limit register attempts

    def perform_create(self, serializer):
        user = serializer.save()
        # send verification email
        request = self.request
        try:
            send_verification_email(user, request)
        except Exception as e:
            # optionally delete user if email failed; or log
            pass

    def create(self, request, *args, **kwargs):
        resp = super().create(request, *args, **kwargs)
        return Response({'detail': 'Verification email sent. Please check your inbox.'}, status=status.HTTP_201_CREATED)


# 2) Verify email endpoint
class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.GET.get('token')
        if not token:
            return Response({'detail': 'Token missing'}, status=status.HTTP_400_BAD_REQUEST)
        data = verify_email_token(token)
        if not data:
            return Response({'detail': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        user_id = data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        user.email_verified = True
        user.is_active = True
        user.save()
        return Response({'detail': 'Email verified, you can now login.'}, status=status.HTTP_200_OK)


# 3) Custom TokenObtainPairView that sets refresh token as HttpOnly cookie
class CookieTokenObtainPairView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    # throttle to avoid brute force: AnonRateThrottle will apply from settings anon rate
    def finalize_response(self, request, response, *args, **kwargs):
        # call super finalize_response after setting cookie if needed
        return super().finalize_response(request, response, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)
        # If success, resp.data has refresh and access
        if resp.status_code == 200:
            refresh_token = resp.data.get('refresh')
            access_token = resp.data.get('access')
            # set cookie
            cookie_max_age = 7 * 24 * 60 * 60  # seconds — match REFRESH_TOKEN_LIFETIME
            secure_flag = not settings.DEBUG  # secure=True in production (HTTPS)
            resp.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=True,
                secure=secure_flag,
                samesite='Lax',
                max_age=cookie_max_age
            )
            # remove refresh from body so client cannot read it (optional)
            resp.data = {'access': access_token, 'detail': 'Login successful'}
        return resp


# 4) Refresh using cookie (client posts nothing)
from rest_framework.permissions import IsAuthenticated

class CookieTokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]  # allow any because cookie used
    def post(self, request):
        refresh = request.COOKIES.get('refresh_token')
        if not refresh:
            return Response({'detail': 'Refresh token not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = RefreshToken(refresh)
        except Exception:
            return Response({'detail': 'Invalid refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)
        # Optionally rotate and set new cookie
        new_refresh = str(token)
        new_access = str(token.access_token)

        # If SIMPLE_JWT ROTATE_REFRESH_TOKENS=True, you should create new RefreshToken from token and blacklist old.
        # For simplicity we won't explicitly rotate here (but settings enable rotation). If you enable rotation,
        # consider using RefreshToken.for_user(...) pattern.

        # Set cookie again to refresh expiry
        cookie_max_age = 7 * 24 * 60 * 60
        secure_flag = not settings.DEBUG
        resp = Response({'access': new_access})
        resp.set_cookie('refresh_token', new_refresh, httponly=True, secure=secure_flag, samesite='Lax', max_age=cookie_max_age)
        return resp


# 5) Logout — delete cookie (optionally blacklist refresh)
from rest_framework.views import APIView

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        # Remove cookie
        resp = Response({'detail': 'Logged out'}, status=status.HTTP_200_OK)
        resp.delete_cookie('refresh_token')
        # Optionally blacklist the refresh token (if provided in cookie)
        refresh = request.COOKIES.get('refresh_token')
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except Exception:
                pass
        return resp


# 6) Me view unchanged (authenticated)
class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user
