# 🔄 Login: Antes vs Depois

## ❌ ANTES (Problema)

### Comportamento Antigo
```typescript
// Login aceitava QUALQUER credencial
if (API_offline || API_error || credenciais_erradas) {
  // ⚠️ Fazia login na mesma com dados fake
  loginLocal({ 
    id: 'demo-123', 
    email: email, 
    type: 'traveler' 
  });
  onLogin(); // ← Entrava sem validar!
}
```

### Fluxo Antigo
```
Utilizador → Email + Senha
    ↓
Tenta API
    ↓
API offline? → ✅ Login com dados fake
    ↓
Credenciais erradas? → ✅ Login com dados fake
    ↓
Servidor com erro? → ✅ Login com dados fake
```

### Problemas
❌ **Segurança zero** - Qualquer pessoa entrava  
❌ **Sem validação** - Email/senha não eram verificados  
❌ **Modo demo sempre activo** - Nunca usava a API de verdade  
❌ **Roles incorrectos** - Todos eram "traveler"  
❌ **Tokens falsos** - Não guardava tokens reais  

---

## ✅ DEPOIS (Solução)

### Comportamento Novo
```typescript
// Login APENAS com API válida
const res = await fetch('/api/auth/login', { ... });

if (!res.ok) {
  // ❌ Mostra erro específico
  setError('Email ou senha incorrectos');
  return; // ← NÃO faz login!
}

// ✅ Só entra se a API confirmar
const data = await res.json();
localStorage.setItem('access_token', data.token);
loginLocal(data.user);
onLogin();
```

### Fluxo Novo
```
Utilizador → Email + Senha
    ↓
Validação Local (formato, campos obrigatórios)
    ↓
POST /api/auth/login (com timeout de 15s)
    ↓
API valida credenciais
    ↓
❌ Erro? → Mostra mensagem e NÃO entra
    ↓
✅ Sucesso? → Guarda tokens + entra
```

### Melhorias
✅ **Segurança real** - Só entra com credenciais válidas  
✅ **Validação rigorosa** - Email formato correcto, senha mínimo 6 caracteres  
✅ **Sem modo demo** - Sempre usa a API  
✅ **Roles correctos** - Mapeia tourist/guide/business da API  
✅ **Tokens reais** - Guarda access_token + refresh_token  
✅ **Erros dinâmicos** - Mensagens específicas da API  

---

## 📊 Comparação Visual

### Cenário 1: Backend Offline

#### ❌ ANTES
```
Backend offline
    ↓
✅ Login bem-sucedido (FAKE)
    ↓
Utilizador entra com dados inventados
```

#### ✅ DEPOIS
```
Backend offline
    ↓
❌ Erro: "Sem conexão com o servidor..."
    ↓
Utilizador NÃO entra
```

---

### Cenário 2: Credenciais Erradas

#### ❌ ANTES
```
Email: qualquer@coisa.com
Senha: senhaerrada
    ↓
API retorna 401 Unauthorized
    ↓
✅ Login bem-sucedido (FAKE)
    ↓
Utilizador entra com dados inventados
```

#### ✅ DEPOIS
```
Email: qualquer@coisa.com
Senha: senhaerrada
    ↓
API retorna 401 Unauthorized
    ↓
❌ Erro: "Email ou senha incorrectos"
    ↓
Utilizador NÃO entra
```

---

### Cenário 3: Login com Turista

#### ❌ ANTES
```
Email: turista@gmail.com
Senha: T123456
    ↓
API retorna: { role: "tourist" }
    ↓
✅ Login OK, mas role mapeado errado
    ↓
Utilizador vê "Sugerir Local" (correcto por acaso)
```

#### ✅ DEPOIS
```
Email: turista@gmail.com
Senha: T123456
    ↓
API retorna: { role: "tourist", token: "..." }
    ↓
Role mapeado: tourist → type: "traveler"
    ↓
Tokens guardados no localStorage
    ↓
✅ Login OK com dados corretos
    ↓
Utilizador vê "Sugerir Local" (correcto garantido)
```

---

### Cenário 4: Login com Guide

