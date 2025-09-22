from rest_framework import serializers
from .models import Category, Product, Stock, StockTransaction, InventoryChangeRequest, InventoryAlert, NotificationPreference, Batch ,Supplier, ProductSupplier, PurchaseOrder, PurchaseOrderLine, PurchaseReceipt, PurchaseReceiptLine, AccountingJournal, BillOfMaterial, BOMLine, ProductionOrder

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


# append to inventory/serializers.py


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class ProductSupplierSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ProductSupplier
        fields = ('id', 'product', 'supplier', 'supplier_id', 'supplier_sku', 'lead_time_days', 'last_cost', 'default_uom')

    def create(self, validated_data):
        sid = validated_data.pop('supplier_id', None)
        if sid:
            supplier = Supplier.objects.get(id=sid)
            validated_data['supplier'] = supplier
        return super().create(validated_data)


class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderLine
        fields = ('id', 'product', 'qty', 'unit_cost', 'expected_delivery')


class PurchaseOrderSerializer(serializers.ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = ('id', 'supplier', 'company_id', 'wing_id', 'status', 'external_id', 'created_at', 'ordered_at', 'lines')

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        po = PurchaseOrder.objects.create(**validated_data)
        for l in lines_data:
            PurchaseOrderLine.objects.create(po=po, **l)
        return po


class PurchaseReceiptLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseReceiptLine
        fields = ('id', 'product', 'qty_received', 'unit_cost', 'batch_no', 'expiry_date', 'external_id')


class PurchaseReceiptSerializer(serializers.ModelSerializer):
    lines = PurchaseReceiptLineSerializer(many=True)

    class Meta:
        model = PurchaseReceipt
        fields = ('id', 'supplier', 'company_id', 'wing_id', 'po', 'external_id', 'created_at', 'lines')

    def create(self, validated_data):
        lines = validated_data.pop('lines', [])
        receipt = PurchaseReceipt.objects.create(**validated_data)
        for l in lines:
            PurchaseReceiptLine.objects.create(receipt=receipt, **l)
        return receipt


class AccountingJournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountingJournal
        fields = '__all__'

# --- BOM & Production ---
class BOMLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = BOMLine
        fields = ('id', 'component', 'qty')


class BillOfMaterialSerializer(serializers.ModelSerializer):
    lines = BOMLineSerializer(many=True, required=False)

    class Meta:
        model = BillOfMaterial
        fields = ('id', 'product', 'created_at', 'lines')

    def create(self, validated_data):
        lines = validated_data.pop('lines', [])
        bom = BillOfMaterial.objects.create(**validated_data)
        for l in lines:
            BOMLine.objects.create(bom=bom, **l)
        return bom


class ProductionOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionOrder
        fields = ('id', 'bom', 'company_id', 'wing_id', 'qty_to_produce', 'status', 'created_at')
        read_only_fields = ('created_at',)