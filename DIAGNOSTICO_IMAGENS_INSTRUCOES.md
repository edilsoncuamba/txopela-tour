# 🔍 DIAGNÓSTICO: Imagens Não Aparecem nas Publicações

## 🚨 PROBLEMA IDENTIFICADO

10+ publicações estão sendo rejeitadas com a mensagem "não possui imagens", mesmo que as imagens tenham sido carregadas pelo utilizador.

## 📋 PRÓXIMOS PASSOS - AÇÃO IMEDIATA NECESSÁRIA

### PASSO 1: Recarregar a Aplicação ✅

1. **Abrir a aplicação no navegador**
2. **Abrir DevTools Console** (F12 → Console)
3. **Recarregar a página** (Ctrl+R ou F5)

### PASSO 2: Copiar os Logs de Diagnóstico 📋

Após recarregar, o console mostrará logs ULTRA-DETALHADOS assim:

```
🔍 [VALIDATION DIAGNOSTIC] Item 2ed75f25-be9d-4332-89e9-443500c5ffff
  📦 OBJETO COMPLETO: { ... ESTRUTURA COMPLETA ... }
  🗝️ CHAVES DISPONÍVEIS: [...]
  🖼️ CAMPOS DE IMAGEM:
    - images: { existe: true, tipo: '...', isArray: ..., valor: ... }
    - cover_image: { ... }
    ...
```

**IMPORTANTE:** Copie TODO o log de **UMA** publicação que está sendo rejeitada, incluindo:
- O `📦 OBJETO COMPLETO`
- Os `🖼️ CAMPOS DE IMAGEM`
- Os logs do `extractRealImages`

### PASSO 3: Enviar o Log Completo 📤

Cole o log completo aqui ou envie para análise.

---

## 🔬 O QUE ESTAMOS INVESTIGANDO

### Hipóteses possíveis:

1. **Campo com nome diferente**
   - API pode estar usando `picture`, `foto`, `imagenes`, etc.

2. **URLs relativas**
   - API pode estar retornando `/media/uploads/foto.jpg` (sem domínio)
   - Precisamos concatenar com `https://api-txopela-tour-3tdq.onrender.com`

3. **Objeto aninhado**
   - Imagens podem estar em `data.images` ou `media.urls`

4. **Array vazio sendo enviado**
   - API retorna `images: []` mas as fotos existem no banco de dados

5. **Formato de objeto**
   - API retorna `images: [{ id: 1, url: '...' }]` em vez de `images: ['url1', 'url2']`

---

## ✅ O QUE JÁ IMPLEMENTAMOS

### Sistema de Diagnóstico Ultra-Detalhado

O arquivo `dataValidation.ts` agora mostra:

✅ Estrutura JSON completa de cada publicação  
✅ Todas as chaves disponíveis no objeto  
✅ Verificação de 8+ campos possíveis de imagem  
✅ Tipo de cada campo (string, array, object)  
✅ Conteúdo exato de cada campo  
✅ Logs passo-a-passo da extração de imagens  

### Validação Flexível

A validação atual aceita imagens em:
- `images` (array)
- `gallery` (array)
- `photos` (array)
- `cover_image` (string)
- `coverImage` (string)
- `image` (string)
- `thumbnail` (string)
- `media` (qualquer formato)
- `attachments` (qualquer formato)

### Rejeição Apenas de Placeholders Locais

A validação rejeita APENAS:
- `/images/local-*` (placeholder do frontend)
- `/images/service-*` (placeholder do frontend)
- `placeholder.com`
- `via.placeholder`

Todas as URLs do backend (http/https) são ACEITAS.

---

## 🎯 PRÓXIMA AÇÃO APÓS RECEBER O LOG

Com o log completo, iremos:

1. ✅ Identificar o campo exato que a API usa
2. ✅ Verificar se URLs são absolutas ou relativas
3. ✅ Ajustar `extractRealImages()` para o formato correto
4. ✅ Adicionar concatenação de MEDIA_URL se necessário
5. ✅ Testar e confirmar que as imagens aparecem

---

## 📞 PRECISA DE AJUDA?

Se tiver dúvidas sobre como copiar os logs, envie uma captura de ecrã do console que ajudamos!

**Data:** 28 de Junho de 2026  
**Status:** 🔴 Aguardando logs de diagnóstico do utilizador
