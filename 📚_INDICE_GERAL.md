# 📚 Índice Geral - Feed de Descobertas

## 🎯 Comece Aqui

### Para Resolver Rapidamente
👉 **[📍 RESOLVER_AGORA.md](./📍_RESOLVER_AGORA.md)** - Guia visual com solução rápida

### Para Entender o Problema
👉 **[LEIA_ME_PRIMEIRO.md](./LEIA_ME_PRIMEIRO.md)** - Explicação completa e simples

---

## 📖 Documentação Completa

### 1. Diagnóstico
- **[DIAGNOSTICO_FEED_VAZIO.md](./DIAGNOSTICO_FEED_VAZIO.md)**
  - Análise técnica completa
  - Testes realizados
  - Comparação Locais vs Serviços
  - Causa raiz identificada

### 2. Solução Passo a Passo
- **[SETUP_COMPLETO.md](./SETUP_COMPLETO.md)**
  - Guia detalhado de execução
  - Verificação passo a passo
  - Troubleshooting completo
  - Checklist final

- **[RESOLVER_FEED_VAZIO.md](./RESOLVER_FEED_VAZIO.md)**
  - Soluções alternativas
  - Django Admin
  - Django Shell
  - Management commands

### 3. Documentação do Componente
- **[README_FEED_DESCOBERTAS.md](./README_FEED_DESCOBERTAS.md)**
  - Como funciona o AllDiscoveries
  - Fluxo de dados
  - Estrutura de arquivos
  - Detalhes técnicos

---

## 🛠️ Scripts e Ferramentas

### Scripts Python
- **[create_test_accounts.py](./create_test_accounts.py)**
  - Cria 3 contas de teste
  - Define roles corretos
  - Ativa contas automaticamente

- **[seed_locals_quick.py](./seed_locals_quick.py)**
  - Cria 10 locais de exemplo
  - Todos aprovados
  - Distribuídos por províncias
  - Com GPS e imagens

### Scripts Batch (Windows)
- **[setup_backend.bat](./setup_backend.bat)**
  - Executa tudo automaticamente
  - Detecta diretório do backend
  - Testa endpoints
  - Mostra credenciais

---

## 🎯 Por Objetivo

### "Quero resolver agora!"
1. [📍 RESOLVER_AGORA.md](./📍_RESOLVER_AGORA.md)
2. Executar `setup_backend.bat` OU os scripts manualmente
3. Pronto!

### "Quero entender o problema"
1. [LEIA_ME_PRIMEIRO.md](./LEIA_ME_PRIMEIRO.md)
2. [DIAGNOSTICO_FEED_VAZIO.md](./DIAGNOSTICO_FEED_VAZIO.md)

### "Preciso de ajuda detalhada"
1. [SETUP_COMPLETO.md](./SETUP_COMPLETO.md)
2. [RESOLVER_FEED_VAZIO.md](./RESOLVER_FEED_VAZIO.md)

### "Quero entender o código"
1. [README_FEED_DESCOBERTAS.md](./README_FEED_DESCOBERTAS.md)
2. [backend-api-documentation.md](./backend-api-documentation.md)

---

## 📊 Estrutura dos Arquivos

```
txopela-tour-MVP-main/
├── 📚 ÍNDICE_GERAL.md              ← Você está aqui
├── 📍 RESOLVER_AGORA.md            ← Comece aqui
├── 📄 LEIA_ME_PRIMEIRO.md          ← Leia em seguida
├── 🔧 SETUP_COMPLETO.md            ← Guia detalhado
├── 🔍 DIAGNOSTICO_FEED_VAZIO.md   ← Análise técnica
├── 🛠️  RESOLVER_FEED_VAZIO.md      ← Soluções
├── 📖 README_FEED_DESCOBERTAS.md  ← Documentação
├── 🐍 create_test_accounts.py     ← Script Python
├── 🐍 seed_locals_quick.py        ← Script Python
└── 💻 setup_backend.bat            ← Script Windows
```

---

## 🚀 Execução Rápida

### Linha Única (Linux/Mac)
```bash
cd backend && python ../create_test_accounts.py && python ../seed_locals_quick.py
```

### Linha Única (Windows PowerShell)
```powershell
cd backend; python ..\create_test_accounts.py; python ..\seed_locals_quick.py
```

### Batch Automático (Windows)
```cmd
setup_backend.bat
```

---

## 📋 Credenciais Criadas

| Tipo | Email | Senha | Role | Frontend |
|------|-------|--------|------|----------|
| 🧳 Turista | turista@gmail.com | T123456 | tourist | Sugerir Local |
| 🎯 Guia | servico@gmail.com | S123456 | guide | Sugerir Serviço |
| 🏢 Negócio | negociantenormal@gmail.com | N123456 | business | Sugerir Serviço |

