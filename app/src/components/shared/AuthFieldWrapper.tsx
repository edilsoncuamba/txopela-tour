/**
 * AuthFieldWrapper — wrapper de campo reutilizável para os ecrãs de autenticação.
 *
 * Fornece:
 *  - Container translúcido (wrapper arredondado) idêntico ao do Login
 *  - Input com fundo 100% transparente, autofill neutralizado (classe auth-input)
 *  - Label, ícone SVG, botão de visibilidade (senha), mensagem de erro inline
 *  - Estados focus, hover, error e disabled
 */

import React from 'react';
import type { ReactNode, InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// ── Estilos partilhados ───────────────────────────────────────────────────────
export const AUTH_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.18)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  boxShadow: '0 -8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)',
  border: '1px solid rgba(255,255,255,0.25)',
};

export const AUTH_CARD_ROUNDED_TOP: React.CSSProperties = {
  ...AUTH_CARD,
  borderBottom: 'none',
  borderRadius: '1.5rem 1.5rem 0 0',
};

export const AUTH_CARD_FULL: React.CSSProperties = {
  ...AUTH_CARD,
  borderRadius: '1.5rem',
};

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'> {
  /** Texto da label (opcional) */
  label?: string;
  /** Ícone SVG/Lucide exibido à esquerda dentro do campo */
  icon?: ReactNode;
  /** Mensagem de erro exibida abaixo do campo */
  error?: string;
  /** Para campos de senha: estado de visibilidade */
  showPassword?: boolean;
  /** Para campos de senha: callback de toggle */
  onTogglePassword?: () => void;
  /** Conteúdo adicional após o campo (ex: indicador de força) */
  extra?: ReactNode;
  /** Borda vermelha quando inválido */
  invalid?: boolean;
}

/**
 * Campo de formulário de autenticação com design translúcido.
 *
 * Uso:
 * ```tsx
 * <AuthField
 *   label="E-mail"
 *   icon={<MailIcon />}
 *   type="email"
 *   value={email}
 *   onChange={e => setEmail(e.target.value)}
 * />
 * ```
 */
export function AuthField({
  label,
  icon,
  error,
  showPassword,
  onTogglePassword,
  extra,
  invalid,
  type,
  ...inputProps
}: AuthFieldProps) {
  const isPassword = type === 'password' || (type === 'text' && onTogglePassword !== undefined);
  const inputType  = isPassword && showPassword !== undefined
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <div>
      {label && (
        <label
          className="block text-xs font-semibold mb-1.5 text-left"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          {label}
        </label>
      )}

      {/* Wrapper do campo */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-white focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.2)]"
        style={{
          background: 'rgba(255,255,255,0.18)',
          borderColor: invalid ? '#EF4444' : 'rgba(255,255,255,0.3)',
          overflow: 'hidden',
        }}
      >
        {icon && (
          <span className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}

        <input
          {...inputProps}
          type={inputType}
          className="auth-input flex-1 text-sm focus:outline-none placeholder:text-white/40"
          style={{
            color: 'white',
            background: 'transparent',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            caretColor: 'white',
            colorScheme: 'dark' as any,
            border: 'none',
            outline: 'none',
          }}
        />

        {/* Botão de toggle de senha */}
        {onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p className="text-[11px] mt-1 font-semibold" style={{ color: '#EF4444' }}>
          {error}
        </p>
      )}

      {/* Conteúdo extra (ex: indicador de força de senha) */}
      {extra}
    </div>
  );
}

// ── Ícones SVG inline reutilizáveis ──────────────────────────────────────────
export function IconEmail({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
      <rect x="2" y="4" width="20" height="16" rx="2.5"/>
      <path d="M2 8l10 6 10-6"/>
    </svg>
  );
}

export function IconLock({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="11" rx="2.5"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

export function IconUser({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

export function IconPhone({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  );
}

// ── Botão de submit principal ─────────────────────────────────────────────────
interface AuthSubmitButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'submit' | 'button';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export function AuthSubmitButton({
  children, onClick, type = 'submit', disabled, loading, loadingText,
}: AuthSubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-3.5 rounded-xl text-white font-black text-sm disabled:opacity-60 transition-all"
      style={{
        background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
        boxShadow: '0 4px 18px rgba(15,76,42,0.38)',
        letterSpacing: '0.01em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingText ?? 'A processar…'}
        </div>
      ) : children}
    </button>
  );
}

// ── Mensagem de erro de formulário ───────────────────────────────────────────
export function AuthErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{message}</p>
    </div>
  );
}

// ── Linha divisória "ou" ──────────────────────────────────────────────────────
export function AuthDivider({ label = 'ou continua com' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
      <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
    </div>
  );
}
