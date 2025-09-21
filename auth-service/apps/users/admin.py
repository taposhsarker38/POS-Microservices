from django.contrib import admin
from .models import Permission, Role, AuditLog, User
admin.site.register(Permission)
admin.site.register(Role)
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('service','action','actor_username','resource_type','resource_id','created_at')
    search_fields = ('actor_username','service','action','resource_id')
