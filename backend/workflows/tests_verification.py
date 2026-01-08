
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')
django.setup()

from users.models import User
from documents.models import Document
from access_control.models import Role, UserRole, TimeLocationRule, AttributePolicy
from workflows.models import WorkflowLog
from access_control.services import AccessControlService

# ...

def run_verification():
    print("--- Starting Workflow Verification ---")
    
    # Cleanup
    TimeLocationRule.objects.all().delete()
    AttributePolicy.objects.all().delete()
    User.objects.all().delete()
    Document.objects.all().delete()
    Role.objects.all().delete()
    UserRole.objects.all().delete()
    WorkflowLog.objects.all().delete()
    
    # Setup Roles
    role_creator = Role.objects.create(name='Creator', permissions=['submit'])
    role_reviewer = Role.objects.create(name='Reviewer', permissions=['approve_review', 'reject'])
    role_approver = Role.objects.create(name='ReviewerFinal', permissions=['approve_final']) # Different role for final
    
    # Setup Users
    u_creator = User.objects.create_user(username='creator', password='p', clearance_level='internal')
    u_reviewer = User.objects.create_user(username='reviewer', password='p', clearance_level='internal')
    
    # Assign Roles
    UserRole.objects.create(user=u_creator, role=role_creator)
    UserRole.objects.create(user=u_reviewer, role=role_reviewer)
    
    # Create Document
    doc = Document.objects.create(title='Project Plan', owner=u_creator, status='draft')
    print(f"Doc Created. Status: {doc.status}")
    
    # Context (Mock)
    context = {'ip_address': '127.0.0.1'}
    
    # 1. Creator Submits
    print("\n[Test] Creator Submits Draft")
    # Check Access
    can_submit = AccessControlService.check_access(u_creator, doc, 'submit', context)
    print(f"Access Check (Creator -> submit): {can_submit} (Expected: True)")
    
    if can_submit:
        doc.status = 'review'
        doc.save()
        WorkflowLog.objects.create(document=doc, actor=u_creator, action='submit', previous_status='draft', new_status='review')
        print(f"Transitioned to: {doc.status}")
    
    # 2. Reviewer Approves
    print("\n[Test] Reviewer Approves (Review Stage)")
    can_approve = AccessControlService.check_access(u_reviewer, doc, 'approve_review', context)
    print(f"Access Check (Reviewer -> approve_review): {can_approve} (Expected: True)")
    
    if can_approve:
        doc.status = 'approval'
        doc.save()
        WorkflowLog.objects.create(document=doc, actor=u_reviewer, action='approve_review', previous_status='review', new_status='approval')
        print(f"Transitioned to: {doc.status}")

    # 3. Creator tries to Approve Final (Should Fail)
    print("\n[Test] Creator tries to Final Approve")
    can_final = AccessControlService.check_access(u_creator, doc, 'approve_final', context)
    print(f"Access Check (Creator -> approve_final): {can_final} (Expected: False)")

if __name__ == '__main__':
    run_verification()
