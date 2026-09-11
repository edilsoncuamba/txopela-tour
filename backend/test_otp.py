#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'txopela_api.settings')
django.setup()

from users.models import EmailVerificationOTP, User
from django.utils import timezone

# Test 1: Create OTP
print("Test 1: Creating OTP...")
email = "test@example.com"
otp = EmailVerificationOTP.create_otp(email)
print(f"✓ OTP created: {otp.otp_code}")
print(f"  Email: {otp.email}")
print(f"  Expires at: {otp.expires_at}")
print(f"  Is valid: {otp.is_valid()}")
print()

# Test 2: Verify OTP
print("Test 2: Verifying OTP...")
otp_to_verify = EmailVerificationOTP.objects.filter(email=email, is_used=False).first()
if otp_to_verify and otp_to_verify.is_valid():
    print(f"✓ OTP is valid: {otp_to_verify.otp_code}")
    otp_to_verify.is_used = True
    otp_to_verify.save()
    print(f"✓ OTP marked as used")
else:
    print("✗ OTP not found or invalid")
print()

# Test 3: Create user and mark email as verified
print("Test 3: Creating user and marking email as verified...")
try:
    user = User.objects.create_user(
        email="newuser@example.com",
        name="Test User",
        password="testpass123",
        type="traveler"
    )
    print(f"✓ User created: {user.email}")
    print(f"  Email verified: {user.email_verified}")
    
    user.email_verified = True
    user.save()
    print(f"✓ Email marked as verified")
    print(f"  Email verified: {user.email_verified}")
except Exception as e:
    print(f"✗ Error: {e}")
print()

print("All tests completed!")
