# ✅ Serviços — Provedor Real da API

## 📋 Problema Resolvido

**Antes:** Detalhes dos serviços mostravam "Carlos Machava" como dados mockados, independentemente de quem criou o serviço.

**Agora:** Mostra o **nome e tipo de perfil real** de quem publicou o serviço (provedor), conforme retornado pela API do backend.

---

## 🔧 Alterações Realizadas

### **1. Home.tsx — Mapeamento de Serviços**

Adicionado mapeamento do `contributor` (provedor) com conversão correta de roles:

```typescript
const services = apiServices.map((item: any) => ({
  // ... outros campos ...
  
  // Contributor/Provider info
  contributor: (() => {
    const provider = item.provider ?? item.owner ?? item.author ?? item.created_by;
    if (!provider) return undefined;
    
    // Mapear role do backend para type do frontend
    let type: 'guide' | 'traveler' | 'resident' | 'business' = 'guide';
    const role = provider.role || provider.type;
    
    if (role === 'business' || role === 'admin') {
      type = 'business';
    } else if (role === 'tourist') {
      type = 'traveler';
    } else if (role === 'guide' || role === 'curator') {
      type = 'guide';
    }
    
    return {
      name: provider.name || provider.username || 'Utilizador',
      type: type,
    };
  })(),
}));
```

**O que faz:**
1. Busca dados do provedor em múltiplos campos possíveis: `provider`, `owner`, `author`, `created_by`
2. Extrai o `role` do provedor
3. Mapeia `role` do backend para `type` do frontend
4. Retorna objeto com `name` e `type` corretos

---

### **2. ServiceDetail.tsx — Remover Fallback Mockado**

**Antes:**
```typescript
const c = service.contributor ?? { name: 'Carlos Machava', type: 'guide' as const };
```

**Depois:**
```typescript
{service.contributor && (() => {
  const c = service.contributor;
  // ... renderiza perfil do contributor ...
})()}
```

**Mudança:**
- ✅ Remove fallback para "Carlos Machava"
- ✅ Só mostra perfil do provedor se existir `contributor`
- ✅ Usa dados reais da API

---

### **3. AllServices.tsx — Mapeamento Correto**

**Antes:**
```typescript
contributor: item.provider ? {
  name: item.provider.name || 'Provedor',
  type: 'guide' as const,  // ← Sempre 'guide' (errado)
} : undefined
```

**Depois:**
```typescript
function mapApiToService(item: any): Service {
  const provider = item.provider ?? item.owner ?? item.author ?? item.created_by;
  let contributor: Service['contributor'] = undefined;
  
  if (provider) {
    // Mapear role do backend para type do frontend
    let type: 'guide' | 'traveler' | 'resident' | 'business' = 'guide';
    const role = provider.role || provider.type;
    
    if (role === 'business' || role === 'admin') {
      type = 'business';
    } else if (role === 'tourist') {
      type = 'traveler';
    } else if (role === 'guide' || role === 'curator') {
      type = 'guide';
    }
    
    contributor = {
      name: provider.name || provider.username || 'Utilizador',
      type: type,
    };
  }
  
  return {
    // ... outros campos ...
    contributor,
  };
}
```

**Mudança:**
- ✅ Mapeia `role` do backend corretamente
- ✅ Suporta múltiplos campos de provedor
- ✅ Retorna `type` dinâmico baseado no `role` real

---

## 📊 Mapeamento de Roles

