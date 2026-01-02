
export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  points: number;
  role: UserRole;
  starLevel: number;
  joinedAt: string;
  avatar: string;
  solAddress?: string;
  phone?: string;
  address?: string;
  gender?: string;
}

export interface Reply {
  id: number;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: number;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  region: string;
  topic: string;
  
  // Interaction: Store user IDs. Multiple occurrences allowed for 3x limit.
  likes: string[]; 
  loves: string[]; 
  
  createdAt: string;
  replies: Reply[];

  // Bot Specific Fields
  isBot?: boolean;
  sourceUrl?: string;
  sourceName?: string;
  originalLang?: 'zh' | 'en';
  isTranslated?: boolean; // UI toggle state
  summary?: string; // The AI generated summary
  
  // Pre-generated translation content (e.g., if original is EN, this holds ZH)
  translation?: {
    title: string;
    content: string;
  };
}

export interface Game {
  id: string;
  name: string;
}

// Analytics Structure: Year -> Month -> Day -> Hour -> Count
export interface VisitorLog {
  [year: string]: {
    [month: string]: {
      [day: string]: {
        [hour: string]: {
          guests: number;
          members: number;
        }
      }
    }
  }
}

export type ViewState = 'landing' | 'token' | 'forum';
export type ForumView = 'home' | 'login' | 'register' | 'profile' | 'games' | 'divination' | 'admin';
