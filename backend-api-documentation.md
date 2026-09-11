# API Backend - Documentação dos Endpoints Necessários

**Projeto:** Txopela Tour MVP  
**Baseado na análise do frontend existente**

---

## ACESSO RÁPIDO - CREDENCIAIS DE TESTE

| Tipo de Conta | Email | Senha | Finalidade |
|---------------|-------|--------|------------|
| 🏢 **Provedor de Serviços** | `servico@gmail.com` | `S123456` | Testar funcionalidades de serviços turísticos |
| 🏪 **Negociante/Empresa** | `negociantenormal@gmail.com` | `N123456` | Testar gestão de locais e estabelecimentos |
| 🧳 **Turista** | `turista@gmail.com` | `T123456` | Testar experiência do visitante |

---

## ÍNDICE

1. [Autenticação e Usuários](#1-autenticação-e-usuários)
2. [Posts e Descobertas](#2-posts-e-descobertas) 
3. [Locais e Descobertas](#3-locais-e-descobertas)
4. [Serviços](#4-serviços)
5. [Busca Inteligente](#5-busca-inteligente)
6. [Upload de Arquivos](#6-upload-de-arquivos)
7. [Notificações](#7-notificações)
8. [Administração](#8-administração)
9. [Sistema de Módulos Culturais](#9-sistema-de-módulos-culturais)

---

## 1. AUTENTICAÇÃO E USUÁRIOS

### 1.0 Contas de Demonstração

Para testes da API, utilize as seguintes credenciais:

| Tipo de Usuário | Email | Senha | Role na API | Type Frontend | Funcionalidade |
|------------------|-------|--------|-------------|---------------|----------------|
| **Provedor de Serviços** | servico@gmail.com | S123456 | `guide` | `guide` | Mostra "Sugerir Serviço" |
| **Negociante/Empresa** | negociantenormal@gmail.com | N123456 | `business` | `business` | Mostra "Sugerir Serviço" |
| **Turista/Viajante** | turista@gmail.com | T123456 | `tourist` | `traveler` | Mostra "Sugerir Local" |

**⚠️ IMPORTANTE:** A API deve retornar o `role` correto no endpoint `/api/auth/login` para que o frontend exiba as opções adequadas:

```sql
-- Configuração necessária no banco de dados:
UPDATE users SET role = 'guide' WHERE email = 'servico@gmail.com';
UPDATE users SET role = 'business' WHERE email = 'negociantenormal@gmail.com';  
UPDATE users SET role = 'tourist' WHERE email = 'turista@gmail.com';
```

---

## RESOLUÇÃO DO PROBLEMA: "Sugerir Local" vs "Sugerir Serviço"

### 🐛 **Problema Relatado:**
> "Não está mudando de 'Sugerir Local' para 'Sugerir Serviço' ao usar `servico@gmail.com`"

### 🔍 **Diagnóstico:**
O frontend decide qual botão mostrar baseado em `user.type`:
```javascript
// App.tsx linha 427
{(user?.type === 'business' || user?.type === 'guide') 
  ? <AddService /> 
  : <AddLocal />}
```

### ✅ **Soluções:**

#### **1. Verificar o Role na API**
Confirme que `/api/auth/login` retorna o `role` correto:
```bash
curl -X POST https://api-txopela-tour-3tdq.onrender.com/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "servico@gmail.com", "password": "S123456"}'
```

**Resposta esperada:**
```json
{
  "user": {
    "role": "guide"  // ← Deve ser "guide" ou "business"
  }
}
```

#### **2. Configurar Contas no Banco**
```sql
-- Para servico@gmail.com mostrar "Sugerir Serviço"
UPDATE users SET role = 'guide' WHERE email = 'servico@gmail.com';

-- Para negociantenormal@gmail.com mostrar "Sugerir Serviço"  
UPDATE users SET role = 'business' WHERE email = 'negociantenormal@gmail.com';
```

#### **3. Testar o Mapeamento**
O AuthContext mapeia os roles assim:
```javascript
function mapRole(role: string): 'traveler' | 'guide' | 'business' {
  if (role === 'guide' || role === 'curator') return 'guide';      // → Sugerir Serviço
  if (role === 'business' || role === 'admin') return 'business';  // → Sugerir Serviço  
  return 'traveler';                                               // → Sugerir Local
}
```

### 1.1 Registro e Login

#### Tipos de Usuário e Permissões

| Tipo | Role API | Descrição | Permissões Especiais |
|------|----------|-----------|----------------------|
| **Tourist** | `tourist` | Usuário padrão, viajantes e exploradores | • Criar posts de descobertas<br>• Avaliar locais e serviços<br>• Fazer reservas<br>• Seguir outros usuários |
| **Guide** | `guide` | Guias turísticos profissionais | • Todas as permissões de Tourist<br>• Criar e gerir serviços de guia<br>• Receber reservas<br>• Status verificado |
| **Business** | `business` | Empresas, hotéis, restaurantes, lojas | • Todas as permissões de Tourist<br>• Criar e gerir locais comerciais<br>• Criar e gerir serviços<br>• Receber reservas<br>• Dashboard de negócio |
| **Admin** | `admin` | Administradores da plataforma | • Todas as permissões<br>• Aprovar/rejeitar conteúdo<br>• Gerir usuários<br>• Acesso a analytics |

```http
POST /api/auth/register
```
**Descrição:** Registro de novos usuários

**Request Body:**
```json
{
  "name": "string (obrigatório)",
  "email": "string (obrigatório, único)",
  "password": "string (obrigatório, min 8 caracteres)",
  "role": "tourist|guide|business (opcional, default: tourist)",
  "phone": "string (opcional)",
  "dateOfBirth": "string (ISO date, opcional)",
  "termsAccepted": "boolean (obrigatório, deve ser true)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "tourist|guide|business",
    "avatar": "string (url)",
    "emailVerified": false,
    "createdAt": "string (ISO date)"
  },
  "token": "string (JWT)",
  "refreshToken": "string"
}
```
---

```http
POST /api/auth/login
```
**Descrição:** Login de usuários existentes

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Exemplos de Teste:**
```json
// Provedor de Serviços
{
  "email": "servico@gmail.com",
  "password": "S123456"
}

// Negociante/Empresa
{
  "email": "negociantenormal@gmail.com", 
  "password": "N123456"
}

// Turista (assumindo que existe)
{
  "email": "turista@gmail.com",
  "password": "T123456"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string", 
    "email": "string",
    "role": "tourist|guide|business|admin",
    "avatar": "string (url)",
    "emailVerified": true,
    "stats": {
      "postsCount": 0,
      "followersCount": 0,
      "followingCount": 0,
      "servicesCount": 0,
      "localsCount": 0
    }
  },
  "token": "string (JWT)",
  "refreshToken": "string"
}
```

**Mapeamento de Roles para o Frontend:**
```javascript
// Para as contas de teste específicas:
servico@gmail.com          → role: "guide"    → frontend type: "guide"    → Mostra "Sugerir Serviço"
negociantenormal@gmail.com → role: "business" → frontend type: "business" → Mostra "Sugerir Serviço" 
turista@gmail.com          → role: "tourist"  → frontend type: "traveler" → Mostra "Sugerir Local"
```

---

```http
POST /api/auth/oauth/google
```
**Descrição:** Login via Google OAuth

**Request Body:**
```json
{
  "code": "string (authorization code)",
  "redirectUri": "string"
}
```

**Response:** Igual ao login normal

---

```http
POST /api/auth/oauth/facebook
```
**Descrição:** Login via Facebook OAuth

**Request Body:**
```json
{
  "accessToken": "string"
}
```
---

```http
POST /api/auth/forgot-password
```
**Descrição:** Envio de email para recuperação de senha

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email de recuperação enviado"
}
```

---

```http
POST /api/auth/reset-password
```
**Descrição:** Reset de senha com token

**Request Body:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

---

```http
POST /api/auth/verify-email
```
**Descrição:** Verificação de email

**Request Body:**
```json
{
  "token": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verificado com sucesso"
}
```
---

```http
POST /api/auth/refresh
```
**Descrição:** Renovação de token de acesso

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "string (novo JWT)",
  "refreshToken": "string (novo refresh token)"
}
```

---

```http
POST /api/auth/logout
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

### 1.2 Perfil do Usuário

```http
GET /api/users/me
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "dateOfBirth": "string",
    "role": "tourist|guide|business|admin",
    "avatar": "string",
    "bio": "string",
    "emailVerified": true,
    "createdAt": "string (ISO date)",
    "stats": {
      "postsCount": 0,
      "followersCount": 0,
      "followingCount": 0,
      "servicesCount": 0,
      "localsCount": 0
    }
  }
}
```
---

```http
PUT /api/users/me
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "string (opcional)",
  "phone": "string (opcional)",
  "dateOfBirth": "string (opcional)",
  "bio": "string (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "user": "// objeto user atualizado"
}
```

---

```http
POST /api/users/upload-avatar
```
**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

**Request Body:**
```
file: File (imagem)
```

**Response:**
```json
{
  "success": true,
  "avatarUrl": "string (URL da imagem)"
}
```

---

```http
GET /api/users/{userId}
```
**Descrição:** Perfil público de usuário

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "avatar": "string",
    "bio": "string",
    "joinedAt": "string",
    "stats": {
      "postsCount": 0,
      "followersCount": 0,
      "followingCount": 0,
      "servicesCount": 0,
      "localsCount": 0
    },
    "isFollowing": false
  }
}
```
### 1.3 Seguir/Deixar de Seguir

```http
POST /api/users/{userId}/follow
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "isFollowing": true
}
```

---

```http
DELETE /api/users/{userId}/follow
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "isFollowing": false
}
```

---

## 2. POSTS E DESCOBERTAS

### 2.1 Listagem e Busca

```http
GET /api/posts
```
**Query Params:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 50)
- `province`: string (opcional)
- `category`: string (opcional)
- `search`: string (opcional)
- `sortBy`: 'recent' | 'popular' | 'trending' (default: 'recent')
- `userId`: string (posts de um usuário específico)

**Response:**
```json
{
  "success": true,
  "posts": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "images": ["string (URLs)"],
      "category": "string",
      "province": "string",
      "location": {
        "latitude": "number",
        "longitude": "number",
        "address": "string"
      },
      "author": {
        "id": "string",
        "name": "string",
        "avatar": "string"
      },
      "stats": {
        "likesCount": 0,
        "commentsCount": 0,
        "sharesCount": 0,
        "viewsCount": 0
      },
      "userInteraction": {
        "hasLiked": false,
        "hasSaved": false
      },
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 200,
    "hasNext": true,
    "hasPrev": false
  }
}
```
---

```http
GET /api/posts/{postId}
```
**Descrição:** Detalhes de um post específico

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "string",
    "title": "string",
    "content": "string",
    "images": ["string"],
    "category": "string",
    "province": "string",
    "location": {
      "latitude": "number",
      "longitude": "number",
      "address": "string"
    },
    "author": {
      "id": "string",
      "name": "string",
      "avatar": "string",
      "isFollowing": false
    },
    "stats": {
      "likesCount": 0,
      "commentsCount": 0,
      "sharesCount": 0,
      "viewsCount": 0
    },
    "userInteraction": {
      "hasLiked": false,
      "hasSaved": false
    },
    "tags": ["string"],
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 2.2 Criação e Edição de Posts

```http
POST /api/posts
```
**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

**Request Body:**
```
title: string
content: string
category: string
province: string
location: JSON string {latitude, longitude, address}
tags: JSON array of strings
images: File[] (máximo 10 imagens)
```

**Response:**
```json
{
  "success": true,
  "post": "// objeto post criado"
}
```
---

```http
PUT /api/posts/{postId}
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:** Igual ao POST, mas apenas campos que serão atualizados

**Response:**
```json
{
  "success": true,
  "post": "// objeto post atualizado"
}
```

---

```http
DELETE /api/posts/{postId}
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "message": "Post deletado com sucesso"
}
```

### 2.3 Interações com Posts

```http
POST /api/posts/{postId}/like
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "hasLiked": true,
  "likesCount": 15
}
```

---

```http
DELETE /api/posts/{postId}/like
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "hasLiked": false,
  "likesCount": 14
}
```

---

```http
POST /api/posts/{postId}/save
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "hasSaved": true
}
```
---

```http
DELETE /api/posts/{postId}/save
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "hasSaved": false
}
```

---

```http
POST /api/posts/{postId}/report
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "reason": "spam|inappropriate|fake|copyright|other",
  "details": "string (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Denúncia enviada com sucesso"
}
```

### 2.4 Comentários

```http
GET /api/posts/{postId}/comments
```
**Query Params:**
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response:**
```json
{
  "success": true,
  "comments": [
    {
      "id": "string",
      "content": "string",
      "author": {
        "id": "string",
        "name": "string",
        "avatar": "string"
      },
      "likesCount": 0,
      "hasLiked": false,
      "createdAt": "string",
      "replies": [
        {
          "id": "string",
          "content": "string",
          "author": {
            "id": "string",
            "name": "string",
            "avatar": "string"
          },
          "likesCount": 0,
          "hasLiked": false,
          "createdAt": "string"
        }
      ]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```
---

```http
POST /api/posts/{postId}/comments
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "content": "string",
  "parentId": "string (opcional, para replies)"
}
```

**Response:**
```json
{
  "success": true,
  "comment": "// objeto comment criado"
}
```

---

```http
POST /api/comments/{commentId}/like
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "hasLiked": true,
  "likesCount": 5
}
```

---

## 3. LOCAIS E DESCOBERTAS

### 3.1 Listagem de Locais

```http
GET /api/locals
```
**Query Params:**
- `page`: number
- `limit`: number
- `province`: string
- `category`: string
- `search`: string
- `latitude`: number (para busca por proximidade)
- `longitude`: number
- `radius`: number (em km)
- `sortBy`: 'recent' | 'popular' | 'distance' | 'rating'

**Response:**
```json
{
  "success": true,
  "locals": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "restaurant|hotel|attraction|shop|service",
      "subcategory": "string",
      "images": ["string"],
      "location": {
        "latitude": "number",
        "longitude": "number",
        "address": "string",
        "province": "string",
        "municipality": "string"
      },
      "contact": {
        "phone": "string",
        "email": "string",
        "website": "string",
        "whatsapp": "string"
      },
      "hours": {
        "monday": {"open": "09:00", "close": "18:00"},
        "tuesday": {"open": "09:00", "close": "18:00"},
        "wednesday": {"open": "09:00", "close": "18:00"},
        "thursday": {"open": "09:00", "close": "18:00"},
        "friday": {"open": "09:00", "close": "18:00"},
        "saturday": {"open": "09:00", "close": "18:00"},
        "sunday": null
      },
      "rating": {
        "average": 4.5,
        "count": 127
      },
      "priceRange": "$|$$|$$$|$$$$",
      "amenities": ["wifi", "parking", "accessible", "cards"],
      "owner": {
        "id": "string",
        "name": "string",
        "avatar": "string"
      },
      "status": "pending|approved|rejected",
      "createdAt": "string",
      "distance": "number (em km, apenas quando busca por proximidade)"
    }
  ],
  "pagination": {"..."}
}
```
---

```http
GET /api/locals/{localId}
```
**Descrição:** Detalhes completos de um local

**Response:**
```json
{
  "success": true,
  "local": {
    "// todos os campos da listagem",
    "reviews": [
      {
        "id": "string",
        "rating": 5,
        "comment": "string",
        "author": {
          "id": "string",
          "name": "string",
          "avatar": "string"
        },
        "createdAt": "string",
        "helpful": 3
      }
    ],
    "relatedLocals": [
      "// array de locais similares (versão resumida)"
    ]
  }
}
```

### 3.2 Criação e Gestão de Locais

```http
POST /api/locals
```
**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

**Request Body:**
```
name: string
description: string
category: string
subcategory: string (opcional)
location: JSON string {latitude, longitude, address, province, municipality}
contact: JSON string {phone, email, website, whatsapp}
hours: JSON string (objeto com horários)
priceRange: string
amenities: JSON array of strings
images: File[] (máximo 20 imagens)
```

**Response:**
```json
{
  "success": true,
  "local": "// objeto local criado",
  "message": "Local enviado para aprovação"
}
```
---

```http
PUT /api/locals/{localId}
```
**Headers:** `Authorization: Bearer {token}`
**Descrição:** Apenas o dono ou admin pode editar

**Request Body:** Igual ao POST

**Response:**
```json
{
  "success": true,
  "local": "// objeto local atualizado"
}
```

---

```http
DELETE /api/locals/{localId}
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "message": "Local deletado com sucesso"
}
```

### 3.3 Avaliações de Locais

```http
POST /api/locals/{localId}/reviews
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "rating": "number (1-5)",
  "comment": "string",
  "images": ["string (URLs, opcional)"]
}
```

**Response:**
```json
{
  "success": true,
  "review": "// objeto review criado"
}
```

---

```http
POST /api/reviews/{reviewId}/helpful
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "helpfulCount": 4
}
```

---

## 4. SERVIÇOS

### 4.1 Listagem de Serviços

```http
GET /api/services
```
**Query Params:** Similares aos locais + `availability` (boolean)

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "transport|guide|accommodation|experience|equipment",
      "subcategory": "string",
      "images": ["string"],
      "provider": {
        "id": "string",
        "name": "string",
        "avatar": "string",
        "rating": 4.8,
        "reviewsCount": 45
      },
      "pricing": {
        "type": "fixed|hourly|daily|per_person|negotiable",
        "amount": "number",
        "currency": "AOA",
        "details": "string"
      },
      "location": {
        "province": "string",
        "municipality": "string",
        "serviceArea": "string"
      },
      "availability": {
        "isAvailable": true,
        "schedule": "string",
        "advanceBooking": "number (dias)"
      },
      "features": ["string"],
      "requirements": ["string"],
      "rating": {
        "average": 4.5,
        "count": 23
      },
      "status": "pending|approved|rejected",
      "createdAt": "string"
    }
  ],
  "pagination": {"..."}
}
```
### 4.2 Reservas de Serviços

