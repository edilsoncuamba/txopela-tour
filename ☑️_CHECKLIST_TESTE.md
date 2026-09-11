# ☑️ Checklist de Teste — Registro

## 🎯 Objetivo
Verificar se a correção do registro está funcionando.

---

## ✅ Preparação (2 min)

- [ ] Backend está rodando em `http://192.168.88.89:8000`
- [ ] Frontend está rodando (`cd app && npm run dev`)
- [ ] Browser aberto em `http://localhost:5173`
- [ ] DevTools aberto (F12) → aba **Console**
- [ ] Console limpo (clicar ícone 🚫)

---

## ✅ Teste Rápido (3 min)

### **1. Criar conta**
- [ ] Preencher formulário:
  - Nome: `Test User`
  - Email: `test-[timestamp]@test.com` ← usar email único!
  - Senha: `Test1234`
  - Confirmar: `Test1234`
- [ ] Clicar "Próximo"
- [ ] Escolher perfil: **Viajante**
- [ ] Aceitar termos ✓
- [ ] Clicar "Próximo"
- [ ] Clicar **"Criar conta"** (pode pular foto)

### **2. Verificar console**
- [ ] Ver logs no console (F12)
- [ ] Copiar texto dos logs
- [ ] Identificar cenário (ver lista abaixo)

### **3. Resultado**
- [ ] A tela transitou? **SIM** ✅ / **NÃO** ❌
- [ ] Qual cenário? (ver abaixo)

---

## 📊 Identificar Cenário

**Procure no console:**

### ✅ **Cenário 1: IDEAL**
```
[AuthContext] User data found in register response
```
→ **Funciona perfeitamente!** ✅

### ⚠️ **Cenário 2: OK**
```
[AuthContext] Token received but no user data, calling refreshUser...
```
→ **Funciona (busca perfil depois)** ✅

### 🔴 **Cenário 3: PROBLEMÁTICO**
```
[AuthContext] No token received, attempting auto-login...
```
→ **Funciona mas backend não envia token** ⚠️  
→ **Ação:** Adicionar token no backend

### ❌ **Cenário 4: ERRO**
```
[AuthContext] Register response: { status: 400, ok: false, ... }
```
→ **Erro de validação** ❌  
→ **Ação:** Ver mensagem de erro específica

### ❌ **Cenário 5: SEM CONEXÃO**
```
Failed to fetch
```
→ **Backend offline ou CORS** ❌  
→ **Ação:** Verificar se backend está rodando

---

## 🔧 Teste Técnico (Opcional)

Se o teste rápido não funcionar, executar:

```powershell
cd d:\projectos\KUKULADEVZ\txopela-tour-MVP-main\txopela-tour-MVP-main
.\test-register-response.ps1
```

**O que verificar:**
- [ ] Script executa sem erro?
- [ ] Status é 200?
- [ ] Tem `token` na resposta?
- [ ] Tem `user.id` na resposta?

---

## 📋 Resultado Final

### ✅ **SE FUNCIONAR:**

**Parabéns!** 🎉

- [x] Problema resolvido
- [ ] Documentar cenário encontrado
- [ ] Continuar desenvolvimento

---

### ⚠️ **SE NÃO FUNCIONAR:**

**Coletar informações:**

1. **Logs do console (F12):**
   ```
   [copiar tudo que começa com [AuthContext] e [Register]]
   ```

2. **Network tab (F12 → Network):**
   - [ ] Filtrar "register"
   - [ ] Clicar no request
   - [ ] Ver **Response** → copiar JSON completo

3. **Script PowerShell:**
   ```powershell
   .\test-register-response.ps1
   ```
   - [ ] Copiar output completo

4. **Backend logs:**
   - [ ] Ver terminal do Django
   - [ ] Copiar erros (se houver)

**Com essas informações, podemos diagnosticar o problema exato.**

---

## 🎯 Cenários Esperados

| O que você vê | O que significa | Ação |
|---------------|-----------------|------|
| ✅ Transita imediatamente | Cenário 1 — Perfeito! | Continuar |
| ✅ Transita após ~1s | Cenário 2 — OK | Opcional: adicionar user na resposta |
| ⚠️ Transita após ~2s | Cenário 3 — Problemático | Adicionar token no backend |
| ❌ Mostra erro "Email já existe" | Email duplicado | Usar email único |
| ❌ Mostra erro "Senha fraca" | Validação backend | Usar senha mais forte |
| ❌ Mostra erro de conexão | Backend offline | Verificar backend |

---

## 📚 Documentos de Apoio

- **🧪_TESTE_REGISTER_AGORA.md** — Guia completo de teste
- **📊_CENARIOS_REGISTER.md** — Todos os cenários detalhados
- **GUIA_DIAGNOSTICO_REGISTER.md** — Diagnóstico aprofundado
- **✅_CORRECAO_REGISTER_COMPLETA.md** — Resumo técnico

---

## 💡 Dicas

1. **Use email único sempre:**
   ```
   test-1717765432@test.com
   test-$(date +%s)@test.com  # Linux/Mac
   test-$([DateTimeOffset]::Now.ToUnixTimeSeconds())@test.com  # Windows
   ```

2. **Limpe console antes de testar:**
   - Facilita ver logs novos
   - Clique no ícone 🚫 no DevTools

3. **Teste em aba anônima:**
   - Evita conflito com sessões anteriores
   - Ctrl+Shift+N (Chrome) ou Ctrl+Shift+P (Firefox)

4. **Se travar no loading:**
   - Verificar se backend respondeu (Network tab)
   - Ver logs do console
   - Pode ser timeout (15s)

---

## ✅ Checklist Final

Antes de reportar problema:

- [ ] Backend está rodando? (`http://192.168.88.89:8000/api/`)
- [ ] Frontend está rodando? (`http://localhost:5173`)
- [ ] Console aberto? (F12)
- [ ] Email é único? (nunca usado antes)
- [ ] Senha tem 8+ caracteres, 1 maiúscula, 1 número?
- [ ] Termos foram aceitos?
- [ ] Copiei logs do console?
- [ ] Executei script PowerShell? (opcional mas recomendado)

---

## 🚀 Status

**✅ CÓDIGO PRONTO**  
**⏳ AGUARDANDO TESTE**

Tempo estimado: **5 minutos** (preparação + teste + análise)

---

**Última atualização:** 06/06/2026  
**Versão:** 1.0  
**Próxima ação:** Seguir checklist acima ☝️
