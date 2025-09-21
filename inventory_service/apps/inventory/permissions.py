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
        return bool(perms and required in perms)

class IsRequesterOrApproverOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET','HEAD','OPTIONS'):
            return True
        token = getattr(request, 'auth', None)
        perms = None
        try:
            if hasattr(token,'get'):
                perms = token.get('permissions')
            elif hasattr(token,'payload'):
                perms = token.payload.get('permissions')
        except Exception:
            perms = None
        if perms and 'stock.approve_adjust' in perms:
            return True
        if getattr(request.user,'id',None) and str(request.user.id) == str(obj.requested_by_id):
            return True
        return False
