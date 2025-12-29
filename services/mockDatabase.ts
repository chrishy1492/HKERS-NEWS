
import { User, Post, UserRole, RobotLog, ADMIN_EMAILS, REGIONS, CATEGORIES, REGIONS_CN, Comment } from '../types';

// Sensitive words filter
const FORBIDDEN_KEYWORDS = [
  'China', 'Xi Jinping', 'Tiananmen', 'June 4', 'Independence',
  '中國', '習近平', '六四'
];

// Retention: Keep logs/posts for a reasonable time
const MAX_POSTS_LIMIT = 500; 

// =========================================================
// ADVANCED NEWS GENERATOR (BILINGUAL & LONG FORM)
// =========================================================

interface NewsTemplate {
    titleEN: string;
    titleCN: string;
    bodyEN: (region: string, source: string) => string;
    bodyCN: (region: string, source: string) => string;
    category: string;
}

// Helper to create detailed English content
const createDetailedEN = (intro: string, points: string[], conclusion: string, source: string) => {
    return `${intro}\n\nKey Highlights:\n${points.map(p => `• ${p}`).join('\n')}\n\nExpert Analysis:\n"${conclusion}"\n\n(Data provided by ${source})`;
};

// Helper to create detailed Chinese content
const createDetailedCN = (intro: string, points: string[], conclusion: string, source: string) => {
    return `${intro}\n\n重點摘要：\n${points.map(p => `• ${p}`).join('\n')}\n\n專家分析：\n「${conclusion}」\n\n(資料來源：${source})`;
};

