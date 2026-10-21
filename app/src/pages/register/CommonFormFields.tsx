/**
 * CommonFormFields — campos partilhados por todos os formulários de cadastro.
 *
 * Inclui: Nome, E-mail, Senha (+ indicador de força), Confirmar senha,
 *         Telefone, Data, Aceitar termos.
 *
 * Os labels e placeholders são configuráveis para reutilização no BusinessForm
 * com terminologia empresarial.
 */

import React from 'react';
import DatePicker from '@/components/DatePicker';
import {
  AuthField,
  IconEmail,
  IconLock,
  IconUser,
  IconPhone,
} from '@/components/shared/AuthFieldWrapper';
import {
  passwordStrength,
  STRENGTH_COLORS,
  STRENGTH_LABELS,
} from './registerValidation';
import type { CommonFormData } from './types';

interface CommonFormFieldsProps {
  data: Partial<CommonFormData>;
  onChange: (field: keyof CommonFormData, value: string | boolean) => void;
  showPassword: boolean;
  showConfirm: boolean;
  onTogglePassword: () => void;
  onToggleConfirm: () => void;
  /** Referência ao container pai — necessária para o DatePicker posicionar o painel */
  datePickerAnchorRef: React.RefObject<HTMLDivElement | null>;
  /** Rótulo e placeholder do campo Nome */
  nameLabel?: string;
  namePlaceholder?: string;
  /** Rótulo e placeholder do campo E-mail */
  emailLabel?: string;
  emailPlaceholder?: string;
  /** Rótulo e placeholder do campo Telefone */
  phoneLabel?: string;
  phonePlaceholder?: string;
  /** Rótulo e placeholder do campo Data */
  dateLabel?: string;
  datePlaceholder?: string;
  /** Esconder campo confirmar senha */
  hideConfirm?: boolean;
  /** Esconder bloco de aceitar termos (business etapa 1 — termos aparecem na etapa 2) */
  hideTerms?: boolean;
}

export default function CommonFormFields({
  data,
  onChange,
  showPassword,
  showConfirm,
  onTogglePassword,
  onToggleConfirm,
  datePickerAnchorRef,
  nameLabel = 'Nome completo',
  namePlaceholder = 'Ex: Carlos Machava',
  emailLabel = 'E-mail',
  emailPlaceholder = 'exemplo@email.com',
  phoneLabel = 'Telefone',
  phonePlaceholder = '+258 84 000 0000',
  dateLabel = 'Data de nascimento',
  datePlaceholder = 'A tua data de nascimento',
  hideConfirm = false,
  hideTerms = false,
}: CommonFormFieldsProps) {
  const strength = passwordStrength(data.password ?? '');

  const StrengthBar = () =>
    (data.password?.length ?? 0) > 0 ? (
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i <= strength ? STRENGTH_COLORS[strength] : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
        <span className="text-[10px] font-semibold" style={{ color: STRENGTH_COLORS[strength] }}>
          {STRENGTH_LABELS[strength]}
        </span>
      </div>
    ) : null;

  const passwordsMismatch = !!(data.confirmPassword && data.password !== data.confirmPassword);

  return (
    <div className="space-y-3">
      {/* Nome */}
      <AuthField
        label={nameLabel}
        icon={<IconUser />}
        type="text"
        placeholder={namePlaceholder}
        value={data.name ?? ''}
        onChange={e => onChange('name', e.target.value)}
        autoComplete="name"
      />

      {/* E-mail */}
      <AuthField
        label={emailLabel}
        icon={<IconEmail />}
        type="email"
        placeholder={emailPlaceholder}
        value={data.email ?? ''}
        onChange={e => onChange('email', e.target.value)}
        autoComplete="email"
      />

      {/* Senha */}
      <AuthField
        label="Senha"
        icon={<IconLock />}
        type={showPassword ? 'text' : 'password'}
        placeholder="Mínimo 8 caracteres"
        value={data.password ?? ''}
        onChange={e => onChange('password', e.target.value)}
        autoComplete="new-password"
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
        extra={<StrengthBar />}
      />

      {/* Confirmar senha */}
      {!hideConfirm && (
        <AuthField
          label="Confirmar senha"
          icon={<IconLock />}
          type={showConfirm ? 'text' : 'password'}
          placeholder="Repete a senha"
          value={data.confirmPassword ?? ''}
          onChange={e => onChange('confirmPassword', e.target.value)}
          autoComplete="new-password"
          showPassword={showConfirm}
          onTogglePassword={onToggleConfirm}
          invalid={passwordsMismatch}
          error={passwordsMismatch ? 'As senhas não coincidem.' : undefined}
        />
      )}

      {/* Telefone */}
      <AuthField
        label={phoneLabel}
        icon={<IconPhone />}
        type="tel"
        placeholder={phonePlaceholder}
        value={data.phone ?? ''}
        onChange={e => onChange('phone', e.target.value)}
        autoComplete="tel"
      />

      {/* Data */}
      <div>
        <label
          className="block text-xs font-semibold mb-1.5 text-left"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          {dateLabel}
        </label>
        <DatePicker
          value={data.dateOfBirth ?? ''}
          onChange={v => onChange('dateOfBirth', v)}
          maxDate={new Date().toISOString().split('T')[0]}
          placeholder={datePlaceholder}
          anchorRef={datePickerAnchorRef}
        />
      </div>

      {/* Termos */}
      {!hideTerms && (
        <div
          className="flex items-start gap-2.5 cursor-pointer select-none pt-1"
          onClick={() => onChange('termsAccepted', !data.termsAccepted)}
          role="checkbox"
          aria-checked={!!data.termsAccepted}
          tabIndex={0}
          onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange('termsAccepted', !data.termsAccepted)}
        >
          <div
            className="w-[17px] h-[17px] rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
            style={{
              background: data.termsAccepted ? '#1B5E3B' : 'rgba(255,255,255,0.15)',
              border: `2px solid ${data.termsAccepted ? '#1B5E3B' : 'rgba(255,255,255,0.4)'}`,
            }}
          >
            {data.termsAccepted && (
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="white" strokeWidth="2">
                <polyline points="1 4.5 3.5 7 8 2" />
              </svg>
            )}
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Aceito os{' '}
            <span className="font-bold" style={{ color: '#7DDCE8' }}>Termos de Uso</span>
            {' '}e a{' '}
            <span className="font-bold" style={{ color: '#7DDCE8' }}>Política de Privacidade</span>
          </p>
        </div>
      )}
    </div>
  );
}
