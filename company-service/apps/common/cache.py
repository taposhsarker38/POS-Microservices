import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

try:
    import redis
    _redis = redis.StrictRedis.from_url(getattr(settings, "REDIS_URL", "redis://redis:6379/0"))
except Exception as e:
    logger.warning("Redis not available: %s", e)
    _redis = None


def get_company_settings_cached(company_id):
    if not _redis:
        return None
    key = f"company:settings:{company_id}"
    try:
        raw = _redis.get(key)
        if not raw:
            return None
        if isinstance(raw, (bytes, bytearray)):
            raw = raw.decode("utf-8")
        return json.loads(raw)
    except Exception as e:
        logger.exception("Error reading company settings from cache: %s", e)
        return None


def set_company_settings_cached(company_id, payload, ttl=300):
    if not _redis:
        return
    key = f"company:settings:{company_id}"
    try:
        raw = json.dumps(payload, default=str)
        _redis.setex(key, ttl, raw)
    except Exception as e:
        logger.exception("Error setting company settings to cache: %s", e)
