export type User = {
  id: string;
  name: string;
  username?: string;        // campo username da API (OpenAPI UserProfile.username)
  email: string;
  avatar?: string | null;
  type: 'traveler' | 'guide' | 'business' | 'resident';
  role?: string;            // role raw da API: 'tourist' | 'local_resident' | 'local_business' | 'guide' | 'curator' | 'admin'
  bio?: string;
  location?: string;
  phone?: string;
  dateOfBirth?: string;     // ISO date — campo da API
  emailVerified?: boolean;  // campo da API
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  services_count?: number;
  locals_count?: number;
  is_verified?: boolean;
  date_joined?: string;
  stats?: {                 // stats object da API
    postsCount?: number;
    followersCount?: number;
    followingCount?: number;
    servicesCount?: number;
    localsCount?: number;
    reviewsCount?: number;
  };
};

export type Local = {
  id: string;
  name: string;
  description: string;
  category: 'praia' | 'cultura' | 'restaurante' | 'aventura' | 'natureza';
  images: string[];
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  rating: number;
  reviewsCount: number;
  author: User;
  createdAt: string;
  saved: boolean;
  liked: boolean;
  likesCount: number;
  savesCount: number;
};

export type Review = {
  id: string;
  localId: string;
  user: User;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  type: 'like' | 'comment' | 'save' | 'approval' | 'mention';
  message: string;
  user?: User;
  local?: Local;
  read: boolean;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
};

export type TabType = 'home' | 'explore' | 'add' | 'map' | 'profile' | 'culture';
