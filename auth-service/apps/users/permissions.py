# auth_service/users/permissions.py
from rest_framework.permissions import BasePermission

class IsOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        # superusers or staff have access
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
            return True
        # role may be FK to Role model; check role.name safely
        role = getattr(user, 'role', None)
        role_name = getattr(role, 'name', None) if role else None
        return role_name in ('owner', 'admin')

class HasRole(BasePermission):
    def has_permission(self, request, view):
        allowed = getattr(view, 'allowed_roles', None)
        if not allowed:
            return True
        user = getattr(request, 'user', None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
            return True
        role = getattr(user, 'role', None)
        role_name = getattr(role, 'name', None) if role else None
        return role_name in allowed
