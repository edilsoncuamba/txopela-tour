/**
 * CommunityFeed — Feed vertical de publicações da comunidade.
 *
 * Categorias mapeadas do AddPost (valores reais da API):
 *   discovery → Praias        (Waves)
 *   story     → Cultura & Hist (Landmark)
 *   tip       → Natureza       (TreePine)  / também Ecoturismo
 *   review    → Aventura       (Compass)
 *   other     → Gastronomia    (Utensils)  / também Outro
 *   (tip2/story2 não chegam do backend — são normalizados para tip/story)
 *
 * Layout:
 *   Desktop → duas colunas: feed scroll independente | sidebar sticky
 *   Mobile  → coluna única
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { postsApi } from '@/services/api';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { IconMapPin, IconPlus, IconUsers } from '@/components/icons';

/* ─── paleta ─────────────────────────────────────────────────────────────── */

const GREEN = '#1B5E3B';
const RED   = '#EF4444';

/**
 * Mapeia o badgeKey (valor da API) → metadados de apresentação.
 * Baseado no CATEGORY_API_MAP de AddPost.tsx:
 *   discovery → Praias · story → Cultura & Hist · tip → Natureza
 *   review    → Aventura · other → Gastronomia
 */
const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  discovery: { label: 'Praias',           color: '#2BB5C8', bg: 'rgba(43,181,200,0.12)'  },
  story:     { label: 'Cultura & Hist.',  color: '#7B5EA7', bg: 'rgba(123,94,167,0.12)'  },
  tip:       { label: 'Natureza',         color: '#1B5E3B', bg: 'rgba(27,94,59,0.12)'    },
  review:    { label: 'Aventura',         color: '#0077B6', bg: 'rgba(0,119,182,0.12)'   },
  other:     { label: 'Gastronomia',      color: '#E05A3A', bg: 'rgba(224,90,58,0.12)'   },
};

/* ─── ícones SVG inline por categoria ──────────────────────────────────────── */
// Correspondem 1:1 aos ícones Lucide usados no AddPost (Waves, Landmark, TreePine, Compass, Utensils)

function CatIcon({ catKey, color, size = 16 }: { catKey: string; color: string; size?: number }) {
  switch (catKey) {

    case 'discovery': // Praias — Waves
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
          <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
          <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        </svg>
      );

    case 'story': // Cultura & História — Landmark
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="22" x2="21" y2="22"/>
          <line x1="6" y1="18" x2="6" y2="11"/>
          <line x1="10" y1="18" x2="10" y2="11"/>
          <line x1="14" y1="18" x2="14" y2="11"/>
          <line x1="18" y1="18" x2="18" y2="11"/>
          <polygon points="12 2 20 7 4 7"/>
        </svg>
      );

    case 'tip': // Natureza — TreePine / Leaf
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 14l3-3.19a1 1 0 0 0-.72-1.68h-2.44a1 1 0 0 1-.95-.68l-.88-2.95a1 1 0 0 0-1.94 0l-.88 2.95a1 1 0 0 1-.95.68H7.72a1 1 0 0 0-.72 1.68L10 14"/>
          <path d="M12 14v8"/>
          <path d="M14 22H10"/>
        </svg>
      );

    case 'review': // Aventura — Compass
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
      );

    case 'other': // Gastronomia — Utensils
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
          <path d="M7 2v20"/>
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
        </svg>
      );

    default: // Outros — MoreHorizontal (três pontos)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
        </svg>
      );
  }
}

/* ícone grid para "Todas" */
function GridIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}

/* Categorias sidebar — "Todas" + as 5 reais da API */
const SIDEBAR_CATS = [
  { key: '',          label: 'Todas',            color: GREEN    },
  { key: 'discovery', label: 'Praias',            color: '#2BB5C8' },
  { key: 'story',     label: 'Cultura & História', color: '#7B5EA7' },
  { key: 'tip',       label: 'Natureza',           color: '#1B5E3B' },
  { key: 'review',    label: 'Aventura',            color: '#0077B6' },
  { key: 'other',     label: 'Gastronomia',         color: '#E05A3A' },
  { key: 'other2',    label: 'Outros',              color: '#6B7280' },
];

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60)     return 'agora';
  if (d < 3600)   return `${Math.floor(d / 60)}m`;
  if (d < 86400)  return `${Math.floor(d / 3600)}h`;
  if (d < 604800) return `${Math.floor(d / 86400)}d`;
  return new Date(iso).toLocaleDateString('pt', { day: 'numeric', month: 'short' });
}

