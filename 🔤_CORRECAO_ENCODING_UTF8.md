# 🔤 CORREÇÃO GLOBAL: Encoding UTF-8

**Problema:** Textos aparecem como "VisÃ£o Geral", "ServiÃ§os", "HistÃ³rico"  
**Causa:** Encoding incorreto (ISO-8859-1/Latin1 interpretado como UTF-8)  
**Prioridade:** 🔴 CRÍTICA  
**Tipo de Correção:** GLOBAL E DEFINITIVA

---

## 🚨 DIAGNÓSTICO

### O Que Está Acontecendo:
```
CORRETO:  "Visão Geral"
QUEBRADO: "VisÃ£o Geral"

CORRETO:  "Serviços"
QUEBRADO: "ServiÃ§os"

CORRETO:  "Histórico"
QUEBRADO: "HistÃ³rico"

CORRETO:  "Não há conteúdo"
QUEBRADO: "NÃ£o hÃ¡ conteÃºdo"
```

### Causa Técnica:
- Texto está em **UTF-8** mas está sendo **interpretado como ISO-8859-1 (Latin1)**
- OU: Texto está em **ISO-8859-1** e frontend espera **UTF-8**
- Resultado: **Double encoding** ou **encoding mismatch**

---

## 🎯 SOLUÇÃO GLOBAL

### Estratégia de 3 Camadas:

```
┌─────────────────────────────────────────────┐
│ 1. BASE DE DADOS → UTF-8                    │
├─────────────────────────────────────────────┤
│ 2. BACKEND (Django) → UTF-8                 │
│    - Settings                               │
│    - Database connection                    │
│    - API responses                          │
│    - File encoding                          │
├─────────────────────────────────────────────┤
│ 3. FRONTEND (React) → UTF-8                 │
│    - HTML meta tag                          │
│    - API requests/responses                 │
│    - Evitar manipulação de encoding        │
└─────────────────────────────────────────────┘
```

---

## 🔧 CORREÇÃO 1: BASE DE DADOS

### Para PostgreSQL:

```sql
-- 1. Verificar encoding atual
SHOW SERVER_ENCODING;
SHOW CLIENT_ENCODING;

-- 2. Se não for UTF8, recriar database
-- (CUIDADO: Fazer backup primeiro!)
DROP DATABASE txopela_tour;
CREATE DATABASE txopela_tour
  WITH ENCODING 'UTF8'
  LC_COLLATE = 'pt_PT.UTF-8'
  LC_CTYPE = 'pt_PT.UTF-8'
  TEMPLATE = template0;

-- 3. Ou alterar encoding de database existente
ALTER DATABASE txopela_tour SET client_encoding TO 'UTF8';
```

### Para MySQL/MariaDB:

```sql
-- 1. Verificar encoding atual
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- 2. Alterar database
ALTER DATABASE txopela_tour
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 3. Alterar todas as tabelas
SET @DATABASE_NAME = 'txopela_tour';

SELECT CONCAT('ALTER TABLE ', table_name, ' CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
FROM information_schema.tables
WHERE table_schema = @DATABASE_NAME;

-- Copiar output e executar cada comando
```

### Para SQLite:
```python
# SQLite usa UTF-8 por padrão, verificar connection string no settings.py
```

---

## 🔧 CORREÇÃO 2: BACKEND (Django)

### Arquivo: `config/settings.py` ou `settings.py`

**ADICIONAR/VERIFICAR:**

```python
# ============================================
# ENCODING UTF-8 GLOBAL
# ============================================

import sys
import locale

# 1. Definir encoding padrão do Python
if sys.stdout.encoding != 'UTF-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'UTF-8':
    sys.stderr.reconfigure(encoding='utf-8')

# 2. Definir locale
try:
    locale.setlocale(locale.LC_ALL, 'pt_PT.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
    except:
        pass  # Manter locale padrão

# 3. Django settings
DEFAULT_CHARSET = 'utf-8'
FILE_CHARSET = 'utf-8'

# ============================================
# DATABASE ENCODING
# ============================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',  # ou mysql, etc
        'NAME': 'txopela_tour',
        'USER': '...',
        'PASSWORD': '...',
        'HOST': '...',
        'PORT': '...',
        'OPTIONS': {
            # PostgreSQL
            'client_encoding': 'UTF8',
            
            # MySQL/MariaDB (se usar)
            # 'charset': 'utf8mb4',
            # 'init_command': "SET sql_mode='STRICT_TRANS_TABLES', innodb_strict_mode=1",
        },
    }
}

# ============================================
# MIDDLEWARE DE ENCODING
# ============================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',  # ← Garante charset correto
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # ... outros middlewares
]

# ============================================
# LOCALE E TIMEZONE
# ============================================

LANGUAGE_CODE = 'pt-pt'  # ou 'pt-br'
TIME_ZONE = 'Africa/Maputo'  # ou 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True
```

