from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Stock
from .notifications import check_and_notify_low_stock

@receiver(post_save, sender=Stock)
def stock_post_save(sender, instance, created, **kwargs):
    try:
        check_and_notify_low_stock(instance)
    except Exception:
        pass
