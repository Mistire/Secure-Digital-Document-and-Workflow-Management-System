from django.apps import AppConfig
from .models import AuditLog


class AuditConfig(AppConfig):
    name = 'audit'

    def ready(self):
        try:
            AuditLog.objects.create(
                action="SYSTEM_STARTUP",
                details="Secure Document System started.",
                ip_address="127.0.0.1"
            )
            print("System Startup Logged.")
        except Exception:
            pass
