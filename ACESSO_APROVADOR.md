# 🔍 ACESSO PARA APROVADOR

## 📋 URL de Acesso

A página de aprovação está disponível em:

```
http://localhost:5173/approver?name=NOME_DO_APROVADOR
```

### Exemplos de URLs com Diferentes Aprovadores:

```
# Aprovador 1
http://localhost:5173/approver?name=João%20Silva

# Aprovador 2  
http://localhost:5173/approver?name=Maria%20Santos

# Aprovador 3
http://localhost:5173/approver?name=Carlos%20Mwale

# Aprovador Admin
http://localhost:5173/approver?name=Admin%20Principal
```

---

## 🎯 Como Usar

### 1. Iniciar o Frontend
```bash
cd app
npm run dev
```

### 2. Acessar a Página de Aprovação
Abra no navegador:
```
http://localhost:5173/approver?name=SEU_NOME
```

Substitua `SEU_NOME` pelo nome do aprovador desejado.

---

## 👤 Exemplos de URLs Prontas

Clique em uma das URLs abaixo (substitua `localhost:5173` pelo seu IP se acessar de outro dispositivo):

### Approved Demo URLs:
- [João Silva](http://localhost:5173/approver?name=João%20Silva)
- [Maria Santos](http://localhost:5173/approver?name=Maria%20Santos)
- [Carlos Mwale](http://localhost:5173/approver?name=Carlos%20Mwale)
- [Admin Principal](http://localhost:5173/approver?name=Admin%20Principal)

---

## 🔧 Funcionalidades da Página de Aprovador

### ✅ Visualizar Solicitações
- **Pendentes**: Solicitações aguardando aprovação
- **Aprovadas**: Solicitações já aprovadas
- **Rejeitadas**: Solicitações já rejeitadas
- **Todas**: Ver todas as solicitações

### ✅ Ações Disponíveis
- ✓ **Aprovar**: Clique no botão verde "Aprovar"
- ✗ **Rejeitar**: Clique no botão vermelho "Rejeitar"

### ✅ Tipos de Solicitações
1. **Usuário** (User) - Novos registros de usuários
2. **Local** (Local) - Novos locais turísticos sugeridos
3. **Serviço** (Service) - Novos serviços oferecidos
4. **Post** (Post) - Posts/conteúdo a ser publicado

### ✅ Informações Exibidas
- Tipo de solicitação
- Título e descrição
- Quem enviou
- Data de envio
- Status atual (Pendente/Aprovado/Rejeitado)
- Dados adicionais (Provínci, Preço, etc.)

---

## 📊 Dashboard do Aprovador

Na página aparecem:

```
┌─────────────────────────────────────────┐
│   Centro de Aprovações                  │
│   Aprovador: [NOME_APROVADOR]           │
│                                         │
│   Estatísticas:                        │
│   • Pendentes: X                        │
│   • Aprovados: X                        │
│   • Rejeitados: X                       │
│   • Total: X                            │
└─────────────────────────────────────────┘
```

---

## 🌐 Acesso de Outros Dispositivos

### Se o servidor está em: `192.168.88.127`

Substitua `localhost` pelo IP do seu computador:

```
http://192.168.88.127:5173/approver?name=NOME_DO_APROVADOR
```

---

## 📱 Formatação de URL

### Regras Importantes:
1. O nome deve estar URL-encoded
2. Espaços devem ser `%20` ou `+`
3. Caracteres especiais devem ser escapados

### Exemplos:
```
# Correto
http://localhost:5173/approver?name=João%20Silva

# Correto (alternativa)
http://localhost:5173/approver?name=João+Silva

# Incorreto (espaço sem encoding)
http://localhost:5173/approver?name=João Silva

# Incorreto (falta de encoding de acentos)
http://localhost:5173/approver?name=Joao%20Silva
```

---

## 🔒 Segurança (Implementação Futura)

Para ambiente de produção, será necessário implementar:

- ✓ Autenticação de aprovadores
- ✓ Autorização baseada em roles
- ✓ Log de todas as aprovações/rejeições
- ✓ Dois fatores de autenticação (2FA)
- ✓ Permissões específicas por tipo de solicitação

---

## 🛠️ Customização do Nome do Aprovador

O nome do aprovador é passado via query parameter `?name=`:

### No código (React):
```typescript
import { useSearchParams } from 'react-router-dom';

function Approver() {
  const [searchParams] = useSearchParams();
  const approverName = searchParams.get('name') || 'Aprovador';
  
  // O nome aparece no header
  // Exemplo: "Aprovador: João Silva"
}
```

---

## 📖 Como Compartilhar a URL

### Via Email:
```
Olá João,

Sua página de aprovação está pronta:
http://localhost:5173/approver?name=João%20Silva

Clique para acessar e gerenciar as aprovações.

Atenciosamente
```

### Via Mensagem:
```
Página de aprovação para Maria:
http://localhost:5173/approver?name=Maria%20Santos
```

---

## ✨ Próximas Melhorias

- [ ] Integração com backend de aprovações
- [ ] Persistência de dados em banco de dados
- [ ] Notificações para o aprovador
- [ ] Histórico de aprovações
- [ ] Export de relatórios
- [ ] Filtros avançados
- [ ] Busca de solicitações
- [ ] Comentários nas aprovações

---

## 🆘 Solução de Problemas

### "Página em branco"
- Verifique se o servidor está rodando: `npm run dev`
- Limpe o cache: `Ctrl+Shift+Del`

### "Nome não aparece"
- Use URL encoding para espaços: `%20`
- Exemplo: `João%20Silva` e não `João Silva`

### "Botões não funcionam"
- F12 → Console para ver erros
- Verifique conexão com internet

---

## 📞 Suporte

Tem dúvidas sobre a página de Aprovador?

1. Verifique este documento
2. Consulte `TROUBLESHOOTING.md`
3. Revise o código em `/app/src/pages/Approver.tsx`

---

**Versão:** 1.0  
**Data:** Junho 2026  
**Status:** ✅ Pronto para Uso

