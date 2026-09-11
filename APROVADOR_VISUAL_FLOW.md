# 🎨 Visual Flow - Sistema de Aprovação

## Fluxo Visual Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DASHBOARD APROVADOR                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SIDEBAR (Esquerdo)         │    CONTEÚDO PRINCIPAL (Centro)        │
│  ─────────────────────      │    ─────────────────────────────      │
│                             │                                        │
│  📊 Visão Geral             │   📍 LOCAIS PENDENTES (8)             │
│  📍 Locais Pendentes    [8] │                                        │
│  💼 Serviços Pendentes  [5] │   ┌──────────────────────────────┐    │
│  🚩 Reportados          [3] │   │ Item 1: Cascata de...        │    │
│  📋 Histórico               │   │ Usuário: Ana Machava         │    │
│  📈 Qualidade               │   │ Data: há 2h                  │    │
│  🚪 Sair                    │   │ [👁️ Ver] [X]               │    │
│                             │   └──────────────────────────────┘    │
│                             │                                        │
│                             │   ┌──────────────────────────────┐    │
│                             │   │ Item 2: Mercado de...        │    │
│                             │   │ Usuário: Carlos Sitoe        │    │
│                             │   │ Data: há 4h                  │    │
│                             │   │ [👁️ Ver] [X]               │    │
│                             │   └──────────────────────────────┘    │
│                             │                                        │
│  NOTIFICAÇÕES: 🔔           │   [Carregar mais...]                  │
│  5 novos pendentes          │                                        │
│                             │                                        │
└─────────────────────────────────────────────────────────────────────┘
                                          ↓
                                   [CLICA EM VER]
                                          ↓
