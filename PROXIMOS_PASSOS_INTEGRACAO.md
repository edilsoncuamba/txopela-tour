# 🎯 Próximos Passos - Integração Backend Completa

## ✅ O Que Já Foi Feito

1. **AddService.tsx e AddLocal.tsx**
   - ✅ Dual mode (JSON sem imagens, FormData com imagens)
   - ✅ Validações frontend
   - ✅ Logging detalhado
   - ✅ URL correcta (não duplica `/api`)
   - ✅ Serviços criados com sucesso (201 Created)

2. **api.ts**
   - ✅ Parâmetro `status` adicionado em `localsApi.list()` e `servicesApi.list()`
   - ✅ Métodos `getMy()` criados para filtrar por utilizador
   - ✅ Tratamento de erros melhorado em `apiUpload()`

3. **ApuradorDashboard.tsx**
   - ✅ Logging detalhado
   - ✅ Fallback quando admin API falha (403)
   - ✅ Filtro manual no frontend quando backend não suporta

---

## ❌ Problema Actual Identificado

### **API retorna Array vazio mesmo após criar**

**Sintoma:**
```javascript
[AddService] ✅ Sucesso! Serviço criado: { id: "08e832b4-...", status: "pending" }
[ApuradorDashboard] Todos os serviços - array: Array(0)  // ❌ VAZIO!
```

**Causas Possíveis:**

1. **Backend filtra por `status=approved` por padrão**
   - GET `/api/services/` só retorna aprovados
   - Pendentes não aparecem na lista geral

2. **Permissões**
   - Utilizador vê apenas seus próprios serviços approved
   - Precisa role `admin` ou `curator` para ver pendentes

3. **Filtro `?status=pending` não implementado**
   - Backend ignora o parâmetro
   - Retorna sempre vazioou só approved

---

## 🔧 Soluções a Implementar

### **Solução 1: Verificar Backend Django**

```python
# No backend, verificar ViewSet do Service:

class ServiceViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = Service.objects.all()
        
        # Problema: Pode estar filtrando por status=approved
        if not self.request.user.is_staff:
            qs = qs.filter(status='approved')  # ❌ Remove isto!
        
        # Solução: Permitir ver pendentes do próprio utilizador
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        elif not self.request.user.is_staff:
            # Não-admins vêem: approved OU seus próprios pendentes
            qs = qs.filter(
                Q(status='approved') | Q(created_by=self.request.user)
            )
        
        return qs
```

### **Solução 2: Endpoint "Meus Serviços"**

Criar endpoint específico no backend:

```python
# urls.py
path('api/users/me/services/', MyServicesView.as_view())

# views.py
class MyServicesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        services = Service.objects.filter(created_by=request.user)
        serializer = ServiceSerializer(services, many=True)
        return Response({'services': serializer.data})
```

Frontend:
```typescript
// api.ts
export const usersApi = {
  //...
  getMyServices: () => apiFetch<any>('/api/users/me/services/'),
  getMyLocals: () => apiFetch<any>('/api/users/me/locals/'),
  getMyPosts: () => apiFetch<any>('/api/users/me/posts/'),
};
```

### **Solução 3: Usar Endpoint Admin**

Para aprovadores, usar endpoint específico:

```python
# urls.py
path('api/admin/services/pending/', PendingServicesView.as_view())

# views.py
class PendingServicesView(APIView):
    permission_classes = [IsAdminUser | IsCurator]
    
    def get(self, request):
        services = Service.objects.filter(status='pending')
        serializer = ServiceSerializer(services, many=True)
        return Response({'services': serializer.data})
```

---

## 📝 Checklist de Testes

### **Backend (Django)**

- [ ] GET `/api/services/` retorna TODOS os serviços? Ou só approved?
- [ ] GET `/api/services/?status=pending` funciona?
- [ ] GET `/api/services/{id}/` retorna serviço pending para o próprio autor?
- [ ] Existe `/api/users/me/services/`?
- [ ] Existe `/api/admin/pending-approvals/`?
- [ ] Role `curator` tem permissão para ver pendentes?

### **Frontend**

- [ ] Após criar serviço, recarregar perfil automaticamente
- [ ] Mostrar "Meus Serviços" no perfil (pending + approved)
- [ ] Dashboard Aprovador mostra pendentes
- [ ] Aprovação/Rejeição atualiza lista automaticamente
- [ ] Eliminar todos os dados mockados restantes

---

## 🚀 Implementação Imediata

### **1. Testar Busca por ID**

No console do browser, executar:
```javascript
// Buscar o serviço recém-criado por ID
fetch('http://localhost:8000/api/services/08e832b4-ae13-4169-99b1-998317467eaa/', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
  }
})
.then(r => r.json())
.then(d => console.log('Serviço por ID:', d))
```

**Se funcionar:** Backend tem o serviço, problema é filtro/listagem  
**Se falhar:** Problema de permissões ou serviço não foi salvo

### **2. Recarregar Perfil Após Criar**

```typescript
// AddService.tsx - após sucesso
setSubmitted(true);

// Recarregar dados do utilizador
const userRes = await usersApi.getMe();
if (userRes.data) {
  localStorage.setItem('user', JSON.stringify(userRes.data));
  // Triggerar atualização do AuthContext se necessário
}

// Opcional: Navegar para perfil
// onSuccess(); ou navigate('/profile');
```

### **3. Callback de Sucesso**

```typescript
// AddService.tsx
interface AddServiceProps {
  onSuccess: (serviceId: string) => void;  // Passa ID criado
  onBack: () => void;
}

// No componente pai
<AddService 
  onSuccess={(id) => {
    // Recarregar dados
    refetchUserData();
    // Mostrar toast
    showToast('Serviço criado com sucesso!');
    // Navegar
    navigate('/profile');
  }}
  onBack={() => navigate(-1)}
/>
```

---

## 📊 Prioridades

1. **URGENTE:** Verificar backend - por que `/api/services/` retorna vazio
2. **IMPORTANTE:** Implementar "Meus Serviços" no perfil
3. **NECESSÁRIO:** Dashboard Aprovador funcional
4. **DESEJÁVEL:** Recarregamento automático sem F5

---

**Próxima ação:** Executar teste de busca por ID no console do browser
