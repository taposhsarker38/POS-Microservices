# company-service/apps/common/authentication.py
from rest_framework import authentication, exceptions
from rest_framework_simplejwt.backends import TokenBackend
from django.conf import settings
from types import SimpleNamespace

class JWTAuthenticationNoDB(authentication.BaseAuthentication):
 

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).split()
        if not header or header[0].lower() != b'bearer':
            return None

        if len(header) == 1:
            raise exceptions.AuthenticationFailed('Invalid Authorization header. No credentials provided.')
        if len(header) > 2:
            raise exceptions.AuthenticationFailed('Invalid Authorization header. Token string should not contain spaces.')

        token = header[1].decode('utf-8')
        try:
            token_backend = TokenBackend(algorithm=settings.SIMPLE_JWT.get('ALGORITHM', 'HS256'),
                                         signing_key=settings.SIMPLE_JWT.get('SIGNING_KEY'))
            validated_token = token_backend.decode(token, verify=True)
        except Exception as e:
            raise exceptions.AuthenticationFailed('Invalid or expired token.') from e

        # pick user fields from token payload
        user_id = validated_token.get(settings.SIMPLE_JWT.get('USER_ID_CLAIM', 'user_id'))
        username = validated_token.get('username')
        role = validated_token.get('role')

        # Make a lightweight user object
        user = SimpleNamespace(
            is_authenticated=True,
            id=user_id,
            username=username,
            role=role
        )

        # return token as second element per DRF bridge (can be raw string)
        return (user, token)