```http
POST /api/services/{serviceId}/bookings
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "startDate": "string (ISO date)",
  "endDate": "string (ISO date, opcional)",
  "participants": "number",
  "message": "string (opcional)",
  "contactInfo": {
    "phone": "string",
    "email": "string"
  },
  "specialRequests": "string (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "string",
    "serviceId": "string",
    "service": {
      "id": "string",
      "title": "string",
      "images": ["string"]
    },
    "customer": {
      "id": "string",
      "name": "string"
    },
    "provider": {
      "id": "string",
      "name": "string"
    },
    "startDate": "string",
    "endDate": "string",
    "participants": "number",
    "message": "string",
    "status": "pending|confirmed|cancelled|completed",
    "totalAmount": "number",
    "createdAt": "string"
  }
}
```

---

```http
GET /api/bookings
```
**Headers:** `Authorization: Bearer {token}`
**Descrição:** Lista reservas do usuário (como cliente ou provedor)

**Query Params:**
- `role`: 'customer' | 'provider' (default: ambos)
- `status`: 'pending' | 'confirmed' | 'cancelled' | 'completed'
- `page`: number
- `limit`: number

**Response:**
```json
{
  "success": true,
  "bookings": [
    "// array de objetos booking"
  ],
  "pagination": {"..."}
}
```
---

