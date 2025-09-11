from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ('username','email','first_name','last_name','company_id','role','email_verified','is_active')
    list_filter = ('role','email_verified','is_active')
