# 🎯 GUIA EXECUTIVO - Refatoração Final Completa

**OBJETIVO:** 100% Frontend integrado à API  
**PRAZO:** 5 dias  
**STATUS:** Iniciado - 25% Completo

---

## ✅ COMPONENTES JÁ CORRIGIDOS (5/20)

1. ✅ **Home.tsx** - Feed principal
2. ✅ **AllServices.tsx** - Lista de serviços  
3. ✅ **AllDiscoveries.tsx** - Galeria de locais
4. ✅ **ServiceDetail.tsx** - Detalhes de serviço
5. ✅ **AllPosts.tsx** - Feed de posts (**CORRIGIDO AGORA**)

---

## 🔧 CORREÇÕES NECESSÁRIAS (15 componentes)

### 📋 TEMPLATE UNIVERSAL DE CORREÇÃO

Aplique este padrão em TODOS os componentes listados:

```typescript
// PASSO 1: Adicionar imports
import { mapValid[Local|Service|Post], filterValidPublications } from '@/utils/dataValidation';

// PASSO 2: No useEffect/fetch, ANTES de setState
const validItems = filterValidPublications(rawData);
const mapped = validItems
  .map(item => mapValid[Tipo](item))
  .filter((item): item is [Tipo] => item !== null);
setState(mapped);

// PASSO 3: PROCURAR e ELIMINAR
// Padrão 1: Fallback inline
❌ image: item.images?.[0] || '/images/local-1.jpg'
✅ image: item.images?.[0]

// Padrão 2: Array com fallback
❌ images: item.images || ['/images/local-1.jpg']
✅ images: item.images

// Padrão 3: onError com fallback
❌ onError={e => { (e.target as HTMLImageElement).src = '/images/local-1.jpg'; }}
✅ (remover completamente)

// Padrão 4: Ternário com fallback
❌ src={images[i] || '/images/local-1.jpg'}
✅ src={images[i]}
```

---

## 🔴 PRIORIDADE CRÍTICA (Hoje)

### 1. **ApuradorDashboard.tsx**
**Local:** `app/src/pages/ApuradorDashboard.tsx`  
**Problema:** Função `mapToItem` permite aprovar sem imagens

```typescript
// LINHA ~1: Adicionar import
import { extractRealImages, validatePublication } from '@/utils/dataValidation';

// LINHA ~80: Substituir função mapToItem completamente
function mapToItem(raw: any, type: 'local' | 'service' | 'post'): PendingItem | null {
  const validation = validatePublication(raw);
  if (!validation.isValid) {
    console.warn('[APURADOR] Inválido:', validation.errors);
    return null;
  }

  const images = extractRealImages(raw);
  if (images.length === 0) {
    console.warn('[APURADOR] Sem imagens:', raw.id);
    return null;
  }

  return {
    id: String(raw.id || raw.pk || ''),
    type,
    name: raw.name || raw.title || 'Sem nome',
    submittedBy: raw.author?.name || raw.owner?.name || raw.created_by?.name || 'Utilizador',
    submittedAt: relativeTime(raw.created_at || raw.createdAt || new Date().toISOString()),
    category: raw.category?.name || raw.category || '—',
    province: raw.province || raw.location?.province || '—',
    description: raw.description || '',
    images,  // APENAS imagens reais
    status: raw.status || 'pending',
    raw,
  };
}

// LINHA ~410: No loadAll, filtrar nulls
const allItems: PendingItem[] = (raw?.items || raw?.results || [])
  .map((r: any) => {
    const type = r.type === 'service' ? 'service' : r.type === 'post' ? 'post' : 'local';
    return mapToItem(r, type);
  })
  .filter((item): item is PendingItem => item !== null);
```

---

### 2. **Profile.tsx**
**Local:** `app/src/pages/Profile.tsx`  
**Problema:** 3 seções com fallbacks

#### Seção 1: Reviews (linha ~140)
```typescript
// PROCURAR: setMyReviews(reviews.map(r => ({
// SUBSTITUIR POR:

const validReviews = reviews.filter(r => 
  r.local?.images && 
  Array.isArray(r.local.images) && 
  r.local.images.length > 0 &&
  !r.local.images[0].includes('/images/local-')
);

setMyReviews(validReviews.map(r => ({
  id: r.id,
  localName: r.local?.name || 'Local',
  rating: r.rating,
  comment: r.comment || r.text || '',
  date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-PT') : '',
  image: r.local.images[0],  // SEM FALLBACK
  category: r.local?.category?.name || r.category || 'Local',
  catColor: CAT_COLOR[r.local?.category?.name] || CAT_COLOR.default,
})));
```

