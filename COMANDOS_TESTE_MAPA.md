# 🚀 Comandos Rápidos — Testar Integração do Mapa

## 1️⃣ Iniciar o Servidor de Desenvolvimento

```bash
cd d:\projectos\KUKULADEVZ\txopela-tour-MVP-main\txopela-tour-MVP-main\app
npm run dev
```

**Aguardar até ver:**
```
VITE v7.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Abrir:** `http://localhost:5173`

---

## 2️⃣ Build de Produção

```bash
cd d:\projectos\KUKULADEVZ\txopela-tour-MVP-main\txopela-tour-MVP-main\app
npm run build
```

**Resultado esperado:**
```
✓ Compilação TypeScript: OK
✓ Build Vite: OK
✓ dist/index.html criado
✓ dist/assets/index-*.js criado
```

---

## 3️⃣ Verificar Estrutura dos Ficheiros Criados

```bash
# Ver o LocationPicker
cat app/src/components/LocationPicker.tsx | head -50

# Ver imports do AddLocal
cat app/src/pages/AddLocal.tsx | grep -E "import.*Location"

# Ver imports do AddService
cat app/src/pages/AddService.tsx | grep -E "import.*Location"

# Ver imports do Map
cat app/src/pages/Map.tsx | grep -E "import.*(localsApi|servicesApi)"
```

---

## 4️⃣ Testar no Navegador

### A) Cadastro de Local com GPS

1. Abrir `http://localhost:5173`
2. Login (qualquer conta)
3. Menu → "Sugerir local"
4. Preencher Step 1 → Continuar
5. **Step 2 (Localização):**
   - Permitir acesso à localização
   - Aguardar GPS automático (2-5s)
   - Verificar se mapa centraliza + marcador aparece
   - Verificar se Província/Distrito preenchem
   - Clicar "Atualizar minha localização" para testar novamente
   - Arrastar o marcador para testar ajuste manual
   - Pesquisar "Tofo" para testar pesquisa

### B) Ver Mapa com Pins Reais

1. Menu → "Mapa"
2. Verificar contador no canto superior esquerdo: "X lugares"
3. Verificar se há marcadores no mapa
4. Clicar num marcador → deve abrir detalhe
5. Testar filtros de categoria (Praias, Cultura, etc.)
6. Testar botão "Perto de ti" (GPS)

---

## 5️⃣ Verificar Console do Navegador (F12)

### Ao cadastrar local/serviço:

```javascript
// Deve aparecer:
[AddLocal] Passo 1 — criar com JSON...
{latitude: -23.8572, longitude: 35.5467, ...}
[AddLocal] ✅ Local criado (id: 123)
```

### Ao abrir o mapa:

```javascript
// Deve aparecer:
[HOME] Tentativa 1 de carregar descobertas da API...
[HOME] ✅ Locais recebidos da API: X locais
[Map] ✅ Pins carregados: Y pins (X locais + Z serviços)
```

---

## 6️⃣ Verificar Network (F12 → Network)

### Ao obter GPS + Reverse Geocoding:

```
GET https://nominatim.openstreetmap.org/reverse?lat=-23.8572&lon=35.5467&format=json&accept-language=pt
Status: 200 OK
Response: {address: {country: "Moçambique", state: "Inhambane", ...}, ...}
```

### Ao pesquisar localização:

```
GET https://nominatim.openstreetmap.org/search?q=Tofo&format=json&limit=5&accept-language=pt&countrycodes=mz
Status: 200 OK
Response: [{lat: "-23.8572", lon: "35.5467", display_name: "Tofo, Inhambane, ..."}, ...]
```

### Ao carregar pins do mapa:

```
GET http://localhost:8000/api/locals/?page=1&limit=100&sort_by=popular
Status: 200 OK
Response: {locals: [{id: 1, latitude: -23.8, longitude: 35.5, ...}, ...]}

GET http://localhost:8000/api/services/?page=1&limit=100&sort_by=popular
Status: 200 OK
Response: {services: [{id: 1, latitude: -23.8, longitude: 35.5, ...}, ...]}
```

---

## 7️⃣ Testar em Dispositivo Móvel (Android/iOS)

