from rest_framework.permissions import BasePermission

class IsOwnerOrAdmin(BasePermission):
    """
    Example: allow only owners or admins to access sensitive endpoints.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in ('owner','admin')
