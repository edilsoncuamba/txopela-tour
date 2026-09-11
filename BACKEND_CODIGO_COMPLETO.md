# 💻 CÓDIGO COMPLETO PARA CORREÇÃO DO BACKEND

Este arquivo contém código completo pronto para copiar e colar.

---

## 📄 ARQUIVO: `apps/users/views.py`

### Adicionar estas classes ao final do arquivo:

```python
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.locals.models import Local
from apps.locals.serializers import LocalSerializer
from apps.services.models import Service
from apps.services.serializers import ServiceSerializer
from apps.posts.models import Post
from apps.posts.serializers import PostSerializer


class UserLocalsView(generics.ListAPIView):
    """
    Lista todos os locais criados pelo utilizador autenticado.
    
    GET /api/users/me/locals/
    
    Query Params:
    - page: número da página (default: 1)
    - limit: itens por página (default: 20, max: 50)
    - status: filtrar por status (pending|approved|rejected)
    """
    serializer_class = LocalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Local.objects.filter(owner=user).select_related('owner')
        
        # Filtro opcional por status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')


class UserServicesView(generics.ListAPIView):
    """
    Lista todos os serviços criados pelo utilizador autenticado.
    
    GET /api/users/me/services/
    
    Query Params:
    - page: número da página (default: 1)
    - limit: itens por página (default: 20, max: 50)
    - status: filtrar por status (pending|approved|rejected)
    """
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Service.objects.filter(provider=user).select_related('provider')
        
        # Filtro opcional por status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')


class UserPostsView(generics.ListAPIView):
    """
    Lista todos os posts criados pelo utilizador autenticado.
    
    GET /api/users/me/posts/
    
    Query Params:
    - page: número da página (default: 1)
    - limit: itens por página (default: 20, max: 50)
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Post.objects.filter(author=user).select_related('author')
        return queryset.order_by('-created_at')


class UserReviewsView(generics.ListAPIView):
    """
    Lista todas as avaliações feitas pelo utilizador autenticado.
    
    GET /api/users/me/reviews/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Importar modelos de review
        from apps.locals.models import LocalReview
        from apps.services.models import ServiceReview
        
        # Buscar reviews de locais
        local_reviews = LocalReview.objects.filter(author=user).select_related('local', 'author')
        
        # Buscar reviews de serviços
        service_reviews = ServiceReview.objects.filter(author=user).select_related('service', 'author')
        
        # Serializar e combinar
        from apps.locals.serializers import LocalReviewSerializer
        from apps.services.serializers import ServiceReviewSerializer
        
        local_data = LocalReviewSerializer(local_reviews, many=True).data
        service_data = ServiceReviewSerializer(service_reviews, many=True).data
        
        return Response({
            'success': True,
            'reviews': {
                'locals': local_data,
                'services': service_data,
                'total': len(local_data) + len(service_data)
            }
        })
```

---

## 📄 ARQUIVO: `apps/users/serializers.py`

### Modificar ou adicionar UserProfileSerializer:

```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.locals.models import Local
from apps.services.models import Service
from apps.posts.models import Post

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para perfil completo do utilizador com stats dinâmicos.
    """
    stats = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'username', 'role', 
            'avatar', 'bio', 'phone', 'dateOfBirth',
            'emailVerified', 'createdAt', 'stats'
        ]
        read_only_fields = ['id', 'email', 'emailVerified', 'createdAt']
    
    def get_stats(self, obj):
        """
        Calcula estatísticas do utilizador de forma dinâmica.
        
        IMPORTANTE: Sempre calculado em tempo real a partir da base de dados.
        Nunca depende de campos estáticos ou contadores manuais.
        """
        # Contar publicações do utilizador
        posts_count = Post.objects.filter(author=obj).count()
        locals_count = Local.objects.filter(owner=obj).count()
        services_count = Service.objects.filter(provider=obj).count()
        
        # Contar seguidores e seguindo
        # (assumindo que existe um modelo Follow ou relacionamento M2M)
        followers_count = obj.followers.count() if hasattr(obj, 'followers') else 0
        following_count = obj.following.count() if hasattr(obj, 'following') else 0
        
        # Contar avaliações feitas
        from apps.locals.models import LocalReview
        from apps.services.models import ServiceReview
        reviews_count = (
            LocalReview.objects.filter(author=obj).count() +
            ServiceReview.objects.filter(author=obj).count()
        )
        
        return {
            'postsCount': posts_count,
            'localsCount': locals_count,
            'servicesCount': services_count,
            'followersCount': followers_count,
            'followingCount': following_count,
            'reviewsCount': reviews_count,
        }


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para atualização de perfil.
    """
    class Meta:
        model = User
        fields = ['name', 'phone', 'dateOfBirth', 'bio']
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
```

