# Script para testar conectividade direta com o backend
# Execute: .\test-backend-connectivity.ps1

$BACKEND_URL = "http://192.168.0.124:8000"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE: Conectividade com Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Yellow
Write-Host ""

# ========================================
# Teste 1: Backend está online?
# ========================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Teste 1: Backend está online?" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend está online!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor DarkGray
} catch {
    Write-Host "❌ Backend não está acessível!" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "💡 Verifique:" -ForegroundColor Yellow
    Write-Host "   1. Backend Django está rodando?" -ForegroundColor DarkGray
    Write-Host "   2. URL está correta? ($BACKEND_URL)" -ForegroundColor DarkGray
    Write-Host "   3. Firewall permite conexão?" -ForegroundColor DarkGray
    Write-Host ""
    exit 1
}

Write-Host ""

# ========================================
# Teste 2: Endpoint de Login
# ========================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Teste 2: Endpoint de Login" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$loginBody = @{
    email = "test@test.com"
    password = "wrongpassword"
} | ConvertTo-Json

Write-Host "URL: $BACKEND_URL/api/auth/login" -ForegroundColor DarkGray
Write-Host "Body: $loginBody" -ForegroundColor DarkGray
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "$BACKEND_URL/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✅ Endpoint de login responde!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "📦 Resposta:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    $errorBody = $_.ErrorDetails.Message
    
    if ($statusCode -eq 400 -or $statusCode -eq 401) {
        Write-Host "✅ Endpoint de login responde (credenciais inválidas esperado)" -ForegroundColor Green
        Write-Host "   Status: $statusCode" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "📦 Resposta de erro (esperada):" -ForegroundColor Yellow
        Write-Host $errorBody
    } else {
        Write-Host "⚠️  Endpoint de login retornou erro inesperado" -ForegroundColor Yellow
        Write-Host "   Status: $statusCode" -ForegroundColor DarkGray
        Write-Host "   Erro: $errorBody" -ForegroundColor DarkGray
    }
}

Write-Host ""

# ========================================
# Teste 3: Endpoint de Register
# ========================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Teste 3: Endpoint de Register" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$testEmail = "connectivity-test-$timestamp@test.com"

$registerBody = @{
    name = "Connectivity Test"
    email = $testEmail
    password = "Test1234"
    role = "tourist"
    termsAccepted = $true
} | ConvertTo-Json

Write-Host "URL: $BACKEND_URL/api/auth/register" -ForegroundColor DarkGray
Write-Host "Email de teste: $testEmail" -ForegroundColor DarkGray
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "$BACKEND_URL/api/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✅ Endpoint de register responde!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "📦 Resposta:" -ForegroundColor Cyan
    $jsonResponse = $response.Content | ConvertFrom-Json
    $jsonResponse | ConvertTo-Json -Depth 5
    Write-Host ""
    
    # Analisar resposta
    $hasToken = $null -ne $jsonResponse.token -or $null -ne $jsonResponse.access_token -or $null -ne $jsonResponse.access
    $hasUser = $null -ne $jsonResponse.user -or $null -ne $jsonResponse.data.user
    
    Write-Host "🔍 Análise da resposta:" -ForegroundColor Cyan
    if ($hasToken) {
        Write-Host "   ✅ Token presente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Token ausente (frontend vai tentar login automático)" -ForegroundColor Yellow
    }
    
    if ($hasUser) {
        Write-Host "   ✅ User presente" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  User ausente (frontend vai chamar /api/auth/me)" -ForegroundColor Yellow
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    $errorBody = $_.ErrorDetails.Message
    
    Write-Host "❌ Endpoint de register retornou erro" -ForegroundColor Red
    Write-Host "   Status: $statusCode" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "📦 Resposta de erro:" -ForegroundColor Yellow
    Write-Host $errorBody
    Write-Host ""
    
    if ($statusCode -eq 400) {
        Write-Host "💡 Possível causa: Validação de dados" -ForegroundColor Yellow
    } elseif ($statusCode -eq 500) {
        Write-Host "💡 Possível causa: Erro no servidor Django" -ForegroundColor Yellow
        Write-Host "   Verificar logs do backend para mais detalhes" -ForegroundColor DarkGray
    }
}

Write-Host ""

# ========================================
# Teste 4: CORS (Cross-Origin)
# ========================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Teste 4: CORS Headers" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "$BACKEND_URL/api/" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "http://localhost:5173"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -UseBasicParsing
    
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    
    if ($corsHeader) {
        Write-Host "✅ CORS configurado!" -ForegroundColor Green
        Write-Host "   Access-Control-Allow-Origin: $corsHeader" -ForegroundColor DarkGray
    } else {
        Write-Host "⚠️  CORS header não encontrado" -ForegroundColor Yellow
        Write-Host "   Pode causar problemas no browser" -ForegroundColor DarkGray
    }
    
} catch {
    Write-Host "⚠️  Não foi possível verificar CORS" -ForegroundColor Yellow
    Write-Host "   Isso é normal em alguns servidores" -ForegroundColor DarkGray
}

Write-Host ""

# ========================================
# Resumo Final
# ========================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📊 Resumo dos Testes" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "Resultados:" -ForegroundColor White
Write-Host "  1. Backend online? " -NoNewline
Write-Host "Verificado acima" -ForegroundColor DarkGray
Write-Host "  2. Login endpoint? " -NoNewline
Write-Host "Verificado acima" -ForegroundColor DarkGray
Write-Host "  3. Register endpoint? " -NoNewline
Write-Host "Verificado acima" -ForegroundColor DarkGray
Write-Host "  4. CORS headers? " -NoNewline
Write-Host "Verificado acima" -ForegroundColor DarkGray
Write-Host ""

Write-Host "🎯 Conclusão:" -ForegroundColor Cyan
Write-Host "Se todos os testes passaram, o frontend DEVE conseguir" -ForegroundColor White
Write-Host "se comunicar com o backend sem problemas." -ForegroundColor White
Write-Host ""
Write-Host "Se algum teste falhou, verificar:" -ForegroundColor Yellow
Write-Host "  • Backend Django está rodando?" -ForegroundColor DarkGray
Write-Host "  • Firewall permite conexão?" -ForegroundColor DarkGray
Write-Host "  • CORS está configurado no Django?" -ForegroundColor DarkGray
Write-Host "  • URL no .env está correta?" -ForegroundColor DarkGray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Teste concluído" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
