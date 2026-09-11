#!/usr/bin/env python
"""
Script para testar configuração de email
Execute: python test_email_config.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'txopela_api.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("=" * 60)
print("TESTE DE CONFIGURAÇÃO DE EMAIL")
print("=" * 60)
print()

# Mostrar configurações
print("Configurações Atuais:")
print(f"  EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"  EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"  EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"  EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"  EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print()

# Verificar se está usando console backend
if 'console' in settings.EMAIL_BACKEND.lower():
    print("⚠️  AVISO: Usando Console Email Backend")
    print("   Os emails serão exibidos no console, não enviados de verdade.")
    print()
    print("   Para usar Gmail:")
    print("   1. Ative 2FA em sua conta Google")
    print("   2. Gere uma senha de app em https://myaccount.google.com/apppasswords")
    print("   3. Atualize backend/.env com:")
    print("      EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend")
    print("      EMAIL_HOST_USER=seu-email@gmail.com")
    print("      EMAIL_HOST_PASSWORD=sua-senha-de-app")
    print()
else:
    # Tentar enviar email de teste
    print("Tentando enviar email de teste...")
    print()
    
    try:
        send_mail(
            'Teste de Email - Txopela Tour',
            'Este é um email de teste para verificar a configuração de email.',
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER],
            fail_silently=False,
        )
        print("✓ Email enviado com sucesso!")
        print(f"  Verifique sua caixa de entrada em: {settings.EMAIL_HOST_USER}")
        
    except Exception as e:
        print(f"✗ Erro ao enviar email:")
        print(f"  {type(e).__name__}: {str(e)}")
        print()
        print("Dicas de troubleshooting:")
        print("  - Verifique se EMAIL_HOST_USER e EMAIL_HOST_PASSWORD estão corretos")
        print("  - Se usar Gmail, certifique-se de usar uma senha de app (não a senha da conta)")
        print("  - Verifique se 2FA está ativado em sua conta Google")
        print("  - Tente desativar 'Menos seguro' se estiver usando senha da conta")

print()
print("=" * 60)
