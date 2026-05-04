import os
from cryptography.fernet import Fernet
from django.conf import settings

ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY')

if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = Fernet.generate_key().decode()

fernet = Fernet(ENCRYPTION_KEY.encode())

def encrypt_file(file_content):
    return fernet.encrypt(file_content)

def decrypt_file(encrypted_content):
    return fernet.decrypt(encrypted_content)
