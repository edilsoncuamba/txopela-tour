# 🧪 Guia de Teste do Login - Passo a Passo

## 🎯 Objectivo
Verificar se o login está **realmente** a usar a API e se todas as validações estão a funcionar.

---

## 📋 Pré-requisitos

### 1. **Backend está a funcionar?**
```bash
# Testa se o backend responde
curl http://192.168.88.127:8000/api/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-03T..."
}
```

> ⚠️ Se não responder, verifica o IP no ficheiro `.env` ou arranca o backend.

### 2. **Frontend está a funcionar?**
- Abre: http://localhost:5174/
- Deves ver o ecrã de login com imagens de destinos

---

## 🧪 Testes a Realizar

### ✅ TESTE 1: Validação de Campos Vazios

**Acção:** Clica em "Entrar" sem preencher nada

**Resultado Esperado:**
```
❌ "Por favor, insere o teu email."
```

---

### ✅ TESTE 2: Validação de Senha Vazia

**Acção:**
1. Email: `teste@email.com`
2. Senha: *(vazio)*
3. Clica "Entrar"

**Resultado Esperado:**
```
❌ "Por favor, insere a tua senha."
```

---

### ✅ TESTE 3: Validação de Email Inválido

**Acção:**
1. Email: `emailinvalido`
2. Senha: `123456`
3. Clica "Entrar"

**Resultado Esperado:**
```
❌ "Por favor, insere um email válido."
```

---

### ✅ TESTE 4: Validação de Senha Curta

**Acção:**
1. Email: `teste@email.com`
2. Senha: `123` (menos de 6 caracteres)
3. Clica "Entrar"

**Resultado Esperado:**
```
❌ "A senha deve ter pelo menos 6 caracteres."
```

---

### ✅ TESTE 5: Credenciais Incorrectas

**Acção:**
1. Email: `naoexiste@email.com`
2. Senha: `senhaerrada123`
3. Clica "Entrar"

**Resultado Esperado:**
```
❌ "Email ou senha incorrectos. Verifica as tuas credenciais."
```

**No DevTools (F12) → Network:**
- Verifica **POST /api/auth/login**
- Status: `401 Unauthorized`

---

### ✅ TESTE 6: Login com Turista (Viajante)

**Acção:**
1. Email: `turista@gmail.com`
2. Senha: `T123456`
3. Clica "Entrar"

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Redireciona para a Home
- ✅ Ver botão **"Sugerir Local"** no perfil
- ✅ Mostra nome do utilizador no canto

**No DevTools (F12) → Network:**
```json
POST /api/auth/login → Status: 200 OK

Response:
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Turista",
    "email": "turista@gmail.com",
    "role": "tourist"
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**No DevTools → Application → Local Storage:**
```
access_token: eyJhbGc...
refresh_token: eyJhbGc...
```

---

### ✅ TESTE 7: Login com Guide (Provedor de Serviços)

**Acção:**
1. **Faz logout primeiro** (Settings → Logout)
2. Email: `servico@gmail.com`
3. Senha: `S123456`
4. Clica "Entrar"

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Redireciona para a Home
- ✅ Ver botão **"Sugerir Serviço"** no perfil
- ✅ `role: "guide"` na resposta da API

---

### ✅ TESTE 8: Login com Business (Negociante)

**Acção:**
1. **Faz logout primeiro**
2. Email: `negociantenormal@gmail.com`
3. Senha: `N123456`
4. Clica "Entrar"

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Ver botão **"Sugerir Serviço"** no perfil
- ✅ `role: "business"` na resposta da API

---

### ✅ TESTE 9: Backend Offline (Erro de Rede)

**Acção:**
1. **Para o backend** ou muda o IP no `.env` para um inválido
2. Tenta fazer login

**Resultado Esperado:**
```
❌ "Sem conexão com o servidor. Verifica a tua internet ou o endereço da API no ficheiro .env"
```

> **IMPORTANTE:** Não deve fazer login! Não há modo demo.

---

### ✅ TESTE 10: Timeout (Servidor Lento)

**Acção:**
1. Se o servidor demorar mais de 15 segundos

**Resultado Esperado:**
```
❌ "Tempo de espera esgotado. Verifica a tua conexão."
```

---

## 🔍 Verificação Detalhada no DevTools

### **1. Abre o DevTools (F12)**
- Vai para a aba **Network**
- Faz login com `turista@gmail.com` / `T123456`

### **2. Verifica a Requisição**
Clica em **POST login** na lista:

**Headers:**
```
Request URL: http://192.168.88.127:8000/api/auth/login
Request Method: POST
Status Code: 200 OK
```

**Request Payload:**
```json
{
  "email": "turista@gmail.com",
  "password": "T123456"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "name": "Turista",
    "email": "turista@gmail.com",
    "role": "tourist",
    "avatar": null,
    "emailVerified": true,
    "stats": {
      "postsCount": 0,
      "followersCount": 0,
      "followingCount": 0
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **3. Verifica o Local Storage**
- Aba **Application** → **Local Storage** → `http://localhost:5174`
- Deve ter:
  - `access_token`: JWT token
  - `refresh_token`: Refresh token

---

## ✅ Checklist Final

Marca cada item depois de testar:

- [ ] **Teste 1:** Campos vazios mostram erro
- [ ] **Teste 2:** Senha vazia mostra erro
- [ ] **Teste 3:** Email inválido mostra erro
- [ ] **Teste 4:** Senha curta (<6) mostra erro
- [ ] **Teste 5:** Credenciais erradas mostram erro 401
- [ ] **Teste 6:** Login com turista funciona (role: tourist)
- [ ] **Teste 7:** Login com guide funciona (role: guide)
- [ ] **Teste 8:** Login com business funciona (role: business)
- [ ] **Teste 9:** Backend offline mostra erro (SEM login)
- [ ] **Teste 10:** Tokens são guardados no localStorage
- [ ] **Teste 11:** Role é mapeado correctamente (tourist → traveler)
- [ ] **Teste 12:** Botão "Sugerir Local" aparece para turistas
- [ ] **Teste 13:** Botão "Sugerir Serviço" aparece para guides/business
- [ ] **Teste 14:** Logout limpa os tokens

---

## 🚨 Problemas Comuns

### Problema: "Sem conexão com o servidor"
**Solução:**
1. Verifica se o backend está a funcionar:
   ```bash
   curl http://192.168.88.127:8000/api/health
   ```
2. Confirma o IP no `.env`:
   ```env
   VITE_API_URL=http://192.168.88.127:8000/api
   ```

### Problema: Login aceita qualquer credencial
**Solução:**
- **Isso NÃO deve acontecer!** O modo demo foi removido.
- Verifica se o ficheiro `Login.tsx` foi realmente atualizado
- Reinicia o servidor: `npm run dev`

### Problema: "Invalid credentials" mesmo com conta correcta
**Solução:**
1. Verifica se a conta existe no backend:
   ```bash
   curl -X POST http://192.168.88.127:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"turista@gmail.com","password":"T123456"}'
   ```
2. Se retornar 401, a conta pode não existir no backend

---

## 📞 Próximos Passos

Se **todos os testes passarem**:
1. ✅ Login está funcionando correctamente
2. ✅ Validações estão activas
3. ✅ API está integrada
4. ✅ Roles são mapeados correctamente

Podes avançar para testar:
- **Registo de novos utilizadores**
- **Refresh de tokens**
- **Logout**
- **Edição de perfil**

---

**Data:** 2026-06-03  
**Status:** Pronto para testar ✅
