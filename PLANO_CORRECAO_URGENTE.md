# 🚨 PLANO DE CORREÇÃO URGENTE - Dados 100% Reais

**Status:** REQUER AÇÃO IMEDIATA  
**Prioridade:** CRÍTICA  
**Prazo:** 24-48 horas

---

## 📋 RESUMO DA AUDITORIA

### Situação Atual
- ✅ **5 componentes** já corrigidos e funcionais
- 🔴 **15 componentes** ainda usam fallbacks para imagens locais
- ⚠️ **Taxa de conformidade:** 25% (5/20 componentes críticos)

### Objetivo
- 🎯 **100% conformidade** - Nenhum componente pode exibir placeholders
- 🎯 **Validação rigorosa** em todos os pontos de entrada de dados
- 🎯 **Dashboard do apurador** nunca aprova publicações sem imagens

---

## 🔴 CORREÇÕES CRÍTICAS (HOJE)

### 1. **ApuradorDashboard.tsx** - CRÍTICO

**Problema:** Permite aprovar publicações sem imagens reais

**Correção:**
```typescript
// Adicionar import
import { extractRealImages, validatePublication } from '@/utils/dataValidation';

// Modificar função mapToItem (linha ~80)
function mapToItem(raw: any, type: 'local' | 'service' | 'post'): PendingItem | null {
  // VALIDAÇÃO CRÍTICA
  const validation = validatePublication(raw);
  if (!validation.isValid) {
    console.warn('[APURADOR] Publicação inválida:', validation.errors);
    return null;
  }

  const images = extractRealImages(raw);
  if (images.length === 0) {
    console.warn('[APURADOR] Sem imagens reais:', raw.id);
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

// Modificar no loadAll (linha ~410)
const allItems: PendingItem[] = (raw?.items || raw?.results || [])
  .map((r: any) => {
    const type = r.type === 'service' ? 'service' : r.type === 'post' ? 'post' : 'local';
    return mapToItem(r, type);
  })
  .filter((item): item is PendingItem => item !== null);  // Remove nulls
```

**Impacto:** Previne aprovação de conteúdo inválido ✅

---

### 2. **AllPosts.tsx** - ALTA

**Problema:** Posts sem imagens aparecem com placeholder

**Correção:**
```typescript
// Adicionar imports
import { mapValidPost, filterValidPublications } from '@/utils/dataValidation';

// Modificar no useEffect que carrega posts
const validPosts = filterValidPublications(items);
const mapped = validPosts
  .map(p => mapValidPost(p))
  .filter((p): p is Post => p !== null);
setPosts(mapped);

// REMOVER linha 152:
// image: p.images?.[0] || p.image || '/images/local-1.jpg'

// REMOVER linha 312:
// onError={e => { (e.target as HTMLImageElement).src = '/images/local-1.jpg'; }}
```

**Impacto:** Feed de posts 100% real ✅

---

### 3. **Profile.tsx** - ALTA

**Problema:** 3 seções (reviews, submissions, discoveries) com fallbacks

**Correção:**
```typescript
// Seção Reviews (linha ~140)
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

// Seção Submissions (linha ~275)
const validSubmissions = submissions.filter(s =>
  s.images && Array.isArray(s.images) && s.images.length > 0 &&
  !s.images[0].includes('/images/local-')
);
setSubmissions(validSubmissions.map(s => ({
  ...s,
  image: s.images[0],  // SEM FALLBACK
})));

// Seção Discoveries (linha ~445)
const validDiscoveries = discoveries.filter(d =>
  d.images && Array.isArray(d.images) && d.images.length > 0 &&
  !d.images[0].includes('/images/local-')
);
setDiscoveries(validDiscoveries.map(d => ({
  ...d,
  image: d.images[0],  // SEM FALLBACK
})));
```

**Impacto:** Perfil mostra apenas conteúdo real ✅

---

## 🟠 CORREÇÕES ALTA PRIORIDADE (AMANHÃ)

### 4. **ProvinciaFeed.tsx**
```typescript
import { mapValidLocal, filterValidPublications } from '@/utils/dataValidation';

// No useEffect
const validLocals = filterValidPublications(items);
const mapped = validLocals
  .map(item => mapValidLocal(item))
  .filter((item): item is Local => item !== null);
setLocals(mapped);
```

### 5. **Explore.tsx**
```typescript
import { mapValidLocal, filterValidPublications } from '@/utils/dataValidation';

// Ao carregar places
const validPlaces = filterValidPublications(data);
const places = validPlaces
  .map(p => mapValidLocal(p))
  .filter(Boolean);
```

### 6. **Favorites.tsx**
```typescript
// Filtrar ao carregar
const validFavorites = rawFavorites.filter(item => {
  const hasRealImages = item.images && 
    Array.isArray(item.images) && 
    item.images.length > 0 &&
    !item.images[0].includes('/images/local-');
  return hasRealImages;
});

// Mapear SEM fallbacks
setFavorites(validFavorites.map(item => ({
  ...item,
  image: item.images[0],
  images: item.images,
})));
```

---

## 🟡 CORREÇÕES MÉDIA PRIORIDADE (PRÓXIMOS 2 DIAS)

### 7-11. Componentes de Detalhes

**PostDetail.tsx:**
```typescript
// Linha 100 - REMOVER fallback
src={images[currentImage]}  // Se não tiver, não renderiza
```

