import uuid, threading
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
