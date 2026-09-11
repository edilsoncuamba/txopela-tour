# 🗑️ Remoção de Todos os Dados Mockados

## 📋 Resumo
Todos os dados mockados (fallbacks) foram removidos do sistema. Agora a aplicação funciona **exclusivamente com dados da API**.

---

## ✅ Alterações Realizadas

### 1. **Home.tsx** ✅
**Removido:**
- ❌ Array mockado de 8 descobertas (Praia do Bilene, Tofo, etc.)
- ❌ Array mockado de 10 serviços (Casa da Praia, Hotel Cardoso, etc.)
- ❌ Array mockado de 8 posts (publicações fake)

**Implementado:**
- ✅ `discoveries` usa apenas `apiDiscoveries.map()`
- ✅ `services` usa apenas `apiServices.map()`  
- ✅ `posts` usa apenas `apiPosts.map()`
- ✅ Se API retornar array vazio → mostra array vazio (sem fallback)

**Código ANTES:**
```typescript
const discoveries = apiDiscoveries.length > 0 ? apiDiscoveries.map(...) : [
  { id: '1', name: 'Praia do Bilene', ... }, // 8 itens mockados
  ...
];
```

**Código DEPOIS:**
```typescript
const discoveries = apiDiscoveries.map((item: any) => ({
  id: String(item.id),
  name: item.name || 'Local',
  ...
}));
// Se apiDiscoveries = [] → discoveries = []
```

---

### 2. **Arquivos com Dados Mockados Identificados**

Estes arquivos ainda contêm dados mockados e precisam ser atualizados:

#### 📄 **DestinationDetail.tsx**
```typescript
const mockReviews: Review[] = [
  { id: '1', author: 'Anônimo', date: '07/06/2025', ... },
  ...
];

const mockServices = [
  { id: '1', name: 'Casa da Praia', ... },
  ...
];
```
**Ação:** Remover e buscar reviews/serviços da API

---

#### 📄 **ServiceDetail.tsx**
```typescript
const mockReviews: Review[] = [
  { id: '1', author: 'Anônimo', date: '07/06/2025', ... },
  ...
];
```
**Ação:** Remover e buscar reviews da API

---

#### 📄 **Profile.tsx**
```typescript
const mockReviews = [ ... ];      // 2 itens
const mockSuggestions = [ ... ];  // 2 itens
const mockDestinations = [ ... ]; // 2 itens
const mockSearches = [ ... ];     // 2 itens
```
**Ação:** Buscar dados reais do utilizador da API

---

#### 📄 **ServicesListing.tsx**
```typescript
const mockServices: Service[] = [
  { id: '1', name: 'Casa da Praia', ... }, // 10+ itens
  ...
];
```
**Ação:** Remover e usar apenas `servicesApi.list()`

---

#### 📄 **PublicProfile.tsx**
```typescript
const mockStats: Record<string, { followers: number; ... }> = { ... };
const mockFollowersByAuthor: Record<string, UserSummary[]> = { ... };
const mockFollowingByAuthor: Record<string, UserSummary[]> = { ... };
const mockAllPublicPosts = [ ... ];
```
**Ação:** Buscar dados do utilizador público da API

---

## 🎯 Estratégia de Remoção

### Fase 1: Remover Fallbacks ✅
- [x] Home.tsx - discoveries, services, posts

### Fase 2: Adicionar Estados Vazios
- [ ] Mensagem "Nenhuma descoberta disponível" quando `discoveries.length === 0`
- [ ] Mensagem "Nenhum serviço disponível" quando `services.length === 0`
- [ ] Mensagem "Nenhuma publicação ainda" quando `posts.length === 0`

### Fase 3: Remover Dados Mockados Restantes
- [ ] DestinationDetail.tsx → reviews, serviços relacionados
- [ ] ServiceDetail.tsx → reviews
- [ ] Profile.tsx → reviews, sugestões, destinos, pesquisas
- [ ] ServicesListing.tsx → lista completa de serviços
- [ ] PublicProfile.tsx → stats, followers, posts

---

## 🔄 Como Testar

