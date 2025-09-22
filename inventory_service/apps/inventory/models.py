from django.db import models
from decimal import Decimal
import uuid
from django.utils import timezone

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return self.name

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sku = models.CharField(max_length=128, blank=True, null=True, db_index=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, null=True)  # e.g. FMCG, Medicine, Electronics
    brand = models.CharField(max_length=100, blank=True, null=True)
    inventory_org = models.CharField(max_length=100, blank=True, null=True)   # e.g. Trading Goods, Manufacturing
    product_group = models.CharField(max_length=100, blank=True, null=True)   # e.g. FMCG, Restaurant
    major_category = models.CharField(max_length=100, blank=True, null=True)  # FOOD, BEVERAGE etc
    minor_category = models.CharField(max_length=100, blank=True, null=True)  # GREEN-VEG, SOFT DRINKS
    size = models.CharField(max_length=50, blank=True, null=True)            # 1 kg, 2000ML
    component_of = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)  # optional
    is_finished_good = models.BooleanField(default=False)
    is_raw_material = models.BooleanField(default=False)
    is_serial_controlled = models.BooleanField(default=False)
    is_lot_controlled = models.BooleanField(default=False)  # lot = batch
    is_item_controlled = models.BooleanField(default=False)
    valuation_method = models.CharField(max_length=20, choices=[('fifo','FIFO'),('avg','AVERAGE')], default='avg')  
    is_batch_tracked = models.BooleanField(default=False)  # medicine etc
    default_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    default_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return self.sku + ' - ' + self.name
class Batch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    batch_no = models.CharField(max_length=128, db_index=True)
    expiry_date = models.DateField(null=True, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    qty = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'batch_no')

class Stock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, related_name='stocks', on_delete=models.CASCADE)
    company_id = models.UUIDField(blank=True, null=True)
    wing_id = models.UUIDField(blank=True, null=True)
    batch = models.ForeignKey(Batch, null=True, blank=True, on_delete=models.SET_NULL)
    qty = models.IntegerField(default=0)
    reserved = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)
    last_alerted_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product','company_id','wing_id','batch')

    def __str__(self): return f'{self.product.sku} @ {self.company_id or "global"}'
    @property
    def available(self):
        return self.qty - self.reserved


class StockTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('initialize','initialize'), ('purchase','purchase'), ('sale','sale'),
        ('reserve','reserve'), ('finalize','finalize'), ('adjust','adjust'), ('return','return')
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='transactions')
    change = models.IntegerField()  # +ve or -ve
    transaction_type = models.CharField(max_length=32, choices=TRANSACTION_TYPE_CHOICES, default='adjust')
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    reference = models.CharField(max_length=255, null=True, blank=True)  # e.g. invoice id
    reason = models.CharField(max_length=255, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    created_by_id = models.UUIDField(null=True, blank=True)
    created_by_username = models.CharField(max_length=150, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        indexes = [
            models.Index(fields=['external_id']),
        ]
    def __str__(self): return f'{self.change} on {self.stock.id}'

class InventoryChangeRequest(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='change_requests')
    company_id = models.UUIDField(blank=True, null=True)
    wing_id = models.UUIDField(blank=True, null=True)
    change = models.IntegerField()
    reason = models.CharField(max_length=255, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    requested_by_id = models.UUIDField(blank=True, null=True)
    requested_by_username = models.CharField(max_length=150, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    approver_id = models.UUIDField(blank=True, null=True)
    approver_username = models.CharField(max_length=150, blank=True, null=True)
    approver_comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    acted_at = models.DateTimeField(blank=True, null=True)

    def __str__(self): return f'ICR {self.id} for {self.product.sku}'

class InventoryAlert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stock = models.ForeignKey(Stock, related_name='alerts', on_delete=models.CASCADE)
    alert_type = models.CharField(max_length=50, default='LOW_STOCK')
    threshold = models.IntegerField()
    available = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(blank=True, null=True)
    external_ref = models.CharField(max_length=255, blank=True, null=True)

class NotificationPreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_id = models.UUIDField(blank=True, null=True)
    channel_email = models.BooleanField(default=True)
    channel_webhook = models.BooleanField(default=False)
    webhook_url = models.URLField(blank=True, null=True)
    emails = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Supplier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    contact = models.JSONField(default=dict, blank=True)  # phone/email/address
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
class ProductSupplier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_suppliers')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='product_suppliers')
    supplier_sku = models.CharField(max_length=128, blank=True, null=True)
    lead_time_days = models.IntegerField(default=0)
    last_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    default_uom = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        unique_together = ('product', 'supplier')

    def __str__(self):
        return f'{self.product} <- {self.supplier}'
class PurchaseOrder(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_ORDERED = 'ordered'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [(STATUS_DRAFT, 'Draft'), (STATUS_ORDERED, 'Ordered'), (STATUS_CANCELLED, 'Cancelled')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    company_id = models.UUIDField(blank=True, null=True)
    wing_id = models.UUIDField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    external_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ordered_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f'PO {self.id} -> {self.supplier.name}'


class PurchaseOrderLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    po = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    qty = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    expected_delivery = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.product} x {self.qty} @ {self.unit_cost}'


class PurchaseReceipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_receipts')
    company_id = models.UUIDField(blank=True, null=True)
    wing_id = models.UUIDField(blank=True, null=True)
    po = models.ForeignKey(PurchaseOrder, null=True, blank=True, on_delete=models.SET_NULL)
    external_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'GRN {self.id} from {self.supplier.name}'


class PurchaseReceiptLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt = models.ForeignKey(PurchaseReceipt, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    qty_received = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    batch_no = models.CharField(max_length=128, blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    external_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)

    def __str__(self):
        return f'{self.product} +{self.qty_received} @ {self.unit_cost}'


class AccountingJournal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_id = models.UUIDField(blank=True, null=True)
    wing_id = models.UUIDField(blank=True, null=True)
    entry = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Journal {self.id}'
class BillOfMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, related_name='bom_finished', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class BOMLine(models.Model):
    bom = models.ForeignKey(BillOfMaterial, related_name='lines', on_delete=models.CASCADE)
    component = models.ForeignKey(Product, on_delete=models.CASCADE)    # raw material
    qty = models.IntegerField()       # units per finished unit

class ProductionOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bom = models.ForeignKey(BillOfMaterial, on_delete=models.CASCADE)
    company_id = models.UUIDField(blank=True, null=True)
    wing_id = models.UUIDField(blank=True, null=True)
    qty_to_produce = models.IntegerField()
    status = models.CharField(choices=[('draft', 'Draft'), ('planned', 'Planned'), ('in_progress', 'In Progress'), ('done', 'Done'), ('cancelled', 'Cancelled')], max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

