# ✅ Correções Aplicadas — Registro de Conta

## 🔍 Problema Identificado

**Sintoma:** Quando o utilizador cria uma conta, o backend retorna status 200 (sucesso), mas o frontend não transita para a tela seguinte. A conta fica criada no backend, mas só funciona quando o utilizador tenta fazer login manualmente.

**Causa:** O backend pode retornar diferentes formatos de resposta após o registro:
1. `{ token, user }` — Com token e dados completos do user
2. `{ token }` — Com token mas sem dados do user
3. `{ access_token, refresh_token }` — Com nomes diferentes de token
4. Resposta sem `user.id` definido

O código antigo falhava quando o backend não enviava `user.id`, tentando fazer login automático. Se o login demorava ou falhava, o frontend travava sem transitar.

---

## 🛠️ Solução Implementada

### **1. AuthContext.tsx — Função `register` mais robusta**

Agora a função `register` suporta múltiplos formatos de resposta e **sempre retorna `{ ok: true }`** quando a conta é criada no backend (mesmo que não consiga buscar o perfil do utilizador imediatamente):

```typescript
// Suporta diferentes nomes de token
const token = data.token ?? data.access_token ?? data.access;
const refreshToken = data.refreshToken ?? data.refresh_token ?? data.refresh;

// Guarda os tokens
if (token) {
  localStorage.setItem('access_token', token);
  console.log('[AuthContext] Saved access_token');
}
if (refreshToken) {
  localStorage.setItem('refresh_token', refreshToken);
  console.log('[AuthContext] Saved refresh_token');
}

// Cenário 1: User data completo na resposta
const userData = data.user ?? data.data?.user ?? data;
if (userData?.id || userData?.pk || userData?.email) {
  console.log('[AuthContext] User data found in register response');
  setUser(mapApiUser(userData));
  return { ok: true };
}

// Cenário 2: Só token, sem user data
if (token) {
  console.log('[AuthContext] Token received but no user data, calling refreshUser...');
  try {
    await refreshUser(); // Busca perfil via GET /api/users/me
    console.log('[AuthContext] refreshUser succeeded');
  } catch (err) {
    console.warn('[AuthContext] refreshUser failed:', err);
    // refreshUser falhou mas temos token — consideramos ok na mesma
  }
  return { ok: true }; // ✅ Sempre retorna ok se recebeu token
}

// Cenário 3: Fallback — tenta login automático
console.log('[AuthContext] No token received, attempting auto-login...');
const loginResult = await login(email, password);
if (!loginResult.ok) {
  console.warn('[AuthContext] Auto-login after register failed, but account was created:', loginResult.error);
}
return { ok: true }; // ✅ Retorna ok porque a conta foi criada
```

### **2. Logging adicionado para diagnóstico**

Console logs estratégicos foram adicionados para facilitar o debugging:

**No AuthContext.tsx:**
- `[AuthContext] Register attempt:` — Mostra dados enviados ao backend
- `[AuthContext] Register response:` — Mostra status e resposta completa
- `[AuthContext] Saved access_token` — Confirma que o token foi guardado
- `[AuthContext] Saved refresh_token` — Confirma que o refresh token foi guardado
- `[AuthContext] User data found in register response` — Dados do user vieram na resposta
- `[AuthContext] Token received but no user data, calling refreshUser...` — Vai buscar perfil
- `[AuthContext] refreshUser succeeded` — Perfil obtido com sucesso
- `[AuthContext] refreshUser failed:` — Falha ao buscar perfil (não bloqueia)
- `[AuthContext] No token received, attempting auto-login...` — Fallback
- `[AuthContext] Auto-login after register failed, but account was created:` — Auto-login falhou

**No Register.tsx:**
- `[Register] result:` — Mostra o resultado final processado

### **3. Upload de avatar não bloqueante**

O upload de avatar continua opcional. Se falhar, a conta é criada na mesma e o utilizador pode adicionar o avatar mais tarde.

---

## 🧪 Como Testar

### **Passo 1: Preparar ambiente**
1. Abrir o browser com F12 → **Console**
2. Garantir que o backend está activo e acessível

