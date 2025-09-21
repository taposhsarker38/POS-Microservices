import os, json, logging
logger = logging.getLogger(__name__)

try:
    from apps.common.tasks import send_audit_event_task
    CELERY = True
except Exception:
    send_audit_event_task = None
    CELERY = False

SERVICE_NAME = os.getenv('SERVICE_NAME','company-service')
AUDIT_LOCAL_QUEUE = os.getenv('AUDIT_LOCAL_QUEUE','/tmp/audit_events.log')

def build_event(action, resource_type, resource_id=None, details=None, actor=None, ip=None):
    return {
        "actor_id": actor.get('id') if actor else None,
        "actor_username": actor.get('username') if actor else None,
        "service": SERVICE_NAME,
        "action": action,
        "resource_type": resource_type,
        "resource_id": str(resource_id) if resource_id else None,
        "details": details or {},
        "ip_address": ip
    }

def publish_event(event):
    if CELERY and send_audit_event_task:
        try:
            send_audit_event_task.delay(event)
            return True
        except Exception as e:
            logger.exception("Celery publish failed, falling back: %s", e)
    try:
        with open(AUDIT_LOCAL_QUEUE, 'a') as f:
            f.write(json.dumps(event) + "\n")
        logger.warning("Audit event queued locally: %s", AUDIT_LOCAL_QUEUE)
        return True
    except Exception:
        logger.exception("Failed to persist audit event")
        return False
