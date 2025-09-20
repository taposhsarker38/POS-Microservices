def token_has_permission(request, perm_code):
    token = getattr(request, 'auth', None)
    if isinstance(token, dict):
        perms = token.get('permissions') or []
        if perm_code in perms:
            return True
    user = getattr(request, 'user', None)
    if user:
        perms = getattr(user, 'permissions', None)
        if isinstance(perms, (list, tuple)):
            return perm_code in perms
    return False
