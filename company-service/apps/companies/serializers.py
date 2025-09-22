from rest_framework import serializers
from .models import Company, Wing

class WingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wing
        fields = ['id', 'company', 'name', 'code','pos_printer_name','pos_config','metadata', 'created_at']

class CompanySerializer(serializers.ModelSerializer):
    wings = WingSerializer(many=True, read_only=True)
    class Meta:
        model = Company
        fields = ['id','name','code','tax_number','vat_rate','accounting_codes','default_payment_terms','address','timezone','metadata','created_at','wings']
