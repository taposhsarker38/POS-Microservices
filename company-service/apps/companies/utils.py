# company-service utils.py
import os, requests

AUTH_AUDIT_URL = os.getenv('AUTH_SERVICE_AUDIT_URL', 'http://auth-service:8000/api/v1/audit/')
SERVICE_API_TOKEN = os.getenv('SERVICE_API_TOKEN')

def send_audit(actor_id, actor_username, service, action, resource_type, resource_id, details=None, ip=None):
    payload = {
        "actor_id": actor_id, "actor_username": actor_username,
        "service": service, "action": action,
        "resource_type": resource_type, "resource_id": resource_id,
        "details": details or {}, "ip_address": ip
    }
    headers = {"Authorization": f"Bearer {SERVICE_API_TOKEN}", "Content-Type": "application/json"}
    try:
        r = requests.post(AUTH_AUDIT_URL, json=payload, headers=headers, timeout=3)
        r.raise_for_status()
    except Exception as e:
        # log locally; don't break main transaction
        print("Audit send failed:", e)
