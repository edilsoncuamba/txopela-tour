# Script PowerShell para testar resposta do endpoint /api/auth/register
# Execute: .\test-register-response.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE: Resposta do endpoint register" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Gerar email único
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$testEmail = "test-$timestamp@test.com"

Write-Host "Email de teste: $testEmail" -ForegroundColor Yellow
Write-Host ""

# Montar body do request
$body = @{
    name = "Test User"
    email = $testEmail
    password = "Test1234"
    role = "tourist"
    termsAccepted = $true
} | ConvertTo-Json

Write-Host "Enviando request para: http://192.168.88.89:8000/api/auth/register" -ForegroundColor Yellow
Write-Host ""

try {
    # Fazer request
    $response = Invoke-WebRequest `
        -Uri "http://192.168.88.89:8000/api/auth/register" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing

    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Resposta completa:" -ForegroundColor Cyan
    Write-Host "-------------------" -ForegroundColor DarkGray
    
    # Parse JSON e mostrar bonito
    $jsonResponse = $response.Content | ConvertFrom-Json
    $jsonResponse | ConvertTo-Json -Depth 10
    
    Write-Host ""
    Write-Host "🔍 Análise da resposta:" -ForegroundColor Cyan
    Write-Host "-------------------" -ForegroundColor DarkGray
    
    # Verificar campos importantes
    $hasToken = $null -ne $jsonResponse.token -or $null -ne $jsonResponse.access_token -or $null -ne $jsonResponse.access
    $hasRefresh = $null -ne $jsonResponse.refreshToken -or $null -ne $jsonResponse.refresh_token -or $null -ne $jsonResponse.refresh
    $hasUser = $null -ne $jsonResponse.user -or $null -ne $jsonResponse.data.user
    $hasUserId = $null -ne $jsonResponse.id -or $null -ne $jsonResponse.user.id -or $null -ne $jsonResponse.data.user.id
    
    if ($hasToken) {
        Write-Host "✅ Token encontrado" -ForegroundColor Green
        if ($jsonResponse.token) { Write-Host "   → Chave: 'token'" -ForegroundColor DarkGray }
        if ($jsonResponse.access_token) { Write-Host "   → Chave: 'access_token'" -ForegroundColor DarkGray }
        if ($jsonResponse.access) { Write-Host "   → Chave: 'access'" -ForegroundColor DarkGray }
    } else {
        Write-Host "❌ Token NÃO encontrado!" -ForegroundColor Red
        Write-Host "   O backend deve retornar 'token', 'access_token' ou 'access'" -ForegroundColor Yellow
    }
    
    if ($hasRefresh) {
        Write-Host "✅ Refresh token encontrado" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Refresh token não encontrado (opcional)" -ForegroundColor Yellow
    }
    
    if ($hasUser) {
        Write-Host "✅ Dados do user encontrados" -ForegroundColor Green
        if ($hasUserId) {
            Write-Host "   ✅ user.id presente" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  user.id não encontrado" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Dados do user não encontrados" -ForegroundColor Yellow
        Write-Host "   Frontend vai chamar /api/auth/me para buscar perfil" -ForegroundColor DarkGray
    }
    
    Write-Host ""
    Write-Host "📊 Formato da resposta:" -ForegroundColor Cyan
    if ($jsonResponse.token -and $jsonResponse.user) {
        Write-Host "   → Formato padrão Django REST" -ForegroundColor Green
    } elseif ($jsonResponse.access_token) {
        Write-Host "   → Formato JWT com access_token" -ForegroundColor Green
    } elseif ($jsonResponse.access) {
        Write-Host "   → Formato SimpleJWT (access/refresh)" -ForegroundColor Green
    } else {
        Write-Host "   → Formato customizado" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎯 Compatibilidade com frontend:" -ForegroundColor Cyan
    if ($hasToken) {
        Write-Host "   ✅ Frontend vai salvar token no localStorage" -ForegroundColor Green
        if ($hasUser -and $hasUserId) {
            Write-Host "   ✅ Frontend vai definir user imediatamente" -ForegroundColor Green
            Write-Host "   ✅ Transição deve funcionar!" -ForegroundColor Green
        } elseif ($hasToken) {
            Write-Host "   ⚠️  Frontend vai chamar refreshUser() para buscar perfil" -ForegroundColor Yellow
            Write-Host "   ✅ Transição deve funcionar mesmo assim" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ SEM TOKEN = Frontend não vai conseguir autenticar!" -ForegroundColor Red
        Write-Host "   → Vai tentar login automático mas pode falhar" -ForegroundColor Yellow
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    $errorBody = $_.ErrorDetails.Message
    
    Write-Host "❌ Erro: Status $statusCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Resposta de erro:" -ForegroundColor Cyan
    Write-Host "-------------------" -ForegroundColor DarkGray
    Write-Host $errorBody
    
    Write-Host ""
    Write-Host "💡 Possíveis causas:" -ForegroundColor Yellow
    if ($statusCode -eq 400) {
        Write-Host "   → Dados inválidos ou email já existe" -ForegroundColor DarkGray
        Write-Host "   → Tente com outro email: test-$([DateTimeOffset]::Now.ToUnixTimeSeconds())@test.com" -ForegroundColor DarkGray
    } elseif ($statusCode -eq 500) {
        Write-Host "   → Erro no servidor Django" -ForegroundColor DarkGray
        Write-Host "   → Verificar logs do backend" -ForegroundColor DarkGray
    } else {
        Write-Host "   → Verificar logs do backend para mais detalhes" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Teste concluído" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
