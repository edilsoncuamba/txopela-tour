# 🔬 DIAGNÓSTICO: Problemas de Encoding

Este documento ajuda a identificar ONDE está o problema de encoding.

---

## 🎯 MÉTODO DE DIAGNÓSTICO

### Passo 1: Identificar a Camada do Problema

```
┌──────────────┐
│  DATABASE    │ ← Problema aqui? Dados corrompidos armazenados
├──────────────┤
│  BACKEND     │ ← Problema aqui? Response incorreto
├──────────────┤
│  NETWORK     │ ← Problema aqui? Headers incorretos
├──────────────┤
│  FRONTEND    │ ← Problema aqui? Renderização incorreta
└──────────────┘
```

---

## 🔍 TESTE 1: DATABASE

### PostgreSQL:

```bash
# Conectar
psql -U postgres -d txopela_tour

# Testar diretamente
SELECT name FROM users LIMIT 1;

# ✅ Aparece correto? → Database OK
# ❌ Aparece "VisÃ£o"? → Database com problema
```

**Se Database tem problema:**
```sql
-- Verificar encoding
SHOW SERVER_ENCODING;    -- Deve ser UTF8
SHOW CLIENT_ENCODING;    -- Deve ser UTF8

-- Se não for UTF8:
ALTER DATABASE txopela_tour SET client_encoding TO 'UTF8';
```

### MySQL:

```bash
mysql -u root -p txopela_tour

# Testar
SELECT name FROM users LIMIT 1;

# Verificar encoding
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';
```

**Se MySQL tem problema:**
```sql
ALTER DATABASE txopela_tour 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

---

## 🔍 TESTE 2: BACKEND (Django Shell)

```python
# python manage.py shell

# 1. Verificar encoding do Python
import sys
print("Encoding:", sys.stdout.encoding)  # Deve ser: UTF-8

# 2. Testar query
from apps.users.models import User
user = User.objects.first()
print("Nome:", user.name)

# 3. Verificar representação exata
print("Repr:", repr(user.name))

# ✅ Aparece correto? → Backend leitura OK
# ❌ Aparece "VisÃ£o"? → Backend ou Database com problema

# 4. Testar encoding string
text = "Visão Geral"
print(text)
print(repr(text))

# ✅ Aparece correto? → Python encoding OK
# ❌ Erro ou quebrado? → Python encoding problema
```

---

## 🔍 TESTE 3: API RESPONSE (cURL)

```bash
# Teste 1: Verificar headers
curl -i http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer TOKEN"

# ✅ Verificar:
# Content-Type: application/json; charset=utf-8
#                                 ^^^^^^^^^^^^^^^ OBRIGATÓRIO

# Teste 2: Verificar body
curl -s http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer TOKEN" | jq .

# ✅ Aparece correto? → API Response OK
# ❌ Aparece "VisÃ£o"? → Backend response problema
```

---

## 🔍 TESTE 4: NETWORK (Browser DevTools)

```
1. Abrir aplicação no navegador
2. F12 → Network tab
3. Fazer uma requisição (ex: carregar perfil)
4. Clicar na requisição
5. Ver "Response Headers"
```

**Verificar:**
```
Content-Type: application/json; charset=utf-8
                                ^^^^^^^^^^^^^^ DEVE EXISTIR
```

**Ver "Response" (raw):**
```json
{
  "name": "Visão Geral"
}
```

**✅ Aparece correto no raw response?**
- SIM → Frontend tem problema
- NÃO → Backend tem problema

---

## 🔍 TESTE 5: FRONTEND (Console)

```javascript
// Abrir console do navegador (F12 → Console)

// Teste 1: Fetch raw
fetch('http://localhost:8000/api/users/me/', {
  headers: { Authorization: 'Bearer TOKEN' }
})
  .then(r => r.text())
  .then(text => {
    console.log('Raw text:', text);
    console.log('Parsed:', JSON.parse(text));
  });

// ✅ Aparece correto? → Frontend rendering problema
// ❌ Aparece "VisÃ£o"? → API problema

