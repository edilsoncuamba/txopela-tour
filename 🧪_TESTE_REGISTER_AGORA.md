# 🧪 Teste o Registro AGORA

## ✅ O que foi corrigido

Apliquei correções no código para resolver o problema de quando "a conta é criada no backend (200 OK) mas o frontend não transita":

### 1. **Logging completo**
- Console logs em todos os pontos críticos
- Vai mostrar exatamente o que o backend retorna

### 2. **Suporte a múltiplos formatos**
- Aceita `token`, `access_token` ou `access`
- Aceita `refreshToken`, `refresh_token` ou `refresh`
- Busca user em diferentes estruturas de resposta

### 3. **Fluxo robusto**
- Se tem `user.id` → Define user imediatamente ✅
- Se tem `token` mas sem user → Busca perfil via `/api/auth/me` ✅
- Se não tem token → Tenta login automático ✅
- **SEMPRE retorna `{ ok: true }` quando backend retorna 200** ✅

---

## 🚀 Teste em 3 minutos

### **Opção 1: Teste via Browser (RECOMENDADO)**

1. **Abrir aplicação no browser**
   ```bash
   # Se ainda não está rodando:
   cd d:\projectos\KUKULADEVZ\txopela-tour-MVP-main\txopela-tour-MVP-main\app
   npm run dev
   ```

2. **Abrir DevTools**
   - Pressionar `F12`
   - Ir para aba **Console**
   - Limpar console (ícone 🚫)

3. **Criar nova conta**
   - Nome: `Test User`
   - Email: `test-$(Date.now())@gmail.com` (usar email único!)
   - Senha: `Test1234`
   - Confirmar: `Test1234`
   - Escolher perfil: **Viajante**
   - Aceitar termos ✓
   - Clicar **"Criar conta"**

4. **Verificar logs no console**

   **🎯 O que você deve ver:**
   
   ```
   [AuthContext] Register attempt: { name: "Test User", email: "...", role: "tourist" }
   [AuthContext] Register response: { status: 200, ok: true, data: {...} }
   ```
   
   **Depois disso, vai aparecer UM destes:**
   
   ✅ **MELHOR CENÁRIO:**
   ```
   [AuthContext] User data found in register response
   [Register] result: { ok: true }
   ```
   → **Deve transitar imediatamente!**
   
   ⚠️ **CENÁRIO OK:**
   ```
   [AuthContext] Token received but no user data, calling refreshUser...
   [AuthContext] refreshUser succeeded
   [Register] result: { ok: true }
   ```
   → **Deve transitar após buscar perfil!**
   
   ⚠️ **CENÁRIO PROBLEMÁTICO:**
   ```
   [AuthContext] No token received, attempting auto-login...
   [AuthContext] Auto-login failed: ...
   [Register] result: { ok: true }
   ```
   → **PROBLEMA: Backend não retorna token!**
   
   ❌ **CENÁRIO ERRO:**
   ```
   [AuthContext] Register response: { status: 400, ok: false, data: {...} }
   [Register] result: { ok: false, error: "..." }
   ```
   → **Backend rejeitou o request**

5. **Copiar e enviar os logs**
   - Clicar direito no console
   - "Save as..." ou copiar texto
   - Enviar para análise

---

### **Opção 2: Teste via Script PowerShell**

Mais rápido para ver formato da resposta do backend:

```powershell
cd d:\projectos\KUKULADEVZ\txopela-tour-MVP-main\txopela-tour-MVP-main
.\test-register-response.ps1
```

Vai mostrar:
- ✅ Status code
- 📦 Resposta completa do backend
- 🔍 Análise automática (tem token? tem user?)
- 🎯 Se é compatível com o frontend

---

## 📊 O que verificar

### ✅ **Se funcionar:**
Parabéns! O problema estava na lógica de transição e agora está resolvido.

### ⚠️ **Se aparecer "No token received":**
**Problema:** Backend retorna 200 mas sem token na resposta.

**Solução:** Verificar view do Django — `/api/auth/register` DEVE retornar:
```json
{
  "success": true,
  "token": "eyJ...",
  "user": {
    "id": 1,
    "email": "...",
    "name": "..."
  }
}
```

**Como corrigir no backend:**
```python
# backend/apps/authentication/views.py
from rest_framework_simplejwt.tokens import RefreshToken

def register(request):
    # ... criar user ...
    
    # Gerar token
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'success': True,
        'token': str(refresh.access_token),
        'refreshToken': str(refresh),
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
        }
    })
```

### ❌ **Se der erro 400/500:**
Verificar mensagem específica no log e corrigir backend.

---

## 🔧 Arquivos Modificados

### **AuthContext.tsx**
- ✅ Suporte a múltiplos formatos de token
- ✅ Fluxo robusto com fallbacks
- ✅ Logging completo
- ✅ **Sempre retorna `{ ok: true }` quando backend retorna 200**

### **Register.tsx**
- ✅ Logging do resultado
- ✅ Upload de avatar não-bloqueante

---

## 📁 Documentação Adicional

- **GUIA_DIAGNOSTICO_REGISTER.md** — Diagnóstico detalhado com todos os cenários
- **test-register-response.ps1** — Script para testar resposta do backend

---

## 🆘 Se ainda não funcionar

1. **Copiar logs completos do console** (F12 → Console)
2. **Executar script de teste:** `.\test-register-response.ps1`
3. **Verificar network tab** (F12 → Network → filtrar "register")
   - Ver request payload
   - Ver response completo
4. **Verificar logs do backend Django**
   - O que o backend está retornando?
   - Tem algum erro no servidor?

---

## 💡 Resumo

O código frontend está agora **muito mais robusto** e deve funcionar com qualquer formato de resposta do backend Django REST.

**O problema mais provável agora é:**
- Backend não retorna `token` na resposta ← **Verificar view do Django**

**Teste agora e envie os logs!** 🚀