const NEWS_TEMPLATES: NewsTemplate[] = [
    // --- FINANCE ---
    {
        category: 'Finance',
        titleEN: "Market Alert: Major Indices Hit Record Highs Amidst Tech Rally",
        titleCN: "市場快訊：科技股反彈帶動主要指數創歷史新高",
        bodyEN: (region, source) => createDetailedEN(
            `Financial markets in ${region} experienced an unprecedented surge today, driven largely by renewed investor confidence in the technology and AI sectors. Trading volume hit a 6-month high as institutional investors poured capital back into the market.`,
            [
                "The benchmark index rose by 2.4% in a single trading session.",
                "AI and Semiconductor stocks led the rally, outperforming other sectors.",
                "Inflation data came in lower than expected, fueling hopes for rate cuts."
            ],
            "This is the breakout we have been waiting for. The fundamentals in the tech sector remain incredibly strong despite global headwinds.",
            source
        ),
        bodyCN: (region, source) => createDetailedCN(
            `${region} 金融市場今日經歷了前所未有的飆升，主要受投資者對科技和人工智能領域重拾信心所推動。隨著機構投資者將資金重新注入市場，交易量創下 6 個月新高。`,
            [
                "基準指數在單一交易日內上漲了 2.4%。",
                "人工智能和半導體股票領漲，表現優於其他板塊。",
                "通脹數據低於預期，燃起了減息的希望。"
            ],
            "這就是我們一直在等待的突破。儘管面臨全球逆風，科技行業的基本面仍然非常強勁。",
            source
        )
    },
    // --- REAL ESTATE ---
    {
        category: 'Real Estate',
        titleEN: "Property Market Update: Luxury Sector Sees Unexpected Boom",
        titleCN: "房地產更新：豪宅市場出現意外繁榮",
        bodyEN: (region, source) => createDetailedEN(
            `Against all odds, the luxury real estate market in ${region} is showing signs of a massive rebound. High-net-worth individuals are actively acquiring prime assets, viewing real estate as a safe haven against currency fluctuation.`,
            [
                "Transaction volume for properties over $5M has increased by 15% QoQ.",
                "Prime districts are seeing multiple bidding wars for scarce inventory.",
                "Rental yields in the luxury segment have stabilized after a year of decline."
            ],
            "Smart money is moving back into tangible assets. We are seeing a flight to quality that hasn't been observed in the last three years.",
            source
        ),
        bodyCN: (region, source) => createDetailedCN(
            `儘管困難重重，${region} 的豪宅市場正顯示出大規模反彈的跡象。高淨值人士正積極收購優質資產，將房地產視為抵禦貨幣波動的避風港。`,
            [
                "價值 500 萬美元以上物業的交易量按季增長 15%。",
                "黃金地段因庫存稀缺，出現了多重競價戰。",
                "豪宅市場的租金回報率在經歷一年的下跌後已趨於穩定。"
            ],
            "聰明的資金正在回流到實體資產。我們正看到過去三年未曾見過的『從優質資產』的轉移。",
            source
        )
    },
    // --- CURRENT AFFAIRS ---
    {
        category: 'Current Affairs',
        titleEN: "Infrastructure Bill Passed: Massive Upgrades Coming to Transport Network",
        titleCN: "基建法案通過：交通網絡將迎來大規模升級",
        bodyEN: (region, source) => createDetailedEN(
            `The local government in ${region} has officially passed a landmark infrastructure bill aimed at modernizing the aging transportation grid. This multi-billion dollar initiative is set to create thousands of jobs and reduce commute times significantly.`,
            [
                "New high-speed rail links connecting major business hubs.",
                "Complete overhaul of the digital signaling system for metro lines.",
                "Expansion of green energy charging stations for electric vehicles."
            ],
            "This isn't just about building roads; it's about building the future economy of our region. The efficiency gains will be felt for decades.",
            source
        ),
        bodyCN: (region, source) => createDetailedCN(
            `${region} 當地政府已正式通過一項具有里程碑意義的基建法案，旨在現代化老化的交通網絡。這項耗資數十億美元的計劃預計將創造數千個就業機會，並顯著縮短通勤時間。`,
            [
                "連接主要商業中心的新高速鐵路。",
                "全面檢修地鐵線路的數字信號系統。",
                "擴建電動汽車的綠色能源充電站。"
            ],
            "這不僅僅是修路，這是關於建設我們地區未來的經濟。效率的提升將在未來幾十年內持續發揮作用。",
            source
        )
    },
    // --- DIGITAL / TECH ---
    {
        category: 'Digital',
        titleEN: "Tech Breakthrough: Local Startups Lead the Way in Green Energy AI",
        titleCN: "科技突破：本地初創企業引領綠色能源 AI",
        bodyEN: (region, source) => createDetailedEN(
            `A consortium of startups based in ${region} has unveiled a revolutionary AI algorithm capable of optimizing energy grid distribution by 30%. This breakthrough has attracted major international venture capital interest.`,
            [
                "The algorithm predicts energy spikes with 99% accuracy.",
                "Integration with existing solar and wind farms is seamless.",
                "Pilot programs in three major cities have already reduced waste by 12%."
            ],
            "We are witnessing the convergence of AI and sustainability. This technology puts our region on the map as a global innovation hub.",
            source
        ),
        bodyCN: (region, source) => createDetailedCN(
            `位於 ${region} 的一個初創企業聯盟公佈了一種革命性的 AI 算法，能夠將能源網分配優化 30%。這一突破吸引了主要的國際風險投資興趣。`,
            [
                "該算法能以 99% 的準確率預測能源峰值。",
                "與現有的太陽能和風力發電場無縫集成。",
                "三個主要城市的試點項目已減少了 12% 的浪費。"
            ],
            "我們正在見證人工智能與可持續發展的融合。這項技術使我們地區成為全球創新中心。",
            source
        )
    },
    // --- TRAVEL ---
    {
        category: 'Travel',
        titleEN: "Tourism Boom: Record Number of Visitors Expected This Season",
        titleCN: "旅遊熱潮：本季遊客人數預計將創紀錄",
        bodyEN: (region, source) => createDetailedEN(
            `Hotels and airlines in ${region} are reporting near-full capacity as the holiday season approaches. Analysts predict a tourism boom that will surpass pre-pandemic levels, injecting vital capital into the local service economy.`,
            [
                "Hotel occupancy rates are averaging 92% across the city.",
                "New direct flight routes have opened up from major global hubs.",
                "Local cultural festivals are expanding to accommodate the influx."
            ],
            "The appetite for travel has returned with a vengeance. Visitors are staying longer and spending more on authentic local experiences.",
            source
        ),
        bodyCN: (region, source) => createDetailedCN(
            `隨著假期臨近，${region} 的酒店和航空公司報告幾乎滿員。分析師預測，旅遊熱潮將超過疫情前的水平，為當地服務經濟注入重要資金。`,
            [
                "全市酒店平均入住率達 92%。",
                "主要全球樞紐已開通新的直飛航線。",
                "當地文化節正在擴大以容納湧入的人潮。"
            ],
            "旅遊慾望強勢回歸。遊客停留時間更長，並在真正的當地體驗上花費更多。",
            source
        )
    }
];

