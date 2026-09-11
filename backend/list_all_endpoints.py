"""
Script para listar todos os endpoints da API de forma organizada
"""

def print_endpoints():
    """Print all API endpoints organized by category"""
    
    endpoints = {
        "AUTENTICAÇÃO": [
            ("POST", "/api/auth/login/", "Login com email e senha"),
            ("POST", "/api/auth/refresh/", "Renovar token JWT"),
            ("POST", "/api/auth/verify/", "Verificar validade do token"),
        ],
        "USUÁRIOS": [
            ("GET", "/api/users/", "Listar todos os usuários"),
            ("POST", "/api/users/register/", "Registrar novo usuário"),
            ("POST", "/api/users/login/", "Login de usuário"),
            ("GET", "/api/users/me/", "Obter perfil do usuário autenticado"),
            ("PUT", "/api/users/me/update/", "Atualizar perfil"),
            ("POST", "/api/users/me/change-password/", "Mudar senha"),
            ("GET", "/api/users/<id>/", "Obter detalhes de um usuário"),
            ("POST", "/api/users/<id>/follow/", "Seguir um usuário"),
            ("GET", "/api/users/<id>/followers/", "Listar seguidores"),
            ("GET", "/api/users/<id>/following/", "Listar seguindo"),
        ],
        "LOCALIZAÇÕES": [
            ("GET", "/api/locations/", "Listar todas as localizações"),
            ("POST", "/api/locations/create/", "Criar nova localização"),
            ("GET", "/api/locations/trending/", "Localizações em tendência"),
            ("GET", "/api/locations/nearby/", "Localizações próximas"),
            ("GET", "/api/locations/saved/", "Localizações salvas"),
            ("GET", "/api/locations/categories/", "Listar categorias"),
            ("GET", "/api/locations/<id>/", "Detalhes de uma localização"),
            ("PUT", "/api/locations/<id>/update/", "Atualizar localização"),
            ("DELETE", "/api/locations/<id>/delete/", "Deletar localização"),
            ("POST", "/api/locations/<id>/save/", "Salvar localização"),
            ("POST", "/api/locations/<id>/like/", "Curtir localização"),
            ("GET", "/api/locations/user/<user_id>/", "Localizações de um usuário"),
        ],
        "POSTS": [
            ("GET", "/api/posts/", "Listar todos os posts"),
            ("POST", "/api/posts/create/", "Criar novo post"),
            ("GET", "/api/posts/saved/", "Posts salvos"),
            ("GET", "/api/posts/<id>/", "Detalhes de um post"),
            ("PUT", "/api/posts/<id>/update/", "Atualizar post"),
            ("DELETE", "/api/posts/<id>/delete/", "Deletar post"),
            ("POST", "/api/posts/<id>/like/", "Curtir post"),
            ("POST", "/api/posts/<id>/save/", "Salvar post"),
            ("POST", "/api/posts/<id>/share/", "Compartilhar post"),
            ("POST", "/api/posts/<id>/comment/", "Adicionar comentário"),
            ("DELETE", "/api/posts/comment/<comment_id>/delete/", "Deletar comentário"),
            ("GET", "/api/posts/user/<user_id>/", "Posts de um usuário"),
        ],
        "AVALIAÇÕES": [
            ("GET", "/api/reviews/", "Listar todas as avaliações"),
            ("GET", "/api/reviews/location/<location_id>/", "Avaliações de uma localização"),
            ("GET", "/api/reviews/location/<location_id>/stats/", "Estatísticas de avaliação"),
            ("POST", "/api/reviews/create/", "Criar nova avaliação"),
            ("PUT", "/api/reviews/<id>/update/", "Atualizar avaliação"),
            ("DELETE", "/api/reviews/<id>/delete/", "Deletar avaliação"),
            ("POST", "/api/reviews/<id>/helpful/", "Marcar como útil"),
            ("POST", "/api/reviews/<id>/reply/", "Responder a uma avaliação"),
            ("GET", "/api/reviews/user/<user_id>/", "Avaliações de um usuário"),
        ],
        "NOTIFICAÇÕES": [
            ("GET", "/api/notifications/", "Listar notificações"),
            ("GET", "/api/notifications/unread/", "Notificações não lidas"),
            ("GET", "/api/notifications/count/", "Contar notificações"),
            ("POST", "/api/notifications/<id>/read/", "Marcar como lida"),
            ("DELETE", "/api/notifications/<id>/delete/", "Deletar notificação"),
            ("POST", "/api/notifications/mark-all-read/", "Marcar todas como lidas"),
            ("GET", "/api/notifications/preferences/", "Preferências de notificação"),
        ],
        "ADMIN": [
            ("GET", "/admin/", "Painel administrativo"),
        ],
    }
    
    print("\n" + "="*100)
    print("LISTA COMPLETA DE ENDPOINTS DA API")
    print("="*100 + "\n")
    
    total_endpoints = 0
    
    for category, items in endpoints.items():
        print(f"\n📌 {category}")
        print("-" * 100)
        
        for method, endpoint, description in items:
            # Color coding for methods
            if method == "GET":
                method_str = f"🔵 {method}"
            elif method == "POST":
                method_str = f"🟢 {method}"
            elif method == "PUT":
                method_str = f"🟡 {method}"
            elif method == "DELETE":
                method_str = f"🔴 {method}"
            else:
                method_str = f"⚪ {method}"
            
            print(f"  {method_str:15} {endpoint:50} → {description}")
            total_endpoints += 1
    
    print("\n" + "="*100)
    print(f"TOTAL: {total_endpoints} ENDPOINTS")
    print("="*100 + "\n")
    
    # Legend
    print("LEGENDA:")
    print("  🔵 GET    - Obter dados")
    print("  🟢 POST   - Criar dados")
    print("  🟡 PUT    - Atualizar dados")
    print("  🔴 DELETE - Deletar dados")
    print("\n")


if __name__ == "__main__":
    print_endpoints()
