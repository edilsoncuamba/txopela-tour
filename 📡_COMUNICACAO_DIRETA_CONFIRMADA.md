# 📡 Comunicação Direta Confirmada — Frontend ↔ Backend

## ✅ Confirmação

**O login e o cadastro estão fazendo chamadas HTTP DIRETAS ao backend Django.**

Não há proxy, camada intermediária ou redirecionamento. É uma comunicação **browser → backend** pura.

---

## 🔍 Como Funciona

### **Fluxo Atual**

```
┌─────────────────────────────────────┐
│  Browser (localhost:5173)           │
│  Frontend React + Vite              │
└──────────────┬──────────────────────┘
               │
               │ HTTP Request (fetch)
               │ POST /api/auth/login
               │ POST /api/auth/register
               ↓
┌─────────────────────────────────────┐
│  Backend Django                     │
│  192.168.0.124:8000                 │
│  API REST                           │
└─────────────────────────────────────┘
```

**Características:**
- ✅ URL absoluta: `http://192.168.0.124:8000/api/auth/...`
- ✅ Método: `fetch()` nativo do browser
- ✅ Headers: `Content-Type: application/json`
- ✅ Body: JSON com credenciais
- ✅ Resposta: JSON com token e user

---

## 📂 Arquivos Envolvidos

### **1. Configuração (.env)**

```env
VITE_API_URL=http://192.168.0.124:8000/api
VITE_BACKEND_HOST=192.168.0.124
VITE_BACKEND_PORT=8000
```

### **2. AuthContext.tsx**

```typescript
// Linha ~6
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/api$/, '');
  return backendConfig.getBaseUrl();
};

// Linha ~167 - LOGIN
const login = async (email: string, password: string) => {
  const loginUrl = `${getBaseUrl()}/api/auth/login`;
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  // ...
};

// Linha ~245 - REGISTER
const register = async (name, email, password, type) => {
  const res = await fetch(`${getBaseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role: type, termsAccepted: true }),
  });
  // ...
};
```

---

## 🧪 Como Verificar

### **Opção 1: Browser DevTools (RECOMENDADO)**

1. Abrir aplicação: `http://localhost:5173`
2. Pressionar `F12` (DevTools)
3. Ir para aba **Network**
4. Limpar lista (ícone 🚫)
5. Fazer login ou criar conta
6. Ver request na lista
7. Clicar no request

**O que verificar:**
- ✅ **Request URL:** `http://192.168.0.124:8000/api/auth/login` ou `/register`
- ✅ **Method:** `POST`
- ✅ **Request Headers:** `Content-Type: application/json`
- ✅ **Request Payload:** `{"email":"...","password":"..."}`
- ✅ **Status:** `200` (se credenciais válidas) ou `400`/`401` (se inválidas)
- ✅ **Response:** JSON com `token`, `user`, etc.

### **Opção 2: Script PowerShell**

```powershell
cd d:\projectos\KUKULADEVZ\txopela-tour-MVP-main\txopela-tour-MVP-main
.\test-backend-connectivity.ps1
```

Este script:
- ✅ Verifica se backend está online
- ✅ Testa endpoint de login
- ✅ Testa endpoint de register
- ✅ Verifica CORS headers
- ✅ Mostra resposta completa do backend

### **Opção 3: Console Browser**

Os logs mostram a URL exata usada:

```javascript
[AuthContext] Register attempt: { name: "...", email: "...", role: "tourist" }
[AuthContext] Register response: { status: 200, ok: true, data: {...} }
```

Se houver erro de rede:
```
Sem conexão com o servidor em http://192.168.0.124:8000
```

---

## 📊 Comparação: Proxy vs Direto

### **❌ Se fosse PROXY (NÃO É O CASO)**

**vite.config.ts:**
```typescript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.0.124:8000',
        changeOrigin: true,
      }
    }
  }
}
```

**Código:**
```typescript
// URL relativa
fetch('/api/auth/login')
```

**Fluxo:**
```
Browser → Vite Dev Server (localhost:5173) → Backend (192.168.0.124:8000)
```

---

### **✅ Como REALMENTE É (DIRETO)**

**Sem vite.config.ts proxy**

**Código:**
```typescript
// URL absoluta
fetch('http://192.168.0.124:8000/api/auth/login')
```

**Fluxo:**
```
Browser → Backend (192.168.0.124:8000)
```

**Mais simples, direto, transparente.**