/* ─── tipos ──────────────────────────────────────────────────────────────── */

export interface FeedPost {
  id: string;
  /** type: valor mapeado pelo frontend ('traveler'|'guide'|'business'|'resident')
   *  role: valor raw da API ('tourist'|'local_resident'|'local_business'|'guide'|'curator'|'admin')
   *  PublicProfile aceita ambos — passar os dois garante a configuração correcta dos separadores. */
  author: { id: string; name: string; avatar?: string; type?: string; role?: string };
  title?: string;
  description: string;
  image?: string;
  images?: string[];
  badge: string;
  badgeKey: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  province?: string;
  district?: string;
  city?: string;
  tags?: string[];
}

export interface CommunityFeedProps {
  posts: FeedPost[];
  isLoading?: boolean;
  onOpenPost: (post: FeedPost) => void;
  onCreatePost?: () => void;
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
  onShowAll?: () => void;
}

/* ─── Skeletons ──────────────────────────────────────────────────────────── */

function SkeletonCard({ isDark }: { isDark: boolean }) {
  const s  = isDark ? '#22263A' : '#E5E7EB';
  const s2 = isDark ? '#1A1D27' : '#F3F4F6';
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: isDark ? '#1A1D27' : '#fff', boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.35)' : '0 1px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: s }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 rounded-full w-1/3" style={{ background: s }} />
          <div className="h-2.5 rounded-full w-1/2" style={{ background: s2 }} />
        </div>
        <div className="h-5 w-20 rounded-full" style={{ background: s }} />
      </div>
      <div className="px-4 pb-3 space-y-2">
        <div className="h-3 rounded w-full" style={{ background: s }} />
        <div className="h-3 rounded w-3/4" style={{ background: s2 }} />
      </div>
      <div style={{ height: 240, background: s }} />
      <div className="flex items-center gap-5 px-4 py-3">
        {[0,1,2].map(i => <div key={i} className="h-5 rounded w-14" style={{ background: s }} />)}
        <div className="ml-auto h-5 rounded w-5" style={{ background: s }} />
      </div>
    </div>
  );
}

