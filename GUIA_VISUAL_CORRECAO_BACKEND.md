# 🎯 GUIA VISUAL: Correção do Backend Passo-a-Passo

Este guia mostra exatamente onde fazer cada mudança.

---

## 📍 PASSO 1: Corrigir LocalViewSet.create()

### Localização: `apps/locals/views.py`

**PROCURAR POR:**
```python
class LocalViewSet(viewsets.ModelViewSet):
    # ...
    
    def create(self, request, *args, **kwargs):
```

**ANTES (Incorreto):**
```python
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()  # ❌ NÃO associa ao utilizador
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)
```

**DEPOIS (Correto):**
```python
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # ✅ ASSOCIAR AO UTILIZADOR AUTENTICADO
    local = serializer.save(owner=request.user, status='pending')
    
    # Log opcional
    print(f"[LOCAL CRIADO] ID: {local.id}, Owner: {request.user.id}")
    
    return Response(
        {
            'success': True,
            'local': serializer.data,
            'message': 'Local enviado para aprovação'
        },
        status=status.HTTP_201_CREATED
    )
```

**O QUE MUDOU:**
- ✅ Linha adicionada: `serializer.save(owner=request.user, status='pending')`
- ✅ Resposta melhorada com mensagem de sucesso

---

## 📍 PASSO 2: Corrigir ServiceViewSet.create()

### Localização: `apps/services/views.py`

**PROCURAR POR:**
```python
class ServiceViewSet(viewsets.ModelViewSet):
    # ...
    
    def create(self, request, *args, **kwargs):
```

**ANTES (Incorreto):**
```python
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()  # ❌ NÃO associa ao utilizador
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)
```

**DEPOIS (Correto):**
```python
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # ✅ ASSOCIAR AO UTILIZADOR AUTENTICADO
    service = serializer.save(provider=request.user, status='pending')
    
    # Log opcional
    print(f"[SERVIÇO CRIADO] ID: {service.id}, Provider: {request.user.id}")
    
    return Response(
        {
            'success': True,
            'service': serializer.data,
            'message': 'Serviço enviado para aprovação'
        },
        status=status.HTTP_201_CREATED
    )
```

**O QUE MUDOU:**
- ✅ Linha adicionada: `serializer.save(provider=request.user, status='pending')`
- ⚠️ **NOTA:** Se o modelo usa `owner` em vez de `provider`, usar `owner=request.user`

---

## 📍 PASSO 3: Corrigir PostViewSet.create()

### Localização: `apps/posts/views.py`

**PROCURAR POR:**
```python
class PostViewSet(viewsets.ModelViewSet):
    # ...
    
    def create(self, request, *args, **kwargs):
```

**ANTES (Incorreto):**
```python
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()  # ❌ NÃO associa ao utilizador
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)
```

**DEPOIS (Correto):**
```python
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # ✅ ASSOCIAR AO UTILIZADOR AUTENTICADO
    post = serializer.save(author=request.user)
    
    # Log opcional
    print(f"[POST CRIADO] ID: {post.id}, Author: {request.user.id}")
    
    return Response(
        {
            'success': True,
            'post': serializer.data
        },
        status=status.HTTP_201_CREATED
    )
```

**O QUE MUDOU:**
- ✅ Linha adicionada: `serializer.save(author=request.user)`

---

## 📍 PASSO 4: Adicionar Views de Listagem do Utilizador

### Localização: `apps/users/views.py`

**PROCURAR POR:** Final do arquivo (última linha)

**ADICIONAR NO FINAL:**
```python
# ============================================
# VIEWS DE PUBLICAÇÕES DO UTILIZADOR
# Adicionado em: 29/06/2026
# ============================================

from apps.locals.models import Local
from apps.locals.serializers import LocalSerializer
from apps.services.models import Service
from apps.services.serializers import ServiceSerializer
from apps.posts.models import Post
from apps.posts.serializers import PostSerializer


class UserLocalsView(generics.ListAPIView):
    """
    GET /api/users/me/locals/
    Lista todos os locais criados pelo utilizador autenticado.
    """
    serializer_class = LocalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Local.objects.filter(
            owner=self.request.user
        ).select_related('owner').order_by('-created_at')


class UserServicesView(generics.ListAPIView):
    """
    GET /api/users/me/services/
    Lista todos os serviços criados pelo utilizador autenticado.
    """
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Service.objects.filter(
            provider=self.request.user
        ).select_related('provider').order_by('-created_at')


class UserPostsView(generics.ListAPIView):
    """
    GET /api/users/me/posts/
    Lista todos os posts criados pelo utilizador autenticado.
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Post.objects.filter(
            author=self.request.user
        ).select_related('author').order_by('-created_at')
```

**O QUE FOI ADICIONADO:**
- ✅ 3 novas classes: `UserLocalsView`, `UserServicesView`, `UserPostsView`
- ✅ Cada uma filtra apenas publicações do utilizador autenticado
- ✅ Todas exigem autenticação (`IsAuthenticated`)

---

## 📍 PASSO 5: Adicionar Rotas

### Localização: `apps/users/urls.py`

**PROCURAR POR:**
```python
from .views import (
    # ... views existentes
)
```

**ADICIONAR aos imports:**
```python
from .views import (
    # ... views existentes
    UserLocalsView,      # ← ADICIONAR
    UserServicesView,    # ← ADICIONAR
    UserPostsView,       # ← ADICIONAR
)
```

**PROCURAR POR:**
```python
urlpatterns = [
    # ... rotas existentes
]
```