### Opção A: Ngrok (expor localhost)

```bash
# Instalar ngrok (se ainda não tiver)
# https://ngrok.com/download

# Expor porta 5173
ngrok http 5173
```

**Abrir URL no smartphone:**
```
https://xxxx-xx-xx-xx-xx.ngrok-free.app
```

### Opção B: IP local na mesma rede

```bash
# Ver IP da máquina
ipconfig  # Windows
ifconfig  # Linux/Mac

# Exemplo: 192.168.1.100
```

**No smartphone, abrir:**
```
http://192.168.1.100:5173
```

⚠️ **Nota:** GPS só funciona em HTTPS ou localhost. Para testar em IP local, pode não funcionar. Use ngrok (HTTPS) ou teste a seleção manual no mapa.

---

## 8️⃣ Verificar Dados no Backend (Opcional)

```bash
# Ver locais com coordenadas
curl http://localhost:8000/api/locals/ | grep -E "latitude|longitude"

# Ver serviços com coordenadas
curl http://localhost:8000/api/services/ | grep -E "latitude|longitude"
```

---

## 9️⃣ Limpar e Reinstalar (Se Algo Falhar)

```bash
cd d:\projectos\KUKULADEVZ\txopela-tour-MVP-main\txopela-tour-MVP-main\app

# Limpar cache
rm -rf node_modules
rm -rf dist
rm package-lock.json

# Reinstalar
npm install

# Build
npm run build

# Testar
npm run dev
```

---

## 🔟 Troubleshooting Rápido

### Problema: "Map container is already initialized"
```javascript
// Já resolvido no código — verificar se persiste após refresh
// Se persistir, apagar localStorage:
localStorage.clear();
location.reload();
```

### Problema: GPS não funciona
```
✓ Verificar se está em HTTPS ou localhost
✓ Verificar se navegador tem permissão (Settings → Site Settings → Location)
✓ Testar em navegador diferente (Chrome, Firefox)
✓ Usar seleção manual no mapa ou pesquisa
```

### Problema: Tiles do mapa não carregam
```
✓ Verificar conexão à internet
✓ Verificar firewall/antivírus não está bloqueando unpkg.com
✓ Abrir F12 → Network → verificar erros
```

### Problema: Reverse geocoding não funciona
```
✓ Verificar se Nominatim está acessível:
  https://nominatim.openstreetmap.org/reverse?lat=-23.8&lon=35.5&format=json
✓ Verificar rate limit (max 1 req/s)
✓ Aguardar 1-2 segundos e tentar novamente
```

### Problema: Mapa não mostra pins
```
✓ Verificar se backend está rodando (http://localhost:8000)
✓ Verificar se há locais/serviços com latitude/longitude no banco:
  GET /api/locals/ → ver se "latitude" e "longitude" existem
✓ Abrir F12 → Console → ver erros
✓ Verificar contador de pins (se 0, não há dados com coordenadas)
```

---

## ✅ Checklist de Teste Completo

- [ ] `npm run dev` inicia sem erros
- [ ] Página abre em `http://localhost:5173`
- [ ] Login funciona
- [ ] "Sugerir local" → Step 2 solicita GPS
- [ ] GPS funciona (ou mostra erro se negado)
- [ ] Mapa do formulário renderiza corretamente
- [ ] Botão "Atualizar minha localização" funciona
- [ ] Clicar no mapa move o marcador
- [ ] Arrastar marcador funciona
- [ ] Pesquisa de localização funciona
- [ ] Campos Província/Distrito preenchem automaticamente
- [ ] Coordenadas aparecem (lat/lng)
- [ ] Cadastro envia dados ao backend com coordenadas
- [ ] Menu "Mapa" mostra pins reais
- [ ] Contador de pins funciona
- [ ] Clicar num pin abre detalhe
- [ ] Filtros de categoria/província funcionam

---

## 🎉 Pronto!

Se todos os comandos acima funcionarem sem erros, a integração está **100% operacional**! 🗺️📍

**Documentação completa:** Ver `INTEGRACAO_LEAFLET_GPS.md` e `TESTE_LOCALIZACAO.md`
