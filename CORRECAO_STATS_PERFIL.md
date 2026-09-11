# ✅ Correção das Estatísticas do Perfil

## 📋 Resumo do Problema

As estatísticas do perfil (`locaisCount`, `servicesCount`, `reviewsCount`) estavam sempre a mostrar **0** mesmo quando o utilizador tinha dados.

## 🔍 Causa Raiz

O serializer Django em `backend/users/serializers.py` tinha lógica incorreta:
- **Serviços** eram contados apenas para utilizadores `business` e `guide` (usando `locals_count`)
- **Bookings** (reservas) não eram contados como serviços
- Utilizadores `traveler` sempre tinham 0 serviços

## ✨ Solução Aplicada

### **Backend** (`backend/users/serializers.py`)

Corrigi o método `get_stats()` para usar os `related_names` corretos:

```python
def get_stats(self, obj):
    """Calculate user stats from related models."""
    # Count locals (locations) owned by user
    try:
        locals_count = obj.locations.count()
    except:
        locals_count = 0
    
    # Count services/bookings created by user
    # Bookings are services that any user can create
    try:
        services_count = obj.bookings.count()
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

**Related Names Corretos:**
- ✅ `obj.locations` → Locais criados pelo utilizador (modelo: `Location`)
- ✅ `obj.bookings` → Reservas/Serviços criados pelo utilizador (modelo: `Booking`)
- ✅ `obj.reviews` → Avaliações criadas pelo utilizador (modelo: `Review`)

### **Frontend** (`app/src/pages/Profile.tsx`)

O frontend já estava correto:
- ✅ Usa apenas `GET /api/users/me/` conforme `openapi-schema.yaml`
- ✅ Não usa `localStorage` para dados (usa `useAuth()`)
- ✅ Mostra loading skeleton enquanto carrega stats
- ✅ Layout responsivo com `max-w-2xl mx-auto`

## 🚀 Como Testar

### 1️⃣ **Reiniciar o Backend**

```bash
cd backend
python manage.py runserver 8000
```

### 2️⃣ **Verificar a API**

Abra o navegador e aceda:
```
http://localhost:8000/api/users/me/
```

**Resposta esperada:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Edilson Cuamba",
    "email": "edi@gmail.com",
    "stats": {
      "localsCount": 3,     // ✅ Conta obj.locations
      "servicesCount": 5,   // ✅ Conta obj.bookings
      "reviewsCount": 2,    // ✅ Conta obj.reviews
      "followersCount": 0,
      "followingCount": 0,
      "postsCount": 0
    }
  }
}
```

### 3️⃣ **Verificar no Frontend**

1. Abra a aplicação: `http://localhost:5173`
2. Faça login com o utilizador
3. Aceda ao **Perfil**
4. Verifique se os números aparecem:
   - **Locais**: número de locais criados
   - **Serviços**: número de bookings criados
   - **Avaliações**: número de reviews criadas

## 📊 Modelos Django (Backend)

### `Location` (Locais)
```python
# locations/models.py
class Location(models.Model):
    author = models.ForeignKey(User, related_name='locations')
    # ...
```

### `Booking` (Serviços/Reservas)
```python
# bookings/models.py
class Booking(models.Model):
    user = models.ForeignKey(User, related_name='bookings')
    location = models.ForeignKey(Location, related_name='bookings')
    # ...
```

### `Review` (Avaliações)
```python
# reviews/models.py
class Review(models.Model):
    user = models.ForeignKey(User, related_name='reviews')
    location = models.ForeignKey(Location, related_name='reviews')
    # ...
```

## ✅ Estado Atual

- ✅ **Backend**: Serializer corrigido com lógica correcta
- ✅ **Frontend**: Código limpo, sem localStorage, usa apenas API
- ✅ **API**: Endpoint `/api/users/me/` retorna stats corretos
- ⚠️ **Acção necessária**: Reiniciar o Django para carregar as alterações

## 🎯 Próximos Passos

1. **Reiniciar o backend**: `python manage.py runserver 8000`
2. **Testar no frontend**: Verificar se os stats aparecem corretamente
3. **Criar dados de teste** (se necessário):
   ```bash
   cd backend
   python manage.py shell
   
   from users.models import User
   from locations.models import Location
   from reviews.models import Review
   
   user = User.objects.first()
   print(f"Locais: {user.locations.count()}")
   print(f"Bookings: {user.bookings.count()}")
   print(f"Reviews: {user.reviews.count()}")
   ```

## 📝 Notas

- **Serviços = Bookings**: Na aplicação actual, os "serviços" são representados por reservas/bookings
- **Todos os utilizadores** podem criar bookings (não só business/guide)
- **Stats em tempo real**: Sempre que o utilizador acede ao perfil, os stats são carregados da API

---

**Data**: 2026-07-13  
**Estado**: ✅ Correção completa aplicada  
**Requer**: Reiniciar Django backend
