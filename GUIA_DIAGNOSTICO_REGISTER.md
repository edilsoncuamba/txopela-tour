# 🔍 Guia de Diagnóstico — Problema no Registro

## 📋 Problema Identificado

**Sintoma:** Conta é criada no backend (retorna 200 OK), mas o frontend não transita para a próxima tela.

**Causa provável:** A resposta do backend pode não estar no formato esperado pelo frontend.

---

## ✅ Correções Já Aplicadas

### 1. **Logging extensivo**
Adicionado console.log em pontos estratégicos:
- `AuthContext.tsx` — função `register`
- `Register.tsx` — função `handleFinalSubmit`

### 2. **Suporte a múltiplos formatos de token**
O código agora aceita:
```typescript
const token = data.token ?? data.access_token ?? data.access;
const refreshToken = data.refreshToken ?? data.refresh_token ?? data.refresh;
```

### 3. **Fluxo robusto de registro**
```typescript
// 1. Se resposta tem user.id → Define user imediatamente
if (userData?.id || userData?.pk || userData?.email) {
  setUser(mapApiUser(userData));
  return { ok: true };
}

// 2. Se tem token mas não tem user → Busca perfil via /api/auth/me
if (token) {
  await refreshUser(); // Chama /api/auth/me com o token
  return { ok: true }; // Retorna ok MESMO se refreshUser falhar
}

// 3. Fallback → Tenta login automático
const loginResult = await login(email, password);
return { ok: true }; // Retorna ok MESMO se login falhar (conta foi criada)
```

### 4. **Sempre retorna `{ ok: true }`**
Quando o backend retorna 200, o frontend sempre considera sucesso — mesmo que não consiga buscar o perfil imediatamente.

---

## 🧪 Como Testar

### **Passo 1: Abrir Console do Browser**
1. Abrir DevTools (F12)
2. Ir para a aba **Console**
3. Limpar console (ícone 🚫)

### **Passo 2: Criar Nova Conta**
1. Ir para página de registro
2. Preencher:
   - Nome: `Teste User`
   - Email: `teste-$(Date.now())@gmail.com` (email único)
   - Senha: `Test1234`
   - Confirmar senha: `Test1234`
3. Avançar para escolher perfil (ex: Viajante)
4. Aceitar termos
5. Avançar para foto de perfil
6. Clicar **"Criar conta"** (pode pular foto)

### **Passo 3: Verificar Logs no Console**

Você deve ver esta sequência:

```
[AuthContext] Register attempt: { name: "Teste User", email: "...", role: "tourist" }
[AuthContext] Register response: { status: 200, ok: true, data: {...} }
```

**Agora veja o que aparece depois:**

#### ✅ **Cenário A: Resposta completa (ideal)**
```
[AuthContext] User data found in register response
[Register] result: { ok: true }
```
→ **O que acontece:** Transita imediatamente ✅

#### ⚠️ **Cenário B: Resposta com token mas sem user**
```
[AuthContext] Token received but no user data, calling refreshUser...
[AuthContext] refreshUser succeeded
[Register] result: { ok: true }
```
→ **O que acontece:** Transita após buscar perfil ✅

#### ❌ **Cenário C: Resposta sem token nem user**
```
[AuthContext] No token received, attempting auto-login...
[AuthContext] Auto-login after register failed, but account was created: ...
[Register] result: { ok: true }
```
→ **O que acontece:** Deve transitar (mas pode não estar logado) ⚠️

#### 🔴 **Cenário D: Erro no backend**
```
[AuthContext] Register response: { status: 400, ok: false, data: {...} }
[Register] result: { ok: false, error: "..." }
```
→ **O que acontece:** Mostra erro, não transita ❌

---

## 🔍 Diagnóstico

### **Se aparecer Cenário A ou B** → Funciona!
O código está correto.

### **Se aparecer Cenário C** → Backend não retorna token
**Problema:** O backend retorna 200 mas não envia `token` na resposta.

**Solução:** Verificar backend — o endpoint `/api/auth/register` DEVE retornar:
```json
{
  "success": true,
  "token": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": 1,
    "name": "...",
    "email": "...",
    "role": "tourist"
  }
}
```

