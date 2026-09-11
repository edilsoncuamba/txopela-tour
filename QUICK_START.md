# 🚀 Guia Rápido - Txopela Tour

## ⚡ **INÍCIO RÁPIDO**

### **1. Backend está rodando?**
```bash
curl http://192.168.88.127:8000/api/health
```
✅ **Resposta esperada:** `{ "status": "ok" }`

### **2. Frontend está rodando?**
✅ **Sim!** Servidor já iniciado em: `http://localhost:5174`

### **3. Abra o navegador**
```
http://localhost:5174
```

### **4. Abra o Console (F12)**
Você verá os testes de conexão executando automaticamente.

---

## 🔐 **TESTAR LOGIN**

### **Opção 1: Provedor de Serviços**
- **Email:** `servico@gmail.com`
- **Senha:** `S123456`
- **Resultado:** Mostra **"Sugerir Serviço"** no menu

### **Opção 2: Negociante/Empresa**
- **Email:** `negociantenormal@gmail.com`
- **Senha:** `N123456`
- **Resultado:** Mostra **"Sugerir Serviço"** no menu

### **Opção 3: Turista**
- **Email:** `turista@gmail.com`
- **Senha:** `T123456`
- **Resultado:** Mostra **"Sugerir Local"** no menu

---

## ✅ **FUNCIONALIDADES PARA TESTAR**

### **Como Turista** (`turista@gmail.com`)
1. ✅ Explorar locais por província
2. ✅ Adicionar novo local turístico
3. ✅ Avaliar locais (estrelas + comentário)
4. ✅ Salvar favoritos
5. ✅ Buscar locais próximos (GPS)
6. ✅ Criar posts sobre descobertas
7. ✅ Curtir e comentar posts
8. ✅ Seguir outros usuários

### **Como Provedor de Serviços** (`servico@gmail.com`)
1. ✅ Adicionar serviço turístico (guia, transporte, etc.)
2. ✅ Gerenciar reservas de clientes
3. ✅ Aceitar/rejeitar reservas
4. ✅ Ver estatísticas de serviços
5. ✅ Upload de fotos dos serviços
6. ✅ Responder avaliações
7. ✅ Criar posts promocionais

### **Como Negociante** (`negociantenormal@gmail.com`)
1. ✅ Adicionar estabelecimento (hotel, restaurante, loja)
2. ✅ Gerenciar múltiplos locais comerciais
3. ✅ Oferecer serviços complementares
4. ✅ Dashboard de negócio
5. ✅ Estatísticas de visualizações
6. ✅ Gerenciar horários de funcionamento

---

## 🧪 **TESTE PASSO A PASSO**

### **Teste 1: Login e Perfil**
1. Acesse `http://localhost:5174`
2. Faça login com `servico@gmail.com` / `S123456`
3. Vá para Perfil
4. Verifique se mostra "Provedor de Serviços"
5. Edite bio e localização
6. Salve as alterações

### **Teste 2: Criar Serviço**
1. Após login, clique em **"Sugerir Serviço"**
2. Preencha:
   - **Título:** Guia Turístico Maputo
   - **Categoria:** Guias locais
   - **Descrição:** Tours pela cidade de Maputo
   - **Preço:** 1500 MZN por pessoa
   - **Província:** Maputo
3. Adicione fotos (máx 10)
4. Clique em **"Criar Serviço"**
5. Aguarde aprovação

### **Teste 3: Busca Universal**
1. Vá para a tela de Busca (ícone de lupa)
2. Digite "Maputo"
3. Veja resultados de:
   - Posts sobre Maputo
   - Locais em Maputo
   - Serviços em Maputo
   - Usuários de Maputo
4. Filtre por tipo (Posts, Locais, Serviços)

### **Teste 4: Fazer Reserva**
1. Faça logout
2. Login como turista (`turista@gmail.com`)
3. Busque um serviço
4. Clique em **"Reservar"**
5. Preencha:
   - Data de início
   - Número de participantes
   - Mensagem para o provedor
6. Confirme a reserva

### **Teste 5: Gerenciar Reserva (Provedor)**
1. Faça logout
2. Login como provedor (`servico@gmail.com`)
3. Vá para **"Minhas Reservas"**
4. Veja reservas pendentes
5. Aceite ou rejeite reservas
6. Veja histórico de reservas

---

## 📱 **NAVEGAÇÃO RÁPIDA**

### **Menu Principal**
- 🏠 **Home** - Feed de posts e descobertas
- 🗺️ **Mapa** - Ver locais no mapa interativo
- 🔍 **Busca** - Busca universal
- ➕ **Adicionar** - Criar local/serviço (depende do tipo de usuário)
- 👤 **Perfil** - Seu perfil e configurações

