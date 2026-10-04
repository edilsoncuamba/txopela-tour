/**
 * API Integration Tests
 * Testa os endpoints de autenticação e perfil do usuário
 * 
 * Para executar: npm run test -- api.test.ts
 * Ou manualmente no console do browser usando as funções abaixo
 */

import { authApi, usersApi } from './api';
import { backendConfig } from '@/config/backend';
import { tokenStore } from '@/services/tokenStore';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HELPER FUNCTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Simula um teste de API
 */
async function runApiTest(
  name: string,
  testFn: () => Promise<void>
): Promise<{ success: boolean; error?: string; time: number }> {
  const startTime = performance.now();
  
  try {
    console.log(`🧪 Iniciando teste: ${name}`);
    await testFn();
    const time = performance.now() - startTime;
    console.log(`✅ PASSOU: ${name} (${time.toFixed(2)}ms)`);
    return { success: true, time };
  } catch (error: any) {
    const time = performance.now() - startTime;
    const errorMsg = error?.message || String(error);
    console.log(`❌ FALHOU: ${name} (${time.toFixed(2)}ms) - ${errorMsg}`);
    return { success: false, error: errorMsg, time };
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIGURAÇÃO E DIAGNOSTICOS
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function checkBackendConnection(): Promise<boolean> {
  console.log('\n📡 Testando conexão com backend...');
  console.log(`Backend URL: ${backendConfig.getBaseUrl()}`);
  console.log(`API URL: ${backendConfig.getApiUrl()}`);
  
  const isConnected = await backendConfig.testConnection();
  if (isConnected) {
    console.log('✅ Conectado ao backend!');
  } else {
    console.log('❌ Erro: Não foi possível conectar ao backend');
    console.log('Verifique se o servidor está rodando em:', backendConfig.getBaseUrl());
  }
  
  return isConnected;
}

export function showBackendDebug(): void {
  backendConfig.debug();
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TESTES DE AUTENTICAÇÃO
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Teste: POST /api/auth/register
 * Testa o registro de novo usuário
 */
export const testRegister = async (
  email: string = `test-${Date.now()}@txopela.co.mz`,
  name: string = 'Teste User',
  password: string = 'Test@12345'
): Promise<void> => {
  const userData = {
    email,
    name,
    password,
    role: 'tourist',
    termsAccepted: true,
  };

  console.log('\n📝 Testando registro de usuário...');
  console.log('Dados enviados:', userData);

  try {
    const response = await authApi.register(userData);
    console.log('✅ Registro bem-sucedido!');
    console.log('Response:', response);
    
    // Guarda os tokens em memória via tokenStore (sem localStorage)
    if (response.token && response.refreshToken) {
      tokenStore.set({ token: response.token, refreshToken: response.refreshToken });
      console.log('✅ Tokens guardados em memória (tokenStore)');
    }
    
    return response;
  } catch (error: any) {
    console.error('❌ Erro no registro:', error.message);
    throw error;
  }
};

/**
 * Teste: POST /api/auth/login
 * Testa o login de usuário existente
 */
export const testLogin = async (
  email: string = 'servico@gmail.com',
  password: string = 'S123456'
): Promise<void> => {
  console.log('\n🔐 Testando login...');
  console.log('Email:', email);

  try {
    const response = await authApi.login(email, password);
    console.log('✅ Login bem-sucedido!');
    console.log('User:', response.user);
    console.log('Token:', response.token?.substring(0, 20) + '...');
    
    return response;
  } catch (error: any) {
    console.error('❌ Erro no login:', error.message);
    throw error;
  }
};

/**
 * Teste: GET /api/users/me
 * Busca o perfil do usuário autenticado
 */
export const testGetProfile = async (): Promise<void> => {
  const token = tokenStore.getAccess();

  if (!token) {
    throw new Error('Nenhum token encontrado. Faça login primeiro!');
  }

  console.log('\n👤 Testando busca de perfil...');

  try {
    const response = await usersApi.getProfile();
    console.log('✅ Perfil obtido!');
    console.log('Dados:', response);
    
    return response;
  } catch (error: any) {
    console.error('❌ Erro ao buscar perfil:', error.message);
    throw error;
  }
};

/**
 * Teste: PUT /api/users/me
 * Atualiza o perfil do usuário
 */
export const testUpdateProfile = async (
  updateData: any = { bio: 'Updated bio', name: 'Updated Name' }
): Promise<void> => {
  const token = tokenStore.getAccess();

  if (!token) {
    throw new Error('Nenhum token encontrado. Faça login primeiro!');
  }

  console.log('\n✏️ Testando atualização de perfil...');
  console.log('Dados a atualizar:', updateData);

  try {
    const response = await usersApi.updateProfile(updateData);
    console.log('✅ Perfil atualizado!');
    console.log('Resposta:', response);
    
    return response;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar perfil:', error.message);
    throw error;
  }
};

/**
 * Teste: POST /api/auth/refresh
 * Renova o token de acesso
 */
export const testRefreshToken = async (): Promise<void> => {
  console.log('\n🔄 Testando renovação de token...');

  try {
    const result = await authApi.refresh();
    if (result) {
      console.log('✅ Token renovado com sucesso!');
    } else {
      console.log('❌ Falha ao renovar token');
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Erro ao renovar token:', error.message);
    throw error;
  }
};

/**
 * Teste: POST /api/auth/logout
 * Faz logout do usuário
 */
export const testLogout = async (): Promise<void> => {
  console.log('\n🚪 Testando logout...');

  try {
    authApi.logout();
    console.log('✅ Logout realizado!');
    console.log('Tokens removidos da memória (tokenStore)');
    
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao fazer logout:', error.message);
    throw error;
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SUITE DE TESTES COMPLETA
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function runFullAuthTestSuite(): Promise<void> {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        TESTE COMPLETO DE AUTENTICAÇÃO E PERFIL            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results: { name: string; success: boolean; time: number }[] = [];

  // 1. Verificar conexão
  const connected = await checkBackendConnection();
  if (!connected) {
    console.log('\n⚠️ AVISO: Backend não está conectado. Alguns testes podem falhar.');
  }

  // 2. Teste de Registro
  const testEmail = `test-${Date.now()}@txopela.co.mz`;
  const registerResult = await runApiTest('Registro de novo usuário', () =>
    testRegister(testEmail, 'Teste User', 'Test@12345')
  );
  results.push({ name: 'Registro', ...registerResult });

  if (registerResult.success) {
    // 3. Teste de Perfil
    const profileResult = await runApiTest('Buscar perfil do usuário', testGetProfile);
    results.push({ name: 'Buscar Perfil', ...profileResult });

    // 4. Teste de Atualização de Perfil
    const updateResult = await runApiTest('Atualizar perfil do usuário', () =>
      testUpdateProfile({ bio: 'Updated via test suite' })
    );
    results.push({ name: 'Atualizar Perfil', ...updateResult });

    // 5. Teste de Logout
    const logoutResult = await runApiTest('Logout do usuário', testLogout);
    results.push({ name: 'Logout', ...logoutResult });
  }

  // 6. Teste de Login (usando credencial de teste padrão)
  const loginResult = await runApiTest('Login com credenciais padrão', () =>
    testLogin('servico@gmail.com', 'S123456')
  );
  results.push({ name: 'Login', ...loginResult });

  if (loginResult.success) {
    // 7. Teste de Refresh Token
    const refreshResult = await runApiTest('Renovar token', testRefreshToken);
    results.push({ name: 'Refresh Token', ...refreshResult });

    // 8. Logout final
    await testLogout();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESUMO DE RESULTADOS
  // ─────────────────────────────────────────────────────────────────────────

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    RESUMO DOS TESTES                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.time, 0);

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name.padEnd(30)} ${result.time.toFixed(2)}ms`);
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`Total: ${results.length} testes | ${passed} passaram | ${failed} falharam`);
  console.log(`Tempo total: ${totalTime.toFixed(2)}ms`);
  console.log('─'.repeat(60) + '\n');

  if (failed === 0) {
    console.log('🎉 Todos os testes passaram!');
  } else {
    console.log(`⚠️ ${failed} teste(s) falharam. Verifique os detalhes acima.`);
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * COMO USAR NO CONSOLE DO BROWSER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Para testar no console do browser (F12 → Console):
 *
 * 1. Checar conexão:
 *    import { checkBackendConnection } from '@/services/api.test'
 *    await checkBackendConnection()
 *
 * 2. Ver debug info:
 *    import { showBackendDebug } from '@/services/api.test'
 *    showBackendDebug()
 *
 * 3. Registrar novo usuário:
 *    import { testRegister } from '@/services/api.test'
 *    await testRegister()
 *
 * 4. Fazer login:
 *    import { testLogin } from '@/services/api.test'
 *    await testLogin('servico@gmail.com', 'S123456')
 *
 * 5. Buscar perfil:
 *    import { testGetProfile } from '@/services/api.test'
 *    await testGetProfile()
 *
 * 6. Executar todos os testes:
 *    import { runFullAuthTestSuite } from '@/services/api.test'
 *    await runFullAuthTestSuite()
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
