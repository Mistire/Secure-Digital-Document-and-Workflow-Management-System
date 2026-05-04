
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from documents.models import Document
from access_control.models import Role, UserRole, TimeLocationRule, AttributePolicy
from workflows.models import WorkflowLog

User = get_user_model()

def run_integration_test():
    print("--- Starting Full System Integration Test ---")
    
    # Cleanup
    User.objects.all().delete()
    Document.objects.all().delete()
    Role.objects.all().delete()
    UserRole.objects.all().delete()
    WorkflowLog.objects.all().delete()
    TimeLocationRule.objects.all().delete()
    AttributePolicy.objects.all().delete()
    
    client = APIClient()
    
    # 1. Register User (Creator)
    print("\n[Step 1] Register Creator")
    reg_data = {
        "username": "creator",
        "email": "creator@example.com",
        "password": "strong_password_123",
        "password_confirm": "strong_password_123",
        "department": "Engineering",
        "phone_number": "1234567890",
        "clearance_level": "internal" 
    }
    # Note: Registration endpoint usually doesn't allow setting clearance_level directly for security,
    # it defaults to public. We might need to manually upgrade for this test or assume admin does it.
    # Let's check if serializer allows it. If not, we fix it in DB.
    res = client.post('/api/auth/register/', reg_data, format='json')
    if res.status_code != 201:
        print(f"Registration Failed: {res.data}")
        return
    print("Creator Registered.")
    
    u_creator = User.objects.get(username='creator')
    # Manually upgrade clearance for test (since registration shouldn't allow it generally)
    u_creator.clearance_level = 'internal'
    u_creator.save()
    
    # 2. Login Creator
    print("\n[Step 2] Login Creator")
    res = client.post('/api/auth/login/', {
        "username": "creator",
        "password": "strong_password_123"
    }, format='json')
    if res.status_code != 200:
        print(f"Login Failed: {res.data}")
        return
    token_creator = res.data['access']
    print("Creator Logged In.")
    
    # 3. Setup Roles (Simulating Admin)
    role_creator = Role.objects.create(name='Creator', permissions=['submit'])
    UserRole.objects.create(user=u_creator, role=role_creator)
    
    # 4. Upload Document
    print("\n[Step 3] Upload Document")
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_creator)
    
    # Mock file upload
    from django.core.files.uploadedfile import SimpleUploadedFile
    file = SimpleUploadedFile("test.txt", b"security content", content_type="text/plain")
    
    doc_data = {
        "title": "Secret Plans",
        "file": file,
        "sensitivity_level": "internal"
    }
    res = client.post('/api/documents/', doc_data, format='multipart')
    if res.status_code != 201:
        print(f"Upload Failed: {res.data}")
        return
    doc_id = res.data['id']
    print(f"Document Uploaded: ID {doc_id}")
    
    # 5. Submit Workflow
    print("\n[Step 4] Submit for Review")
    res = client.post(f'/api/workflows/{doc_id}/submit/', {}, format='json')
    if res.status_code == 200:
         print("Workflow Submit Success.")
    else:
         print(f"Submit Failed: {res.data}")
         return

    # 6. Register Reviewer
    print("\n[Step 5] Register Reviewer")
    reg_rev = {
        "username": "reviewer",
        "email": "rev@example.com",
        "password": "strong_password_123",
        "password_confirm": "strong_password_123",
        "department": "Engineering"
    }
    client.credentials() # Clear auth
    client.post('/api/auth/register/', reg_rev)
    u_reviewer = User.objects.get(username='reviewer')
    u_reviewer.clearance_level = 'internal'
    u_reviewer.save()
    
    role_rev = Role.objects.create(name='Reviewer', permissions=['approve_review'])
    UserRole.objects.create(user=u_reviewer, role=role_rev)
    
    res = client.post('/api/auth/login/', {"username": "reviewer", "password": "strong_password_123"})
    token_rev = res.data['access']
    
    # 7. Approve
    print("\n[Step 6] Reviewer Approves")
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_rev)
    res = client.post(f'/api/workflows/{doc_id}/approve_review/', {}, format='json')
    if res.status_code == 200:
         print("Approval Success.")
    else:
         print(f"Approval Failed: {res.data}")
         return
         
    print("\n--- Integration Test Passed ---")

if __name__ == '__main__':
    run_integration_test()
