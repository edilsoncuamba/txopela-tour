#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'txopela_api.settings')
django.setup()

from django.core.management import call_command
from django.conf import settings

# Delete the database file
db_path = settings.DATABASES['default']['NAME']
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"Deleted {db_path}")

# Run migrations
call_command('migrate')
print("Migrations completed successfully!")

# Create a superuser
from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser(
        email='admin@example.com',
        name='Admin',
        password='admin123'
    )
    print("Superuser created: admin@example.com / admin123")
