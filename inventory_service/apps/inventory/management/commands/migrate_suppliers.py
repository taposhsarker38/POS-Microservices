# inventory/management/commands/migrate_suppliers.py
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import transaction

class Command(BaseCommand):
    help = 'Migrate product.supplier (string) into Supplier and ProductSupplier mapping.'

    def handle(self, *args, **options):
        # try common app labels if needed
        possible_labels = ['inventory', 'apps.inventory', 'apps.inventory']  # second entry redundant but harmless
        Product = None
        Supplier = None
        ProductSupplier = None

        # find registered models robustly
        for label in possible_labels:
            try:
                Product = apps.get_model(label, 'Product')
                Supplier = apps.get_model(label, 'Supplier')
                ProductSupplier = apps.get_model(label, 'ProductSupplier')
                break
            except LookupError:
                Product = Supplier = ProductSupplier = None
                continue

        if not Product or not Supplier or not ProductSupplier:
            # fallback: try to search all app configs for Product model
            for app_config in apps.get_app_configs():
                try:
                    Product = app_config.get_model('Product')
                    Supplier = app_config.get_model('Supplier')
                    ProductSupplier = app_config.get_model('ProductSupplier')
                    break
                except LookupError:
                    continue

        if not Product or not Supplier or not ProductSupplier:
            self.stderr.write(self.style.ERROR(
                "Could not locate Product/Supplier/ProductSupplier models. "
                "Check that the inventory app is in INSTALLED_APPS and models are migrated."
            ))
            return

        count = 0
        with transaction.atomic():
            for p in Product.objects.all():
                name = (getattr(p, 'supplier', None) or '').strip()
                if name:
                    supplier, created = Supplier.objects.get_or_create(name=name)
                    ProductSupplier.objects.get_or_create(product=p, supplier=supplier)
                    count += 1

        self.stdout.write(self.style.SUCCESS(f'Migrated {count} products.'))
