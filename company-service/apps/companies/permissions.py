
from rest_framework.permissions import BasePermission

class HasPermission(BasePermission):
    def has_permission(self, request, view):
        required = getattr(view, 'required_permission', None)
        if not required:
            return True
        token = getattr(request, 'auth', None)
        perms = None
        try:
            if hasattr(token, 'get'):
                perms = token.get('permissions')
            elif hasattr(token, 'payload'):
                perms = token.payload.get('permissions')
        except Exception:
            perms = None
        if perms and required in perms:
            return True
        return False
