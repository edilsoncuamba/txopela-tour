import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Reply, X, Loader2 } from 'lucide-react';
import { postsApi, commentsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;
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
}

// ── Helper normalizar resposta da API ─────────────────────────────────────────
// GET /api/posts/{id}/comments/ devolve array directamente (conforme OpenAPI)
// mas o apiFetch extrai o envelope { data: ... }, logo pode vir:
//   - array directamente
//   - { comments: [...] }  (envelope não extraído)
//   - null / undefined (sem dados)
function extractComments(data: any): CommentData[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.comments)) return data.comments;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Comments({ postId, commentsCount: initialCount }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments]         = useState<CommentData[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const [hasMore, setHasMore]           = useState(false);
  const [newComment, setNewComment]     = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo]           = useState<{ id: string; name: string } | null>(null);
  const [commentsCount, setCommentsCount] = useState(initialCount);

  // ── GET /api/posts/{id}/comments/ ──────────────────────────────────────────
  const fetchComments = useCallback(async (page = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await postsApi.getComments(postId, { page, limit: 20 });

      if (apiError) {
        // 404 = post sem comentários ainda, não é erro de UI
        if (!apiError.includes('404')) setError(apiError);
        setComments([]);
        return;
      }

      const list = extractComments(data);

      if (append) {
        setComments(prev => [...prev, ...list]);
      } else {
        setComments(list);
      }

      // pagination pode estar em data.pagination (envelope não extraído)
      // ou já não estar (array directo)
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

  useEffect(() => {
    fetchComments(1, false);
  }, [fetchComments]);

  // ── POST /api/posts/{id}/comments/ ─────────────────────────────────────────
  const handleSubmitComment = async () => {
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

      if (apiError) {
        setError(apiError);
        return;
      }

      // A API devolve o comentário criado directamente ou dentro de { comment: ... }
      const created: CommentData = (data?.comment ?? data) as CommentData;
      if (!created?.id) {
        // Se não tiver id, recarrega a lista
        await fetchComments(1, false);
      } else if (replyTo) {
        // Insere a resposta no comentário pai
        setComments(prev => prev.map(c =>
          c.id === replyTo.id
            ? { ...c, replies: [created, ...(c.replies || [])] }
            : c
        ));
      } else {
        // Insere no topo
        setComments(prev => [created, ...prev]);
        setCommentsCount(n => n + 1);
      }

      setNewComment('');
      setReplyTo(null);
    } catch {
      setError('Erro ao publicar comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── POST/DELETE /api/comments/{id}/like/ ───────────────────────────────────
  const handleLikeComment = async (
    commentId: string,
    isReply: boolean,
    parentId?: string,
    currentlyLiked?: boolean,
  ) => {
    // Optimistic update imediato
    const applyUpdate = (c: CommentData): CommentData =>
      c.id === commentId
        ? {
            ...c,
            hasLiked: !currentlyLiked,
            likesCount: currentlyLiked
              ? Math.max(0, c.likesCount - 1)
              : c.likesCount + 1,
          }
        : c;

    if (isReply && parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: c.replies?.map(applyUpdate) }
          : c
      ));
    } else {
      setComments(prev => prev.map(applyUpdate));
    }

    try {
      const { data, error: apiError } = currentlyLiked
        ? await commentsApi.unlike(commentId)   // DELETE /api/comments/{id}/like/
        : await commentsApi.like(commentId);    // POST   /api/comments/{id}/like/

      if (apiError || !data) {
        // Reverter optimistic update
        const revert = (c: CommentData): CommentData =>
          c.id === commentId
            ? {
                ...c,
                hasLiked: !!currentlyLiked,
                likesCount: currentlyLiked
                  ? c.likesCount + 1
                  : Math.max(0, c.likesCount - 1),
              }
            : c;

        if (isReply && parentId) {
          setComments(prev => prev.map(c =>
            c.id === parentId ? { ...c, replies: c.replies?.map(revert) } : c
          ));
        } else {
          setComments(prev => prev.map(revert));
        }
        return;
      }

      // Confirmar com valores reais da API
      const confirmUpdate = (c: CommentData): CommentData =>
        c.id === commentId
          ? { ...c, hasLiked: data.hasLiked, likesCount: data.likesCount }
          : c;

      if (isReply && parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: c.replies?.map(confirmUpdate) } : c
        ));
      } else {
        setComments(prev => prev.map(confirmUpdate));
      }
    } catch {
      // falha silenciosa — optimistic já aplicado
    }
  };

  // ── Renderizar comentário ──────────────────────────────────────────────────
  const renderComment = (comment: CommentData, isReply = false, parentId?: string) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={isReply ? 'ml-10 mt-2' : 'mb-4'}
    >
      <div className="flex gap-2">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {comment.author.avatar
            ? <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
            : <span className="text-xs font-bold text-white">{comment.author.name.charAt(0).toUpperCase()}</span>}
        </div>

        {/* Balão */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-3 py-2">
            <p className="text-xs font-bold text-gray-900 text-left">{comment.author.name}</p>
            <p className="text-sm text-gray-700 mt-0.5 text-left">{comment.content}</p>
          </div>

          {/* Acções */}
          <div className="flex items-center gap-3 mt-1 ml-1">
            <button
              onClick={() => handleLikeComment(comment.id, isReply, parentId, comment.hasLiked)}
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: comment.hasLiked ? '#EF4444' : '#9CA3AF' }}
            >
              <Heart size={12} fill={comment.hasLiked ? 'currentColor' : 'none'} />
              {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyTo({ id: comment.id, name: comment.author.name })}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#0077B6] transition-colors"
              >
                <Reply size={12} />
                Responder
              </button>
            )}

            <span className="text-xs text-gray-400">{getTimeSince(comment.createdAt)}</span>
          </div>

          {/* Respostas */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-1">
              {comment.replies.map(reply => renderComment(reply, true, comment.id))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white" style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Comentários ({commentsCount})</h3>
        {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
      </div>

      {/* Erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-red-50 flex items-center gap-2"
          >
            <p className="text-xs text-red-600 flex-1">{error}</p>
            <button onClick={() => setError(null)}>
              <X size={14} className="text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 py-3 border-b border-gray-100">
        {/* Indicador de reply */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-2 bg-blue-50 rounded-lg px-3 py-1.5"
            >
              <Reply size={12} className="text-blue-500 flex-shrink-0" />
              <span className="text-xs text-blue-700 flex-1">
                Responder a <strong>{replyTo.name}</strong>
              </span>
              <button onClick={() => setReplyTo(null)} className="text-blue-400 hover:text-blue-600">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {/* Avatar do utilizador */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-xs font-bold text-white">
                  {user ? (user.name?.charAt(0).toUpperCase() || 'U') : '?'}
                </span>}
          </div>

          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
            placeholder={user ? (replyTo ? `Responder a ${replyTo.name}...` : 'Adiciona um comentário...') : 'Faz login para comentar'}
            disabled={isSubmitting || !user}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:bg-white transition-all disabled:opacity-50"
          />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting || !user}
            className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 transition-all"
            style={{ background: '#0077B6' }}
          >
            {isSubmitting
              ? <Loader2 size={16} className="text-white animate-spin" />
              : <Send size={16} className="text-white" />}
          </motion.button>
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 py-4">
        {isLoading && comments.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 bg-gray-200 rounded-2xl h-14" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="mx-auto mb-2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500">Sem comentários ainda</p>
            <p className="text-xs text-gray-400 mt-1">Sê o primeiro a comentar!</p>
          </div>
        ) : (
          <>
            {comments.map(comment => renderComment(comment))}

            {hasMore && (
              <div className="text-center mt-4">
                <button
                  onClick={() => fetchComments(currentPage + 1, true)}
                  disabled={isLoadingMore}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-semibold text-gray-700 transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? <Loader2 size={14} className="animate-spin inline" /> : 'Carregar mais'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Helper: tempo decorrido ───────────────────────────────────────────────────
function getTimeSince(dateString: string): string {
  if (!dateString) return '';
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60)    return 'agora';
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(dateString).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}
