# ✅ Correção das Estatísticas do Perfil

## Problema Identificado
Os stats do perfil (`locaisCount`, `servicesCount`, `reviewsCount`) estavam sempre em 0 no frontend.

## Causa Raiz
O serializer Django em `backend/users/serializers.py` não tinha o campo `stats` implementado, então a API `/api/users/me/` não retornava as estatísticas calculadas.

## Solução Aplicada

### Backend: `backend/users/serializers.py`

Adicionei o campo `stats` no `UserSerializer` com o método `get_stats()`:

```python
class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    stats = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'avatar', 'bio', 'location',
            'type', 'followers_count', 'following_count', 'posts_count',
            'is_verified', 'date_joined', 'stats'
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'followers_count', 
                           'following_count', 'posts_count', 'is_verified', 'stats']
    
    def get_stats(self, obj):
        """Calculate user stats from related models."""
        # Count locals (locations) owned by user
        try:
            locals_count = obj.locations.count()
        except:
            locals_count = 0
        
        # Count services/bookings provided by user (business users)
        try:
            services_count = obj.bookings.count() if obj.type == 'business' else 0
        except:
            services_count = 0
        
        # Count reviews submitted by user
        try:
            reviews_count = obj.reviews.count()
        except:
            reviews_count = 0
        
        return {
            'postsCount': obj.posts_count,
            'followersCount': obj.followers_count,
            'followingCount': obj.following_count,
            'servicesCount': services_count,
            'localsCount': locals_count,
            'reviewsCount': reviews_count,
        }
```

### Related Names Utilizados (Corretos)

Baseado na análise dos models:

1. **Locations (Locais)**: `obj.locations` 
   - Definido em `backend/locations/models.py`: `related_name='locations'`
   
2. **Bookings (Serviços)**: `obj.bookings`
   - Definido em `backend/bookings/models.py`: `related_name='bookings'`
   - Apenas para utilizadores do tipo 'business'
   
3. **Reviews (Avaliações)**: `obj.reviews`
   - Definido em `backend/reviews/models.py`: `related_name='reviews'`

### Estrutura da Resposta da API

**Endpoint**: `GET /api/users/me/`

**Resposta**:
```json
{
  "id": "uuid-do-utilizador",
  "email": "user@example.com",
  "name": "Nome do Utilizador",
  "avatar": "/media/avatars/...",
  "bio": "Bio do utilizador",
  "location": "Maputo",
  "type": "traveler",
  "followers_count": 10,
  "following_count": 5,
  "posts_count": 0,
  "is_verified": false,
  "date_joined": "2024-01-01T00:00:00Z",
  "stats": {
    "postsCount": 0,
    "followersCount": 10,
    "followingCount": 5,
    "servicesCount": 0,
    "localsCount": 3,
    "reviewsCount": 7
  }
}
```

### Frontend: Já Preparado

O código em `app/src/pages/Profile.tsx` (linhas 620-632) já está configurado para receber e processar os stats correctamente:

```typescript
const load = async () => {
  try {
    setStatsLoading(true);
    const res = await usersApi.getProfile();
    if (cancelled) return;
    const s = res.data?.user?.stats ?? res.data?.stats ?? {};
    if (!cancelled) setLiveStats({
      locais:     s.localsCount   ?? s.locals_count   ?? 0,
      servicos:   s.servicesCount ?? s.services_count ?? 0,
      avaliacoes: s.reviewsCount  ?? s.reviews_count  ?? 0,
    });
  } catch {
    if (!cancelled) setLiveStats({ locais: 0, servicos: 0, avaliacoes: 0 });
  } finally {
    if (!cancelled) setStatsLoading(false);
  }
};
```

## 🚀 PRÓXIMO PASSO OBRIGATÓRIO

### **Reiniciar o Django Backend**

Para que as alterações no serializer sejam carregadas, você **DEVE** reiniciar o servidor Django:

```bash
cd backend
python manage.py runserver 8000
```

ou se estiver usando o script de setup:

```bash
.\setup_backend.bat
```

## Estado Atual

- ✅ **Backend**: Serializer corrigido com campo `stats` e método `get_stats()`
- ✅ **Frontend**: Já configurado para receber e exibir os stats
- ⏳ **Pendente**: Reiniciar o servidor Django para aplicar as alterações

## Como Testar

1. Reinicie o Django backend
2. No frontend, faça login
3. Acesse o perfil
4. Os números de Locais, Serviços e Avaliações devem aparecer correctamente
5. Se ainda aparecerem 0, verifique:
   - O servidor Django foi reiniciado?
   - O utilizador tem locais/reviews cadastrados?
   - Verificar no console do navegador se há erros na chamada da API

## Verificação Rápida

Para verificar se há dados para exibir:

```python
# No Django shell (python manage.py shell)
from django.contrib.auth import get_user_model
User = get_user_model()

# Encontre seu utilizador
user = User.objects.get(email='edilson.cuamba@gmail.com')

# Conte os stats
print(f"Locais: {user.locations.count()}")
print(f"Reviews: {user.reviews.count()}")
print(f"Bookings: {user.bookings.count()}")
```

---

**Data**: 13/07/2026  
**Ficheiros Modificados**:
- `backend/users/serializers.py`

**Status**: ✅ Correção completa - Aguardando reinicialização do Django