### **Passo 2: Criar conta**
1. Preencher o formulário de registro com um **email único**
2. Escolher tipo de perfil
3. Opcional: Adicionar foto de perfil
4. Submeter o formulário

### **Passo 3: Verificar logs no console**
Você deve ver algo como:

```
[AuthContext] Register attempt: { name: "João Silva", email: "joao@exemplo.com", role: "tourist" }
[AuthContext] Register response: { status: 200, ok: true, data: {...} }
[AuthContext] Saved access_token
[AuthContext] Saved refresh_token
[AuthContext] User data found in register response
[Register] result: { ok: true }
```

**OU**, se o backend não enviar user data:

```
[AuthContext] Register attempt: { name: "João Silva", email: "joao@exemplo.com", role: "tourist" }
[AuthContext] Register response: { status: 200, ok: true, data: { token: "..." } }
[AuthContext] Saved access_token
[AuthContext] Token received but no user data, calling refreshUser...
[AuthContext] refreshUser succeeded
[Register] result: { ok: true }
```

### **Passo 4: Confirmar transição**
- O frontend deve transitar para a tela seguinte **automaticamente**
- Mesmo que apareça um warning no console, a transição deve ocorrer

---

## 📋 Cenários Cobertos

| Resposta do backend | O que acontece agora | Resultado |
|---------------------|----------------------|-----------|
| `{ token, user }` com `user.id` | Guarda token + user | ✅ Transita imediatamente |
| `{ token }` sem user data | Guarda token + chama `refreshUser()` | ✅ Transita (mesmo se refreshUser falhar) |
| `{ access_token, refresh_token }` | Guarda tokens com nomes alternativos | ✅ Transita |
| Status 200 mas sem token | Tenta login automático | ✅ Transita (conta foi criada) |
| Status 400/409/422 | Mostra erro no frontend | ❌ Não transita (erro de validação) |
| Timeout ou erro de rede | Mostra erro no frontend | ❌ Não transita (conta pode ou não ter sido criada) |

---

## 🔍 Se ainda não funcionar

### **1. Verificar console do browser**
- Qual é o erro exato?
- O log `[AuthContext] Register response:` mostra `ok: true` ou `ok: false`?
- Qual é o conteúdo de `data` na resposta?

### **2. Verificar console do backend**
- O POST `/api/auth/register` completou com sucesso?
- Qual é o status code retornado? (200, 201, 400, 500?)
- O backend retorna `token` na resposta?

### **3. Verificar localStorage**
Abrir F12 → Application → Local Storage → verificar se existe:
- `access_token`
- `refresh_token` (opcional)

### **4. Verificar endpoint `/api/users/me`**
Se o backend retornar token mas sem user data, o frontend vai chamar:
```
GET /api/users/me
Authorization: Bearer <token>
```

Garantir que este endpoint:
- Está implementado
- Retorna dados do utilizador no formato esperado
- Aceita o token recebido no registro

---

## 📝 Mudanças de Comportamento

### **Antes:**
- Se o backend não retornasse `user.id`, tentava login automático
- Se o login automático falhasse, retornava `{ ok: false }`
- Utilizador ficava bloqueado mesmo com conta criada

### **Depois:**
- Tenta múltiplas estratégias para obter os dados do utilizador
- **Sempre retorna `{ ok: true }`** quando a conta é criada (status 200)
- Prioriza não bloquear o utilizador
- Logging extensivo para facilitar debugging

---

## 🎯 Filosofia da Correção

**Princípio:** "A conta foi criada no backend → o utilizador não deve ficar bloqueado"

O código agora é mais tolerante e resiliente:
- Suporta diferentes formatos de resposta do backend
- Não depende de um único campo específico
- Tem múltiplos fallbacks
- Logging detalhado para diagnóstico rápido

---

## 🚀 Próximos Passos

Se o problema persistir após estas correções:

1. **Compartilhar os logs completos** do console (frontend + backend)
2. **Verificar a resposta exacta** do backend para POST `/api/auth/register`
3. **Garantir que o backend retorna `token`** na resposta de registro

O código agora fornece toda a informação necessária para diagnosticar qualquer problema restante através dos logs do console.
