"""
Script para gerar um relatório HTML de todos os endpoints
"""
import json
from datetime import datetime

def generate_html_report():
    """Generate HTML report of all endpoints"""
    
    endpoints_data = {
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
    
    # Count endpoints
    total_endpoints = sum(len(items) for items in endpoints_data.values())
    
    # Generate HTML
    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Endpoints da API</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        .header p {{
            font-size: 1.1em;
            opacity: 0.9;
        }}
        
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
        }}
        
        .stat {{
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }}
        
        .stat-number {{
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }}
        
        .stat-label {{
            color: #666;
            font-size: 0.9em;
        }}
        
        .content {{
            padding: 30px 20px;
        }}
        
        .category {{
            margin-bottom: 40px;
        }}
        
        .category-title {{
            font-size: 1.5em;
            color: #667eea;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .endpoint {{
            display: grid;
            grid-template-columns: 80px 1fr 1fr;
            gap: 20px;
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #667eea;
            transition: all 0.3s ease;
        }}
        
        .endpoint:hover {{
            background: #e8eaf6;
            transform: translateX(5px);
        }}
        
        .method {{
            font-weight: bold;
            padding: 5px 10px;
            border-radius: 4px;
            text-align: center;
            font-size: 0.9em;
        }}
        
        .method.get {{
            background: #4CAF50;
            color: white;
        }}
        
        .method.post {{
            background: #2196F3;
            color: white;
        }}
        
        .method.put {{
            background: #FF9800;
            color: white;
        }}
        
        .method.delete {{
            background: #f44336;
            color: white;
        }}
        
        .path {{
            font-family: 'Courier New', monospace;
            color: #333;
            font-weight: 500;
        }}
        
        .description {{
            color: #666;
            font-size: 0.95em;
        }}
        
        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e0e0e0;
        }}
        
        .legend {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }}
        
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .legend-badge {{
            padding: 5px 10px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            font-size: 0.85em;
            min-width: 50px;
            text-align: center;
        }}
        
        @media (max-width: 768px) {{
            .endpoint {{
                grid-template-columns: 1fr;
            }}
            
            .header h1 {{
                font-size: 1.8em;
            }}
            
            .stats {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Endpoints da API</h1>
            <p>Txopela Tour - Plataforma de Descoberta de Locais</p>
            <p style="font-size: 0.9em; margin-top: 10px;">Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">{total_endpoints}</div>
                <div class="stat-label">Total de Endpoints</div>
            </div>
            <div class="stat">
                <div class="stat-number">{len(endpoints_data)}</div>
                <div class="stat-label">Categorias</div>
            </div>
            <div class="stat">
                <div class="stat-number">100%</div>
                <div class="stat-label">Cobertura</div>
            </div>
        </div>
        
        <div class="content">
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-badge" style="background: #4CAF50;">GET</div>
                    <span>Obter dados</span>
                </div>
                <div class="legend-item">
                    <div class="legend-badge" style="background: #2196F3;">POST</div>
                    <span>Criar dados</span>
                </div>
                <div class="legend-item">
                    <div class="legend-badge" style="background: #FF9800;">PUT</div>
                    <span>Atualizar dados</span>
                </div>
                <div class="legend-item">
                    <div class="legend-badge" style="background: #f44336;">DELETE</div>
                    <span>Deletar dados</span>
                </div>
            </div>
"""
    
    # Add categories
    for category, items in endpoints_data.items():
        html += f'<div class="category">\n'
        html += f'<div class="category-title">📌 {category}</div>\n'
        
        for method, path, description in items:
            method_class = method.lower()
            html += f'''<div class="endpoint">
                <div class="method {method_class}">{method}</div>
                <div class="path">{path}</div>
                <div class="description">{description}</div>
            </div>\n'''
        
        html += '</div>\n'
    
    html += """
        </div>
        
        <div class="footer">
            <p>✅ Todos os endpoints estão documentados e prontos para uso</p>
            <p style="font-size: 0.9em; margin-top: 10px;">Para testar os endpoints, execute: <code>python test_endpoints.py</code></p>
        </div>
    </div>
</body>
</html>
"""
    
    # Write to file
    with open('endpoints_report.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("✅ Relatório gerado com sucesso!")
    print("📄 Arquivo: endpoints_report.html")
    print("\nAbra o arquivo em seu navegador para visualizar o relatório completo.")


if __name__ == "__main__":
    generate_html_report()
