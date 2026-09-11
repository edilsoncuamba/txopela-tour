# 🐛 Debug de Erros - Txopela Tour

**Data:** 14 de Julho de 2026

---

## ❌ Erro 1: "useAuth must be used within an AuthProvider"

### Sintoma
```
AuthContext.tsx:272 Uncaught Error: useAuth must be used within an AuthProvider
  at useAuth (AuthContext.tsx:272:1)
  at AppContent (App.tsx:83:1)
```

### Causa Provável
Este erro aparece quando:
1. **Hot Module Reload (HMR)** corrompe o estado dos contexts
2. **Cache do browser** contém código antigo
3. **React StrictMode** duplica renders (mas não deve causar este erro)

### Código Confirmado como Correcto ✅
```typescript
// App.tsx
function App() {
  return (
    <AuthProvider>         {/* ✅ AuthProvider envolve AppContent */}
      <AppProvider>
        <FavoritesProvider>
          <TourismProvider>
            <AppContent />   {/* ✅ Pode usar useAuth */}
          </TourismProvider>
        </FavoritesProvider>
      </AppProvider>
    </AuthProvider>
  );
}

// main.tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />              {/* ✅ App correctamente montada */}
    </BrowserRouter>
  </StrictMode>,
)
```

### ✅ Solução

#### 1. Limpar Cache Completo
```bash
# No terminal (dentro de app/)
rm -rf node_modules/.vite
rm -rf dist
```

#### 2. Limpar Cache do Browser
**Chrome/Edge:**
1. Abre DevTools (F12)
2. Clica direito no botão Refresh
3. Seleciona "**Empty Cache and Hard Reload**"

**Firefox:**
1. Abre DevTools (F12)
2. Settings → Network → "Disable HTTP Cache (when toolbox is open)"
3. Refresh (Ctrl+F5)

#### 3. Reiniciar Dev Server
```bash
# Terminal
Ctrl+C  (para o servidor)
npm run dev
```

#### 4. Abrir em Janela Incógnita
- Chrome: `Ctrl+Shift+N`
- Firefox: `Ctrl+Shift+P`
- Edge: `Ctrl+Shift+N`

Isto garante que não há cache ou extensions a interferir.

---

## ❌ Erro 2: 400 Bad Request ao criar local

### Sintoma
```
[AddLocal] Enviando com FormData (tem imagens)
api-txopela-tour-3tdq.onrender.com/api/locals/:1 Failed to load resource: 400 ()
[apiUpload] 400 erro em /api/locals/: Object
[AddLocal] create error: Object
```

### Causa Provável
O backend está a rejeitar o pedido. Possíveis causas:
1. **Campo obrigatório em falta** (name, description, category)
2. **Formato inválido** (imagens muito grandes, tipo errado)
3. **Token JWT inválido ou expirado**
4. **Validation error** nos campos enviados

### 🔍 Como Investigar

#### 1. Ver Erro Detalhado no Console
Com o logging melhorado, o console agora mostra:
```javascript
[AddLocal] Campos: { name, description, category, ... }
[AddLocal] error stringified: { ... detalhes do erro ... }
```

#### 2. Ver Network Tab (DevTools)
1. Abre DevTools (F12)
2. Tab **Network**
3. Filtra por `/api/locals/`
4. Clica no request falhado
5. Tab **Response** → Ver mensagem de erro do backend
6. Tab **Headers** → **Request Payload** → Ver o que foi enviado

#### 3. Ver Payload Enviado
No console do browser:
```javascript
// Ver FormData antes de enviar
for (const [key, value] of formData.entries()) {
  console.log(`${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
}
```

### Possíveis Erros e Soluções

| Erro Backend | Causa | Solução |
|---|---|---|
| `"name is required"` | Campo nome vazio | Validar antes de enviar |
| `"Invalid category"` | Categoria inválida | Verificar mapping para backend |
| `"File too large"` | Imagem > 10MB | Redimensionar ou comprimir |
| `"Invalid file type"` | Ficheiro não é imagem | Validar `accept="image/*"` |
| `"Unauthorized"` | Token expirou | Fazer refresh ou novo login |
| `"best_season: field required"` | Campo obrigatório | Adicionar ao FormData |

### ✅ Checklist de Validação

Antes de enviar, confirmar:
- [x] `name.trim()` não está vazio
- [x] `desc.trim()` não está vazio
- [x] `category` está mapeado correctamente
- [x] `provincia` foi seleccionada
- [ ] Token JWT está válido (não expirou)
- [ ] Imagens são < 10MB cada
- [ ] Imagens são JPG/PNG/WebP

### 🧪 Testar sem Imagens Primeiro
```typescript
// Testar com JSON (sem imagens)
const payload = {
  name: name.trim(),
  description: desc.trim(),
  category: backendCategory,
  province: provincia,
};

