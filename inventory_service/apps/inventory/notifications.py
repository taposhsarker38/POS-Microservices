from datetime import timedelta
from django.utils import timezone
from .models import InventoryAlert, Stock
from .utils import publish_audit
from .tasks import send_notification_task

ALERT_COOLDOWN = timedelta(hours=6)

def check_and_notify_low_stock(stock: Stock):
    available = (stock.qty or 0) - (stock.reserved or 0)
    threshold = int(stock.reorder_level or 0)
    if threshold <= 0:
        return False
    now = timezone.now()
    if available > threshold:
        # optionally clear last_alerted_at when restocked
        return False
    if stock.last_alerted_at and (now - stock.last_alerted_at) < ALERT_COOLDOWN:
        return False
    alert = InventoryAlert.objects.create(stock=stock, threshold=threshold, available=available)
    stock.last_alerted_at = now
    stock.save(update_fields=['last_alerted_at'])
    payload = {
        'stock_id': str(stock.id),
        'product_id': str(stock.product_id),
        'product_sku': getattr(stock.product, 'sku', None),
        'product_name': getattr(stock.product, 'name', None),
        'company_id': str(stock.company_id) if stock.company_id else None,
        'wing_id': str(stock.wing_id) if stock.wing_id else None,
        'available': available,
        'threshold': threshold,
        'alert_id': str(alert.id),
        'timestamp': now.isoformat()
    }
    publish_audit({
        'actor_id': None,
        'actor_username': None,
        'service': 'inventory-service',
        'action': 'stock.low_alert_created',
        'resource_type': 'stock',
        'resource_id': str(stock.id),
        'details': payload,
        'ip_address': None
    })
    # enqueue send task
    try:
        send_notification_task.delay(payload)
    except Exception:
        pass
    return True
