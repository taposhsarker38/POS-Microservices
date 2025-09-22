from rest_framework import serializers
from .models import Company, Wing, Currency, InvoiceSettings, Employee

class WingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wing
        fields = ['id', 'company', 'name', 'code','pos_printer_name','pos_config','metadata', 'created_at']

class CompanySerializer(serializers.ModelSerializer):
    wings = WingSerializer(many=True, read_only=True)
    class Meta:
        model = Company
        fields = ['id','name','code','tax_number','vat_rate','accounting_codes','default_payment_terms','address','timezone','metadata','created_at','wings']


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ["id", "code", "name", "symbol", "exchange_rate", "is_base", "created_at"]
        read_only_fields = ["id", "created_at"]


class InvoiceSettingsSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    default_currency = serializers.PrimaryKeyRelatedField(queryset=Currency.objects.all(), allow_null=True, required=False)

    class Meta:
        model = InvoiceSettings
        fields = [
            "id",
            "company",
            "invoice_prefix",
            "next_invoice_number",
            "allow_negative_stock",
            "tax_inclusive",
            "default_currency",
            "template",
            "footer_note",
            "sequence_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "company", "created_at", "updated_at", "sequence_name"]


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            "id",
            "company",
            "external_user_id",
            "employee_code",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "is_active",
            "date_joined",
            "photo",
        ]
        read_only_fields = ["id", "date_joined"]