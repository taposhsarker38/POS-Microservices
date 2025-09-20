from django.core.management.base import BaseCommand
from apps.inventory.models import Stock
from apps.inventory.notifications import check_and_notify_low_stock

class Command(BaseCommand):
    help = 'Check all stocks for low levels and send notifications'

    def handle(self, *args, **options):
        count = 0
        for stock in Stock.objects.all():
            ok = check_and_notify_low_stock(stock)
            if ok:
                count += 1
        self.stdout.write(self.style.SUCCESS(f'Checked stocks, alerts sent: {count}'))
