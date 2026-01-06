
import os
import django
# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

User = get_user_model()

def run_verification():
    print("--- Starting Security Gaps Verification ---")
    client = APIClient()

    # 1. Test Account Lockout
    print("\n[Step 1] Testing Account Lockout (Axes)")
    username = 'lockout_test_user'
    password = 'password123'
    # Cleanup
    User.objects.filter(username__in=['lockout_test_user', 'verify_user', 'captcha_user_success', 'captcha_user_fail']).delete()
    
    # Create user
    user = User.objects.create_user(username=username, email='lockout@test.com', password=password)
    
    # Try 5 failures
    for i in range(5):
        res = client.post('/api/auth/login/', {'username': username, 'password': 'wrongpassword'}, REMOTE_ADDR='127.0.0.1')
        print(f"Attempt {i+1}: Status {res.status_code}")
    
    # Check Axes Internal Config
    from axes.models import AccessAttempt
    attempts = AccessAttempt.objects.filter(username=username)
    print(f"Axes Attempts Recorded: {attempts.count()}")
    if attempts.exists():
         print(f"Latest Attempt Failures: {attempts.first().failures_since_start}")

    # 6th attempt should be locked out (403 or specific error)
    res = client.post('/api/auth/login/', {'username': username, 'password': 'wrongpassword'}, REMOTE_ADDR='127.0.0.1')
    print(f"Attempt 6 (Should be Locked): Status {res.status_code}, Data: {res.data}")
    
    if res.status_code == 403 or 'locked out' in str(res.data).lower():
         print("PASS: Account Lockout verified.")
    else:
         print("FAIL: Account Lockout did not trigger.")

    # 2. Test Email Verification Logic
    print("\n[Step 2] Testing Email Verification Logic")
    # Create inactive user
    user_verify = User.objects.create_user('verify_user', 'verify@test.com', 'password123')
    user_verify.is_active = False
    user_verify.save()
    
    # Generate Token
    token = default_token_generator.make_token(user_verify)
    uid = urlsafe_base64_encode(force_bytes(user_verify.pk))
    
    # Verify
    res = client.post('/api/auth/verify-email/', {'uid': uid, 'token': token})
    print(f"Verification Response: {res.status_code}, {res.data}")
    
    user_verify.refresh_from_db()
    if res.status_code == 200 and user_verify.is_active:
        print("PASS: Email Verification works (User activated).")
    else:
        print(f"FAIL: Email Verification failed. Active: {user_verify.is_active}")

    # 3. Test CAPTCHA Constraint (Register)
    print("\n[Step 3] Testing CAPTCHA Constraint")
    # 3a. Missing CAPTCHA
    res = client.post('/api/auth/register/', {
        'username': 'captcha_user_fail',
        'email': 'captcha_fail@test.com',
        'password': 'password123',
        'password_confirm': 'password123'
    }) 
    print(f"Register without CAPTCHA: Status {res.status_code}")
    if res.status_code == 400 and 'captcha' in res.data:
        print("PASS: Registration rejected missing CAPTCHA.")
    else:
        print(f"FAIL: Expected 400 for missing CAPTCHA, got {res.status_code}, data: {res.data}")

    # 3b. Valid CAPTCHA
    print("\n[Step 3b] Testing Valid CAPTCHA")
    # Fetch Captcha
    res = client.post('/api/auth/captcha/')
    key = res.data['key']
    # Get answer from cache directly (since we are in same process/cache)
    # Note: verification script runs in same environment but client calls might use different thread/process?
    # Django test client runs in same process, so cache should work if using locmem.
    from django.core.cache import cache
    answer = cache.get(f"captcha_{key}")
    print(f"Got CAPTCHA Key: {key}, Answer: {answer}")
    
    if not answer:
        print("FAIL: Could not retrieve captcha answer from cache.")
    else:
        res = client.post('/api/auth/register/', {
            'username': 'captcha_user_success',
            'email': 'captcha_success@test.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'captcha_key': key,
            'captcha_value': answer
        })
        print(f"Register with Valid CAPTCHA: Status {res.status_code}")
        if res.status_code == 201:
            print("PASS: Registration succeeded with valid CAPTCHA.")
            # Verify email sent (mock check)
            u = User.objects.get(username='captcha_user_success')
            if not u.is_active:
                print("PASS: User is inactive pending email verification.")
            else:
                print("FAIL: User should be inactive.")
        else:
             print(f"FAIL: Registration failed with valid CAPTCHA. Data: {res.data}")

if __name__ == '__main__':
    run_verification()