```http
PUT /api/bookings/{bookingId}/status
```
**Headers:** `Authorization: Bearer {token}`
**Descrição:** Atualizar status da reserva (apenas provedor ou cliente)

**Request Body:**
```json
{
  "status": "confirmed|cancelled|completed",
  "reason": "string (obrigatório para cancelamento)"
}
```

**Response:**
```json
{
  "success": true,
  "booking": "// objeto booking atualizado"
}
```

---

## 5. BUSCA INTELIGENTE

### 5.1 Busca Universal

```http
GET /api/search
```
**Query Params:**
- `q`: string (termo de busca)
- `type`: 'all|posts|locals|services|users' (default: 'all')
- `province`: string (opcional)
- `latitude`: number (opcional)
- `longitude`: number (opcional)
- `radius`: number (km, opcional)
- `page`: number
- `limit`: number

**Response:**
```json
{
  "success": true,
  "results": {
    "posts": [
      {
        "id": "string",
        "title": "string",
        "content": "string (trecho)",
        "images": ["string"],
        "author": {"id": "string", "name": "string", "avatar": "string"},
        "stats": {"likesCount": 0, "commentsCount": 0},
        "createdAt": "string",
        "relevance": 0.95
      }
    ],
    "locals": [
      {
        "id": "string",
        "name": "string",
        "description": "string (trecho)",
        "category": "string",
        "images": ["string"],
        "location": {"province": "string", "address": "string"},
        "rating": {"average": 4.5, "count": 127},
        "distance": "number",
        "relevance": 0.88
      }
    ],
    "services": [
      {
        "id": "string",
        "title": "string",
        "description": "string (trecho)",
        "category": "string",
        "provider": {"id": "string", "name": "string", "avatar": "string"},
        "pricing": {"type": "string", "amount": "number", "currency": "string"},
        "rating": {"average": 4.2, "count": 15},
        "relevance": 0.82
      }
    ],
    "users": [
      {
        "id": "string",
        "name": "string",
        "avatar": "string",
        "bio": "string",
        "stats": {"followersCount": 120, "postsCount": 45},
        "isFollowing": false,
        "relevance": 0.75
      }
    ]
  },
  "pagination": {"..."},
  "suggestions": ["string"]
}
```
### 5.2 Sugestões e Autocompletar

