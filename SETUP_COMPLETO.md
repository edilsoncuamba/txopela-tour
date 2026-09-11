# 🚀 Setup Completo - Feed de Descobertas

## 📋 Problema Atual

1. ✅ **Backend funcionando** - Responde 200 OK
2. ✅ **Frontend funcionando** - Requisições corretas
3. ❌ **Contas de teste não existem** - Login falha
4. ❌ **Banco sem locais** - Feed vazio

---

## ⚡ Solução Rápida (5 minutos)

### Passo 1: Criar Contas de Teste

```bash
# No diretório do backend (onde está manage.py)
cd backend

# Executar script
python ../create_test_accounts.py
```

**Resultado esperado:**
```
✅ Criados: 3
📊 Total de usuários: 3

| Tipo | Email | Senha | Role |
|------|-------|--------|------|
| 🧳 Turista | turista@gmail.com | T123456 | tourist |
| 🎯 Guia | servico@gmail.com | S123456 | guide |
| 🏢 Negócio | negociantenormal@gmail.com | N123456 | business |
```

### Passo 2: Popular Locais

```bash
# Ainda no diretório do backend
python ../seed_locals_quick.py
```

**Resultado esperado:**
```
✅ Criados: 10 locais
📊 Total no banco: 10 locais
✓  Aprovados: 10
```

### Passo 3: Testar Login

```bash
# PowerShell
$body = @{email="turista@gmail.com";password="T123456"} | ConvertTo-Json
$response = Invoke-WebRequest -Uri "http://192.168.88.89:8000/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$response.Content
```

**Resposta esperada:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": {
    "email": "turista@gmail.com",
    "name": "João Turista",
    "role": "tourist"
  }
}
```

### Passo 4: Testar Locais

```bash
# PowerShell
Invoke-WebRequest -Uri "http://192.168.88.89:8000/api/locals?limit=5" -UseBasicParsing
```

**Resposta esperada:**
```json
{
  "success": true,
  "locals": [
    {
      "id": "...",
      "name": "Praia de Tofo",
      "category": "attraction",
      "province": "Inhambane",
      "status": "approved"
    },
    ...
  ]
}
```

### Passo 5: Testar no App

```bash
# 1. Abrir app
http://localhost:5173

# 2. Fazer login
Email: turista@gmail.com
Senha: T123456

# 3. Ir para "Descobertas" no menu inferior
# 4. Deve mostrar 10 locais!
```

---

## 📝 Scripts Criados

### 1. `create_test_accounts.py`

**O que faz:**
- Cria 3 contas de teste (turista, guia, negócio)
- Define roles corretos para cada tipo
- Configura senhas conhecidas
- Ativa contas automaticamente

**Contas criadas:**

| Email | Senha | Role | Frontend Mostra |
|-------|--------|------|-----------------|
| turista@gmail.com | T123456 | `tourist` | "Sugerir Local" |
| servico@gmail.com | S123456 | `guide` | "Sugerir Serviço" |
| negociantenormal@gmail.com | N123456 | `business` | "Sugerir Serviço" |

### 2. `seed_locals_quick.py`

**O que faz:**
- Cria 10 locais de exemplo
- Todos com `status='approved'`
- Distribuídos por várias províncias
- Com coordenadas GPS reais
- Categorias variadas (praias, hotéis, restaurantes)

**Locais criados:**
1. Praia de Tofo (Inhambane)
2. Ilha de Moçambique (Nampula)
3. Parque Nacional de Gorongosa (Sofala)
4. Restaurante Zambi (Maputo)
5. Hotel Pestana Rovuma (Maputo)
6. Mercado Central (Maputo)
7. Praia do Wimbe (Cabo Delgado)
8. Casa de Ferro (Maputo)
9. Arquipélago de Bazaruto (Inhambane)
10. Restaurante Costa do Sol (Maputo)

---

## 🔍 Verificação Passo a Passo

### 1. Verificar Contas no Banco

```bash
# Django shell
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
User = get_user_model()

# Listar contas de teste
for user in User.objects.filter(email__contains='@gmail.com'):
    print(f"{user.email} → role: {user.role}")

# Deve mostrar:
# turista@gmail.com → role: tourist
# servico@gmail.com → role: guide
# negociantenormal@gmail.com → role: business
```

### 2. Verificar Locais no Banco

```python
from locals.models import Local

print(f"Total: {Local.objects.count()}")
print(f"Aprovados: {Local.objects.filter(status='approved').count()}")

# Listar primeiros 5
for local in Local.objects.all()[:5]:
    print(f"- {local.name} | {local.province} | {local.status}")
```

### 3. Testar Autenticação

```python
from django.contrib.auth import authenticate

