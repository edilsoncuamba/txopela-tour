# 🧪 Teste da Integração Leaflet + GPS — Txopela Tour

## ✅ Build Confirmado

```bash
✓ Compilação TypeScript: OK
✓ Build Vite: OK (47.59s)
✓ Sem erros de sintaxe
✓ Tamanho do bundle: 1.3 MB (324 KB gzipped)
```

---

## 🎯 Cenários de Teste

### 1️⃣ Teste GPS Automático — Cadastro de Local

**Passos:**
1. Abrir `http://localhost:5173` (ou URL do app)
2. Fazer login com qualquer conta
3. Menu → **"Sugerir local"**
4. Preencher Step 1:
   - Nome: `Praia do Tofo Test`
   - Categoria: `Praias`
   - Tipo: `Praia`
   - Melhor época: `Todo o ano`
   - Destaques: `Vista panorâmica`
   - Descrição: `Teste de integração GPS`
5. Clicar **"Continuar"** → Step 2 (Localização)
6. **O navegador deve pedir permissão de localização** → Clicar "Permitir"
7. ✅ **Aguardar 2-5 segundos:**
   - Botão deve mudar de "📍 A obter localização..." para "✓ Localização atualizada"
   - Mapa deve centralizar na tua posição
   - Marcador verde deve aparecer no mapa
   - Campos devem preencher automaticamente:
     - **Província:** (tua província)
     - **Distrito:** (teu distrito)
     - **Endereço:** (endereço aproximado)
   - Coordenadas devem aparecer embaixo (ex: `-25.96920`, `32.57320`)
   - Badge deve mostrar: **"📍 Localização do dispositivo"**

**Resultado esperado:**  
✅ GPS funciona + mapa centraliza + campos preenchidos automaticamente

---

### 2️⃣ Teste "Atualizar Minha Localização"

**Passos:**
1. Após o GPS ter funcionado no teste anterior
2. Clicar no botão **"📍 Atualizar minha localização"**
3. ✅ **Verificar:**
   - Botão mostra "📍 A obter localização..."
   - Após 2-5s: "✓ Localização atualizada"
   - Mapa re-centraliza (pode não mudar se não te moveste)
   - Coordenadas atualizam
   - Badge continua: "📍 Localização do dispositivo"

**Resultado esperado:**  
✅ GPS obtém nova posição + atualiza tudo

---

### 3️⃣ Teste Seleção Manual no Mapa

**Passos:**
1. No Step 2 (Localização)
2. **Clicar numa posição diferente do mapa** (ex: mais à esquerda)
3. ✅ **Verificar:**
   - Marcador move para a posição clicada
   - Coordenadas atualizam instantaneamente
   - Após ~400ms: campos administrativos atualizam (reverse geocoding)
   - Badge muda para: **"🗺️ Localização selecionada no mapa"**

**Resultado esperado:**  
✅ Clique no mapa define nova posição + geocoding automático

---

### 4️⃣ Teste Arrastar Marcador

**Passos:**
1. No Step 2 (Localização)
2. **Clicar e arrastar o marcador verde** para outra posição
3. ✅ **Verificar:**
   - Marcador move suavemente
   - Ao soltar: coordenadas atualizam
   - Após ~400ms: campos administrativos atualizam
   - Badge: **"🗺️ Localização selecionada no mapa"**

**Resultado esperado:**  
✅ Arrastar marcador ajusta posição + geocoding automático

---

### 5️⃣ Teste Pesquisa de Localização

**Passos:**
1. No Step 2 (Localização)
2. No campo de pesquisa, digitar: **"Tofo"**
3. Clicar no botão **"Pesquisar"**
4. ✅ **Verificar:**
   - Lista de resultados aparece
   - Deve mostrar "Tofo, Inhambane, Mozambique" (ou similar)
5. **Clicar num resultado**
6. ✅ **Verificar:**
   - Mapa voa para a posição do resultado
   - Marcador move para lá
   - Coordenadas atualizam
   - Campos administrativos preenchem:
     - Província: `Inhambane`
     - Distrito: `Inhambane` ou `Jangamo`
   - Badge: **"🔎 Localização encontrada pela pesquisa"**

**Resultado esperado:**  
✅ Pesquisa funciona + seleciona resultado + geocoding automático

---

### 6️⃣ Teste Permissão GPS Negada

**Passos:**
1. No navegador, ir a Settings → Site settings → Location
2. **Bloquear** a localização para `localhost` ou o domínio do app
3. Refresh da página
4. Fazer login → "Sugerir local" → Step 2
5. ✅ **Verificar:**
   - Deve aparecer aviso vermelho/laranja:  
     **"Não foi possível aceder à localização do dispositivo. Seleciona manualmente no mapa ou usa a pesquisa."**
   - Botão "Atualizar minha localização" ainda funciona (mas vai dar erro novamente)
   - **Mapa ainda funciona** — pode clicar, arrastar, pesquisar
   - **Cadastro não é bloqueado** — pode continuar para Step 3

**Resultado esperado:**  
✅ Erro de permissão não bloqueia o formulário

---

### 7️⃣ Teste Baixa Precisão GPS

