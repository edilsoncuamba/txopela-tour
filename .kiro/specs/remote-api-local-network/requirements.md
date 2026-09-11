# Requirements Document: Remote API Local Network Configuration

## Introduction

O Txopela Tour MVP é uma aplicação de turismo cultural em Moçambique desenvolvida em React + TypeScript + Vite. Para suportar o desenvolvimento em rede local com backend e frontend em máquinas diferentes, esta especificação define os requisitos para preparar o frontend a consumir a API remota do backend através da rede local.

O foco é garantir que o frontend possa se conectar de forma confiável ao backend, com suporte a configuração dinâmica, validação de conectividade, tratamento de erros robustos e testes abrangentes de todos os endpoints até à secção 6.2 da documentação da API.

## Glossary

- **Backend**: Servidor API Django que fornece endpoints RESTful para o Txopela Tour
- **Frontend**: Aplicação React que consome a API do backend
- **Rede Local**: Mesma sub-rede LAN onde backend e frontend estão conectados
- **IP Dinâmico**: Endereço IP que pode mudar (comum em ambientes de desenvolvimento)
- **backendConfig**: Classe de gerenciamento de configuração dinâmica em `src/config/backend.ts`
- **Health Check**: Endpoint que testa conectividade com o backend (`/api/health/`)
- **CORS**: Cross-Origin Resource Sharing - política de segurança para requisições entre origens
- **Token Refresh**: Mecanismo de renovação de JWT quando o access token expira
- **Settings Page**: Página de configurações da aplicação onde usuário pode alterar a URL do backend
- **API_BASE_URL**: URL raiz do backend (ex: `http://192.168.137.124:8000`)
- **Environment Variables**: Variáveis de configuração em ficheiro `.env` e `import.meta.env`

## Requirements

### Requirement 1: Configuração Dinâmica do Backend via Variáveis de Ambiente

**User Story:** Como desenvolvedor, quero configurar a URL do backend através de variáveis de ambiente, para que não precise recompilar a aplicação ao mudar de servidor.

#### Acceptance Criteria

1. WHEN a aplicação inicia, THE Frontend SHALL carregar a URL do backend a partir de `VITE_API_URL` no ficheiro `.env`
2. WHERE um valor customizado é armazenado em `localStorage` com chave `txopela_backend_config`, THE Frontend SHALL usar esse valor em vez da variável de ambiente
3. WHEN nenhuma configuração é encontrada (nem env nem localStorage), THE Frontend SHALL usar o valor padrão `http://localhost:8000/api`
4. THE Frontend SHALL permitir alteração da URL do backend em tempo real sem recarregar a página
5. WHEN a URL é alterada, THE Frontend SHALL notificar o `api.ts` service para usar a nova URL nas próximas requisições

#### Acceptance Criteria - Validation

1. Format WHEN a URL é alterada, THE Frontend SHALL validar que segue o padrão `http(s)://host:port`
2. WHEN uma URL inválida é fornecida, THE Frontend SHALL exibir mensagem de erro clara e manter a URL anterior válida
3. WHEN a URL é alterada, THE Frontend SHALL persistir em `localStorage` para uso futuro

---

### Requirement 2: Interface de Configuração na Página Settings

**User Story:** Como utilizador, quero alterar a URL do backend através de uma interface visual na página de Configurações, para poder apontar para diferentes máquinas da rede local.

#### Acceptance Criteria

1. WHEN o utilizador abre a página Settings, THE Frontend SHALL exibir secção dedicada "Backend Configuration"
2. THE Backend Configuration secção SHALL exibir o campo de entrada com a URL atual do backend
3. WHEN o utilizador altera o valor e clica "Guardar", THE Frontend SHALL validar e guardar a nova configuração
4. WHEN a configuração é salva com sucesso, THE Frontend SHALL exibir notificação de confirmação visível
5. WHERE um histórico de URLs anteriores existe, THE Frontend SHALL permitir selecionar rapidamente entre últimas 5 URLs usadas
6. WHEN o utilizador clica "Testar Conexão", THE Frontend SHALL executar health check e exibir resultado

