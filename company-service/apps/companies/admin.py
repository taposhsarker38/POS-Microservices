from django.contrib import admin
from .models import Company, Wing, Currency, InvoiceSettings, Employee

admin.site.register(Company)
admin.site.register(Wing)
@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "symbol", "exchange_rate", "is_base")
    list_filter = ("is_base",)
    search_fields = ("code", "name")


@admin.register(InvoiceSettings)
class InvoiceSettingsAdmin(admin.ModelAdmin):
    list_display = ("company", "invoice_prefix", "next_invoice_number", "sequence_name", "default_currency")
    readonly_fields = ("created_at", "updated_at", "sequence_name")


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_code", "first_name", "last_name", "company", "role", "is_active")
    search_fields = ("employee_code", "first_name", "last_name", "email")