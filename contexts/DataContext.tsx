
import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Post, UserRole, VisitorLog } from '../types';
import { ADMIN_EMAILS, AVATARS, REGIONS, TOPICS, SUPABASE_URL } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface DataContextType {
  users: User[];
  currentUser: User | null;
  posts: Post[];
  visitorLogs: VisitorLog;
  register: (userData: Partial<User>) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  adminUpdateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  createPost: (postData: Partial<Post>) => void;
  deletePost: (postId: number) => void;
  addReply: (postId: number, content: string) => void;
  toggleLike: (postId: number, type: 'like' | 'love') => boolean;
  updatePoints: (userId: string, amount: number) => void;
  toggleTranslation: (postId: number) => void;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

const BOT_SOURCES = [
  { name: "HK Global News", url: "https://news.hk-global.com" },
  { name: "Tech Daily", url: "https://techdaily.io" },
  { name: "World Finance", url: "https://finance.world.org" },
  { name: "Community Buzz", url: "https://community.buzz" }
];

const BOT_PHRASES = {
  en: {
    titles: [
      "{region} {topic} Update: Comprehensive Report & Key Developments",
      "In-Depth Analysis: The Changing Landscape of {topic} in {region}",
      "Breaking News: Major Shift in {region} {topic} Sector - Full Summary",
      "Weekly Strategic Overview: {region}'s {topic} Trends and Predictions"
    ],
    openers: [
      "In a significant development for the {topic} sector in {region}, recent data and field reports suggest a paradigm shift is underway. Stakeholders, including analysts, local officials, and community leaders, are closely monitoring these changes as they unfold. The following report aggregates key information from multiple sources to provide a clear picture of the current situation.",
      "The {topic} landscape in {region} is witnessing unprecedented activity this week. Driven by a combination of policy adjustments and shifting market demands, new trends are emerging that could redefine the sector for the coming years. This summary outlines the critical events and what they mean for the general public.",
      "Breaking news from {region} highlights a pivotal moment for {topic}. As discussions heat up regarding the future direction of this field, experts are weighing in with mixed reactions. We have compiled the essential facts and figures to help you navigate these complex developments.",
      "According to reliable sources within {region}, the {topic} industry is poised for a major transformation. Whether it is regulatory changes or consumer behavior shifts, the impact is expected to be widespread. Here is a detailed breakdown of the key highlights and an analysis of the broader implications."
    ],
    points: [
      "Local authorities have released a draft proposal aimed at streamlining operations, reducing bureaucratic red tape by an estimated 15%.",
      "Preliminary market data indicates a sharp increase in activity, with transaction volumes rising significantly compared to the previous quarter.",
      "Environmental concerns have prompted a review of current sustainability practices, leading to stricter compliance measures for major players.",
      "A coalition of industry leaders has announced a strategic partnership designed to foster innovation and address long-standing infrastructure challenges.",
      "Public feedback gathered from recent town halls suggests a strong demand for greater transparency, particularly regarding allocation of resources.",
      "Financial analysts have issued a cautionary note regarding short-term volatility, although the long-term fundamentals remain robust.",
      "New technological solutions are being deployed to solve persistent bottlenecks, promising faster service delivery for end-users.",
      "There is growing speculation about potential tax incentives being introduced to stimulate further growth in the sector.",
      "Consumer sentiment indices have reached a 12-month high, reflecting renewed optimism despite global economic headwinds.",
      "Several key projects have been greenlit for immediate development, expected to create thousands of jobs in the region."
    ],
    impacts: [
      "**Impact Analysis:**\nThis trend is expected to have a ripple effect across the broader economy. Small businesses may find new opportunities for growth, while larger corporations might need to pivot their strategies to remain competitive. For the average resident, these changes could translate into better services but potentially higher short-term costs as the market adjusts.",
      "**Market Implications:**\nThe immediate effect will likely be a period of adjustment as stakeholders align with the new standards. Investors are advised to remain vigilant but optimistic. The shift towards more sustainable and efficient practices is generally seen as a net positive, positioning {region} as a leader in the {topic} space.",
      "**Social Perspective:**\nFrom a community standpoint, these developments are a welcome change. The emphasis on transparency and efficiency addresses long-held grievances. However, continuous monitoring is required to ensure that the promised benefits are equitably distributed among all demographics."
    ],
    closers: [
      "**Future Outlook:**\nWe will continue to monitor these developments closely. As new data becomes available, further updates will be provided. It is a developing story with significant potential.",
      "**Conclusion:**\nThis marks a significant milestone for {region}. Its impact will likely be felt for months, if not years, to come. Residents are encouraged to stay informed and prepare for upcoming changes.",
      "**Recommendation:**\nExperts recommend that stakeholders review their current positions and adapt to the evolving landscape. Proactive engagement will be key to navigating the future of {topic} in {region}.",
      "**Final Thoughts:**\nThe situation is developing rapidly. Stay tuned to this channel for our follow-up analysis as we track the implementation of these new initiatives."
    ]
  },
  zh: {
    titles: [
      "{region} {topic} 更新：綜合報告與重點發展",
      "深度分析：{region} {topic} 領域的變革格局",
      "突發新聞：{region} {topic} 界別出現重大轉變 - 完整摘要",
      "每週戰略概覽：{region} 的 {topic} 趨勢與預測"
    ],
    openers: [
      "對於{region}的{topic}界別來說，這是一個重大發展。最新數據和實地報告顯示，一場範式轉變正在進行中。包括分析師、當地官員和社區領袖在內的利益相關者正密切關注事態發展。本報告匯總了多方來源的關鍵信息，為您提供當前局勢的清晰圖景。",
      "{region}的{topic}領域本週見證了前所未有的活躍。在政策調整和市場需求轉變的共同推動下，新趨勢正在顯現，這可能會重新定義未來幾年的行業格局。本摘要概述了關鍵事件及其對公眾的意義。",
      "來自{region}的突發新聞凸顯了{topic}的關鍵時刻。隨著關於該領域未來方向的討論升溫，專家們反應不一。我們整理了基本事實和數據，幫助您了解這些復雜的發展。",
      "據{region}內的可靠消息來源稱，{topic}行業正準備進行重大轉型。無論是監管變化還是消費者行為轉變，預計影響將是廣泛的。以下是重點摘要的詳細分類以及對更廣泛影響的分析。"
    ],
    points: [
      "當局已發布了一份草案，旨在簡化運作流程，預計將減少約 15% 的官僚繁文縟節。",
      "初步市場數據顯示活動急劇增加，交易量與上一季度相比顯著上升。",
      "環境問題促使對當前的可持續性做法進行審查，導致對主要參與者採取更嚴格的合規措施。",
      "行業領袖聯盟宣佈建立戰略合作夥伴關係，旨在促進創新並解決長期的基礎設施挑戰。",
      "從最近的市政廳會議收集的公眾反饋表明，人們強烈要求提高透明度，特別是在資源分配方面。",
      "金融分析師對短期波動發出了警告，儘管長期基本面依然強勁。",
      "正在部署新的技術解決方案以解決持續存在的瓶頸，承諾為最終用戶提供更快的服務交付。",
      "越來越多的人猜測可能會引入稅收優惠政策，以刺激該行業的進一步增長。",
      "消費者信心指數達到 12 個月以來的新高，反映出儘管全球經濟面臨逆風，但樂觀情緒重燃。",
      "幾個重點項目已獲准立即開發，預計將在該地區創造數千個就業機會。"
    ],
    impacts: [
      "**影響分析：**\n預計這一趨勢將對更廣泛的經濟產生連鎖反應。小企業可能會發現新的增長機會，而大公司可能需要調整戰略以保持競爭力。對於普通居民來說，這些變化可能轉化為更好的服務，但隨著市場的調整，短期成本可能會更高。",
      "**市場影響：**\n隨著利益相關者適應新標準，直接影響可能是一段調整期。建議投資者保持警惕但樂觀。轉向更可持續和更高效的做法通常被視為淨利好，使{region}成為{topic}領域的領導者。",
      "**社會視角：**\n從社區的角度來看，這些發展是受歡迎的變化。對透明度和效率的強調解決了長期存在的抱怨。然而，需要持續監測以確保承諾的利益在所有人口統計數據中公平分配。"
    ],
    closers: [
      "**未來展望：**\n我們將繼續密切關注這些發展。隨著新數據的出現，將提供進一步的更新。這是一個潛力巨大的發展中故事。",
      "**結論：**\n這標誌著{region}的一個重要里程碑。其影響可能會持續數月，甚至數年。鼓勵居民隨時了解情況並為即將到來的變化做好準備。",
      "**建議：**\n專家建議利益相關者審視其當前立場並適應不斷變化的格局。積極參與將是駕馭{region}{topic}未來的關鍵。",
      "**最後思考：**\n局勢發展迅速。請密切關注本頻道，我們將追蹤這些新舉措的實施情況並進行後續分析。"
    ]
  }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog>({});
  
  const botIntervalRef = useRef<number | null>(null);

  // --- CORE SYNC ENGINE (Requirement: Mobile/Web Data Interoperability) ---
  useEffect(() => {
    const fetchData = async () => {
      // Fetch Posts
      const { data: dbPosts, error: pError } = await supabase
        .from('posts')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (dbPosts) setPosts(dbPosts);

      // Fetch Users
      const { data: dbUsers, error: uError } = await supabase
        .from('users')
        .select('*');
      
      if (dbUsers) setUsers(dbUsers);

      // Check Session
      const savedSession = localStorage.getItem('hker_session_user');
      if (savedSession && dbUsers) {
        const sessionUser = JSON.parse(savedSession);
        const validUser = dbUsers.find((u: User) => u.id === sessionUser.id);
        if (validUser) setCurrentUser(validUser);
      }
    };

    fetchData();

    // --- REALTIME SUBSCRIPTION (Critical for Instant Cross-Device Sync) ---
    const channel = supabase.channel('hker_realtime_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newPost = payload.new as Post;
          setPosts(prev => {
            if (prev.find(p => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
        if (payload.eventType === 'UPDATE') {
          const updatedPost = payload.new as Post;
          setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        }
        if (payload.eventType === 'DELETE') {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
        const updatedUser = payload.new as User;
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser && currentUser.id === updatedUser.id) {
          setCurrentUser(updatedUser);
        }
      })
      .subscribe((status) => {
        console.log("Supabase Realtime Status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync Local Session for Persistence
  useEffect(() => {
    if (currentUser) localStorage.setItem('hker_session_user', JSON.stringify(currentUser));
    else localStorage.removeItem('hker_session_user');
  }, [currentUser]);

  // --- BOT WORKER (Ensures 24/7 Active Worker status) ---
  useEffect(() => {
    // Generate post every 30 seconds
    botIntervalRef.current = window.setInterval(() => {
      generateBotPost();
    }, 30000);
    
    return () => { if (botIntervalRef.current) clearInterval(botIntervalRef.current); };
  }, []);

  const generateBotPost = async () => {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const source = BOT_SOURCES[Math.floor(Math.random() * BOT_SOURCES.length)];
    
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const getPoints = (arr: string[], count: number) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    const enTitle = pick(BOT_PHRASES.en.titles).replace("{region}", region).replace("{topic}", topic);
    const enOpener = pick(BOT_PHRASES.en.openers).replace("{region}", region).replace("{topic}", topic);
    const enImpact = pick(BOT_PHRASES.en.impacts).replace("{region}", region).replace("{topic}", topic);
    const enCloser = pick(BOT_PHRASES.en.closers).replace("{region}", region).replace("{topic}", topic);
    const numPoints = 5 + Math.floor(Math.random() * 3);
    const enSelectedPoints = getPoints(BOT_PHRASES.en.points, numPoints);
    const enPointsText = enSelectedPoints.map((p, i) => `${i+1}. ${p}`).join("\n");
    const enContent = `${enOpener}\n\n**Key Highlights:**\n${enPointsText}\n\n${enImpact}\n\n${enCloser}`;

    const zhTitle = pick(BOT_PHRASES.zh.titles).replace("{region}", region).replace("{topic}", topic);
    const zhOpener = pick(BOT_PHRASES.zh.openers).replace("{region}", region).replace("{topic}", topic);
    const zhImpact = pick(BOT_PHRASES.zh.impacts).replace("{region}", region).replace("{topic}", topic);
    const zhCloser = pick(BOT_PHRASES.zh.closers).replace("{region}", region).replace("{topic}", topic);
    const zhSelectedPoints = getPoints(BOT_PHRASES.zh.points, numPoints);
    const zhPointsText = zhSelectedPoints.map((p, i) => `${i+1}. ${p}`).join("\n");
    const zhContent = `${zhOpener}\n\n**重點摘要：**\n${zhPointsText}\n\n${zhImpact}\n\n${zhCloser}`;

    const newPost: Post = {
      id: Date.now(),
      authorId: 'AI-BOT-001',
      authorName: 'AI News Robot',
      title: enTitle,
      content: enContent,
      region: region,
      topic: topic,
      likes: [],
      loves: [],
      createdAt: new Date().toISOString(),
      replies: [], 
      isBot: true,
      sourceName: source.name,
      sourceUrl: source.url,
      originalLang: 'en',
      isTranslated: false,
      translation: {
        title: zhTitle,
        content: zhContent
      }
    };

    // Insert to Supabase to trigger Realtime on all other devices (Mobile & Web)
    const { error } = await supabase.from('posts').insert(newPost);
    if (error) {
      console.error("Bot Insert Error:", error);
      // Fallback local update if offline
      setPosts(prev => [newPost, ...prev]);
    }
  };

  // --- ACTIONS ---

  const register = async (userData: Partial<User>) => {
    const newUser: User = {
      id: `HKER-${Math.floor(Math.random() * 900000) + 100000}`,
      name: userData.name || 'User',
      email: userData.email || '',
      password: userData.password,
      points: 8888, 
      role: ADMIN_EMAILS.includes(userData.email || '') ? 'admin' : 'user',
      starLevel: 0,
      joinedAt: new Date().toISOString(),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      solAddress: userData.solAddress,
      phone: userData.phone,
      address: userData.address,
      gender: userData.gender
    };
    const { error } = await supabase.from('users').insert(newUser);
    if (!error) {
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
    }
  };

  const login = (email: string, password: string) => {
    const user = users.find((u: User) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const adminUpdateUser = async (userId: string, updates: Partial<User>) => {
    const { error } = await supabase.from('users').update(updates).eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      if (currentUser && currentUser.id === userId) setCurrentUser({ ...currentUser, ...updates });
    }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (currentUser && currentUser.id === userId) logout();
    }
  };

  const updatePoints = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newPoints = Math.max(0, user.points + amount);
    
    const { error } = await supabase.from('users').update({ points: newPoints }).eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, points: newPoints } : u));
      if (currentUser && currentUser.id === userId) setCurrentUser(curr => curr ? { ...curr, points: newPoints } : null);
    }
  };

  const createPost = (postData: Partial<Post>) => {
    alert("系統公告：目前僅限機械人發貼 (System Notice: Posting is currently restricted to Bots only).");
  };

  const deletePost = async (postId: number) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const addReply = (postId: number, content: string) => {
    alert("系統公告：目前已關閉回覆功能 (System Notice: Replying is currently disabled).");
  };

  const toggleLike = async (postId: number, type: 'like' | 'love') => {
    if (!currentUser) return false;
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    const list = type === 'like' ? [...post.likes] : [...post.loves];
    const userCount = list.filter(id => id === currentUser.id).length;
    
    if (userCount < 3) {
      list.push(currentUser.id);
      const updates = type === 'like' ? { likes: list } : { loves: list };
      
      const { error } = await supabase.from('posts').update(updates).eq('id', postId);
      if (!error) {
        updatePoints(currentUser.id, 150); 
        return true;
      }
    }
    return false;
  };

  const toggleTranslation = (postId: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, isTranslated: !p.isTranslated };
    }));
  };

  return (
    <DataContext.Provider value={{
      users, currentUser, posts, visitorLogs,
      register, login, logout,
      adminUpdateUser, deleteUser,
      createPost, deletePost, addReply, toggleLike,
      updatePoints, toggleTranslation
    }}>
      {children}
    </DataContext.Provider>
  );
};