#### Acceptance Criteria - Error Handling

1. IF a validação falhar (URL inválida), THEN THE Frontend SHALL exibir mensagem de erro específica
2. IF o backend não responde, THEN THE Frontend SHALL exibir mensagem de erro com opção de retentar
3. WHILE a requisição de teste está em progresso, THE Frontend SHALL desabilitar botões de ação e mostrar loading indicator

---

### Requirement 3: Health Check Endpoint para Validar Conectividade

**User Story:** Como desenvolvedor, quero testar se a conexão com o backend está ativa, para saber se posso fazer requisições com segurança.

#### Acceptance Criteria

1. WHEN a aplicação inicia, THE Frontend SHALL fazer requisição `GET` a `/api/health/` no backend
2. IF a resposta é `HTTP 200`, THEN THE Frontend SHALL considerar backend como online e disponível
3. IF a resposta é `HTTP 4xx ou 5xx`, THEN THE Frontend SHALL considerar backend como offline
4. WHEN a requisição ao health check falha por timeout, THE Frontend SHALL tentar reconectar após 5 segundos (máximo 3 tentativas)
5. WHEN o health check falha, THE Frontend SHALL exibir indicador visual de desconexão (ícone de aviso)

#### Acceptance Criteria - Response Validation

1. WHEN a requisição ao health check é bem-sucedida, THE Frontend SHALL extrair informações do servidor (versão, status)
2. THE Health check response SHALL incluir no mínimo: `{ "status": "ok", "timestamp": "ISO-date" }`
3. WHERE informações adicionais existem na resposta, THE Frontend SHALL registar no console para debugging

---

### Requirement 4: Validação de Endpoints da API até Secção 6.2

**User Story:** Como desenvolvedor, quero confirmar que todos os endpoints consumidos pelo frontend (até secção 6.2 da documentação) funcionam corretamente com o backend.

#### Acceptance Criteria

