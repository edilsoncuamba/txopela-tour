# ✅ Correção: Botão "Sugerir" no Perfil

## 🐛 Problema

O botão "Sugerir" no perfil do usuário estava abrindo a tela de **"Nova publicação"** (AddPost) ao invés de abrir o fluxo correto:
- **"Cadastrar serviço"** (AddService) para usuários tipo `guide` ou `business`
- **"Sugerir local"** (AddLocal) para usuários tipo `tourist`

## 🔍 Análise

### Fluxos Diferentes no Sistema

| Tela | Propósito | Para Quem |
|------|-----------|-----------|
| **AddPost** | "Nova publicação" - Criar posts no feed social | Todos |
| **AddService** | "Cadastrar serviço" - Wizard em 5 etapas | Guide, Business |
| **AddLocal** | "Sugerir local" - Cadastrar locais turísticos | Tourist |

### Navegação Anterior (Incorreta)

```
Perfil → Botão "Sugerir" → Nova publicação (AddPost) ❌
```

### Navegação Correta

```
Perfil → Botão "Sugerir" → {
  - Se user.type === 'guide' OU 'business' → Cadastrar serviço (AddService) ✅
  - Senão → Sugerir local (AddLocal) ✅
}
```

## ✅ Solução Aplicada

### 1. Atualização da Interface do Profile

**Arquivo:** `app/src/pages/Profile.tsx`

```typescript
interface ProfileProps {
  onSettings: () => void;
  onLocalPress: (local: Local) => void;
  onLogout: () => void;
  onAddPost: () => void;
  onEditProfile?: () => void;
  onSuggest?: () => void;  // ← NOVO: Fluxo correto baseado no tipo de usuário
}
```

### 2. Atualização do Botão "Sugerir"

**Arquivo:** `app/src/pages/Profile.tsx` (linha ~699)

```typescript
// ANTES:
onClick={onAddPost}  // ❌ Sempre abria Nova publicação

// DEPOIS:
onClick={onSuggest || onAddPost}  // ✅ Usa onSuggest se disponível
```

### 3. Atualização do App.tsx (Desktop)

**Arquivo:** `app/src/App.tsx` (linha ~442)

```typescript
// ANTES:
<Profile 
  onSettings={() => setShowSettings(true)}
  onLocalPress={handleLocalPress}
  onLogout={handleLogout}
  onAddPost={() => setShowAddPost(true)}  // ❌
  onEditProfile={() => setShowEditProfile(true)}
/>

// DEPOIS:
<Profile 
  onSettings={() => setShowSettings(true)}
  onLocalPress={handleLocalPress}
  onLogout={handleLogout}
  onAddPost={() => setShowAddPost(true)}
  onEditProfile={() => setShowEditProfile(true)}
  onSuggest={() => setActiveTab('add')}  // ✅ NOVO
/>
```

### 4. Atualização do App.tsx (Mobile)

**Arquivo:** `app/src/App.tsx` (linha ~510)

```typescript
// Mesma correção aplicada para versão mobile
onSuggest={() => setActiveTab('add')}  // ✅ NOVO
```

## 🔄 Fluxo Completo Após Correção

```
1. Usuário clica em "Sugerir" no perfil
   ↓
2. Profile.tsx chama onSuggest()
   ↓
3. App.tsx executa setActiveTab('add')
   ↓
4. App.tsx verifica tipo do usuário (linha 447):
   ↓
   ├─ Se user.type === 'business' OU 'guide'
   │  └→ Abre AddService (Cadastrar serviço em 5 etapas)
   │
   └─ Senão (tourist)
      └→ Abre AddLocal (Sugerir local)
```

## 📊 Comportamento por Tipo de Usuário

| Tipo de Usuário | Botão Mostra | Clica em "Sugerir" | Abre |
|-----------------|--------------|---------------------|------|
| **Tourist** | "Sugerir local" | Perfil → Sugerir | AddLocal ✅ |
| **Guide** | "Sugerir serviço" | Perfil → Sugerir | AddService ✅ |
| **Business** | "Sugerir serviço" | Perfil → Sugerir | AddService ✅ |

## 🎯 Locais do Botão "Sugerir"

Existem **2 locais** com botão "Sugerir":

### 1. Sidebar / Bottom Nav (Menu Principal)
- **Texto:** "Sugerir local" (varia com user.type)
- **Ação:** `handleTabChange('add')` → Abre AddService ou AddLocal
- **Status:** ✅ Sempre funcionou corretamente

### 2. Perfil (Community Banner)
- **Texto:** "Sugerir"
- **Ação:** ~~`onAddPost()`~~ → **CORRIGIDO** para `onSuggest()`
- **Status:** ✅ **AGORA CORRIGIDO**

## ✅ Checklist de Verificação

- [x] Profile.tsx: Interface atualizada com `onSuggest`
- [x] Profile.tsx: Botão usa `onSuggest || onAddPost`
- [x] App.tsx (Desktop): Passa `onSuggest={() => setActiveTab('add')}`
- [x] App.tsx (Mobile): Passa `onSuggest={() => setActiveTab('add')}`
- [x] Lógica de roteamento em App.tsx (linha 447) mantida
- [x] Backward compatibility: Se `onSuggest` não existir, usa `onAddPost`

## 🧪 Teste Manual

### Passo 1: Login como Turista
```
1. Login: turista@gmail.com / T123456
2. Ir para Perfil
3. Clicar em "Sugerir" no banner verde
4. ✅ Deve abrir: "Sugerir local" (AddLocal)
```

### Passo 2: Login como Guia
```
1. Login: servico@gmail.com / S123456
2. Ir para Perfil
3. Clicar em "Sugerir" no banner verde
4. ✅ Deve abrir: "Cadastrar serviço" (AddService - Step 1: Tipo)
```

### Passo 3: Login como Negócio
```
1. Login: negociantenormal@gmail.com / N123456
2. Ir para Perfil
3. Clicar em "Sugerir" no banner verde
4. ✅ Deve abrir: "Cadastrar serviço" (AddService - Step 1: Tipo)
```

## 📝 Notas Adicionais

### AddPost Ainda Disponível

A tela **"Nova publicação"** (AddPost) **ainda está disponível** através de:
- Botão "+" no topo de algumas listagens
- Outros locais específicos do app

O `onAddPost` foi mantido na interface para backward compatibility.

### Diferença Entre os Fluxos

| Fluxo | Telas | Campos |
|-------|-------|--------|
| **AddPost** | 1 tela simples | Título, Conteúdo, Fotos |
| **AddService** | 5 steps (wizard) | Tipo, Dados completos, Localização, Fotos, Revisão |
| **AddLocal** | Multi-step | Similar ao AddService mas para locais |

## 🎉 Resultado

Agora o botão "Sugerir" no perfil:
- ✅ Abre o fluxo correto baseado no tipo de usuário
- ✅ Mantém compatibilidade com código existente
- ✅ Funciona tanto em desktop quanto mobile
- ✅ Usuários Guide/Business veem o wizard de 5 etapas
- ✅ Usuários Tourist veem o formulário de sugerir local

---

**Data da correção:** 2026-06-05  
**Arquivos alterados:**
- `app/src/pages/Profile.tsx`
- `app/src/App.tsx`