const generateMockNews = (region: string, topic?: string): Partial<Post> => {
  const sources = ['BBC', 'CNN', 'Reuters', 'ABC News', 'The Guardian', 'HK Free Press', 'Bloomberg', 'SCMP', 'Financial Times', 'TechCrunch'];
  const randSource = sources[Math.floor(Math.random() * sources.length)];
  
  // Filter templates by topic if provided, else take any
  let availableTemplates = NEWS_TEMPLATES;
  if (topic && topic !== 'All') {
      const filtered = NEWS_TEMPLATES.filter(t => t.category === topic);
      if (filtered.length > 0) availableTemplates = filtered;
  }

  const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
  
  return {
    title: `【${region}】${template.titleEN}`,
    titleCN: `【${REGIONS_CN[region] || region}】${template.titleCN}`,
    content: template.bodyEN(region, randSource),
    contentCN: template.bodyCN(REGIONS_CN[region] || region, randSource), // Store Translated Content
    region: region,
    category: template.category,
    source: randSource,
    botId: `${region}_BOT_0${Math.floor(Math.random() * 9) + 1}`,
  };
};

// Storage Keys
const KEY_USERS = 'hker_users_db_v4'; // Incremented version to clear old bad data
const KEY_POSTS = 'hker_posts_db_v4';
const KEY_ROBOT_LOGS = 'hker_robot_logs_v2';
const KEY_LAST_RUN = 'hker_robot_last_run';
const KEY_CURRENT_USER = 'hker_current_user_v3';

