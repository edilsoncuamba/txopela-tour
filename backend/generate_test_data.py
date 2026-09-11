#!/usr/bin/env python
"""
Script para gerar dados de teste no banco de dados
Uso: python manage.py shell < generate_test_data.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'txopela_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from locations.models import Location
from posts.models import Post
from reviews.models import Review
from bookings.models import Booking, BookingAvailability
from datetime import datetime, timedelta
from decimal import Decimal

User = get_user_model()

print("🚀 Gerando dados de teste...")

# Limpar dados antigos (opcional)
# User.objects.filter(email__endswith='@test.com').delete()
# Location.objects.all().delete()

# 1. Criar usuários de teste
print("\n👥 Criando usuários...")

users_data = [
    {'email': 'user1@test.com', 'first_name': 'João', 'last_name': 'Silva'},
    {'email': 'user2@test.com', 'first_name': 'Maria', 'last_name': 'Santos'},
    {'email': 'guide@test.com', 'first_name': 'Pedro', 'last_name': 'Guia'},
]

users = {}
for user_data in users_data:
    user, created = User.objects.get_or_create(
        email=user_data['email'],
        defaults={
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name'],
            'email_verified': True,
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print(f"  ✅ Criado: {user.email}")
    else:
        print(f"  ℹ️  Já existe: {user.email}")
    users[user_data['email']] = user

# 2. Criar locais
print("\n📍 Criando locais...")

locations_data = [
    {
        'name': 'Praia de Inhambane',
        'description': 'A praia mais bonita de Inhambane com areia branca e águas cristalinas',
        'category': 'praia',
        'lat': -23.8596,
        'lng': 35.5478,
        'address': 'Inhambane, Moçambique',
        'rating': 4.8,
        'price_per_hour': Decimal('50.00'),
    },
    {
        'name': 'Museu de Inhambane',
        'description': 'Museu histórico com artefatos da cultura local',
        'category': 'cultura',
        'lat': -23.8620,
        'lng': 35.5500,
        'address': 'Avenida Marginal, Inhambane',
        'rating': 4.5,
        'price_per_hour': Decimal('30.00'),
    },
    {
        'name': 'Restaurante Oceano',
        'description': 'Restaurante com vista para o mar, especializado em frutos do mar',
        'category': 'restaurante',
        'lat': -23.8580,
        'lng': 35.5450,
        'address': 'Praia de Inhambane',
        'rating': 4.7,
        'price_per_hour': Decimal('100.00'),
    },
    {
        'name': 'Trilha da Natureza',
        'description': 'Trilha ecológica com vista para a baía de Inhambane',
        'category': 'natureza',
        'lat': -23.8700,
        'lng': 35.5600,
        'address': 'Zona rural, Inhambane',
        'rating': 4.6,
        'price_per_hour': Decimal('40.00'),
    },
    {
        'name': 'Mergulho Aventura',
        'description': 'Centro de mergulho com instrutores certificados',
        'category': 'aventura',
        'lat': -23.8550,
        'lng': 35.5400,
        'address': 'Porto de Inhambane',
        'rating': 4.9,
        'price_per_hour': Decimal('150.00'),
    },
]

locations = {}
for loc_data in locations_data:
    location, created = Location.objects.get_or_create(
        name=loc_data['name'],
        defaults={
            'description': loc_data['description'],
            'category': loc_data['category'],
            'location_lat': loc_data['lat'],
            'location_lng': loc_data['lng'],
            'address': loc_data['address'],
            'rating': loc_data['rating'],
            'price_per_hour': loc_data['price_per_hour'],
            'created_by': users['user1@test.com'],
        }
    )
    if created:
        print(f"  ✅ Criado: {location.name}")
    else:
        print(f"  ℹ️  Já existe: {location.name}")
    locations[location.name] = location

# 3. Criar posts
print("\n📝 Criando posts...")

posts_data = [
    {
        'title': 'Melhor praia de Inhambane',
        'content': 'Visitei a praia de Inhambane e foi incrível! Recomendo para todos.',
        'location': 'Praia de Inhambane',
        'user': 'user1@test.com',
    },
    {
        'title': 'Experiência de mergulho',
        'content': 'O mergulho em Inhambane foi a melhor experiência da minha vida!',
        'location': 'Mergulho Aventura',
        'user': 'user2@test.com',
    },
]

for post_data in posts_data:
    post, created = Post.objects.get_or_create(
        title=post_data['title'],
        defaults={
            'content': post_data['content'],
            'location': locations[post_data['location']],
            'created_by': users[post_data['user']],
        }
    )
    if created:
        print(f"  ✅ Criado: {post.title}")
    else:
        print(f"  ℹ️  Já existe: {post.title}")

# 4. Criar reviews
print("\n⭐ Criando reviews...")

reviews_data = [
    {
        'rating': 5,
        'comment': 'Excelente local! Muito recomendado.',
        'location': 'Praia de Inhambane',
        'user': 'user1@test.com',
    },
    {
        'rating': 4,
        'comment': 'Bom, mas poderia melhorar a limpeza.',
        'location': 'Restaurante Oceano',
        'user': 'user2@test.com',
    },
]

for review_data in reviews_data:
    review, created = Review.objects.get_or_create(
        location=locations[review_data['location']],
        created_by=users[review_data['user']],
        defaults={
            'rating': review_data['rating'],
            'comment': review_data['comment'],
        }
    )
    if created:
        print(f"  ✅ Criado: Review para {review.location.name}")
    else:
        print(f"  ℹ️  Já existe: Review para {review.location.name}")

# 5. Criar disponibilidades de reserva
print("\n📅 Criando disponibilidades...")

for location in locations.values():
    # Criar disponibilidades para os próximos 30 dias
    for i in range(30):
        date = datetime.now().date() + timedelta(days=i)
        availability, created = BookingAvailability.objects.get_or_create(
            location=location,
            date=date,
            defaults={'available_slots': 10}
        )
        if created and i == 0:
            print(f"  ✅ Criadas disponibilidades para {location.name}")

# 6. Criar reservas de exemplo
print("\n🎫 Criando reservas...")

booking_data = [
    {
        'location': 'Praia de Inhambane',
        'user': 'user2@test.com',
        'date': datetime.now().date() + timedelta(days=5),
        'hours': 2,
        'people': 4,
    },
]

for booking_info in booking_data:
    booking, created = Booking.objects.get_or_create(
        location=locations[booking_info['location']],
        user=users[booking_info['user']],
        date=booking_info['date'],
        defaults={
            'hours': booking_info['hours'],
            'people': booking_info['people'],
            'status': 'pending',
            'total_price': locations[booking_info['location']].price_per_hour * booking_info['hours'],
        }
    )
    if created:
        print(f"  ✅ Criada: Reserva para {booking.location.name}")
    else:
        print(f"  ℹ️  Já existe: Reserva para {booking.location.name}")

print("\n✅ Dados de teste gerados com sucesso!")
print("\n📊 Resumo:")
print(f"  👥 Usuários: {User.objects.filter(email__endswith='@test.com').count()}")
print(f"  📍 Locais: {Location.objects.count()}")
print(f"  📝 Posts: {Post.objects.count()}")
print(f"  ⭐ Reviews: {Review.objects.count()}")
print(f"  🎫 Reservas: {Booking.objects.count()}")

print("\n🔐 Credenciais de teste:")
for user_data in users_data:
    print(f"  Email: {user_data['email']}")
    print(f"  Senha: password123")
    print()
