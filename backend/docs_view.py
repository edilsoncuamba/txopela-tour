from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def endpoints_list(request):
    endpoints = [
        # Authentication
        {"path": "/api/auth/login/", "methods": ["POST"], "desc": "Login com email e password. Retorna access e refresh tokens.", "body": {"email": "string", "password": "string"}},
        {"path": "/api/auth/refresh/", "methods": ["POST"], "desc": "Renovar access token usando refresh token.", "body": {"refresh": "string"}},
        {"path": "/api/auth/verify/", "methods": ["POST"], "desc": "Verificar se um token é válido.", "body": {"token": "string"}},
        
        # Users
        {"path": "/api/users/register/", "methods": ["POST"], "desc": "Registar novo usuário. Retorna tokens após registro.", "body": {"email": "string", "name": "string", "password": "string", "password_confirm": "string", "type": "turista|guia|negocio"}},
        {"path": "/api/users/send-otp/", "methods": ["POST"], "desc": "Enviar código OTP para email de verificação.", "body": {"email": "string"}},
        {"path": "/api/users/verify-otp/", "methods": ["POST"], "desc": "Verificar código OTP e ativar conta.", "body": {"email": "string", "otp_code": "string"}},
        {"path": "/api/users/me/", "methods": ["GET"], "desc": "Obter perfil do usuário logado. Requer autenticação.", "auth": True},
        {"path": "/api/users/me/update/", "methods": ["PUT"], "desc": "Atualizar perfil do usuário (nome, bio, avatar, etc).", "auth": True},
        {"path": "/api/users/me/change-password/", "methods": ["POST"], "desc": "Mudar password do usuário.", "auth": True, "body": {"old_password": "string", "new_password": "string"}},
        {"path": "/api/users/{id}/", "methods": ["GET"], "desc": "Ver perfil público de outro usuário.", "auth": True},
        {"path": "/api/users/{id}/follow/", "methods": ["POST"], "desc": "Seguir ou deixar de seguir um usuário.", "auth": True},
        {"path": "/api/users/{id}/followers/", "methods": ["GET"], "desc": "Listar seguidores de um usuário.", "auth": True},
        {"path": "/api/users/{id}/following/", "methods": ["GET"], "desc": "Listar usuários que um usuário segue.", "auth": True},
        
        # Locations
        {"path": "/api/locations/", "methods": ["GET"], "desc": "Listar todos os locais. Suporta filtros: ?category=praia&search=tofo&ordering=-created_at", "auth": True},
        {"path": "/api/locations/create/", "methods": ["POST"], "desc": "Criar novo local turístico.", "auth": True, "body": {"name": "string", "description": "string", "category": "string", "location": {"lat": "float", "lng": "float", "address": "string"}}},
        {"path": "/api/locations/{id}/", "methods": ["GET"], "desc": "Ver detalhes completos de um local.", "auth": True},
        {"path": "/api/locations/{id}/update/", "methods": ["PUT"], "desc": "Atualizar informações de um local (apenas criador).", "auth": True},
        {"path": "/api/locations/{id}/delete/", "methods": ["DELETE"], "desc": "Deletar um local (apenas criador).", "auth": True},
        {"path": "/api/locations/{id}/like/", "methods": ["POST"], "desc": "Curtir ou descurtir um local.", "auth": True},
        {"path": "/api/locations/{id}/save/", "methods": ["POST"], "desc": "Salvar ou remover local dos favoritos.", "auth": True},
        {"path": "/api/locations/saved/", "methods": ["GET"], "desc": "Listar locais salvos pelo usuário.", "auth": True},
        {"path": "/api/locations/trending/", "methods": ["GET"], "desc": "Listar locais em tendência (mais curtidos/visitados).", "auth": True},
        {"path": "/api/locations/nearby/", "methods": ["GET"], "desc": "Buscar locais próximos. Params: ?lat=-23.8596&lng=35.5478&radius=10", "auth": True},
        {"path": "/api/locations/categories/", "methods": ["GET"], "desc": "Listar todas as categorias disponíveis.", "auth": True},
        {"path": "/api/locations/user/{userId}/", "methods": ["GET"], "desc": "Listar locais criados por um usuário específico.", "auth": True},
        
        # Reviews
        {"path": "/api/reviews/location/{locationId}/", "methods": ["GET"], "desc": "Listar todas as avaliações de um local.", "auth": True},
        {"path": "/api/reviews/create/", "methods": ["POST"], "desc": "Criar avaliação para um local.", "auth": True, "body": {"location": "uuid", "rating": "1-5", "comment": "string"}},
        {"path": "/api/reviews/{id}/update/", "methods": ["PUT"], "desc": "Editar avaliação (apenas autor).", "auth": True},
        {"path": "/api/reviews/{id}/delete/", "methods": ["DELETE"], "desc": "Deletar avaliação (apenas autor).", "auth": True},
        {"path": "/api/reviews/{id}/helpful/", "methods": ["POST"], "desc": "Marcar avaliação como útil.", "auth": True},
        {"path": "/api/reviews/{id}/reply/", "methods": ["POST"], "desc": "Responder a uma avaliação (proprietário do local).", "auth": True, "body": {"comment": "string"}},
        {"path": "/api/reviews/location/{locationId}/stats/", "methods": ["GET"], "desc": "Estatísticas de avaliações (média, total, distribuição).", "auth": True},
        {"path": "/api/reviews/user/{userId}/", "methods": ["GET"], "desc": "Listar avaliações feitas por um usuário.", "auth": True},
        
        # Posts
        {"path": "/api/posts/", "methods": ["GET"], "desc": "Feed de posts (timeline social).", "auth": True},
        {"path": "/api/posts/create/", "methods": ["POST"], "desc": "Criar novo post.", "auth": True, "body": {"description": "string", "image": "file", "location": "uuid (opcional)"}},
        {"path": "/api/posts/{id}/", "methods": ["GET"], "desc": "Ver detalhes de um post.", "auth": True},
        {"path": "/api/posts/{id}/update/", "methods": ["PUT"], "desc": "Editar post (apenas autor).", "auth": True},
        {"path": "/api/posts/{id}/delete/", "methods": ["DELETE"], "desc": "Deletar post (apenas autor).", "auth": True},
        {"path": "/api/posts/{id}/like/", "methods": ["POST"], "desc": "Curtir ou descurtir post.", "auth": True},
        {"path": "/api/posts/{id}/save/", "methods": ["POST"], "desc": "Salvar ou remover post dos salvos.", "auth": True},
        {"path": "/api/posts/{id}/share/", "methods": ["POST"], "desc": "Compartilhar post (incrementa contador).", "auth": True},
        {"path": "/api/posts/{id}/comment/", "methods": ["POST"], "desc": "Comentar em um post.", "auth": True, "body": {"content": "string"}},
        {"path": "/api/posts/comment/{commentId}/delete/", "methods": ["DELETE"], "desc": "Deletar comentário (apenas autor).", "auth": True},
        {"path": "/api/posts/saved/", "methods": ["GET"], "desc": "Listar posts salvos pelo usuário.", "auth": True},
        {"path": "/api/posts/user/{userId}/", "methods": ["GET"], "desc": "Listar posts de um usuário.", "auth": True},
        
        # Notifications
        {"path": "/api/notifications/", "methods": ["GET"], "desc": "Listar todas as notificações do usuário.", "auth": True},
        {"path": "/api/notifications/unread/", "methods": ["GET"], "desc": "Listar apenas notificações não lidas.", "auth": True},
        {"path": "/api/notifications/count/", "methods": ["GET"], "desc": "Contar notificações (total e não lidas).", "auth": True},
        {"path": "/api/notifications/{id}/read/", "methods": ["POST"], "desc": "Marcar notificação como lida.", "auth": True},
        {"path": "/api/notifications/mark-all-read/", "methods": ["POST"], "desc": "Marcar todas as notificações como lidas.", "auth": True},
        {"path": "/api/notifications/{id}/delete/", "methods": ["DELETE"], "desc": "Deletar notificação.", "auth": True},
        {"path": "/api/notifications/preferences/", "methods": ["GET", "PUT"], "desc": "Ver/atualizar preferências de notificações.", "auth": True},
        
        # Bookings
        {"path": "/api/bookings/", "methods": ["GET"], "desc": "Listar todas as reservas do usuário.", "auth": True},
        {"path": "/api/bookings/create/", "methods": ["POST"], "desc": "Criar nova reserva.", "auth": True, "body": {"location": "uuid", "check_in": "date", "check_out": "date", "guests": "int"}},
        {"path": "/api/bookings/{id}/", "methods": ["GET", "PUT", "DELETE"], "desc": "Ver/editar/cancelar reserva.", "auth": True},
        {"path": "/api/bookings/{id}/confirm/", "methods": ["POST"], "desc": "Confirmar reserva (proprietário do local).", "auth": True},
        {"path": "/api/bookings/{id}/cancel/", "methods": ["POST"], "desc": "Cancelar reserva.", "auth": True},
        {"path": "/api/bookings/{id}/review/", "methods": ["POST"], "desc": "Avaliar reserva após conclusão.", "auth": True, "body": {"rating": "1-5", "comment": "string"}},
        {"path": "/api/bookings/location/{locationId}/availability/", "methods": ["GET"], "desc": "Ver disponibilidade de um local.", "auth": True},
        {"path": "/api/bookings/upcoming/", "methods": ["GET"], "desc": "Listar reservas futuras.", "auth": True},
        {"path": "/api/bookings/past/", "methods": ["GET"], "desc": "Listar reservas passadas.", "auth": True},
        
        # Chat
        {"path": "/api/chat/", "methods": ["GET"], "desc": "Listar todas as conversas do usuário.", "auth": True},
        {"path": "/api/chat/{id}/", "methods": ["GET"], "desc": "Ver mensagens de uma conversa.", "auth": True},
        {"path": "/api/chat/start/{userId}/", "methods": ["POST"], "desc": "Iniciar conversa com um usuário.", "auth": True},
        {"path": "/api/chat/{conversationId}/message/", "methods": ["POST"], "desc": "Enviar mensagem em uma conversa.", "auth": True, "body": {"content": "string"}},
        {"path": "/api/chat/message/{messageId}/read/", "methods": ["POST"], "desc": "Marcar mensagem como lida.", "auth": True},
        {"path": "/api/chat/{conversationId}/mark-read/", "methods": ["POST"], "desc": "Marcar toda conversa como lida.", "auth": True},
        {"path": "/api/chat/unread-count/", "methods": ["GET"], "desc": "Contar mensagens não lidas.", "auth": True},
        {"path": "/api/chat/ai/response/", "methods": ["POST"], "desc": "Obter resposta da IA (SambaNova). Assistente turístico inteligente.", "auth": True, "body": {"message": "string", "history": "array (opcional)"}},
        
        # Communities
        {"path": "/api/communities/", "methods": ["GET"], "desc": "Listar comunidades/grupos.", "auth": True},
        {"path": "/api/communities/create/", "methods": ["POST"], "desc": "Criar nova comunidade.", "auth": True, "body": {"name": "string", "description": "string", "privacy": "public|private"}},
        {"path": "/api/communities/{id}/", "methods": ["GET"], "desc": "Ver detalhes de uma comunidade.", "auth": True},
        {"path": "/api/communities/{id}/join/", "methods": ["POST"], "desc": "Entrar em uma comunidade.", "auth": True},
        {"path": "/api/communities/{id}/leave/", "methods": ["POST"], "desc": "Sair de uma comunidade.", "auth": True},
        {"path": "/api/communities/{id}/posts/", "methods": ["GET"], "desc": "Ver posts de uma comunidade.", "auth": True},
        {"path": "/api/communities/{id}/comments/", "methods": ["GET"], "desc": "Ver comentários de uma comunidade.", "auth": True},
    ]
    return Response({"total": len(endpoints), "endpoints": endpoints})