```http
GET /api/search/suggestions
```
**Query Params:**
- `q`: string (termo parcial)
- `type`: 'places|categories|tags' (opcional)

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "text": "string",
      "type": "place|category|tag",
      "count": 45,
      "icon": "string"
    }
  ]
}
```

---

## 6. UPLOAD DE ARQUIVOS

### 6.1 Upload de Imagens

```http
POST /api/upload/images
```
**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

**Request Body:**
```
files: File[] (máximo 10 arquivos)
context: string (post|local|service|profile)
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "string",
      "url": "string",
      "thumbnail": "string",
      "filename": "string",
      "size": "number (bytes)",
      "dimensions": {
        "width": 1920,
        "height": 1080
      }
    }
  ]
}
```

### 6.2 Gestão de Imagens

```http
DELETE /api/upload/images/{imageId}
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "message": "Imagem deletada com sucesso"
}
```

---

## 7. NOTIFICAÇÕES

### 7.1 Lista de Notificações

```http
GET /api/notifications
```
**Headers:** `Authorization: Bearer {token}`
**Query Params:**
- `page`: number
- `limit`: number
- `unreadOnly`: boolean

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "string",
      "type": "like|comment|follow|booking|approval",
      "title": "string",
      "message": "string",
      "data": {
        "postId": "string",
        "userId": "string",
        "localId": "string",
        "serviceId": "string"
      },
      "isRead": false,
      "createdAt": "string"
    }
  ],
  "pagination": {"..."},
  "unreadCount": 5
}
```
### 7.2 Marcar como Lida

