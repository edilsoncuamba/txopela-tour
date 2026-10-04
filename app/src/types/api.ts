// ── Types gerados a partir do openapi-schema.yaml ────────────────────────────
// Fonte: openapi-schema.yaml (backend Django)
// NUNCA alterar este ficheiro manualmente — reflecte exactamente o OpenAPI

// ── Enums ─────────────────────────────────────────────────────────────────────
export type UserRole = 'tourist' | 'local_resident' | 'local_business' | 'guide' | 'curator' | 'admin';
export type RegisterRole = 'tourist' | 'local_resident' | 'business';
export type LocalCategory = 'restaurant' | 'hotel' | 'attraction' | 'shop' | 'service';
export type ServiceCategory = 'transport' | 'guide' | 'accommodation' | 'experience' | 'equipment';
export type PostCategory = 'discovery' | 'review' | 'tip' | 'story' | 'other';
export type ServiceStatus = 'pending' | 'approved' | 'rejected';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'copyright' | 'other';
export type UploadContext = 'post' | 'local' | 'service' | 'profile' | 'other';
export type Language = 'pt' | 'en';

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;         // min: 8
  role?: RegisterRole;      // default: tourist
  phone?: string;
  dateOfBirth?: string;     // date format
  termsAccepted: boolean;   // required
}

/** RegisterResponse — tokens estão no root (não dentro de user) */
export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  emailVerified: boolean;
  createdAt: string;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;     // campo camelCase conforme spec
}

export interface LogoutRequest {
  refreshToken?: string;
}

// ── UserProfile (GET/PUT/PATCH /api/auth/me/) ─────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;            // read-only
  username: string;         // display name
  role: UserRole;           // read-only
  phone?: string;
  bio?: string;
  avatar?: string | null;
  language?: Language;
  created_at: string;       // snake_case conforme OpenAPI
}

export interface UserProfileRequest {
  username: string;         // required
  phone?: string;
  bio?: string;
  avatar?: File | null;
  language?: Language;
}

// ── UserUpdateRequest (PUT /api/users/me/) ────────────────────────────────────
export interface UserUpdateRequest {
  name?: string;
  phone?: string;
  dateOfBirth?: string | null;
  bio?: string;
}

// ── Locals ────────────────────────────────────────────────────────────────────
export interface LocalOwner {
  id: string;
  name: string;
  avatar: string;
}

