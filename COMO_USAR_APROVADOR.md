# 🔍 Como Usar o Dashboard de Aprovação

## 📌 Resumo Rápido

O dashboard de aprovação permite revisar negócios (locais e serviços) pendentes, visualizar detalhes completos e tomar decisões de aprovação/rejeição.

---

## 🎯 Fluxo Principal

### 1️⃣ **Entrar no Dashboard**
```
Login como Administrador/Aprovador
  ↓
App.tsx → AprovadorDashboard
```

### 2️⃣ **Ver Lista de Pendentes**
Na sidebar, clique em:
- **"Locais Pendentes"** (🏠) - Para revisar novos locais/negócios
- **"Serviços Pendentes"** (💼) - Para revisar novos serviços

### 3️⃣ **Clicar para Ver Detalhes**
Na tabela, clique no botão **👁️ Ver** ou no nome do item

### 4️⃣ **Modal Abre com Detalhes Completos**
```
┌─────────────────────────────────────────┐
│  GALERIA DE IMAGENS                      │
│  [←] Imagem [→]              Contador    │
├─────────────────────────────────────────┤
│  INFORMAÇÕES DO NEGÓCIO                  │
│  • Categoria, Tipo, Localização          │
│  • GPS, Endereço, Melhor Época           │
│  • Descrição, Destaques                  │
├─────────────────────────────────────────┤
│  CHECKLIST DE VERIFICAÇÃO                │
│  ☑️ Nome  ☐ Descrição  ☐ Fotos         │
│  ☑️ GPS   ☑️ Categoria ☐ Duplicado     │
├─────────────────────────────────────────┤
│  OBSERVAÇÕES/MOTIVO                      │
│  [Campo de texto para comentários]      │
├─────────────────────────────────────────┤
│  [Cancelar] [Solicitar Correção]        │
│  [Rejeitar] [✓ Aprovar]                 │
└─────────────────────────────────────────┘
```

### 5️⃣ **Tomar Decisão**

#### ✅ **APROVAR** (Botão Verde)
- **Quando**: O conteúdo está completo, correto e de qualidade
- **Resultado**: O item fica publicado e visível no app
- **Usuário**: Recebe notificação de aprovação
- **Requer**: Nenhum campo obrigatório

**Exemplo de aprovação:**
- Local tem fotos de boa qualidade
- Descrição é completa e precisa
- Coordenadas GPS estão corretas
- Não há avisos de duplicação

#### ⚠️ **SOLICITAR CORREÇÃO** (Botão Laranja)
- **Quando**: O conteúdo tem problemas que podem ser corrigidos
- **Resultado**: Volta para o usuário com feedback
- **Usuário**: Recebe motivo e pode editar/reenviar
- **O que escrever**: Descreva exatamente o que falta ou está errado

**Exemplo de correção solicitada:**
```
"Faltam as coordenadas GPS. Por favor, adicione a localização 
exata do local usando um GPS ou Google Maps."
```

```
"As fotos estão muito pixeladas. Por favor, carregue fotos 
de melhor qualidade (mínimo 1920x1080)."
```

```
"Falta a descrição em português. O local deve ter descrição 
completa em português e inglês."
```

#### ❌ **REJEITAR** (Botão Vermelho)
- **Quando**: O conteúdo viola políticas ou não pode ser corrigido facilmente
- **Resultado**: O item é rejeitado e não fica visível
- **Usuário**: Recebe motivo da rejeição
- **Requer**: Campo de observações OBRIGATÓRIO (botão só ativa se tiver motivo)

**Exemplos de rejeição:**
```
"Este local é duplicado. Já existe uma entrada similar: 
'Praia de Tofo' enviada por outro usuário."
```

```
"As fotos não parecem ser do local real. As imagens parecem 
ser de stock ou não correspondem à descrição."
```

```
"Conteúdo violou as políticas de uso. Descrição contém 
linguagem ofensiva."
```

---

## 📊 Visão Geral (Dashboard Home)

Na página inicial do aprovador você vê:

- **Contadores**: Total de pendentes, aprovados, rejeitados
- **Gráficos**: Tendências de aprovação ao longo dos dias
- **Alertas**: Conteúdos com avisos (duplicados, com problemas)
- **Últimas ações**: Histórico das últimas aprovações/rejeições

