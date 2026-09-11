"""
Script para verificar se todos os endpoints estão registrados corretamente no Django
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'txopela_api.settings')
django.setup()

from django.urls import get_resolver
from django.urls.exceptions import Resolver404

def get_all_urls(urlpatterns, prefix=''):
    """Recursively get all URL patterns"""
    urls = []
    
    for pattern in urlpatterns:
        if hasattr(pattern, 'url_patterns'):
            # Include pattern
            new_prefix = prefix + str(pattern.pattern)
            urls.extend(get_all_urls(pattern.url_patterns, new_prefix))
        else:
            # Regular pattern
            full_path = prefix + str(pattern.pattern)
            urls.append({
                'path': full_path,
                'name': pattern.name,
                'callback': str(pattern.callback) if hasattr(pattern, 'callback') else 'N/A'
            })
    
    return urls

def verify_urls():
    """Verify all registered URLs"""
    from django.conf import settings
    from django.urls import get_wsgi_application
    
    # Get URL resolver
    resolver = get_resolver()
    
    print("\n" + "="*100)
    print("VERIFICAÇÃO DE URLS REGISTRADAS NO DJANGO")
    print("="*100 + "\n")
    
    # Get all patterns
    all_urls = get_all_urls(resolver.url_patterns)
    
    # Group by category
    categories = {
        'admin': [],
        'auth': [],
        'users': [],
        'locations': [],
        'posts': [],
        'reviews': [],
        'notifications': [],
        'other': []
    }
    
    for url in all_urls:
        path = str(url['path'])
        
        if 'admin' in path:
            categories['admin'].append(url)
        elif 'auth' in path:
            categories['auth'].append(url)
        elif 'users' in path:
            categories['users'].append(url)
        elif 'locations' in path:
            categories['locations'].append(url)
        elif 'posts' in path:
            categories['posts'].append(url)
        elif 'reviews' in path:
            categories['reviews'].append(url)
        elif 'notifications' in path:
            categories['notifications'].append(url)
        else:
            categories['other'].append(url)
    
    # Print results
    total = 0
    for category, urls in categories.items():
        if urls:
            print(f"\n📌 {category.upper()}")
            print("-" * 100)
            for url in urls:
                print(f"  {str(url['path']):60} [{url['name']}]")
                total += 1
    
    print("\n" + "="*100)
    print(f"TOTAL: {total} URLS REGISTRADAS")
    print("="*100 + "\n")
    
    # Check for missing endpoints
    print("\n✅ VERIFICAÇÃO CONCLUÍDA")
    print("\nSe você vê todos os endpoints listados acima, significa que estão registrados corretamente.")
    print("Se algum endpoint está faltando, verifique os arquivos urls.py de cada app.\n")


if __name__ == "__main__":
    verify_urls()
