from rest_framework import authentication, exceptions
from rest_framework_simplejwt.backends import TokenBackend
from django.conf import settings
from types import SimpleNamespace

class RemoteUser(SimpleNamespace):
    def __init__(self, payload):
        super().__init__(
            id=payload.get(settings.SIMPLE_JWT.get('USER_ID_CLAIM', 'user_id')),
            username=payload.get('username') or payload.get('email') or '',
            role=payload.get('role'),
            permissions=payload.get('permissions') or [],
            is_authenticated=True,
            is_active=payload.get('is_active', True),
            is_staff=payload.get('is_staff', False),
            is_superuser=payload.get('is_superuser', False),
        )

    def has_perm(self, perm):
        return perm in (self.permissions or [])


class JWTAuthenticationNoDB(authentication.BaseAuthentication):
    """
    Validate JWT signature via TokenBackend and return (RemoteUser, validated_token)
    so request.user and request.auth are both available.
    """
    def authenticate(self, request):
        header = authentication.get_authorization_header(request).split()
        if not header:
            return None

        if header[0].lower() != b'bearer':
            return None

        if len(header) == 1:
            raise exceptions.AuthenticationFailed('Invalid Authorization header. No credentials provided.')
        if len(header) > 2:
            raise exceptions.AuthenticationFailed('Invalid Authorization header. Token string should not contain spaces.')

        token = header[1].decode('utf-8')
        try:
            token_backend = TokenBackend(
                algorithm=settings.SIMPLE_JWT.get('ALGORITHM', 'HS256'),
                signing_key=settings.SIMPLE_JWT.get('SIGNING_KEY')
            )
            validated_token = token_backend.decode(token, verify=True)
        except Exception as e:
            raise exceptions.AuthenticationFailed('Invalid or expired token.') from e

        user = RemoteUser(validated_token)
        return (user, validated_token)
