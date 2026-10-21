/**
 * permissions.test.ts
 * ===================
 * Testes unitários das funções de permissão — Modelo de publicações por perfil.
 *
 * Cobre os cenários obrigatórios do lado do frontend:
 *   1. Viajante — só pode criar posts
 *   2. Morador local — só pode criar posts
 *   3. Negócio — pode criar posts, locais e serviços
 *   6. Viajante NÃO vê opções de local/serviço
 *   7. Morador NÃO vê opções de local/serviço
 *   Regras de mapeamento de role para a UI
 *
 * Execução:
 *   cd app
 *   npm run test:run
 */

import { describe, it, expect } from 'vitest';
import {
  canCreateBusiness,
  canCreatePostOnly,
  shouldShowSuggestScreen,
  shouldShowServiceForm,
  BUSINESS_ROLES,
  BUSINESS_TYPES,
  POST_TYPES,
  PROFILE_TYPE_LABELS,
  ROLE_LABELS,
} from './permissions';

// ─────────────────────────────────────────────────────────────────────────────
// canCreateBusiness()
// ─────────────────────────────────────────────────────────────────────────────

describe('canCreateBusiness()', () => {

  describe('Tipos que NÃO podem criar locais/serviços', () => {
    it('viajante (type=traveler) — FALSE', () => {
      expect(canCreateBusiness('tourist', 'traveler')).toBe(false);
    });

    it('morador local (type=resident) — FALSE', () => {
      expect(canCreateBusiness('local_resident', 'resident')).toBe(false);
    });

    it('role tourist sem type — FALSE', () => {
      expect(canCreateBusiness('tourist', null)).toBe(false);
    });

    it('role local_resident sem type — FALSE', () => {
      expect(canCreateBusiness('local_resident', undefined)).toBe(false);
    });

    it('sem role nem type — FALSE', () => {
      expect(canCreateBusiness(null, null)).toBe(false);
      expect(canCreateBusiness(undefined, undefined)).toBe(false);
    });

    it('role desconhecido — FALSE', () => {
      expect(canCreateBusiness('unknown_role', 'unknown_type')).toBe(false);
    });
  });

  describe('Tipos que PODEM criar locais/serviços', () => {
    it('negócio via type=business — TRUE', () => {
      expect(canCreateBusiness(null, 'business')).toBe(true);
    });

    it('negócio via role=local_business — TRUE', () => {
      expect(canCreateBusiness('local_business', null)).toBe(true);
    });

    it('negócio via role=business — TRUE', () => {
      expect(canCreateBusiness('business', null)).toBe(true);
    });

    it('curador via role=curator — TRUE (para gestão)', () => {
      expect(canCreateBusiness('curator', null)).toBe(true);
    });

    it('admin via role=admin — TRUE', () => {
      expect(canCreateBusiness('admin', null)).toBe(true);
    });

    it('negócio com ambos role e type — TRUE', () => {
      expect(canCreateBusiness('local_business', 'business')).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// canCreatePostOnly()
// ─────────────────────────────────────────────────────────────────────────────

describe('canCreatePostOnly()', () => {
  it('viajante — TRUE (só posts)', () => {
    expect(canCreatePostOnly('tourist', 'traveler')).toBe(true);
  });

  it('morador local — TRUE (só posts)', () => {
    expect(canCreatePostOnly('local_resident', 'resident')).toBe(true);
  });

  it('negócio — FALSE (tem acesso a mais do que posts)', () => {
    expect(canCreatePostOnly('local_business', 'business')).toBe(false);
  });

  it('admin — FALSE', () => {
    expect(canCreatePostOnly('admin', 'guide')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// shouldShowSuggestScreen()
// ─────────────────────────────────────────────────────────────────────────────

describe('shouldShowSuggestScreen()', () => {
  it('viajante — FALSE (vai directamente para AddPost)', () => {
    expect(shouldShowSuggestScreen('tourist', 'traveler')).toBe(false);
  });

  it('morador local — FALSE (vai directamente para AddPost)', () => {
    expect(shouldShowSuggestScreen('local_resident', 'resident')).toBe(false);
  });

  it('negócio — TRUE (mostra SuggestScreen com 3 opções)', () => {
    expect(shouldShowSuggestScreen('local_business', 'business')).toBe(true);
  });

  it('curador — TRUE', () => {
    expect(shouldShowSuggestScreen('curator', 'guide')).toBe(true);
  });

  it('sem dados — FALSE (default seguro)', () => {
    expect(shouldShowSuggestScreen(null, null)).toBe(false);
    expect(shouldShowSuggestScreen(undefined, undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// shouldShowServiceForm() — alias deprecated, deve comportar-se igual a shouldShowSuggestScreen
// ─────────────────────────────────────────────────────────────────────────────

describe('shouldShowServiceForm() — alias deprecated', () => {
  it('tem o mesmo comportamento que shouldShowSuggestScreen()', () => {
    const cases: [string | null | undefined, string | null | undefined][] = [
      ['tourist', 'traveler'],
      ['local_resident', 'resident'],
      ['local_business', 'business'],
      ['curator', 'guide'],
      [null, null],
    ];
    for (const [role, type] of cases) {
      expect(shouldShowServiceForm(role, type)).toBe(shouldShowSuggestScreen(role, type));
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Constantes — integridade
// ─────────────────────────────────────────────────────────────────────────────

describe('Constantes de permissão', () => {
  it('BUSINESS_TYPES contém apenas business', () => {
    expect(BUSINESS_TYPES).toContain('business');
    expect(BUSINESS_TYPES).not.toContain('traveler');
    expect(BUSINESS_TYPES).not.toContain('resident');
    expect(BUSINESS_TYPES).not.toContain('guide');
  });

  it('BUSINESS_ROLES contém local_business, curator, admin', () => {
    expect(BUSINESS_ROLES).toContain('local_business');
    expect(BUSINESS_ROLES).toContain('curator');
    expect(BUSINESS_ROLES).toContain('admin');
    expect(BUSINESS_ROLES).not.toContain('tourist');
    expect(BUSINESS_ROLES).not.toContain('local_resident');
  });

  it('POST_TYPES inclui todos os tipos', () => {
    expect(POST_TYPES).toContain('traveler');
    expect(POST_TYPES).toContain('resident');
    expect(POST_TYPES).toContain('guide');
    expect(POST_TYPES).toContain('business');
  });

  it('PROFILE_TYPE_LABELS tem etiquetas para todos os tipos', () => {
    expect(PROFILE_TYPE_LABELS.traveler).toBe('Viajante');
    expect(PROFILE_TYPE_LABELS.resident).toBe('Morador Local');
    expect(PROFILE_TYPE_LABELS.guide).toBe('Guia Turístico');
    expect(PROFILE_TYPE_LABELS.business).toBe('Negócio');
  });

  it('ROLE_LABELS mapeia roles OpenAPI correctamente', () => {
    expect(ROLE_LABELS.tourist).toBe('Viajante');
    expect(ROLE_LABELS.local_resident).toBe('Morador Local');
    expect(ROLE_LABELS.local_business).toBe('Negócio');
    expect(ROLE_LABELS.guide).toBe('Guia Turístico');
    expect(ROLE_LABELS.curator).toBe('Curador');
    expect(ROLE_LABELS.admin).toBe('Administrador');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cenários da matriz completa (tabela de verdade)
// ─────────────────────────────────────────────────────────────────────────────

describe('Matriz de permissões completa', () => {
  const matrix = [
    // [type, role, canPost, canLocal, canService, showSuggest]
    { type: 'traveler', role: 'tourist',        canPost: true,  canLocal: false, canService: false, showSuggest: false },
    { type: 'resident', role: 'local_resident', canPost: true,  canLocal: false, canService: false, showSuggest: false },
    { type: 'guide',    role: 'guide',          canPost: true,  canLocal: false, canService: false, showSuggest: false },
    { type: 'business', role: 'local_business', canPost: true,  canLocal: true,  canService: true,  showSuggest: true  },
  ] as const;

  for (const row of matrix) {
    it(`${row.type} (${row.role}) — publicação:${row.canPost} local:${row.canLocal} serviço:${row.canService}`, () => {
      // Publicações — todos podem criar
      // canCreatePostOnly é TRUE para não-business, FALSE para business
      // Ambos os cenários estão cobertos
      expect(canCreateBusiness(row.role, row.type)).toBe(row.canLocal);
      expect(shouldShowSuggestScreen(row.role, row.type)).toBe(row.showSuggest);

      // Viajante e morador: canCreatePostOnly = TRUE
      // Negócio: canCreatePostOnly = FALSE (tem mais permissões)
      if (row.type === 'traveler' || row.type === 'resident') {
        expect(canCreatePostOnly(row.role, row.type)).toBe(true);
      } else if (row.type === 'business') {
        expect(canCreatePostOnly(row.role, row.type)).toBe(false);
      }
    });
  }
});
