/**
 * Tipos locais para o fluxo de cadastro por tipo de perfil.
 *
 * Estes tipos complementam os tipos globais em @/types/api.ts sem os duplicar.
 * O RegisterRequest global não inclui campos business* — são enviados como
 * campos adicionais quando o role é 'business'.
 */

import type { RegisterRole } from '@/types/api';

// ── Tipos de perfil disponíveis no cadastro público ───────────────────────────
export type ProfileType = 'tourist' | 'local_resident' | 'business';

// ── Passo 1: selecção do tipo de perfil ──────────────────────────────────────
export interface ProfileTypeOption {
  id: ProfileType;
  label: string;
  description: string;
  icon: 'plane' | 'home' | 'store';
  accent: string;
  bg: string;
  role: RegisterRole;
}

export const PROFILE_TYPE_OPTIONS: ProfileTypeOption[] = [
  {
    id: 'tourist',
    label: 'Turista',
    description: 'Descobre destinos, experiências e serviços turísticos em Moçambique.',
    icon: 'plane',
    accent: '#60A5FA',
    bg: 'rgba(37,99,235,0.18)',
    role: 'tourist',
  },
  {
    id: 'local_resident',
    label: 'Morador local',
    description: 'Sou residente local e quero partilhar publicações com a comunidade.',
    icon: 'home',
    accent: '#34D399',
    bg: 'rgba(5,150,105,0.18)',
    role: 'local_resident',
  },
  {
    id: 'business',
    label: 'Serviço / Negócio',
    description: 'Tenho uma empresa, estabelecimento ou presto serviços turísticos.',
    icon: 'store',
    accent: '#FB923C',
    bg: 'rgba(234,88,12,0.18)',
    role: 'business',
  },
];

// ── Campos comuns a todos os formulários ──────────────────────────────────────
export interface CommonFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  termsAccepted: boolean;
}

// ── Campos adicionais do negócio ──────────────────────────────────────────────
// Enviados como campos extra no body do register quando role === 'business'.
// Todos opcionais — a API não os exige no schema RegisterRequest.
export interface BusinessFormData {
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  businessAddress: string;
  businessLatitude: string;
  businessLongitude: string;
  businessWebsite: string;
  businessPhone: string;
  businessWhatsapp: string;
}

// Categorias aceites pela API (LocalCategory + extras pedidos no briefing)
export const BUSINESS_CATEGORIES = [
  { value: 'restaurant',  label: 'Restaurante / Alimentação' },
  { value: 'hotel',       label: 'Hotel / Alojamento' },
  { value: 'attraction',  label: 'Atracção turística' },
  { value: 'shop',        label: 'Loja / Comércio' },
  { value: 'service',     label: 'Serviço geral' },
  { value: 'beach',       label: 'Praia / Litoral' },
  { value: 'nature',      label: 'Natureza / Ecoturismo' },
  { value: 'culture',     label: 'Cultura / Património' },
  { value: 'adventure',   label: 'Aventura / Desporto' },
  { value: 'nightlife',   label: 'Vida nocturna' },
] as const;

export type BusinessCategoryValue = typeof BUSINESS_CATEGORIES[number]['value'];

// ── Estado global do fluxo de cadastro ───────────────────────────────────────
export type RegisterStep = 'select-profile' | 'form';

export interface RegisterFlowState {
  step: RegisterStep;
  profileType: ProfileType | null;
  commonData: CommonFormData | null;
  businessData: BusinessFormData | null;
}

// ── Resultado de validação ────────────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof CommonFormData | keyof BusinessFormData, string>>;
}
