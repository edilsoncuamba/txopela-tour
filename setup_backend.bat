@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Txopela Tour - Setup Completo
echo ========================================
echo.

REM Verificar se está no diretório correto
if not exist "create_test_accounts.py" (
    echo ❌ ERRO: Não encontrei os scripts!
    echo    Execute este .bat na raiz do projeto.
    pause
    exit /b 1
)

REM Perguntar onde está o backend
echo 📁 Onde está o diretório do backend?
echo    (o diretório que contém manage.py)
echo.
set /p BACKEND_DIR="Digite o caminho (ex: backend): "

if not exist "%BACKEND_DIR%\manage.py" (
    echo ❌ ERRO: manage.py não encontrado em %BACKEND_DIR%
    pause
    exit /b 1
)

echo.
echo ✅ Backend encontrado: %BACKEND_DIR%
echo.

REM Passo 1: Criar contas de teste
echo ========================================
echo 📝 Passo 1/3: Criando contas de teste...
echo ========================================
echo.
cd %BACKEND_DIR%
python ..\create_test_accounts.py
if errorlevel 1 (
    echo ❌ ERRO ao criar contas!
    cd ..
    pause
    exit /b 1
)
echo.
echo ✅ Contas criadas com sucesso!
echo.

REM Passo 2: Popular locais
echo ========================================
echo 📍 Passo 2/3: Criando locais de exemplo...
echo ========================================
echo.
python ..\seed_locals_quick.py
if errorlevel 1 (
    echo ❌ ERRO ao criar locais!
    cd ..
    pause
    exit /b 1
)
echo.
echo ✅ Locais criados com sucesso!
echo.

REM Voltar ao diretório original
cd ..

REM Passo 3: Testar endpoints
echo ========================================
echo 🧪 Passo 3/3: Testando endpoints...
echo ========================================
echo.

echo 📡 Testando /api/locals...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://192.168.88.89:8000/api/locals?limit=2' -UseBasicParsing; Write-Host '✅ Endpoint OK:'; Write-Host ($r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2) } catch { Write-Host '❌ Erro:' $_.Exception.Message }"
echo.

echo 📡 Testando login...
powershell -Command "$body = @{email='turista@gmail.com';password='T123456'} | ConvertTo-Json; try { $r = Invoke-WebRequest -Uri 'http://192.168.88.89:8000/api/auth/login' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host '✅ Login OK:'; Write-Host ($r.Content | ConvertFrom-Json | Select-Object -Property success,user | ConvertTo-Json) } catch { Write-Host '❌ Erro:' $_.Exception.Message }"
echo.

echo ========================================
echo ✅ SETUP COMPLETO!
echo ========================================
echo.
echo 📋 CREDENCIAIS DE TESTE:
echo.
echo    🧳 Turista:
echo       Email: turista@gmail.com
echo       Senha: T123456
echo.
echo    🎯 Guia:
echo       Email: servico@gmail.com
echo       Senha: S123456
echo.
echo    🏢 Negócio:
echo       Email: negociantenormal@gmail.com
echo       Senha: N123456
echo.
echo 🌐 Próximos passos:
echo    1. Abrir: http://localhost:5173
echo    2. Fazer login com uma das contas acima
echo    3. Ir para "Descobertas"
echo    4. Ver os 10 locais criados!
echo.
echo ========================================
pause
