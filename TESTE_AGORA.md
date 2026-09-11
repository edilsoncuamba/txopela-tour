# 🧪 TESTE RÁPIDO - Sincronização de Locais

## ⚡ Teste em 2 Minutos

### 1. Abre a Aplicação
```
URL: http://localhost:5174/
```

### 2. Faz Login
```
Email: turista@gmail.com
Senha: T123456
```

### 3. Verifica Estado Inicial
- Conta quantos locais aparecem na seção **"Descobertas para ti hoje"**
- Anota o número (ex: 6 locais)

### 4. Cria um Novo Local
1. Clica no botão **"+"** (Sugerir Local)
2. Preenche:
   - **Nome:** "Praia Teste 123"
   - **Categoria:** Praias
   - **Tipo:** Praia
   - **Época:** Todo o ano
   - **Destaques:** Bom para fotos
   - **Descrição:** "Local de teste para verificar sincronização"
3. Clica **"Continuar"**
4. Preenche localização:
   - **Província:** Maputo
   - **Cidade:** KaMpfumo
   - **Endereço:** "Rua Teste"
5. Clica **"Continuar"** (pode pular fotos)
6. Clica **"Continuar"** novamente
7. Revisa e clica **"Enviar sugestão"**

### 5. Resultado Esperado ✅
- ✅ Modal "Sugestão enviada com sucesso!" aparece
- ✅ Clica "Voltar para Home"
- ✅ **Home recarrega** (pode ver loading rápido)
- ✅ **"Praia Teste 123" APARECE** na lista de descobertas
- ✅ Total de locais aumentou em 1

---

## 🔍 Verificação no DevTools

### Abre DevTools (F12) → Network
1. Filtra por **"locals"**
2. Repete os passos 4 e 5 acima
3. Verifica:
   - ✅ **POST** `/api/locals/` → Status **201 Created**
   - ✅ **GET** `/api/locals/` → Status **200 OK** (refetch!)
   - ✅ Response do GET contém "Praia Teste 123"

---

## ✅ Checklist

- [ ] Login funciona
- [ ] Home mostra locais da API
- [ ] Botão "+" abre formulário
- [ ] Formulário pode ser preenchido
- [ ] Envio é bem-sucedido
- [ ] Modal de sucesso aparece
- [ ] **Voltar para Home dispara refetch** 🎯
- [ ] **Novo local APARECE na lista** 🎯

---

## ❌ Se Não Funcionar

### Problema: "Novo local não aparece"

**Verificar:**
1. Backend está rodando?
   ```bash
   curl http://192.168.88.127:8000/api/locals
   ```

2. POST foi bem-sucedido?
   - DevTools → Network → POST locals → Status 201?

3. GET foi disparado após voltar?
   - DevTools → Network → Deve ter 2 requests "locals"
   - Uma POST (criar) e uma GET (refetch)

4. Console tem erros?
   - DevTools → Console → Procurar por erros vermelhos

**Se ainda não funcionar:**
- Copia console log e envia para análise

---

## 🎉 Sucesso!

Se o novo local apareceu imediatamente após criação:

**✅ INTEGRAÇÃO FRONTEND-BACKEND FUNCIONANDO 100%**

- Criar Local → API → Banco de Dados → Feed Atualizado
- Sincronização em tempo real implementada
- Sem necessidade de reload manual

---

**Tempo Estimado:** 2-3 minutos  
**Dificuldade:** Fácil  
**Resultado:** Deve funcionar na primeira tentativa
