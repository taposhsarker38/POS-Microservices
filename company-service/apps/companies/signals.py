from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import CompanySetting
from apps.common.cache import _redis

@receiver(post_save, sender=CompanySetting)
def company_setting_saved(sender, instance, **kwargs):
    try:
        if _redis:
            key = f"company:settings:{instance.company_id}"
            _redis.delete(key)
    except Exception:
        pass

@receiver(post_delete, sender=CompanySetting)
def company_setting_deleted(sender, instance, **kwargs):
    try:
        if _redis:
            key = f"company:settings:{instance.company_id}"
            _redis.delete(key)
    except Exception:
        pass
