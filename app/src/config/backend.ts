/**
 * Backend Configuration Manager
 * URL do backend carregada a partir de variáveis de ambiente (VITE_API_URL).
 * Sem localStorage. Configuração em memória apenas.
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

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Carrega configuração apenas a partir de variáveis de ambiente.
   * PRIORIDADE: VITE_API_URL > VITE_BACKEND_* > default hardcoded
   */
  private loadConfig(): BackendConfig {
    // 1. VITE_API_URL (ex: https://api-txopela-tour-3tdq.onrender.com)
    const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (envApiUrl) {
      try {
        const clean  = envApiUrl.replace(/\/api\/?$/, '');
        const urlObj = new URL(clean);
        return this.buildConfig(
          urlObj.protocol.replace(':', ''),
          urlObj.hostname,
          parseInt(urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'), 10),
        );
      } catch { /* cai para próxima opção */ }
    }

    // 2. Variáveis individuais
    const envHost     = import.meta.env.VITE_BACKEND_HOST     as string | undefined;
    const envProtocol = import.meta.env.VITE_BACKEND_PROTOCOL as string | undefined;
    const envPort     = import.meta.env.VITE_BACKEND_PORT     as string | undefined;
    if (envHost) {
      return this.buildConfig(
        envProtocol ?? 'https',
        envHost,
        parseInt(envPort ?? '443', 10),
      );
    }

    // 3. Fallback
    return this.buildConfig('https', 'api-txopela-tour-3tdq.onrender.com', 443);
  }

  private buildConfig(protocol: string, host: string, port: number): BackendConfig {
    const baseUrl = port === 80 || port === 443
      ? `${protocol}://${host}`
      : `${protocol}://${host}:${port}`;
    return { protocol, host, port, baseUrl, apiUrl: `${baseUrl}/api` };
  }

  getConfig():  BackendConfig { return { ...this.config }; }
  getApiUrl():  string        { return this.config.apiUrl;  }
  getBaseUrl(): string        { return this.config.baseUrl; }

  /** Muda URL em memória (sem persistência) */
  setBackendUrl(protocol: string, host: string, port: number): void {
    this.config = this.buildConfig(protocol, host, port);
  }

  setBackendFullUrl(url: string): void {
    try {
      const urlObj = new URL(url);
      this.setBackendUrl(
        urlObj.protocol.replace(':', ''),
        urlObj.hostname,
        parseInt(urlObj.port || '80', 10),
      );
    } catch { throw new Error('URL do backend inválida'); }
  }

  reset(): void {
    this.config = this.loadConfig();
  }

  async testConnection(): Promise<boolean> {
    try {
      const r = await fetch(`${this.config.baseUrl}/health/`, { headers: { Accept: 'application/json' } });
      return r.ok;
    } catch { return false; }
  }
}

export const backendConfig = new BackendConfigManager();

if (import.meta.env.DEV) {
  (window as any).backendConfig = backendConfig;
}
