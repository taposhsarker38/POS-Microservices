import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

ROLE_CHOICES = (
    ('owner', 'Owner'),
    ('admin', 'Admin'),
    ('manager', 'Manager'),
    ('cashier', 'Cashier'),
    ('staff', 'Staff'),
)

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    company_id = models.UUIDField(blank=True, null=True)
    wing_id = models.UUIDField(blank=True, null=True)

    # new fields
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    email_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.username
