#!/usr/bin/env python
"""
Script para testar as estatísticas do utilizador.
Verifica se os related_names estão corretos e se os stats são calculados correctamente.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'txopela_api.settings')
django.setup()

from users.models import User
from users.serializers import UserProfileSerializer


def test_user_stats():
    """Testa as estatísticas de todos os utilizadores."""
    
    print("\n" + "="*80)
    print("🧪 TESTE DE ESTATÍSTICAS DO UTILIZADOR")
    print("="*80 + "\n")
    
    users = User.objects.all()
    
    if not users.exists():
        print("❌ Nenhum utilizador encontrado na base de dados")
        print("💡 Execute: python manage.py createsuperuser")
        return
    
    print(f"📊 Total de utilizadores: {users.count()}\n")
    
    for user in users:
        print("─" * 80)
        print(f"👤 Utilizador: {user.name} ({user.email})")
        print(f"🏷️  Tipo: {user.type}")
        print(f"📅 Criado em: {user.date_joined.strftime('%d/%m/%Y %H:%M')}")
        print()
        
        # Testar related_names diretamente
        print("🔍 Contagem directa dos modelos:")
        try:
            locations_count = user.locations.count()
            print(f"   ✅ obj.locations.count() = {locations_count}")
        except Exception as e:
            print(f"   ❌ obj.locations.count() ERROR: {e}")
            locations_count = 0
        
        try:
            bookings_count = user.bookings.count()
            print(f"   ✅ obj.bookings.count() = {bookings_count}")
        except Exception as e:
            print(f"   ❌ obj.bookings.count() ERROR: {e}")
            bookings_count = 0
        
        try:
            reviews_count = user.reviews.count()
            print(f"   ✅ obj.reviews.count() = {reviews_count}")
        except Exception as e:
            print(f"   ❌ obj.reviews.count() ERROR: {e}")
            reviews_count = 0
        
        print()
        
        # Testar serializer
        print("📦 Stats do serializer (UserProfileSerializer):")
        try:
            serializer = UserProfileSerializer(user)
            stats = serializer.data.get('stats', {})
            
            print(f"   Locais: {stats.get('localsCount', 0)}")
            print(f"   Serviços: {stats.get('servicesCount', 0)}")
            print(f"   Avaliações: {stats.get('reviewsCount', 0)}")
            print(f"   Seguidores: {stats.get('followersCount', 0)}")
            print(f"   A seguir: {stats.get('followingCount', 0)}")
            print(f"   Publicações: {stats.get('postsCount', 0)}")
            
            # Verificar se os stats estão corretos
            if stats.get('localsCount') == locations_count:
                print("   ✅ localsCount está correcto")
            else:
                print(f"   ❌ localsCount incorreto: esperado {locations_count}, obtido {stats.get('localsCount')}")
            
            if stats.get('servicesCount') == bookings_count:
                print("   ✅ servicesCount está correcto")
            else:
                print(f"   ❌ servicesCount incorreto: esperado {bookings_count}, obtido {stats.get('servicesCount')}")
            
            if stats.get('reviewsCount') == reviews_count:
                print("   ✅ reviewsCount está correcto")
            else:
                print(f"   ❌ reviewsCount incorreto: esperado {reviews_count}, obtido {stats.get('reviewsCount')}")
                
        except Exception as e:
            print(f"   ❌ Erro ao serializar: {e}")
            import traceback
            traceback.print_exc()
        
        print()
    
    print("="*80)
    print("✅ TESTE CONCLUÍDO")
    print("="*80 + "\n")


def create_test_data():
    """Cria dados de teste para verificar as estatísticas."""
    from locations.models import Location, Category
    from bookings.models import Booking
    from reviews.models import Review
    from django.utils import timezone
    from datetime import timedelta
    
    print("\n" + "="*80)
    print("🔧 CRIAR DADOS DE TESTE")
    print("="*80 + "\n")
    
    # Criar utilizador de teste
    user, created = User.objects.get_or_create(
        email='test@txopela.com',
        defaults={
            'name': 'Utilizador Teste',
            'type': 'traveler',
        }
    )
    
    if created:
        user.set_password('test123')
        user.save()
        print(f"✅ Utilizador criado: {user.name} ({user.email})")
    else:
        print(f"ℹ️  Utilizador já existe: {user.name} ({user.email})")
    
    # Criar categoria
    category, _ = Category.objects.get_or_create(
        name='Praia',
        defaults={
            'slug': 'praia',
            'icon': '🏖️',
            'color': '#2BB5C8'
        }
    )
    
    # Criar locais
    for i in range(3):
        location, created = Location.objects.get_or_create(
            name=f'Local Teste {i+1}',
            author=user,
            defaults={
                'description': f'Descrição do local teste {i+1}',
                'category': category,
                'address': 'Maputo, Moçambique',
                'latitude': -25.9655,
                'longitude': 32.5832,
                'status': 'approved',
            }
        )
        if created:
            print(f"✅ Local criado: {location.name}")
    
    # Criar bookings (serviços)
    locations = Location.objects.all()[:2]
    for i, location in enumerate(locations):
        booking, created = Booking.objects.get_or_create(
            user=user,
            location=location,
            check_in=timezone.now() + timedelta(days=i*7),
            check_out=timezone.now() + timedelta(days=i*7+2),
            defaults={
                'guests_count': 2,
                'price_per_night': 1000,
                'total_price': 2000,
            }
        )
        if created:
            print(f"✅ Booking criado: {location.name}")
    
    # Criar reviews
    for i, location in enumerate(locations):
        try:
            review, created = Review.objects.get_or_create(
                user=user,
                location=location,
                defaults={
                    'rating': 4 + (i % 2),  # 4 ou 5 estrelas
                    'comment': f'Excelente local! Muito bonito e bem cuidado. Review {i+1}',
                    'is_approved': True,
                }
            )
            if created:
                print(f"✅ Review criada: {location.name}")
        except Exception as e:
            print(f"⚠️  Review já existe para {location.name}")
    
    print("\n✅ Dados de teste criados com sucesso!\n")


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--create-data':
        create_test_data()
    
    test_user_stats()