---

## 📄 ARQUIVO: `apps/users/urls.py`

### Adicionar estas rotas:

```python
from django.urls import path
from .views import (
    UserLocalsView,
    UserServicesView,
    UserPostsView,
    UserReviewsView,
    # ... outras views existentes
)

urlpatterns = [
    # Rotas existentes...
    
    # Novas rotas para publicações do utilizador
    path('me/locals/', UserLocalsView.as_view(), name='user-locals'),
    path('me/services/', UserServicesView.as_view(), name='user-services'),
    path('me/posts/', UserPostsView.as_view(), name='user-posts'),
    path('me/reviews/', UserReviewsView.as_view(), name='user-reviews'),
]
```

---

## 📄 ARQUIVO: `apps/locals/views.py`

### Modificar método create do LocalViewSet:

```python
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Local
from .serializers import LocalSerializer


class LocalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestão de locais turísticos.
    """
    serializer_class = LocalSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Local.objects.all()
        
        # Feed geral: apenas locais aprovados
        if self.action in ['list', 'retrieve']:
            queryset = queryset.filter(status='approved')
        
        # Filtros opcionais
        province = self.request.query_params.get('province')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        
        if province:
            queryset = queryset.filter(location__province__iexact=province)
        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.select_related('owner').order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Cria um novo local turístico.
        
        IMPORTANTE: Associa automaticamente ao utilizador autenticado.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # ✅ ASSOCIAR AO UTILIZADOR AUTENTICADO
        local = serializer.save(owner=request.user, status='pending')
        
        # Log de criação
        print(f"[LOCAL CRIADO] ID: {local.id}, Owner: {request.user.id}, Status: {local.status}")
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'success': True,
                'local': serializer.data,
                'message': 'Local enviado para aprovação'
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """
        Atualiza um local existente.
        
        VERIFICAÇÃO: Apenas o owner ou admin pode atualizar.
        """
        instance = self.get_object()
        
        # Verificar permissão
        if instance.owner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Sem permissão para editar este local'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'local': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """
        Elimina um local.
        
        VERIFICAÇÃO: Apenas o owner ou admin pode eliminar.
        """
        instance = self.get_object()
        
        # Verificar permissão
        if instance.owner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Sem permissão para eliminar este local'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
        return Response(
            {'success': True, 'message': 'Local eliminado com sucesso'},
            status=status.HTTP_204_NO_CONTENT
        )
```

---

## 📄 ARQUIVO: `apps/services/views.py`

### Modificar método create do ServiceViewSet:

```python
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Service
from .serializers import ServiceSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestão de serviços turísticos.
    """
    serializer_class = ServiceSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Service.objects.all()
        
        # Feed geral: apenas serviços aprovados
        if self.action in ['list', 'retrieve']:
            queryset = queryset.filter(status='approved')
        
        # Filtros opcionais
        category = self.request.query_params.get('category')
        province = self.request.query_params.get('province')
        search = self.request.query_params.get('search')
        
        if category:
            queryset = queryset.filter(category=category)
        if province:
            queryset = queryset.filter(location__province__iexact=province)
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset.select_related('provider').order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Cria um novo serviço turístico.
        
        IMPORTANTE: Associa automaticamente ao utilizador autenticado.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # ✅ ASSOCIAR AO UTILIZADOR AUTENTICADO
        service = serializer.save(provider=request.user, status='pending')
        
        # Log de criação
        print(f"[SERVIÇO CRIADO] ID: {service.id}, Provider: {request.user.id}, Status: {service.status}")
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'success': True,
                'service': serializer.data,
                'message': 'Serviço enviado para aprovação'
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """
        Atualiza um serviço existente.
        
        VERIFICAÇÃO: Apenas o provider ou admin pode atualizar.
        """
        instance = self.get_object()
        
        if instance.provider != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Sem permissão para editar este serviço'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'service': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """
        Elimina um serviço.
        
        VERIFICAÇÃO: Apenas o provider ou admin pode eliminar.
        """
        instance = self.get_object()
        
        if instance.provider != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Sem permissão para eliminar este serviço'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
        return Response(
            {'success': True, 'message': 'Serviço eliminado com sucesso'},
            status=status.HTTP_204_NO_CONTENT
        )
```