export const MockDB = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEY_USERS);
    return data ? JSON.parse(data) : [];
  },

  // Save specific user AND update session if it matches
  saveUser: (user: User): void => {
    const users = MockDB.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
    
    // Update current session if applicable
    const currentUserRaw = localStorage.getItem(KEY_CURRENT_USER);
    if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        if (currentUser.id === user.id) {
            localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
        }
    }
  },

  // Critical for Points Sync
  updateUserPoints: (userId: string, delta: number): number => {
    const users = MockDB.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      // Logic check to prevent negative balance on games
      if (delta < 0 && (user.points + delta < 0)) {
          return -1; // Not enough points
      }
      user.points = Math.max(0, (user.points || 0) + delta);
      
      // PERSIST IMMEDIATELY
      const index = users.findIndex(u => u.id === userId);
      users[index] = user;
      localStorage.setItem(KEY_USERS, JSON.stringify(users));

      // Update Session
      const currentUserRaw = localStorage.getItem(KEY_CURRENT_USER);
      if (currentUserRaw) {
          const cUser = JSON.parse(currentUserRaw);
          if (cUser.id === userId) {
             cUser.points = user.points;
             localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(cUser));
          }
      }
      return user.points;
    }
    return 0;
  },

  getPosts: (): Post[] => {
    const data = localStorage.getItem(KEY_POSTS);
    let posts: Post[] = data ? JSON.parse(data) : [];
    // Strict Sorting: Newest First
    posts.sort((a, b) => b.timestamp - a.timestamp);
    return posts;
  },

  // =========================================
  // AUTOMATION & ROBOT LOGIC
  // =========================================

  cleanupOldPosts: (): void => {
    let posts = MockDB.getPosts();
    if (posts.length > MAX_POSTS_LIMIT) {
        const removedCount = posts.length - MAX_POSTS_LIMIT;
        posts = posts.slice(0, MAX_POSTS_LIMIT);
        localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
        MockDB.logRobotAction('CLEANUP', `System optimized. Removed ${removedCount} old posts to maintain speed.`);
    }
  },

  logRobotAction: (action: 'POST' | 'CLEANUP' | 'ERROR', details: string, region?: string): void => {
      const logs: RobotLog[] = JSON.parse(localStorage.getItem(KEY_ROBOT_LOGS) || '[]');
      const newLog: RobotLog = {
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          action,
          details,
          region
      };
      logs.unshift(newLog); 
      if (logs.length > 500) logs.pop();
      localStorage.setItem(KEY_ROBOT_LOGS, JSON.stringify(logs));
  },

  getRobotLogs: (): RobotLog[] => {
      return JSON.parse(localStorage.getItem(KEY_ROBOT_LOGS) || '[]');
  },

  runCatchUpRoutine: (): void => {
      const lastRunStr = localStorage.getItem(KEY_LAST_RUN);
      const now = Date.now();
      
      if (!lastRunStr) {
          console.log("[Robot] First initialization. Generating starter batch.");
          MockDB.generateDailyBatch(5); // 5 per region/category combo
          localStorage.setItem(KEY_LAST_RUN, now.toString());
          return;
      }

      const lastRun = parseInt(lastRunStr);
      const diffMinutes = (now - lastRun) / (1000 * 60);
      
      if (diffMinutes >= 10) {
          const missedPostsCount = Math.min(Math.floor(diffMinutes / 5), 100);
          console.log(`[Robot] Catching up... generating ${missedPostsCount} posts.`);
          
          for(let i=0; i<missedPostsCount; i++) {
              const fakeTime = lastRun + (i * (1000 * 60 * 5)); 
              MockDB.triggerRobotPost(fakeTime);
          }
          MockDB.logRobotAction('POST', `Catch-up routine executed. Generated ${missedPostsCount} posts from offline period.`);
      }
      localStorage.setItem(KEY_LAST_RUN, now.toString());
      MockDB.cleanupOldPosts();
  },

  generateDailyBatch: (countPerCombo: number = 1): void => {
      REGIONS.forEach(region => {
          CATEGORIES.forEach(cat => {
              if (Math.random() > 0.6) { 
                  for(let i=0; i<countPerCombo; i++) {
                      MockDB.triggerRobotPost(Date.now() - Math.random() * 86400000, region, cat);
                  }
              }
          });
      });
  },

  triggerRobotPost: (forcedTimestamp?: number, targetRegion?: string, targetCategory?: string): Post | null => {
    const region = targetRegion || REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const topic = targetCategory || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    
    const mockData = generateMockNews(region, topic);
    
    const fullText = (mockData.title + mockData.content).toLowerCase();
    const hasForbidden = FORBIDDEN_KEYWORDS.some(k => fullText.includes(k.toLowerCase()));
    
    if (hasForbidden) return null;

    const timestamp = forcedTimestamp || Date.now();

    const newPost: Post = {
      id: `bot-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      title: mockData.title!,
      titleCN: mockData.titleCN,
      content: mockData.content!,
      contentCN: mockData.contentCN,
      region: region,
      category: mockData.category || topic,
      author: `${region} Bot`,
      authorId: 'system-bot',
      isRobot: true,
      timestamp: timestamp,
      displayDate: new Date(timestamp).toLocaleString(),
      likes: Math.floor(Math.random() * 50),
      hearts: Math.floor(Math.random() * 50),
      views: Math.floor(Math.random() * 200),
      source: mockData.source,
      botId: mockData.botId,
      replies: []
    };

    MockDB.savePost(newPost);
    
    if (!forcedTimestamp) {
        MockDB.logRobotAction('POST', `Posted in [${region}]: ${mockData.title?.substring(0, 20)}...`, region);
        localStorage.setItem(KEY_LAST_RUN, Date.now().toString());
    }
    return newPost;
  },

  savePost: (post: Post): void => {
    let posts = MockDB.getPosts();
    const index = posts.findIndex(p => p.id === post.id);
    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.unshift(post);
    }
    // Strict Sorting
    posts.sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
  },

  addComment: (postId: string, user: User, content: string): void => {
      const posts = MockDB.getPosts();
      const post = posts.find(p => p.id === postId);
      if (post) {
          const newComment: Comment = {
              id: `c-${Date.now()}-${Math.random()}`,
              postId,
              author: user.name,
              authorId: user.id,
              content,
              timestamp: Date.now()
          };
          if (!post.replies) post.replies = [];
          post.replies.push(newComment);
          localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
      }
  },

  deletePost: (postId: string): void => {
    let posts = MockDB.getPosts();
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
  },
  
  // REPLY DELETION
  deleteComment: (postId: string, commentId: string): void => {
      let posts = MockDB.getPosts();
      const post = posts.find(p => p.id === postId);
      if (post && post.replies) {
          post.replies = post.replies.filter(c => c.id !== commentId);
          localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
      }
  },

  login: (email: string): User | null => {
    const users = MockDB.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      // Ensure banned users can't login
      if (user.isBanned) throw new Error("This account has been banned by Administrator.");
      
      localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (user: User): void => {
    const users = MockDB.getUsers();
    
    if (users.find(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        throw new Error("Email already registered");
    }

    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      user.role = UserRole.ADMIN;
    }
    
    users.push(user);
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEY_CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  logout: (): void => {
    localStorage.removeItem(KEY_CURRENT_USER);
  },

  resetAllPoints: (value: number): void => {
      const users = MockDB.getUsers();
      users.forEach(u => u.points = value);
      localStorage.setItem(KEY_USERS, JSON.stringify(users));
      const current = MockDB.getCurrentUser();
      if(current) {
          current.points = value;
          localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(current));
      }
  }
};
