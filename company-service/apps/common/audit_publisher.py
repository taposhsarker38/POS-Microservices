
import json
import logging
import os
from django.conf import settings

logger = logging.getLogger(__name__)

try:
    from apps.common.tasks import send_audit_event_task
    CELERY_AVAILABLE = True
except Exception:
    send_audit_event_task = None
    CELERY_AVAILABLE = False

LOCAL_FALLBACK_FILE = os.getenv('AUDIT_LOCAL_FALLBACK', '/tmp/audit_events_failed.log')
SERVICE_NAME = getattr(settings, "SERVICE_NAME", "unknown-service")

def publish_audit_event(action, target_type, target_id=None, before=None, after=None, extra=None, request=None, raw_event=None):
    try:
        if raw_event is not None:
            event = raw_event
        else:
            req = request
            actor = {}
            if getattr(req, 'user', None) and getattr(req.user, 'is_authenticated', False):
                try:
                    actor = {
                        "id": str(getattr(req.user, 'id', None)),
                        "username": getattr(req.user, 'username', None),
                        "role": getattr(getattr(req.user, 'role', None), 'name', None)
                    }
                except Exception:
                    actor = {"id": None, "username": None, "role": None}
            else:
                actor = {"id": None, "username": None, "role": None}

            event = {
                "id": str(getattr(req, "correlation_id", None) or None) or str(getattr(req, 'correlation_id', None) or __import__('uuid').uuid4()),
                "timestamp": __import__('time').strftime("%Y-%m-%dT%H:%M:%SZ", __import__('time').gmtime()),
                "service": SERVICE_NAME,
                "correlation_id": getattr(req, "correlation_id", None),
                "actor": actor,
                "company_id": getattr(req, "company_id", None) if req is not None else None,
                "action": action,
                "target": {"type": target_type, "id": str(target_id) if target_id is not None else None},
                "before": before or {},
                "after": after or {},
                "meta": extra or {},
                "request": {
                    "path": getattr(req, "path", None) if req is not None else None,
                    "ip": (req.META.get("HTTP_X_FORWARDED_FOR") or req.META.get("REMOTE_ADDR")) if req is not None else None,
                    "user_agent": (req.META.get("HTTP_USER_AGENT") if req is not None else None)
                }
            }

        if CELERY_AVAILABLE and send_audit_event_task is not None:
            try:

                send_audit_event_task.apply_async(args=[event], countdown=0)
                logger.debug("Audit enqueued to celery: %s", event.get('action'))
                return True
            except Exception as e:
                logger.exception("Failed to enqueue audit event to celery, will fallback: %s", e)
        try:
            with open(LOCAL_FALLBACK_FILE, 'a') as f:
                f.write(json.dumps(event, default=str) + "\n")
            logger.warning("Audit event persisted locally to %s", LOCAL_FALLBACK_FILE)
            return True
        except Exception as e:
            logger.exception("Failed to persist audit event locally: %s", e)
            return False

    except Exception as e:
        logger.exception("Unhandled exception in publish_audit_event: %s", e)
        return False