```http
PUT /api/notifications/{notificationId}/read
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "message": "Notificação marcada como lida"
}
```

### 7.3 Marcar Todas como Lidas

```http
PUT /api/notifications/mark-all-read
```
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "message": "Todas as notificações marcadas como lidas"
}
```

---

## 8. ADMINISTRAÇÃO

### 8.1 Aprovação de Conteúdo

```http
GET /api/admin/pending-approvals
```
**Headers:** `Authorization: Bearer {token}` (role: admin)
**Query Params:**
- `type`: 'locals|services|posts' (opcional)
- `page`: number
- `limit`: number

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "string",
      "type": "local|service|post",
      "title": "string",
      "author": {"id": "string", "name": "string", "avatar": "string"},
      "createdAt": "string",
      "status": "pending",
      "content": "// objeto específico do tipo"
    }
  ],
  "pagination": {"..."}
}
```

---

```http
PUT /api/admin/approvals/{itemId}
```
**Headers:** `Authorization: Bearer {token}` (role: admin)

**Request Body:**
```json
{
  "action": "approve|reject",
  "reason": "string (obrigatório para rejeição)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item aprovado/rejeitado com sucesso"
}
```

### 8.2 Gestão de Usuários

```http
GET /api/admin/users
```
**Headers:** `Authorization: Bearer {token}` (role: admin)
**Query Params:**
- `search`: string
- `role`: 'tourist|guide|business'
- `status`: 'active|suspended|banned'
- `page`: number
- `limit`: number

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "status": "string",
      "stats": {"postsCount": 0, "followersCount": 0},
      "createdAt": "string",
      "lastActive": "string"
    }
  ],
  "pagination": {"..."}
}
```
---

```http
PUT /api/admin/users/{userId}/status
```
**Headers:** `Authorization: Bearer {token}` (role: admin)

**Request Body:**
```json
{
  "status": "active|suspended|banned",
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status do usuário atualizado"
}
```

### 8.3 Relatórios e Analytics

```http
GET /api/admin/stats
```
**Headers:** `Authorization: Bearer {token}` (role: admin)

**Response:**
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 1500,
      "newThisMonth": 85,
      "activeUsers": 720
    },
    "content": {
      "posts": 3200,
      "locals": 890,
      "services": 450,
      "pendingApprovals": 25
    },
    "engagement": {
      "totalLikes": 15600,
      "totalComments": 8900,
      "totalBookings": 680
    }
  }
}
```