---

## 🔍 Dicas de Verificação

### Checklist ao revisar um local:

| Item | O que verificar | ✓ Bom | ✗ Problema |
|------|-----------------|-------|-----------|
| 📸 **Fotos** | Qualidade, nitidez, relevância | HD, claras | Pixeladas, irrelevantes |
| 📝 **Descrição** | Completa, clara, sem erros | 3+ parágrafos | Muito curta (<50 palavras) |
| 🗺️ **Localização** | GPS ou endereço preciso | Coordenadas exatas | Vago ou incorreto |
| 🏷️ **Categoria** | Categoria correta | Praia, Natureza, etc | Errada ou genérica |
| 🔍 **Duplicação** | Não existe entrada similar | Único | Igual a outro local |
| 📱 **Contactos** | Se aplicável, contactos válidos | Email/Tel válido | Inválido ou inativo |
| 🌐 **Idioma** | Em português (PT-PT) | Português claro | Tradução automática fraca |

---

## 📱 Usando o Painel de Notificações

No canto superior direito há um 🔔 com notificações:

- **Novos locais pendentes** (amarelo) - Clique para abrir direto
- **Novos serviços pendentes** (azul) - Clique para abrir direto
- **Conteúdos reportados** (vermelho) - Clique para revisar

---

## 📈 Relatórios Disponíveis

### Aba "Qualidade"
- Gráfico de aprovações vs rejeições por dia
- Taxa de aprovação média
- Razões mais comuns de rejeição
- Performance do aprovador

### Aba "Histórico"
- Lista completa de todas as ações
- Quem aprovou/rejeitou
- Quando foi feita a ação
- Motivo/observações

### Aba "Reportados"
- Conteúdos denunciados por usuários
- Razão do relatório
- Severidade (Alta/Média/Baixa)
- Status da resolução

---

## ⚙️ Configurações Recomendadas

### Ao aprovar:
1. Verifique SEMPRE as fotos
2. Confirme a localização no mapa
3. Leia a descrição completa
4. Marque os itens checklist conforme valida

### Ao rejeitar:
1. SEMPRE deixe motivo claro
2. Seja específico (não escreva "rejeitado")
3. Dê orientação sobre como corrigir se possível
4. Mantenha tom profissional e educado

### Ao solicitar correção:
1. Seja específico sobre o que falta
2. Dê exemplos do que espera
3. Seja educado - o usuário quer ajudar!
4. Deixe possibilidade de recurso

---

## 🚀 Dicas Avançadas

### Bulk Actions (em breve)
- Aprovar/rejeitar múltiplos itens ao mesmo tempo
- Filtrar por categoria, data, usuário

### Búsca Inteligente
- Pesquise por nome: "Praia de Tofo"
- Pesquise por usuário: "Ana Machava"
- Pesquise por tipo: "categoria:Natureza"

### Atalhos de Teclado
- `V` - Ver detalhes do item selecionado
- `A` - Aprovar item
- `R` - Rejeitar item  
- `C` - Solicitar correção
- `Esc` - Fechar modal

---

## 🎯 Métricas de Performance

Você verá sua performance no dashboard:

- **Tempo médio de revisão**: Quanto tempo leva para revisar cada item
- **Taxa de aprovação**: % de itens aprovados vs rejeitados
- **Precisão**: Avaliação de quão bem você escolhe
- **Feedback**: O que os usuários acham de suas decisões

---

## ❓ Perguntas Frequentes

### P: E se eu não tiver certeza sobre algo?
**R:** Use "Solicitar Correção". O usuário pode fornecer mais info ou corrigir.

### P: Quanto tempo tenho para revisar cada item?
**R:** Não há limite, mas tente revisar em até 48h para melhor experiência do usuário.

### P: Posso mudar uma decisão depois?
**R:** Contacte o administrador principal para reverter uma ação.

### P: Como reporto um problema com um item?
**R:** Use o botão "🚩 Reportar" no modal - vai para admin.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este guia
2. Contacte o administrador principal
3. Reporte bugs via formulário de feedback

**Bom trabalho! 🎉**
