/**
 * tokenStore — armazenamento de tokens JWT em memória.
 *
 * Os tokens vivem em variáveis de módulo (processo JavaScript).
 * Não há localStorage, sessionStorage, cookie, nem qualquer outro storage.
 *
 * Consequência intencional: ao recarregar a página os tokens perdem-se
 * e o utilizador tem de fazer login novamente. Isso é o comportamento
 * correcto quando não se usa storage persistente.
 *
 * api.ts e AuthContext.tsx importam este módulo para ler/escrever tokens.
 * Por ser um módulo singleton, ambos acedem ao mesmo estado em memória.
 */

let accessToken:  string | null = null;
let refreshToken: string | null = null;

export const tokenStore = {
  getAccess():  string | null { return accessToken;  },
  getRefresh(): string | null { return refreshToken; },

  set(tokens: { token: string; refreshToken: string }) {
    accessToken  = tokens.token;
    refreshToken = tokens.refreshToken;
  },

  clear() {
    accessToken  = null;
    refreshToken = null;
  },
};
