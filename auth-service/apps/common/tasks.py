import json, os, logging, requests
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)
AUTH_AUDIT_URL = os.getenv('AUTH_SERVICE_AUDIT_URL','http://auth-web:8001/api/v1/audit/')
SERVICE_API_TOKEN = os.getenv('SERVICE_API_TOKEN','')

@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def send_audit_event_task(self, event):
    headers = {"Authorization": f"Bearer {SERVICE_API_TOKEN}", "Content-Type": "application/json"}
    try:
        r = requests.post(AUTH_AUDIT_URL, json=event, headers=headers, timeout=10)
        r.raise_for_status()
        logger.info("Audit posted: %s", event.get('action'))
        return True
    except requests.RequestException as exc:
        logger.exception("Audit post failed, retrying...")
        try:
            raise self.retry(exc=exc)
        except Exception:
            q = os.getenv('AUDIT_LOCAL_QUEUE','/tmp/audit_events_failed.log')
            with open(q,'a') as f:
                f.write(json.dumps(event) + "\n")
            logger.error("Persisted failed audit to %s", q)
        return False
