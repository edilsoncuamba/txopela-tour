import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Reply, X, Loader2, MoreVertical, Flag } from 'lucide-react';
import { postsApi, commentsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: string;   // role raw da API — usado para determinar o tipo de perfil
}

interface CommentData {
  id: string;
  content: string;
  author: CommentAuthor;
  likesCount: number;
  hasLiked: boolean;
  createdAt: string;
  replies?: CommentData[];
}

interface CommentsProps {
  postId: string;
  commentsCount: number;
  hideHeader?: boolean;
  requestInput?: number; // incrementar para abrir o formulário externamente
  /** Abre o perfil público do autor ao clicar no avatar ou nome */
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
}

// ── Helper normalizar resposta ─────────────────────────────────────────────────
function extractComments(data: any): CommentData[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.comments)) return data.comments;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

// ── Helper: tempo decorrido ────────────────────────────────────────────────────
function getTimeSince(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── CommentCard — mesmo padrão visual do ReviewCard ───────────────────────────
function CommentCard({
  comment,
  currentUserId,
  onLike,
  onReply,
  onAuthorPress,
  isReply = false,
}: {
  comment: CommentData;
  currentUserId?: string | null;
  onLike: (id: string, isReply: boolean, parentId?: string, liked?: boolean) => void;
  onReply: (id: string, name: string) => void;
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
  isReply?: boolean;
  parentId?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAuthorPress = () => {
    if (!comment.author.id || !onAuthorPress) return;
    onAuthorPress({
      id:     comment.author.id,
      name:   comment.author.name,
      avatar: comment.author.avatar,
      type:   comment.author.role ?? 'traveler',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm relative"
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar — clicável se onAuthorPress disponível */}
        <button
          className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 focus:outline-none"
          style={{ background: '#E5E7EB', cursor: onAuthorPress && comment.author.id ? 'pointer' : 'default' }}
          onClick={handleAuthorPress}
          aria-label={onAuthorPress && comment.author.id ? `Ver perfil de ${comment.author.name}` : undefined}
          disabled={!onAuthorPress || !comment.author.id}
        >
          {comment.author.avatar ? (
            <img src={comment.author.avatar} alt={comment.author.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ color: '#6B7280' }}>
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Nome — clicável se onAuthorPress disponível */}
          <button
            className="text-base font-black mb-1 text-left focus:outline-none"
            style={{
              color: '#1A1A1A',
              cursor: onAuthorPress && comment.author.id ? 'pointer' : 'default',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
            onClick={handleAuthorPress}
            disabled={!onAuthorPress || !comment.author.id}
          >
            {comment.author.name}
          </button>

          {/* Texto do comentário */}
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#6B7280' }}>
            {comment.content}
          </p>

          {/* Acções — canto inferior esquerdo (igual ao ReviewCard) */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onLike(comment.id, isReply, undefined, comment.hasLiked)}
              disabled={!currentUserId}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors"
              style={{
                background: comment.hasLiked ? '#FEF2F2' : '#F5F5F5',
                color: comment.hasLiked ? '#EF4444' : '#9E9E9E',
              }}
            >
              <Heart
                size={14}
                fill={comment.hasLiked ? 'currentColor' : 'none'}
                strokeWidth={2}
              />
              {comment.likesCount > 0 && (
                <span className="text-xs font-bold">{comment.likesCount}</span>
              )}
            </motion.button>

            {/* Responder — só em comentários raiz */}
            {!isReply && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onReply(comment.id, comment.author.name)}
                disabled={!currentUserId}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ background: '#F5F5F5', color: '#9E9E9E' }}
              >
                <Reply size={14} strokeWidth={2} />
              </motion.button>
            )}
          </div>

          {/* Data — canto inferior direito (igual ao ReviewCard) */}
          <div className="absolute bottom-4 right-4">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              {getTimeSince(comment.createdAt)}
            </p>
          </div>
        </div>

        {/* Menu ⋮ — canto superior direito (igual ao ReviewCard) */}
        {currentUserId && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={16} color="#9CA3AF" />
            </button>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg overflow-hidden z-10"
                style={{ minWidth: 160 }}
              >
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                  style={{ color: '#F59E0B' }}
                >
                  <Flag size={14} />
                  Reportar
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Respostas aninhadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-2 pl-4 border-l-2" style={{ borderColor: '#F3F4F6' }}>
          {comment.replies.map(reply => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onLike={(id, _, __, liked) => onLike(id, true, comment.id, liked)}
              onReply={onReply}
              onAuthorPress={onAuthorPress}
              isReply
              parentId={comment.id}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Comments({ postId, commentsCount: initialCount, hideHeader = false, requestInput = 0, onAuthorPress }: CommentsProps) {
  const { user } = useAuth();
  const [comments,       setComments]       = useState<CommentData[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isLoadingMore,  setIsLoadingMore]  = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [hasMore,        setHasMore]        = useState(false);
  const [newComment,     setNewComment]     = useState('');
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [replyTo,        setReplyTo]        = useState<{ id: string; name: string } | null>(null);
  const [commentsCount,  setCommentsCount]  = useState(initialCount);
  const [showInput,      setShowInput]      = useState(false);

  // Abrir formulário quando o botão externo "Comentar" é clicado
  useEffect(() => {
    if (requestInput > 0) setShowInput(true);
  }, [requestInput]);

  // ── GET /api/posts/{id}/comments/ ──────────────────────────────────────────
  const fetchComments = useCallback(async (page = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await postsApi.getComments(postId, { page, limit: 20 });

      if (apiError) {
        if (!apiError.includes('404')) setError(apiError);
        setComments([]);
        return;
      }

      const list = extractComments(data);
      if (append) setComments(prev => [...prev, ...list]);
      else setComments(list);

      const pagination = data && !Array.isArray(data) ? data.pagination : null;
      setHasMore(pagination?.hasNext ?? false);
      setCurrentPage(page);
    } catch {
      setError('Erro ao carregar comentários');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [postId]);

  useEffect(() => { fetchComments(1, false); }, [fetchComments]);

  // ── POST /api/posts/{id}/comments/ ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    if (!user) { setError('Tens de fazer login para comentar'); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      const body = {
        content: newComment.trim(),
        ...(replyTo?.id ? { parentId: replyTo.id } : {}),
      };
      const { data, error: apiError } = await postsApi.addComment(postId, body);

      if (apiError) { setError(apiError); return; }

      const created: CommentData = (data?.comment ?? data) as CommentData;
      if (!created?.id) {
        await fetchComments(1, false);
      } else if (replyTo) {
        setComments(prev => prev.map(c =>
          c.id === replyTo.id
            ? { ...c, replies: [created, ...(c.replies || [])] }
            : c,
        ));
      } else {
        setComments(prev => [created, ...prev]);
        setCommentsCount(n => n + 1);
      }

      setNewComment('');
      setReplyTo(null);
      setShowInput(false);
    } catch {
      setError('Erro ao publicar comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Like/Unlike comentário ──────────────────────────────────────────────────
  const handleLike = async (
    commentId: string,
    isReply: boolean,
    parentId?: string,
    currentlyLiked?: boolean,
  ) => {
    const applyUpdate = (c: CommentData): CommentData =>
      c.id === commentId
        ? { ...c, hasLiked: !currentlyLiked, likesCount: currentlyLiked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1 }
        : c;

    if (isReply && parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: c.replies?.map(applyUpdate) } : c,
      ));
    } else {
      setComments(prev => prev.map(applyUpdate));
    }

    try {
      const { data, error: apiError } = currentlyLiked
        ? await commentsApi.unlike(commentId)
        : await commentsApi.like(commentId);

      if (apiError || !data) {
        const revert = (c: CommentData): CommentData =>
          c.id === commentId
            ? { ...c, hasLiked: !!currentlyLiked, likesCount: currentlyLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1) }
            : c;
        if (isReply && parentId) {
          setComments(prev => prev.map(c =>
            c.id === parentId ? { ...c, replies: c.replies?.map(revert) } : c,
          ));
        } else {
          setComments(prev => prev.map(revert));
        }
        return;
      }

      const confirm = (c: CommentData): CommentData =>
        c.id === commentId ? { ...c, hasLiked: data.hasLiked, likesCount: data.likesCount } : c;

      if (isReply && parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: c.replies?.map(confirm) } : c,
        ));
      } else {
        setComments(prev => prev.map(confirm));
      }
    } catch { /* optimistic já aplicado */ }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4" style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* Header — idêntico ao ReviewManager */}
      {!hideHeader && (
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: '#1A1A1A' }}>
          Comentários{commentsCount > 0 && (
            <span className="text-base font-bold ml-1" style={{ color: '#6B7280' }}>
              ({commentsCount})
            </span>
          )}
        </h2>
        {user && !showInput && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInput(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1B5E3B' }}
          >
            Comentar
          </motion.button>
        )}
      </div>
      )}

      {/* Erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-xl"
            style={{ background: '#FEF2F2', color: '#DC2626' }}
          >
            <p className="text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulário de comentário — aparece ao clicar "Comentar" */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              {/* Indicador de reply */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5"
                  >
                    <Reply size={12} className="text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-blue-700 flex-1">
                      Responder a <strong>{replyTo.name}</strong>
                    </span>
                    <button onClick={() => setReplyTo(null)} className="text-blue-400">
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3">
                {/* Avatar do utilizador */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="text-sm font-bold text-white">
                        {user ? (user.name?.charAt(0).toUpperCase() || 'U') : '?'}
                      </span>}
                </div>

                <input
                  autoFocus
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                  placeholder={replyTo ? `Responder a ${replyTo.name}...` : 'Adiciona um comentário...'}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] focus:bg-white transition-all disabled:opacity-50"
                />

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                  className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
                  style={{ background: '#1B5E3B' }}
                >
                  {isSubmitting
                    ? <Loader2 size={16} className="text-white animate-spin" />
                    : <Send size={16} className="text-white" />}
                </motion.button>
              </div>

              <button
                onClick={() => { setShowInput(false); setReplyTo(null); setNewComment(''); }}
                className="text-xs font-semibold w-full text-center"
                style={{ color: '#9CA3AF' }}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de comentários */}
      {isLoading && comments.length === 0 ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse flex gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="mx-auto mb-2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Sem comentários ainda</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Sê o primeiro a comentar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onLike={handleLike}
              onReply={(id, name) => { setReplyTo({ id, name }); setShowInput(true); }}
              onAuthorPress={onAuthorPress}
            />
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => fetchComments(currentPage + 1, true)}
                disabled={isLoadingMore}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                {isLoadingMore ? <Loader2 size={14} className="animate-spin inline" /> : 'Carregar mais'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
