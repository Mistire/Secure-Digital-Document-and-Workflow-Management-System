
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

def run_admin_verification():
    print("--- Starting Admin Panel Verification ---")
    
    # Cleanup
    User.objects.all().delete()
    
    client = APIClient()
    
    # 1. Create Admin and Regular User
    admin = User.objects.create_superuser('admin', 'admin@example.com', 'password123')
    user = User.objects.create_user('user', 'user@example.com', 'password123')
    
    # Get Tokens
    res_admin = client.post('/api/auth/login/', {'username': 'admin', 'password': 'password123'})
    token_admin = res_admin.data['access']
    
    res_user = client.post('/api/auth/login/', {'username': 'user', 'password': 'password123'})
    token_user = res_user.data['access']
    
    # 2. Test Admin Access to User List
    print("\n[Test] Admin Access Users List")
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_admin)
    res = client.get('/api/auth/admin/users/')
    if res.status_code == 200:
        print("Admin access allowed (Expected)")
    else:
        print(f"Admin access FAILED: {res.status_code}")
        
    # 3. Test Admin Update User Clearance
    print("\n[Test] Admin Update User Clearance")
    res = client.patch(f'/api/auth/admin/users/{user.id}/', {'clearance_level': 'internal'})
    if res.status_code == 200:
        user.refresh_from_db()
        print(f"Clearance updated to: {user.clearance_level} (Expected: internal)")
    else:
        print(f"Update FAILED: {res.status_code} - {res.data}")

    # 4. Test Regular User Access to User List
    print("\n[Test] Regular User Access Users List")
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_user)
    res = client.get('/api/auth/admin/users/')
    if res.status_code == 403:
        print("Regular user access denied (Expected)")
    else:
        print(f"Regular User Access FAILED (Should be 403): {res.status_code}")

    # 5. Test Admin Access to Audit Logs
    print("\n[Test] Admin Access Audit Logs")
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_admin)
    res = client.get('/api/audit/logs/')
    if res.status_code == 200:
        print("Admin access allowed (Expected)")
    else:
        print(f"Admin Audit Access FAILED: {res.status_code}")
        
    # 6. Test Regular User Access to Audit Logs
    print("\n[Test] Regular User Access Audit Logs")
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_user)
    res = client.get('/api/audit/logs/')
    if res.status_code == 403:
        print("Regular user access denied (Expected)")
    else:
        print(f"Regular User Audit Access FAILED (Should be 403): {res.status_code}")

if __name__ == '__main__':
    run_admin_verification()
