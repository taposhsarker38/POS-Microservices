from rest_framework import serializers
from .models import Company, Wing

class WingSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)   # যদি Wing UUID হয়
    class Meta:
        model = Wing
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)   # ensure id isn't writable
    wings = WingSerializer(many=True, read_only=True)

    class Meta:
        model = Company
        fields = ['id','name','code','address','timezone','metadata','created_at','wings']
