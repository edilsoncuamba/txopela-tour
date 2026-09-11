# ✅ Confirmação: Login e Cadastro Usam API Direta

## 🔍 Verificação Realizada

Confirmo que tanto o **login** quanto o **cadastro** estão fazendo chamadas **HTTP diretas** à API do backend, sem passar por proxy ou camadas intermediárias.

---

## 📊 Evidências

### **1. Arquivo `.env`**

```env
VITE_API_URL=http://192.168.0.124:8000/api
VITE_BACKEND_HOST=192.168.0.124
VITE_BACKEND_PORT=8000
VITE_BACKEND_PROTOCOL=http
```

✅ URL configurada: `http://192.168.0.124:8000`

---

### **2. AuthContext.tsx — Função `getBaseUrl()`**

```typescript
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/api$/, '');
  return backendConfig.getBaseUrl();
};
```

✅ Prioriza `VITE_API_URL` do `.env`  
✅ Remove `/api` do final (se existir)  
✅ Resultado: `http://192.168.0.124:8000`

---

### **3. Login — Chamada Direta**

```typescript
const login = async (email: string, password: string) => {
  const baseUrl = getBaseUrl();
  const loginUrl = `${baseUrl}/api/auth/login`;
  
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  // ...
};
```

✅ Usa `fetch()` nativo do browser  
✅ URL construída: `http://192.168.0.124:8000/api/auth/login`  
✅ **Chamada HTTP direta ao backend Django**  
✅ Sem proxy, sem intermediário

---

### **4. Register — Chamada Direta**

```typescript
const register = async (name: string, email: string, password: string, type: string) => {
  const res = await fetch(`${getBaseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      password,
      role: type,
      termsAccepted: true,
    }),
  });
  // ...
};
```

✅ Usa `fetch()` nativo do browser  
✅ URL construída: `http://192.168.0.124:8000/api/auth/register`  
✅ **Chamada HTTP direta ao backend Django**  
✅ Sem proxy, sem intermediário

---

## 🎯 Fluxo Atual

### **Login**
```
Browser (Frontend)
    ↓
    fetch('http://192.168.0.124:8000/api/auth/login')
    ↓
Django Backend (192.168.0.124:8000)
    ↓
Resposta: { token, user, refreshToken }
    ↓
Frontend: localStorage.setItem('access_token', token)
```

### **Register**
```
Browser (Frontend)
    ↓
    fetch('http://192.168.0.124:8000/api/auth/register')
    ↓
Django Backend (192.168.0.124:8000)
    ↓
Resposta: { token, user, refreshToken }
    ↓
Frontend: localStorage.setItem('access_token', token)
```

---

## 🔧 Características da Implementação

### ✅ **Vantagens**

1. **Direto e Simples**
   - Sem camadas intermediárias
   - Sem proxy reverso no frontend
   - Comunicação direta browser ↔ backend

2. **Transparente**
   - URL visível no DevTools (Network tab)
   - Fácil de debugar
   - Console logs mostram URL exata

3. **Configurável**
   - URL definida no `.env`
   - Fácil mudar para produção
   - Suporta diferentes ambientes

4. **Performance**
   - Zero overhead de proxy
   - Latência mínima
   - Conexão direta

---

## 🧪 Como Verificar Você Mesmo

### **Método 1: Browser DevTools**

1. Abrir aplicação: `http://localhost:5173`
2. Abrir DevTools: `F12`
3. Ir para aba **Network**
4. Limpar (ícone 🚫)
5. Fazer login ou criar conta
6. Ver request na lista
7. Clicar no request
8. Verificar:
   - **Request URL:** `http://192.168.0.124:8000/api/auth/login` ou `/register`
   - **Method:** `POST`
   - **Status:** `200` (se sucesso)

### **Método 2: Console Logs**

Os logs no console mostram a URL exata:

```
[AuthContext] Register attempt: { name: "...", email: "...", role: "tourist" }
[AuthContext] Register response: { status: 200, ok: true, data: {...} }
```

Se houver erro de rede:
```
Sem conexão com o servidor em http://192.168.0.124:8000
```

### **Método 3: Código-fonte**

Verificar `app/src/context/AuthContext.tsx`:
- Linha ~167: `const loginUrl = \`\${baseUrl}/api/auth/login\`;`
- Linha ~245: `await fetch(\`\${getBaseUrl()}/api/auth/register\`, ...)`

Ambos usam `fetch()` nativo.

---

## ⚠️ Nota Importante: CORS

Como é uma chamada direta cross-origin (frontend em `localhost:5173` → backend em `192.168.0.124:8000`), o backend **DEVE** ter CORS configurado:

### **Backend Django (settings.py):**

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.0.124:5173",  # Se frontend rodar no IP da rede
]

# Ou permitir todas (apenas desenvolvimento):
CORS_ALLOW_ALL_ORIGINS = True
```

---

## 🔍 Diferença: API Direta vs Proxy

### **❌ Se fosse proxy (NÃO É O CASO):**

```typescript
// NÃO é assim
const res = await fetch('/api/auth/login');  // URL relativa
```

O Vite proxy redirecionaria:
```javascript
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': 'http://192.168.0.124:8000'
    }
  }
}
```

### **✅ Como realmente é (CHAMADA DIRETA):**

```typescript
// É assim
const res = await fetch('http://192.168.0.124:8000/api/auth/login');  // URL absoluta
```

Sem proxy, direto ao backend.

---

## 📊 Resumo da Confirmação

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| **URL Base** | ✅ Configurada | `http://192.168.0.124:8000` |
| **Login** | ✅ API Direta | `fetch()` para `/api/auth/login` |
| **Register** | ✅ API Direta | `fetch()` para `/api/auth/register` |
| **Proxy** | ❌ Não usa | Chamadas HTTP diretas |
| **CORS** | ⚠️ Necessário | Backend deve permitir origem frontend |
| **Logging** | ✅ Implementado | Console mostra URLs e respostas |

---

## 🎯 Conclusão

**✅ CONFIRMADO:**

1. **Login** faz chamada HTTP direta a `http://192.168.0.124:8000/api/auth/login`
2. **Register** faz chamada HTTP direta a `http://192.168.0.124:8000/api/auth/register`
3. **Não há proxy** ou camada intermediária
4. **Usa `fetch()` nativo** do browser
5. **URL vem do `.env`** (`VITE_API_URL`)

**Se o backend "está tudo bem", então a comunicação é direta e funcional.**

---

## 🧪 Teste Rápido de Conectividade

Para confirmar que o frontend consegue alcançar o backend:

```powershell
# Teste 1: Backend responde?
curl http://192.168.0.124:8000/api/

# Teste 2: Login funciona?
$body = @{email="test@test.com";password="Test1234"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://192.168.0.124:8000/api/auth/login" -Method POST -Body $body -ContentType "application/json"

# Teste 3: Register funciona?
$body = @{name="Test";email="test@test.com";password="Test1234";role="tourist";termsAccepted=$true} | ConvertTo-Json
Invoke-WebRequest -Uri "http://192.168.0.124:8000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

Se estes comandos funcionarem, o frontend também vai funcionar (usa exatamente os mesmos endpoints).

---

**Data:** 06/06/2026  
**Status:** ✅ Confirmado — API Direta  
**Tipo de comunicação:** HTTP direto (sem proxy)  
**URL Backend:** `http://192.168.0.124:8000`
