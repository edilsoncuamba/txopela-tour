# Guia Funcional - Aprovador Dashboard com Fluxo de Aprovação/Rejeição

## 🎯 Objetivo
Implementar um sistema de aprovação/rejeição funcional onde o usuário pode:
1. **Clicar em um negócio/local** para ver detalhes
2. **Visualizar modal com informações completas**
3. **Decidir**: Aprovar, Rejeitar ou Solicitar Correção
4. **Deixar observações/motivos**

## 📋 Componentes Principais

### 1. **LocalModal** - Modal de Detalhes
O modal é exibido quando você clica em um local/negócio. Ele contém:

- **Galeria de imagens** com navegação anterior/próxima
- **Informações do local**: GPS, Endereço, Categoria, etc.
- **Verificação de qualidade**: Checklist para validar conteúdo
- **Campo de observações**: Para adicionar motivo da decisão
- **3 botões de ação**:
  - ✅ **Aprovar** (verde) - Aprova o conteúdo
  - ⚠️ **Solicitar Correção** (laranja) - Pede ajustes
  - ❌ **Rejeitar** (vermelho) - Rejeita o conteúdo (requer motivo)

### 2. **Estado e Fluxo**

```
Pendente → [Clicar para ver detalhes]
         ↓
       Modal abre
         ↓
   [Aprovador decide]
         ↓
    Aprovado / Rejeito / Pedir Correção
         ↓
  Status atualizado + Notificação ao usuário
```

## 🔧 Implementação Técnica

### Arquivo: `AprovadorDashboard.tsx`

#### Estado
```typescript
const [selectedLocal, setSelectedLocal] = useState<PendingLocal | null>(null);
const [selectedService, setSelectedService] = useState<PendingService | null>(null);
const [localStatuses, setLocalStatuses] = useState<Record<number, Status>>(...);
const [serviceStatuses, setServiceStatuses] = useState<Record<number, Status>>(...);
```

#### Ações
```typescript
const handleLocalAction = async (id: number, action: Status, note: string) => {
  // 1. Enviar para API backend
  // await adminApi.updateApproval(id, { status: action, reason: note });
  
  // 2. Atualizar estado local
  setLocalStatuses(s => ({ ...s, [id]: action }));
  
  // 3. Fechar modal
  setSelectedLocal(null);
};
```

## 🎨 Visual do Modal

```
╔════════════════════════════════════════════╗
║  [←] Imagem do Local [→]          [×]      ║
║                                            ║
║  Cascata de Chimanimani                    ║
║  Submetido por Ana Machava · há 2h         ║
╠════════════════════════════════════════════╣
║ ⚠️ Possível duplicado detectado            ║
╠════════════════════════════════════════════╣
║ 🏷️ Categoria | 🗺️ Tipo | 📍 Província    ║
║ 🌞 Melhor Época | 📡 GPS | 📌 Endereço   ║
╠════════════════════════════════════════════╣
║ ✨ Destaques                               ║
║ Trilhos de trekking, Piscinas naturais    ║
╠════════════════════════════════════════════╣
║ 📝 Descrição                               ║
║ Cascata deslumbrante nas montanhas...     ║
╠════════════════════════════════════════════╣
║ ✓ Verificação                              ║
║ ☑️ Nome  ☐ Descrição  ☑️ Localização      ║
║ ☐ Fotos ☑️ Categoria ☑️ Duplicado        ║
╠════════════════════════════════════════════╣
║ 💬 Notas/Feedback                          ║
║ [____________________________________...]║
╠════════════════════════════════════════════╣
║  [Cancelar]  [Solicitar Correção]         ║
║  [Rejeitar]  [✓ Aprovar]                  ║
╚════════════════════════════════════════════╝
```

## 🔌 Integração com Backend

### API Endpoints Necessários

```typescript
// Aprovar/Rejeitar um local
PUT /api/admin/approvals/locais/{localId}
Body: {
  status: "aprovado" | "rejeitado" | "correcao_solicitada",
  reason: "Motivo ou observações (obrigatório para rejeição)"
}

// Aprovar/Rejeitar um serviço
PUT /api/admin/approvals/servicos/{serviceId}
Body: {
  status: "aprovado" | "rejeitado" | "correcao_solicitada",
  reason: "Motivo ou observações"
}
```

### Implementação no `api.ts`

```typescript
export const adminApi = {
  // Atualizar status de aprovação de um local
  updateLocalApproval: (id: number, data: { status: string; reason: string }) =>
    apiFetch<{ success: boolean }>(`/api/admin/approvals/locais/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Atualizar status de aprovação de um serviço
  updateServiceApproval: (id: number, data: { status: string; reason: string }) =>
    apiFetch<{ success: boolean }>(`/api/admin/approvals/servicos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Obter lista de pendentes
  getPendingApprovals: (type: 'locais' | 'servicos') =>
    apiFetch<{ items: PendingLocal[] | PendingService[] }>(
      `/api/admin/pending-approvals?type=${type}`
    ),
};
```

## 💻 Como Usar

### 1. **Ver um Local/Serviço Pendente**
Clique no botão "👁️ Ver" ou no nome do item na tabela

### 2. **Revisar Informações**
- Navegue pelas imagens
- Leia a descrição completa
- Marque os itens verificados no checklist
- Verifique se há aviso de duplicado

### 3. **Deixar Observações**
Escreva motivo da decisão (obrigatório para rejeição)

### 4. **Tomar Decisão**
- **Aprovar** ✅ → O conteúdo fica visível para usuários
- **Solicitar Correção** ⚠️ → Usuário recebe feedback para melhorar
- **Rejeitar** ❌ → Conteúdo não é publicado

## 📊 Estados de Aprovação

| Status | Cor | Descrição |
|--------|-----|-----------|
| Pendente | 🟡 Amarelo | Aguardando revisão |
| Em revisão | 🔵 Azul | Sendo analisado |
| Aprovado | 🟢 Verde | Aprovado e publicado |
| Rejeitado | 🔴 Vermelho | Rejeitado, não publicado |
| Correção solicitada | 🟠 Laranja | Pede ajustes |

## ✅ Checklist de Implementação

- [ ] Modal com galeria de imagens funcional
- [ ] Campos de verificação funcionando
- [ ] Botões de ação ativados
- [ ] Estado atualizado após ação
- [ ] Notificações ao usuário
- [ ] Integração com backend API
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Audit log/histórico

## 🐛 Troubleshooting

### Modal não abre
- Verificar se `setSelectedLocal` está sendo chamado
- Verificar se `LocalModal` está no JSX retornado

### Ação não funciona
- Verificar se `handleLocalAction` está sendo chamado
- Verificar se `onAction` está passando dados corretos
- Verificar se backend está respondendo

### Botão rejeitar desativado
- Campo de observações está vazio (rejeição requer motivo)
- Tipo: `isSubmitting` pode estar `true`

## 🚀 Próximos Passos

1. **Conectar ao Backend** - Implementar chamadas API
2. **Notificações** - Enviar e-mail ao usuário sobre decisão
3. **Audit Log** - Registrar quem aprovou/rejeitou e quando
4. **Analytics** - Dashboard com estatísticas de aprovação
5. **Bulk Actions** - Aprovar/rejeitar múltiplos itens
