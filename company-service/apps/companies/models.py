import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.db import transaction, connection
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
class NavigationItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, related_name='nav_items', on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    path = models.CharField(max_length=400, blank=True, null=True)
    order = models.IntegerField(default=0)
    permission_code = models.CharField(max_length=200, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['order']
    def __str__(self):
        return f"{self.company_id} - {self.title}"
class CompanySetting(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='settings')
    # basic branding:
    primary_color = models.CharField(max_length=7, blank=True, null=True)   # "#0ea5a4"
    secondary_color = models.CharField(max_length=7, blank=True, null=True)
    accent_color = models.CharField(max_length=7, blank=True, null=True)
    background_color = models.CharField(max_length=7, blank=True, null=True)
    text_color = models.CharField(max_length=7, blank=True, null=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    logo_dark = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    favicon = models.ImageField(upload_to='company_icons/', blank=True, null=True)
    # nav + feature flags + custom fields
    nav = models.JSONField(default=list, blank=True)   # e.g. [{"name":"Dashboard","path":"/"},{...}]
    metadata = models.JSONField(default=dict, blank=True)  # arbitrary data: fonts, layout options
    feature_flags = models.JSONField(default=dict, blank=True)  # e.g. {"pos_enabled":true}
    ui_schema = models.JSONField(default=dict, blank=True)  # e.g. custom form fields config
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Company Setting'
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
    
# Currency, InvoiceSettings, Employee
class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True, help_text="ISO currency code, e.g. USD, BDT")
    name = models.CharField(max_length=64)
    symbol = models.CharField(max_length=8, blank=True)
    exchange_rate = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('1.0'))
    is_base = models.BooleanField(default=False, help_text="Mark this as the system base currency (only one)")
    created_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        ordering = ["-is_base", "code"]


    def save(self, *args, **kwargs):
        if self.is_base:
            Currency.objects.filter(is_base=True).exclude(pk=self.pk).update(is_base=False)
            self.exchange_rate = Decimal('1.0')
        elif not Currency.objects.filter(is_base=True).exclude(pk=self.pk).exists():
            self.is_base = True
            self.exchange_rate = Decimal('1.0')
        super().save(*args, **kwargs)


    def __str__(self):
        return f"{self.code} ({self.symbol})"

INVOICE_TEMPLATE_CHOICES = (
("standard", "Standard"),
("compact", "Compact"),
("detailed", "Detailed"),
)

class InvoiceSettings(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name="invoice_settings")
    invoice_prefix = models.CharField(max_length=20, blank=True, default="INV")
    # next_invoice_number kept for legacy UI visibility if you want to show approximate next value
    next_invoice_number = models.BigIntegerField(default=1)
    allow_negative_stock = models.BooleanField(default=False)
    tax_inclusive = models.BooleanField(default=False)
    default_currency = models.ForeignKey(Currency, null=True, blank=True, on_delete=models.SET_NULL)
    template = models.CharField(max_length=32, choices=INVOICE_TEMPLATE_CHOICES, default="standard")
    footer_note = models.TextField(blank=True)
    # store the DB sequence name (created for postgres); helps in allocating numbers per company
    sequence_name = models.CharField(max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        indexes = [models.Index(fields=["company"])]


    def _format_number(self, number):
        num = f"{number:08d}"
        return f"{self.invoice_prefix}-{num}" if self.invoice_prefix else num


    def allocate_invoice_number_via_sequence(self):
        """
        If a Postgres sequence name is set, use nextval(sequence_name) to get the next integer.
        """
        if not self.sequence_name:
            raise RuntimeError("No sequence configured for this InvoiceSettings")
        with connection.cursor() as cursor:
            cursor.execute('SELECT nextval(%s)', [self.sequence_name])
            row = cursor.fetchone()
            if not row:
                raise RuntimeError("Failed to read nextval from sequence")
        seqval = int(row[0])
        # Keep next_invoice_number in sync for UI visibility
        self.next_invoice_number = seqval + 1
        self.save(update_fields=["next_invoice_number"])
        return self._format_number(seqval)


    def allocate_invoice_number_via_lock(self):
        with transaction.atomic():
            locked = InvoiceSettings.objects.select_for_update().get(pk=self.pk)
            invoice_no = locked._format_number(locked.next_invoice_number)
            locked.next_invoice_number += 1
            locked.save(update_fields=["next_invoice_number"])
        return invoice_no
    
    def allocate_invoice_number(self):
        """
        Public method to allocate an invoice number. Prefers Postgres sequence when available,
        otherwise falls back to row-lock allocation.
        """
# If DB is postgres and sequence_name is present, use sequence
        if connection.vendor == 'postgresql' and self.sequence_name:
            return self.allocate_invoice_number_via_sequence()
# fallback to locking approach
        return self.allocate_invoice_number_via_lock()

    def __str__(self):
        return f"InvoiceSettings({self.company})"


EMPLOYEE_ROLE_CHOICES = (
    ("cashier", "Cashier"),
    ("manager", "Manager"),
    ("accountant", "Accountant"),
    ("owner", "Owner"),
    ("other", "Other"),
)

class Employee(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="employees")
    external_user_id = models.UUIDField(null=True, blank=True, help_text="Link to auth-service user id (optional)")
    employee_code = models.CharField(max_length=30, blank=True, null=True)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True, null=True, db_index=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    role = models.CharField(max_length=32, choices=EMPLOYEE_ROLE_CHOICES, default="cashier")
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    photo = models.ImageField(upload_to="employee_photos/", null=True, blank=True)


    class Meta:
        ordering = ["-date_joined", "employee_code"]
        indexes = [models.Index(fields=["company", "external_user_id"]), models.Index(fields=["email"])]
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_code})"

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=Company)
def ensure_invoice_settings(sender, instance, created, **kwargs):
    if created:
        inv = InvoiceSettings.objects.create(company=instance)
        # Try to create a Postgres sequence for this company (sequence name uses company hex id)
        if connection.vendor == 'postgresql':
            seq_name = f"invoice_seq_{instance.id.hex}"
            try:
                with connection.cursor() as cursor:
                    cursor.execute(f"CREATE SEQUENCE IF NOT EXISTS {seq_name} START WITH 1 INCREMENT BY 1;")
                inv.sequence_name = seq_name
                inv.next_invoice_number = 1
                inv.save(update_fields=["sequence_name", "next_invoice_number"])
            except Exception:
                # if creating sequence fails (permission issues), just leave sequence_name null and fallback will be used
                pass


