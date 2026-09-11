# ⚠️ Erro 500 - Sistema de Reviews

## 🔴 Problema Identificado

Erro **500 (Internal Server Error)** ao tentar carregar reviews do backend.

---

## 🔍 Diagnóstico

### O que significa Erro 500?
- **500 = Internal Server Error** (Erro Interno do Servidor)
- Significa que o **backend Django** está tendo um problema ao processar a requisição
- **NÃO** é um erro do frontend
- **NÃO** é um erro de autenticação
- **É** um erro na lógica do backend ou banco de dados

### Endpoint Afetado
Provavelmente um destes:
- `GET /api/locals/{id}/reviews/` - Listar reviews de local
- `GET /api/services/{id}/reviews/` - Listar reviews de serviço
- `POST /api/locals/{id}/reviews/` - Criar review para local
- `POST /api/services/{id}/reviews/` - Criar review para serviço

---

## 🛠️ Soluções

### 1. ✅ Frontend - Error Handling Melhorado (FEITO)

O ReviewManager agora lida graciosamente com erro 500:

```tsx
// Antes
if (response.error) {
  setError(response.error);  // ❌ Mostrava erro feio
  return;
}

// Depois
if (response.error) {
  if (response.error.includes('500')) {
    setReviews([]);
    setError('Sistema de avaliações temporariamente indisponível');
    console.warn('Endpoint retornou 500');
  } else if (response.error.includes('404')) {
    setReviews([]);  // OK, sem reviews ainda
    setError(null);
  }
  return;
}
```

**Resultado:**
- ✅ Interface **não quebra**
- ✅ Mensagem **amigável** para o usuário
- ✅ Componente continua **funcional**
- ✅ Logs no console para **debugging**

---

### 2. 🔧 Backend - Verificações Necessárias

#### A. Verificar se o endpoint existe

```bash
# Backend Django
cd backend
python manage.py show_urls | grep reviews
```

**Deve mostrar:**
```
/api/locals/<id>/reviews/   GET, POST
/api/services/<id>/reviews/ GET, POST
/api/reviews/<id>/          GET, PUT, PATCH, DELETE
/api/reviews/<id>/helpful/  POST, DELETE
```

Se **não mostrar**, o endpoint **não está implementado**.

#### B. Verificar logs do Django

```bash
# Terminal do backend
tail -f logs/django.log

# Ou ver no console onde Django está rodando
```

**Procurar por:**
- Traceback do Python
- Database errors
- AttributeError, DoesNotExist, etc.

#### C. Verificar modelo Review no Django

```python
# backend/apps/reviews/models.py
class Review(models.Model):
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    local = models.ForeignKey('locals.Local', null=True, blank=True, on_delete=models.CASCADE)
    service = models.ForeignKey('services.Service', null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    helpful_count = models.IntegerField(default=0)
```

**Verificar:**
- ✅ Campos existem
- ✅ Foreign keys estão corretas
- ✅ Validadores estão definidos

#### D. Verificar serializer

```python
# backend/apps/reviews/serializers.py
class ReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'author', 'created_at', 'helpful_count']
        read_only_fields = ['id', 'author', 'created_at', 'helpful_count']
```

**Verificar:**
- ✅ Todos os campos estão no serializer
- ✅ Campos relacionados (author) têm serializer próprio
- ✅ read_only_fields estão corretos

#### E. Verificar view

```python
# backend/apps/reviews/views.py
class LocalReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        local_id = self.kwargs['local_id']
        return Review.objects.filter(local_id=local_id).select_related('author')
    
    def perform_create(self, serializer):
        local_id = self.kwargs['local_id']
        serializer.save(author=self.request.user, local_id=local_id)
```

**Verificar:**
- ✅ View herda de `ListCreateAPIView` ou similar
- ✅ `get_queryset()` filtra corretamente
- ✅ `perform_create()` adiciona author automaticamente
- ✅ Permissions estão corretas

#### F. Verificar URL patterns

```python
# backend/apps/reviews/urls.py
urlpatterns = [
    path('locals/<int:local_id>/reviews/', LocalReviewListCreateView.as_view()),
    path('services/<int:service_id>/reviews/', ServiceReviewListCreateView.as_view()),
    path('reviews/<int:pk>/', ReviewDetailView.as_view()),
]
```

---

### 3. 🧪 Testar Backend Diretamente

#### Teste A: Listar reviews de local

```bash
# Sem autenticação (deve funcionar)
curl http://localhost:8000/api/locals/1/reviews/

# Resposta esperada (200 OK):
{
  "success": true,
  "reviews": [],
  "pagination": {...}
}

# Ou resposta esperada (404 se local não existe):
{
  "detail": "Not found."
}
```

