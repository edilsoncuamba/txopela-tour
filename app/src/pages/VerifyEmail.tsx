import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { useScrollTop } from '@/hooks/useScrollTop';

interface VerifyEmailProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1">
      <motion.span className="w-2 h-2 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
      <motion.span className="w-2 h-2 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
      <motion.span className="w-2 h-2 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
    </div>
  );
}

export default function VerifyEmail({
  email, onVerified, onBack }: VerifyEmailProps) {
  useScrollTop();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Por favor, insira todos os 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || ''}/api/auth/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || err.message || 'Código OTP inválido ou expirado');
      }
      setSuccess(true);
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Código OTP inválido ou expirado');
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || ''}/api/auth/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || err.message || 'Erro ao reenviar código');
      }
      setOtp(['', '', '', '', '', '']);
      setResendCountdown(60);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <Check size={40} className="text-green-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verificado!</h2>
        <p className="text-gray-500 text-center">Sua conta foi criada com sucesso. Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Verificar Email</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Icon */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} className="text-[#0077B6]" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Confirme seu email</h2>
          <p className="text-gray-500 text-center mb-2">Enviamos um código de 6 dígitos para</p>
          <p className="text-gray-900 font-semibold text-center mb-8">{email}</p>

          {/* OTP Input */}
          <div className="flex gap-2 justify-center mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all"
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-6"
            >
              <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Verify Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isLoading || otp.join('').length !== 6}
            onClick={handleVerify}
            className="w-full py-3.5 bg-[#0077B6] text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#0077B6]/30 disabled:opacity-70 disabled:cursor-not-allowed mb-4"
          >
            {isLoading ? (
              <>
                <LoadingDots />
                <span>Verificando</span>
              </>
            ) : (
              <>
                <Check size={20} />
                Verificar Código
              </>
            )}
          </motion.button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-3">Não recebeu o código?</p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={isLoading || resendCountdown > 0}
              onClick={handleResendOTP}
              className="text-[#0077B6] font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCountdown > 0 ? `Reenviar em ${resendCountdown}s` : 'Reenviar código'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
