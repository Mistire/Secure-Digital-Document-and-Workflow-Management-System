from django.contrib.admin import register
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Security Clearance', {'fields': ('clearance_level',)}),
        ('Additional Info', {'fields': ('department', 'phone_number')}),
    )
    list_display = BaseUserAdmin.list_display + ('clearance_level', 'department')
    list_filter = BaseUserAdmin.list_filter + ('clearance_level', 'department')
