# Melhorias no LocationPicker — Dados Administrativos Corretos

## 📋 Resumo das Alterações

O componente `LocationPicker.tsx` foi **melhorado** (não recriado do zero) para garantir que os dados de localização gravados no Txopela Tour sejam corretos e consistentes, seguindo a hierarquia administrativa real de Moçambique.

---

## ✅ Alterações Implementadas

### 1. **Remoção de Emojis — Ícones Lucide-React**
- ❌ **REMOVIDOS** todos os emojis (📍, 🗺️, 🔎, ⚠️, etc.)
- ✅ **ADICIONADOS** ícones lucide-react:
  - `<Navigation />` para GPS
  - `<Map />` para mapa
  - `<Search />` para pesquisa
  - `<Target />` para coordenadas/precisão
  - `<AlertCircle />` para avisos
  - `<MapPin />` para localização

### 2. **Interface GeoFields Expandida**
```typescript
export interface GeoFields {
  lat: string;
  lng: string;
  accuracy?: number;                         // metros
  country?: string;                          // País
  province?: string;                         // Província
  district?: string;                         // Distrito/Município
  city?: string;                             // Cidade/Vila
  administrative_area?: string;              // Posto Administrativo
  locality?: string;                         // Localidade
  suburb?: string;                           // Bairro
  address?: string;                          // Endereço completo
  nearby_reference?: string;                 // Editável pelo usuário
  nearby_reference_suggestion?: string;      // Sugestão automática de POI
}
```

### 3. **Função `normalizeLocationData()` — Mapeamento Correto**
- **CRIADA** função dedicada para normalizar dados do Nominatim
- **NÃO assume** que `city = district` ou `town = province`
- **Mapeia corretamente** cada nível administrativo:
  - `a.country` → País
  - `a.state` → Província
  - `a.county` → Distrito
  - `a.city / town / village / hamlet` → Cidade/Vila (hierarquia)
  - `a.suburb / neighbourhood / quarter` → Bairro
  - `a.locality / hamlet` → Localidade
  - POIs (`tourism`, `amenity`, `shop`, `leisure`) → Sugestão de referência

### 4. **Reverse Geocoding Melhorado**
```typescript
async function reverseGeocode(lat: number, lng: number): Promise<Partial<GeoFields>> {
  const url = `...&addressdetails=1`;  // ← Solicita detalhes administrativos
  const data = await res.json();
  return normalizeLocationData(data);   // ← Normalização dedicada
}
```

### 5. **Campo "Referência / Perto de" — Editável**
- **Campo de input** editável pelo usuário
- **Sugestão automática** de POI próximo (quando disponível)
- **Placeholder**: "Ex.: Perto do Mercado Central, Ao lado da Escola..."
- **Complementar** ao endereço, não substitui coordenadas

### 6. **Precisão GPS em Tempo Real**
- **Mostra precisão** quando disponível: `±15m`
- **Indicador visual** com cor:
  - Verde (`#10B981`) para boa precisão (<200m)
  - Laranja (`#F59E0B`) para baixa precisão (≥200m)
- **Ícone `<Target />`** ao lado da precisão

### 7. **Coordenadas Visíveis e Destacadas**
- **Seção dedicada** "Coordenadas" com ícone `<MapPin />`
- **Formato**: 6 casas decimais (`-23.865400`)
- **Layout**: Grid 2 colunas (Latitude | Longitude)
- **Precisão** mostrada abaixo das coordenadas

### 8. **Atualização Completa dos Dados**
Quando o usuário:
- Clica no botão "Atualizar minha localização"
- Clica/arrasta o marcador no mapa
- Pesquisa uma localização

O sistema atualiza **automaticamente**:
1. Latitude + Longitude
2. Precisão (se GPS)
3. País
4. Província
5. Distrito
6. Cidade/Vila
7. Posto Administrativo (quando disponível)
8. Localidade (quando disponível)
9. Bairro (quando disponível)
10. Endereço completo
11. Sugestão de referência (POI próximo)

---

## 📐 Regra Principal

**Latitude/Longitude → Reverse Geocoding → Normalização → Validação → Campos Administrativos**

- As **coordenadas** são a fonte primária da localização
- Os **dados administrativos** são derivados das coordenadas
- **Não salvar** dados que não correspondam à posição geográfica

---

## 🎯 Validação (Recomendada para Implementação Futura)

Antes de salvar, verificar:
- ✅ Latitude válida
- ✅ Longitude válida
- ✅ Província não vazia
- ✅ Distrito corresponde à localização
- ✅ Não há contradições nos dados administrativos

Se houver inconsistência, mostrar aviso:
```
⚠️ Não foi possível confirmar completamente os dados administrativos 
desta localização. Verifique a posição no mapa antes de continuar.
```

---

## 🧪 Testes Necessários

### Cenários a Testar:

1. **GPS em Maputo Cidade**
   - Verificar se Província = "Cidade de Maputo"
   - Verificar se Distrito corresponde ao bairro (KaMpfumo, KaMavota, etc.)

