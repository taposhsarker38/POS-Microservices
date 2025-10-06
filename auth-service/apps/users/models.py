import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
class Permission(models.Model):
    code = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.code

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name='roles', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name
    def permission_codes(self):
        if getattr(self, 'role', None):
            return list(self.role.permissions.values_list('code', flat=True))
        return []

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    company_id = models.UUIDField(blank=True, null=True)
    wing_id = models.UUIDField(blank=True, null=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    email_verified = models.BooleanField(default=False)

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor_id = models.UUIDField(blank=True, null=True)
    actor_username = models.CharField(max_length=150, blank=True, null=True)
    service = models.CharField(max_length=100)
    action = models.CharField(max_length=200)
    resource_type = models.CharField(max_length=100, blank=True, null=True)
    resource_id = models.CharField(max_length=255, blank=True, null=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']
class UserPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='preference')
    accent = models.CharField(max_length=32, default='#6366F1')   # hex or css name
    dark_mode = models.BooleanField(default=False)
    collapsed_sidebar = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user}'s prefs"