### 1. **Backend com Dados**
```bash
# Login
curl -X POST http://192.168.88.127:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"turista@gmail.com","password":"T123456"}'

# Verificar locais
curl http://192.168.88.127:8000/api/locals

# Verificar serviços  
curl http://192.168.88.127:8000/api/services

# Verificar posts
curl http://192.168.88.127:8000/api/posts
```

**Resultado Esperado:**
- ✅ Dados aparecem na Home
- ✅ Descobertas, serviços e posts vêm da API

---

### 2. **Backend Sem Dados (Arrays Vazios)**
```json
// GET /api/locals → []
// GET /api/services → []
// GET /api/posts → []
```

**Resultado Esperado:**
- ✅ Home carrega sem erros
- ✅ Seções mostram arrays vazios (sem cartões)
- ⚠️ **Falta implementar:** Mensagens de estado vazio

---

### 3. **Backend Offline**
```bash
# Para o backend
```

**Resultado Esperado:**
- ✅ Login **não funciona** (mostra erro)
- ✅ Home **não carrega** dados (arrays vazios)
- ⚠️ **Falta implementar:** Mensagens de erro de conexão

---

## 📦 Estados Vazios a Implementar

### Descobertas Vazias
```tsx
{isLoadingDiscoveries ? (
  <div className="px-4 py-8 text-center">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#1B5E3B] rounded-full animate-spin mx-auto mb-3" />
    <p className="text-sm text-gray-500">A carregar descobertas...</p>
  </div>
) : discoveries.length === 0 ? (
  <div className="px-4 py-8 text-center">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" className="mx-auto mb-3">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
    <p className="text-sm font-semibold text-gray-700 mb-1">Nenhuma descoberta ainda</p>
    <p className="text-xs text-gray-500">Verifica a tua conexão ou aguarda novos conteúdos</p>
  </div>
) : (
  // Render discoveries
)}
```

### Serviços Vazios
```tsx
{isLoadingServices ? (
  <LoadingState text="A carregar serviços..." />
) : services.length === 0 ? (
  <EmptyState 
    icon="store"
    title="Nenhum serviço disponível"
    subtitle="Ainda não há serviços cadastrados"
  />
) : (
  // Render services
)}
```

### Posts Vazios
```tsx
{isLoadingPosts ? (
  <LoadingState text="A carregar publicações..." />
) : posts.length === 0 ? (
  <EmptyState 
    icon="image"
    title="Nenhuma publicação ainda"
    subtitle="Sê o primeiro a partilhar algo!"
  />
) : (
  // Render posts
)}
```

---

## 🚨 Impacto

### Positivo ✅
- ✅ **Segurança**: Sem dados falsos enganando utilizadores
- ✅ **Realidade**: App mostra apenas dados reais da API
- ✅ **Consistência**: Todos os componentes usam mesma fonte
- ✅ **Debugging**: Mais fácil identificar problemas de API

### Negativo ⚠️
- ⚠️ **UX temporária**: Sem estados vazios, a app parece "vazia"
- ⚠️ **Testes**: Precisa backend com dados para testar
- ⚠️ **Demo**: Não funciona offline/sem API

---

## 📝 Próximos Passos

### Prioridade Alta 🔴
1. **Implementar estados vazios na Home** (discoveries, services, posts)
2. **Adicionar mensagens de erro quando API falha**
3. **Loading states durante fetch**

### Prioridade Média 🟡  
4. Remover mockReviews de DestinationDetail
5. Remover mockReviews de ServiceDetail
6. Remover mockServices de ServicesListing

### Prioridade Baixa 🟢
7. Remover mock data de Profile
8. Remover mock data de PublicProfile
9. Criar componentes reutilizáveis (EmptyState, LoadingState)

---

## 💡 Componentes Reutilizáveis Sugeridos

### `<EmptyState />`
```tsx
interface EmptyStateProps {
  icon: 'map' | 'store' | 'image' | 'user';
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}
```

### `<LoadingState />`
```tsx
interface LoadingStateProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

### `<ErrorState />`
```tsx
interface ErrorStateProps {
  title: string;
  message: string;
  retry?: () => void;
}
```

---

**Status Actual:**
- ✅ Home.tsx - Dados mockados removidos
- ⏳ Estados vazios - Pendente
- ⏳ Outros componentes - Pendente

**Data:** 2026-06-03  
**Progresso:** 20% concluído