---

## 9. SISTEMA DE MÓDULOS CULTURAIS

### 9.1 Lista de Módulos

```http
GET /api/cultural-modules
```
**Query Params:**
- `province`: string (opcional)
- `type`: 'culture|destinations|services|stories' (opcional)

**Response:**
```json
{
  "success": true,
  "modules": [
    {
      "id": "string",
      "type": "culture|destinations|services|stories",
      "province": "string",
      "title": "string",
      "description": "string",
      "content": {
        "// estrutura específica baseada no tipo de módulo"
      },
      "lastUpdated": "string"
    }
  ]
}
```

### 9.2 Detalhes do Módulo

```http
GET /api/cultural-modules/{moduleId}
```

**Response:**
```json
{
  "success": true,
  "module": {
    "id": "string",
    "type": "culture|destinations|services|stories",
    "province": "string",
    "title": "string",
    "description": "string",
    "content": {
      "// conteúdo completo do módulo"
    },
    "lastUpdated": "string",
    "stats": {
      "views": 1250,
      "interactions": 340
    }
  }
}
```
---

## NOTAS IMPORTANTES DE IMPLEMENTAÇÃO

### Autenticação
- Todos os endpoints protegidos requerem `Authorization: Bearer {token}` no header
- Tokens JWT devem ter expiração de 24 horas
- Refresh tokens devem ter expiração de 30 dias
- Implementar rate limiting (100 requests por minuto por IP)

