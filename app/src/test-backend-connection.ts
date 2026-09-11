// Teste de conexão com o backend
import { authApi } from './services/api';

export async function testBackendConnection() {
  const backendUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://192.168.88.127:8000';
  
  console.log('🔗 Testando conexão com backend:', backendUrl);
  
  // 1. Teste básico de conectividade
  try {
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend conectado:', data);
    } else {
      console.log('⚠️  Backend respondeu com status:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com backend:', error);
  }
  
  // 2. Teste das contas de demonstração
  console.log('\n🧪 Testando contas de demonstração...');
  
  const testAccounts = [
    { email: 'servico@gmail.com', password: 'S123456', type: 'Provedor de Serviços' },
    { email: 'negociantenormal@gmail.com', password: 'N123456', type: 'Negociante/Empresa' },
    { email: 'turista@gmail.com', password: 'T123456', type: 'Turista' }
  ];
  
  for (const account of testAccounts) {
    try {
      console.log(`\n🔐 Testando login: ${account.email} (${account.type})`);
      
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: account.email, 
          password: account.password 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login bem-sucedido');
        console.log('   Token:', data.token ? 'Presente' : 'Ausente');
        console.log('   User Role:', data.user?.role || 'Não informado');
        console.log('   User Type (Frontend):', mapRoleToType(data.user?.role));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Login falhou:', response.status, errorData);
      }
    } catch (error) {
      console.log('❌ Erro no teste de login:', error);
    }
  }
}

function mapRoleToType(role: string): string {
  if (role === 'guide' || role === 'curator') return 'guide (Mostra "Sugerir Serviço")';
  if (role === 'business' || role === 'admin') return 'business (Mostra "Sugerir Serviço")';
  return 'traveler (Mostra "Sugerir Local")';
}

// Execute o teste quando este módulo for importado
testBackendConnection();