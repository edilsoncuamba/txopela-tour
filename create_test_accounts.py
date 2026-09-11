#!/usr/bin/env python3
"""
Script para criar contas de teste no sistema Txopela Tour
Executar no diretório do backend Django
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Contas de teste conforme documentação
TEST_ACCOUNTS = [
    {
        'email': 'turista@gmail.com',
        'password': 'T123456',
        'name': 'João Turista',
        'role': 'tourist',
        'description': 'Conta de teste para turistas/viajantes'
    },
    {
        'email': 'servico@gmail.com',
        'password': 'S123456',
        'name': 'Maria Guia',
        'role': 'guide',
        'description': 'Conta de teste para guias turísticos (mostra "Sugerir Serviço")'
    },
    {
        'email': 'negociantenormal@gmail.com',
        'password': 'N123456',
        'name': 'Pedro Negociante',
        'role': 'business',
        'description': 'Conta de teste para empresas (mostra "Sugerir Serviço")'
    },
]

def create_test_accounts():
    """Criar ou atualizar contas de teste"""
    
    print("🔐 Txopela Tour - Criação de Contas de Teste")
    print("="*60)
    
    created = 0
    updated = 0
    skipped = 0
    
    for account in TEST_ACCOUNTS:
        email = account['email']
        password = account['password']
        name = account['name']
        role = account['role']
        description = account['description']
        
        # Verificar se já existe
        user = User.objects.filter(email=email).first()
        
        if user:
            # Atualizar role e senha
            user.set_password(password)
            user.role = role
            user.name = name
            user.is_active = True
            user.email_verified = True
            user.save()
            print(f"🔄 Atualizado: {email}")
            print(f"   Nome: {name}")
            print(f"   Role: {role}")
            print(f"   Senha: {password}")
            print(f"   → {description}")
            updated += 1
        else:
            # Criar nova conta
            try:
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    name=name,
                    role=role,
                    is_active=True,
                    email_verified=True
                )
                print(f"✅ Criado: {email}")
                print(f"   Nome: {name}")
                print(f"   Role: {role}")
                print(f"   Senha: {password}")
                print(f"   → {description}")
                created += 1
            except Exception as e:
                print(f"❌ Erro ao criar {email}: {e}")
                skipped += 1
        
        print()
    
    print("="*60)
    print(f"✅ Criados: {created}")
    print(f"🔄 Atualizados: {updated}")
    print(f"❌ Erros: {skipped}")
    print(f"📊 Total de usuários: {User.objects.count()}")
    print("="*60)
    
    # Testar login
    print("\n🧪 TESTE DE LOGIN:")
    print("-"*60)
    for account in TEST_ACCOUNTS:
        from django.contrib.auth import authenticate
        user = authenticate(email=account['email'], password=account['password'])
        if user:
            print(f"✅ {account['email']} → Login OK (role: {user.role})")
        else:
            print(f"❌ {account['email']} → FALHA NO LOGIN!")
    
    print("\n" + "="*60)
    print("📝 CREDENCIAIS DE TESTE:")
    print("="*60)
    print("\n| Tipo | Email | Senha | Role |")
    print("|------|-------|--------|------|")
    for account in TEST_ACCOUNTS:
        tipo = {
            'tourist': '🧳 Turista',
            'guide': '🎯 Guia',
            'business': '🏢 Negócio'
        }.get(account['role'], account['role'])
        print(f"| {tipo} | {account['email']} | {account['password']} | {account['role']} |")
    
    print("\n" + "="*60)
    print("✅ Pronto! Agora pode fazer login no frontend:")
    print("   http://localhost:5173/login")
    print("\n💡 IMPORTANTE:")
    print("   - turista@gmail.com → Mostra 'Sugerir Local'")
    print("   - servico@gmail.com → Mostra 'Sugerir Serviço'")
    print("   - negociantenormal@gmail.com → Mostra 'Sugerir Serviço'")
    print("="*60)

if __name__ == '__main__':
    create_test_accounts()
