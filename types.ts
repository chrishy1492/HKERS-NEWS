
export type UserRole = 'user' | 'admin';

export type Session = any;

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string;
  role: UserRole;
  points: number;
  sol_address?: string;
  full_name?: string;
  physical_address?: string;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Secret';
  created_at?: string;
}

export interface Post {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  region: string;
  topic: string;
  likes: number;
  hearts: number;
  is_bot?: boolean;
  is_announcement?: boolean;
  is_readonly?: boolean;
  source_name?: string;
  source_url?: string;
  original_lang?: 'zh' | 'en';
  created_at: string;
}

export enum AppView {
  LANDING = 'landing',
  FORUM = 'forum',
  TOKEN = 'token'
}

export enum ForumSubView {
  FEED = 'feed',
  ADMIN = 'admin',
  PROFILE = 'profile',
  AI_CHAT = 'ai_chat',
  
  // Hubs
  FORTUNE_HUB = 'fortune_hub',
  GAMES_HUB = 'games_hub',
  
  // Fortune Views
  FORTUNE_AI = 'fortune_ai',
  PRAYER = 'prayer',
  ZIWEI = 'ziwei',
  TAROT = 'tarot',
  FORTUNE_TELLER = 'fortune_teller',
  
  // Game Views
  BLACKJACK = 'blackjack',
  BACCARAT = 'baccarat',
  ROULETTE = 'roulette',
  SLOTS = 'slots',
  FISH_PRAWN_CRAB = 'fpc',
  LITTLE_MARY = 'mary'
}
