# auth_service/common/middleware.py
import uuid
import threading

_thread_locals = threading.local()

def get_current_request():
    return getattr(_thread_locals, "request", None)

def get_correlation_id():
    req = get_current_request()
    return getattr(req, "correlation_id", None) if req is not None else None

class CorrelationIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        cid = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request.correlation_id = cid
        request.company_id = request.headers.get("X-Company-ID") or None

        _thread_locals.request = request
        try:
            response = self.get_response(request)
            if hasattr(response, "headers"):
                response.headers["X-Correlation-ID"] = cid
            else:
                response["X-Correlation-ID"] = cid
            return response
        finally:
            _thread_locals.request = None