---

## 🌍 Locais Criados

1. **Praia de Tofo** (Inhambane) - Atração
2. **Ilha de Moçambique** (Nampula) - Atração
3. **Parque Nacional Gorongosa** (Sofala) - Atração
4. **Restaurante Zambi** (Maputo) - Restaurante
5. **Hotel Pestana Rovuma** (Maputo) - Hotel
6. **Mercado Central** (Maputo) - Loja
7. **Praia do Wimbe** (Cabo Delgado) - Atração
8. **Casa de Ferro** (Maputo) - Atração
9. **Arquipélago de Bazaruto** (Inhambane) - Atração
10. **Costa do Sol** (Maputo) - Restaurante

---

## ✅ Checklist Geral

### Preparação
- [ ] Ler [LEIA_ME_PRIMEIRO.md](./LEIA_ME_PRIMEIRO.md)
- [ ] Identificar diretório do backend
- [ ] Backend Django rodando

### Execução
- [ ] Executar `create_test_accounts.py`
- [ ] Executar `seed_locals_quick.py`
- [ ] Verificar no Django shell (opcional)

### Testes
- [ ] Testar `GET /api/locals`
- [ ] Testar `POST /api/auth/login`
- [ ] Abrir app e fazer login
- [ ] Verificar feed de descobertas

### Validação
- [ ] Login funciona
- [ ] Feed mostra 10 locais
- [ ] Filtros funcionam
- [ ] Detalhes de local abrem
- [ ] Roles corretos (Sugerir Local/Serviço)

---

## 🐛 Troubleshooting

### Problema: "Script não encontra manage.py"
**Solução:** [SETUP_COMPLETO.md](./SETUP_COMPLETO.md) → Seção "Troubleshooting"

### Problema: "ImportError: No module named locals"
**Solução:** [RESOLVER_FEED_VAZIO.md](./RESOLVER_FEED_VAZIO.md) → Seção "Opção 3"

### Problema: "Contas criadas mas login falha"
**Solução:** [SETUP_COMPLETO.md](./SETUP_COMPLETO.md) → Seção "Verificação"

### Problema: "Locais criados mas feed vazio"
**Solução:** [DIAGNOSTICO_FEED_VAZIO.md](./DIAGNOSTICO_FEED_VAZIO.md) → Seção "Verificação"

---

## 📞 Suporte Adicional

### Logs Úteis

**Django Shell:**
```python
from django.contrib.auth import get_user_model
from locals.models import Local

User = get_user_model()
print(f"Usuários: {User.objects.count()}")
print(f"Locais: {Local.objects.count()}")
print(f"Aprovados: {Local.objects.filter(status='approved').count()}")
```

**Endpoints:**
```bash
# Locais
curl http://192.168.88.89:8000/api/locals

# Login
curl -X POST http://192.168.88.89:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"turista@gmail.com","password":"T123456"}'
```

**Frontend (F12 → Console):**
```javascript
// Ver requisições
// Filtrar por "locals" ou "auth"
```

---

## 🎓 Resumo Executivo

### Problema
- Backend responde 200 OK mas array vazio
- Login falha com contas de teste
- Feed de descobertas não mostra nada

### Causa
- Banco de dados sem usuários de teste
- Banco de dados sem locais cadastrados

### Solução
1. Executar `create_test_accounts.py`
2. Executar `seed_locals_quick.py`
3. Testar no app

### Resultado
- ✅ 3 contas de teste funcionando
- ✅ 10 locais aparecendo no feed
- ✅ Sistema 100% operacional

### Tempo
- **3-5 minutos** do início ao fim

---

## 🎯 Próximo Passo

**Escolha um:**

1. **Resolver rápido** → [📍 RESOLVER_AGORA.md](./📍_RESOLVER_AGORA.md)
2. **Entender primeiro** → [LEIA_ME_PRIMEIRO.md](./LEIA_ME_PRIMEIRO.md)
3. **Guia completo** → [SETUP_COMPLETO.md](./SETUP_COMPLETO.md)

---

## 📚 Referências Adicionais

- [backend-api-documentation.md](./backend-api-documentation.md) - API completa
- [app/src/pages/AllDiscoveries.tsx](./app/src/pages/AllDiscoveries.tsx) - Componente
- [app/src/services/api.ts](./app/src/services/api.ts) - Cliente API
- [app/.env](./app/.env) - Configuração

---

**🎉 Boa sorte com o setup!**

_Criado em: 2026-06-05_  
_Última atualização: 2026-06-05_
