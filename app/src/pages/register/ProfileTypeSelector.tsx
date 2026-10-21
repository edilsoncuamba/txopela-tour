/**
 * ProfileTypeSelector — passo 1 do cadastro.
 *
 * Apresenta os três tipos de perfil disponíveis e permite ao utilizador
 * seleccionar um antes de avançar para o formulário específico.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Home as HomeIcon, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AuthSubmitButton,
  AuthErrorMessage,
} from '@/components/shared/AuthFieldWrapper';
import { PROFILE_TYPE_OPTIONS } from './types';
import type { ProfileType } from './types';

// ── Ícones de perfil ─────────────────────────────────────────────────────────
function ProfileIcon({
  icon, size = 22, color = 'white',
}: { icon: 'plane' | 'home' | 'store'; size?: number; color?: string }) {
  const props = { size, color, strokeWidth: 1.8 };
  switch (icon) {
    case 'plane': return <Plane {...props} />;
    case 'home':  return <HomeIcon {...props} />;
    case 'store': return <Store {...props} />;
  }
}

interface ProfileTypeSelectorProps {
  selected: ProfileType | null;
  onSelect: (type: ProfileType) => void;
  onContinue: () => void;
  onBack: () => void;  // volta ao Login
  error?: string;
}

export default function ProfileTypeSelector({
  selected,
  onSelect,
  onContinue,
  onBack,
  error,
}: ProfileTypeSelectorProps) {
  return (
    <motion.div
      key="select-profile"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {/* ── Botão Voltar ao Login ─────────────────────────────────────── */}
      <div className="mb-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <ChevronLeft size={14} /> Entrar
        </button>
      </div>

      {/* ── Título ───────────────────────────────────────────────────── */}
      <div className="mb-5">
        <h2
          className="font-black mb-1.5"
          style={{
            fontSize: '1.35rem',
            color: 'white',
            letterSpacing: '-0.025em',
            textShadow: '0 1px 8px rgba(0,0,0,0.3)',
          }}
        >
          Criar conta
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Escolhe o tipo de perfil que melhor te descreve.
        </p>
      </div>

      {/* ── Opções de perfil ─────────────────────────────────────────── */}
      <div className="space-y-2.5 mb-5">
        {PROFILE_TYPE_OPTIONS.map(option => {
          const isSelected = selected === option.id;
          return (
            <motion.button
              key={option.id}
              type="button"
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelect(option.id)}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all"
              style={{
                background: isSelected ? option.bg : 'rgba(255,255,255,0.08)',
                borderColor: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)',
                borderWidth: isSelected ? 2 : 1,
              }}
            >
              {/* Ícone */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: isSelected
                    ? option.bg.replace('0.18)', '0.35)')
                    : 'rgba(255,255,255,0.1)',
                  border: isSelected
                    ? `1.5px solid ${option.accent}55`
                    : '1.5px solid rgba(255,255,255,0.12)',
                }}
              >
                <ProfileIcon icon={option.icon} size={20} color={isSelected ? option.accent : 'rgba(255,255,255,0.6)'} />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-black text-sm mb-0.5"
                  style={{ color: isSelected ? 'white' : 'rgba(255,255,255,0.85)' }}
                >
                  {option.label}
                </p>
                <p
                  className="text-xs leading-snug"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  {option.description}
                </p>
              </div>

              {/* Indicador de selecção */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: isSelected ? '#1B5E3B' : 'rgba(255,255,255,0.12)',
                  border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                }}
              >
                {isSelected && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="white" strokeWidth="2.2">
                    <polyline points="1 4.5 3.5 7 8 2" />
                  </svg>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Erro ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="sel-err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <AuthErrorMessage message={error} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botão Continuar ──────────────────────────────────────────── */}
      <AuthSubmitButton
        type="button"
        onClick={onContinue}
        disabled={!selected}
      >
        <span className="flex items-center justify-center gap-2">
          Continuar
          <ChevronRight size={15} />
        </span>
      </AuthSubmitButton>

      {/* ── Já tens conta? ───────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center gap-1.5 pt-4 mt-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
      >
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Já tens conta?
        </span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="text-xs font-black transition-opacity hover:opacity-75"
          style={{ color: '#F4821F' }}
        >
          Entrar →
        </motion.button>
      </div>
    </motion.div>
  );
}