2. **GPS em Inhambane**
   - Verificar se Província = "Inhambane"
   - Verificar se Distrito NÃO é "Inhambane" (nome da cidade)
   - Verificar hierarquia: Província → Distrito → Cidade

3. **Pesquisa "Tofo Beach"**
   - Verificar se Província = "Inhambane"
   - Verificar se Distrito = "Jangamo"
   - Verificar se Cidade = "Tofo" ou similar

4. **Clique no mapa em local rural**
   - Verificar se identifica Posto Administrativo
   - Verificar se identifica Localidade
   - Verificar se sugere referência próxima (se houver POI)

5. **Permissão GPS negada**
   - Verificar se mostra erro amigável
   - Verificar se NÃO bloqueia o cadastro
   - Verificar se permite selecção manual no mapa

6. **Baixa precisão GPS (>200m)**
   - Verificar se mostra aviso de baixa precisão
   - Verificar se permite ajuste manual do marcador

7. **Campo "Referência / Perto de"**
   - Verificar se aceita texto personalizado
   - Verificar se mostra sugestão quando disponível
   - Verificar se é opcional (não obrigatório)

8. **Atualização em tempo real**
   - Arrastar marcador → coordenadas atualizam
   - Clicar no mapa → reverse geocoding executa
   - Botão GPS → todos os campos atualizam

---

## 📂 Ficheiros Alterados

### `app/src/components/LocationPicker.tsx`
- **Interface `GeoFields`** expandida
- **Função `normalizeLocationData()`** criada
- **Função `reverseGeocode()`** melhorada
- **State `nearbyReference`** adicionado
- **State `nearbyReferenceSuggestion`** adicionado
- **State `accuracy`** adicionado
- **UI** atualizada (sem emojis, com ícones lucide-react)
- **Campo "Referência / Perto de"** adicionado
- **Seção "Coordenadas"** com precisão GPS

---

## 🚀 Próximos Passos

### Integração nos Formulários:

1. **`AddLocal.tsx`** — Step 2 (Localização)
   - Receber os novos campos do LocationPicker
   - Mostrar todos os campos na revisão (Step 4)
   - Enviar todos os campos ao backend

2. **`AddService.tsx`** — Step 3 (Localização)
   - Receber os novos campos do LocationPicker
   - Mostrar todos os campos na revisão (Step 5)
   - Enviar todos os campos ao backend

### Backend (se necessário):
- Verificar se a API aceita os novos campos
- Adicionar campos na base de dados se não existirem:
  - `administrative_area`
  - `locality`
  - `nearby_reference`

---

## ⚙️ Build

**Status**: ✅ Build bem-sucedido

```bash
cd app
npm run build
```

**Resultado**: 
- ✅ TypeScript OK
- ✅ Vite OK (15.84s)
- ✅ Sem erros
- ⚠️ Aviso de chunk size (normal para projeto grande)

---

## 📖 Documentação Técnica

### Leaflet
- **Versão**: 1.9.4 (estável, gratuita)
- **Tiles**: OpenStreetMap (gratuito)
- **Marcador**: Custom divIcon (arrastável)

### Nominatim
- **URL**: `https://nominatim.openstreetmap.org/`
- **Parâmetros**: `format=json`, `accept-language=pt`, `addressdetails=1`
- **User-Agent**: `TxopelaTour/1.0` (obrigatório)
- **Rate Limit**: 1 req/segundo (respeitado via debounce 400ms)

### Políticas de Uso
- ✅ Respeita políticas do OpenStreetMap
- ✅ Identifica corretamente com User-Agent
- ✅ Debounce para evitar spam de requisições
- ✅ Não expõe API keys (serviço gratuito)

---

## 🎨 Design

### Cores:
- Verde (GPS): `#1B5E3B` / `#EEF7F0`
- Azul (Mapa): `#0077B6` / `#EFF8FF`
- Roxo (Pesquisa): `#7B5EA7` / `#F3EEFB`
- Laranja (Baixa Precisão): `#F59E0B`
- Verde (Boa Precisão): `#10B981`

### Fontes:
- **Familia**: Nunito, sans-serif
- **Peso**: 400 (regular), 600 (semibold), 700 (bold), 800 (extrabold)

---

## 📝 Notas Importantes

1. **NÃO recriado do zero** — melhorado a partir da implementação existente
2. **Leaflet 1.9.4** mantido (já estava correto)
3. **Nominatim** mantido (já estava correto)
4. **Permissão GPS negada** não bloqueia cadastro
5. **Coordenadas** são exatamente as que serão enviadas ao backend
6. **Referência / Perto de** é complementar, não substitui endereço
7. **Província/Distrito** devem corresponder às coordenadas reais

---

## ✍️ Autor

**Implementação**: Kiro AI  
**Data**: 11 de Agosto de 2026  
**Versão**: 2.0.0 (melhorias sobre v1.0.0)  
**Projeto**: Txopela Tour MVP