---

## 📄 ARQUIVO: `apps/posts/views.py`

### Modificar método create do PostViewSet:

```python
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Post
from .serializers import PostSerializer


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestão de posts/descobertas.
    """
    serializer_class = PostSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Post.objects.all()
        
        # Filtros opcionais
        province = self.request.query_params.get('province')
        category = self.request.query_params.get('category')
        user_id = self.request.query_params.get('userId')
        
        if province:
            queryset = queryset.filter(location__province__iexact=province)
        if category:
            queryset = queryset.filter(category=category)
        if user_id:
            queryset = queryset.filter(author__id=user_id)
        
        return queryset.select_related('author').order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Cria um novo post/descoberta.
        
        IMPORTANTE: Associa automaticamente ao utilizador autenticado.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # ✅ ASSOCIAR AO UTILIZADOR AUTENTICADO
        post = serializer.save(author=request.user)
        
        # Log de criação
        print(f"[POST CRIADO] ID: {post.id}, Author: {request.user.id}")
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'success': True,
                'post': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """
        Atualiza um post existente.
        
        VERIFICAÇÃO: Apenas o author ou admin pode atualizar.
        """
        instance = self.get_object()
        
        if instance.author != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Sem permissão para editar este post'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'post': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """
        Elimina um post.
        
        VERIFICAÇÃO: Apenas o author ou admin pode eliminar.
        """
        instance = self.get_object()
        
        if instance.author != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Sem permissão para eliminar este post'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
        return Response(
            {'success': True, 'message': 'Post eliminado com sucesso'},
            status=status.HTTP_204_NO_CONTENT
        )
```

---

## 🧪 SCRIPT DE TESTE

### Criar arquivo: `test_user_publications.py`

```python
"""
Script para testar associação de publicações ao utilizador.
Executar: python manage.py shell < test_user_publications.py
"""

from django.contrib.auth import get_user_model
from apps.locals.models import Local
from apps.services.models import Service
from apps.posts.models import Post

User = get_user_model()

print("\n" + "="*60)
print("TESTE: Associação de Publicações ao Utilizador")
print("="*60)

# Obter primeiro utilizador
user = User.objects.first()
if not user:
    print("❌ Nenhum utilizador encontrado!")
    exit()

print(f"\n✅ Utilizador: {user.name} (ID: {user.id})")

# Contar publicações
locals_count = Local.objects.filter(owner=user).count()
services_count = Service.objects.filter(provider=user).count()
posts_count = Post.objects.filter(author=user).count()

print(f"\n📊 Estatísticas:")
print(f"  - Locais: {locals_count}")
print(f"  - Serviços: {services_count}")
print(f"  - Posts: {posts_count}")

# Listar publicações recentes
print(f"\n📍 Últimos 5 Locais:")
for local in Local.objects.filter(owner=user).order_by('-created_at')[:5]:
    print(f"  - {local.name} (Status: {local.status})")

print(f"\n🛎️ Últimos 5 Serviços:")
for service in Service.objects.filter(provider=user).order_by('-created_at')[:5]:
    print(f"  - {service.title} (Status: {service.status})")

print(f"\n📝 Últimos 5 Posts:")
for post in Post.objects.filter(author=user).order_by('-created_at')[:5]:
    print(f"  - {post.title}")

print("\n" + "="*60)
print("FIM DO TESTE")
print("="*60 + "\n")
```

---

**Data de Criação:** 29 de Junho de 2026  
**Uso:** Copiar e colar código nos arquivos correspondentes do backend
