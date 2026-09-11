import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Search, MapPin, Star, Compass, Clock, X, Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useScrollTop } from '@/hooks/useScrollTop';

const BotAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const dims = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-24 h-24' : 'w-9 h-9';
  const imgSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-24 h-24' : 'w-9 h-9';
  return (
    <div className={`${dims} flex items-center justify-center flex-shrink-0`}>
      <img src="/images/Logo2.png" alt="TxopelaTour AI" className={`${imgSize} object-contain`} />
    </div>
  );
};

const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface Message { id: string; type: 'user' | 'bot'; text: string; timestamp: Date; }
interface Conversation { id: string; title: string; messages: Message[]; createdAt: Date; }
interface ChatbotProps { onBack: () => void; initialQuery?: string; }

const SUGGESTIONS = [
  { icon: MapPin,  text: 'Onde hospedar perto de mim' },
  { icon: Star,    text: 'Locais mais bem avaliados' },
  { icon: Compass, text: 'Destinos populares em Moçambique' },
  { icon: Clock,   text: 'Experiências culturais recomendadas' },
];

// Mock responses removidos - agora usa apenas a API de IA

function formatText(text: string) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <span key={i} className="font-semibold">{part}</span> : <span key={i}>{part}</span>
  );
}

export default function Chatbot({
  onBack, initialQuery }: ChatbotProps) {
  useScrollTop();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeId) ?? null;
  const messages = activeConv?.messages ?? [];
  
  // Dados do usuário para exibição no perfil
  const userName = user?.name || 'Usuário';
  const userInitial = userName.charAt(0).toUpperCase();
  const userRole = user?.type === 'guide' ? 'Guia Turístico'
                 : user?.type === 'business' ? 'Negócio'
                 : user?.type === 'resident' ? 'Morador Local'
                 : 'Viajante';

  // Fechar o chat e voltar ao feed sem fazer logout
  const handleClose = () => onBack();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Enviar query inicial vinda da search bar do Home
  useEffect(() => {
    if (initialQuery?.trim()) {
      const timer = setTimeout(() => handleSend(initialQuery), 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const newChat = () => { setActiveId(null); setInputValue(''); setSidebarOpen(false); inputRef.current?.focus(); };

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), type: 'user', text: text.trim(), timestamp: new Date() };
    let convId = activeId;
    if (!convId) {
      convId = Date.now().toString();
      setConversations(prev => [{ id: convId!, title: text.trim().slice(0, 40), messages: [userMsg], createdAt: new Date() }, ...prev]);
      setActiveId(convId);
    } else {
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c));
    }
    setInputValue('');
    setIsLoading(true);
    const finalId = convId;

    try {
      // Busca resposta da API de IA
      const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
      if (!apiUrl) {
        console.error('VITE_API_URL não configurada');
        const botMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          type: 'bot', 
          text: 'Desculpe, o serviço de IA não está disponível no momento. Por favor, configure a variável VITE_API_URL no arquivo .env', 
          timestamp: new Date() 
        };
        setConversations(prev => prev.map(c => c.id === finalId ? { ...c, messages: [...c.messages, botMsg] } : c));
        setIsLoading(false);
        return;
      }
      
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const res = await fetch(`${baseUrl}/api/ai/chatbot/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      let botText: string;
      if (res.ok) {
        const data = await res.json();
        botText = data.response || data.message || 'Sem resposta do servidor.';
        // Adiciona sugestões se existirem
        if (data.suggestions?.length) {
          botText += '\n\n**Sugestões:** ' + data.suggestions.join(', ');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro na resposta da API:', res.status, errorData);
        botText = `Desculpe, ocorreu um erro ao processar sua pergunta. (Código: ${res.status})`;
      }

      const botMsg: Message = { id: (Date.now() + 1).toString(), type: 'bot', text: botText, timestamp: new Date() };
      setConversations(prev => prev.map(c => c.id === finalId ? { ...c, messages: [...c.messages, botMsg] } : c));
    } catch (error) {
      console.error('Erro ao buscar resposta da IA:', error);
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        type: 'bot', 
        text: 'Desculpe, não foi possível conectar ao serviço de IA. Verifique sua conexão com a internet e se o servidor está rodando.', 
        timestamp: new Date() 
      };
      setConversations(prev => prev.map(c => c.id === finalId ? { ...c, messages: [...c.messages, botMsg] } : c));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    setConversations(prev => prev.filter(c => c.id !== confirmDeleteId));
    if (activeId === confirmDeleteId) setActiveId(null);
    setConfirmDeleteId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden fixed inset-0 z-50">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HEADER - 100% largura, fixo no topo */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <header className="relative h-[56px] sm:h-[70px] w-full flex-shrink-0 border-b border-gray-200 z-20">
        {/* Imagem de fundo */}
        <img 
          src="/images/mozambique-beach.jpg" 
          alt="Turismo em Moçambique" 
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&auto=format&fit=crop';
          }}
        />
        {/* Overlay escuro para contraste */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/50" />
        
        {/* Conteúdo do Header */}
        <div className="relative h-full flex items-center justify-between px-4 sm:px-6 max-w-[1920px] mx-auto">
          {/* Lado esquerdo - Logo e Título */}
          <div className="flex items-center gap-3">
            {/* Menu hamburger (mobile) */}
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors md:hidden backdrop-blur-sm"
            >
              <Menu size={20} className="text-white" strokeWidth={2.5} />
            </button>
            
            {/* Logo - oculto em mobile */}
            <img 
              src="/images/Logo2.png" 
              alt="TxopelaTour" 
              className="w-10 h-10 object-contain drop-shadow-lg hidden sm:block"
            />
            
            {/* Título - oculto em mobile */}
            <h1 className="text-white font-bold text-xl drop-shadow-lg hidden sm:block" style={{ fontFamily: 'Pacifico, cursive' }}>
              TxopelaTour AI
            </h1>

            {/* Título mobile - só no mobile */}
            <h1 className="text-white font-bold text-base drop-shadow-lg sm:hidden hidden" style={{ fontFamily: 'Pacifico, cursive' }}>
              TxopelaTour AI
            </h1>
          </div>
          
          {/* Lado direito - Botão Nova Conversa */}
          <motion.button 
            whileTap={{ scale: 0.95 }} 
            onClick={newChat}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/95 hover:bg-white text-[#0077B6] rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nova conversa</span>
          </motion.button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CONTEÚDO PRINCIPAL - Sidebar + Chat */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────── */}
        {/* SIDEBAR - Desktop (oculto em mobile) */}
        {/* ─────────────────────────────────────────────────────────── */}
        <aside className="hidden md:flex w-[240px] flex-col bg-white border-r border-gray-200 flex-shrink-0">
          {/* Campo de Pesquisa */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none flex-1" 
              />
            </div>
          </div>

          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <MessageIcon />
                </div>
                <p className="text-sm text-gray-500">Nenhuma conversa ainda</p>
                <p className="text-xs text-gray-400 mt-1">Comece uma nova conversa</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {conversations.map(conv => (
                  <button 
                    key={conv.id} 
                    onClick={() => setActiveId(conv.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-left transition-all group ${
                      activeId === conv.id 
                        ? 'bg-[#0077B6]/10 border border-[#0077B6]/20 text-[#0077B6]' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        activeId === conv.id ? 'bg-[#0077B6]' : 'bg-gray-300'
                      }`} />
                      <span className="text-sm truncate">{conv.title}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteConv(conv.id, e)} 
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                    >
                      <X size={12} className="text-red-400" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Perfil e Sair */}
          <div className="px-4 py-4 space-y-3">
            {/* Perfil do usuário */}
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={userName}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-9 h-9 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm';
                      fallback.textContent = userInitial;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
                  {userInitial}
                </div>
              )}
              <div className="flex flex-col items-start min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-400">{userRole}</p>
              </div>
            </div>
            
            {/* Botão Fechar - volta ao feed sem logout */}
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-start gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm"
            >
              <LogOut size={16} />
              Fechar chat
            </button>
          </div>
        </aside>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SIDEBAR MOBILE - Drawer */}
        {/* ─────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)} 
              />
              <motion.aside
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="fixed left-0 top-0 bottom-0 w-[300px] bg-white z-40 flex flex-col shadow-2xl md:hidden"
              >
                {/* Header do drawer */}
                <div className="px-4 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Conversas</h2>
                    <button 
                      onClick={() => setSidebarOpen(false)} 
                      className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <X size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Campo de Pesquisa */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <Search size={16} className="text-gray-400 flex-shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar..." 
                      className="bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none flex-1" 
                    />
                  </div>
                </div>

                {/* Lista de Conversas */}
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <MessageIcon />
                      </div>
                      <p className="text-sm text-gray-500">Nenhuma conversa ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {conversations.map(conv => (
                        <button 
                          key={conv.id} 
                          onClick={() => { setActiveId(conv.id); setSidebarOpen(false); }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-left transition-all group ${
                            activeId === conv.id 
                              ? 'bg-[#0077B6]/10 border border-[#0077B6]/20 text-[#0077B6]' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              activeId === conv.id ? 'bg-[#0077B6]' : 'bg-gray-300'
                            }`} />
                            <span className="text-sm truncate">{conv.title}</span>
                          </div>
                          <button 
                            onClick={(e) => deleteConv(conv.id, e)} 
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          >
                            <X size={12} className="text-red-400" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Perfil e Sair */}
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={userName}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-9 h-9 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm';
                            fallback.textContent = userInitial;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
                        {userInitial}
                      </div>
                    )}
                    <div className="flex flex-col items-start min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-400">{userRole}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleClose}
                    className="w-full flex items-center justify-start gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm"
                  >
                    <LogOut size={16} />
                    Fechar chat
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* ÁREA DE CHAT */}
        {/* ─────────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
          
          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full px-4 sm:px-6 text-center">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-md"
                >
                  <div className="mb-3 sm:mb-6 flex justify-center">
                    <BotAvatar size="lg" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                    Pronto para explorar Moçambique?
                  </h2>
                  <p className="hidden sm:block text-sm sm:text-base text-gray-600 mb-4 sm:mb-8">
                    Pergunte-me sobre praias, restaurantes, actividades e muito mais em todo o país.
                  </p>
                  
                  {/* Sugestões - 2 colunas em mobile, 2 colunas em desktop */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {SUGGESTIONS.map((suggestion, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => handleSend(suggestion.text)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + idx * 0.08, duration: 0.25 }}
                        whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,119,182,0.12)' }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-xl hover:border-[#0077B6] hover:bg-blue-50/50 transition-colors text-left group"
                      >
                        <motion.span
                          animate={{ scale: [1, 1.18, 1] }}
                          transition={{ delay: 0.7 + idx * 0.12, duration: 0.4, ease: 'easeInOut' }}
                          className="flex-shrink-0"
                        >
                          <suggestion.icon size={16} className="text-[#0077B6]" />
                        </motion.span>
                        <span className="text-xs sm:text-sm text-gray-700 group-hover:text-[#0077B6] leading-tight transition-colors">
                          {suggestion.text}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Mensagens */
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 6 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className={`flex items-end gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.type === 'bot' && <BotAvatar size="sm" />}
                      
                      <div className={`max-w-[75%] flex flex-col gap-1 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3 rounded-2xl text-[15px] leading-relaxed text-left ${
                          msg.type === 'user'
                            ? 'bg-gradient-to-br from-[#0077B6] to-[#005a8f] text-white rounded-br-sm shadow-md'
                            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                        }`}>
                          {formatText(msg.text)}
                        </div>
                        <span className="text-[11px] text-gray-400 px-2">
                          {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Avatar do utilizador ao lado da mensagem */}
                      {msg.type === 'user' && (
                        user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={userName}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0 shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                            {userInitial}
                          </div>
                        )
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Indicador de digitação */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0 }} 
                      className="flex gap-4"
                    >
                      <BotAvatar size="sm" />
                      <div className="bg-white border border-gray-100 px-5 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                        <div className="flex gap-1.5 items-center">
                          {[0, 0.15, 0.3].map((delay, i) => (
                            <motion.div 
                              key={i} 
                              className="w-2 h-2 bg-[#0077B6] rounded-full"
                              animate={{ y: [0, -5, 0] }} 
                              transition={{ duration: 0.6, repeat: Infinity, delay }} 
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Campo de Input - Fixo no fundo */}
          <div className="px-4 py-2 bg-white border-t border-gray-200">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-3 border border-gray-200 focus-within:border-[#0077B6] focus-within:bg-white transition-all shadow-sm">
                <input 
                  ref={inputRef} 
                  type="text" 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Explore destinos e experiências..."
                  className="flex-1 bg-transparent text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none" 
                />
                <motion.button 
                  whileTap={{ scale: 0.9 }} 
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                    inputValue.trim() && !isLoading 
                      ? 'bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] shadow-md hover:shadow-lg' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} className="text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL - Confirmar exclusão de conversa */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {confirmDeleteId && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 px-6"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
                  <X size={22} className="text-red-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 text-center mb-1">Apagar conversa?</h3>
                <p className="text-sm text-gray-500 text-center mb-6">Esta acção não pode ser desfeita.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-medium text-white transition-colors"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
