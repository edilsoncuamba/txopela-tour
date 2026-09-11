#!/usr/bin/env python3
"""
Script rápido para popular o banco de dados com locais de exemplo
Executar no diretório do backend Django
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from locals.models import Local
from django.contrib.auth import get_user_model

User = get_user_model()

# Locais de exemplo para Moçambique
SAMPLE_LOCALS = [
    {
        'name': 'Praia de Tofo',
        'description': 'Uma das melhores praias de Moçambique, famosa pelo mergulho com tubarões-baleia e mantas. Águas cristalinas e areias brancas.',
        'category': 'attraction',
        'subcategory': 'beach',
        'province': 'Inhambane',
        'municipality': 'Inhambane',
        'address': 'Tofo Beach, Inhambane',
        'latitude': -23.8531,
        'longitude': 35.5475,
        'status': 'approved',
        'price_range': '$$',
        'amenities': ['parking', 'restaurant', 'diving'],
    },
    {
        'name': 'Ilha de Moçambique',
        'description': 'Património Mundial da UNESCO. Ilha histórica com arquitetura colonial portuguesa, fortaleza e museus.',
        'category': 'attraction',
        'subcategory': 'historical',
        'province': 'Nampula',
        'municipality': 'Moçambique',
        'address': 'Ilha de Moçambique, Nampula',
        'latitude': -15.0335,
        'longitude': 40.7369,
        'status': 'approved',
        'price_range': '$',
        'amenities': ['guided_tours', 'museum', 'unesco'],
    },
    {
        'name': 'Parque Nacional de Gorongosa',
        'description': 'Um dos melhores parques de vida selvagem de África. Leões, elefantes, búfalos e mais de 400 espécies de aves.',
        'category': 'attraction',
        'subcategory': 'nature',
        'province': 'Sofala',
        'municipality': 'Gorongosa',
        'address': 'Gorongosa National Park',
        'latitude': -18.9769,
        'longitude': 34.3511,
        'status': 'approved',
        'price_range': '$$$',
        'amenities': ['safari', 'camping', 'restaurant', 'wifi'],
    },
    {
        'name': 'Restaurante Zambi',
        'description': 'Culinária moçambicana autêntica. Experimente o frango piri-piri, caril de camarão e matapa.',
        'category': 'restaurant',
        'subcategory': 'traditional',
        'province': 'Maputo',
        'municipality': 'Maputo',
        'address': 'Av. Julius Nyerere, Maputo',
        'latitude': -25.9655,
        'longitude': 32.5832,
        'status': 'approved',
        'price_range': '$$',
        'amenities': ['wifi', 'parking', 'outdoor_seating', 'vegetarian'],
    },
    {
        'name': 'Hotel Pestana Rovuma',
        'description': 'Hotel de 4 estrelas no centro de Maputo. Vista para a baía, piscina, restaurante e spa.',
        'category': 'hotel',
        'subcategory': '4star',
        'province': 'Maputo',
        'municipality': 'Maputo',
        'address': 'Av. Martires de Inhaminga, Maputo',
        'latitude': -25.9717,
        'longitude': 32.5731,
        'status': 'approved',
        'price_range': '$$$',
        'amenities': ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'parking'],
    },
    {
        'name': 'Mercado Central de Maputo',
        'description': 'Mercado tradicional com produtos frescos, artesanato local, tecidos capulana e especiarias.',
        'category': 'shop',
        'subcategory': 'market',
        'province': 'Maputo',
        'municipality': 'Maputo',
        'address': 'Av. 25 de Setembro, Maputo',
        'latitude': -25.9653,
        'longitude': 32.5892,
        'status': 'approved',
        'price_range': '$',
        'amenities': ['local_products', 'handicrafts'],
    },
    {
        'name': 'Praia do Wimbe',
        'description': 'Praia popular em Pemba com águas calmas e restaurantes à beira-mar. Perfeita para famílias.',
        'category': 'attraction',
        'subcategory': 'beach',
        'province': 'Cabo Delgado',
        'municipality': 'Pemba',
        'address': 'Wimbe Beach, Pemba',
        'latitude': -12.9518,
        'longitude': 40.5257,
        'status': 'approved',
        'price_range': '$',
        'amenities': ['restaurant', 'parking', 'water_sports'],
    },
    {
        'name': 'Casa de Ferro',
        'description': 'Edifício histórico desenhado por Gustave Eiffel. Arquitetura única em ferro forjado no centro de Maputo.',
        'category': 'attraction',
        'subcategory': 'architecture',
        'province': 'Maputo',
        'municipality': 'Maputo',
        'address': 'Praça da Independência, Maputo',
        'latitude': -25.9650,
        'longitude': 32.5731,
        'status': 'approved',
        'price_range': '$',
        'amenities': ['historical', 'photo_spot'],
    },
    {
        'name': 'Arquipélago de Bazaruto',
        'description': 'Paraíso tropical com dunas de areia, recifes de coral e águas turquesa. Perfeito para mergulho e pesca.',
        'category': 'attraction',
        'subcategory': 'beach',
        'province': 'Inhambane',
        'municipality': 'Vilankulo',
        'address': 'Bazaruto Archipelago',
        'latitude': -21.5417,
        'longitude': 35.4833,
        'status': 'approved',
        'price_range': '$$$$',
        'amenities': ['diving', 'fishing', 'boat_tours', 'resort'],
    },
    {
        'name': 'Restaurante Costa do Sol',
        'description': 'Restaurante icônico à beira-mar em Maputo. Especializado em marisco fresco e pratos portugueses.',
        'category': 'restaurant',
        'subcategory': 'seafood',
        'province': 'Maputo',
        'municipality': 'Maputo',
        'address': 'Av. Marginal, Costa do Sol, Maputo',
        'latitude': -25.9342,
        'longitude': 32.6125,
        'status': 'approved',
        'price_range': '$$$',
        'amenities': ['beach_view', 'parking', 'live_music', 'bar'],
    },
]

def create_locals():
    """Criar locais de exemplo no banco de dados"""
    
    # Tentar encontrar um usuário admin ou criar um genérico
    try:
        owner = User.objects.filter(is_staff=True).first()
        if not owner:
            owner = User.objects.first()
        if not owner:
            print("⚠️ Nenhum usuário encontrado. Crie um usuário primeiro.")
            return
    except:
        owner = None
    
    created_count = 0
    skipped_count = 0
    
    for data in SAMPLE_LOCALS:
        # Verificar se já existe
        existing = Local.objects.filter(name=data['name']).first()
        if existing:
            print(f"⏭️  Já existe: {data['name']}")
            skipped_count += 1
            continue
        
        # Preparar dados de localização
        location_data = {
            'latitude': data.pop('latitude'),
            'longitude': data.pop('longitude'),
            'address': data.pop('address'),
            'province': data.get('province'),
            'municipality': data.pop('municipality'),
        }
        
        # Criar local
        try:
            local = Local.objects.create(
                owner=owner,
                location=location_data,
                **data
            )
            print(f"✅ Criado: {local.name} ({local.category} - {local.province})")
            created_count += 1
        except Exception as e:
            print(f"❌ Erro ao criar {data['name']}: {e}")
    
    print("\n" + "="*60)
    print(f"✅ Criados: {created_count} locais")
    print(f"⏭️  Ignorados: {skipped_count} locais (já existiam)")
    print(f"📊 Total no banco: {Local.objects.count()} locais")
    print(f"✓  Aprovados: {Local.objects.filter(status='approved').count()}")
    print("="*60)

if __name__ == '__main__':
    print("🌍 Txopela Tour - Seed de Locais")
    print("="*60)
    create_locals()
    print("\n✅ Concluído! Execute agora:")
    print("   GET http://192.168.88.89:8000/api/locals")
    print("   para verificar os dados.")
