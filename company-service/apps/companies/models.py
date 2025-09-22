import uuid
from django.db import models

class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    tax_number = models.CharField(max_length=128, blank=True, null=True)
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    bin_number = models.CharField(max_length=128, blank=True, null=True)
    accounting_codes = models.JSONField(default=dict, blank=True)  # mapping: {"sales":"4000", "cogs":"5000"}
    default_payment_terms = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    timezone = models.CharField(max_length=50, default='UTC')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Wing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, related_name='wings', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    pos_printer_name = models.CharField(max_length=255, blank=True, null=True)
    pos_config = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'code')

    def __str__(self):
        return f"{self.company.code} - {self.name}"