| Role Backend | Type Frontend | Badge Exibido | Cor |
|--------------|---------------|---------------|-----|
| `guide` | `guide` | Guia | 🟠 Laranja (#F4821F) |
| `curator` | `guide` | Guia | 🟠 Laranja (#F4821F) |
| `business` | `business` | Negócio | 🟣 Roxo (#7B5EA7) |
| `admin` | `business` | Negócio | 🟣 Roxo (#7B5EA7) |
| `tourist` | `traveler` | Viajante | 🔵 Azul (#2BB5C8) |

---

## 🎨 Resultado Visual

### **Antes (Mock):**
```
┌─────────────────────────────────┐
│ [C] Carlos Machava    [Guia]    │  ← Sempre o mesmo
└─────────────────────────────────┘
```

### **Depois (Real):**
```
┌─────────────────────────────────┐
│ [M] Maria Silva     [Negócio]   │  ← Provedor real
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [J] João Santos      [Guia]     │  ← Provedor real
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [A] Ana Costa      [Viajante]   │  ← Provedor real
└─────────────────────────────────┘
```

---

## 📡 Formato da API Esperado

### **Resposta do Backend (GET /api/services)**

```json
{
  "success": true,
  "services": [
    {
      "id": "1",
      "title": "Tour pela Ilha de Moçambique",
      "category": "guide",
      "provider": {
        "id": "123",
        "name": "João Santos",
        "role": "guide",
        "avatar": "https://..."
      },
      "location": {
        "province": "Nampula"
      },
      "rating": {
        "average": 4.5,
        "count": 12
      },
      "images": ["https://..."]
    }
  ]
}
```

### **Campos Alternativos Suportados:**

O frontend busca o provedor em múltiplos campos:
```typescript
const provider = item.provider ?? item.owner ?? item.author ?? item.created_by;
```

**Exemplos suportados:**
```json
// Formato 1: provider
{
  "provider": { "id": "1", "name": "João", "role": "guide" }
}

// Formato 2: owner
{
  "owner": { "id": "1", "name": "Maria", "role": "business" }
}

// Formato 3: author
{
  "author": { "id": "1", "name": "Ana", "role": "tourist" }
}

// Formato 4: created_by
{
  "created_by": { "id": "1", "name": "Pedro", "role": "guide" }
}
```

---

## 🧪 Como Testar

### **Teste 1: Criar Serviço com Diferentes Perfis**

1. **Login como Guia:**
   - Email: `servico@gmail.com`
   - Senha: `S123456`
   - Criar serviço
   - Verificar: Badge "Guia" 🟠

2. **Login como Negócio:**
   - Email: `negociantenormal@gmail.com`
   - Senha: `N123456`
   - Criar serviço
   - Verificar: Badge "Negócio" 🟣

3. **Login como Turista:**
   - Email: `turista@gmail.com`
   - Senha: `T123456`
   - Criar serviço
   - Verificar: Badge "Viajante" 🔵

### **Teste 2: Ver Detalhes do Serviço**

1. Abrir app
2. Ir para seção "Serviços"
3. Clicar em um serviço
4. Verificar:
   - ✅ Nome do provedor está correto
   - ✅ Badge do tipo de perfil está correto
   - ✅ Cor do badge está correta

### **Teste 3: Verificar Console Logs**

```bash
# Ver dados do serviço no console
# F12 → Console
[Home] servicesApi response: { data: { services: [...] } }
```

Verificar que cada serviço tem:
```json
{
  "provider": {
    "name": "...",
    "role": "guide|business|tourist"
  }
}
```

---

## 🔍 Diagnóstico

### **Se ainda mostrar dados mockados:**

1. **Verificar resposta da API:**
   - F12 → Network → Filtrar "services"
   - Ver response body
   - Verificar se tem `provider` ou `owner`

2. **Verificar console logs:**
   ```javascript
   console.log('[Home] servicesApi response:', { data, error });
   ```

3. **Verificar estrutura do objeto:**
   ```javascript
   console.log('Service item:', JSON.stringify(item, null, 2));
   ```

### **Se o badge estiver errado:**

Verificar o `role` retornado pela API:
```json
{
  "provider": {
    "role": "guide"  // ← Deve ser: guide, business, tourist, admin, curator
  }
}
```

Se o `role` não estiver nestes valores, o mapeamento volta para `'guide'` por padrão.

---

## 📝 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| **Home.tsx** | Adicionado mapeamento de `contributor` com conversão de `role` |
| **ServiceDetail.tsx** | Removido fallback mockado "Carlos Machava" |
| **AllServices.tsx** | Corrigido mapeamento de `contributor` com `role` dinâmico |

---

## 🎯 Resultado Final

**✅ Serviços agora mostram:**
- Nome real do provedor
- Tipo de perfil correto (Guia, Negócio, Viajante, Residente)
- Badge com cor correspondente ao tipo
- Dados vêm 100% da API do backend

**❌ Não mostra mais:**
- Dados mockados "Carlos Machava"
- Sempre "Guia" independente do perfil real

---

**Data:** 06/06/2026  
**Status:** ✅ Completo  
**Funcionalidade:** Provedor real nos detalhes de serviços
