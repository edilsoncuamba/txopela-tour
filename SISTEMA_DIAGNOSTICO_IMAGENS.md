# 🔍 SISTEMA DE DIAGNÓSTICO DE IMAGENS - ATIVADO

## ✅ O QUE FOI IMPLEMENTADO

### Sistema Ultra-Detalhado de Logs

Foi implementado um sistema completo de diagnóstico no arquivo:
```
app/src/utils/dataValidation.ts
```

### 📊 Logs Agrupados e Estruturados

Cada publicação processada agora mostra:

```javascript
🔍 [VALIDATION DIAGNOSTIC] Item abc-123-def
  📦 OBJETO COMPLETO: { ... JSON completo ... }
  🗝️ CHAVES DISPONÍVEIS: ["id", "name", "images", ...]
  📝 Nome/Título: { name: "...", title: "..." }
  🖼️ CAMPOS DE IMAGEM:
    - images: { existe: true/false, tipo: '...', isArray: true/false, valor: [...] }
    - cover_image: { existe: true/false, tipo: '...', valor: "..." }
    - coverImage: { ... }
    - image: { ... }
    - gallery: { ... }
    - photos: { ... }
    - media: { ... }
    - attachments: { ... }
```

### 🖼️ Diagnóstico de Extração de Imagens

Para cada publicação que tem campos de imagem:

```javascript
🖼️ [extractRealImages] Processando item abc-123
  📸 Campo 'images' encontrado: { tipo: 'array', length: 3, conteudo: [...] }
    Processando images[0]: { tipo: 'string', valor: "http://..." }
    ✅ Imagem ACEITA (images[0]): http://...
  
  📊 RESULTADO FINAL: 3 imagens extraídas
  ✅ URLs válidas: ["http://...", "http://...", "http://..."]
```

### ⚠️ Rejeição Transparente

Quando uma publicação é rejeitada:

```javascript
❌ [VALIDATION] Item abc-123 REJEITADO - Nenhum campo de imagem válido encontrado
```

---

## 🎯 COMO USAR - INSTRUÇÕES PARA O UTILIZADOR

### PASSO 1: Abrir o Console do Navegador ✅

1. Abrir a aplicação Txopela Tour
2. Pressionar `F12` ou `Ctrl+Shift+I` (Windows)
3. Ir para a aba **Console**

### PASSO 2: Recarregar a Página ✅

1. Pressionar `Ctrl+R` ou `F5`
2. Aguardar a página carregar completamente

### PASSO 3: Encontrar os Logs de Diagnóstico ✅

No console, procurar por:
- `🔍 [VALIDATION DIAGNOSTIC]` - logs de validação
- `🖼️ [extractRealImages]` - logs de extração de imagens
- `❌ [VALIDATION]` - publicações rejeitadas

### PASSO 4: Copiar um Log Completo ✅

**IMPORTANTE:** Copiar TODO o conteúdo de **UMA** publicação que foi rejeitada.

Exemplo do que copiar:

```
🔍 [VALIDATION DIAGNOSTIC] Item 2ed75f25-be9d-4332-89e9-443500c5ffff
  📦 OBJETO COMPLETO: { "id": "2ed75f25...", "name": "...", ... }
  🗝️ CHAVES DISPONÍVEIS: [...]
  🖼️ CAMPOS DE IMAGEM:
    ...
  (TODO O CONTEÚDO ATÉ O FINAL)
```

### PASSO 5: Enviar o Log ✅

Colar o log completo numa mensagem e enviar.

---

## 🔬 O QUE ESTAMOS A INVESTIGAR

### Possibilidades:

1. **Campo com nome diferente**
   - Backend pode estar usando `foto`, `picture`, `imagenes`, etc.
   - **Solução:** Adicionar suporte para o campo correto

2. **URLs relativas**
   - Backend retorna `/media/uploads/foto.jpg` (sem domínio)
   - **Solução:** Concatenar com `http://localhost:8000` ou URL da API

3. **Array de objetos**
   - Backend retorna `[{id: 1, url: "..."}]` em vez de `["url1", "url2"]`
   - **Solução:** Já suportado! Extraímos `img.url || img.image || img.src`

4. **Array vazio**
   - Backend retorna `images: []` mas as fotos existem na DB
   - **Solução:** Investigar endpoint da API

5. **Objeto aninhado**
   - Imagens em `data.images` ou `media.files`
   - **Solução:** Adicionar suporte para campos aninhados

---

## ✅ O QUE JÁ ESTÁ A FUNCIONAR

### Suporte para Múltiplos Formatos ✅

A validação já suporta:
- ✅ `images` (array de strings ou objetos)
- ✅ `gallery` (array)
- ✅ `photos` (array)
- ✅ `cover_image` (string)
- ✅ `coverImage` (string)
- ✅ `image` (string)
- ✅ `thumbnail` (string)
- ✅ Objetos com propriedades: `img.url`, `img.image`, `img.src`

### Rejeição Apenas de Placeholders Locais ✅

Rejeita APENAS:
- ❌ `/images/local-*` (placeholder do frontend)
- ❌ `/images/service-*` (placeholder do frontend)
- ❌ `placeholder.com`
- ❌ `via.placeholder`

Aceita TODAS as URLs do backend:
- ✅ `http://localhost:8000/media/...`
- ✅ `https://api-txopela-tour.onrender.com/media/...`
- ✅ URLs externas: `https://...`
- ✅ URLs relativas: `/media/...` (serão ajustadas se necessário)

---

## 📋 FORMATO ESPERADO DA API

Baseado na documentação do backend (`backend-api-documentation.md`):

### Locais:
```json
{
  "id": "abc-123",
  "name": "Nome do Local",
  "images": ["url1", "url2", "url3"],  // Array de strings
  "location": {...},
  "rating": {...},
  ...
}
```

### Serviços:
```json
{
  "id": "xyz-789",
  "title": "Nome do Serviço",
  "images": ["url1", "url2"],  // Array de strings
  "provider": {...},
  ...
}
```

### Posts:
```json
{
  "id": "def-456",
  "title": "Título do Post",
  "images": ["url1", "url2"],  // Array de strings
  "author": {...},
  ...
}
```

---

## 🎯 PRÓXIMA AÇÃO

### SE IMAGENS FOREM URLS RELATIVAS:

Vamos ajustar `extractRealImages()` para concatenar com a URL base:

```typescript
const MEDIA_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const addImage = (url: string, source: string) => {
  // Se URL for relativa, concatena com MEDIA_URL
  const fullUrl = url.startsWith('http') ? url : `${MEDIA_URL}${url}`;
  // ... resto da lógica
};
```

### SE CAMPO TIVER NOME DIFERENTE:

Vamos adicionar suporte em `extractRealImages()`:

```typescript
// Prioridade 6: Campos alternativos
if (item.foto) addImage(item.foto, 'foto');
if (item.picture) addImage(item.picture, 'picture');
// etc.
```

### SE ARRAY ESTIVER VAZIO:

Vamos investigar o endpoint da API para verificar se as imagens estão sendo carregadas corretamente.

---

## 📞 PRECISA DE AJUDA?

Se tiver dúvidas:
1. Tire uma captura de ecrã do console
2. Envie a captura
3. Continuamos o diagnóstico juntos!

---

**Status:** 🟢 Sistema de Diagnóstico ATIVO  
**Data:** 28 de Junho de 2026  
**Próximo Passo:** Aguardando logs do utilizador
