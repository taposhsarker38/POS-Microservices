# apps/users/views_misc.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics

User = get_user_model()

class WhoAmIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        perms = []
        if getattr(user,'role',None):
            perms = list(user.role.permissions.values_list('code', flat=True))
        data = {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'role': user.role.name if getattr(user,'role',None) else None,
            'permissions': perms,
            'is_superuser': bool(user.is_superuser)
        }
        return Response(data)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'email required'}, status=400)

        qs = User.objects.filter(email__iexact=email)
        if qs.exists():
            user = qs.first()
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            # Use FRONTEND_URL (fallback to request host if not set)
            frontend_base = getattr(settings, "FRONTEND_URL", None)
            if not frontend_base:
                # fallback (rare) — keep original behavior
                frontend_base = f"{request.scheme}://{request.get_host()}"

            # Build frontend reset url — ensure proper path on frontend
            reset_path = f"/login/reset"  # frontend route that accepts uid & token as query params
            reset_url = f"{frontend_base.rstrip('/')}{reset_path}?uid={uid}&token={token}"

            # Send email (consider HTML email in production)
            subject = "Password reset"
            message = f"Click the link to reset your password: {reset_url}"
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)

        # Always return the same response to avoid revealing account existence
        return Response({'detail': 'If that email exists, reset link sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not uid or not token or not new_password:
            return Response({'detail':'missing fields'}, status=400)
        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except Exception:
            return Response({'detail':'invalid token/uid'}, status=400)
        if not default_token_generator.check_token(user, token):
            return Response({'detail':'invalid or expired token'}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'detail':'password updated'})

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        old = request.data.get('old_password')
        new = request.data.get('new_password')
        if not old or not new:
            return Response({'detail':'missing fields'}, status=400)
        user = request.user
        if not user.check_password(old):
            return Response({'detail':'old password mismatch'}, status=400)
        user.set_password(new)
        user.save()
        return Response({'detail':'password changed'})

class AdminCreateUserView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        role_id = request.data.get('role_id')
        if not username or not email or not password:
            return Response({'detail':'missing fields'}, status=400)
        user = User.objects.create_user(username=username, email=email, password=password)
        if role_id:
            from .models import Role
            try:
                r = Role.objects.get(pk=role_id)
                user.role = r
                user.save()
            except Role.DoesNotExist:
                pass
        return Response({'id': str(user.id), 'username': user.username, 'email': user.email}, status=201)
