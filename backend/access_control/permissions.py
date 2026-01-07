from rest_framework import permissions
from .services import AccessControlService

class SecureAccessPolicy(permissions.BasePermission):
    """
    Central Security Policy for DRF Views.
    Delegates logic to AccessControlService.
    """
    
    def has_permission(self, request, view):
        # RuBAC check
        context = {
            'ip_address': AccessControlService.get_client_ip(request),
            'method': request.method
        }
        
        if not AccessControlService.check_rubac(request.user, context):
             return False
        
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Check Resource Access (MAC, DAC, RBAC, ABAC)
        context = {
            'ip_address': AccessControlService.get_client_ip(request),
            'method': request.method
        }
        
        action_map = {
            'GET': 'view',
            'OPTIONS': 'view',
            'HEAD': 'view',
            'POST': 'create',
            'PUT': 'edit',
            'PATCH': 'edit',
            'DELETE': 'delete'
        }
        action = action_map.get(request.method, 'view')
        
        return AccessControlService.check_access(request.user, obj, action, context)
