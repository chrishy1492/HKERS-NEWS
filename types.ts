export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: 'user' | 'admin';
    hker_token: number;
    phone?: string;
    gender?: string;
    address?: string;
    sol_address?: string;
    avatar_url?: string;
}

export interface Post {
    id: number;
    created_at: string;
    title_en: string;
    title_cn: string;
    content_en: string;
    content_cn: string;
    category: string;
    region: string;
    author_name: string;
    author_id?: string;
    likes: number;
    loves: number;
    is_bot: boolean;
    language?: string; // 'en' | 'zh'
}

export interface NewsGenerationResult {
    title_en: string;
    title_cn: string;
    content_en: string;
    content_cn: string;
    source_url: string;
    language: string;
}

export type ViewState = 'news' | 'games' | 'fortune' | 'profile' | 'admin';