**ADICIONAR às rotas:**
```python
urlpatterns = [
    # ... rotas existentes
    
    # Publicações do utilizador (adicionado 29/06/2026)
    path('me/locals/', UserLocalsView.as_view(), name='user-locals'),
    path('me/services/', UserServicesView.as_view(), name='user-services'),
    path('me/posts/', UserPostsView.as_view(), name='user-posts'),
]
```

**O QUE FOI ADICIONADO:**
- ✅ 3 imports: `UserLocalsView`, `UserServicesView`, `UserPostsView`
- ✅ 3 rotas: `/users/me/locals/`, `/users/me/services/`, `/users/me/posts/`

---

## 📍 PASSO 6: Corrigir Stats no Perfil

### Localização: `apps/users/serializers.py`

**PROCURAR POR:**
```python
class UserProfileSerializer(serializers.ModelSerializer):
```

**ANTES (Incorreto):**
```python
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'stats', ...]  # ❌ stats como campo normal
```

**DEPOIS (Correto):**
```python
class UserProfileSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()  # ✅ Campo dinâmico
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'stats', ...]
    
    def get_stats(self, obj):
        """Calcula stats dinamicamente da base de dados."""
        from apps.locals.models import Local
        from apps.services.models import Service
        from apps.posts.models import Post
        
        return {
            'postsCount': Post.objects.filter(author=obj).count(),
            'localsCount': Local.objects.filter(owner=obj).count(),
            'servicesCount': Service.objects.filter(provider=obj).count(),
            'followersCount': obj.followers.count() if hasattr(obj, 'followers') else 0,
            'followingCount': obj.following.count() if hasattr(obj, 'following') else 0,
        }
```

**O QUE MUDOU:**
- ✅ Adicionado: `stats = serializers.SerializerMethodField()`
- ✅ Adicionado: método `get_stats(self, obj)`
- ✅ Stats agora calculados dinamicamente (sempre corretos!)

---

## 🧪 PASSO 7: TESTAR

### Teste Visual no Navegador:

#### 1. Criar Publicação:
```
1. Login na aplicação
2. Ir para "Sugerir Local" (ou Serviço)
3. Preencher formulário
4. Submeter
5. ✅ Verificar: mensagem de sucesso
```

#### 2. Ver no Perfil:
```
1. Ir para "Perfil"
2. Abrir "Minhas Publicações"
3. ✅ Verificar: publicação criada aparece
4. ✅ Verificar: contador aumentou
```

#### 3. Verificar Separação:
```
1. Logout
2. Login com outro utilizador
3. Ir para "Perfil"
4. ✅ Verificar: NÃO aparece publicação do utilizador anterior
```

### Teste via cURL (Terminal):

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' \
  | jq -r '.token')

# 2. Criar Local
curl -X POST http://localhost:8000/api/locals/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Local Teste" \
  -F "description=Teste"

# 3. Listar Meus Locais
curl http://localhost:8000/api/users/me/locals/ \
  -H "Authorization: Bearer $TOKEN"

# 4. Ver Perfil
curl http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.stats'
```

---

## ✅ CHECKLIST FINAL

Após fazer todas as mudanças:

- [ ] ✅ `apps/locals/views.py` → `create()` corrigido
- [ ] ✅ `apps/services/views.py` → `create()` corrigido
- [ ] ✅ `apps/posts/views.py` → `create()` corrigido
- [ ] ✅ `apps/users/views.py` → 3 views adicionadas
- [ ] ✅ `apps/users/urls.py` → 3 rotas adicionadas
- [ ] ✅ `apps/users/serializers.py` → `get_stats()` adicionado
- [ ] ✅ Testes executados e passaram

---

## 🎯 RESULTADO VISUAL ESPERADO

### ANTES DA CORREÇÃO:
```
Perfil do Utilizador
├─ Minhas Publicações
│  └─ ❌ Vazio (nada aparece)
└─ Stats
   └─ Locais: 0  ← ❌ Não atualiza
```

### DEPOIS DA CORREÇÃO:
```
Perfil do Utilizador
├─ Minhas Publicações
│  ├─ ✅ Local 1 (criado por mim)
│  ├─ ✅ Serviço 1 (criado por mim)
│  └─ ✅ Post 1 (criado por mim)
└─ Stats
   ├─ Locais: 1      ← ✅ Correto!
   ├─ Serviços: 1    ← ✅ Correto!
   └─ Posts: 1       ← ✅ Correto!
```

---

## 📞 PROBLEMAS COMUNS

### Erro: "Local() got an unexpected keyword argument 'owner'"
**Causa:** Campo `owner` não existe no modelo `Local`  
**Solução:** Verificar nome correto do campo no modelo (pode ser `created_by`)

### Erro: "Cannot import name 'LocalSerializer'"
**Causa:** Import incorreto ou serializer não existe  
**Solução:** Verificar caminho correto: `from apps.locals.serializers import LocalSerializer`

### Erro: "relation 'locals' does not exist"
**Causa:** Migração não executada  
**Solução:** 
```bash
python manage.py makemigrations
python manage.py migrate
```

### Publicações antigas sem owner
**Solução:** Executar script de migração de dados (ver `CORRECAO_BACKEND_PUBLICACOES.md`)

---

**Data:** 29 de Junho de 2026  
**Tempo Total:** ~1 hora  
**Dificuldade:** Média  
**Impacto:** 🔴 CRÍTICO

**BOA SORTE! 🚀**
