#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'txopela_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from locations.models import Category, Location
from decimal import Decimal

User = get_user_model()

# Create categories
categories_data = [
    {'name': 'Praias', 'slug': 'praias', 'icon': '🏖️', 'color': '#0077B6'},
    {'name': 'Cultura', 'slug': 'cultura', 'icon': '🏛️', 'color': '#2D6A4F'},
    {'name': 'Gastronomia', 'slug': 'gastronomia', 'icon': '🍽️', 'color': '#D62828'},
    {'name': 'Aventura', 'slug': 'aventura', 'icon': '🏄', 'color': '#F77F00'},
    {'name': 'Natureza', 'slug': 'natureza', 'icon': '🌿', 'color': '#06A77D'},
]

print("Creating categories...")
categories = {}
for cat_data in categories_data:
    cat, created = Category.objects.get_or_create(
        slug=cat_data['slug'],
        defaults=cat_data
    )
    categories[cat_data['slug']] = cat
    if created:
        print(f"  ✓ Created category: {cat.name}")
    else:
        print(f"  - Category already exists: {cat.name}")

# Create test users
print("\nCreating test users...")
users_data = [
    {'email': 'traveler@example.com', 'name': 'João Viajante', 'type': 'traveler'},
    {'email': 'guide@example.com', 'name': 'Maria Guia', 'type': 'guide'},
    {'email': 'business@example.com', 'name': 'Pedro Negócio', 'type': 'business'},
]

users = {}
for user_data in users_data:
    user, created = User.objects.get_or_create(
        email=user_data['email'],
        defaults={
            'name': user_data['name'],
            'type': user_data['type'],
            'is_active': True,
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print(f"  ✓ Created user: {user.name} ({user.email})")
    else:
        print(f"  - User already exists: {user.name}")
    users[user_data['email']] = user

# Create test locations
print("\nCreating test locations...")
locations_data = [
    {
        'name': 'Praia de Inhambane',
        'description': 'Uma das praias mais bonitas de Moçambique com areia branca e águas cristalinas.',
        'category': 'praias',
        'address': 'Inhambane, Moçambique',
        'latitude': Decimal('-23.8637'),
        'longitude': Decimal('35.3833'),
        'author_email': 'traveler@example.com',
    },
    {
        'name': 'Museu de Inhambane',
        'description': 'Museu histórico com artefatos da cultura local e história de Moçambique.',
        'category': 'cultura',
        'address': 'Centro de Inhambane, Moçambique',
        'latitude': Decimal('-23.8650'),
        'longitude': Decimal('35.3850'),
        'author_email': 'guide@example.com',
    },
    {
        'name': 'Restaurante Oceano',
        'description': 'Restaurante com comida tradicional moçambicana e frutos do mar frescos.',
        'category': 'gastronomia',
        'address': 'Praia de Inhambane, Moçambique',
        'latitude': Decimal('-23.8640'),
        'longitude': Decimal('35.3835'),
        'author_email': 'business@example.com',
    },
    {
        'name': 'Trilha da Natureza',
        'description': 'Trilha ecológica com vista para a natureza selvagem de Moçambique.',
        'category': 'natureza',
        'address': 'Arredores de Inhambane, Moçambique',
        'latitude': Decimal('-23.8700'),
        'longitude': Decimal('35.3900'),
        'author_email': 'traveler@example.com',
    },
    {
        'name': 'Mergulho em Coral',
        'description': 'Experiência de mergulho em recifes de coral com vida marinha abundante.',
        'category': 'aventura',
        'address': 'Oceano Índico, Inhambane',
        'latitude': Decimal('-23.8600'),
        'longitude': Decimal('35.3900'),
        'author_email': 'guide@example.com',
    },
]

for loc_data in locations_data:
    author = users[loc_data.pop('author_email')]
    category = categories[loc_data.pop('category')]
    
    location, created = Location.objects.get_or_create(
        name=loc_data['name'],
        defaults={
            **loc_data,
            'category': category,
            'author': author,
            'status': 'approved',
            'images': ['https://via.placeholder.com/400x300?text=' + loc_data['name'].replace(' ', '+')],
        }
    )
    
    if created:
        print(f"  ✓ Created location: {location.name}")
    else:
        print(f"  - Location already exists: {location.name}")

print("\n✅ Test data created successfully!")
print("\nTest credentials:")
for user_data in users_data:
    print(f"  - {user_data['email']} / password123")