#### ❌ ANTES
```
Email: servico@gmail.com
Senha: S123456
    ↓
API retorna: { role: "guide" }
    ↓
❌ Fallback para demo (role ignorado)
    ↓
Utilizador entra como "traveler" (ERRADO!)
    ↓
Vê "Sugerir Local" em vez de "Sugerir Serviço"
```

#### ✅ DEPOIS
```
Email: servico@gmail.com
Senha: S123456
    ↓
API retorna: { role: "guide", token: "..." }
    ↓
Role mapeado: guide → type: "guide"
    ↓
Tokens guardados no localStorage
    ↓
✅ Login OK como guide
    ↓
Utilizador vê "Sugerir Serviço" (CORRECTO!)
```

---

## 🔐 Validações Adicionadas

### 1. Email
```typescript
// ❌ ANTES: Sem validação
if (!email.trim()) { ... }

// ✅ DEPOIS: Valida formato
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email.trim())) {
  setError('Por favor, insere um email válido.');
}
```

### 2. Senha
```typescript
// ❌ ANTES: Sem validação mínima
if (!password.trim()) { ... }

// ✅ DEPOIS: Valida comprimento mínimo
if (password.length < 6) {
  setError('A senha deve ter pelo menos 6 caracteres.');
}
```

### 3. Timeout
```typescript
// ❌ ANTES: 10 segundos
setTimeout(() => controller.abort(), 10000);

// ✅ DEPOIS: 15 segundos
setTimeout(() => controller.abort(), 15000);
```

---

## 📝 Código Removido vs Adicionado

### ❌ Removido (Modo Demo)
```typescript
// Tudo isto foi REMOVIDO:
if (res && res.ok) {
  // OK
} else {
  // ❌ Login fake
  loginLocal({
    id: 'demo-' + Date.now(),
    name: email.split('@')[0],
    email: email.trim(),
    type: 'traveler',
  });
  onLogin(); // ← Isto era o problema!
}
```

### ✅ Adicionado (Validação Real)
```typescript
// Validação local ANTES de chamar API
if (!email.trim()) {
  setError('Por favor, insere o teu email.');
  return;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email.trim())) {
  setError('Por favor, insere um email válido.');
  return;
}

if (password.length < 6) {
  setError('A senha deve ter pelo menos 6 caracteres.');
  return;
}

// Tratamento de erros específico
if (!res.ok) {
  let errorMessage = 'Email ou senha incorrectos.';
  
  if (res.status === 400) { /* validação */ }
  else if (res.status === 401) { /* não autorizado */ }
  else if (res.status === 403) { /* conta desativada */ }
  else if (res.status === 429) { /* muitas tentativas */ }
  else if (res.status >= 500) { /* servidor offline */ }
  
  setError(errorMessage);
  return; // ← NÃO entra!
}
```

---

## 🎯 Resumo da Mudança

| Aspecto | ❌ Antes | ✅ Depois |
|---------|---------|-----------|
| **Segurança** | Nenhuma | API obrigatória |
| **Validação** | Básica | Rigorosa (formato + comprimento) |
| **Modo Demo** | Sempre activo | Removido completamente |
| **Erros** | Genéricos | Específicos por código HTTP |
| **Roles** | Ignorados | Mapeados correctamente |
| **Tokens** | Falsos | Reais (localStorage) |
| **Timeout** | 10s | 15s |
| **Fallback** | Login fake | Sem fallback |

---

## ✅ Resultado Final

### O que NÃO funciona mais (propositadamente)
❌ Login sem internet  
❌ Login com credenciais erradas  
❌ Login com backend offline  
❌ Modo demo / Login fake  

### O que funciona agora
✅ Login apenas com API válida  
✅ Validação de formato de email  
✅ Validação de comprimento de senha  
✅ Mensagens de erro específicas  
✅ Mapeamento correcto de roles  
✅ Gestão de tokens real  
✅ Timeout de 15 segundos  
✅ Tratamento de todos os erros HTTP  

---

**Conclusão:** O login agora é **seguro, robusto e profissional**. Não há atalhos nem fallbacks inseguros.

**Data:** 2026-06-03  
**Status:** ✅ Implementado e Documentado
