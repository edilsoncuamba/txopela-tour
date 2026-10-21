/**
 * permissions.ts — Matriz de permissões por tipo de perfil (Txopela Tour)
 *
 * Matriz implementada:
 *
 *  ┌─────────────────┬────────────┬────────┬─────────┐
 *  │ Tipo de perfil  │ Publicação │ Local  │ Serviço │
 *  ├─────────────────┼────────────┼────────┼─────────┤
 *  │ traveler        │     ✅     │   ❌   │   ❌    │
 *  │ resident        │     ✅     │   ❌   │   ❌    │
 *  │ guide           │     ✅     │   ❌   │   ❌    │
 *  │ business        │     ✅     │   ✅   │   ✅    │
 *  └─────────────────┴────────────┴────────┴─────────┘
 *
 * Regras:
 * - Viajantes e moradores locais podem criar apenas publicações gerais.
 * - Negócios podem criar publicações, locais (com aprovação) e serviços (com aprovação).
 * - Publicações gerais nunca precisam de aprovação.
 * - Locais e serviços ficam pendentes até aprovação pelo admin/curador.
 *
 * As permissões são verificadas no frontend para controlar a UI,
 * E no backend para bloquear pedidos directos à API (segurança real).
 *
 * Campos usados:
 *   user.type  — tipo interno mapeado: 'traveler' | 'resident' | 'guide' | 'business'
 *   user.role  — role raw do OpenAPI: 'tourist' | 'local_resident' | 'local_business' |
 *                                     'guide' | 'curator' | 'admin'
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Tipos internos do utilizador (campo `type` do modelo User) */
export type UserType = 'traveler' | 'resident' | 'guide' | 'business';

/** Roles raw do OpenAPI (campo `role` do modelo User) */
export type UserRole =
  | 'tourist'
  | 'local_resident'
  | 'local_business'
  | 'guide'
  | 'curator'
  | 'admin';

// ── Constantes ────────────────────────────────────────────────────────────────

/**
 * Tipos internos que podem criar Locais e Serviços.
 * Apenas 'business' — guias não têm esta permissão.
 */
export const BUSINESS_TYPES: readonly UserType[] = ['business'] as const;

/**
 * Roles raw do OpenAPI que podem criar Locais e Serviços.
 *
 * Conforme openapi-schema-1.json (fonte de verdade):
 *   UserRoleEnum: ['tourist', 'local_resident', 'local_business', 'curator', 'admin']
 *   RegisterRoleEnum: ['tourist', 'local_resident', 'business']
 *
 * O Register.tsx envia 'business' (único valor aceite no RegisterRoleEnum).
 * O backend converte 'business' → 'local_business' internamente ao registar.
 * O token JWT devolvido contém 'local_business' como role.
 *
 * 'business' é mantido aqui como alias de compatibilidade para sessões
 * activas onde o token ainda contém o valor antigo.
 *
 * 'guide' NÃO está incluído — guias só podem criar posts.
 */
export const BUSINESS_ROLES: readonly string[] = [
  'local_business',  // role interno devolvido pelo backend após registo
  'business',        // alias de compatibilidade para tokens antigos
  'curator',
  'admin',
] as const;

/**
 * Todos os tipos podem criar publicações gerais (qualquer autenticado).
 */
export const POST_TYPES: readonly UserType[] = [
  'traveler',
  'resident',
  'guide',
  'business',
] as const;

// ── Funções de permissão ──────────────────────────────────────────────────────

/**
 * Verifica se o utilizador pode criar Locais e Serviços.
 *
 * Verificado em:
 * - Formulários AddLocal e AddService (esconde/mostra o form)
 * - SuggestScreen (apresenta ou não as opções de local/serviço)
 * - Tab 'add' do App.tsx (decide o fluxo de submissão)
 *
 * @param role  - role raw do backend (ex: 'tourist', 'local_business', 'admin')
 * @param type  - tipo interno mapeado (ex: 'business', 'traveler')
 */
export function canCreateBusiness(
  role?: string | null,
  type?: string | null,
): boolean {
  if (role && (BUSINESS_ROLES as string[]).includes(role)) return true;
  if (type && (BUSINESS_TYPES as string[]).includes(type)) return true;
  return false;
}

/**
 * Verifica se o utilizador pode criar apenas publicações gerais
 * (viajante, morador local ou guia — sem acesso a locais/serviços).
 *
 * @param role  - role raw do backend
 * @param type  - tipo interno mapeado
 */
export function canCreatePostOnly(
  role?: string | null,
  type?: string | null,
): boolean {
  // Se pode criar negócios, não é "post only"
  if (canCreateBusiness(role, type)) return false;
  // Qualquer utilizador autenticado pode criar posts
  return true;
}

/**
 * Decide se deve mostrar o formulário multi-opção (SuggestScreen)
 * ou ir directamente para AddPost.
 *
 * Negócios → SuggestScreen (escolhem entre local, serviço ou publicação)
 * Outros   → directamente para AddPost
 *
 * @param role  - role raw do backend
 * @param type  - tipo interno mapeado
 */
export function shouldShowSuggestScreen(
  role?: string | null,
  type?: string | null,
): boolean {
  return canCreateBusiness(role, type);
}

/**
 * @deprecated Usar shouldShowSuggestScreen ou canCreateBusiness em vez deste.
 * Mantido por compatibilidade com código existente que ainda o usa.
 */
export function shouldShowServiceForm(
  role?: string | null,
  type?: string | null,
): boolean {
  return canCreateBusiness(role, type);
}

// ── Mensagens de UI ───────────────────────────────────────────────────────────

export const UPGRADE_MESSAGE =
  'Apenas contas do tipo Negócio podem criar locais e serviços. ' +
  'Actualiza o teu perfil para aceder a esta funcionalidade.';

export const UPGRADE_STEPS = [
  'Acede às configurações do teu perfil.',
  'Selecciona o tipo de conta "Negócio".',
  'Completa o processo de verificação.',
  'Após aprovação, poderás criar locais e serviços.',
];

// ── Etiquetas de perfil ───────────────────────────────────────────────────────

/** Etiqueta legível por humanos para cada tipo de perfil. */
export const PROFILE_TYPE_LABELS: Record<UserType, string> = {
  traveler: 'Viajante',
  resident: 'Morador Local',
  guide:    'Guia Turístico',
  business: 'Negócio',
};

/** Etiqueta legível por humanos para cada role OpenAPI. */
export const ROLE_LABELS: Record<string, string> = {
  tourist:        'Viajante',
  local_resident: 'Morador Local',
  guide:          'Guia Turístico',
  local_business: 'Negócio',
  curator:        'Curador',
  admin:          'Administrador',
};
