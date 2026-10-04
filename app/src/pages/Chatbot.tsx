import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Search, MapPin, Star, Compass, Clock, X, Menu, ChevronLeft, Copy, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';
import { aiApi, AI_RATE_LIMIT_ERROR } from '@/services/api';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ── Componentes de apoio ──────────────────────────────────────────────────────

const BotAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const dims = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-24 h-24' : 'w-9 h-9';
  return (
    <div className={`${dims} flex items-center justify-center flex-shrink-0`}>
      <img
        src="/images/Logo2.png"
        alt="TxopelaTour AI"
        className={`${dims} object-contain`}
      />
    </div>
  );
};

const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface ChatbotProps {
  onBack: () => void;
  initialQuery?: string;
}

// ── Sugestões iniciais ────────────────────────────────────────────────────────
// Texto em UTF-8 correcto, sem encoding quebrado

const SUGGESTIONS = [
  { icon: MapPin,   text: 'Onde hospedar perto de mim' },
  { icon: Star,     text: 'Locais mais bem avaliados' },
  { icon: Compass,  text: 'Destinos populares em Moçambique' },
  { icon: Clock,    text: 'Experiências culturais recomendadas' },
];

// ── Componente de renderização de mensagens da IA ────────────────────────────
// Usa react-markdown para suportar toda a sintaxe Markdown da IA:
// títulos, listas, negrito, itálico, código, tabelas, blockquotes.

interface CodeBlockProps {
  isDark: boolean;
  language?: string;
  children: string;
}

