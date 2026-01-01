
export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  points: number;
  role: UserRole;
  nickname: string;
  name?: string;
  address?: string;
  phone?: string;
  gender?: string;
  sol_address?: string;
  created_at?: string;
}

export interface Post {
  id: string;
  content: string;
  region: string;
  topic: string;
  author_id: string;
  likes: number;
  hearts: number;
  created_at: string;
  // AI Bot 擴展欄位
  is_bot?: boolean;
  source_name?: string;
  source_url?: string;
  translated_content?: string;
  is_translated?: boolean;
  profiles?: {
    nickname: string;
    role: string;
    id: string;
  };
}

export interface Notification {
  msg: string;
  type: 'info' | 'error';
}

export type AppView = 'forum' | 'game_zone' | 'fengshui_zone' | 'profile' | 'admin' | 'register' | 'disclaimer' | 'token_info';

// 區域內部的子視圖類型
export type GameSubView = 'lobby' | 'blackjack' | 'baccarat' | 'roulette' | 'slot' | 'classic';
export type FengShuiSubView = 'lobby' | 'fortune' | 'tarot' | 'ziwei' | 'pray';