# Testar login
user = authenticate(email='turista@gmail.com', password='T123456')
if user:
    print(f"✅ Login OK: {user.email} (role: {user.role})")
else:
    print("❌ Login FALHOU!")
```

---

## 🐛 Troubleshooting

### Problema: "Email ou password incorretos"

**Causa:** Conta não existe ou senha incorreta

**Solução:**
```bash
# Executar novamente
python create_test_accounts.py

# Isso vai ATUALIZAR as contas existentes com as senhas corretas
```

### Problema: "Locais ainda vazios"

**Causa:** Script não encontrou model ou owner

**Solução 1: Verificar model**
```python
# Django shell
from locals.models import Local
print(Local._meta.fields)  # Ver campos disponíveis
```

**Solução 2: Criar manualmente**
```python
from locals.models import Local
from django.contrib.auth import get_user_model

User = get_user_model()
owner = User.objects.first()

Local.objects.create(
    name='Praia de Tofo',
    description='Linda praia em Inhambane',
    category='attraction',
    province='Inhambane',
    status='approved',
    owner=owner
)
```

### Problema: "ImportError: No module named locals"

**Causa:** Nome do app Django pode ser diferente

**Solução:** Ajustar import no script
```python
# Tentar:
from places.models import Local  # ou
from destinations.models import Local  # ou
from locations.models import Local
```

**Para descobrir o nome correto:**
```bash
# Listar apps instalados
python manage.py showmigrations
```

---

## 📊 Checklist Final

### Backend
- [ ] Servidor Django rodando
- [ ] 3 contas de teste criadas
- [ ] 10 locais cadastrados e aprovados
- [ ] Endpoint `/api/auth/login` funciona
- [ ] Endpoint `/api/locals` retorna dados

### Frontend
- [ ] `.env` configurado
- [ ] Servidor dev rodando
- [ ] Login com `turista@gmail.com` funciona
- [ ] Feed de descobertas mostra 10 locais
- [ ] Filtros por categoria funcionam
- [ ] Clicar em local abre detalhes

### Testes de Role
- [ ] Login como **turista** → Mostra "Sugerir Local"
- [ ] Login como **servico** → Mostra "Sugerir Serviço"
- [ ] Login como **negociante** → Mostra "Sugerir Serviço"

---

## 🎯 Ordem de Execução

```bash
# 1. CONTAS DE TESTE
cd backend
python ../create_test_accounts.py

# 2. LOCAIS DE EXEMPLO
python ../seed_locals_quick.py

# 3. TESTAR ENDPOINT
curl http://192.168.88.89:8000/api/locals

# 4. TESTAR LOGIN
curl -X POST http://192.168.88.89:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"turista@gmail.com","password":"T123456"}'

# 5. ABRIR APP E TESTAR
# http://localhost:5173
```

**Tempo total:** 5-10 minutos

---

## 📞 Se Ainda Não Funcionar

### 1. Verificar logs do Django

```bash
# No terminal onde Django está rodando
# Procurar por erros ao criar usuários ou locais
```

### 2. Verificar logs do navegador

```
F12 → Console
Procurar erros de rede ou autenticação
```

### 3. Verificar estrutura do modelo

```bash
python manage.py shell
```

```python
# Verificar campos do User
from django.contrib.auth import get_user_model
User = get_user_model()
print([f.name for f in User._meta.fields])

# Verificar campos do Local
from locals.models import Local
print([f.name for f in Local._meta.fields])
```

### 4. Resetar banco (último recurso)

```bash
# ⚠️ CUIDADO: Apaga todos os dados!
python manage.py flush

# Depois recriar tudo
python ../create_test_accounts.py
python ../seed_locals_quick.py
```

---

## 🎓 Resumo

**Problema original:**
- Backend 200 OK mas feed vazio
- Login falhando com contas de teste

**Causa:**
- Banco sem usuários de teste
- Banco sem locais

**Solução:**
1. Script `create_test_accounts.py` → Cria 3 contas
2. Script `seed_locals_quick.py` → Cria 10 locais
3. Testar no app → Feed funcionando!

**Resultado:**
- ✅ 3 contas de teste funcionando
- ✅ 10 locais aparecendo no feed
- ✅ Filtros por categoria funcionando
- ✅ Sistema completo operacional

---

## 📚 Documentação Relacionada

- `DIAGNOSTICO_FEED_VAZIO.md` - Análise do problema
- `RESOLVER_FEED_VAZIO.md` - Guia de solução
- `README_FEED_DESCOBERTAS.md` - Documentação completa
- `backend-api-documentation.md` - API reference
- `SETUP_COMPLETO.md` - Este arquivo

**Leia primeiro:** `SETUP_COMPLETO.md` (este arquivo)  
**Se houver problemas:** `DIAGNOSTICO_FEED_VAZIO.md`
