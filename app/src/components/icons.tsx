/**
 * Txopela Tour — Icon System
 * Fonte única de verdade para todos os ícones da aplicação.
 * Importar sempre daqui, nunca directamente do lucide-react nos componentes.
 */

import {
  // Navigation
  Home, Map, Plus, Heart, User,
  // Actions
  Search, Bell, Settings, Camera, Share2, Bookmark,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ArrowRight, ArrowLeft, X, Check, MoreHorizontal,
  // Categories
  Waves, Landmark, Leaf, Zap, UtensilsCrossed, Anchor, TreePine,
  // Profile types
  Plane, Compass, Building2, Store,
  // Map / Location
  MapPin, Navigation, Layers, Flag,
  // Social
  MessageCircle, Users, Star,
  // Media
  Image, Trash2,
  // Service types
  Hotel, Car,
  // Misc
  Shield, Globe, Lock, Eye, EyeOff,
  Mountain, Accessibility, Theater,
  Phone, Mail, Lightbulb, Info,
  SlidersHorizontal, TrendingUp, Menu,
  // Lucide types
  type LucideProps,
} from 'lucide-react';

// ── Standard sizes ────────────────────────────────────────────────────────────
export const ICON_SM  = 16;
export const ICON_MD  = 20;
export const ICON_LG  = 24;
export const ICON_XL  = 32;
export const STROKE   = 1.8;

// ── Re-export all icons with standard names ───────────────────────────────────

// Navigation tabs
export { Home       as IconHome };
export { Map        as IconMap };
export { Plus       as IconPlus };
export { Heart      as IconHeart };
export { User       as IconUser };

// Header actions
export { Bell       as IconBell };
export { Settings   as IconSettings };
export { Search     as IconSearch };
export { MessageCircle as IconChat };
export { Share2     as IconShare };
export { Bookmark   as IconBookmark };
export { Menu       as IconMenu };

// Navigation arrows
export { ChevronLeft  as IconChevronLeft };
export { ChevronRight as IconChevronRight };
export { ChevronDown  as IconChevronDown };
export { ChevronUp    as IconChevronUp };
export { ArrowRight   as IconArrowRight };
export { ArrowLeft    as IconArrowLeft };

// State
export { X          as IconClose };
export { Check      as IconCheck };
export { MoreHorizontal as IconMore };
export { Eye        as IconEye };
export { EyeOff     as IconEyeOff };
export { Lock       as IconLock };
export { Shield     as IconShield };
export { Globe      as IconGlobe };
export { Info       as IconInfo };

// Location
export { MapPin     as IconMapPin };
export { Navigation as IconNavigation };
export { Layers     as IconLayers };
export { Flag       as IconFlag };

// Media
export { Camera     as IconCamera };
export { Image      as IconImage };
export { Trash2     as IconTrash };

// Social
export { Users      as IconUsers };
export { Star       as IconStar };

// Contact
export { Phone      as IconPhone };
export { Mail       as IconMail };

// Misc
export { SlidersHorizontal as IconFilters };
export { TrendingUp as IconTrending };
export { Lightbulb  as IconTip };
export { Accessibility as IconAccessible };
export { Mountain   as IconMountain };
export { Theater    as IconTheater };

// ── Category icons ────────────────────────────────────────────────────────────
export const CATEGORY_ICONS: Record<string, React.FC<LucideProps>> = {
  praias:     Waves,
  cultura:    Landmark,
  natureza:   Leaf,
  aventura:   Zap,
  gastro:     UtensilsCrossed,
  mergulho:   Anchor,
  ecoturismo: TreePine,
  outro:      MoreHorizontal,
};

export const CATEGORY_COLORS: Record<string, string> = {
  praias:     '#2BB5C8',
  cultura:    '#7B5EA7',
  natureza:   '#1B5E3B',
  aventura:   '#F4821F',
  gastro:     '#E05A3A',
  mergulho:   '#2563EB',
  ecoturismo: '#22C55E',
  outro:      '#9CA3AF',
};

export const CATEGORY_LABELS: Record<string, string> = {
  praias:     'Praias',
  cultura:    'Cultura & História',
  natureza:   'Natureza',
  aventura:   'Aventura',
  gastro:     'Gastronomia',
  mergulho:   'Mergulho',
  ecoturismo: 'Ecoturismo',
  outro:      'Outro',
};

// ── Profile type icons ────────────────────────────────────────────────────────
export const PROFILE_ICONS: Record<string, React.FC<LucideProps>> = {
  traveler: Plane,
  guide:    Compass,
  resident: Home,
  business: Store,
};

// ── Service type icons ────────────────────────────────────────────────────────
export const SERVICE_ICONS: Record<string, React.FC<LucideProps>> = {
  hospedagem:  Hotel,
  guia:        Compass,
  restaurante: UtensilsCrossed,
  transporte:  Car,
};

// ── Reusable icon component ───────────────────────────────────────────────────
interface AppIconProps {
  name: keyof typeof CATEGORY_ICONS | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/** Renders a category icon by id */
export function CategoryIcon({ id, size = ICON_LG, color = 'white', strokeWidth = STROKE }: {
  id: string; size?: number; color?: string; strokeWidth?: number;
}) {
  const Icon = CATEGORY_ICONS[id] || MoreHorizontal;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

/** Renders a profile type icon by id */
export function ProfileTypeIcon({ id, size = ICON_LG, color = '#1B5E3B', strokeWidth = STROKE }: {
  id: string; size?: number; color?: string; strokeWidth?: number;
}) {
  const Icon = PROFILE_ICONS[id] || User;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

/** Renders a service type icon by id */
export function ServiceTypeIcon({ id, size = ICON_LG, color = 'white', strokeWidth = STROKE }: {
  id: string; size?: number; color?: string; strokeWidth?: number;
}) {
  const Icon = SERVICE_ICONS[id] || Building2;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

