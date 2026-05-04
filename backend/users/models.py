from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class ClearanceLevel(models.TextChoices):
        PUBLIC = 'public', 'Public'
        INTERNAL = 'internal', 'Internal'
        CONFIDENTIAL = 'confidential', 'Confidential'

    clearance_level = models.CharField(
        max_length=20,
        choices=ClearanceLevel.choices,
        default=ClearanceLevel.PUBLIC,
        help_text="Mandatory Access Control clearance level."
    )
    
    department = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Department for RBAC/ABAC policies."
    )
    
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Phone number for MFA."
    )

    mfa_secret = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        help_text="TOTP Secret Key"
    )
    
    mfa_enabled = models.BooleanField(
        default=False,
        help_text="Is MFA enabled for this user?"
    )

    def __str__(self):
        return self.username