function SidebarSkeleton({ isDark }: { isDark: boolean }) {
  const s = isDark ? '#22263A' : '#E5E7EB';
  return (
    <div className="space-y-2 animate-pulse px-4 pb-4">
      {[0,1,2].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: s }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded w-2/3" style={{ background: s }} />
            <div className="h-2.5 rounded w-1/2" style={{ background: s }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── InlineComment ──────────────────────────────────────────────────────── */

function InlineComment({ postId, commentsCount, onOpenComments, isDark }: {
  postId: string; commentsCount: number; onOpenComments: () => void; isDark: boolean;
}) {
  const { user } = useAuth();
  const [text,       setText]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastCmt,    setLastCmt]    = useState<{ author: string; content: string } | null>(null);
  const [count,      setCount]      = useState(commentsCount);

  const border  = isDark ? 'rgba(255,255,255,0.07)' : '#F0F0F0';
  const muted   = isDark ? '#8899BB' : '#9CA3AF';
  const textCol = isDark ? '#F0F4FF' : '#1A1A1A';
  const inputBg = isDark ? '#22263A' : '#F5F5F0';

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    const content = text.trim();
    setText(''); setSubmitting(true);
    try {
      await postsApi.addComment(postId, { content });
      setLastCmt({ author: user?.name ?? 'Tu', content });
      setCount(c => c + 1);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }, [text, postId, user, submitting]);

  return (
    <div style={{ borderTop: `1px solid ${border}` }}>
      {lastCmt ? (
        <div className="flex items-start gap-2 px-4 pt-2.5 pb-1">
          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white"
            style={{ background: GREEN }}>
            {(lastCmt.author ?? 'U')[0].toUpperCase()}
          </div>
          <p className="text-[12px] flex-1 min-w-0" style={{ color: textCol }}>
            <span className="font-black">{lastCmt.author} </span>{lastCmt.content}
          </p>
        </div>
      ) : count > 0 ? (
        <button onClick={onOpenComments} className="px-4 pt-2.5 pb-0.5 text-[12px] font-bold text-left block"
          style={{ color: muted }}>
          Ver {count === 1 ? '1 comentário' : `todos os ${count} comentários`}
        </button>
      ) : null}

      <form onSubmit={submit} className="flex items-center gap-2 px-4 py-2.5">
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white"
            style={{ background: GREEN }}>
            {(user?.name ?? 'U')[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 flex items-center rounded-full px-3 py-1.5 gap-2" style={{ background: inputBg }}>
          <input type="text" value={text} onChange={e => setText(e.target.value)}
            placeholder="Escreva um comentário..."
            className="flex-1 bg-transparent text-[12px] focus:outline-none"
            style={{ color: textCol, fontFamily: 'Nunito, sans-serif' }} />
          {text.trim() && (
            <button type="submit" disabled={submitting} className="flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GREEN}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ─── PostCard ───────────────────────────────────────────────────────────── */

function PostCard({ post, index, onOpenPost, onAuthorPress, isDark }: {
  post: FeedPost; index: number;
  onOpenPost: (p: FeedPost) => void;
  onAuthorPress?: (a: { id: string; name: string; avatar?: string; type: string }) => void;
  isDark: boolean;
}) {
  const [liked,    setLiked]    = useState(post.is_liked);
  const [likes,    setLikes]    = useState(post.likes_count);
  const [saved,    setSaved]    = useState(post.is_saved);
  const [likeAnim, setLikeAnim] = useState(false);
  const [dtAnim,   setDtAnim]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lastTapRef = useRef(0);

  const cat      = CAT_META[post.badgeKey] ?? CAT_META.other;
  const cover    = post.images?.[0] ?? post.image ?? PLACEHOLDER_IMAGE;
  const hasImg   = !!cover && cover !== PLACEHOLDER_IMAGE;
  const multi    = (post.images?.length ?? 0) > 1;
  const loc      = [post.city, post.district, post.province].filter(Boolean).join(', ');
  const isLong   = (post.description?.length ?? 0) > 120;

  const bg    = isDark ? '#1A1D27' : '#ffffff';
  const bdr   = isDark ? 'rgba(255,255,255,0.07)' : '#F0F0F0';
  const txtM  = isDark ? '#F0F4FF' : '#111827';
  const txtS  = isDark ? '#8899BB' : '#6B7280';
  const act   = isDark ? '#8899BB' : '#9CA3AF';

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const was = liked;
    setLiked(!was); setLikes(n => n + (was ? -1 : 1));
    setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600);
    try { if (was) await postsApi.unlike(post.id); else await postsApi.like(post.id); }
    catch { setLiked(was); setLikes(n => n + (was ? 1 : -1)); }
  };

  /* double-tap → like */
  const handleImgTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 380) {
      if (!liked) {
        setLiked(true); setLikes(n => n + 1);
        postsApi.like(post.id).catch(() => { setLiked(false); setLikes(n => n - 1); });
      }
      setDtAnim(true); setTimeout(() => setDtAnim(false), 900);
    } else {
      /* click simples → abrir detalhes */
      onOpenPost(post);
    }
    lastTapRef.current = now;
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const was = saved; setSaved(!was);
    try { if (was) await postsApi.unsave(post.id); else await postsApi.save(post.id); }
    catch { setSaved(was); }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const txt = post.description ?? '';
    if (navigator.share) navigator.share({ title: 'Txopela Tour', text: txt, url: window.location.origin });
    else navigator.clipboard?.writeText(`${txt}\n${window.location.origin}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.04, 0.2) }}
      className="w-full"
      style={{ background: bg, borderRadius: 16, boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.38)' : '0 1px 12px rgba(0,0,0,0.06)', overflow: 'hidden', flexShrink: 0 }}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button className="relative flex-shrink-0"
          onClick={e => { e.stopPropagation(); onAuthorPress?.({ id: post.author.id, name: post.author.name, avatar: post.author.avatar, type: post.author.type ?? post.author.role ?? 'traveler' }); }}>
          {post.author.avatar ? (
            <img src={post.author.avatar} alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover"
              style={{ border: `2.5px solid ${cat.color}` }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white"
              style={{ background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}88 100%)`, border: `2.5px solid ${cat.color}` }}>
              {(post.author.name ?? 'U')[0].toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: GREEN, borderColor: bg }} />
        </button>

        <div className="flex-1 min-w-0">
          <button className="text-left w-full"
            onClick={e => { e.stopPropagation(); onAuthorPress?.({ id: post.author.id, name: post.author.name, avatar: post.author.avatar, type: post.author.type ?? post.author.role ?? 'traveler' }); }}>
            <p className="text-[13.5px] font-extrabold leading-none truncate" style={{ color: txtM }}>
              {post.author.name ?? 'Utilizador'}
            </p>
          </button>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {loc && (
              <span className="flex items-center gap-0.5 text-[11px]" style={{ color: txtS }}>
                <IconMapPin size={10} color={txtS} />{loc}
              </span>
            )}
            {loc && <span className="text-[11px]" style={{ color: txtS }}>·</span>}
            <span className="text-[11px]" style={{ color: txtS }}>{timeAgo(post.created_at)}</span>
          </div>
        </div>

        {/* Badge com ícone SVG da categoria real */}
        <span className="flex-shrink-0 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5"
          style={{ background: cat.bg, color: cat.color }}>
          <CatIcon catKey={post.badgeKey} color={cat.color} size={12} />
          {cat.label}
        </span>
      </div>

      {/* TÍTULO + DESCRIÇÃO */}
      {(post.title || post.description) && (
        <div className="px-4 pb-3 flex flex-col gap-1">
          {/* Título — bold, destaque visual */}
          {post.title && (
            <h3
              className="text-[15px] font-extrabold leading-snug"
              style={{ color: txtM, letterSpacing: '-0.01em' }}
            >
              {post.title}
            </h3>
          )}

          {/* Descrição — máx 2 linhas + "Ler mais" */}
          {post.description && (
            <>
              <p
                className="text-[13px] leading-relaxed"
                style={{
                  color: post.title ? txtS : txtM,
                  fontFamily: 'Nunito, sans-serif',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical' as const,
                  WebkitLineClamp: expanded ? undefined : 2,
                  overflow: expanded ? 'visible' : 'hidden',
                }}
              >
                {post.description}
              </p>
              {isLong && (
                <button
                  onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                  className="text-[12px] font-bold self-start"
                  style={{ color: cat.color }}
                >
                  {expanded ? 'Ver menos' : 'Ler mais'}
                </button>
              )}
            </>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.tags.slice(0, 5).map(tag => (
                <span key={tag} className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: cat.bg, color: cat.color }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* IMAGEM — click simples → PostDetail  /  double-tap → like */}
      {hasImg && (
        <div className="relative w-full overflow-hidden cursor-pointer" onClick={handleImgTap}>
          <img src={cover} alt={post.description}
            className="w-full object-cover"
            style={{ maxHeight: 410, minHeight: 180 }}
            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />

          {/* indicador de galeria */}
          {multi && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(6px)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-[11px] font-black text-white">{post.images!.length}</span>
            </div>
          )}

          {/* double-tap heart animation */}
          <AnimatePresence>
            {dtAnim && (
              <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1.15, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.52, ease: 'backOut' }}>
                <svg width="90" height="90" viewBox="0 0 24 24"
                  fill="#0EA5E9" stroke="#0EA5E9"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 4px 16px rgba(14,165,233,0.55))' }}>
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" fill="#0EA5E9"/>
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ACÇÕES */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: hasImg ? `1px solid ${bdr}` : undefined }}>
        <div className="flex items-center gap-5">
          {/* Like */}
          <button onClick={handleLike} className="flex items-center gap-1.5">
            <motion.div animate={likeAnim ? { scale: [1, 1.5, 0.85, 1.1, 1] } : {}} transition={{ duration: 0.5 }}>
              <svg width="22" height="22" viewBox="0 0 24 24"
                fill={liked ? '#0EA5E9' : 'none'} stroke={liked ? '#0EA5E9' : act}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            </motion.div>
            <span className="text-[13px] font-bold" style={{ color: liked ? '#0EA5E9' : act }}>
              {likes > 0 ? likes : 'Gostar'}
            </span>
          </button>

          {/* Comentar */}
          <button onClick={() => onOpenPost(post)} className="flex items-center gap-1.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={act}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="text-[13px] font-bold" style={{ color: act }}>
              {post.comments_count > 0 ? post.comments_count : 'Comentar'}
            </span>
          </button>

          {/* Partilhar */}
          <button onClick={handleShare} className="flex items-center gap-1.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={act}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span className="text-[13px] font-bold" style={{ color: act }}>
              {post.shares_count > 0 ? post.shares_count : 'Partilhar'}
            </span>
          </button>
        </div>

        {/* Guardar */}
        <button onClick={handleSave}>
          <motion.div animate={saved ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
            <svg width="22" height="22" viewBox="0 0 24 24"
              fill={saved ? '#0077B6' : 'none'} stroke={saved ? '#0077B6' : act}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </motion.div>
        </button>
      </div>

      {/* COMENTÁRIO INLINE */}
      <InlineComment postId={post.id} commentsCount={post.comments_count}
        onOpenComments={() => onOpenPost(post)} isDark={isDark} />
    </motion.article>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────────────────── */

function Sidebar({ posts, isLoading, onOpenPost, onCreatePost, onFilterCategory, activeCat, isDark }: {
  posts: FeedPost[]; isLoading: boolean; activeCat: string;
  onOpenPost: (p: FeedPost) => void;
  onCreatePost?: () => void;
  onFilterCategory?: (cat: string) => void;
  isDark: boolean;
}) {
  const surface = isDark ? '#1A1D27' : '#ffffff';
  const border  = isDark ? 'rgba(255,255,255,0.07)' : '#F0F0F0';
  const txtM    = isDark ? '#F0F4FF' : '#111827';
  const txtS    = isDark ? '#8899BB' : '#6B7280';

  const featured = [...posts].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0)).slice(0, 3);

  return (
    <aside className="flex flex-col gap-4">
      {/* Criar publicação */}
      {onCreatePost && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onCreatePost}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-extrabold text-white"
          style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #2a7a52 100%)`, boxShadow: `0 4px 18px ${GREEN}44` }}>
          <IconPlus size={18} color="white" />
          Criar publicação
        </motion.button>
      )}

      {/* Categorias */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: surface, boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.3)' : '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div className="px-4 pt-4 pb-3">
          <h3 className="text-[13px] font-extrabold" style={{ color: txtM }}>Categorias</h3>
        </div>
        <div className="pb-2">
          {SIDEBAR_CATS.map((cat) => {
            const isActive = activeCat === cat.key;
            return (
              <button key={cat.key}
                onClick={() => onFilterCategory?.(cat.key)}
                className="flex items-center gap-3 w-full px-4 py-2.5 transition-all"
                style={{
                  borderTop: `1px solid ${border}`,
                  background: isActive ? `${cat.color}12` : 'transparent',
                }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cat.color}${isActive ? '28' : '18'}` }}>
                  {cat.key === '' ? (
                    <GridIcon color={cat.color} size={15} />
                  ) : (
                    <CatIcon catKey={cat.key} color={cat.color} size={15} />
                  )}
                </div>
                <span className="text-[13px] font-semibold flex-1 text-left"
                  style={{ color: isActive ? cat.color : txtM, fontWeight: isActive ? 800 : 600 }}>
                  {cat.label}
                </span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts em destaque */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: surface, boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.3)' : '0 1px 8px rgba(0,0,0,0.05)' }}>
        {/* Header — padding generoso para ícone não ficar cortado */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(244,130,31,0.12)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F4821F"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>
          <h3 className="text-[13px] font-extrabold" style={{ color: txtM }}>Posts em destaque</h3>
        </div>

        {isLoading ? (
          <SidebarSkeleton isDark={isDark} />
        ) : featured.length === 0 ? (
          <p className="px-4 pb-4 text-[12px]" style={{ color: txtS }}>Nenhum post disponível ainda.</p>
        ) : (
          <div className="pb-2">
            {featured.map((post) => {
              const cover = post.images?.[0] ?? post.image ?? PLACEHOLDER_IMAGE;
              return (
                <button key={post.id} onClick={() => onOpenPost(post)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:opacity-80 transition-opacity"
                  style={{ borderTop: `1px solid ${border}` }}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={cover} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-extrabold leading-snug line-clamp-2" style={{ color: txtM }}>
                      {post.description?.slice(0, 60) || 'Publicação'}
                    </p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: txtS }}>{post.author.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px]" style={{ color: txtS }}>{timeAgo(post.created_at)}</span>
                      <span className="flex items-center gap-0.5 text-[11px]" style={{ color: txtS }}>
                        <svg width="10" height="10" viewBox="0 0 24 24"
                          fill="#0EA5E9" stroke="#0EA5E9" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" fill="#0EA5E9"/>
                        </svg>
                        {post.likes_count}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─── CommunityFeed (principal) ─────────────────────────────────────────── */

export default function CommunityFeed({
  posts, isLoading = false, onOpenPost, onCreatePost, onAuthorPress, onShowAll,
}: CommunityFeedProps) {
  const { isDark } = useTheme();
  const [activeCat, setActiveCat] = useState('');

  const bg      = isDark ? '#0F1117' : '#F2F3F5';
  const surface = isDark ? '#1A1D27' : '#ffffff';
  const border  = isDark ? 'rgba(255,255,255,0.07)' : '#EBEBEB';
  const txtM    = isDark ? '#F0F4FF' : '#111827';

  const filtered = activeCat ? posts.filter(p => p.badgeKey === activeCat) : posts;

  return (
    <section style={{ background: bg, fontFamily: 'Nunito, sans-serif' }}>

      {/* CABEÇALHO */}
      <div className="px-4 pt-5 pb-4"
        style={{ background: isDark ? '#1A1D27' : '#ffffff', borderBottom: `1px solid ${border}` }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(27,94,59,0.10)' }}>
              <IconUsers size={18} color={GREEN} />
            </div>
            <h2 className="text-[15px] font-extrabold" style={{ color: txtM }}>
              Publicações da comunidade
            </h2>
          </div>

          {onCreatePost && (
            <motion.button whileTap={{ scale: 0.96 }} onClick={onCreatePost}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-extrabold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #2a7a52 100%)`, boxShadow: `0 4px 14px ${GREEN}44` }}>
              <IconPlus size={15} color="white" />
              Criar publicação
            </motion.button>
          )}
        </div>

        {onCreatePost && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onCreatePost}
            className="sm:hidden w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-extrabold text-white mt-3"
            style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #2a7a52 100%)`, boxShadow: `0 4px 14px ${GREEN}44` }}>
            <IconPlus size={15} color="white" />
            Criar publicação
          </motion.button>
        )}
      </div>

      {/*
       * LAYOUT: grid duas colunas (desktop) / coluna única (mobile)
       *
       * Feed (DIV 2): sem overflow próprio — cresce livremente com os cards.
       *   O <motion.main> faz o scroll da página normalmente.
       *   Os cards ficam com a altura total, sem compressão.
       *
       * Sidebar (DIV 3): sticky + top:0 em relação ao <motion.main>.
       *   Fica visível enquanto o feed passa.
       *   scroll interno (scrollbar-hide) quando o conteúdo passa de 100svh.
       *   align-self: start impede que estica para a altura do grid.
       */}
      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">

          {/* DIV 2 — feed:
               Mobile  → cresce livremente, sem scroll próprio (scroll da página mãe).
               Desktop → scroll independente limitado a 100svh, scrollbar oculta. */}
          <div
            className="min-w-0 flex flex-col gap-4 lg:max-h-svh lg:overflow-y-auto lg:overflow-x-hidden lg:scrollbar-hide"
          >

            {isLoading && posts.length === 0 && (
              <><SkeletonCard isDark={isDark} /><SkeletonCard isDark={isDark} /><SkeletonCard isDark={isDark} /></>
            )}

            {!isLoading && filtered.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl"
                style={{ background: surface }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(27,94,59,0.08)' }}>
                  <IconUsers size={30} color={GREEN} />
                </div>
                <div className="text-center px-8">
                  <p className="text-[15px] font-extrabold" style={{ color: txtM }}>
                    {activeCat ? 'Sem publicações nesta categoria' : 'Nenhuma publicação ainda'}
                  </p>
                </div>
                {onCreatePost && (
                  <button onClick={onCreatePost}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-extrabold text-white"
                    style={{ background: GREEN }}>
                    <IconPlus size={14} color="white" />
                    Criar publicação
                  </button>
                )}
              </motion.div>
            )}

            {filtered.map((post, i) => (
              <PostCard key={post.id} post={post} index={i}
                onOpenPost={onOpenPost} onAuthorPress={onAuthorPress} isDark={isDark} />
            ))}

            {isLoading && posts.length > 0 && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-2">
                  {[0,1,2,3,4].map(i => (
                    <motion.div key={i}
                      animate={{ y: [0,-7,0], opacity: [0.3,1,0.3] }}
                      transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.17 }}
                      style={{ width: 7, height: 7, borderRadius: '50%', background: i === 2 ? GREEN : `${GREEN}88` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DIV 3 — sidebar: sticky dentro do <motion.main> */}
          <div
            className="hidden lg:block w-full scrollbar-hide"
            style={{
              position: 'sticky',
              top: 0,
              alignSelf: 'start',
              maxHeight: '100svh',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            <div className="flex flex-col gap-4 py-5">
              <Sidebar posts={posts} isLoading={isLoading} activeCat={activeCat}
                onOpenPost={onOpenPost} onCreatePost={onCreatePost}
                onFilterCategory={cat => setActiveCat(cat)}
                isDark={isDark} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
