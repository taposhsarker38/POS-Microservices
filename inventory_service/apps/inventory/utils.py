import os
import redis
import json
from django.conf import settings

redis_url = os.getenv('REDIS_URL', settings.REDIS_URL if hasattr(settings,'REDIS_URL') else 'redis://redis:6379/0')
_r = redis.from_url(redis_url)

def publish_audit(payload: dict):
    channel = getattr(settings, 'AUDIT_CHANNEL', 'audit_events')
    try:
        _r.publish(channel, json.dumps(payload))
    except Exception:
        # in dev, print
        print('publish_audit failed')

def token_has_permission(request, perm_code: str) -> bool:
    token = getattr(request, 'auth', None)
    try:
        if token is None:
            return False
        if hasattr(token, 'get'):
            perms = token.get('permissions') or []
        elif hasattr(token, 'payload'):
            perms = token.payload.get('permissions') or []
        else:
            perms = []
        return perm_code in perms
    except Exception:
        return False