// Teste 2: Verificar variável
const text = "Visão Geral";
console.log(text);

// ✅ Aparece correto? → Browser OK
```

---

## 📊 MATRIZ DE DIAGNÓSTICO

| Teste | Resultado | Problema em | Solução |
|-------|-----------|-------------|---------|
| Database direto | ❌ Quebrado | DATABASE | Verificar encoding DB + corrigir dados |
| Django shell | ❌ Quebrado | BACKEND LEITURA | Verificar DATABASE OPTIONS em settings.py |
| Django shell (string) | ❌ Quebrado | PYTHON ENCODING | Adicionar sys.stdout.reconfigure(encoding='utf-8') |
| cURL headers | ❌ Sem charset | BACKEND RESPONSE | Adicionar middleware ForceUTF8 |
| cURL body | ❌ Quebrado | BACKEND SERIALIZATION | Verificar REST_FRAMEWORK UNICODE_JSON |
| Browser Network raw | ❌ Quebrado | API | Corrigir backend |
| Browser Network raw | ✅ Correto, mas UI ❌ | FRONTEND | Verificar meta charset, remover decode manual |

---

## 🎯 CENÁRIOS COMUNS

### Cenário 1: Database OK, Backend Quebrado

**Sintomas:**
- `SELECT name FROM users` → Aparece correto
- Django shell → Aparece quebrado

**Causa:** Connection encoding incorreto

**Solução:**
```python
# settings.py
DATABASES = {
    'default': {
        'OPTIONS': {
            'client_encoding': 'UTF8',  # ← ADICIONAR
        }
    }
}
```

---

### Cenário 2: Backend OK, Response Quebrado

**Sintomas:**
- Django shell → Aparece correto
- cURL → Aparece quebrado

**Causa:** Serialização incorreta

**Solução:**
```python
# settings.py
REST_FRAMEWORK = {
    'UNICODE_JSON': True,  # ← ADICIONAR
}
```

---

### Cenário 3: Response OK, Frontend Quebrado

**Sintomas:**
- cURL → Aparece correto
- Browser Network raw → Aparece correto
- UI renderizada → Aparece quebrado

**Causa:** Frontend manipulando encoding

**Solução:**
```typescript
// Remover qualquer:
// decodeURIComponent(escape(text))
// atob(text)
// Buffer.from(...)

// Usar diretamente:
const data = await res.json();
```

---

### Cenário 4: Tudo OK exceto Headers

**Sintomas:**
- Tudo funciona mas headers sem charset

**Causa:** Middleware ausente

**Solução:**
```python
# Criar e registrar ForceUTF8Middleware
# Ver: 🔤_CORRECAO_ENCODING_UTF8.md linha 227
```

---

### Cenário 5: Dados Corrompidos na Database

**Sintomas:**
- `SELECT name` → "VisÃ£o Geral" (quebrado no database)

**Causa:** Dados foram inseridos com encoding incorreto

**Solução:**
```python
# Script de correção de dados
# Ver: 🔤_CORRECAO_ENCODING_UTF8.md linha 570

def fix_text(text):
    try:
        return text.encode('latin1').decode('utf-8')
    except:
        return text

for user in User.objects.all():
    user.name = fix_text(user.name)
    user.save()