**LocalDetail.tsx:**
```typescript
// Linha 123 - REMOVER fallback  
src={local.images[currentImageIndex]}
```

**DestinationDetail.tsx:**
```typescript
// Linha 155 - Filtrar serviços próximos
const validServices = nearbyServices.filter(s =>
  s.images && s.images.length > 0 &&
  !s.images[0].includes('/images/local-')
);
```

**ServicesListing.tsx:**
```typescript
import { mapValidService, filterValidPublications } from '@/utils/dataValidation';

const validServices = filterValidPublications(items);
const mapped = validServices
  .map(s => mapValidService(s))
  .filter(Boolean);
```

**PublicProfile.tsx:**
```typescript
// REMOVER linha 406
// onError={e => { (e.target as HTMLImageElement).src = '/images/local-1.jpg'; }}

// Filtrar posts antes de mapear
const validPosts = posts.filter(p =>
  p.images && p.images.length > 0 &&
  !p.images[0].includes('/images/local-')
);
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Antes de Corrigir
- [ ] Ler AUDITORIA_FINAL_DADOS_REAIS.md
- [ ] Ler CORRECAO_DADOS_REAIS.md
- [ ] Entender `src/utils/dataValidation.ts`

### Durante Correção
- [ ] Adicionar imports necessários
- [ ] Remover TODOS os fallbacks `/images/local-*`
- [ ] Remover TODOS os `onError` com fallback
- [ ] Adicionar `filterValidPublications`
- [ ] Adicionar `mapValid*` conforme tipo
- [ ] Filtrar nulls após mapeamento

### Após Correção
- [ ] Testar com backend real
- [ ] Verificar console para logs de validação
- [ ] Confirmar que nenhuma imagem local aparece
- [ ] Re-executar auditoria
- [ ] Atualizar documentação

---

## 🧪 TESTES OBRIGATÓRIOS

### Teste 1: Validação de Imagens
```
1. Criar publicação SEM imagem
2. Verificar que NÃO aparece no feed
3. Verificar log: [INVALID LOCAL] Sem imagens reais
```

### Teste 2: Dashboard Apurador
```
1. Submeter local sem imagens
2. Verificar que NÃO aparece em pendentes
3. Ou aparece mas não permite aprovar
```

### Teste 3: Perfil
```
1. Abrir perfil com publicações
2. Verificar que TODAS têm imagens reais
3. Nenhuma imagem /images/local-* visível
```

### Teste 4: Feeds
```
1. Navegar por Home, AllPosts, AllServices
2. Verificar que TODAS as publicações têm imagens reais
3. Scroll até o fim - nenhum placeholder
```

---

## 📊 MÉTRICAS DE SUCESSO

### Antes da Correção
- ❌ 25% componentes conformes (5/20)
- ❌ 15 componentes com fallbacks
- ❌ Risco de aprovar conteúdo sem imagens

### Após Correção
- ✅ 100% componentes conformes (20/20)
- ✅ 0 componentes com fallbacks
- ✅ Impossível aprovar sem imagens
- ✅ Feed 100% dados reais

---

## 🚀 ORDEM DE EXECUÇÃO

### Dia 1 (Hoje)
1. ✅ ApuradorDashboard.tsx (30 min)
2. ✅ AllPosts.tsx (20 min)
3. ✅ Profile.tsx (40 min)

**Total:** ~1.5 horas

### Dia 2 (Amanhã)
4. ✅ ProvinciaFeed.tsx (15 min)
5. ✅ Explore.tsx (15 min)
6. ✅ Favorites.tsx (20 min)

**Total:** ~50 minutos

### Dias 3-4
7-11. Componentes de detalhes (2 horas)

### Dia 5
- Testes completos
- Re-auditoria
- Documentação final

---

## 📝 TEMPLATE DE COMMIT

```
fix: remove image fallbacks from [ComponentName]

- Add validation using filterValidPublications
- Use mapValid* functions for data transformation
- Remove all '/images/local-*' fallbacks
- Remove onError handlers with fallback images
- Ensure only publications with real images are displayed

Refs: AUDITORIA_FINAL_DADOS_REAIS.md
```

---

## ⚠️ AVISOS IMPORTANTES

### NÃO FAZER:
❌ Adicionar novos fallbacks  
❌ Usar `|| '/images/local-*'`  
❌ Usar `onError` com fallback  
❌ Aprovar PRs sem verificar imagens  
❌ Ignorar logs de validação  

### SEMPRE FAZER:
✅ Usar `filterValidPublications`  
✅ Usar `mapValid*` functions  
✅ Filtrar nulls após mapeamento  
✅ Testar com backend real  
✅ Verificar console para warnings  

---

## 📞 SUPORTE

**Documentação:**
- `AUDITORIA_FINAL_DADOS_REAIS.md` - Relatório completo
- `CORRECAO_DADOS_REAIS.md` - Guia técnico
- `src/utils/dataValidation.ts` - Código de validação

**Dúvidas Comuns:**
1. **"Meu componente não mostra nada agora"**  
   → Correto! Só mostra se tiver imagens reais

2. **"Posso adicionar um fallback temporário?"**  
   → NÃO. Sem exceções.

3. **"E se o backend não devolver imagens?"**  
   → Fix no backend, não no frontend

---

**Status:** 🔴 AGUARDANDO IMPLEMENTAÇÃO  
**Próxima Revisão:** Após conclusão das correções  
**Aprovação Final:** Após re-auditoria com 100% conformidade
