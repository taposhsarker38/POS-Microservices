from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import requests
from .models import InventoryAlert, Stock, NotificationPreference
from django.utils import timezone

@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_notification_task(self, payload):
    try:
        stock_id = payload.get('stock_id')
        stock = Stock.objects.select_related('product').get(id=stock_id)
    except Stock.DoesNotExist:
        return
    company_id = stock.company_id
    pref = NotificationPreference.objects.filter(company_id=company_id).first()
    subject = f"[Alert] Low stock: {payload.get('product_name') or payload.get('product_id')}"
    body = (
        f"Product: {payload.get('product_name')} ({payload.get('product_sku')})\n"
        f"Available: {payload.get('available')}\n"
        f"Threshold: {payload.get('threshold')}\n"
        f"Company: {payload.get('company_id')}\n"
        f"Wing: {payload.get('wing_id')}\n"
        f"Stock ID: {payload.get('stock_id')}\n"
        f"Time: {payload.get('timestamp')}\n"
    )
    sent_any = False
    if pref is None or pref.channel_email:
        to_emails = (pref.emails if pref and pref.emails else [settings.DEFAULT_NOTIFICATION_EMAIL])
        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, to_emails, fail_silently=False)
            sent_any = True
        except Exception as exc:
            # retry on email failure
            raise self.retry(exc=exc)
    if pref and pref.channel_webhook and pref.webhook_url:
        try:
            r = requests.post(pref.webhook_url, json=payload, timeout=5)
            r.raise_for_status()
            sent_any = True
        except Exception as exc:
            # log, but do not fail the whole task
            print('Webhook send failed:', exc)
    try:
        alert = InventoryAlert.objects.get(id=payload.get('alert_id'))
        alert.sent = sent_any
        alert.sent_at = timezone.now()
        alert.save(update_fields=['sent','sent_at'])
    except Exception:
        pass
    return sent_any
