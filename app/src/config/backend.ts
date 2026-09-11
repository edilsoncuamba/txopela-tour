/**
 * Backend Configuration Manager
 * Permite mudar a URL do backend dinamicamente sem recompilar a aplicação
 */

interface BackendConfig {
  protocol: string;
  host: string;
  port: number;
  baseUrl: string;
  apiUrl: string;
}

class BackendConfigManager {
  private config: BackendConfig;
  private readonly STORAGE_KEY = 'txopela_backend_config';

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Carrega configuração do ambiente ou localStorage
   * PRIORIDADE: VITE_API_URL (env) > VITE_BACKEND_* (env) > localStorage > default hardcoded
   */
  private loadConfig(): BackendConfig {
    // 1. VITE_API_URL tem SEMPRE prioridade máxima (ex: http://192.168.88.89:8000/api)
    const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (envApiUrl) {
      try {
        const clean = envApiUrl.replace(/\/api\/?$/, ''); // remove /api do final
        const urlObj = new URL(clean);
        const protocol = urlObj.protocol.replace(':', '');
        const host = urlObj.hostname;
        const port = parseInt(urlObj.port || '80', 10);
        return this.buildConfig(protocol, host, port);
      } catch (e) {
        console.warn('VITE_API_URL inválida, tentando variáveis individuais:', e);
      }
    }

    // 2. Variáveis individuais do .env
    const envProtocol = import.meta.env.VITE_BACKEND_PROTOCOL as string | undefined;
    const envHost     = import.meta.env.VITE_BACKEND_HOST as string | undefined;
    const envPort     = import.meta.env.VITE_BACKEND_PORT as string | undefined;
    if (envHost) {
      const protocol = envProtocol || 'http';
      const host     = envHost;
      const port     = parseInt(envPort || '8000', 10);
      return this.buildConfig(protocol, host, port);
    }

    // 3. localStorage (só se não houver .env — permite override manual em dev)
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Erro ao carregar configuração armazenada:', e);
      }
    }

    // 4. Fallback default
    return this.buildConfig('http', 'localhost', 8000);
  }

  /**
   * Constrói objeto de configuração completo
   */
  private buildConfig(protocol: string, host: string, port: number): BackendConfig {
    const baseUrl = `${protocol}://${host}:${port}`;
    return {
      protocol,
      host,
      port,
      baseUrl,
      apiUrl: `${baseUrl}/api`,
    };
  }

  /**
   * Retorna configuração atual
   */
  getConfig(): BackendConfig {
    return { ...this.config };
  }

  /**
   * Retorna URL da API
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Retorna URL base do backend
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Muda a configuração do backend
   * @param protocol - http ou https
   * @param host - IP ou domínio do backend
   * @param port - Porta do backend
   */
  setBackendUrl(protocol: string, host: string, port: number): void {
    this.config = this.buildConfig(protocol, host, port);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    console.log('✅ Configuração de backend atualizada:', this.config);
    
    // Dispara evento para outras abas/windows
    window.dispatchEvent(new CustomEvent('backendConfigChanged', { detail: this.config }));
  }

  /**
   * Muda para URL completa
   * @param url - URL completa do backend (ex: http://192.168.137.124:8000)
   */
  setBackendFullUrl(url: string): void {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol.replace(':', '');
      const host = urlObj.hostname;
      const port = parseInt(urlObj.port || '80', 10);
      
      this.setBackendUrl(protocol, host, port);
    } catch (e) {
      console.error('URL inválida:', e);
      throw new Error('URL do backend inválida');
    }
  }

  /**
   * Reseta para configuração padrão
   */
  reset(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.config = this.loadConfig();
  }

  /**
   * Testa conectividade com o backend
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      return response.ok;
    } catch (e) {
      console.error('Erro ao testar conexão:', e);
      return false;
    }
  }

  /**
   * Retorna informações do backend
   */
  async getBackendInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Erro ao obter informações do backend:', e);
      return null;
    }
  }

  /**
   * Exibe informações de debug
   */
  debug(): void {
    console.group('🔧 Backend Configuration Debug');
    console.log('Configuração Atual:', this.config);
    console.log('URL da API:', this.getApiUrl());
    console.log('URL Base:', this.getBaseUrl());
    console.log('Storage Key:', this.STORAGE_KEY);
    console.log('Env Vars:', {
      VITE_BACKEND_PROTOCOL: import.meta.env.VITE_BACKEND_PROTOCOL,
      VITE_BACKEND_HOST: import.meta.env.VITE_BACKEND_HOST,
      VITE_BACKEND_PORT: import.meta.env.VITE_BACKEND_PORT,
      VITE_API_URL: import.meta.env.VITE_API_URL,
    });
    console.groupEnd();
  }
}

// Instância única exportada
export const backendConfig = new BackendConfigManager();

// Expõe globalmente no modo development
if (import.meta.env.DEV) {
  (window as any).backendConfig = backendConfig;
  console.log('💡 Dica: Use window.backendConfig no console para gerenciar o backend');
}