1. WHEN a aplicação carrega, THE Frontend SHALL testar os seguintes endpoints:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/refresh`
   - `GET /api/users/me`
   - `PUT /api/users/me`
   - `GET /api/posts`
   - `POST /api/posts`
   - `GET /api/locals`
   - `POST /api/locals`
   - `GET /api/services`
   - `POST /api/services`
   - `GET /api/search`
   - `POST /api/upload/images`

2. WHERE um endpoint retorna `HTTP 404`, THEN THE Frontend SHALL marcar esse endpoint como "não implementado"
3. WHERE um endpoint retorna `HTTP 200 ou 201`, THEN THE Frontend SHALL marcar como "operacional"
4. WHEN testes de endpoint completam, THE Frontend SHALL exibir relatório com status de cada um

---

### Requirement 5: Tratamento de Erros de Rede e Autenticação

**User Story:** Como utilizador, quero compreender quando o backend está indisponível ou quando há erro de autenticação, com mensagens claras e opções para resolver.

#### Acceptance Criteria

1. IF a requisição falha por timeout (sem resposta), THEN THE Frontend SHALL exibir mensagem "Backend não responde - verifique a conexão"
2. IF a requisição retorna `HTTP 401 (Unauthorized)`, THEN THE Frontend SHALL:
   - Tentar renovar o token usando refresh token
   - SE refresh falhar, redirecionar para página de login
   - Exibir mensagem "Sessão expirada - faça login novamente"

3. IF a requisição retorna `HTTP 403 (Forbidden)`, THEN THE Frontend SHALL exibir "Você não tem permissão para esta ação"
4. IF a requisição retorna `HTTP 404 (Not Found)`, THEN THE Frontend SHALL exibir "Recurso não encontrado no servidor"
5. IF a requisição retorna `HTTP 5xx (Server Error)`, THEN THE Frontend SHALL exibir "Erro no servidor backend - tente novamente mais tarde"

#### Acceptance Criteria - Error Recovery

1. WHERE a requisição falha por erro de rede, THE Frontend SHALL permitir repetição automática com backoff exponencial (máximo 3 tentativas)
2. WHEN um erro de rede ocorre, THE Frontend SHALL armazenar a requisição para retentar quando a conexão for restaurada
3. WHILE a requisição está sendo retentada, THE Frontend SHALL exibir indicador visual de sincronização pendente

---

### Requirement 6: Armazenamento de Configuração em localStorage

**User Story:** Como utilizador, quero que minhas configurações de backend sejam preservadas entre sessões, para não precisar reconfigurá-las a cada vez.

#### Acceptance Criteria

1. WHEN a configuração de backend é alterada, THE Frontend SHALL armazenar em `localStorage` com chave `txopela_backend_config`
2. WHEN a aplicação recarrega ou reabre, THE Frontend SHALL restaurar a última configuração usada
3. WHERE nenhuma configuração foi previamente salva, THE Frontend SHALL usar a configuração padrão do `.env`
4. WHEN o utilizador clica "Resets to Default", THE Frontend SHALL remover a configuração de localStorage e voltar a usar `.env`

#### Acceptance Criteria - Data Format

1. THE localStorage entry SHALL estar em formato JSON: `{"protocol": "http", "host": "192.168.x.x", "port": 8000}`
2. WHEN a migração de versão ocorre, THE Frontend SHALL validar e adaptar o formato antigo se necessário
3. THE localStorage entry SHALL incluir timestamp para rastrear quando foi última configuração alterada

---

### Requirement 7: Documentação de Setup para Rede Local

**User Story:** Como desenvolvedor novo no projeto, quero documentação clara explicando como configurar o frontend para conectar ao backend na rede local.

#### Acceptance Criteria

1. THE Project SHALL incluir ficheiro `NETWORK_SETUP_GUIDE.md` na raiz do projeto
2. THE Guide SHALL incluir passos para:
   - Obter o IP da máquina do backend (`ipconfig` no Windows, `ifconfig` no Linux/Mac)
   - Configurar `.env` com a URL do backend
   - Verificar que firewall não bloqueia porta 8000
   - Testar conexão usando health check
   - Resolver problemas comuns (CORS, timeout, refused connection)

3. WHERE exemplos de configuração são necessários, THE Guide SHALL incluir para Windows, macOS e Linux
4. THE Guide SHALL documentar como usar Settings Page para alterar backend em tempo real

---

### Requirement 8: CORS Configuration Requirements

**User Story:** Como desenvolvedor do backend, quero entender e configurar CORS corretamente, para que o frontend possa fazer requisições cross-origin.

#### Acceptance Criteria

1. WHEN uma requisição vem do frontend, THE Backend SHALL enviar header `Access-Control-Allow-Origin` com o valor da origem do frontend
2. WHERE a origem do frontend é `http://localhost:5173` (dev) ou `http://192.168.x.x:5173` (rede), THE Backend SHALL aceitar essas origens
3. THE Backend SHALL suportar os métodos HTTP: `GET, POST, PUT, DELETE, OPTIONS`
4. WHEN uma requisição OPTIONS (preflight) é feita, THE Backend SHALL responder com os headers CORS apropriados

#### Acceptance Criteria - Credentials

1. WHERE a requisição inclui cookies ou headers de autenticação, THE Backend SHALL incluir header `Access-Control-Allow-Credentials: true`
2. WHEN um token JWT é enviado no header `Authorization`, THE Backend SHALL aceitar e validar

---

### Requirement 9: Testes de Conectividade Automatizados

**User Story:** Como desenvolvedor, quero suite de testes que valide automaticamente que o frontend consegue se conectar ao backend.

#### Acceptance Criteria

