/**
 * registerValidation.ts — validação do formulário de cadastro.
 *
 * Regras:
 *  - Nome:       obrigatório
 *  - E-mail:     obrigatório + regex
 *  - Senha:      obrigatória, mín. 8 chars
 *  - Confirmar:  deve coincidir com senha
 *  - Termos:     obrigatório
 *  - Website:    URL válida quando preenchida
 *  - Latitude:   número entre -90 e 90 quando preenchida
 *  - Longitude:  número entre -180 e 180 quando preenchida
 */

import type { CommonFormData, BusinessFormData } from './types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX   = /^https?:\/\/.+\..+/i;

// ── Validação dos campos comuns ───────────────────────────────────────────────
export function validateCommonFields(
  data: Partial<CommonFormData>,
): { valid: boolean; error: string } {
  if (!data.name?.trim())
    return { valid: false, error: 'O nome completo é obrigatório.' };

  if (!data.email?.trim())
    return { valid: false, error: 'O e-mail é obrigatório.' };

  if (!EMAIL_REGEX.test(data.email.trim()))
    return { valid: false, error: 'Insere um e-mail válido.' };

  if (!data.password)
    return { valid: false, error: 'A senha é obrigatória.' };

  if (data.password.length < 8)
    return { valid: false, error: 'A senha deve ter no mínimo 8 caracteres.' };

  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword)
    return { valid: false, error: 'As senhas não coincidem.' };

  if (data.termsAccepted === false)
    return { valid: false, error: 'Aceita os Termos de Uso e a Política de Privacidade para continuar.' };

  return { valid: true, error: '' };
}

// ── Validação dos campos de negócio ──────────────────────────────────────────
export function validateBusinessFields(
  data: Partial<BusinessFormData>,
): { valid: boolean; error: string } {
  if (data.businessWebsite && data.businessWebsite.trim()) {
    const url = data.businessWebsite.trim();
    // Aceita com ou sem protocolo — adiciona https:// para validar
    const toTest = url.startsWith('http') ? url : `https://${url}`;
    if (!URL_REGEX.test(toTest))
      return { valid: false, error: 'O website deve ser um URL válido (ex: https://meusite.co.mz).' };
  }

  if (data.businessLatitude && data.businessLatitude.trim()) {
    const lat = parseFloat(data.businessLatitude);
    if (isNaN(lat) || lat < -90 || lat > 90)
      return { valid: false, error: 'A latitude deve ser um número entre -90 e 90.' };
  }

  if (data.businessLongitude && data.businessLongitude.trim()) {
    const lon = parseFloat(data.businessLongitude);
    if (isNaN(lon) || lon < -180 || lon > 180)
      return { valid: false, error: 'A longitude deve ser um número entre -180 e 180.' };
  }

  return { valid: true, error: '' };
}

// ── Força da senha ────────────────────────────────────────────────────────────
export function passwordStrength(p: string): number {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8)           s++;
  if (/[A-Z]/.test(p))         s++;
  if (/[0-9]/.test(p))         s++;
  if (/[^A-Za-z0-9]/.test(p))  s++;
  return s; // 0–4
}

export const STRENGTH_COLORS = ['#E5E7EB', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E'] as const;
export const STRENGTH_LABELS = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'] as const;

// ── Normalizar URL de website ─────────────────────────────────────────────────
export function normalizeWebsite(url: string): string {
  if (!url.trim()) return '';
  return url.startsWith('http') ? url.trim() : `https://${url.trim()}`;
}