```

---

## 🧪 SCRIPT DE DIAGNÓSTICO AUTOMÁTICO

**Criar:** `diagnose_encoding.py`

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script de diagnóstico de encoding.
USO: python diagnose_encoding.py
"""

import sys
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model

User = get_user_model()

print("\n" + "="*60)
print("DIAGNÓSTICO DE ENCODING")
print("="*60)

# 1. Python Encoding
print("\n1️⃣ PYTHON ENCODING:")
print(f"  stdout: {sys.stdout.encoding}")
print(f"  stderr: {sys.stderr.encoding}")
print(f"  filesystem: {sys.getfilesystemencoding()}")

# 2. Django Settings
print("\n2️⃣ DJANGO SETTINGS:")
from django.conf import settings
print(f"  DEFAULT_CHARSET: {getattr(settings, 'DEFAULT_CHARSET', 'NOT SET')}")
print(f"  FILE_CHARSET: {getattr(settings, 'FILE_CHARSET', 'NOT SET')}")

# 3. Database Encoding
print("\n3️⃣ DATABASE ENCODING:")
cursor = connection.cursor()
try:
    cursor.execute("SHOW SERVER_ENCODING;")
    print(f"  PostgreSQL Server: {cursor.fetchone()[0]}")
    cursor.execute("SHOW CLIENT_ENCODING;")
    print(f"  PostgreSQL Client: {cursor.fetchone()[0]}")
except:
    try:
        cursor.execute("SHOW VARIABLES LIKE 'character_set_database';")
        print(f"  MySQL Database: {cursor.fetchone()[1]}")
    except:
        print("  SQLite (UTF-8 padrão)")

# 4. Teste de String
print("\n4️⃣ TESTE DE STRING:")
test_str = "Visão Geral, Serviços, Histórico"
print(f"  Teste: {test_str}")
print(f"  Repr: {repr(test_str)}")

# 5. Teste de Database
print("\n5️⃣ TESTE DE DATABASE:")
user = User.objects.first()
if user:
    print(f"  User name: {user.name}")
    print(f"  User repr: {repr(user.name)}")
    
    # Verificar se está corrompido
    if 'Ã' in user.name:
        print("  ⚠️  DADOS CORROMPIDOS DETECTADOS!")
        print("  Execute script de correção de dados.")
    else:
        print("  ✅ Dados parecem OK")
else:
    print("  ⚠️  Nenhum usuário encontrado")

# 6. REST Framework
print("\n6️⃣ REST FRAMEWORK:")
try:
    rest_settings = settings.REST_FRAMEWORK
    print(f"  UNICODE_JSON: {rest_settings.get('UNICODE_JSON', 'NOT SET')}")
except AttributeError:
    print("  ⚠️  REST_FRAMEWORK não configurado")

print("\n" + "="*60)
print("FIM DO DIAGNÓSTICO")
print("="*60 + "\n")

# Conclusão
print("📋 PRÓXIMOS PASSOS:")
if sys.stdout.encoding != 'UTF-8':
    print("  ❌ Configurar sys.stdout.reconfigure(encoding='utf-8')")
if 'Ã' in (user.name if user else ''):
    print("  ❌ Executar script de correção de dados")
if not hasattr(settings, 'DEFAULT_CHARSET'):
    print("  ❌ Adicionar DEFAULT_CHARSET = 'utf-8' em settings.py")
print("  📖 Ver: 🔤_CORRECAO_ENCODING_UTF8.md")
print()
```

**Executar:**
```bash
python diagnose_encoding.py
```

---

## 📞 INTERPRETAÇÃO DOS RESULTADOS

### ✅ TUDO OK:
```
1️⃣ PYTHON ENCODING:
  stdout: UTF-8
  stderr: UTF-8

3️⃣ DATABASE ENCODING:
  PostgreSQL Server: UTF8
  PostgreSQL Client: UTF8

4️⃣ TESTE DE STRING:
  Teste: Visão Geral, Serviços, Histórico

5️⃣ TESTE DE DATABASE:
  User name: João Silva
  ✅ Dados parecem OK

6️⃣ REST FRAMEWORK:
  UNICODE_JSON: True
```

### ❌ PROBLEMAS DETECTADOS:
```
1️⃣ PYTHON ENCODING:
  stdout: cp1252  ← ❌ PROBLEMA

3️⃣ DATABASE ENCODING:
  PostgreSQL Client: LATIN1  ← ❌ PROBLEMA

5️⃣ TESTE DE DATABASE:
  User name: VisÃ£o Geral  ← ❌ DADOS CORROMPIDOS

6️⃣ REST FRAMEWORK:
  UNICODE_JSON: NOT SET  ← ❌ PROBLEMA
```

---

**Data:** 29 de Junho de 2026  
**Uso:** Diagnóstico antes da correção  
**Documentação:** `🔤_CORRECAO_ENCODING_UTF8.md`