---

## ⚠️ Implicação: CORS Necessário

Como é cross-origin (frontend em `localhost:5173` → backend em `192.168.0.124:8000`), o backend **DEVE** ter CORS habilitado.

### **Django (settings.py):**

```python
# Instalar: pip install django-cors-headers

INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ← Antes de CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    # ...
]

# Desenvolvimento: permitir todas as origens
CORS_ALLOW_ALL_ORIGINS = True

# Produção: especificar origens permitidas
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.0.124:5173",
    "https://seu-dominio.com",
]

# Permitir credenciais (cookies, headers de auth)
CORS_ALLOW_CREDENTIALS = True
```

**Sem CORS configurado, o browser bloqueia a resposta com erro:**
```
Access to fetch at 'http://192.168.0.124:8000/api/auth/login' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

---

## 🎯 Vantagens da Comunicação Direta

### **✅ Simplicidade**
- Código mais simples
- Menos configuração
- Fácil de entender

### **✅ Transparência**
- URL visível no DevTools
- Fácil de debugar
- Não esconde nada

### **✅ Performance**
- Zero overhead de proxy
- Latência mínima
- Conexão direta

### **✅ Flexibilidade**
- Fácil mudar URL (apenas .env)
- Funciona em qualquer ambiente
- Backend pode estar em qualquer lugar

---

## 🔧 Solução de Problemas

### **Problema 1: "Failed to fetch"**

**Causa:** Backend não está acessível.

**Verificar:**
1. Backend está rodando? `python manage.py runserver 0.0.0.0:8000`
2. Firewall permite conexão?
3. URL no `.env` está correta?

**Teste:**
```powershell
curl http://192.168.0.124:8000/api/
```

---

### **Problema 2: "CORS policy"**

**Causa:** Backend não permite origem do frontend.

**Verificar:**
1. `django-cors-headers` instalado?
2. CORS configurado no `settings.py`?
3. Middleware adicionado?

**Solução:**
```python
# settings.py
CORS_ALLOW_ALL_ORIGINS = True  # Apenas desenvolvimento
```

---

### **Problema 3: "Network Error" / Timeout**

**Causa:** Backend demora muito ou não responde.

**Verificar:**
1. Backend está sobrecarregado?
2. Há algum firewall bloqueando?
3. IP está correto?

**O código tem timeout de 15 segundos:**
```typescript
const timeoutId = setTimeout(() => controller.abort(), 15000);
```

---

### **Problema 4: Status 400 / 401**

**Causa:** Dados inválidos ou credenciais incorretas.

**Verificar:**
1. Email e senha estão corretos?
2. Formato da request está correto?
3. Backend valida todos os campos?

**Ver logs do console:**
```
[AuthContext] Register response: { status: 400, ok: false, data: {...} }
```

---

## 📚 Documentos Relacionados

| Documento | Quando Usar |
|-----------|-------------|
| **✅_CONFIRMACAO_API_DIRETA.md** | Detalhes técnicos da comunicação |
| **test-backend-connectivity.ps1** | Testar conectividade |
| **☑️_CHECKLIST_TESTE.md** | Testar login/register no browser |
| **📊_CENARIOS_REGISTER.md** | Ver cenários possíveis |

---

## 🎯 Conclusão

**✅ CONFIRMADO:**

1. Login usa `fetch('http://192.168.0.124:8000/api/auth/login')`
2. Register usa `fetch('http://192.168.0.124:8000/api/auth/register')`
3. **Comunicação 100% DIRETA** (sem proxy)
4. URL vem do `.env` (`VITE_API_URL`)
5. Backend precisa ter CORS configurado

**Se "lá está tudo bem" no backend, então a comunicação é direta e funcional.**

---

## 🚀 Próximos Passos

### **Para confirmar que está tudo funcionando:**

1. **Executar script de teste:**
   ```powershell
   .\test-backend-connectivity.ps1
   ```

2. **Testar no browser:**
   - F12 → Network
   - Fazer login
   - Ver request direto ao backend

3. **Verificar logs:**
   - Console mostra URL exata
   - Network tab mostra request/response

**Se o script passar e o backend responder 200, está tudo correto!** ✅

---

**Data:** 06/06/2026  
**Status:** ✅ Comunicação direta confirmada  
**URL Backend:** `http://192.168.0.124:8000`  
**Tipo:** HTTP direto (sem proxy)
