from .models import AuditEntry
from access_control.services import AccessControlService

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        if request.path.startswith('/api/'):
            user = request.user if request.user.is_authenticated else None
            ip = AccessControlService.get_client_ip(request)
            
            AuditEntry.objects.create(
                user=user,
                action=f"{request.method} {request.path}",
                ip_address=ip,
                details=f"Status: {response.status_code}"
            )
            
        return response
