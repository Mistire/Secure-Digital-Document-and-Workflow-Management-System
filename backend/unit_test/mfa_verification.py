
import os
import django
# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') # Verification uses main settings (now sqlite)
django.setup()

from rest_framework.test import APIClient
import pyotp
from django.contrib.auth import get_user_model
User = get_user_model()

def run_mfa_verification():
    print("--- Starting MFA Verification ---")
    
    # Cleanup
    User.objects.filter(username='mfa_test_user').delete()
    
    client = APIClient()
    
    # 1. Register User
    print("\n[Step 1] Register User")
    user = User.objects.create_user('mfa_test_user', 'mfa@example.com', 'password123')
    
    # 2. Login (Before MFA)
    print("\n[Step 2] Login (Before MFA)")
    res = client.post('/api/auth/login/', {'username': 'mfa_test_user', 'password': 'password123'})
    if res.status_code == 200:
        print("Login Success (Expected)")
        token = res.data['access']
    else:
        print(f"Login Failed: {res.data}")
        return

    # 3. Setup MFA
    print("\n[Step 3] Setup MFA (Get Secret)")
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
    res = client.get('/api/auth/mfa/setup/')
    secret = res.data.get('secret')
    if secret:
        print(f"Got Secret: {secret}")
    else:
        print("Failed to get secret")
        return

    # 4. Enable MFA (Verify)
    print("\n[Step 4] Enable MFA (Verify OTP)")
    totp = pyotp.TOTP(secret)
    code = totp.now()
    res = client.post('/api/auth/mfa/verify/', {'code': code}, format='json')
    if res.status_code == 200:
        print("MFA Enabled Successfully (Expected)")
    else:
        print(f"MFA Verify Failed: {res.data}")
        return

    # 5. Login Check (MFA Required)
    print("\n[Step 5] Login Check (Without OTP)")
    client.credentials() # Clear auth
    res = client.post('/api/auth/login/', {'username': 'mfa_test_user', 'password': 'password123'})
    
    # DRF returns {'detail': ErrorDetail(string='MFA_REQUIRED', code='mfa_required')}
    # ErrorDetail acts like a string, so we can compare directly
    if res.status_code == 401 and str(res.data.get('detail')) == 'MFA_REQUIRED':
        print("Login Failed as Expected (MFA Required)")
    else:
        print(f"Check Failed. Status: {res.status_code}, Data: {res.data}")

    # 6. Login Check (With OTP)
    print("\n[Step 6] Login Check (With OTP)")
    code = totp.now()
    res = client.post('/api/auth/login/', {'username': 'mfa_test_user', 'password': 'password123', 'otp': code})
    if res.status_code == 200:
        print("Login Success with OTP (Expected)")
    else:
        print(f"Login with OTP Failed: {res.data}")

if __name__ == '__main__':
    run_mfa_verification()
