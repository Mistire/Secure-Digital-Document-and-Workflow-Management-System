from django.contrib import admin
from .models import Role, UserRole, UserDOCPermission, TimeLocationRule, AccessLog

admin.site.register(Role)
admin.site.register(UserRole)
admin.site.register(UserDOCPermission)
admin.site.register(TimeLocationRule)

@admin.register(AccessLog)
class AccessLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'resource', 'timestamp', 'decision', 'ip_address')
    list_filter = ('action', 'decision', 'timestamp')
    readonly_fields = ('user', 'action', 'resource', 'timestamp', 'decision', 'ip_address', 'reason')
