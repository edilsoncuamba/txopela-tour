# 🧪 GUIA DE TESTES - TODAS AS FUNCIONALIDADES

---

## 1️⃣ TESTE: Fluxo de Registro com Avatar

### Passos:
1. Ir para página de Registro
2. Preencher formulário:
   - Email: `teste@example.com`
   - Password: `123456`
   - Nome: `Utilizador Teste`
3. Selecionar tipo de utilizador: Guia/Negócio/Viajante
4. Clicar em avatar e selecionar imagem
5. Clicar "Criar Conta"

### Verificações:
- ✅ Conta criada no backend (verificar na base de dados)
- ✅ Avatar carregado para `/api/users/upload-avatar`
- ✅ Transição para próximo ecrã ocorre
- ✅ Sem erros na consola (F12)

### Resultado Esperado:
```
✓ Utilizador criado com sucesso
✓ Avatar enviado para servidor
✓ Redirecionamento automático
```

---

## 2️⃣ TESTE: Dados Reais de Serviços

### Passos:
1. Ir para página Home
2. Rolar para secção "Serviços Sugeridos"
3. Observar cada cartão de serviço

### Verificações:
- ✅ Nome do provedor = dados da API (não "Carlos Machava")
- ✅ Tipo de perfil = mapeado corretamente (Guia/Negócio/Viajante)
- ✅ Categoria = vem da API (não hardcoded)
- ✅ Cada serviço mostra provedor diferente

### Resultado Esperado:
```
Serviço: "Tofo Dive Center"
├─ Provedor: "Dive Moz Lda"  ← REAL
├─ Tipo: "Negócio"           ← REAL
└─ Categoria: "Mergulho"     ← DA API
```

---

## 3️⃣ TESTE: Modal de Perfil do Provedor

### Passos:
1. Ir para Home → Serviços
2. Clicar em um cartão de serviço
3. Rolar para secção "Sobre este serviço"
4. Clicar no nome do provedor (botão em cima)

### Verificações:
- ✅ Modal abre com suavidade (animação)
- ✅ Avatar do provedor exibido
- ✅ Nome e tipo de perfil mostrados
- ✅ Estatísticas aparecem (publicações, serviços, etc)
- ✅ Botão "Seguir" funciona
- ✅ Mensagem modal existe

### Resultado Esperado:
```
┌──────────────────────────────┐
│ [X]  Perfil do Provedor      │
├──────────────────────────────┤
│ [Avatar] Nome Provedor       │
│          Tipo: Negócio       │
│          Membro desde 2024   │
│                              │
│ Bio: "Somos especializados..." │
│                              │
│ 12      5       234   12    │
│ Pubs  Servços  Segs  Locais │
│                              │
│ [Seguir] [Mensagem]          │
└──────────────────────────────┘
```

---

## 4️⃣ TESTE: Logo2.png no Painel Aprovador

### Passos:
1. Ir para URL: `/apurador`
2. Observar sidebar no lado esquerdo

### Verificações:
- ✅ Logo2.png exibida (não "TxopelaTour_Sem_Slogan.png")
- ✅ Texto "Aprovador" ao lado do logo
- ✅ Logo não aparece em outras páginas (Home, Profile, etc)
- ✅ Tamanho apropriado (altura: 44px)

### Resultado Esperado:
```
SIDEBAR APURADOR:
┌────────────────────┐
│ [Logo2.png]        │
│ Aprovador          │
│ Moderação...       │
├────────────────────┤
│ Dashboard          │
│ Locais Pendentes   │
│ Serviços Pendentes │
│ ...                │
└────────────────────┘
```

---

## 5️⃣ TESTE: Categoria Vem da API

### Passos:
1. Abrir página "Todos os Serviços" (AllServices)
2. Filtrar por categoria
3. Observar cada serviço

### Verificações:
- ✅ Categorias mostradas = categorias retornadas pela API
- ✅ Sem fallbacks hardcoded
- ✅ Categorias válidas: `transport`, `guide`, `accommodation`, `experience`, `equipment`
- ✅ Badge de categoria visível em cada serviço