#### Seção 2: Submissions (linha ~275)
```typescript
// PROCURAR linha com: image: s.images?.[0] || '/images/local-1.jpg'
// SUBSTITUIR todo o mapeamento:

const validSubmissions = submissions.filter(s =>
  s.images && Array.isArray(s.images) && s.images.length > 0 &&
  !s.images[0].includes('/images/local-')
);

setSubmissions(validSubmissions.map(s => ({
  id: s.id,
  name: s.name || s.title || 'Publicação',
  status: s.status === 'approved' ? 'Aprovado' : s.status === 'rejected' ? 'Cancelado' : 'Em revisão',
  date: s.createdAt ? new Date(s.createdAt).toLocaleDateString('pt-PT') : '',
  image: s.images[0],  // SEM FALLBACK
  category: s.category || 'Local',
  catColor: CAT_COLOR[s.category] || CAT_COLOR.default,
})));
```

#### Seção 3: Discoveries (linha ~445)
```typescript
// PROCURAR linha com: image: d.images?.[0] || '/images/local-1.jpg'
// SUBSTITUIR todo o mapeamento:

const validDiscoveries = discoveries.filter(d =>
  d.images && Array.isArray(d.images) && d.images.length > 0 &&
  !d.images[0].includes('/images/local-')
);

setDiscoveries(validDiscoveries.map(d => ({
  id: d.id,
  name: d.name || d.title || 'Local',
  desc: d.description || '',
  date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-PT') : '',
  image: d.images[0],  // SEM FALLBACK
  category: d.category || 'Local',
  catColor: CAT_COLOR[d.category] || CAT_COLOR.default,
})));
```

---

## 🟠 PRIORIDADE ALTA (Amanhã)

### 3. **ProvinciaFeed.tsx**
```typescript
// LINHA 1: Adicionar
import { mapValidLocal, filterValidPublications } from '@/utils/dataValidation';

// LINHA ~40: Substituir mapeamento
const validLocals = filterValidPublications(items);
const locals = validLocals
  .map(item => mapValidLocal(item))
  .filter((item): item is Local => item !== null);
setLocals(locals);

// REMOVER linha 45:
// image: item.images?.[0]?.url || item.cover_image || '/images/local-1.jpg'
```

### 4. **Explore.tsx**
```typescript
// LINHA 1: Adicionar
import { mapValidLocal, filterValidPublications } from '@/utils/dataValidation';

// LINHA ~45: Substituir
const validPlaces = filterValidPublications(data);
const places = validPlaces
  .map(p => mapValidLocal(p))
  .filter(Boolean);

// REMOVER linha 46:
// images: p.images || ['/images/local-1.jpg']
```

### 5. **Favorites.tsx**
```typescript
// LINHA ~60: Substituir mapeamento completo
const validFavorites = rawFavorites.filter(item => {
  const hasRealImages = item.images && 
    Array.isArray(item.images) && 
    item.images.length > 0 &&
    !item.images[0].includes('/images/local-');
  return hasRealImages;
});

setFavorites(validFavorites.map(item => ({
  id: item.id || item.pk || '',
  name: item.name || item.title || 'Favorito',
  desc: item.description || '',
  location: item.province || item.location?.province || '',
  category: item.category || 'geral',
  rating: item.rating?.average ?? item.rating ?? 0,
  addedAt: new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString('pt-MZ'),
  image: item.images[0],  // SEM FALLBACK
  images: item.images,
  type: /* lógica de tipo */,
})));
```

---

## 🟡 PRIORIDADE MÉDIA (Dias 3-4)

### 6. **PostDetail.tsx**
```typescript
// LINHA 100: REMOVER fallback
// ANTES: src={images[currentImage] || '/images/local-1.jpg'}
// DEPOIS: src={images[currentImage]}

// Se não houver imagens, não renderizar ou redirecionar
if (!images || images.length === 0) {
  return <div>Post sem imagens</div>;
}
```

### 7. **LocalDetail.tsx**
```typescript
// LINHA 123: REMOVER fallback
// ANTES: src={local.images[currentImageIndex] || '/images/local-1.jpg'}
// DEPOIS: src={local.images[currentImageIndex]}

// Validar na entrada
if (!local.images || local.images.length === 0) {
  return <div>Local sem imagens</div>;
}
```