### Validação
- Validar todos os inputs do lado servidor
- Sanitizar dados para prevenir XSS e SQL injection
- Implementar validação de imagens (formato, tamanho, conteúdo)

### Paginação
- Usar paginação consistente em todas as listas
- Limite máximo de 50 itens por página
- Retornar metadados de paginação completos

### Imagens
- Suporte a JPEG, PNG, WebP
- Tamanho máximo: 5MB por imagem
- Gerar thumbnails automaticamente
- Implementar CDN para servir imagens

### Performance
- Implementar cache Redis para endpoints frequentes
- Usar índices apropriados no banco de dados
- Implementar lazy loading para listas grandes

### Segurança
- Hash de senhas com bcrypt (salt rounds: 12)
- Implementar CORS apropriado
- Validar permissões para todas as operações
- Log de atividades sensíveis

### Monitoring
- Implementar logs estruturados
- Monitorar performance dos endpoints
- Alertas para erros críticos
- Métricas de uso da API

### Backup
- Backup diário dos dados
- Retenção de 30 dias
- Testes regulares de restore

---

**NOTA CRÍTICA - CONTAS DE TESTE:**
Para que as contas `servico@gmail.com` e `negociantenormal@gmail.com` mostrem "Sugerir Serviço" no frontend, é ESSENCIAL que a API retorne `role: "guide"` ou `role: "business"` respectivamente. Caso contrário, o frontend sempre mostrará "Sugerir Local".

**Última atualização:** Janeiro 2025  
**Versão da API:** v1  
**Base URL:** `https://api.txopelatour.mz/v1`

Esta documentação cobre todos os endpoints necessários baseados na análise completa do frontend da aplicação Txopela Tour MVP. Cada endpoint foi projetado para suportar as funcionalidades implementadas na interface do usuário.