def docs_page(request):
    html = """<!DOCTYPE html>
<html><head><title>API Docs</title>
<style>body{font-family:Arial;background:#f0f0f0;padding:20px}
.container{max-width:1000px;margin:0 auto;background:white;padding:20px;border-radius:8px}
h1{color:#0077B6}.endpoint{background:#f9f9f9;padding:15px;margin:10px 0;border-left:4px solid #0077B6;border-radius:4px}
.method{display:inline-block;padding:5px 10px;margin:5px 5px 5px 0;border-radius:3px;color:white;font-weight:bold}
.GET{background:#61affe}.POST{background:#49cc90}.PUT{background:#fca130}.DELETE{background:#f93e3e}
input{width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:4px}
button{background:#0077B6;color:white;padding:10px 20px;border:none;border-radius:4px;cursor:pointer}
button:hover{background:#005a8f}.response{background:#f5f5f5;padding:15px;margin:10px 0;border-radius:4px;max-height:300px;overflow-y:auto;font-family:monospace;white-space:pre-wrap}
</style></head><body>
<div class="container">
<h1>🌍 Txopela API Documentation</h1>
<p>Test endpoints directly from your browser</p>

<h2>Available Endpoints</h2>
<div id="endpoints"></div>

<h2>🧪 Test Endpoint</h2>
<select id="method"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select>
<input type="text" id="url" placeholder="Enter endpoint URL (e.g., /api/locations/)">
<button onclick="test()">Test</button>
<div id="response"></div>
</div>

<script>
fetch('/api/endpoints/').then(r=>r.json()).then(d=>{
  let html='';
  d.endpoints.forEach(e=>{
    html+='<div class="endpoint"><strong>'+e.path+'</strong><br>';
    e.methods.forEach(m=>html+='<span class="method '+m+'">'+m+'</span>');
    html+='<p>'+e.desc+'</p></div>';
  });
  document.getElementById('endpoints').innerHTML=html;
});

function test(){
  const url=document.getElementById('url').value;
  const method=document.getElementById('method').value;
  const token=localStorage.getItem('txopela_token');
  const headers={'Content-Type':'application/json'};
  if(token)headers['Authorization']='Bearer '+token;
  
  fetch(url,{method,headers}).then(r=>r.json()).then(d=>{
    document.getElementById('response').innerHTML='<div class="response">'+JSON.stringify(d,null,2)+'</div>';
  }).catch(e=>{
    document.getElementById('response').innerHTML='<div class="response" style="color:red">Error: '+e.message+'</div>';
  });
}
</script>
</body></html>"""
    return HttpResponse(html)