1. THE Project SHALL incluir ficheiro de testes `src/tests/backend-connectivity.test.ts`
2. WHERE testes incluem verificação de:
   - Health check retorna `HTTP 200`
   - Autenticação (login com credenciais válidas)
   - Leitura de dados (GET endpoints)
   - Escrita de dados (POST endpoints)
   - Tratamento de erro (4xx, 5xx responses)
   - Timeout handling

3. WHEN os testes executam, THE Test Suite SHALL fornecer relatório detalhado com status de cada endpoint
4. WHERE testes falham, THE Report SHALL incluir mensagem de erro específica para debugging

---

### Requirement 10: Sincronização de Múltiplas Abas/Janelas do Navegador

**User Story:** Como utilizador, quero que quando altero a configuração do backend numa aba, outras abas abertas do navegador também sejam atualizadas automaticamente.

#### Acceptance Criteria

1. WHEN a configuração do backend é alterada, THE Frontend SHALL disparar evento `backendConfigChanged` no contexto global
2. WHERE múltiplas abas estão abertas, THE Evento SHALL se propagar entre abas via `localStorage` listener
3. WHEN outra aba detecta a mudança, THE Frontend SHALL atualizar sua configuração interna sem recarregar

---

## Acceptance Criteria Patterns for Testing

### 1. Invariants (Properties that remain constant)

- `configManager.getApiUrl()` sempre termina com `/api`
- `configManager.getConfig()` sempre retorna `{protocol, host, port, baseUrl, apiUrl}`
- Token armazenado em localStorage tem sempre formato de JWT válido (header.payload.signature)

### 2. Round Trip Properties

- `setBackendUrl()` seguido por `getConfig()` retorna os mesmos valores
- `localStorage.setItem()` seguido por `localStorage.getItem()` retorna mesmo JSON serializado
- Health check feito 2x seguidas retorna resposta idêntica (idempotência)

### 3. Idempotence

- Executar `setBackendUrl()` múltiplas vezes com mesmos parâmetros resulta em estado final idêntico
- Marcar notificação como "lida" múltiplas vezes não altera estado final

### 4. Metamorphic Properties

- `validateUrl(url1)` válida, `validateUrl(url2)` válida → ambas devem ter comprimento razoável
- Se endpoint A retorna `HTTP 200`, endpoints do mesmo serviço provavelmente também retornarão sucesso (com alta probabilidade)

### 5. Error Conditions

- Testar URLs inválidas: vazias, sem protocolo, com portas inválidas, caracteres especiais
- Testar respostas de erro: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- Testar timeouts: requisições que não recebem resposta dentro de 5 segundos

---

## Non-Functional Requirements

### Performance

- Health check deve completar em menos de 2 segundos
- Mudança de configuração deve ser refletida em requisições subsequentes em menos de 100ms
- Page Settings deve carregar em menos de 1 segundo

### Availability

- Frontend deve funcionar offline com cache de dados (graceful degradation)
- Se backend está indisponível, aplicação deve funcionar com dados em cache (read-only mode)

### Maintainability

- Código de configuração deve estar centralizado em `backendConfig`
- Mensagens de erro devem ser claras e sugerir soluções

### Security

- Tokens não devem ser exibidos em logs ou console (masked)
- URLs do backend não devem incluir credenciais
- localStorage deve usar chave específica para evitar conflitos com outras aplicações

---

## Glossary References

- **System**: Frontend Txopela Tour (React app)
- **Backend**: API Django em rede local
- **User**: Desenvolvedor ou utilizador final
- **Frontend**: Aplicação cliente (React + TypeScript + Vite)
- **Configuração**: Definições de URL, protocolo, host, port do backend
- **Conectividade**: Capacidade de fazer requisições HTTP ao backend
- **Autenticação**: Sistema de login com JWT tokens
- **Token Refresh**: Renovação automática de access token
- **Health Check**: Verificação de status do backend
- **CORS**: Política de segurança entre domínios
- **localStorage**: Armazenamento persistente no navegador
