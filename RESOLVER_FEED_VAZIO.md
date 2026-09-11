# 🚀 Como Resolver: Feed Vazio (Sem Locais)

## ⚡ Solução Rápida (2 minutos)

### Opção 1: Script Automático (Recomendado)

```bash
# 1. Ir para o diretório do backend
cd backend  # ou onde está o manage.py

# 2. Copiar o script seed_locals_quick.py para o diretório do backend
# (O arquivo está na raiz do projeto)

# 3. Executar o script
python seed_locals_quick.py
```

**Resultado esperado:**
```
✅ Criados: 10 locais
📊 Total no banco: 10 locais
✓  Aprovados: 10
```

---

### Opção 2: Django Admin (Manual)

```bash
# 1. Acessar Django Admin
http://192.168.88.89:8000/admin/

# 2. Login com superusuário

# 3. Clicar em "Locals" → "Add Local"

# 4. Preencher formulário:
```

**Campos obrigatórios:**
- ✅ Name: `Praia de Tofo`
- ✅ Description: `Uma das melhores praias...`
- ✅ Category: `attraction` (escolher do dropdown)
- ✅ Province: `Inhambane`
- ✅ Status: **`approved`** ← IMPORTANTE!
- ✅ Location → Latitude: `-23.8531`
- ✅ Location → Longitude: `35.5475`

**⚠️ IMPORTANTE:** Se o status for `pending`, o local NÃO aparecerá no feed!

---

### Opção 3: Django Shell (Para desenvolvedores)

```bash
# 1. Abrir Django shell
python manage.py shell

# 2. Copiar e colar:
```

```python
from locals.models import Local
from django.contrib.auth import get_user_model

User = get_user_model()
owner = User.objects.first()

Local.objects.create(
    name='Praia de Tofo',
    description='Uma das melhores praias de Moçambique',
    category='attraction',
    province='Inhambane',
    status='approved',  # ← IMPORTANTE!
    owner=owner,
    location={
        'latitude': -23.8531,
        'longitude': 35.5475,
        'address': 'Tofo, Inhambane',
        'municipality': 'Inhambane'
    }
)

print("✅ Local criado com sucesso!")
```

---

## 🔍 Verificar se Funcionou

### 1. Testar o Endpoint

```bash
# PowerShell
Invoke-WebRequest -Uri "http://192.168.88.89:8000/api/locals" -UseBasicParsing

# Bash/Linux
curl http://192.168.88.89:8000/api/locals
```

**Resposta esperada:**
```json
{
  "success": true,
  "locals": [
    {
      "id": "...",
      "name": "Praia de Tofo",
      "description": "...",
      "status": "approved"
    }
  ]
}
```

### 2. Verificar no Frontend

1. Abrir o app: `http://localhost:5173` (ou porta configurada)
2. Ir para **"Descobertas"** no menu inferior
3. Deve mostrar os locais criados!

---

## ❓ Troubleshooting

### Problema: "Ainda não mostra nada"

**Solução 1: Verificar status**
```python
# Django shell
from locals.models import Local

# Ver todos os locais
for local in Local.objects.all():
    print(f"{local.name} → Status: {local.status}")

# Se houver locais com status 'pending', aprová-los:
Local.objects.filter(status='pending').update(status='approved')
print("✅ Todos aprovados!")
```

**Solução 2: Limpar cache do navegador**
```
Ctrl + Shift + R (Chrome/Edge)
Cmd + Shift + R (Mac)
```

**Solução 3: Reiniciar servidor Django**
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
python manage.py runserver 0.0.0.0:8000
```

### Problema: "Erro ao criar local"

**Verificar campos obrigatórios do modelo:**
```python
# Django shell
from locals.models import Local

# Ver campos obrigatórios
print([f.name for f in Local._meta.fields if not f.blank and not f.null])
```

---

## 📊 Dados de Exemplo Criados

O script `seed_locals_quick.py` cria 10 locais:

| Nome | Categoria | Província |
|------|-----------|-----------|
| Praia de Tofo | Attraction | Inhambane |
| Ilha de Moçambique | Attraction | Nampula |
| Parque Nacional Gorongosa | Attraction | Sofala |
| Restaurante Zambi | Restaurant | Maputo |
| Hotel Pestana Rovuma | Hotel | Maputo |
| Mercado Central | Shop | Maputo |
| Praia do Wimbe | Attraction | Cabo Delgado |
| Casa de Ferro | Attraction | Maputo |
| Arquipélago de Bazaruto | Attraction | Inhambane |
| Costa do Sol | Restaurant | Maputo |

Todos com:
- ✅ Status: `approved`
- ✅ Coordenadas GPS
- ✅ Descrição completa
- ✅ Categoria correta
- ✅ Província

---

## ✅ Checklist Final

- [ ] Executei o script `seed_locals_quick.py` OU criei locais manualmente
- [ ] Verifiquei que `status='approved'` para todos os locais
- [ ] Testei endpoint: `GET /api/locals` retorna dados
- [ ] Recarreguei o frontend (Ctrl+Shift+R)
- [ ] O feed de "Descobertas" agora mostra os locais
- [ ] Consigo filtrar por categoria
- [ ] Consigo clicar e ver detalhes de um local

---

## 🎯 Resumo

**Problema:** Backend responde 200 OK, mas array vazio  
**Causa:** Banco de dados sem locais cadastrados  
**Solução:** Executar `seed_locals_quick.py` ou criar via Django Admin  
**Tempo:** 2-5 minutos  
**Resultado:** Feed mostrando 10 locais de exemplo  

---

## 📞 Suporte

Se ainda não funcionar:

1. Verificar logs do Django: erros no console
2. Verificar logs do navegador: F12 → Console
3. Verificar rede: F12 → Network → ver request para `/api/locals`
4. Verificar se o modelo `Local` tem os campos esperados pela API

**Logs úteis:**
```python
# Django shell
from locals.models import Local
print(f"Total: {Local.objects.count()}")
print(f"Aprovados: {Local.objects.filter(status='approved').count()}")
print(f"Pendentes: {Local.objects.filter(status='pending').count()}")
```