const res = await fetch(`${apiBase}/locals/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});
```

Se funcionar → problema está nas imagens  
Se não funcionar → problema está nos campos obrigatórios ou token

---

## ❌ Erro 3: 401 Unauthorized em /api/users/me/

### Sintoma
```
api-txopela-tour-3tdq.onrender.com/api/users/me/:1 Failed to load resource: 400 ()
```

### Causa
Token JWT expirou ou não existe.

### ✅ Solução
```javascript
// No console do browser
localStorage.clear();  // Limpa todos os tokens
```

Depois faz login novamente.

---

## 🔧 Comandos Úteis de Debug

### Ver Tokens no LocalStorage
```javascript
// Console do browser
console.log('Access token:', localStorage.getItem('access_token'));
console.log('Refresh token:', localStorage.getItem('refresh_token'));
```

### Ver Configuração da API
```javascript
// Console do browser
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Backend config:', window.backendConfig);  // se disponível
```

### Forçar Refresh do Token
```javascript
// Console do browser
const refreshToken = localStorage.getItem('refresh_token');
const res = await fetch('https://api-txopela-tour-3tdq.onrender.com/api/auth/refresh/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken }),
});
const data = await res.json();
console.log('Refresh response:', data);
```

### Testar Endpoint Directamente
```javascript
// Console do browser
const token = localStorage.getItem('access_token');
const res = await fetch('https://api-txopela-tour-3tdq.onrender.com/api/users/me/', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  },
});
const data = await res.json();
console.log('User data:', data);
```

---

## 📊 Checklist Completo de Troubleshooting

Quando algo não funciona, seguir esta ordem:

### 1. Browser / Cache
- [ ] Limpar cache do browser (Hard Reload)
- [ ] Testar em janela incógnita
- [ ] Testar em outro browser
- [ ] Desactivar extensions do browser

### 2. Dev Server
- [ ] Reiniciar dev server (`Ctrl+C` → `npm run dev`)
- [ ] Limpar cache do Vite (`rm -rf node_modules/.vite`)
- [ ] Verificar se `.env` está correcto

### 3. Autenticação
- [ ] Token existe no localStorage
- [ ] Token não expirou (< 15 min desde login)
- [ ] Fazer novo login
- [ ] Limpar localStorage (`localStorage.clear()`)

### 4. API
- [ ] Backend está online (visitar URL no browser)
- [ ] Endpoint existe no `openapi-schema.yaml`
- [ ] Campos estão correctos (snake_case vs camelCase)
- [ ] Headers correctos (`Authorization`, `Content-Type`)

### 5. Código
- [ ] Imports correctos
- [ ] Providers na ordem certa
- [ ] useContext dentro de Provider
- [ ] Estados inicializados correctamente

---

## 🚀 Passos para Resolver os Erros Actuais

### Passo 1: Resolver AuthProvider Error
```bash
# 1. Parar o dev server
Ctrl+C

# 2. Limpar cache do Vite
rm -rf node_modules/.vite
rm -rf dist

# 3. Reiniciar
npm run dev
```

Depois no browser:
1. **Hard Reload**: Ctrl+Shift+R ou Empty Cache and Hard Reload
2. Se não resolver, abrir em **Incógnito**

### Passo 2: Testar Login
1. Abrir página de login
2. Criar nova conta ou fazer login
3. Verificar no console se token foi guardado:
   ```javascript
   localStorage.getItem('access_token')
   ```

### Passo 3: Testar Criar Local (sem imagens primeiro)
1. Preencher formulário
2. **NÃO** adicionar imagens
3. Submeter
4. Ver console para erros

### Passo 4: Ver Resposta do Backend
1. DevTools → Network tab
2. Procurar request para `/api/locals/`
3. Ver Response tab
4. Copiar mensagem de erro exacta

---

## 📞 Se Ainda Não Funcionar

Envia-me:
1. **Screenshot do erro** no console
2. **Response do backend** (Network tab → Response)
3. **Request payload** (Network tab → Payload)
4. **Token válido?** (`localStorage.getItem('access_token')`)

Com esta informação consigo identificar o problema exacto! 🔍
