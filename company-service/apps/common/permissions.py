# company-service/apps/common/permissions.py
from rest_framework.permissions import BasePermission

class HasPermission(BasePermission):
    def has_permission(self, request, view):
        required = getattr(view, 'required_permission', None)
        if not required:
            return True
        token = getattr(request, 'auth', None)
        # For SimpleJWT, request.auth behaves like a dict-like token, try to read permissions
        perms = None
        try:
            # token may be an instance with .payload or mapping
            if hasattr(token, 'get'):
                perms = token.get('permissions')
            elif hasattr(token, 'payload'):
                perms = token.payload.get('permissions')
        except Exception:
            perms = None
        if perms and required in perms:
            return True
        return False
