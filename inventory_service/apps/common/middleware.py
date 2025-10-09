import uuid, threading
import typing
from urllib.parse import parse_qs
from rest_framework_simplejwt.backends import TokenBackend
from django.conf import settings
from types import SimpleNamespace
from channels.middleware import BaseMiddleware
_thread_locals = threading.local()
def get_current_request(): return getattr(_thread_locals, "request", None)
def get_correlation_id():
    req = get_current_request(); return getattr(req, "correlation_id", None)

class CorrelationIdMiddleware:
    def __init__(self, get_response): self.get_response = get_response
    def __call__(self, request):
        cid = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request.correlation_id = cid
        _thread_locals.request = request
        try:
            response = self.get_response(request)
            response["X-Correlation-ID"] = cid
            return response
        finally:
            _thread_locals.request = None
class AuditContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request):
        user = getattr(request,'user',None)
        actor = None
        if user and getattr(user,'is_authenticated',False):
            actor = {'id': str(getattr(user,'id',None)), 'username': getattr(user,'username',None)}
        request.audit_actor = actor
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        request.audit_ip = (xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR'))
        return self.get_response(request)


class JwtAuthMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):
        # extract token from query string first
        query = scope.get('query_string', b'').decode()
        qs = parse_qs(query)
        token = None
        if 'token' in qs:
            token = qs.get('token')[0]
        else:
            # try cookies
            headers = dict(scope.get('headers') or [])
            # headers keys are bytes; build cookies if present
            for name, val in scope.get('headers', []):
                if name == b'cookie':
                    cookies = val.decode()
                    # naive parsing, for production use http.cookies
                    for part in cookies.split(';'):
                        k,v = part.strip().split('=',1)
                        if k == 'refresh_token' or k == 'access_token':
                            token = v

        if token:
            try:
                token_backend = TokenBackend(
                    algorithm=settings.SIMPLE_JWT.get('ALGORITHM','HS256'),
                    signing_key=settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY)
                )
                validated = token_backend.decode(token, verify=True)
                user = SimpleNamespace(
                    is_authenticated=True,
                    id=validated.get(settings.SIMPLE_JWT.get('USER_ID_CLAIM','user_id')),
                    username=validated.get('username'),
                    role=validated.get('role'),
                    permissions=validated.get('permissions', [])
                )
                scope['user'] = user
                scope['auth_token'] = validated
            except Exception:
                scope['user'] = SimpleNamespace(is_authenticated=False)
        else:
            scope['user'] = SimpleNamespace(is_authenticated=False)

        return await super().__call__(scope, receive, send)