---

## 🔧 CORREÇÃO 3: API RESPONSES (Django REST Framework)

### Arquivo: `config/settings.py`

**ADICIONAR:**

```python
# ============================================
# REST FRAMEWORK UTF-8
# ============================================

REST_FRAMEWORK = {
    # ... outras configurações existentes
    
    # ✅ Forçar UTF-8 em todas as respostas
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    
    # ✅ Charset padrão
    'UNICODE_JSON': True,  # Não escapar caracteres Unicode
}
```

### Criar Middleware Customizado (Opcional mas Recomendado):

**Arquivo:** `apps/core/middleware.py` (criar se não existir)

```python
# apps/core/middleware.py

class ForceUTF8Middleware:
    """
    Middleware para garantir que TODAS as respostas usam UTF-8.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Forçar UTF-8 em todas as respostas
        if 'Content-Type' in response:
            if 'charset' not in response['Content-Type']:
                if 'application/json' in response['Content-Type']:
                    response['Content-Type'] = 'application/json; charset=utf-8'
                elif 'text/html' in response['Content-Type']:
                    response['Content-Type'] = 'text/html; charset=utf-8'
                elif 'text/plain' in response['Content-Type']:
                    response['Content-Type'] = 'text/plain; charset=utf-8'
        
        return response
```

**Registrar no `settings.py`:**

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'apps.core.middleware.ForceUTF8Middleware',  # ← ADICIONAR NO TOPO
    'django.contrib.sessions.middleware.SessionMiddleware',
    # ... resto dos middlewares
]
```

---

## 🔧 CORREÇÃO 4: VIEWS E SERIALIZERS

### Garantir Encoding em Views:

```python
# views.py (qualquer view)

from django.http import JsonResponse
from rest_framework.response import Response

class MyView(APIView):
    def get(self, request):
        data = {
            'message': 'Visão Geral',
            'servicos': 'Serviços disponíveis',
            'historico': 'Histórico de ações'
        }
        
        # ✅ DRF Response (recomendado)
        return Response(data)
        
        # ✅ OU JsonResponse com ensure_ascii=False
        # return JsonResponse(data, json_dumps_params={'ensure_ascii': False})
```

### Verificar Serializers:

```python
# serializers.py

from rest_framework import serializers

class MySerializer(serializers.ModelSerializer):
    class Meta:
        model = MyModel
        fields = ['id', 'name', 'description', ...]
    
    # ✅ NENHUMA manipulação de encoding necessária
    # DRF serializers preservam UTF-8 automaticamente
```

---

## 🔧 CORREÇÃO 5: ARQUIVOS PYTHON

### Garantir que TODOS os arquivos .py usam UTF-8:

**Adicionar no TOPO de CADA arquivo Python (se não existir):**

```python
# -*- coding: utf-8 -*-
```

**OU (Python 3.0+, padrão mas explícito):**

```python
# coding: utf-8
```

**IMPORTANTE:** Se usar VS Code, configurar:

**Arquivo:** `.vscode/settings.json`

```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "[python]": {
    "files.encoding": "utf8"
  }
}
```

---

## 🔧 CORREÇÃO 6: FRONTEND (React/Vite)

### 1. Garantir Meta Tag HTML:

**Arquivo:** `app/index.html`

```html
<!DOCTYPE html>
<html lang="pt">
<head>
  <!-- ✅ OBRIGATÓRIO: Meta charset UTF-8 -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Txopela Tour</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

### 2. Verificar Vite Config:

**Arquivo:** `app/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ✅ Garantir encoding
  build: {
    charset: 'utf8'
  }
})
```

### 3. Verificar Fetch/Axios NÃO Manipula Encoding:

**Arquivo:** `app/src/services/api.ts`

**VERIFICAR:**

