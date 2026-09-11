# 🧪 Teste de Integração Frontend-Backend

## 📋 Resumo

Este documento descreve como testar a integração entre frontend e backend passo a passo.

## 🚀 Pré-requisitos

- Backend rodando em `http://localhost:8000`
- Frontend rodando em `http://localhost:5173`
- Arquivo `.env` configurado no frontend

## 🧪 Teste 1: Verificar Conexão com API

### Passo 1: Abrir Console do Navegador

1. Abra http://localhost:5173
2. Pressione `F12` para abrir o DevTools
3. Vá para a aba "Console"

### Passo 2: Testar Endpoint Público

Cole no console:

```javascript
fetch('http://localhost:8000/api/locations/')
  .then(r => r.json())
  .then(d => console.log('✅ API conectada!', d))
  .catch(e => console.error('❌ Erro:', e))
```

**Resultado esperado:**
```
✅ API conectada! 
[
  { id: '...', name: 'Praia Bonita', ... },
  ...
]
```

## 🧪 Teste 2: Registrar Novo Usuário

### Passo 1: Ir para Página de Register

1. Clique em "Criar conta"
2. Preencha os dados:
   - Nome: `Test User`
   - Email: `test@example.com`
   - Senha: `TestPass123!`
   - Confirmar Senha: `TestPass123!`
   - Tipo: `Traveler`

### Passo 2: Verificar Resposta

Abra o DevTools → Network → procure por `register/`

**Resposta esperada:**
```json
{
  "id": "uuid-aqui",
  "email": "test@example.com",
  "name": "Test User",
  "type": "traveler"
}
```

**Status esperado:** `201 Created`

### Passo 3: Verificar Tokens

No Console, execute:

```javascript
console.log('Token:', localStorage.getItem('txopela_token'))
console.log('Refresh:', localStorage.getItem('txopela_refresh_token'))
```

**Resultado esperado:**
```
Token: eyJ0eXAiOiJKV1QiLCJhbGc...
Refresh: eyJ0eXAiOiJKV1QiLCJhbGc...
```

## 🧪 Teste 3: Fazer Login

### Passo 1: Ir para Página de Login

1. Clique em "Entrar"
2. Preencha:
   - Email: `test@example.com`
   - Senha: `TestPass123!`
3. Clique em "Entrar"

### Passo 2: Verificar Redirecionamento

Você deve ser redirecionado para a página Home

### Passo 3: Verificar Perfil

No Console:

```javascript
fetch('http://localhost:8000/api/users/me/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('txopela_token')}`
  }
})
  .then(r => r.json())
  .then(d => console.log('✅ Perfil:', d))
  .catch(e => console.error('❌ Erro:', e))
