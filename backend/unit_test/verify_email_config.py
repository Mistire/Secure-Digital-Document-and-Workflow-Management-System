
import os
import sys
import django
from django.core.mail import send_mail
from django.conf import settings

# Setup Django
def load_env_manual(path):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            k, v = line.split('=', 1)
            os.environ[k] = v

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("python-dotenv not installed, manually loading .env")
    load_env_manual('backend/.env')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def verify_email():
    print("--- Starting Email Verification ---")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    
    if not settings.EMAIL_HOST_PASSWORD:
        print("ERROR: EMAIL_HOST_PASSWORD is not set!")
        return

    try:
        print("\nAttempting to send test email...")
        send_mail(
            'Test Email from Secure Docs System',
            'This is a test email to verify the SMTP configuration.',
            settings.EMAIL_HOST_USER,
            [settings.EMAIL_HOST_USER], # Send to self
            fail_silently=False,
        )
        print("SUCCESS: Test email sent successfully!")
    except Exception as e:
        print(f"FAILURE: Could not send email. Error: {e}")

if __name__ == '__main__':
    verify_email()