```typescript
// ✅ CORRETO: Não forçar encoding
async function apiFetch<T>(endpoint: string, opts: RequestInit = {}) {
  const url = `${getBaseUrl()}${endpoint}`;
  const hdrs: Record<string, string> = {
    'Content-Type': 'application/json',  // ← SEM charset aqui
    Accept: 'application/json',          // ← SEM charset aqui
    ...(opts.headers as Record<string, string>),
  };
  
  // ... resto do código
  
  // ✅ NUNCA fazer:
  // const text = await res.text();
  // const decoded = decodeURIComponent(escape(text));  // ❌ ERRADO!
  
  // ✅ SEMPRE fazer:
  const data = await res.json();  // Automático UTF-8
  return { data };
}
```

**REMOVER qualquer código como:**

```typescript
// ❌ REMOVER se existir:
// decodeURIComponent(escape(text))
// atob(text)
// Buffer.from(text, 'latin1').toString('utf8')
// iconv.decode(...)
// etc.
```

### 4. Renderização Direta no React:

```tsx
// ✅ CORRETO: Renderização direta
function MyComponent() {
  const [data, setData] = useState({ message: '' });
  
  useEffect(() => {
    fetch('/api/endpoint')
      .then(res => res.json())  // ← Automático UTF-8
      .then(setData);
  }, []);
  
  return (
    <div>
      <h1>{data.message}</h1>  {/* ← Renderização direta */}
    </div>
  );
}

// ❌ NUNCA fazer manipulação manual:
// <h1>{decodeText(data.message)}</h1>
```

---

## 🧪 TESTES DE VERIFICAÇÃO

### Teste 1: Backend Response

```bash
# Testar endpoint diretamente
curl -i http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer TOKEN"

# ✅ Verificar header:
# Content-Type: application/json; charset=utf-8

# ✅ Verificar body:
# {"name": "Visão Geral"}  (não "VisÃ£o Geral")
```

### Teste 2: Python Encoding

```python
# manage.py shell

# Teste básico
text = "Visão Geral, Serviços, Histórico"
print(text)  # Deve aparecer correto

# Teste de encoding
import sys
print(sys.stdout.encoding)  # Deve ser: UTF-8

# Teste de database
from django.db import connection
cursor = connection.cursor()
cursor.execute("SHOW SERVER_ENCODING;")  # PostgreSQL
# ou
cursor.execute("SHOW VARIABLES LIKE 'character_set_database';")  # MySQL
print(cursor.fetchone())  # Deve ser: UTF8 ou utf8mb4
```

### Teste 3: API Real

**Criar script:** `test_encoding.py`

```python
import requests
import json

# Login
login_res = requests.post('http://localhost:8000/api/auth/login/', json={
    'email': 'test@test.com',
    'password': '123456'
})
token = login_res.json()['token']

# Testar endpoint
res = requests.get('http://localhost:8000/api/users/me/', headers={
    'Authorization': f'Bearer {token}'
})

print("Status:", res.status_code)
print("Encoding:", res.encoding)
print("Content-Type:", res.headers.get('Content-Type'))
print("\nBody:")
data = res.json()
print(json.dumps(data, indent=2, ensure_ascii=False))

# ✅ Deve imprimir caracteres portugueses corretamente
```

---

## 🔍 DIAGNÓSTICO DE DADOS CORROMPIDOS

### Se dados JÁ estão corrompidos na base de dados:

```python
# manage.py shell

from apps.users.models import User  # ajustar imports

# 1. Verificar dados
user = User.objects.first()
print(repr(user.name))  # Mostra representação exata

# 2. Se aparecer: 'VisÃ£o Geral'
# Significa que está armazenado errado na DB

# 3. Corrigir dados (SE NECESSÁRIO):
def fix_encoding(text):
    """Corrige double-encoding UTF-8."""
    try:
        # Tenta reverter interpretação incorreta
        return text.encode('latin1').decode('utf-8')
    except:
        return text

# Aplicar a todos os registros
for user in User.objects.all():
    user.name = fix_encoding(user.name)
    user.bio = fix_encoding(user.bio) if user.bio else ''
    user.save()

print("✅ Dados corrigidos!")
```

### Script Completo de Correção de Dados:

**Criar:** `fix_encoding_data.py`

