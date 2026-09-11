# 🚀 LEIA-ME PRIMEIRO

## ⚠️ Problema Atual

Você está enfrentando **2 problemas**:

1. **Login falha** → `"Email ou password incorretos"`
2. **Feed vazio** → Backend responde 200 OK mas sem dados

## ✅ Causa Identificada

- ❌ Banco de dados **NÃO tem** contas de teste
- ❌ Banco de dados **NÃO tem** locais cadastrados
- ✅ Backend está **funcionando** (responde 200 OK)
- ✅ Frontend está **correto** (código implementado)

## 🎯 Solução Rápida (3 minutos)

### Opção 1: Script Automático (Windows)

```cmd
# Executar na raiz do projeto
setup_backend.bat

# Vai perguntar onde está o backend (ex: "backend")
# Depois faz tudo automaticamente!
```

### Opção 2: Manual (Todos OS)

```bash
# 1. Ir para diretório do backend
cd backend

# 2. Criar contas de teste
python ../create_test_accounts.py

# 3. Criar locais de exemplo  
python ../seed_locals_quick.py

# 4. Testar
curl http://192.168.88.89:8000/api/locals
```

---

## 📋 O Que os Scripts Fazem

### 1. `create_test_accounts.py`

Cria **3 contas de teste**:

| Email | Senha | Tipo | Frontend Mostra |
|-------|--------|------|-----------------|
| turista@gmail.com | T123456 | Turista | "Sugerir Local" |
| servico@gmail.com | S123456 | Guia | "Sugerir Serviço" |
| negociantenormal@gmail.com | N123456 | Negócio | "Sugerir Serviço" |

### 2. `seed_locals_quick.py`

Cria **10 locais aprovados**:
- Praia de Tofo
- Ilha de Moçambique  
- Parque Gorongosa
- Restaurante Zambi
- Hotel Pestana
- E mais 5...

---

## ✅ Resultado Esperado

### Após Executar os Scripts

```bash
# 1. Login funciona
POST /api/auth/login
{"email":"turista@gmail.com","password":"T123456"}
→ ✅ {"success":true,"token":"...","user":{...}}

# 2. Locais aparecem
GET /api/locals
→ ✅ {"success":true,"locals":[10 itens],"pagination":{...}}

# 3. App funciona
http://localhost:5173
→ ✅ Login OK
→ ✅ Feed mostra 10 locais
→ ✅ Filtros funcionam
```

---

## 🐛 Troubleshooting

### "Script não encontrou manage.py"

```bash
# Verificar estrutura:
# projeto/
#   ├── backend/          ← Procurar este
#   │   └── manage.py     ← Arquivo Django
#   ├── create_test_accounts.py
#   └── seed_locals_quick.py

# Ajustar caminho ao executar
cd backend
python ../create_test_accounts.py
```

### "ImportError: No module named locals"

O nome do app Django pode ser diferente. Editar os scripts:

```python
# Em seed_locals_quick.py e create_test_accounts.py
# Trocar:
from locals.models import Local

# Por:
from places.models import Local  # ou
from destinations.models import Local  # ou outro nome
```

Para descobrir o nome:
```bash
python manage.py showmigrations
# Procurar por apps com models de Local/Place/Destination
```

### "Ainda não aparece nada"

```bash
# Verificar no Django shell
python manage.py shell
```

```python
# 1. Verificar contas
from django.contrib.auth import get_user_model
User = get_user_model()
print(User.objects.filter(email__contains='gmail').count())
# Deve ser 3

# 2. Verificar locais
from locals.models import Local  # ajustar nome do app
print(Local.objects.filter(status='approved').count())
# Deve ser 10
```

---

## 📚 Documentação Completa

| Arquivo | Conteúdo |
|---------|----------|
| **LEIA_ME_PRIMEIRO.md** | Este arquivo (comece aqui!) |
| **SETUP_COMPLETO.md** | Guia detalhado passo a passo |
| **DIAGNOSTICO_FEED_VAZIO.md** | Análise técnica do problema |
| **RESOLVER_FEED_VAZIO.md** | Soluções alternativas |
| **README_FEED_DESCOBERTAS.md** | Documentação do componente |

---

## 🎯 Próximos Passos

1. ✅ Executar `setup_backend.bat` OU os scripts manualmente
2. ✅ Verificar que endpoints retornam dados
3. ✅ Abrir `http://localhost:5173`
4. ✅ Login com `turista@gmail.com` / `T123456`
5. ✅ Ir para "Descobertas" e ver os 10 locais!

---

## 🎓 Resumo Executivo

**Problema:** Backend vazio (sem usuários, sem locais)  
**Solução:** Executar 2 scripts Python  
**Tempo:** 3 minutos  
**Resultado:** Sistema funcionando 100%  

### Comando Único

```bash
cd backend
python ../create_test_accounts.py && python ../seed_locals_quick.py
```

**Pronto!** 🎉

---

## 📞 Suporte

Se após executar os scripts ainda não funcionar:

1. Ler **SETUP_COMPLETO.md** para detalhes
2. Verificar logs do Django (console onde roda)
3. Verificar logs do navegador (F12 → Console)
4. Verificar que o backend responde:
   ```bash
   curl http://192.168.88.89:8000/api/locals
   ```

---

## ✨ Checklist Rápido

- [ ] Executei `create_test_accounts.py`
- [ ] Executei `seed_locals_quick.py`
- [ ] Testei `GET /api/locals` → retorna 10 locais
- [ ] Testei login → funciona
- [ ] Abri o app → vejo os locais no feed

**Se todos ✅ → Tudo funcionando!**
