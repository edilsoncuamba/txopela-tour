# ⚡ CORREÇÃO RÁPIDA: Encoding UTF-8

**Problema:** "VisÃ£o Geral", "ServiÃ§os", "HistÃ³rico"  
**Tempo Estimado:** 30 minutos  
**Documentação Completa:** `🔤_CORRECAO_ENCODING_UTF8.md`

---

## 🎯 ORDEM DE EXECUÇÃO

```
1. Backend Settings    (5 min)  ← MAIS IMPORTANTE
2. Middleware          (5 min)
3. Database           (5 min)
4. Frontend HTML      (2 min)
5. Testar             (10 min)
6. Corrigir Dados     (SE NECESSÁRIO)
```

---

## 1️⃣ BACKEND: settings.py

**Arquivo:** `config/settings.py` ou `backend/settings.py`

**ADICIONAR no topo do arquivo:**

```python
# -*- coding: utf-8 -*-
import sys

# Forçar UTF-8
if sys.stdout.encoding != 'UTF-8':
    sys.stdout.reconfigure(encoding='utf-8')

DEFAULT_CHARSET = 'utf-8'
FILE_CHARSET = 'utf-8'
```

**MODIFICAR a seção DATABASES:**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',  # ou mysql
        'NAME': 'txopela_tour',
        'USER': '...',
        'PASSWORD': '...',
        'HOST': '...',
        'PORT': '...',
        'OPTIONS': {
            'client_encoding': 'UTF8',  # ← ADICIONAR
        },
    }
}
```

**MODIFICAR/ADICIONAR REST_FRAMEWORK:**

```python
REST_FRAMEWORK = {
    # ... configurações existentes
    'UNICODE_JSON': True,  # ← ADICIONAR
}
```

---

## 2️⃣ MIDDLEWARE UTF-8

**Criar arquivo:** `apps/core/middleware.py`

```python
# -*- coding: utf-8 -*-

class ForceUTF8Middleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        if 'Content-Type' in response and 'charset' not in response['Content-Type']:
            if 'application/json' in response['Content-Type']:
                response['Content-Type'] = 'application/json; charset=utf-8'
        
        return response
```

**Registrar em settings.py:**

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'apps.core.middleware.ForceUTF8Middleware',  # ← ADICIONAR AQUI
    'django.contrib.sessions.middleware.SessionMiddleware',
    # ... resto
]
```

---

## 3️⃣ DATABASE (PostgreSQL)

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Verificar encoding
\c txopela_tour
SHOW SERVER_ENCODING;
SHOW CLIENT_ENCODING;

# Se não for UTF8, ajustar
ALTER DATABASE txopela_tour SET client_encoding TO 'UTF8';
```

**OU (MySQL):**

```sql
-- Conectar ao MySQL
mysql -u root -p

-- Verificar encoding
USE txopela_tour;
SHOW VARIABLES LIKE 'character_set%';

-- Ajustar se necessário
ALTER DATABASE txopela_tour CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 4️⃣ FRONTEND: index.html

**Arquivo:** `app/index.html`

**VERIFICAR/ADICIONAR no <head>:**

```html
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">  <!-- ← OBRIGATÓRIO -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Txopela Tour</title>
</head>
```

---

## 5️⃣ TESTAR

### Teste Backend:

```bash
# Reiniciar backend
python manage.py runserver

# Em outro terminal:
curl -i http://localhost:8000/api/users/me/ -H "Authorization: Bearer TOKEN"

# ✅ Verificar header:
# Content-Type: application/json; charset=utf-8
```

### Teste Frontend:

```bash
# Abrir navegador
# F12 → Network → XHR
# Fazer login e navegar
# ✅ Verificar responses: textos devem aparecer corretos
```

---

## 6️⃣ CORRIGIR DADOS (Se Necessário)

**SE textos ainda aparecerem quebrados:**

```python
# manage.py shell

# Teste rápido
from apps.users.models import User
user = User.objects.first()
print(user.name)

# Se aparecer "VisÃ£o", dados estão corrompidos
# Executar script de correção:
```

**Copiar script de `🔤_CORRECAO_ENCODING_UTF8.md` (linha 570)**

---

## ✅ CHECKLIST MÍNIMO

- [ ] ✅ `settings.py` → DEFAULT_CHARSET = 'utf-8'
- [ ] ✅ `settings.py` → DATABASES OPTIONS client_encoding
- [ ] ✅ `settings.py` → REST_FRAMEWORK UNICODE_JSON
- [ ] ✅ Middleware criado e registrado
- [ ] ✅ Database encoding verificado
- [ ] ✅ `index.html` com meta charset UTF-8
- [ ] ✅ Backend reiniciado
- [ ] ✅ Frontend testado
- [ ] ✅ Textos aparecem corretos

---

## 🚨 SE AINDA NÃO FUNCIONAR

### Verificar:

1. **Backend logs** ao iniciar:
```bash
python manage.py runserver
# Procurar warnings de encoding
```

2. **Response header**:
```bash
curl -i http://localhost:8000/api/endpoint/
# Deve ter: Content-Type: application/json; charset=utf-8
```

3. **Frontend console**:
```javascript
// Abrir console do navegador
fetch('/api/users/me/', {headers: {Authorization: 'Bearer TOKEN'}})
  .then(r => r.text())
  .then(console.log)
// Verificar se texto está correto
```

4. **Database connection**:
```python
# manage.py shell
from django.db import connection
cursor = connection.cursor()
cursor.execute("SHOW CLIENT_ENCODING;")
print(cursor.fetchone())  # Deve ser UTF8
```

---

## 📞 PROBLEMAS COMUNS

### "UnicodeDecodeError" ao iniciar Django:
```python
# Adicionar no topo de manage.py:
# -*- coding: utf-8 -*-
```

### Textos ainda quebrados após correção:
- Dados podem estar corrompidos na DB
- Executar script de correção de dados
- Ver: `🔤_CORRECAO_ENCODING_UTF8.md` linha 570

### Middleware não funciona:
- Verificar se está registrado ANTES dos outros middlewares
- Verificar imports corretos
- Reiniciar servidor Django

---

**Data:** 29 de Junho de 2026  
**Tempo:** 30 minutos  
**Dificuldade:** Baixa  
**Documentação Completa:** `🔤_CORRECAO_ENCODING_UTF8.md`
