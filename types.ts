
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export interface User {
  id: string; // Member ID
  name: string;
  email: string;
  password?: string; // stored for mock auth
  address: string;
  phone: string;
  solAddress: string;
  gender: string;
  role: UserRole;
  points: number;
  avatarId: number; // 1-88
  isBanned?: boolean;
  joinedAt?: number; // Timestamp for registration analysis
  lastActive?: number; // Timestamp for "Active Today" analysis
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: number;
}

export interface Post {
  id: string;
  title: string;
  titleCN?: string; // Translated Title
  content: string;
  contentCN?: string; // Translated Content
  region: string; // HK, TW, UK, US, CA, AU
  category: string; // RealEstate, News, Finance, etc.
  author: string; // 'Robot' or User Name
  authorId: string;
  isRobot: boolean;
  timestamp: number;
  displayDate: string;
  likes: number;
  hearts: number;
  views: number;
  source?: string;
  sourceUrl?: string; // NEW: Stores the original external news link
  botId?: string;
  replies: Comment[]; // New: Comments array
  // New: Track user interactions { userId: { likes: 0-3, hearts: 0-3 } }
  userInteractions?: Record<string, { likes: number, hearts: number }>;
}

export interface RobotLog {
  id: string;
  timestamp: number;
  action: 'POST' | 'CLEANUP' | 'ERROR';
  details: string;
  region?: string;
}

export interface GameResult {
  win: boolean;
  amount: number;
  game: 'Slots' | 'FishPrawnCrab' | 'Blackjack' | 'Roulette' | 'Baccarat';
}

export const REGIONS = ['Hong Kong', 'Taiwan', 'UK', 'USA', 'Canada', 'Australia'];

export const REGIONS_CN: Record<string, string> = {
  'Hong Kong': '香港',
  'Taiwan': '台灣',
  'UK': '英國',
  'USA': '美國',
  'Canada': '加拿大',
  'Australia': '澳洲'
};

export const CATEGORIES = [
  'Real Estate', 'Current Affairs', 'Finance', 'Entertainment', 'Travel', 
  'Digital', 'Offers', 'Campus', 'Weather'
];

export const CATEGORIES_CN: Record<string, string> = {
  'Real Estate': '地產',
  'Current Affairs': '時事',
  'Finance': '財經',
  'Entertainment': '娛樂',
  'Travel': '旅遊',
  'Digital': '數碼',
  'Offers': '優惠',
  'Campus': '校園',
  'Weather': '天氣'
};

// STRICT ADMIN LIST
export const ADMIN_EMAILS = [
  'chrishy1494@gmail.com', 
  'hkerstoken@gmail.com', 
  'niceleung@gmail.com'
];

export const VIP_LEVELS = [
  { level: 1, points: 100000, title: '1 Star Member ⭐️' },
  { level: 2, points: 300000, title: '2 Star Member ⭐️⭐️' },
  { level: 3, points: 700000, title: '3 Star Member ⭐️⭐️⭐️' },
  { level: 4, points: 1500000, title: '4 Star Member ⭐️⭐️⭐️⭐️' },
  { level: 5, points: 5000000, title: '5 Star Member ⭐️⭐️⭐️⭐️⭐️' },
];
