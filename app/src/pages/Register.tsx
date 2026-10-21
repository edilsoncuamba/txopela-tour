/**
 * Register.tsx — fluxo de cadastro por tipo de perfil.
 *
 * Fluxo Turista / Morador local:
 *   Login → Escolher perfil → Formulário → Registo
 *
 * Fluxo Negócio (3 passos):
 *   Login → Escolher perfil → Dados pessoais → Informações do negócio → Registo
 *
 * Regras:
 *  - O tipo de perfil é preservado ao voltar do formulário.
 *  - Os dados preenchidos persistem ao navegar entre passos.
 *  - O botão de submit fica desactivado durante o envio (submittingRef).
 *  - Os erros da API são apresentados acima do botão de submit.
 *  - Após registo bem-sucedido, respeita emailVerified → OTP ou onRegister.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useScrollTop } from '@/hooks/useScrollTop';
import AuthPageLayout from '@/components/shared/AuthPageLayout';
import ProfileTypeSelector from './register/ProfileTypeSelector';
import TouristForm from './register/TouristForm';
import LocalResidentForm from './register/LocalResidentForm';
import BusinessForm from './register/BusinessForm';
import { validateCommonFields, validateBusinessFields, normalizeWebsite } from './register/registerValidation';
import type { ProfileType, CommonFormData, BusinessFormData } from './register/types';

// ── Props ─────────────────────────────────────────────────────────────────────
interface RegisterProps {
  onRegister: () => void;
  onBack: () => void;
  onOTPRequired?: (email: string) => void;
}

// ── Estado inicial vazio ──────────────────────────────────────────────────────
const EMPTY_COMMON: CommonFormData = {
  name: '', email: '', password: '', confirmPassword: '',
  phone: '', dateOfBirth: '', termsAccepted: false,
};

const EMPTY_BUSINESS: BusinessFormData = {
  businessName: '', businessCategory: '', businessDescription: '',
  businessAddress: '', businessLatitude: '', businessLongitude: '',
  businessWebsite: '', businessPhone: '', businessWhatsapp: '',
};

// ── Componente ────────────────────────────────────────────────────────────────
export default function Register({ onRegister, onBack, onOTPRequired }: RegisterProps) {
  useScrollTop();

  // ── Passo principal ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<'select-profile' | 'form'>('select-profile');

  // ── Etapa interna do business (1 = dados pessoais, 2 = info negócio) ─────────
  const [businessStep, setBusinessStep] = useState<1 | 2 | 3>(1);

  // ── Perfil seleccionado ──────────────────────────────────────────────────────
  const [profileType, setProfileType] = useState<ProfileType | null>(null);

  // ── Dados preservados por perfil ────────────────────────────────────────────
  const [commonDataMap, setCommonDataMap] = useState<Record<string, Partial<CommonFormData>>>({
    tourist: { ...EMPTY_COMMON },
    local_resident: { ...EMPTY_COMMON },
    business: { ...EMPTY_COMMON },
  });
  const [businessData, setBusinessData] = useState<Partial<BusinessFormData>>({ ...EMPTY_BUSINESS });

  // ── Toggles de senha ─────────────────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // ── Erros ────────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading]         = useState(false);
  const [selectorError, setSelectorError] = useState('');
  const [formError, setFormError]         = useState('');
  const [bizStep1Error, setBizStep1Error] = useState('');

  const submittingRef = useRef(false);
  const { register }  = useAuth();

  // Ouve o evento customizado do BusinessForm para mostrar erro da etapa 1
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setBizStep1Error(detail ?? 'Campos inválidos. Verifica os dados.');
    };
    window.addEventListener('business-step1-error', handler);
    return () => window.removeEventListener('business-step1-error', handler);
  }, []);

  // ── Dados comuns do perfil actual ────────────────────────────────────────────
  const currentCommon = profileType ? (commonDataMap[profileType] ?? EMPTY_COMMON) : EMPTY_COMMON;

  const handleChangeCommon = useCallback((field: keyof CommonFormData, value: string | boolean) => {
    if (!profileType) return;
    setCommonDataMap(prev => ({
      ...prev,
      [profileType]: { ...prev[profileType], [field]: value },
    }));
  }, [profileType]);

  const handleChangeBusiness = useCallback((field: keyof BusinessFormData, value: string) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Continuar do selector para o formulário ──────────────────────────────────
  const handleContinue = () => {
    setSelectorError('');
    if (!profileType) {
      setSelectorError('Por favor, selecciona um tipo de perfil para continuar.');
      return;
    }
    setFormError('');
    setBizStep1Error('');
    setBusinessStep(1);
    setStep('form');
  };

  const handleBackToSelector = () => {
    setFormError('');
    setBizStep1Error('');
    setBusinessStep(1);
    setStep('select-profile');
  };

  // ── Submissão ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!profileType || submittingRef.current) return;
    setFormError('');

    // Validar campos comuns
    const cv = validateCommonFields(currentCommon);
    if (!cv.valid) { setFormError(cv.error); return; }

    // Validar campos de negócio
    if (profileType === 'business') {
      const bv = validateBusinessFields(businessData);
      if (!bv.valid) { setFormError(bv.error); return; }
    }

    // Construir campos extra do negócio
    let extra: Record<string, unknown> | undefined;
    if (profileType === 'business') {
      extra = {};
      if (businessData.businessName?.trim())        extra.businessName        = businessData.businessName.trim();
      if (businessData.businessCategory?.trim())    extra.businessCategory    = businessData.businessCategory.trim();
      if (businessData.businessDescription?.trim()) extra.businessDescription = businessData.businessDescription.trim();
      if (businessData.businessAddress?.trim())     extra.businessAddress     = businessData.businessAddress.trim();
      if (businessData.businessLatitude?.trim())    extra.businessLatitude    = parseFloat(businessData.businessLatitude);
      if (businessData.businessLongitude?.trim())   extra.businessLongitude   = parseFloat(businessData.businessLongitude);
      if (businessData.businessWebsite?.trim())     extra.businessWebsite     = normalizeWebsite(businessData.businessWebsite);
      if (businessData.businessPhone?.trim())       extra.businessPhone       = businessData.businessPhone.trim();
      if (businessData.businessWhatsapp?.trim())    extra.businessWhatsapp    = businessData.businessWhatsapp.trim();
      if (Object.keys(extra).length === 0) extra = undefined;
    }

    submittingRef.current = true;
    setIsLoading(true);

    try {
      const result = await register(
        currentCommon.name!,
        currentCommon.email!,
        currentCommon.password!,
        profileType,
        currentCommon.phone || undefined,
        currentCommon.dateOfBirth || undefined,
        extra,
      );

      if (result.ambiguous) {
        setFormError(result.error ?? 'A ligação demorou demasiado. Tenta fazer login ou aguarda um momento.');
        return;
      }
      if (!result.ok) {
        setFormError(result.error ?? 'Erro ao criar conta. Tenta novamente.');
        return;
      }
      if (result.emailVerified === false && onOTPRequired) {
        onOTPRequired(currentCommon.email!);
      } else {
        onRegister();
      }
    } catch (e: any) {
      setFormError(typeof e?.message === 'string' ? e.message : 'Erro inesperado. Tenta novamente.');
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AuthPageLayout>
      <div
        className="rounded-t-3xl lg:rounded-3xl px-6 py-6 md:px-8 md:py-7"
        style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderBottom: 'none',
        }}
      >
        <AnimatePresence mode="wait">

          {/* ── Passo 1: Selecção do tipo de perfil ─────────────────────── */}
          {step === 'select-profile' && (
            <ProfileTypeSelector
              key="select-profile"
              selected={profileType}
              onSelect={type => { setProfileType(type); setSelectorError(''); }}
              onContinue={handleContinue}
              onBack={onBack}
              error={selectorError}
            />
          )}

          {/* ── Turista ──────────────────────────────────────────────────── */}
          {step === 'form' && profileType === 'tourist' && (
            <TouristForm
              key="tourist"
              data={currentCommon}
              onChange={handleChangeCommon}
              showPassword={showPassword}
              showConfirm={showConfirm}
              onTogglePassword={() => setShowPassword(v => !v)}
              onToggleConfirm={() => setShowConfirm(v => !v)}
              onSubmit={handleSubmit}
              onBack={handleBackToSelector}
              isLoading={isLoading}
              error={formError}
            />
          )}

          {/* ── Morador local ─────────────────────────────────────────────── */}
          {step === 'form' && profileType === 'local_resident' && (
            <LocalResidentForm
              key="resident"
              data={currentCommon}
              onChange={handleChangeCommon}
              showPassword={showPassword}
              showConfirm={showConfirm}
              onTogglePassword={() => setShowPassword(v => !v)}
              onToggleConfirm={() => setShowConfirm(v => !v)}
              onSubmit={handleSubmit}
              onBack={handleBackToSelector}
              isLoading={isLoading}
              error={formError}
            />
          )}

          {/* ── Negócio (etapas internas geridas pelo BusinessForm) ────────── */}
          {step === 'form' && profileType === 'business' && (
            <BusinessForm
              key="business"
              commonData={currentCommon}
              businessData={businessData}
              onChangeCommon={handleChangeCommon}
              onChangeBusiness={handleChangeBusiness}
              showPassword={showPassword}
              showConfirm={showConfirm}
              onTogglePassword={() => setShowPassword(v => !v)}
              onToggleConfirm={() => setShowConfirm(v => !v)}
              onSubmit={handleSubmit}
              onBack={handleBackToSelector}
              isLoading={isLoading}
              error={formError}
              businessStep={businessStep}
              onBusinessStepChange={(s) => {
                setBizStep1Error('');
                setFormError('');
                setBusinessStep(s as 1 | 2 | 3);
              }}
              step1Error={bizStep1Error}
              onClearStep1Error={() => setBizStep1Error('')}
            />
          )}

        </AnimatePresence>
      </div>
    </AuthPageLayout>
  );
}
