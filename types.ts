export type Region = "全部" | "中國香港" | "台灣" | "英國" | "美國" | "加拿大" | "澳洲" | "歐洲";
export type Topic = "全部" | "地產" | "時事" | "財經" | "娛樂" | "旅遊" | "數碼" | "汽車" | "宗教" | "優惠" | "校園" | "天氣" | "社區活動";
export type UserRole = "admin" | "user";

export interface InteractionRecord {
  like: number;
  love: number;
}

export interface User {
  id: string;
  email: string;
  password?: string; // In a real app, never store plain text. Used here for simulation.
  name: string;
  avatar: string;
  points: number;
  role: UserRole;
  vipLevel: number;
  solAddress: string;
  gender: string;
  joinedAt: number;
  phone?: string;
  address?: string;
  interactions?: Record<string, InteractionRecord>; // postId -> { like: 3, love: 1 }
}

export interface Post {
  id: string;
  titleCN: string;
  titleEN: string;
  contentCN: string;
  contentEN: string;
  authorId: string;
  authorName: string;
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
  onlineUsers: number;
  newRegisters: number;
  totalVisits: number;
  botLastRun: number;
}