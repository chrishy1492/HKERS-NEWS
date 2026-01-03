
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

// Updated to match the new SQL Schema
export interface Post {
  id: number; // bigint comes as number or string from JS, usually number is fine for UI
  title: string;
  summary: string; // AI Generated Summary (Markdown)
  content_snippet: string; // Short snippet/lead
  original_url: string;
  source_name: string;
  region: string;
  topic: string;
  is_bot: boolean;
  allow_comments: boolean;
  language: string;
  created_at: string;
  
  // UI Helper fields (optional, might be joined or defaulted)
  author_name?: string; 
  author_avatar?: string;
  likes?: number; // Kept for UI compatibility if view combines count
}

export interface BotLog {
  id?: number;
  raw_data: any;
  processed_status: 'success' | 'failed';
  sync_time?: string;
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
