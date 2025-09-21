import json, uuid, time
import pika
from django.conf import settings
from .middleware import get_current_request

RABBITMQ_URL = getattr(settings, "RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")

def _get_connection():
    params = pika.URLParameters(RABBITMQ_URL)
    return pika.BlockingConnection(params)

def publish_audit_event(action, target_type, target_id=None, before=None, after=None, extra=None, request=None):
    req = request or get_current_request()
    event = {
        "id": str(uuid.uuid4()),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "service": getattr(settings, "SERVICE_NAME", "unknown-service"),
        "correlation_id": getattr(req, "correlation_id", None),
        "actor": {
            "id": getattr(getattr(req, "user", None), "id", None),
            "username": getattr(getattr(req, "user", None), "username", None),
            "role": getattr(getattr(req, "user", None), "role", None),
        },
        "company_id": getattr(req, "company_id", None),
        "action": action,
        "target": {"type": target_type, "id": str(target_id) if target_id is not None else None},
        "before": before or {},
        "after": after or {},
        "meta": extra or {},
        "request": {
            "path": getattr(req, "path", None),
            "ip": req.META.get("HTTP_X_FORWARDED_FOR") or req.META.get("REMOTE_ADDR"),
            "user_agent": req.META.get("HTTP_USER_AGENT")
        }
    }
    body = json.dumps(event, default=str).encode("utf-8")
    conn = _get_connection()
    ch = conn.channel()
    ch.exchange_declare(exchange="audit", exchange_type="fanout", durable=True)
    ch.basic_publish(exchange="audit", routing_key="", body=body,
                     properties=pika.BasicProperties(content_type="application/json", delivery_mode=2))
    conn.close()