function CodeBlock({ isDark, language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group" style={{ margin: '0.7em 0 1em 0' }}>
      {/* Barra de cabeçalho do bloco de código */}
      <div
        className="flex items-center justify-between px-4 py-2 rounded-t-[10px]"
        style={{
          background: isDark ? '#1a1d27' : '#f3f4f6',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <span
          className="text-xs font-mono font-medium tracking-wide"
          style={{ color: isDark ? '#6b7a99' : '#6b7280' }}
        >
          {language || 'código'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all"
          style={{
            color: copied
              ? '#4ade80'
              : (isDark ? '#6b7a99' : '#6b7280'),
            background: copied
              ? 'rgba(74,222,128,0.1)'
              : 'transparent',
          }}
          aria-label="Copiar código"
        >
          {copied
            ? <><Check size={12} /><span>Copiado</span></>
            : <><Copy size={12} /><span>Copiar</span></>
          }
        </button>
      </div>

      <SyntaxHighlighter
        language={language || 'text'}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 10px 10px',
          fontSize: '0.85em',
          lineHeight: '1.6',
          padding: '1em 1.2em',
          border: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,119,182,0.12)',
          borderTop: 'none',
        }}
        showLineNumbers={children.split('\n').length > 5}
        lineNumberStyle={{
          color: isDark ? '#3a4060' : '#d1d5db',
          fontSize: '0.8em',
          minWidth: '2.5em',
          paddingRight: '1em',
          userSelect: 'none',
        }}
        wrapLongLines={false}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

interface AIMessageRendererProps {
  text: string;
  isDark: boolean;
}

function AIMessageRenderer({ text, isDark }: AIMessageRendererProps) {
  return (
    <div className="ai-prose">
      <ReactMarkdown
        components={{
          // Blocos de código com syntax highlighting
          code({ node: _node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            const codeStr = String(children).replace(/\n$/, '');

            if (isInline) {
              return <code className={className} {...props}>{children}</code>;
            }

            return (
              <CodeBlock
                isDark={isDark}
                language={match?.[1]}
              >
                {codeStr}
              </CodeBlock>
            );
          },
          // Garante que links abrem em nova aba
          a({ href, children, ...props }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          // Tabelas com scroll horizontal em mobile
          table({ children, ...props }) {
            return (
              <div style={{ overflowX: 'auto', margin: '0.7em 0' }}>
                <table {...props}>{children}</table>
              </div>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function Chatbot({ onBack, initialQuery }: ChatbotProps) {
  useScrollTop();
  const { user } = useAuth();
  const { isDark } = useTheme();

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

  // Avatar do utilizador
  const userName = user?.name || 'Utilizador';
  const userInitial = userName.charAt(0).toUpperCase();

  // Scroll para o fundo sempre que chegam novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Enviar a query inicial que vem da barra de pesquisa do Home
  useEffect(() => {
    if (initialQuery?.trim()) {
      const timer = setTimeout(() => handleSend(initialQuery), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // ── Acções ──────────────────────────────────────────────────────────────────

  const newChat = () => {
    setActiveId(null);
    setInputValue('');
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  /**
   * Envia uma mensagem para POST /api/ai/chat/ (definido no openapi-schema).
   * O aiApi usa apiFetch, que já inclui Authorization: Bearer <token>.
   * Resposta esperada: { message, response, method }
   */
  const handleSend = async (text: string = inputValue) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    // Criar conversa se não existir, ou acrescentar à activa
    let convId = activeId;
    if (!convId) {
      convId = Date.now().toString();
      setConversations(prev => [
        {
          id: convId!,
          title: trimmed.slice(0, 40),
          messages: [userMsg],
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setActiveId(convId);
    } else {
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c)
      );
    }

    setInputValue('');
    setIsLoading(true);
    const finalId = convId;

    // ── Chamada à API de IA ────────────────────────────────────────────────────
    // Endpoint: POST /api/ai/chat/  (openapi-schema (3).yaml)
    // Body:     { message: string }
    // Auth:     Bearer token (enviado automaticamente via apiFetch)
    // O aiApi trata internamente o HTTP 429:
    //   — aguarda retry_delay da resposta (max 1 vez, sem loop)
    //   — se o limite persistir, devolve { error: AI_RATE_LIMIT_ERROR }
    const result = await aiApi.chat(trimmed);

    let botText: string;
    if (result.data) {
      // Resposta válida da IA
      botText = result.data.response || result.data.message || 'Sem resposta do servidor.';
    } else if (result.error === AI_RATE_LIMIT_ERROR) {
      // HTTP 429 persistente após espera — mensagem clara, sem dados alterados
      botText = 'Limite temporário de utilização da IA atingido. Aguarde alguns segundos e tente novamente.';
    } else {
      // Outro erro de rede ou do servidor.
      // Nunca mostrar strings técnicas internas (mensagens do Gemini, stack traces, etc.)
      console.error('[Chatbot] Erro da API de IA:', result.error);
      botText = 'O serviço de IA não está disponível de momento. Tente novamente mais tarde.';
    }

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      text: botText,
      timestamp: new Date(),
    };

    setConversations(prev =>
      prev.map(c => c.id === finalId ? { ...c, messages: [...c.messages, botMsg] } : c)
    );
    setIsLoading(false);
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

  // ── Cores do tema ─────────────────────────────────────────────────────────────
  // O Chatbot está dentro do AppShell, por isso respeita data-theme.
  // isDark vem do ThemeContext — componente nunca decide tema independentemente.
  const bg        = isDark ? '#0F1117' : '#EFF6FF';
  const sideBg    = isDark ? '#1A1D27' : '#FFFFFF';
  const sideBdr   = isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB';
  const inputBg   = isDark ? '#1E2230' : '#F9FAFB';
  const inputBdr  = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';
  const textMain  = isDark ? '#F1F5F9' : '#111827';
  const textMuted = isDark ? '#94A3B8' : '#6B7280';
  const botMsgBg  = isDark ? '#1E2230' : '#FFFFFF';
  const botMsgBdr = isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB';

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen overflow-hidden fixed inset-0 z-50"
      style={{ background: bg, color: textMain }}
    >

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header
        className="relative h-[56px] sm:h-[70px] w-full flex-shrink-0 z-20"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0F2D1C 0%, #0A1F3A 100%)'
            : 'linear-gradient(135deg, #0F4C2A 0%, #0077B6 100%)',
          borderBottom: `1px solid ${sideBdr}`,
        }}
      >
        {/* Conteúdo do Header */}
        <div className="relative h-full flex items-center justify-between px-4 sm:px-6 max-w-[1920px] mx-auto">

          {/* Lado esquerdo */}
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors md:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={20} className="text-white" strokeWidth={2.5} />
            </button>

            {/* Logo — imagem local, sem fallback externo */}
            <img
              src="/images/Logo2.png"
              alt="TxopelaTour"
              className="w-10 h-10 object-contain drop-shadow-lg hidden sm:block"
            />

            <h1
              className="text-white font-bold text-xl drop-shadow-lg hidden sm:block"
              style={{ fontFamily: 'Pacifico, cursive' }}
            >
              TxopelaTour AI
            </h1>
          </div>

          {/* Lado direito */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={newChat}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/95 hover:bg-white text-[#0077B6] rounded-full text-sm font-semibold shadow-lg transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nova conversa</span>
          </motion.button>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR DESKTOP ───────────────────────────────────────────────── */}
        <aside
          className="hidden md:flex w-[240px] flex-col flex-shrink-0"
          style={{ background: sideBg, borderRight: `1px solid ${sideBdr}` }}
        >
          {/* Pesquisa */}
          <div className="px-4 pt-4 pb-3">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
              style={{ background: inputBg, borderColor: inputBdr }}
            >
              <Search size={16} className="flex-shrink-0" style={{ color: textMuted }} />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="bg-transparent text-sm placeholder-gray-400 focus:outline-none flex-1"
                style={{ color: textMain }}
              />
            </div>
          </div>

          {/* Lista de conversas */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                  style={{ background: isDark ? '#1E2230' : '#F3F4F6' }}
                >
                  <MessageIcon />
                </div>
                <p className="text-sm" style={{ color: textMuted }}>Nenhuma conversa ainda</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {conversations.map(conv => {
                  const isActive = activeId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveId(conv.id)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-left transition-all group"
                      style={{
                        background: isActive
                          ? (isDark ? 'rgba(56,189,248,0.12)' : 'rgba(0,119,182,0.1)')
                          : 'transparent',
                        border: isActive
                          ? `1px solid ${isDark ? 'rgba(56,189,248,0.25)' : 'rgba(0,119,182,0.2)'}`
                          : '1px solid transparent',
                        color: isActive ? '#0077B6' : textMuted,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: isActive ? '#0077B6' : (isDark ? '#374151' : '#D1D5DB') }}
                        />
                        <span className="text-sm truncate">{conv.title}</span>
                      </div>
                      <button
                        onClick={(e) => deleteConv(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                        aria-label="Apagar conversa"
                      >
                        <X size={12} className="text-red-400" />
                      </button>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão Voltar */}
          <div
            className="px-2 pb-4 pt-2"
            style={{ borderTop: `1px solid ${sideBdr}` }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onBack}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all"
            >
              <ChevronLeft size={16} color="#DC2626" strokeWidth={2} />
              <span className="text-sm font-bold" style={{ color: '#DC2626' }}>Voltar</span>
            </motion.button>
          </div>
        </aside>

        {/* ── SIDEBAR MOBILE (drawer) ────────────────────────────────────────── */}
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
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="fixed left-0 top-0 bottom-0 w-[300px] z-40 flex flex-col shadow-2xl md:hidden"
                style={{ background: sideBg }}
              >
                <div
                  className="px-4 pt-6 pb-4"
                  style={{ borderBottom: `1px solid ${sideBdr}` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold" style={{ color: textMain }}>Conversas</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-red-50"
                      aria-label="Fechar menu"
                    >
                      <X size={18} style={{ color: textMuted }} />
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
                    style={{ background: inputBg, borderColor: inputBdr }}
                  >
                    <Search size={16} className="flex-shrink-0" style={{ color: textMuted }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      className="bg-transparent text-sm placeholder-gray-400 focus:outline-none flex-1"
                      style={{ color: textMain }}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                        style={{ background: isDark ? '#1E2230' : '#F3F4F6' }}
                      >
                        <MessageIcon />
                      </div>
                      <p className="text-sm" style={{ color: textMuted }}>Nenhuma conversa ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {conversations.map(conv => {
                        const isActive = activeId === conv.id;
                        return (
                          <button
                            key={conv.id}
                            onClick={() => { setActiveId(conv.id); setSidebarOpen(false); }}
                            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-left transition-all group"
                            style={{
                              background: isActive
                                ? (isDark ? 'rgba(56,189,248,0.12)' : 'rgba(0,119,182,0.1)')
                                : 'transparent',
                              color: isActive ? '#0077B6' : textMuted,
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: isActive ? '#0077B6' : '#D1D5DB' }}
                              />
                              <span className="text-sm truncate">{conv.title}</span>
                            </div>
                            <button
                              onClick={(e) => deleteConv(conv.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                              aria-label="Apagar conversa"
                            >
                              <X size={12} className="text-red-400" />
                            </button>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="px-2 pb-4 pt-2" style={{ borderTop: `1px solid ${sideBdr}` }}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onBack}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all"
                  >
                    <ChevronLeft size={16} color="#DC2626" strokeWidth={2} />
                    <span className="text-sm font-bold" style={{ color: '#DC2626' }}>Voltar</span>
                  </motion.button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── ÁREA DE CHAT ──────────────────────────────────────────────────── */}
        <main
          className="flex-1 flex flex-col min-w-0"
          style={{ background: bg }}
        >
          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              /* Empty state */
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
                  <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: textMain }}>
                    Pronto para explorar Moçambique?
                  </h2>
                  <p className="text-sm mb-6" style={{ color: textMuted }}>
                    Faça uma pergunta ou escolha uma sugestão abaixo.
                  </p>

                  {/* Sugestões */}
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
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border text-left group transition-colors"
                        style={{
                          background: isDark ? '#1E2230' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                        }}
                      >
                        <suggestion.icon size={16} style={{ color: '#0077B6', flexShrink: 0 }} />
                        <span
                          className="text-xs sm:text-sm leading-tight"
                          style={{ color: textMain }}
                        >
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
                      className={`flex gap-3 ${msg.type === 'user' ? 'justify-end items-end' : 'justify-start items-start'}`}
                    >
                      {msg.type === 'bot' && <BotAvatar size="sm" />}

                      <div className={`flex flex-col gap-1 ${msg.type === 'user' ? 'items-end max-w-[75%]' : 'items-start w-full'}`}>
                        <div
                          className={`${msg.type === 'user' ? 'px-5 py-3' : 'px-5 py-4'} text-[15px] text-left`}
                          style={
                            msg.type === 'user'
                              ? {
                                  background: 'linear-gradient(135deg, #0077B6, #005a8f)',
                                  color: '#FFFFFF',
                                  borderRadius: '18px 18px 4px 18px',
                                  boxShadow: '0 2px 8px rgba(0,119,182,0.25)',
                                  lineHeight: '1.65',
                                }
                              : {
                                  background: botMsgBg,
                                  color: textMain,
                                  border: `1px solid ${botMsgBdr}`,
                                  borderRadius: '18px 18px 18px 4px',
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                }
                          }
                        >
                          {msg.type === 'user'
                            ? <span style={{ lineHeight: '1.65' }}>{msg.text}</span>
                            : <AIMessageRenderer text={msg.text} isDark={isDark} />
                          }
                        </div>
                        <span className="text-[11px] px-2" style={{ color: textMuted }}>
                          {msg.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Avatar do utilizador */}
                      {msg.type === 'user' && (
                        user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={userName}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0 shadow-sm"
                            // Sem fallback externo — se não carregar, esconde silenciosamente
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #0077B6, #2D6A4F)' }}
                          >
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
                      <div
                        className="px-5 py-3 rounded-2xl"
                        style={{
                          background: botMsgBg,
                          border: `1px solid ${botMsgBdr}`,
                          borderRadius: '18px 18px 18px 4px',
                        }}
                      >
                        <div className="flex gap-1.5 items-center">
                          {[0, 0.15, 0.3].map((delay, i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full"
                              style={{ background: '#0077B6' }}
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

          {/* Campo de input — fixo no fundo */}
          <div
            className="px-4 py-3"
            style={{
              background: sideBg,
              borderTop: `1px solid ${sideBdr}`,
            }}
          >
            <div className="max-w-3xl mx-auto">
              <div
                className="flex items-center gap-3 rounded-2xl px-5 py-3 border transition-all shadow-sm"
                style={{
                  background: inputBg,
                  borderColor: inputBdr,
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Explore destinos e experiências..."
                  maxLength={500}
                  className="flex-1 bg-transparent text-[15px] placeholder-gray-400 focus:outline-none"
                  style={{ color: textMain }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Enviar mensagem"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    background: inputValue.trim() && !isLoading
                      ? 'linear-gradient(135deg, #0077B6, #2D6A4F)'
                      : (isDark ? '#374151' : '#D1D5DB'),
                    cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    boxShadow: inputValue.trim() && !isLoading ? '0 2px 8px rgba(0,119,182,0.3)' : 'none',
                  }}
                >
                  <Send size={16} className="text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── MODAL — confirmar exclusão ─────────────────────────────────────── */}
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
              <div
                className="rounded-2xl shadow-xl p-6 w-full max-w-sm"
                style={{ background: sideBg }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
                  <X size={22} className="text-red-500" />
                </div>
                <h3 className="text-base font-bold text-center mb-1" style={{ color: textMain }}>
                  Apagar conversa?
                </h3>
                <p className="text-sm text-center mb-6" style={{ color: textMuted }}>
                  Esta acção não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                    style={{
                      borderColor: inputBdr,
                      color: textMain,
                      background: inputBg,
                    }}
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
