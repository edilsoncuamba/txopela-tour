/**
 * LocalResidentForm — formulário de cadastro para moradores locais (role: local_resident).
 *
 * Campos: Nome, E-mail, Senha, Confirmar senha, Telefone (opcional),
 *         Data de nascimento (opcional), Aceitar termos.
 *
 * Estruturalmente idêntico ao TouristForm — o que muda é o role enviado à API.
 */

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Home as HomeIcon } from 'lucide-react';
import {
  AuthSubmitButton,
  AuthErrorMessage,
} from '@/components/shared/AuthFieldWrapper';
import CommonFormFields from './CommonFormFields';
import type { CommonFormData } from './types';

interface LocalResidentFormProps {
  data: Partial<CommonFormData>;
  onChange: (field: keyof CommonFormData, value: string | boolean) => void;
  showPassword: boolean;
  showConfirm: boolean;
  onTogglePassword: () => void;
  onToggleConfirm: () => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

export default function LocalResidentForm({
  data,
  onChange,
  showPassword,
  showConfirm,
  onTogglePassword,
  onToggleConfirm,
  onSubmit,
  onBack,
  isLoading,
  error,
}: LocalResidentFormProps) {
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      key="resident-form"
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {/* ── Navegação ─────────────────────────────────────────────────── */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <ChevronLeft size={14} /> Tipo de perfil
        </button>
      </div>

      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(5,150,105,0.25)', border: '1.5px solid rgba(52,211,153,0.4)' }}
        >
          <HomeIcon size={18} color="#34D399" strokeWidth={1.8} />
        </div>
        <h2
          className="font-black"
          style={{ fontSize: '1.2rem', color: 'white', letterSpacing: '-0.025em', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
        >
          Morador local
        </h2>
      </div>

      {/* ── Campos ────────────────────────────────────────────────────── */}
      <div ref={anchorRef}>
        <CommonFormFields
          data={data}
          onChange={onChange}
          showPassword={showPassword}
          showConfirm={showConfirm}
          onTogglePassword={onTogglePassword}
          onToggleConfirm={onToggleConfirm}
          datePickerAnchorRef={anchorRef}
        />
      </div>

      {/* ── Erro de API ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="resident-err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <AuthErrorMessage message={error} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botão Cadastrar ───────────────────────────────────────────── */}
      <div className="mt-4">
        <AuthSubmitButton
          type="button"
          onClick={onSubmit}
          loading={isLoading}
          loadingText="A criar conta…"
          disabled={isLoading}
        >
          Criar conta
        </AuthSubmitButton>
      </div>
    </motion.div>
  );
}
