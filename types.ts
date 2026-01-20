
export type Region = "全部" | "中國香港" | "台灣" | "英國" | "美國" | "加拿大" | "澳洲" | "歐洲";
export type Topic = "全部" | "地產" | "時事" | "財經" | "娛樂" | "旅遊" | "數碼" | "汽車" | "宗教" | "優惠" | "校園" | "天氣" | "社區活動";
export type UserRole = "admin" | "user";

export interface InteractionRecord {
  like: number;
  love: number;
}

export interface User {
  id: string; // UUID from Supabase or generated
  email: string;
  password?: string; // Stored for simulation, in prod use Supabase Auth
  name: string;
  avatar: string; // Emoji or URL
  points: number;
  role: UserRole;
  vipLevel: number;
  solAddress: string;
  gender: 'M' | 'F' | 'O';
  phone?: string;
  address?: string;
  joinedAt: number;
  lastLogin?: number;
}

export interface Post {
  id: string; // UUID
  titleCN: string;
  titleEN: string;
  contentCN: string;
  contentEN: string;
  authorId: string;
  authorName: string; // Usually "HKER Bot 🤖"
  authorAvatar: string;
  timestamp: number;
  region: string;
  topic: string;
  likes: number;
  loves: number;
  isBot: boolean;
  sourceUrl?: string;
  sourceName?: string;
}

export interface Stat {
  onlineUsers: number; // Simulated realtime
  totalUsers: number;
  todayRegisters: number;
  todayVisits: number;
}
