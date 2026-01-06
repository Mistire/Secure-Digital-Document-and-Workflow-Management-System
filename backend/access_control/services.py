import ipaddress
from datetime import datetime
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from .models import UserDOCPermission, TimeLocationRule, AttributePolicy
from . import simple_json_logic

class AccessControlService:
    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @staticmethod
    def check_mac(user, resource):
        if not hasattr(resource, 'sensitivity_level'):
            return True
        
        levels = {
            'public': 1,
            'internal': 2,
            'confidential': 3
        }
        
        user_level = levels.get(user.clearance_level, 1)
        res_level = levels.get(resource.sensitivity_level, 1)
        
        return user_level >= res_level

    @staticmethod
    def check_rubac(user, context):
        current_time_obj = datetime.now().time()
        client_ip = context.get('ip_address')
        
        rules = TimeLocationRule.objects.all()
        
        if not rules.exists():
            return True
            
        for rule in rules:
            time_ok = True
            ip_ok = True
            
            # Check Time
            if rule.start_time and rule.end_time:
                if not (rule.start_time <= current_time_obj <= rule.end_time):
                    time_ok = False
            
            # Check IP
            if rule.allowed_ips and client_ip:
                ip_match = False
                for cidr in rule.allowed_ips:
                    try:
                        if '/' in cidr:
                            if ipaddress.ip_address(client_ip) in ipaddress.ip_network(cidr, strict=False):
                                ip_match = True
                                break
                        else:
                             if client_ip == cidr:
                                 ip_match = True
                                 break
                    except ValueError:
                        continue
                if not ip_match:
                    ip_ok = False
            
            if time_ok and ip_ok:
                return True
                
        return False

    @staticmethod
    def check_dac(user, resource, permission_type):
        if not user.is_authenticated:
            return False

        if hasattr(resource, 'owner') and resource.owner == user:
            owner_allowed = ['view', 'read', 'write', 'edit', 'delete', 'share', 'submit', 'create']
            if permission_type in owner_allowed:
                return True
        
        try:
            ct = ContentType.objects.get_for_model(resource)
            perm = UserDOCPermission.objects.filter(
                user=user,
                content_type=ct,
                object_id=resource.id,
                permission=permission_type,
                is_active=True
            ).first()
            return perm is not None
        except Exception:
            return False

    @staticmethod
    def check_rbac(user, resource, action):
        if not user.is_authenticated:
            return False

        for user_role in user.user_roles.all():
            role = user_role.role
            # permissions is a list of strings
            if action in role.permissions or '*' in role.permissions:
                return True
        return False

    @staticmethod
    def check_abac(user, resource, action, context):
        if not user.is_authenticated:
            return False

        policies = AttributePolicy.objects.all()
        if not policies.exists():
            return False
        
        data = {
            "user": {
                "id": user.id,
                "username": user.username,
                "department": user.department,
                "clearance_level": user.clearance_level,
                "is_staff": user.is_staff
            },
            "resource": {
                "owner_id": getattr(resource, 'owner_id', None),
                "sensitivity_level": getattr(resource, 'sensitivity_level', None),
                "status": getattr(resource, 'status', None)
            },
            "action": action,
            "context": context
        }
        
        for policy in policies:
            try:
                if simple_json_logic.apply(policy.policy_json, data):
                    return True
            except Exception as e:
                continue
                
        return False

    @classmethod
    def check_access(cls, user, resource, action, context=None):
        if context is None:
            context = {}
            
        if user.is_authenticated and user.is_superuser:
            return True

        if not cls.check_rubac(user, context):
            return False
            
        if not cls.check_mac(user, resource):
            return False
        
        # DAC
        if cls.check_dac(user, resource, action):
            return True
            
        # RBAC
        if cls.check_rbac(user, resource, action):
            return True
            
        # ABAC
        if cls.check_abac(user, resource, action, context):
            return True
        
        return False