```python
"""
Script para corrigir encoding de dados já corrompidos na base de dados.
USO: python manage.py shell < fix_encoding_data.py
"""

import sys
from django.contrib.auth import get_user_model
from apps.locals.models import Local
from apps.services.models import Service
from apps.posts.models import Post

User = get_user_model()

def fix_text(text):
    """Corrige double-encoding UTF-8 → Latin1 → UTF-8."""
    if not text:
        return text
    
    try:
        # Texto está em UTF-8 mas foi interpretado como Latin1
        # Reverter: encode como Latin1, decode como UTF-8
        fixed = text.encode('latin1').decode('utf-8')
        return fixed
    except (UnicodeDecodeError, UnicodeEncodeError):
        # Se falhar, manter original
        return text

print("\n" + "="*60)
print("CORREÇÃO DE ENCODING DE DADOS")
print("="*60)

# Corrigir Users
print("\n📝 Corrigindo Users...")
users_count = 0
for user in User.objects.all():
    changed = False
    if user.name and 'Ã' in user.name:
        user.name = fix_text(user.name)
        changed = True
    if user.bio and 'Ã' in user.bio:
        user.bio = fix_text(user.bio)
        changed = True
    if changed:
        user.save()
        users_count += 1
        print(f"  ✅ {user.id}: {user.name}")

print(f"📊 Users corrigidos: {users_count}")

# Corrigir Locals
print("\n📍 Corrigindo Locals...")
locals_count = 0
for local in Local.objects.all():
    changed = False
    if local.name and 'Ã' in local.name:
        local.name = fix_text(local.name)
        changed = True
    if local.description and 'Ã' in local.description:
        local.description = fix_text(local.description)
        changed = True
    if changed:
        local.save()
        locals_count += 1
        print(f"  ✅ {local.id}: {local.name}")

print(f"📊 Locals corrigidos: {locals_count}")

# Corrigir Services
print("\n🛎️ Corrigindo Services...")
services_count = 0
for service in Service.objects.all():
    changed = False
    if service.title and 'Ã' in service.title:
        service.title = fix_text(service.title)
        changed = True
    if service.description and 'Ã' in service.description:
        service.description = fix_text(service.description)
        changed = True
    if changed:
        service.save()
        services_count += 1
        print(f"  ✅ {service.id}: {service.title}")

print(f"📊 Services corrigidos: {services_count}")

# Corrigir Posts
print("\n📝 Corrigindo Posts...")
posts_count = 0
for post in Post.objects.all():
    changed = False
    if post.title and 'Ã' in post.title:
        post.title = fix_text(post.title)
        changed = True
    if post.content and 'Ã' in post.content:
        post.content = fix_text(post.content)
        changed = True
    if changed:
        post.save()
        posts_count += 1
        print(f"  ✅ {post.id}: {post.title}")

print(f"📊 Posts corrigidos: {posts_count}")

print("\n" + "="*60)
print("✅ CORREÇÃO CONCLUÍDA!")
print(f"Total corrigido: {users_count + locals_count + services_count + posts_count}")
print("="*60 + "\n")
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Base de Dados:
- [ ] Verificar encoding (deve ser UTF8 ou utf8mb4)
- [ ] Alterar se necessário
- [ ] Fazer backup antes de qualquer mudança

### Backend Django:
- [ ] `settings.py` → Adicionar configurações UTF-8
- [ ] `settings.py` → DATABASE OPTIONS com client_encoding
- [ ] `settings.py` → REST_FRAMEWORK com UNICODE_JSON
- [ ] Criar middleware `ForceUTF8Middleware`
- [ ] Registrar middleware em MIDDLEWARE
- [ ] Adicionar `# -*- coding: utf-8 -*-` em arquivos Python
- [ ] Configurar `.vscode/settings.json`

### Frontend React:
- [ ] `index.html` → Meta charset UTF-8
- [ ] `vite.config.ts` → build.charset = 'utf8'
- [ ] `api.ts` → Remover manipulação de encoding
- [ ] Componentes → Renderização direta sem decode

### Dados Corrompidos (Se Necessário):
- [ ] Executar `test_encoding.py` para diagnóstico
- [ ] Se corrompido, executar `fix_encoding_data.py`
- [ ] Verificar correção

### Testes:
- [ ] Teste 1: curl -i (verificar header)
- [ ] Teste 2: Django shell (verificar encoding)
- [ ] Teste 3: API real (verificar resposta)
- [ ] Teste 4: Frontend (verificar renderização)

---

## ✅ RESULTADO ESPERADO

### Antes:
```
❌ "VisÃ£o Geral"
❌ "ServiÃ§os"
❌ "HistÃ³rico"
❌ "NÃ£o hÃ¡ conteÃºdo"
```

### Depois:
```
✅ "Visão Geral"
✅ "Serviços"
✅ "Histórico"
✅ "Não há conteúdo"
```

---

**Data:** 29 de Junho de 2026  
**Prioridade:** 🔴 CRÍTICA  
**Tipo:** Correção Global UTF-8  
**Impacto:** Todo o sistema