export interface LocalReview {
  id: string;
  rating: number;
  comment: string;
  author: LocalOwner;
  createdAt: string;
  helpful: number;
  images?: string[];
  hasMarkedHelpful?: boolean;
  hasMarkedUnhelpful?: boolean;
  unhelpful?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface LocalList {
  id: string;
  name: string;
  description: string;
  category: LocalCategory;
  subcategory?: string;
  bestSeason: string;
  highlights: any;
  images: string[];
  location: Record<string, any>;
  contact: Record<string, string>;
  hours?: any;
  rating: Record<string, any>;
  priceRange?: string;
  amenities?: any;
  owner: LocalOwner;
  status: ServiceStatus;
  createdAt: string;
  distance?: number;
}

export interface LocalDetail extends LocalList {
  reviews: LocalReview[];
  relatedLocals: LocalList[];
}

/** LocalWriteRequest — campos PLANOS (sem JSON aninhado) */
export interface LocalWriteRequest {
  name: string;             // required
  description: string;      // required
  category?: LocalCategory; // default: attraction
  subcategory?: string;
  best_season?: string;     // snake_case
  highlights?: any;
  // Localização administrativa
  province?: string;        // Província
  municipality?: string;    // Distrito (mapeado para municipality)
  district?: string;        // Distrito (campo directo, se backend aceitar)
  administrative_post?: string; // Posto Administrativo
  locality?: string;        // Localidade/Vila/Cidade
  neighborhood?: string;    // Bairro/Zona
  address?: string;         // Endereço completo
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  hours?: any;
  priceRange?: string;
  amenities?: any;
  images?: File[];          // max: 10
}

export interface LocalReviewWriteRequest {
  rating: number;           // 1-5, required
  comment: string;          // required (minLength: 1)
}

export interface ReviewUpdateRequest {
  rating?: number;          // 1-5
  comment?: string;
  images?: string[];
}

export interface ReviewListResponse {
  success: boolean;
  reviews: LocalReview[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ReviewDetailResponse {
  success: boolean;
  review: LocalReview;
}

// ── Services ──────────────────────────────────────────────────────────────────
export interface Provider {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
}

export interface ServiceList {
  id: string;
  title: string;            // ATENÇÃO: 'title' não 'name'
  description: string;
  category: ServiceCategory;
  subcategory?: string;
  images: string[];
  provider: Provider;
  pricing: Record<string, any>;
  location: Record<string, any>;
  contact: Record<string, any>;
  availability: Record<string, any>;
  features?: any;
  requirements?: any;
  rating: Record<string, any>;
  status: ServiceStatus;
  createdAt: string;
}

export interface ServiceDetail extends ServiceList {
  reviews: ServiceReview[];
  relatedServices: ServiceList[];
}

export interface ServiceReview {
  id: string;
  rating: number;
  comment: string;
  author: Record<string, any>;
  createdAt: string;
  helpful?: number;
  images?: string[];
  hasMarkedHelpful?: boolean;
  hasMarkedUnhelpful?: boolean;
  unhelpful?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface ServiceReviewWriteRequest {
  rating: number;           // 1-5, required
  comment: string;          // required (minLength: 1)
}

/** ServiceWriteRequest — campos PLANOS */
export interface ServiceWriteRequest {
  title: string;            // required (não 'name')
  description: string;      // required
  category?: ServiceCategory;
  subcategory?: string;
  schedule?: string;
  phone?: string;
  whatsapp?: string;
  contact_email?: string;   // snake_case
  // Localização administrativa
  province?: string;        // Província
  municipality?: string;    // Distrito (mapeado para municipality)
  district?: string;        // Distrito (campo directo)
  administrative_post?: string; // Posto Administrativo
  locality?: string;        // Localidade/Vila/Cidade
  neighborhood?: string;    // Bairro/Zona
  address?: string;         // Endereço completo
  latitude?: number | null;
  longitude?: number | null;
  pricing?: string;         // JSON string
  availability?: string;    // JSON string
  features?: string;        // JSON array string
  requirements?: string;    // JSON array string
  images?: File[];          // max: 20
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
}

export interface PostList {
  id: string;
  title: string;
  content: string;
  images: string[];
  category: PostCategory;
  province?: string;
  location: Record<string, any>;
  author: PostAuthor;
  stats: Record<string, number>;
  userInteraction: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface PostDetail extends PostList {
  tags: any;
}

export interface PostWriteRequest {
  title: string;            // required
  content: string;          // required
  category?: PostCategory;
  province?: string;
  location?: string;        // JSON string
  tags?: string;            // JSON array string
  images?: File[];          // max: 10
}

// ── Comments ──────────────────────────────────────────────────────────────────
export interface CommentAuthor {
  id: string;
  name: string;
  avatar: string;
}

export interface Reply {
  id: string;
  content: string;
  author: CommentAuthor;
  likesCount: number;
  hasLiked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  likesCount: number;
  hasLiked: boolean;
  createdAt: string;
  replies: Reply[];
}

export interface CommentCreateRequest {
  content: string;          // required, min: 1
  parentId?: string | null;
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export interface BookingCreateRequest {
  startDate: string;        // required, date format
  endDate?: string | null;
  participants?: number;    // default: 1, min: 1
  message?: string;
  contactInfo?: Record<string, any>;
  specialRequests?: string;
}

export interface BookingStatusRequest {
  status: 'confirmed' | 'cancelled' | 'completed';
  reason?: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  service: { id: string; title: string; images: string[] };
  customer: { id: string; name: string };
  provider: { id: string; name: string };
  startDate: string;
  endDate: string;
  participants: number;
  message?: string;
  status: BookingStatus;
  totalAmount: string;
  createdAt: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface ApproveItemRequest {
  action: 'approve' | 'reject';
  reason?: string;          // obrigatório para reject
}

export interface ApproveItemResponse {
  success: boolean;
  message: string;
  status: string;
}

export interface AdminStatsResponse {
  success: boolean;
  stats: Record<string, any>;
}

// ── Responses comuns ──────────────────────────────────────────────────────────
export interface LikeResponse {
  success: boolean;
  hasLiked: boolean;
  likesCount: number;
}

export interface SaveResponse {
  success: boolean;
  hasSaved: boolean;
}

export interface CommentLikeResponse {
  success: boolean;
  hasLiked: boolean;
  likesCount: number;
}

export interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
}

export interface ReviewHelpfulResponse {
  success: boolean;
  helpfulCount: number;
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
}

export interface GeocodeResponse {
  success: boolean;
  address: string;
  province: string;
  district: string;
  locality: string;
  country: string;
  countryCode: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

export interface AvatarUploadResponse {
  success: boolean;
  avatarUrl: string;
}