#### Teste B: Criar review

```bash
# Com autenticação
TOKEN="seu-token-aqui"

curl -X POST http://localhost:8000/api/locals/1/reviews/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Teste de review"
  }'

# Resposta esperada (201 Created):
{
  "success": true,
  "review": {
    "id": 1,
    "rating": 5,
    "comment": "Teste de review",
    "author": {...},
    "created_at": "2026-07-11T00:00:00Z"
  }
}
```

#### Teste C: Ver logs de erro

Se retornar **500**, ver o traceback completo no terminal do Django.

---

## 🚨 Erros Comuns e Soluções

### Erro 1: "DoesNotExist: Local matching query does not exist"

**Causa:** Tentando criar review para local que não existe

**Solução:**
```python
# views.py - Adicionar validação
def perform_create(self, serializer):
    local_id = self.kwargs['local_id']
    try:
        local = Local.objects.get(id=local_id)
    except Local.DoesNotExist:
        raise ValidationError({"detail": "Local não encontrado"})
    serializer.save(author=self.request.user, local=local)
```

### Erro 2: "IntegrityError: NOT NULL constraint failed"

**Causa:** Campo obrigatório não está sendo preenchido

**Solução:**
```python
# Verificar migrations
python manage.py makemigrations
python manage.py migrate

# Verificar se author está sendo adicionado
serializer.save(author=self.request.user)  # ✅ Correto
serializer.save()  # ❌ Errado se author é obrigatório
```

### Erro 3: "AttributeError: 'NoneType' object has no attribute..."

**Causa:** Tentando acessar atributo de objeto None

**Solução:**
```python
# Usar select_related para evitar N+1
queryset = Review.objects.filter(
    local_id=local_id
).select_related('author', 'local')

# Verificar None antes de acessar
if review.author:
    author_name = review.author.name
```

### Erro 4: "OperationalError: no such table: reviews_review"

**Causa:** Migrations não foram aplicadas

**Solução:**
```bash
python manage.py makemigrations reviews
python manage.py migrate
```

---

## 📋 Checklist de Debugging

Para resolver o erro 500:

- [ ] **Ver logs do Django** no terminal
- [ ] **Copiar traceback completo** do erro
- [ ] **Verificar se modelo Review existe** no banco
- [ ] **Verificar se migrations foram aplicadas**
- [ ] **Testar endpoint com CURL** diretamente
- [ ] **Verificar se local/service existe** no banco
- [ ] **Ver query SQL** sendo executada (Django Debug Toolbar)
- [ ] **Verificar permissions** da view
- [ ] **Verificar serializer** tem todos os campos
- [ ] **Verificar foreign keys** estão corretas

---

## 🔧 Solução Temporária (Frontend)

Enquanto o backend não é corrigido, o frontend agora:

✅ **Mostra mensagem amigável**
```
"O sistema de avaliações está temporariamente indisponível. Tenta novamente mais tarde."
```

✅ **Não quebra a interface**
- Componente continua renderizando
- Outros recursos funcionam normalmente
- Usuário pode continuar navegando

✅ **Logs úteis no console**
```javascript
console.warn('Endpoint de reviews retornou 500:', response.error);
```

---

## 📚 Recursos Úteis

### Django Debug
```python
# settings.py
DEBUG = True  # Apenas em desenvolvimento
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

### Django Shell
```bash
python manage.py shell

# Testar modelo
from reviews.models import Review
Review.objects.all()

# Testar criação
r = Review(rating=5, comment="Teste", author_id=1, local_id=1)
r.save()
```

### PostgreSQL/MySQL
```bash
# Ver tabelas
python manage.py dbshell
\dt  # PostgreSQL
SHOW TABLES;  # MySQL

# Ver estrutura da tabela reviews
\d reviews_review  # PostgreSQL
DESCRIBE reviews_review;  # MySQL
```

---

## ✅ Próximos Passos

1. **Ver logs do Django** para identificar o erro exato
2. **Copiar traceback** e compartilhar se necessário
3. **Testar endpoint** com CURL para confirmar problema
4. **Corrigir backend** baseado no erro encontrado
5. **Testar novamente** no frontend

---

## 📞 Se Precisar de Ajuda

Compartilha:
1. **Traceback completo** do Django
2. **Comando CURL** que está falhando
3. **Logs do console** do navegador
4. **Estrutura do modelo** Review

---

*Documentação criada em: 11 de Julho de 2026*  
*Status: Frontend com error handling melhorado ✅*  
*Próximo: Corrigir backend Django ⏳*