### **Menu Lateral**
- 📖 **Cultura** - Conteúdo cultural por província
- 🎒 **Descobertas** - Todos os locais turísticos
- 🛎️ **Serviços** - Serviços turísticos
- ⭐ **Favoritos** - Seus locais salvos
- 📅 **Reservas** - Suas reservas
- 🔔 **Notificações** - Alertas e avisos
- ⚙️ **Definições** - Configurações

---

## 🐛 **PROBLEMAS COMUNS**

### **1. "Não consigo fazer login"**
**Soluções:**
- Verifique se o backend está rodando (`curl http://192.168.88.127:8000/api/health`)
- Limpe o cache do navegador (Ctrl+Shift+Del)
- Tente outro navegador
- Veja console (F12) para erros

### **2. "Backend não conecta"**
**Soluções:**
```bash
# Ping no servidor
ping 192.168.88.127

# Teste a porta
curl http://192.168.88.127:8000/api/health

# Verifique firewall
netsh advfirewall firewall show rule name=all | findstr 8000
```

### **3. "Imagens não carregam"**
**Soluções:**
- Verifique conexão de rede
- Limpe cache do navegador
- Recarregue a página (Ctrl+R)
- Verifique URL das imagens no console

### **4. "Token expirado"**
**Solução:**
```javascript
// Console do navegador (F12)
localStorage.clear();
location.reload();
```

### **5. "Ainda mostra 'Sugerir Local' para servico@gmail.com"**
**Causa:** Role incorreto no backend

**Solução no Backend (Django):**
```python
# No shell do Django
from django.contrib.auth import get_user_model
User = get_user_model()

user = User.objects.get(email='servico@gmail.com')
user.role = 'guide'
user.save()
```

**Ou via SQL direto:**
```sql
UPDATE users SET role = 'guide' WHERE email = 'servico@gmail.com';
```

**Verificar no Frontend:**
```bash
curl -X POST http://192.168.88.127:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"servico@gmail.com","password":"S123456"}' \
  | json_pp
```

---

## 📊 **LOGS E DEBUG**

### **Ver logs no Frontend**
1. Abra Console (F12)
2. Aba "Console"
3. Procure por:
   - `🔗 Testando conexão com backend`
   - `✅ Backend conectado`
   - `🔐 Testando login`

### **Ver Network Requests**
1. Abra DevTools (F12)
2. Aba "Network"
3. Filtre por "Fetch/XHR"
4. Veja requisições para `/api/`
5. Clique em uma requisição
6. Veja Headers, Payload, Response

### **Ver Storage**
1. Abra DevTools (F12)
2. Aba "Application" (Chrome) ou "Storage" (Firefox)
3. Local Storage → `http://localhost:5174`
4. Veja `access_token` e `refresh_token`

---

## 🎯 **CHECKLIST DE TESTE**

### **Autenticação**
- [ ] Login com email/senha
- [ ] Registro de novo usuário
- [ ] Logout
- [ ] Refresh token automático
- [ ] Recuperação de senha

### **Perfil**
- [ ] Ver perfil próprio
- [ ] Editar perfil
- [ ] Upload de avatar
- [ ] Ver perfil de outros
- [ ] Seguir/deixar de seguir

### **Locais**
- [ ] Listar locais
- [ ] Ver detalhes
- [ ] Criar novo local
- [ ] Editar local
- [ ] Deletar local
- [ ] Salvar favorito
- [ ] Avaliar local

### **Serviços**
- [ ] Listar serviços
- [ ] Ver detalhes
- [ ] Criar serviço
- [ ] Fazer reserva
- [ ] Gerenciar reservas
- [ ] Aceitar/rejeitar reserva

### **Posts**
- [ ] Ver feed
- [ ] Criar post
- [ ] Upload de imagens
- [ ] Curtir post
- [ ] Comentar post
- [ ] Compartilhar post

### **Busca**
- [ ] Busca universal
- [ ] Autocompletar
- [ ] Filtros
- [ ] Busca por proximidade

### **Notificações**
- [ ] Ver notificações
- [ ] Marcar como lida
- [ ] Contador de não lidas

---

## 🎉 **ESTÁ TUDO FUNCIONANDO?**

✅ **Parabéns!** A aplicação está configurada e pronta para uso.

### **URLs Importantes**
- **Frontend:** `http://localhost:5174`
- **Backend:** `http://192.168.88.127:8000`
- **API Docs:** `http://192.168.88.127:8000/api/docs` (se disponível)

### **Documentação Completa**
- 📘 [`BACKEND_INTEGRATION_SETUP.md`](./BACKEND_INTEGRATION_SETUP.md) - Configuração completa
- 📗 [`backend-api-documentation.md`](./backend-api-documentation.md) - Endpoints da API

### **Próximos Passos**
1. ✅ Teste todas as funcionalidades
2. ✅ Reporte bugs encontrados
3. ✅ Sugira melhorias
4. ✅ Deploy em produção quando estável

---

**💡 Dica:** Deixe o console (F12) sempre aberto durante os testes para ver logs em tempo real!

**🚀 Bom desenvolvimento!**