### Resultado Esperado:
```
API Response:
{
  "services": [
    { "name": "Tofo Dive", "category": "experience" },
    { "name": "Safari", "category": "adventure" }
  ]
}

Frontend Display:
Tofo Dive [experience]  ← categoria da API
Safari [adventure]      ← categoria da API
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### Frontend:
- [ ] Página Register carrega sem erros
- [ ] Avatar upload funciona
- [ ] Home exibe serviços com dados reais
- [ ] AllServices mostra categorias da API
- [ ] ServiceDetail abre sem erros
- [ ] Modal de perfil abre ao clicar provedor
- [ ] Follow/Unfollow funciona
- [ ] ApuradorDashboard usa Logo2.png
- [ ] Build completa (npm run build)
- [ ] Sem erros na consola (F12)

### Backend (API):
- [ ] `/api/auth/register` retorna token
- [ ] `/api/users/upload-avatar` aceita upload
- [ ] `/api/services` retorna dados com provedor
- [ ] `/api/users/{id}` retorna perfil público
- [ ] `/api/users/{id}/follow` funciona

### Network:
- [ ] Requests HTTP vão diretamente para backend
- [ ] Sem proxy ou interceptação
- [ ] Headers de autenticação presentes
- [ ] CORS configurado corretamente

---

## 🐛 TROUBLESHOOTING

### Problema: Avatar não carrega durante registro
**Solução**: 
- Verificar endpoint: `POST /api/users/upload-avatar`
- Verificar auth headers inclusos
- Verificar tamanho da imagem (<5MB)

### Problema: Provedor aparece como "Carlos Machava"
**Solução**:
- Verificar resposta da API `/api/services`
- Deve incluir campos: `provider`, `owner`, ou `created_by`
- Verificar mapeamento em Home.tsx

### Problema: Modal de perfil não abre
**Solução**:
- Verificar `service.contributor.id` existe
- Verificar `/api/users/{id}` retorna dados
- Abrir DevTools → Network → verificar requests

### Problema: Logo2.png não aparece no aprovador
**Solução**:
- Verificar arquivo existe: `/app/public/images/Logo2.png`
- Verificar caminho em ApuradorDashboard.tsx
- Verificar build concluiu (npm run build)

---

## 📸 SCREENSHOTS ESPERADOS

### Registro com Avatar:
```
[Register Form]
├─ Email: [________]
├─ Password: [________]
├─ Nome: [________]
├─ Tipo: [Guia ▼]
├─ [Avatar] (clique para carregar)
└─ [CRIAR CONTA]
```

### Service Detail:
```
[Hero Image]
│
[Serviço: "Tofo Dive Center"]
┌──────────────────────────────┐
│ Provedor: Dive Moz Lda ◄─── REAL
│ (Negócio)
├──────────────────────────────┤
│ Sobre este serviço
│ Tipo: Mergulho
│ Descrição: ...
└──────────────────────────────┘

[Clique para Perfil do Provedor] ◄─── NOVO
```

---

## ✅ VALIDAÇÃO FINAL

Depois de completar todos os testes:

1. **Registro**: ✓ Avatar carrega, transição funciona
2. **Serviços**: ✓ Dados reais do provedor exibidos
3. **Perfil**: ✓ Modal abre e exibe dados completos
4. **Aprovador**: ✓ Logo2.png exibida
5. **Build**: ✓ npm run build completa sem erros

---

## 🎯 RESUMO

| Funcionalidade | Status | Teste |
|---|---|---|
| Registro com Avatar | ✅ | Executar passo a passo |
| Dados Reais Serviços | ✅ | Verificar provedor |
| Modal Perfil Provedor | ✅ | Clicar nome do provedor |
| Logo2 no Aprovador | ✅ | Abrir /apurador |
| Categorias da API | ✅ | Verificar badge |

---

**Testes devem ser executados em ordem para validação completa.**

Se encontrar algum problema, reporte com:
- Screenshot da tela
- Erro da consola (F12)
- URL da página
- Passos para reproduzir