```

**Resultado esperado:**
```json
{
  "id": "uuid-aqui",
  "email": "test@example.com",
  "name": "Test User",
  "type": "traveler"
}
```

## 🧪 Teste 4: Criar Localização

### Passo 1: Ir para "Adicionar Local"

1. Clique no ícone "+" na barra inferior
2. Preencha os dados:
   - Nome: `Praia Bonita`
   - Descrição: `Uma praia linda e tranquila`
   - Categoria: `Praia`
   - Latitude: `-23.5505`
   - Longitude: `-46.6333`

### Passo 2: Verificar Resposta

DevTools → Network → procure por `locations/create/`

**Resposta esperada:**
```json
{
  "id": "uuid-aqui",
  "name": "Praia Bonita",
  "description": "Uma praia linda e tranquila",
  "category": "praia",
  "author": { "id": "...", "name": "Test User" }
}
```

**Status esperado:** `201 Created`

## 🧪 Teste 5: Listar Localizações

### Passo 1: Ir para "Explorar"

1. Clique no ícone de explorar
2. Você deve ver a localização criada

### Passo 2: Verificar Requisição

DevTools → Network → procure por `locations/`

**Resposta esperada:**
```json
[
  {
    "id": "uuid-aqui",
    "name": "Praia Bonita",
    "description": "Uma praia linda e tranquila",
    "category": "praia",
    "rating": 0,
    "reviewsCount": 0
  }
]
```

**Status esperado:** `200 OK`

## 🧪 Teste 6: Curtir Localização

### Passo 1: Abrir Localização

1. Clique em "Praia Bonita"
2. Clique no ícone de coração

### Passo 2: Verificar Resposta

DevTools → Network → procure por `like/`

**Resposta esperada:**
```json
{
  "message": "Location liked.",
  "liked": true
}
```

**Status esperado:** `200 OK`

## 🧪 Teste 7: Criar Post

### Passo 1: Ir para Home

1. Clique no ícone de home
2. Procure por um campo para criar post

### Passo 2: Criar Post

1. Clique em "Criar Post"
2. Preencha:
   - Conteúdo: `Que lugar incrível! 🌊`
   - Localização: `Praia Bonita`
3. Clique em "Postar"

### Passo 3: Verificar Resposta

DevTools → Network → procure por `posts/create/`

**Resposta esperada:**
```json
{
  "id": "uuid-aqui",
  "content": "Que lugar incrível! 🌊",
  "author": { "id": "...", "name": "Test User" },
  "location": { "id": "...", "name": "Praia Bonita" }
}
```

**Status esperado:** `201 Created`

## 🧪 Teste 8: Criar Review

### Passo 1: Abrir Localização

1. Clique em "Explorar"
2. Clique em "Praia Bonita"

### Passo 2: Criar Review

1. Clique em "Adicionar Avaliação"
2. Preencha:
   - Rating: 5 estrelas
   - Comentário: `Lugar maravilhoso!`
3. Clique em "Enviar"

### Passo 3: Verificar Resposta

DevTools → Network → procure por `reviews/create/`

**Resposta esperada:**
```json
{
  "id": "uuid-aqui",
  "rating": 5,
  "comment": "Lugar maravilhoso!",
  "user": { "id": "...", "name": "Test User" }
}
```

**Status esperado:** `201 Created`

## 🧪 Teste 9: Atualizar Perfil

### Passo 1: Ir para Perfil

1. Clique no ícone de perfil
2. Clique em "Editar Perfil"

### Passo 2: Atualizar Dados

1. Mude a bio para: `Viajante apaixonado por praias! 🌊`
2. Clique em "Salvar"

### Passo 3: Verificar Resposta

DevTools → Network → procure por `me/update/`

**Resposta esperada:**
```json
{
  "id": "uuid-aqui",
  "name": "Test User",
  "bio": "Viajante apaixonado por praias! 🌊"
}
```

**Status esperado:** `200 OK`

## 🧪 Teste 10: Fazer Logout

### Passo 1: Ir para Settings

1. Clique no ícone de perfil
2. Clique em "Configurações"

### Passo 2: Fazer Logout

1. Clique em "Sair"
2. Você deve ser redirecionado para Login

### Passo 3: Verificar Tokens

No Console:

```javascript
console.log('Token:', localStorage.getItem('txopela_token'))
console.log('Refresh:', localStorage.getItem('txopela_refresh_token'))
```

**Resultado esperado:**
```
Token: null
Refresh: null
```

## 📊 Checklist de Testes

- [ ] Teste 1: Conexão com API ✅
- [ ] Teste 2: Registrar usuário ✅
- [ ] Teste 3: Fazer login ✅
- [ ] Teste 4: Criar localização ✅
- [ ] Teste 5: Listar localizações ✅
- [ ] Teste 6: Curtir localização ✅
- [ ] Teste 7: Criar post ✅
- [ ] Teste 8: Criar review ✅
- [ ] Teste 9: Atualizar perfil ✅
- [ ] Teste 10: Fazer logout ✅

## ⚠️ Troubleshooting

### Erro: "CORS error"

**Solução**: Verifique se o backend tem CORS habilitado:

```python
# backend/txopela_api/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
```

### Erro: "401 Unauthorized"

**Solução**: Verifique se o token está sendo enviado corretamente:

```javascript
// No Console
console.log(localStorage.getItem('txopela_token'))
```

### Erro: "404 Not Found"

**Solução**: Verifique se o endpoint existe:

```bash
# No backend
python test_endpoints.py
```

### Erro: "Network error"

**Solução**: Verifique se o backend está rodando:

```bash
# Terminal
cd backend
python manage.py runserver
```

## 🎉 Conclusão

Se todos os testes passarem, a integração frontend-backend está funcionando corretamente!

Próximos passos:
1. Implementar OAuth Google
2. Implementar OAuth GitHub
3. Testes E2E
4. Deploy

