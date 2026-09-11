import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, Mail, Camera, Save, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usersApi } from '@/services/api';
import ChangePassword from './ChangePassword';
import { useScrollTop } from '@/hooks/useScrollTop';

const BRAND   = '#1B5E3B';
const BLUE    = '#0077B6';
const BG      = '#F5F5F0';
const WHITE   = '#FFFFFF';
const GRAY_50 = '#F8FAFC';
const GRAY_200= '#E5E7EB';
const GRAY_400= '#9CA3AF';
const GRAY_500= '#6B7280';
const GRAY_700= '#374151';
const GRAY_900= '#1A1A1A';

interface EditProfileProps {
  onBack: () => void;
}

interface ProfileForm {
  name: string;
  phone: string;
  bio: string;
  dateOfBirth: string;
}

export default function EditProfile({
  onBack }: EditProfileProps) {
  useScrollTop();
  const [loading, setLoading]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profileData, setProfileData]       = useState<any>(null);
  const [toast, setToast]                   = useState<{ msg: string; ok: boolean } | null>(null);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: '', phone: '', bio: '', dateOfBirth: '',
  });

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getProfile();
      if (res.data) {
        // Backend retorna envelope { status, code, data } ou directo
        // Conforme OpenAPI: campos são username, phone, bio, avatar, email
        const profile = res.data.user ?? res.data;
        setProfileData(profile);
        setProfileForm({
          // OpenAPI usa 'name' em UserUpdateRequest mas armazena como 'username'
          // Mapeamos: name → username (exibição), phone, bio, dateOfBirth
          name:        profile.name        || profile.username || '',
          phone:       profile.phone       || '',
          bio:         profile.bio         || '',
          dateOfBirth: profile.dateOfBirth
            ? profile.dateOfBirth.split('T')[0]
            : profile.date_of_birth
              ? profile.date_of_birth.split('T')[0]
              : '',
        });
        console.log('[EditProfile] Perfil carregado:', profile);
      } else {
        console.warn('[EditProfile] Sem dados de perfil:', res);
        showToast('Sem dados de perfil', false);
      }
    } catch (err) {
      console.error('[EditProfile] Erro:', err);
      showToast('Erro ao carregar perfil', false);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      // Conforme OpenAPI UserUpdateRequest: name, phone, dateOfBirth, bio
      const payload = {
        name:        profileForm.name.trim() || undefined,
        phone:       profileForm.phone.trim() || undefined,
        bio:         profileForm.bio.trim() || undefined,
        dateOfBirth: profileForm.dateOfBirth || undefined,
      };
      console.log('[EditProfile] Enviando update:', payload);
      const res = await usersApi.updateProfile(payload);
      if (res.data) {
        const updated = res.data.user ?? res.data;
        setProfileData(updated);
        showToast('Perfil atualizado com sucesso!', true);
        console.log('[EditProfile] Perfil atualizado:', updated);
      } else if (res.error) {
        const errMsg = typeof res.error === 'object'
          ? JSON.stringify(res.error, null, 2)
          : String(res.error);
        showToast(errMsg, false);
        console.error('[EditProfile] Erro update:', res.error);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar', false);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Selecione uma imagem válida', false); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast('Imagem muito grande (máx 5MB)', false); return; }

    setUploadingAvatar(true);
    try {
      // Conforme OpenAPI: POST /api/users/upload-avatar/ com campo 'file'
      const res = await usersApi.uploadAvatar(file);
      console.log('[EditProfile] Avatar upload response:', res);
      // Resposta conforme OpenAPI AvatarUploadResponse: { success, avatarUrl, message }
      const avatarUrl = res.data?.avatarUrl;
      if (avatarUrl) {
        setProfileData((prev: any) => ({ ...prev, avatar: avatarUrl }));
        showToast('Foto atualizada com sucesso!', true);
      } else if (res.error) {
        showToast(typeof res.error === 'string' ? res.error : 'Erro ao enviar foto', false);
      } else {
        showToast('Foto enviada mas sem URL de retorno', false);
        console.warn('[EditProfile] Resposta sem avatarUrl:', res.data);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao enviar foto', false);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // ── Navegar para ChangePassword ──────────────────────────────────────────────
  if (showChangePassword) {
    return <ChangePassword onBack={() => setShowChangePassword(false)} />;
  }


  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: 'Nunito, sans-serif' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3"
            style={{
              background: toast.ok ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${toast.ok ? '#D1FAE5' : '#FECACA'}`,
              color: toast.ok ? '#065F46' : '#991B1B',
              minWidth: 300,
            }}>
            {toast.ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-semibold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cabeçalho — mesmo padrão das Notificações ─────────────── */}
      <motion.div
        className="px-4 py-4 flex items-center justify-between border-b border-gray-100 bg-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} color="#1A1A1A" strokeWidth={2.5} />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Editar Perfil</h1>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Coluna esquerda — Avatar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${GRAY_200}` }}>
              <div className="flex flex-col items-center gap-4">

                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden flex items-center justify-center text-white text-5xl font-black relative"
                    style={{ background: 'linear-gradient(135deg,#1B5E3B,#2BB5C8)' }}>
                    {profileData?.avatar
                      ? <img src={profileData.avatar} alt={profileData.name || profileData.username} className="w-full h-full object-cover" />
                      : (profileData?.name || profileData?.username || 'A').charAt(0).toUpperCase()}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={24} color="white" className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                    style={{ border: `2px solid ${GRAY_200}` }}>
                    <Camera size={18} color={GRAY_700} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>

                {/* Nome + email */}
                <div className="text-center">
                  <h3 className="text-lg font-black mb-1" style={{ color: GRAY_900 }}>
                    {profileData?.name || profileData?.username || 'Sem nome'}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-sm" style={{ color: GRAY_500 }}>
                    <Mail size={14} />
                    {profileData?.email}
                  </div>
                </div>

                {/* Botão → página de alterar senha */}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setShowChangePassword(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold"
                  style={{
                    border: `1.5px solid ${BLUE}`,
                    background: `${BLUE}08`,
                    color: BLUE,
                    cursor: 'pointer',
                  }}>
                  <Lock size={16} />
                  Alterar Senha
                </motion.button>
              </div>
            </div>
          </div>

          {/* Coluna direita — Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${GRAY_200}` }}>
              <h2 className="text-lg font-black mb-6 text-left" style={{ color: GRAY_900 }}>Informações Pessoais</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-2 block text-left" style={{ color: GRAY_500 }}>
                    Nome Completo *
                  </label>
                  <input type="text" value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
                    style={{ borderColor: GRAY_200, background: GRAY_50, fontFamily: 'Nunito, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                    onBlur={e =>  { e.target.style.borderColor = GRAY_200; e.target.style.boxShadow = 'none'; }} />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-2 block text-left" style={{ color: GRAY_500 }}>
                    Telefone
                  </label>
                  <input type="tel" value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+258 XX XXX XXXX"
                    className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
                    style={{ borderColor: GRAY_200, background: GRAY_50, fontFamily: 'Nunito, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                    onBlur={e =>  { e.target.style.borderColor = GRAY_200; e.target.style.boxShadow = 'none'; }} />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-2 block text-left" style={{ color: GRAY_500 }}>
                    Data de Nascimento
                  </label>
                  <input type="date" value={profileForm.dateOfBirth}
                    onChange={e => setProfileForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
                    style={{ borderColor: GRAY_200, background: GRAY_50, fontFamily: 'Nunito, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                    onBlur={e =>  { e.target.style.borderColor = GRAY_200; e.target.style.boxShadow = 'none'; }} />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide mb-2 block text-left" style={{ color: GRAY_500 }}>
                    Biografia
                  </label>
                  <textarea rows={4} value={profileForm.bio}
                    onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Conte um pouco sobre você e sua experiência..."
                    className="w-full px-4 py-3 rounded-xl border outline-none text-sm resize-none"
                    style={{ borderColor: GRAY_200, background: GRAY_50, fontFamily: 'Nunito, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
                    onBlur={e =>  { e.target.style.borderColor = GRAY_200; e.target.style.boxShadow = 'none'; }} />
                </div>
              </div>

              <div className="flex justify-end">
                <motion.button whileTap={{ scale: 0.97 }} onClick={updateProfile} disabled={saving}
                  className="px-8 py-3 rounded-xl text-white text-sm font-bold flex items-center gap-2"
                  style={{
                    background: saving ? '#9CA3AF' : `linear-gradient(135deg, ${BRAND}, #2BB5C8)`,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </motion.button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
