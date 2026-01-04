
export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  sol_address?: string;
  gender: 'M' | 'F';
  points: number;
  role: 'admin' | 'user' | 'mod';
  avatar_url: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  region: string;
  category: string;
  author_name: string;
  author_id: string;
  likes: number;
  hearts: number;
  created_at: string;
  source_name?: string;
  source_url?: string;
  is_bot: boolean;
  locked?: boolean;
  translated_title?: string;
  translated_content?: string;
  liked_by?: Record<string, number>; // uid -> count (max 3)
  hearted_by?: Record<string, number>; // uid -> count (max 3)
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  sol_address: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
}

export enum GameType {
  BACCARAT = 'BACCARAT',
  ROULETTE = 'ROULETTE',
  BLACKJACK = 'BLACKJACK',
  CRAB_FISH_SHRIMP = 'CRAB_FISH_SHRIMP',
  SLOTS = 'SLOTS',
  LITTLE_MARY = 'LITTLE_MARY'
}
