
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')
django.setup()

from users.models import User
from documents.models import Document
from access_control.models import Role, UserRole, UserDOCPermission, TimeLocationRule, AttributePolicy
from access_control.services import AccessControlService
from datetime import datetime, time

def run_verification():
    print("--- Starting Security Verification ---")
    
    # Clean up
    User.objects.all().delete()
    Document.objects.all().delete()
    Role.objects.all().delete()
    TimeLocationRule.objects.all().delete()
    AttributePolicy.objects.all().delete()
    
    # Setup Users
    alice = User.objects.create_user(username='alice', password='password', clearance_level='confidential', department='IT')
    bob = User.objects.create_user(username='bob', password='password', clearance_level='public', department='HR')
    
    # Setup Document
    doc_confidential = Document.objects.create(title='Secret Plans', sensitivity_level='confidential', owner=alice)
    
    # 1. MAC Test
    print("\n[MAC] Testing Mandatory Access Control...")
    # Alice (Confidential) accessed Confidential Doc -> Should Allow (if no other blocks)
    # We need to simulate full check_access. For purely MAC check:
    res = AccessControlService.check_mac(alice, doc_confidential)
    print(f"Alice (Confidential) -> Doc (Confidential): {res} (Expected: True)")
    
    res = AccessControlService.check_mac(bob, doc_confidential)
    print(f"Bob (Public) -> Doc (Confidential): {res} (Expected: False)")
    
    # 2. RuBAC Test
    print("\n[RuBAC] Testing Rule-Based Access Control...")
    # Add Rule: Work Hours 8-17 (Adjusted for UTC test env)
    rule = TimeLocationRule.objects.create(name="WorkHours", start_time=time(8,0), end_time=time(17,0))
    
    # Mock context
    context_ok = {'ip_address': '127.0.0.1'} # Assume IP checking is loose for now or IP not set
    # Since we set allowed_ips to [], it might ignore IP check if logic says "if rule.allowed_ips".
    
    # We need to mock datetime.now() or just rely on current time. 
    # Current time is 2025-12-29T11:42 -> 11:42 AM. This is within 9-17.
    # So it should pass.
    res = AccessControlService.check_rubac(alice, context_ok)
    print(f"RuBAC Check (11:42 AM, Rule 9-17): {res} (Expected: True)")
    
    # Add IP constraint to rule
    rule.allowed_ips = ['192.168.1.0/24']
    rule.save()
    
    context_bad_ip = {'ip_address': '10.0.0.1'}
    res = AccessControlService.check_rubac(alice, context_bad_ip)
    print(f"RuBAC Check (Bad IP): {res} (Expected: False)")
    
    context_good_ip = {'ip_address': '192.168.1.50'}
    res = AccessControlService.check_rubac(alice, context_good_ip)
    print(f"RuBAC Check (Good IP): {res} (Expected: True)")
    
    # 3. ABAC Test
    print("\n[ABAC] Testing Attribute-Based Access Control...")
    # Policy: Allow view if user.department == 'IT'
    policy_json = {"==": [{"var": "user.department"}, "IT"]}
    AttributePolicy.objects.create(name="IT Only", policy_json=policy_json)
    
    res = AccessControlService.check_abac(alice, doc_confidential, 'view', {})
    print(f"Alice (IT) -> 'view' via ABAC: {res} (Expected: True)")
    
    res = AccessControlService.check_abac(bob, doc_confidential, 'view', {})
    print(f"Bob (HR) -> 'view' via ABAC: {res} (Expected: False)")

if __name__ == '__main__':
    run_verification()
