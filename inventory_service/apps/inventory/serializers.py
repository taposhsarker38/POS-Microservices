from rest_framework import serializers
from .models import Category, Product, Stock, StockTransaction, InventoryChangeRequest, InventoryAlert, NotificationPreference, Batch

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'
class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'

class StockTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockTransaction
        fields = '__all__'

class InventoryChangeRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryChangeRequest
        fields = '__all__'
        read_only_fields = ('id','status','requested_by_id','requested_by_username','approver_id','approver_username','acted_at','created_at')

class InventoryChangeRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryChangeRequest
        fields = ['product','company_id','wing_id','change','reason','external_id']

class InventoryAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryAlert
        fields = '__all__'

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = '__all__'