### **Se aparecer Cenário D** → Erro de validação
Ver mensagem de erro específica no log.

### **Se não transitar MESMO com `{ ok: true }`**
**Problema:** Pode ser no `Register.tsx` após receber `result.ok = true`.

Verificar se existe `onRegister()` sendo chamado:
```typescript
if (!result.ok) {
  setAvatarError(result.error ?? 'Erro ao criar conta. Tenta novamente.');
  return; // ← Para aqui se result.ok = false
}

// ... upload avatar ...

if (onOTPRequired) onOTPRequired(formData.email);
else onRegister(); // ← Deve chamar isto se result.ok = true
```

---

## 📊 Comparação de Formatos de Resposta

### **Formato Django REST Framework padrão**
```json
{
  "token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": 1,
    "email": "...",
    "name": "..."
  }
}
```
✅ **Suportado**

### **Formato JWT com access/refresh**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": { ... }
}
```
✅ **Suportado**

### **Formato JWT simples**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { ... }
}
```
✅ **Suportado**

### **Formato nested user**
```json
{
  "token": "eyJ...",
  "data": {
    "user": { ... }
  }
}
```
✅ **Suportado**

### **Formato sem user (busca depois)**
```json
{
  "token": "eyJ..."
}
```
✅ **Suportado** (chama `/api/auth/me`)

### **Formato user direto (sem wrapper)**
```json
{
  "id": 1,
  "email": "...",
  "name": "...",
  "token": "eyJ..."
}
```
✅ **Suportado**

---

## 🚨 Erros Comuns

### **1. Backend retorna 200 mas resposta vazia**
```
[AuthContext] Register response: { status: 200, ok: true, data: {} }
[AuthContext] No token received, attempting auto-login...
```
→ **Solução:** Verificar view do Django — deve retornar token na resposta.

### **2. Token salvo mas não transita**
```
[AuthContext] Saved access_token
[AuthContext] Token received but no user data, calling refreshUser...
[AuthContext] refreshUser failed: ...
```
→ **Verificar:** O token é válido? Testar manualmente:
```bash
curl -H "Authorization: Bearer <TOKEN>" http://192.168.88.89:8000/api/auth/me
```

### **3. CORS bloqueia request**
```
Access to fetch at 'http://192.168.88.89:8000/api/auth/register' from origin 'http://localhost:5173' has been blocked by CORS
```
→ **Solução:** Adicionar no backend Django:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://192.168.88.89:5173",
]
```

---

## 🛠️ Comandos de Teste Manual

### **1. Testar registro via curl**
```bash
curl -X POST http://192.168.88.89:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "Test1234",
    "role": "tourist",
    "termsAccepted": true
  }'
```

### **2. Testar se token funciona**
```bash
# Copiar token do localStorage (F12 → Application → Local Storage)
curl -H "Authorization: Bearer <TOKEN>" \
  http://192.168.88.89:8000/api/auth/me
```

### **3. Verificar se email já existe**
```bash
curl -X POST http://192.168.88.89:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "Test1234",
    "role": "tourist",
    "termsAccepted": true
  }'
```
Se retornar 400 com "Email já registado" → Conta existe ✅

---

## 📝 Próximos Passos

1. ✅ **Testar registro** seguindo "Como Testar"
2. ✅ **Copiar logs do console** e compartilhar
3. ✅ **Verificar formato da resposta** do backend
4. ❓ **Se ainda não funcionar** → Verificar se `onRegister()` está a ser chamado

---

## 💡 Resumo

O código frontend agora:
- ✅ Suporta múltiplos formatos de resposta
- ✅ Tenta buscar perfil se não vier na resposta
- ✅ **SEMPRE retorna `{ ok: true }` quando backend retorna 200**
- ✅ Tem logging detalhado para diagnóstico

Se ainda não transitar, o problema está em:
1. Backend não retorna 200 (verificar com curl)
2. Backend retorna 200 mas sem token (adicionar token na view)
3. Frontend recebe `{ ok: true }` mas não chama `onRegister()` (verificar código do componente pai)

