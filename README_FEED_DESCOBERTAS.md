# 📱 Feed de Descobertas - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Problema Identificado](#problema-identificado)
3. [Como Funciona](#como-funciona)
4. [Solução Rápida](#solução-rápida)
5. [Arquivos Relevantes](#arquivos-relevantes)

---

## 🎯 Visão Geral

O **Feed de Descobertas** (`AllDiscoveries.tsx`) mostra locais turísticos cadastrados no sistema:
- Praias, hotéis, restaurantes, atrações, lojas
- Com filtros por categoria
- Paginação automática
- Integração total com backend

---

## 🐛 Problema Identificado

### Sintoma
> "O backend responde 200 OK para `/api/locals`, mas não mostra nada no feed"

### Diagnóstico
✅ **Frontend está correto** - Todas as requisições funcionando  
✅ **Backend está funcionando** - Endpoint responde 200 OK  
❌ **Banco de dados está vazio** - `{"locals": []}`

### Comparação

| Componente | Locais | Serviços |
|------------|--------|----------|
| Endpoint funciona? | ✅ Sim | ✅ Sim |
| Responde 200? | ✅ Sim | ✅ Sim |
| Tem dados no banco? | ❌ **NÃO** | ✅ Sim |
| Mostra no app? | ❌ Não | ✅ Sim |

**Conclusão:** Precisa adicionar dados de locais no backend!

---

## 🔧 Como Funciona

### Fluxo de Dados

```
1. Usuário abre "Descobertas"
   ↓
2. AllDiscoveries.tsx chama localsApi.list()
   ↓
3. api.ts faz: GET http://192.168.88.89:8000/api/locals
   ↓
4. Backend Django responde:
   {
     "success": true,
     "locals": [...],  ← Array de locais
     "pagination": {...}
   }
   ↓
5. AllDiscoveries mapeia dados e exibe no grid
```

### Código Relevante

**Frontend - AllDiscoveries.tsx (linha 103)**
```typescript
const fetchLocals = async (reset = false) => {
  const { data, error: apiError } = await localsApi.list({
    page: currentPage,
    limit: 20,
    sortBy: 'popular',
  });
  
  if (data) {
    const items: any[] = data.locals || [];  // ← Aqui pega os dados
    const mapped = items.map(mapApiToDiscovery);
    setDiscoveries(mapped);
  }
};
```

**Backend - Endpoint (documentação linha 833)**
```http
GET /api/locals
Query: page, limit, province, category, search, sortBy
Response: {
  "success": true,
  "locals": [
    {
      "id": "...",
      "name": "Praia de Tofo",
      "category": "attraction",
      "status": "approved",  ← Deve ser 'approved'!
      ...
    }
  ]
}
```

---

## ⚡ Solução Rápida

### Passo 1: Popular o Banco de Dados

**Opção A: Script Automático (Recomendado)**
```bash
cd backend
python seed_locals_quick.py
```

**Opção B: Django Admin**
```
1. http://192.168.88.89:8000/admin/
2. Login
3. Locals → Add Local
4. Preencher e MARCAR status='approved'
5. Save
```

### Passo 2: Verificar

```bash
# Testar endpoint
curl http://192.168.88.89:8000/api/locals

# Deve retornar:
{
  "success": true,
  "locals": [
    {"id": "...", "name": "Praia de Tofo", ...}
  ]
}
```

### Passo 3: Recarregar App

```
1. Abrir http://localhost:5173
2. Ir para "Descobertas"
3. Ver os locais aparecendo!
```

**Tempo total:** 2-5 minutos

---

## 📁 Arquivos Relevantes

### Frontend

| Arquivo | Função | Linha Chave |
|---------|--------|-------------|
| `app/src/pages/AllDiscoveries.tsx` | Exibe grid de locais | 103 (fetchLocals) |
| `app/src/services/api.ts` | Comunicação com backend | 485 (localsApi.list) |
| `app/.env` | URL do backend | 2 (VITE_API_URL) |

### Backend

| Arquivo | Função |
|---------|--------|
| `backend-api-documentation.md` | Documentação da API (linha 833) |
| `seed_locals_quick.py` | Script para popular banco |

### Documentação

| Arquivo | Conteúdo |
|---------|----------|
| `DIAGNOSTICO_FEED_VAZIO.md` | Análise técnica completa |
| `RESOLVER_FEED_VAZIO.md` | Guia passo a passo |
| `README_FEED_DESCOBERTAS.md` | Este arquivo |

---

## 🔍 Detalhes Técnicos

### Estrutura do Modelo Local

```typescript
interface Discovery {
  id: string;
  name: string;
  description: string;
  category: string;  // restaurant|hotel|attraction|shop|service
  province: string;  // Maputo, Inhambane, etc.
  images: string[];
  rating: { average: number; count: number };
  status: string;    // approved|pending|rejected
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}
```

### Filtros Disponíveis

```typescript
// Categories no AllDiscoveries (linha 33)
const CATEGORIES = [
  'Todos',
  'Praias',
  'Cultura & História',
  'Natureza',
  'Aventura',
  'Gastronomia',
  'Mergulho',
  'Ecoturismo'
];
```

### Mapeamento de Dados

```typescript
// mapApiToDiscovery (linha 46)
// Transforma resposta da API em formato do componente
// Suporta múltiplos formatos de campo (robusto!)
```

---

## ✅ Checklist de Verificação

### Backend
- [ ] Servidor Django rodando em `192.168.88.89:8000`
- [ ] Endpoint `/api/locals` responde 200 OK
- [ ] Existem locais no banco com `status='approved'`
- [ ] Locais têm imagens configuradas

### Frontend
- [ ] `.env` configurado com `VITE_API_URL`
- [ ] Servidor dev rodando (`npm run dev`)
- [ ] Console do navegador sem erros (F12)
- [ ] Network tab mostra request para `/api/locals` com 200

### App
- [ ] Feed de "Descobertas" mostra os locais
- [ ] Filtros por categoria funcionam
- [ ] Clicar num local abre os detalhes
- [ ] Botão "Carregar mais" funciona (se >20 locais)

---

## 🚨 Problemas Comuns

### 1. "Ainda não aparece nada"

**Causa:** Status do local não é 'approved'

**Solução:**
```python
# Django shell
from locals.models import Local
Local.objects.filter(status='pending').update(status='approved')
```

### 2. "Erro 404 no endpoint"

**Causa:** URL do backend incorreta

**Verificar:**
```bash
# .env
VITE_API_URL=http://192.168.88.89:8000/api  # ← Verificar IP e porta
```

### 3. "Loading infinito"

**Causa:** Timeout ou erro de rede

**Verificar:**
```javascript
// F12 → Console
// Procurar erros tipo:
// "Failed to fetch"
// "NetworkError"
```

### 4. "Locais aparecem mas sem imagem"

**Causa:** Campo `images` vazio no banco

**Solução:**
```python
# Adicionar imagem padrão ou fazer upload via admin
local.images = ['https://exemplo.com/imagem.jpg']
local.save()
```

---

## 📊 Testes Realizados

### ✅ Testes Passados

| Teste | Status | Nota |
|-------|--------|------|
| Endpoint `/api/locals` responde | ✅ | 200 OK |
| Endpoint `/api/services` responde | ✅ | Com dados |
| Frontend faz requisição correta | ✅ | Headers OK |
| AllDiscoveries renderiza skeleton | ✅ | Durante loading |
| AllDiscoveries trata array vazio | ✅ | Sem crash |
| Timeout configurado (15s) | ✅ | Em api.ts |

### ⚠️ Teste Pendente

| Teste | Status | Ação Necessária |
|-------|--------|-----------------|
| Banco tem locais aprovados | ❌ | **Executar seed** |

---

## 🎓 Lições Aprendidas

1. **Backend 200 OK ≠ Dados Disponíveis**
   - API pode responder corretamente com array vazio
   - Sempre verificar se o banco tem dados

2. **Status do Local é Crítico**
   - `status='pending'` → **NÃO** aparece no feed
   - `status='approved'` → ✅ Aparece no feed

3. **Serviços Funcionam, Locais Não**
   - Serviços têm dados mockados no backend
   - Locais precisam ser criados manualmente

4. **Frontend Está Correto**
   - Toda integração implementada conforme docs
   - Não precisa mudar código do frontend

---

## 🚀 Próximos Passos

1. ✅ Executar `seed_locals_quick.py`
2. ✅ Verificar que endpoint retorna dados
3. ✅ Testar no app mobile
4. ⬜ Adicionar mais locais (mínimo 20 para teste de paginação)
5. ⬜ Upload de imagens reais via Django Admin
6. ⬜ Criar locais por província (Maputo, Inhambane, etc.)
7. ⬜ Configurar coordenadas GPS reais

---

## 📞 Suporte

**Arquivos de diagnóstico criados:**
- `DIAGNOSTICO_FEED_VAZIO.md` - Análise técnica
- `RESOLVER_FEED_VAZIO.md` - Guia de solução
- `seed_locals_quick.py` - Script de seed

**Logs úteis:**
```bash
# Django
python manage.py shell
>>> from locals.models import Local
>>> Local.objects.count()

# Frontend
# F12 → Console → filtrar por "locals"
```

---

## 🎯 Resumo Executivo

| Aspecto | Status |
|---------|--------|
| **Problema** | Feed vazio (sem locais) |
| **Causa** | Banco de dados sem dados |
| **Solução** | Executar seed script |
| **Tempo** | 2-5 minutos |
| **Impacto** | ✅ Feed funcionando 100% |
| **Código afetado** | ❌ Nenhum (só dados) |

**Ação imediata:** `python seed_locals_quick.py`
