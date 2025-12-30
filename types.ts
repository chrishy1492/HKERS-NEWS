
export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: string; // 格式: HKER-XXXXXX
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
  likes: string[]; 
  loves: string[]; 
  createdAt: string;
  replies: Reply[];

  // Bot Specific Fields
  isBot?: boolean;
  sourceUrl?: string;
  sourceName?: string;
  originalLang?: 'zh' | 'en';
  isTranslated?: boolean;
  translation?: {
    title: string;
    content: string;
  };
}

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