```

---

## Modal de Detalhes - Layout Completo

```
╔═════════════════════════════════════════════════════════════════════╗
║                         MODAL - VER DETALHES                        ║
╠═════════════════════════════════════════════════════════════════════╣
║                                                              [X]      ║
║   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓           ║
║   ┃                                                       ┃           ║
║   ┃   [←]  GALERIA DE IMAGENS DO LOCAL    [→]  1/2      ┃           ║
║   ┃                                                       ┃           ║
║   ┃   Overlay:                                            ┃           ║
║   ┃   ┌─────────────────────────────────────────┐        ║           ║
║   ┃   │ 📌 Cascata de Chimanimani               │        ║           ║
║   ┃   │ Submetido por Ana Machava · há 2h       │        ║           ║
║   ┃   │                          [Pendente] ← Status      ║           ║
║   ┃   └─────────────────────────────────────────┘        ║           ║
║   ┃                                                       ┃           ║
║   ┃   Thumbnails: [■] [■ ← atual]                        ┃           ║
║   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛           ║
║                                                              ↓↓↓      ║
║   INFORMAÇÕES DO LOCAL (Grid 3 colunas)                              ║
║   ───────────────────────────────────────────────────────────        ║
║   ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐       ║
║   │ 🏷️ Categoria   │  │ 🗺️ Tipo         │  │ 📍 Província │       ║
║   │ Natureza        │  │ Cascata         │  │ Manica       │       ║
║   └─────────────────┘  └─────────────────┘  └──────────────┘       ║
║   ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐       ║
║   │ 🌞 Melhor Época│  │ 📡 GPS          │  │ 📌 Endereço   │       ║
║   │ Out a Mar      │  │ -19.7, 33.0     │  │ Montanhas...  │       ║
║   └─────────────────┘  └─────────────────┘  └──────────────┘       ║
║                                                              ↓↓↓      ║
║   ✨ DESTAQUES                                                       ║
║   ──────────────────────────────────────────────────────────        ║
║   Trilhos de trekking, Piscinas naturais, Vegetação exuberante      ║
║                                                              ↓↓↓      ║
║   📝 DESCRIÇÃO DO LOCAL                                             ║
║   ──────────────────────────────────────────────────────────        ║
║   Cascata deslumbrante nas montanhas de Chimanimani, rodeada        ║
║   de vegetação exuberante e trilhos de trekking. Ideal para         ║
║   trekking, escalada e fotografia. Acesso em qualquer altura...      ║
║                                                              ↓↓↓      ║
║   ✓ LISTA DE VERIFICAÇÃO                                            ║
║   ──────────────────────────────────────────────────────────        ║
║   ┌─────────────────────┐  ┌──────────────────────┐                ║
║   │ ☑️ Nome             │  │ ☐ Descrição          │                ║
║   └─────────────────────┘  └──────────────────────┘                ║
║   ┌─────────────────────┐  ┌──────────────────────┐                ║
║   │ ☑️ Categoria        │  │ ☐ Localização        │                ║
║   └─────────────────────┘  └──────────────────────┘                ║
║   ┌─────────────────────┐  ┌──────────────────────┐                ║
║   │ ☐ Fotos             │  │ ☑️ Qualidade         │                ║
║   └─────────────────────┘  └──────────────────────┘                ║
║                                                              ↓↓↓      ║
║   💬 OBSERVAÇÕES / MOTIVO                                           ║
║   ──────────────────────────────────────────────────────────        ║
║   ┌──────────────────────────────────────────────────────┐          ║
║   │ [Digite aqui observações, motivo ou feedback...]    │          ║
║   │                                                      │          ║
║   │ (Obrigatório apenas para rejeição)                  │          ║
║   └──────────────────────────────────────────────────────┘          ║
║                                                              ↓↓↓      ║
║   AÇÕES (Footer com 4 botões)                                       ║
║   ──────────────────────────────────────────────────────────        ║
║   ┌──────────┐  ┌─────────────────────┐  ┌────────────┐  ┌──────┐ ║
║   │ Cancelar │  │ ⚠️ Solicitar Correção│  │ ❌ Rejeitar│  │ ✅   │ ║
║   │          │  │                     │  │            │  │Aprovar║
║   │ (Branco) │  │ (Laranja)           │  │ (Vermelho) │  │(Verde)│
║   └──────────┘  └─────────────────────┘  └────────────┘  └──────┘ ║
║                                                                      ║
╚═════════════════════════════════════════════════════════════════════╝
```

---

## Estados dos Botões

### Estado Normal
```
┌──────────┐  ┌──────────────────┐  ┌────────┐  ┌──────┐
│ Cancelar │  │ Solicitar Correção│  │Rejeitar│  │Aprovar│
│ Clickável│  │    Clickável      │  │Clickável│ │Click.│
└──────────┘  └──────────────────┘  └────────┘  └──────┘
```

### Estado Loading (Enquanto processa)
```
┌──────────────────────────────────────────────────┐
│ [Loading...⏳] Processando...                    │
│ (Todos os botões ficam desativados)              │
└──────────────────────────────────────────────────┘
```

### Estado Validação (Rejeição sem motivo)
```
┌──────────────────────────────────────────────────┐
│ Rejeitar - DESATIVADO (cinzento/disabled)        │
│ ⚠️ Motivo é obrigatório para rejeição             │
└──────────────────────────────────────────────────┘
```

---

## Decisão Final - Resultado

### ✅ Quando Aprova
```
┌──────────────────────────────────────────┐
│  ✅ Local Aprovado com Sucesso!          │
├──────────────────────────────────────────┤
│  Cascata de Chimanimani                  │
│  Status: Aprovado ✓                      │
│  Aprovado por: admin@txopela.com         │
│  Data: 18/06/2024 15:30                  │
│                                          │
│  O conteúdo está agora visível para      │
│  todos os usuários!                      │
│                                          │
│  Usuário será notificado via email.      │
│                                          │
│  [Modal fecha automaticamente]           │
└──────────────────────────────────────────┘

↓ Item é removido da lista "Pendentes"
↓ Status na tabela muda para "Aprovado" (verde)
```

### ❌ Quando Rejeita
```
┌──────────────────────────────────────────┐
│  ❌ Local Rejeitado                       │
├──────────────────────────────────────────┤
│  Cascata de Chimanimani                  │
│  Status: Rejeitado ✗                     │
│  Rejeitado por: admin@txopela.com        │
│  Data: 18/06/2024 15:32                  │
│                                          │
│  Motivo:                                 │
│  "Fotos de qualidade insuficiente.       │
│   Por favor, envie fotos em HD."         │
│                                          │
│  Usuário será notificado via email       │
│  com o motivo da rejeição.               │
│                                          │
│  [Modal fecha automaticamente]           │
└──────────────────────────────────────────┘

↓ Item é removido da lista "Pendentes"
↓ Status na tabela muda para "Rejeitado" (vermelho)
↓ Volta para status "Não Publicado" no perfil do usuário
```

### ⚠️ Quando Solicita Correção
```
┌──────────────────────────────────────────┐
│  ⚠️ Correção Solicitada                   │
├──────────────────────────────────────────┤
│  Cascata de Chimanimani                  │
│  Status: Correção Solicitada              │
│  Revisado por: admin@txopela.com         │
│  Data: 18/06/2024 15:35                  │
│                                          │
│  Feedback:                               │
│  "Faltam as coordenadas GPS do local.    │
│   Por favor, adicione a localização      │
│   exata."                                │
│                                          │
│  O usuário receberá seu feedback         │
│  e poderá editar o local.                │
│                                          │
│  [Modal fecha automaticamente]           │
└──────────────────────────────────────────┘

