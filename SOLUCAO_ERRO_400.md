# 🔧 Solução Erro 400 - AddLocal

## 🎯 Problema Identificado

O backend retorna erro:
```json
{
  "code": "INVALID_NAME",
  "details": {
    "name": ["Not a valid string."],
    "description": ["Not a valid string."],
    "category": ["\"['attraction']\" não é um escolha válido."]
  }
}
```

**Causa:** Backend está recebendo **arrays em vez de strings** para todos os campos.

## 💡 Comparação: AddPost (Funciona) vs AddLocal (Não Funciona)

### ✅ AddPost (Correto)
```typescript
const fd = new FormData();
fd.append('title', title.trim());        // ✅ String direta
fd.append('content', content.trim());    // ✅ String direta
fd.append('category', category);         // ✅ String direta
fd.append('province', province);         // ✅ String direta

// JSON strings para campos complexos
fd.append('location', JSON.stringify(location));
fd.append('tags', JSON.stringify(tags));

// Ficheiros
imageFiles.forEach(file => {
  fd.append('images', file);
});
```

### ❌ AddLocal (Com Problema)
```typescript
const formData = new FormData();
formData.append('name', name.trim());
formData.append('description', desc.trim());
formData.append('category', backendCategory);

// Condicionais podem causar problemas?
if (tipo) formData.append('subcategory', tipo);
if (epoca) formData.append('best_season', epoca);
```

## 🔍 Possíveis Causas

1. **Browser/Vite transformation** — Algo está convertendo valores em arrays
2. **Content-Type header** — Pode não estar correto para FormData
3. **Backend parser** — Pode estar lendo incorretamente

## ✅ Solução Imediata

### Passo 1: Fazer Login Novamente
O erro 401 indica token expirado:
```javascript
// Console do browser
localStorage.clear();
```
Depois faz login novamente.

### Passo 2: Testar com Código Minimalista

Vamos usar exatamente o mesmo padrão que funciona no AddPost:

```typescript
const fd = new FormData();

// Campos obrigatórios (sem condicionais)
fd.append('name', name.trim());
fd.append('description', desc.trim());
fd.append('category', backendCategory);

// Campos opcionais (sempre adiciona, mesmo que vazio)
fd.append('subcategory', tipo || '');
fd.append('best_season', epoca || '');
fd.append('province', provincia || '');
fd.append('municipality', cidade || '');
fd.append('address', endereco || '');

// highlights como JSON string (array)
if (destaques.length) {
  fd.append('highlights', JSON.stringify(destaques));
}

// Imagens
photoFiles.forEach(file => {
  fd.append('images', file);
});

// ✅ Enviar
const { data, error } = await localsApi.create(fd);
```

### Passo 3: Debug do FormData

Antes de enviar, log completo:
```typescript
console.log('[AddLocal] FormData entries:');
for (const [key, value] of fd.entries()) {
  if (value instanceof File) {
    console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
  } else {
    console.log(`  ${key}: "${value}" (${typeof value})`);
  }
}
```

## 🧪 Teste Alternativo: Usar postsApi

Como teste, podemos temporariamente usar `postsApi.create()` para ver se o problema é no `localsApi`:

```typescript
// TESTE: Usar postsApi para ver se funciona
const testFd = new FormData();
testFd.append('title', name.trim());
testFd.append('content', desc.trim());
testFd.append('category', 'discovery');
testFd.append('province', provincia);

const { data, error } = await postsApi.create(testFd);
console.log('Post test:', { data, error });
```

Se funcionar → problema específico do endpoint `/api/locals/`  
Se não funcionar → problema geral no FormData

## 📊 Checklist

- [ ] Token válido (fazer login novamente)
- [ ] Remover condicionais dos campos opcionais
- [ ] Usar mesmo formato que AddPost
- [ ] Log completo do FormData antes de enviar
- [ ] Testar com postsApi como alternativa
- [ ] Verificar Content-Type no Network tab (deve ser `multipart/form-data; boundary=...`)

## 🎯 Próximo Passo

1. **Limpa localStorage e faz login novamente**
2. **Aplica o código corrigido acima**
3. **Testa criar local**
4. **Envia logs do console**

Com isto vamos identificar exatamente onde está o problema! 🔍
