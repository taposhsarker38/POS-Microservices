from django.db import models
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
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return self.sku + ' - ' + self.name

class Stock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, related_name='stocks', on_delete=models.CASCADE)
    company_id = models.UUIDField(blank=True, null=True)
    wing_id = models.UUIDField(blank=True, null=True)
    qty = models.IntegerField(default=0)
    reserved = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)
    last_alerted_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product','company_id','wing_id')

    def __str__(self): return f'{self.product.sku} @ {self.company_id or "global"}'


class StockTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stock = models.ForeignKey(Stock, related_name='transactions', on_delete=models.CASCADE)
    change = models.IntegerField()  # negative for decrease
    reason = models.CharField(max_length=200, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    created_by_id = models.UUIDField(blank=True, null=True)
    created_by_username = models.CharField(max_length=150, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

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
