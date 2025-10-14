
import json
import os
import logging
import requests
from celery import shared_task
from django.conf import settings
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)

AUTH_AUDIT_URL = os.getenv('AUTH_AUDIT_URL', getattr(settings, 'AUTH_AUDIT_URL', 'http://auth-web:8001/api/v1/audit/'))
SERVICE_API_TOKEN = os.getenv('SERVICE_API_TOKEN', getattr(settings, 'SERVICE_API_TOKEN', ''))
LOCAL_FALLBACK = os.getenv('AUDIT_LOCAL_FALLBACK', '/tmp/audit_events_failed.log')

@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def send_audit_event_task(self, event):
    headers = {"Authorization": f"Bearer {SERVICE_API_TOKEN}"} if SERVICE_API_TOKEN else {}
    headers.update({"Content-Type": "application/json"})

    try:
        logger.debug("Posting audit event to %s", AUTH_AUDIT_URL)
        r = requests.post(AUTH_AUDIT_URL, json=event, headers=headers, timeout=10)
        r.raise_for_status()
        logger.info("Audit posted successfully: %s", event.get('action'))
        return True
    except RequestException as exc:
        logger.exception("Audit post failed: %s", exc)
        try:
            raise self.retry(exc=exc)
        except Exception:
            try:
                with open(LOCAL_FALLBACK, 'a') as f:
                    f.write(json.dumps(event, default=str) + "\n")
                logger.error("Persisted failed audit to %s", LOCAL_FALLBACK)
            except Exception as e:
                logger.exception("Failed persisting audit event locally: %s", e)
        return False
