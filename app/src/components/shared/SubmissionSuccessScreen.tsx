import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, PartyPopper, Search, Globe } from 'lucide-react';

interface SubmissionSuccessScreenProps {
  /** Título principal, ex: "Local" ou "Serviço" */
  entityType: string;
  /** Callback ao clicar no botão de retorno */
  onSuccess: () => void;
}

/**
 * Tela de sucesso reutilizável para submissões (Locais, Serviços, etc.)
 *
 * Design consistente em toda a aplicação, apenas alterando os textos
 * conforme o contexto (Local, Serviço, etc.)
 * Auto-redireciona para home após 30 segundos de inactividade.
 */
export default function SubmissionSuccessScreen({ entityType, onSuccess }: SubmissionSuccessScreenProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-redirect após 30 s sem interacção
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onSuccess();
    }, 30_000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onSuccess]);

  return (
    <div
      className="h-screen w-full flex flex-col relative overflow-hidden"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
    >
      {/* ── Faixa superior colorida ── */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{
        height: 270,
        background: 'linear-gradient(150deg, #0F4C2A 0%, #1B7A45 55%, #2BB5C8 100%)',
        borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
      }}>
        <div className="absolute" style={{ top: -60, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute" style={{ bottom: 10, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 44px)',
          borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
        }} />
      </div>

      {/* ── Scroll container ── */}
      <div className="relative z-10 flex flex-col items-center w-full h-full overflow-y-auto pb-8 px-5">

        {/* Ícone flutuante sobre o card */}
        <motion.div className="relative" style={{ marginTop: 48, marginBottom: -40, zIndex: 20 }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 11, stiffness: 160, delay: 0.15 }}>
          <motion.div style={{ position: 'absolute', inset: -16, borderRadius: '50%', background: 'rgba(27,122,69,0.18)' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div style={{ position: 'absolute', inset: -7, borderRadius: '50%', background: 'rgba(43,181,200,0.15)' }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }} />
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 50%, #2BB5C8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 16px 48px rgba(15,76,42,0.4), 0 0 0 5px #F5F5F0, 0 0 0 7px rgba(27,90,59,0.1)',
          }}>
            <Check size={42} color="white" strokeWidth={3} />
          </div>
          <motion.div style={{
            position: 'absolute', top: -4, right: -8, width: 30, height: 30, borderRadius: '50%',
            background: '#F4821F', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(244,130,31,0.45)', border: '2.5px solid #F5F5F0',
          }} animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
            <PartyPopper size={14} color="white" strokeWidth={2} />
          </motion.div>
        </motion.div>

        {/* ── Card principal ── */}
        <motion.div
          className="w-full"
          style={{
            maxWidth: 400,
            background: 'white',
            borderRadius: 28,
            boxShadow: '0 4px 40px rgba(0,0,0,0.09), 0 1px 8px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            paddingTop: 52,
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Faixa de acento */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #0F4C2A, #1B7A45, #2BB5C8, #F4821F)' }} />

          <div className="px-6 pt-5 pb-6">

            {/* Título principal */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8, textAlign: 'center', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#1A1A1A' }}>{entityType} sugerido </span>
                <span style={{
                  background: 'linear-gradient(90deg, #0F4C2A, #2BB5C8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>com sucesso!</span>
              </h1>
            </motion.div>

            {/* Descrição */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.46 }}
              style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, marginBottom: 20, textAlign: 'center' }}>
              A sua sugestão foi recebida e será analisada pela equipa do Txopela Tour antes de ser publicada.
            </motion.p>

            {/* Divider simples */}
            <div style={{ height: 1, background: '#F0F0EC', marginBottom: 20 }} />

            {/* Timeline de processo */}
            <motion.div className="flex items-start mb-6"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}>
              {[
                { Icon: Check,  label: 'Submetida',  done: true  },
                { Icon: Search, label: 'Em análise', done: false },
                { Icon: Globe,  label: 'Publicada',  done: false },
              ].map(({ Icon, label, done }, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1.5 relative">
                  {i < 2 && (
                    <div style={{
                      position: 'absolute', top: 17, left: '50%', width: '100%', height: 2, zIndex: 0,
                      background: done ? 'linear-gradient(to right, #1B5E3B, #E5E7EB)' : '#E5E7EB',
                    }} />
                  )}
                  <div style={{
                    position: 'relative', zIndex: 1,
                    width: 36, height: 36, borderRadius: 12,
                    background: done ? 'linear-gradient(135deg, #0F4C2A, #1B7A45)' : '#F5F5F0',
                    border: done ? 'none' : '1.5px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: done ? '0 4px 12px rgba(15,76,42,0.28)' : 'none',
                  }}>
                    <Icon size={16} color={done ? 'white' : '#9CA3AF'} strokeWidth={2.2} />
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: 0.6, textAlign: 'center',
                    color: done ? '#1B5E3B' : '#9CA3AF',
                  }}>
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onSuccess}
              className="w-full relative overflow-hidden rounded-2xl text-white font-black flex items-center justify-center"
              style={{
                height: 52, fontSize: 14, letterSpacing: '0.02em',
                background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                boxShadow: '0 6px 24px rgba(15,76,42,0.38)',
              }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.68 }}
            >
              <motion.div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%)',
              }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
              />
              <span className="relative z-10">Voltar ao início</span>
            </motion.button>
          </div>
        </motion.div>

      </div>{/* fim scroll container */}
    </div>
  );
}
