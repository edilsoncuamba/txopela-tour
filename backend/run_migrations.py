#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'txopela_api.settings')
django.setup()

from django.core.management import call_command

# Run migrations
call_command('migrate')
print("Migrations completed successfully!")