**Passos:**
1. Usar dispositivo móvel ou simular GPS com baixa precisão
2. No Step 2, aguardar GPS automático
3. ✅ **Verificar:**
   - Se precisão > 200m, deve aparecer aviso amarelo:  
     **"⚠️ A localização do dispositivo pode não ser precisa. Confirma a posição no mapa."**
   - Pode ver precisão abaixo das coordenadas (ex: "Precisão aproximada: 350 metros")
   - Cadastro **não é bloqueado**

**Resultado esperado:**  
✅ Aviso de baixa precisão aparece + cadastro continua

---

### 8️⃣ Teste Cadastro Completo com GPS

**Passos:**
1. Fazer todo o fluxo do teste 1
2. No Step 2, confirmar que:
   - GPS funcionou
   - Coordenadas estão visíveis
   - Província e Distrito preenchidos
3. Clicar **"Continuar"** → Step 3 (Fotos)
4. Adicionar 1 foto
5. Clicar **"Continuar"** → Step 4 (Revisão)
6. ✅ **Verificar secção "Localização":**
   - Província: ✅
   - Cidade: ✅
   - Endereço: ✅
   - **Latitude: ✅ (ex: `-25.96920`)**
   - **Longitude: ✅ (ex: `32.57320`)**
7. Clicar **"Enviar para aprovação"**
8. ✅ **Verificar no console do navegador (F12):**
   - `[AddLocal] Passo 1 — criar com JSON...`
   - Payload deve conter `latitude` e `longitude`
   - `[AddLocal] ✅ Local criado (id: ...)`

**Resultado esperado:**  
✅ Coordenadas enviadas ao backend corretamente

---

### 9️⃣ Teste Mapa Principal com Pins Reais

**Passos:**
1. Login → Menu → **"Mapa"**
2. ✅ **Verificar canto superior esquerdo:**
   - Deve mostrar contador: **"📍 X lugares"** (enquanto carrega: "A carregar...")
3. ✅ **Verificar mapa:**
   - Deve ter **marcadores verdes** espalhados por Moçambique
   - Cada marcador representa um local/serviço com lat/lng da API
4. **Clicar num marcador**
5. ✅ **Verificar:**
   - Abre `DestinationDetail` com dados do local
6. **Clicar "Voltar"** → mapa reaparece
7. **Testar filtros:**
   - Clicar chip "Praias" → só mostra pins de praias
   - Selecionar província "Inhambane" → só mostra pins de Inhambane
8. **Testar botão "Perto de ti":**
   - Pede GPS → centraliza na tua posição

**Resultado esperado:**  
✅ Mapa mostra pins reais da API + filtros funcionam

---

### 🔟 Teste Cadastro de Serviço

**Passos:**
1. Login com conta `type: "business"` ou `type: "guide"`
2. Menu → **"Sugerir serviço"**
3. Step 1: Selecionar tipo "Hospedagem"
4. Step 2: Preencher nome, descrição, horário, contacto
5. Step 3 (Localização): **Igual ao teste 1**
   - GPS automático funciona
   - Pode atualizar, arrastar, pesquisar
6. Step 4: Adicionar foto
7. Step 5: Revisão → verificar **Latitude** e **Longitude**
8. Enviar
9. ✅ **Verificar console:**
   - Payload JSON contém `latitude` e `longitude`
   - PUT multipart (se houver imagens) também contém

**Resultado esperado:**  
✅ Serviço cadastrado com coordenadas GPS

---

## 📊 Checklist de Validação

- [ ] GPS automático funciona ao abrir Step 2/3
- [ ] Botão "Atualizar minha localização" obtém nova posição
- [ ] Clicar no mapa define nova posição
- [ ] Arrastar marcador ajusta posição
- [ ] Pesquisa de localização funciona
- [ ] Reverse geocoding preenche Província/Distrito/Endereço
- [ ] Indicador de origem aparece (GPS/Mapa/Pesquisa)
- [ ] Coordenadas visíveis (lat/lng)
- [ ] Aviso de baixa precisão aparece quando >200m
- [ ] Erro de permissão não bloqueia cadastro
- [ ] Step de revisão mostra coordenadas
- [ ] Dados enviados ao backend com `latitude`/`longitude`
- [ ] Mapa principal carrega pins reais da API
- [ ] Contador de pins funciona
- [ ] Filtros de categoria e província funcionam

---

## 🐛 Problemas Conhecidos e Soluções

### Problema: GPS não funciona em HTTP
**Solução:** Usar `https://` ou `localhost` (permitido pelos navegadores)

### Problema: "Map container is already initialized"
**Solução:** ✅ Já resolvido no código — limpa `_leaflet_id` antes de inicializar

### Problema: Tiles do mapa não carregam
**Solução:** Verificar conexão à internet, firewall ou usar VPN

### Problema: Reverse geocoding retorna endereço errado
**Solução:** Normal — Nominatim usa dados do OpenStreetMap, pode ter imprecisões. O utilizador pode corrigir manualmente.

### Problema: Pesquisa não encontra nada
**Solução:** Nominatim pesquisa em Moçambique (`countrycodes=mz`). Tentar nomes mais completos.

---

## ✅ Conclusão

Se **todos os testes acima passarem**, a integração está **100% funcional** e pronta para produção! 🎉

**A localização GPS facilita o cadastro, economiza tempo do utilizador, e garante coordenadas precisas para o mapa principal.** 🗺️📍
