# 📊 Cenários Possíveis no Registro

## 🎯 O que acontece quando crio uma conta?

Aqui estão **TODOS** os cenários possíveis, o que você verá no console, e o resultado esperado.

---

## ✅ CENÁRIO 1: Resposta Completa (IDEAL)

### **Backend retorna:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@test.com",
    "role": "tourist"
  }
}
```

### **Logs no Console:**
```
[AuthContext] Register attempt: { name: "Test User", email: "test@test.com", role: "tourist" }
[AuthContext] Register response: { status: 200, ok: true, data: {...} }
[AuthContext] Saved access_token
[AuthContext] Saved refresh_token
[AuthContext] User data found in register response
[Register] result: { ok: true }
```

### **O que acontece:**
1. ✅ Token salvo no `localStorage`
2. ✅ User definido imediatamente
3. ✅ **Transita para próxima tela**

### **Tempo:** ~500ms

---

## ⚠️ CENÁRIO 2: Apenas Token (SEM USER)

### **Backend retorna:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Logs no Console:**
```
[AuthContext] Register attempt: { name: "Test User", email: "test@test.com", role: "tourist" }
[AuthContext] Register response: { status: 200, ok: true, data: {...} }
[AuthContext] Saved access_token
[AuthContext] Saved refresh_token
[AuthContext] Token received but no user data, calling refreshUser...
[AuthContext] refreshUser succeeded
[Register] result: { ok: true }
```

### **O que acontece:**
1. ✅ Token salvo no `localStorage`
2. ⏳ Frontend chama `/api/auth/me` para buscar perfil
3. ✅ User definido após buscar perfil
4. ✅ **Transita para próxima tela**

### **Tempo:** ~1s (depende do `/api/auth/me`)

---

## ⚠️ CENÁRIO 3: Token com Nome Diferente

### **Backend retorna:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### **Logs no Console:**
```
[AuthContext] Register attempt: { ... }
[AuthContext] Register response: { status: 200, ok: true, data: {...} }
[AuthContext] Saved access_token
[AuthContext] Saved refresh_token
[AuthContext] User data found in register response
[Register] result: { ok: true }
```

### **O que acontece:**
1. ✅ Frontend detecta `access_token` (suporta múltiplos nomes)
2. ✅ Token salvo corretamente
3. ✅ User definido
4. ✅ **Transita para próxima tela**

### **Tempo:** ~500ms

---

## 🔴 CENÁRIO 4: Sem Token (PROBLEMÁTICO)

### **Backend retorna:**
```json
{
  "success": true,
  "message": "User created successfully"
}
```

### **Logs no Console:**
```
[AuthContext] Register attempt: { ... }
[AuthContext] Register response: { status: 200, ok: true, data: {...} }
[AuthContext] No token received, attempting auto-login...
[AuthContext] Login attempt for: test@test.com
[AuthContext] Login response: { status: 200, ok: true, data: {...} }
[AuthContext] Saved access_token
[Register] result: { ok: true }
```

### **O que acontece:**
1. ⚠️ Backend não enviou token
2. ⏳ Frontend tenta login automático com as credenciais
3. ✅ Se login funcionar → User definido
4. ✅ **Transita para próxima tela**

### **Tempo:** ~2s (2 requests ao backend)

### **⚠️ PROBLEMA:**
- Mais lento (2 requests)
- Se senha for hasheada diferente, login pode falhar
- **Solução:** Backend deve retornar `token` no register!

---

## ❌ CENÁRIO 5: Email Já Existe

### **Backend retorna:**
```json
{
  "email": ["User with this email already exists."]
}
```
**Status:** 400

### **Logs no Console:**
```
[AuthContext] Register attempt: { ... }
[AuthContext] Register response: { status: 400, ok: false, data: {...} }
[Register] result: { ok: false, error: "Email: User with this email already exists." }
```

### **O que acontece:**
1. ❌ Backend rejeita request
2. ❌ Frontend mostra erro na tela
3. ❌ **NÃO transita**

### **Tempo:** ~500ms

---

## ❌ CENÁRIO 6: Senha Fraca

### **Backend retorna:**
```json
{
  "password": ["This password is too common."]
}
```
**Status:** 400

### **Logs no Console:**
```
[AuthContext] Register attempt: { ... }
[AuthContext] Register response: { status: 400, ok: false, data: {...} }
[Register] result: { ok: false, error: "Senha: This password is too common." }
```

### **O que acontece:**
1. ❌ Backend rejeita request
2. ❌ Frontend mostra erro na tela
3. ❌ **NÃO transita**

### **Tempo:** ~500ms

---

## 🔌 CENÁRIO 7: Backend Offline

### **Backend retorna:**
(nada — conexão falha)

### **Logs no Console:**
```
[AuthContext] Register attempt: { ... }
[AuthContext] Register error: Failed to fetch
[Register] result: { ok: false, error: "Sem conexão com o servidor em http://192.168.88.89:8000..." }
```

### **O que acontece:**
1. ❌ Não consegue conectar ao backend
2. ❌ Frontend mostra erro de conexão
3. ❌ **NÃO transita**

### **Tempo:** ~15s (timeout)

---

## ⏱️ CENÁRIO 8: Timeout

### **Backend retorna:**
(demora mais de 15 segundos)

### **Logs no Console:**
```
[AuthContext] Register attempt: { ... }
[AuthContext] Register error: AbortError
[Register] result: { ok: false, error: "Tempo de espera esgotado. Verifica a tua conexão." }
```

### **O que acontece:**
1. ⏳ Request demora muito
2. ❌ Frontend cancela após 15s
3. ❌ Frontend mostra erro de timeout
4. ❌ **NÃO transita**
5. ⚠️ Conta pode ter sido criada no backend!

### **Tempo:** 15s (timeout)

---

## 🔧 CENÁRIO 9: Erro no Backend (500)

### **Backend retorna:**
```json
{
  "detail": "Internal server error"
}
```
**Status:** 500

### **Logs no Console:**
```
[AuthContext] Register attempt: { ... }
[AuthContext] Register response: { status: 500, ok: false, data: {...} }
[Register] result: { ok: false, error: "Servidor temporariamente indisponível. Tenta mais tarde." }
```

### **O que acontece:**
1. ❌ Erro no servidor Django
2. ❌ Frontend mostra erro genérico
3. ❌ **NÃO transita**

### **Tempo:** ~1s

---

## 📊 Resumo Visual

| Cenário | Backend Status | Tem Token? | Tem User? | Resultado | Tempo |
|---------|----------------|------------|-----------|-----------|-------|
| **1. Completo** | 200 | ✅ | ✅ | ✅ Transita | ~500ms |
| **2. Só Token** | 200 | ✅ | ❌ | ✅ Transita (busca perfil) | ~1s |
| **3. Token Diferente** | 200 | ✅ | ✅ | ✅ Transita | ~500ms |
| **4. Sem Token** | 200 | ❌ | ❌ | ✅ Transita (login auto) | ~2s |
| **5. Email Existe** | 400 | ❌ | ❌ | ❌ Erro | ~500ms |
| **6. Senha Fraca** | 400 | ❌ | ❌ | ❌ Erro | ~500ms |
| **7. Offline** | - | ❌ | ❌ | ❌ Erro conexão | ~15s |
| **8. Timeout** | - | ❌ | ❌ | ❌ Erro timeout | 15s |
| **9. Erro 500** | 500 | ❌ | ❌ | ❌ Erro servidor | ~1s |

---

## 🎯 Qual cenário é o MEU?

### **Para descobrir:**

1. Abrir DevTools (F12) → Console
2. Criar conta
3. Ver logs
4. Comparar com cenários acima

### **Se vir:**
- `"User data found in register response"` → **Cenário 1** ✅
- `"Token received but no user data"` → **Cenário 2** ⚠️
- `"No token received, attempting auto-login"` → **Cenário 4** 🔴
- `"Register response: { status: 400"` → **Cenário 5 ou 6** ❌
- `"Failed to fetch"` → **Cenário 7** ❌
- `"AbortError"` → **Cenário 8** ❌
- `"status: 500"` → **Cenário 9** ❌

---

## 💡 Recomendações

### **✅ Backend IDEAL:**
Retornar sempre:
```json
{
  "token": "...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "name": "...",
    "email": "...",
    "role": "..."
  }
}
```

### **⚠️ Backend OK:**
Retornar pelo menos:
```json
{
  "token": "..."
}
```
Frontend vai buscar perfil depois.

### **❌ Backend PROBLEMÁTICO:**
Retornar sem token:
```json
{
  "success": true
}
```
Frontend vai tentar login automático (mais lento).

---

## 🚀 Status

O código frontend agora suporta **TODOS** os cenários acima e sempre tenta fazer a melhor coisa possível para não bloquear o utilizador.

**Teste agora e veja qual cenário você tem!** 🧪