### 8. **DestinationDetail.tsx**
```typescript
// LINHA ~155: Filtrar serviços próximos
const validServices = nearbyServices.filter(s =>
  s.images && Array.isArray(s.images) && s.images.length > 0 &&
  !s.images[0].includes('/images/local-')
);

setNearbyServices(validServices.map((s: any) => ({
  id: String(s.id),
  name: s.title || s.name || 'Serviço',
  category: s.category || 'Serviço',
  rating: parseFloat(s.rating?.average ?? s.rating ?? 0),
  reviewsCount: s.rating?.count ?? 0,
  distance: s.location?.distance || '',
  image: s.images[0],  // SEM FALLBACK
  amenities: s.amenities || [],
  // ... resto dos campos
})));
```

### 9. **ServicesListing.tsx**
```typescript
// LINHA 1: Adicionar
import { mapValidService, filterValidPublications } from '@/utils/dataValidation';

// LINHA ~70: Substituir
const validServices = filterValidPublications(items);
const mapped = validServices
  .map(s => mapValidService(s))
  .filter(Boolean);
setAllServices(mapped);

// REMOVER linha 74:
// image: s.images?.[0]?.url || s.cover_image || '/images/local-1.jpg'
```

### 10. **PublicProfile.tsx**
```typescript
// LINHA ~400: REMOVER onError
// ANTES:
// onError={e => { (e.target as HTMLImageElement).src = '/images/local-1.jpg'; }}
// DEPOIS: (remover completamente)

// Filtrar posts antes de renderizar
const validPosts = posts.filter(p =>
  p.images && Array.isArray(p.images) && p.images.length > 0 &&
  !p.images[0].includes('/images/local-')
);
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

### Por Cada Componente Corrigido:
- [ ] Import de `dataValidation` adicionado
- [ ] `filterValidPublications` aplicado antes de mapear
- [ ] `mapValid*` usado para transformação
- [ ] Busca por `/images/local-` retorna 0 resultados
- [ ] Busca por `onError` com fallback retorna 0 resultados
- [ ] Teste visual: nenhum placeholder aparece
- [ ] Console: logs `[INVALID *]` aparecem para dados inválidos
- [ ] Commit feito com mensagem descritiva

---

## 🧪 TESTE FINAL DE CONFORMIDADE

Após todas as correções, executar:

```bash
# 1. Buscar por fallbacks restantes
grep -r "/images/local-" app/src/pages/*.tsx
# Resultado esperado: 0 ocorrências (exceto componentes de UI pura)

# 2. Buscar por onError com fallback
grep -r "onError.*local-1" app/src/pages/*.tsx
# Resultado esperado: 0 ocorrências

# 3. Buscar por placeholder
grep -r "placeholder" app/src/pages/*.tsx
# Resultado esperado: Apenas em inputs de formulário

# 4. Verificar imports de validação
grep -r "dataValidation" app/src/pages/*.tsx
# Resultado esperado: 15+ ocorrências
```

---

## 📈 MÉTRICAS DE SUCESSO

### Antes da Refatoração
- ❌ 25% conformidade (5/20)
- ❌ 15 componentes com fallbacks
- ❌ Risco de exibir conteúdo inválido

### Após Refatoração (Meta)
- ✅ 100% conformidade (20/20)
- ✅ 0 componentes com fallbacks
- ✅ 0 placeholders em publicações
- ✅ Validação rigorosa em 100% dos fluxos

---

## 🎯 CRITÉRIO DE CONCLUSÃO

A refatoração só será considerada **COMPLETA** quando:

1. ✅ 100% dos componentes críticos usam dados da API
2. ✅ 0 fallbacks para `/images/local-*` em publicações
3. ✅ 0 `onError` com fallback de imagem
4. ✅ Validação centralizada em todos os pontos
5. ✅ Testes visuais confirmam ausência de placeholders
6. ✅ Re-auditoria mostra 100% conformidade

---

## 📞 SUPORTE

**Documentação Completa:**
- `AUDITORIA_FINAL_DADOS_REAIS.md` - Análise detalhada
- `CORRECAO_DADOS_REAIS.md` - Guia técnico do sistema
- `PLANO_CORRECAO_URGENTE.md` - Plano de ação detalhado
- `REFATORACAO_COMPLETA_RELATORIO.md` - Progresso em tempo real
- `src/utils/dataValidation.ts` - Código fonte da validação

---

**Status:** 🟡 EM PROGRESSO (25%)  
**Próxima Atualização:** Após cada componente corrigido  
**Meta de Conclusão:** 5 dias (até 03/07/2026)