↓ Item entra em status "Correção Solicitada"
↓ Usuário pode editar e reenviar
↓ Volta à fila de revisão
```

---

## Notificação para o Usuário

### Email de Aprovação
```
Subject: ✅ Seu Local Foi Aprovado!

Olá Ana Machava,

Parabéns! Seu local "Cascata de Chimanimani" foi aprovado!

🎉 O conteúdo está agora visível para todos os usuários do app.

Você pode visualizá-lo aqui:
https://app.txopela.com/local/1

Obrigado por contribuir com conteúdo de qualidade!

Equipe Txopela Tour
```

### Email de Rejeição
```
Subject: ❌ Seu Local - Revisão Necessária

Olá Ana Machava,

Lamentamos informar que o seu local "Cascata de Chimanimani" 
foi rejeitado.

Motivo:
Fotos de qualidade insuficiente. Por favor, envie fotos em HD.

Você pode tentar novamente com as correções.

Se discordar da decisão, contacte o suporte.

Equipe Txopela Tour
```

### Email de Correção Solicitada
```
Subject: ⚠️ Seu Local - Correções Necessárias

Olá Ana Machava,

Recebemos sua submissão "Cascata de Chimanimani", mas 
precisamos de algumas correções:

Feedback:
Faltam as coordenadas GPS do local. Por favor, adicione 
a localização exata do local usando GPS ou Google Maps.

Por favor, edite seu local e reenvie.

Editar aqui: https://app.txopela.com/edit-local/1

Obrigado!

Equipe Txopela Tour
```

---

## Fluxo de Navegação

```
┌─────────────────────────────────────────────┐
│                                             │
│  1. ENTRAR NO DASHBOARD                    │
│     AprovadorDashboard (page)               │
│     ↓                                       │
│                                             │
│  2. VER LISTA DE PENDENTES                 │
│     - Locais Pendentes (8)                 │
│     - Serviços Pendentes (5)               │
│     - Reportados (3)                       │
│     ↓                                       │
│                                             │
│  3. CLICAR "VER" EM UM ITEM                │
│     onClick → setSelectedLocal(item)        │
│     ↓                                       │
│                                             │
│  4. MODAL ABRE                             │
│     LocalModal component exibido            │
│     ↓                                       │
│                                             │
│  5. REVISAR INFORMAÇÕES                    │
│     - Ver imagens                          │
│     - Ler descrição                        │
│     - Marcar checklist                     │
│     - Escrever observações                 │
│     ↓                                       │
│                                             │
│  6. CLICAR EM UM BOTÃO                     │
│     - Aprovar → status = "Aprovado"        │
│     - Rejeitar → status = "Rejeitado"      │
│     - Correção → status = "Correção..."    │
│     ↓                                       │
│                                             │
│  7. ENVIAR PARA BACKEND                    │
│     adminApi.approveLocal(id, {            │
│       action,                              │
│       reason                               │
│     })                                      │
│     ↓                                       │
│                                             │
│  8. FECHAR MODAL                           │
│     setSelectedLocal(null)                  │
│     ↓                                       │
│                                             │
│  9. ITEM DESAPARECE DA LISTA               │
│     (porque não está mais Pendente)         │
│     ↓                                       │
│                                             │
│  10. NOTIFICAR USUÁRIO                     │
│      Enviar email com decisão               │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Componentes Visuais - Cores & Ícones

### Botões
```
✅ APROVAR
   Cor: Verde (#065F46)
   Texto: Branco
   Ícone: ✓ CheckCircle

❌ REJEITAR
   Cor: Vermelho (#991B1B)
   Texto: Branco
   Ícone: X

⚠️ SOLICITAR CORREÇÃO
   Cor: Laranja (#F59E0B)
   Texto: Branco
   Ícone: AlertCircle

⏸️ CANCELAR
   Cor: Cinzento (border only)
   Texto: Cinzento escuro
   Ícone: Nenhum
```

### Status Badges
```
Pendente (🟡)
   Cor: #FEF3C7 (fundo)
   Texto: #92400E

Aprovado (🟢)
   Cor: #D1FAE5 (fundo)
   Texto: #065F46

Rejeitado (🔴)
   Cor: #FEE2E2 (fundo)
   Texto: #991B1B

Em revisão (🔵)
   Cor: #DBEAFE (fundo)
   Texto: #1E40AF

Correção solicitada (🟠)
   Cor: #FFF7ED (fundo)
   Texto: #92400E
```

---

**Visual completo do sistema de aprovação! 🎨**
