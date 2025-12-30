
export const SUPABASE_URL = "https://wgkcwnyxjhnlkrdjvzyj.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG";

export const ADMIN_EMAILS = [
  "chrishy1494@gmail.com", 
  "hkerstoken@gmail.com", 
  "niceleung@gmail.com"
];

// Updated Regions per Requirement 13a
export const REGIONS = [
  "中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"
];

// Updated Topics per Requirement 13b
export const TOPICS = [
  "地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "宗教", "優惠", "校園", "天氣", "社區活動"
];

// Generate deterministic avatars based on index
export const AVATARS = Array.from({ length: 90 }, (_, i) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${i}&backgroundColor=b6e3f4`);

// Pure Gambling Games
export const GAMBLING_GAMES = [
  { id: 'littlemary', name: '小瑪莉 (Little Mary)' },
  { id: 'slots', name: '幸運老虎機 (Lucky Slots)' },
  { id: 'sicbo', name: '魚蝦蟹 (Hoo Hey How)' },
  { id: 'baccarat', name: '百家樂 (Baccarat)' },
  { id: 'roulette', name: '彈珠輪盤 (Roulette)' },
  { id: 'blackjack', name: '賭場21點 (Blackjack)' }
];

// Divination Tools (Moved from Games)
export const DIVINATION_APPS = [
  { id: 'ziwei', name: '紫微斗數 (Zi Wei Dou Shu)' },
  { id: 'finger', name: '掐指一算 (Finger Divination)' },
  { id: 'tarot', name: 'AI 塔羅 (AI Tarot)' },
];

export const STAR_LEVELS = [
  { level: 1, cost: 100000 }, 
  { level: 2, cost: 300000 }, 
  { level: 3, cost: 700000 },
  { level: 4, cost: 1500000 }, 
  { level: 5, cost: 5000000 }
];

export const FORTUNE_POEMS = {
  "大安": [
    "大安事事昌，求财在坤方，失物去不远，宅舍保安康",
    "行人身未动，病者主无妨，将军回田野，仔细更推详"
  ],
  "留連": [
    "留连留连事难成，求谋日未明，官事凡宜缓，去者未回程",
    "失物南方见，急讨方心称，更须防口舌，人口且平平"
  ],
  "速喜": [
    "速喜速喜喜来临，求财向南行，失物申未午，逢人路上寻",
    "官事有福德，病者无祸侵，田宅六畜吉，行人有信音"
  ],
  "赤口": [
    "赤口赤口主口舌，官非切宜防，失物速速讨，行人有惊慌",
    "六畜多作怪，病者出西方，更须防咀咒，诚恐染瘟皇"
  ],
  "小吉": [
    "小吉小吉最吉昌，路上好商量，阴人来报喜，失物在坤方",
    "行人即便至，交关甚是强，凡事皆和合，病者叩穷苍"
  ],
  "空亡": [
    "空亡空亡事不祥，阴人多乖张，求财无利益，行人有灾殃",
    "失物寻不见，官事有刑伤，病人逢暗鬼，解禳保安康"
  ]
};

export const SHICHEN_MAPPING = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// Fish Prawn Crab Game Config
export const HOO_HEY_HOW_SYMBOLS = [
  { id: 'fish', name: '魚', icon: '🐟', color: 'bg-red-500', textColor: 'text-red-600' },
  { id: 'prawn', name: '蝦', icon: '🦐', color: 'bg-green-500', textColor: 'text-green-600' },
  { id: 'calabash', name: '葫蘆', icon: '🏺', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: 'coin', name: '金錢', icon: '💰', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: 'crab', name: '蟹', icon: '🦀', color: 'bg-green-500', textColor: 'text-green-600' },
  { id: 'rooster', name: '雞', icon: '🐓', color: 'bg-red-500', textColor: 'text-red-600' },
];

// Little Mary (Xiao Ma Li) Config
export interface MarySymbol {
  id: string;
  name: string;
  odds: number;
  weight: number; // Probability weight (out of 1000)
  icon: string;
  color: string;
}

export const LITTLE_MARY_SYMBOLS: MarySymbol[] = [
  { id: 'bar', name: 'BAR', odds: 100, weight: 5, icon: '💎', color: 'bg-purple-600' },
  { id: '77', name: '77', odds: 40, weight: 15, icon: '7️⃣', color: 'bg-red-600' },
  { id: 'star', name: '星星', odds: 30, weight: 25, icon: '⭐', color: 'bg-yellow-500' },
  { id: 'watermelon', name: '西瓜', odds: 20, weight: 40, icon: '🍉', color: 'bg-green-600' },
  { id: 'bell', name: '鈴鐺', odds: 15, weight: 60, icon: '🔔', color: 'bg-amber-500' },
  { id: 'mango', name: '芒果', odds: 10, weight: 100, icon: '🥭', color: 'bg-orange-500' },
  { id: 'orange', name: '橘子', odds: 5, weight: 200, icon: '🍊', color: 'bg-orange-400' },
  { id: 'apple', name: '蘋果', odds: 2, weight: 485, icon: '🍎', color: 'bg-red-500' },
];

export const LITTLE_MARY_GRID_LAYOUT = [
  'orange', 'apple', 'mango', 'bell', 'watermelon', 'star', '77',      
  'apple', 'mango', 'bell', 'apple', 'bar',                            
  'orange', 'apple', 'mango', 'bell', 'watermelon', 'star', 'apple',   
  'orange', 'apple', 'orange', 'orange', 'apple'                       
];

// Tarot Config
export const TAROT_CONTEXTS = [
  '工作', '愛情', '財富', '家庭', '學業', 
  '生活', '人緣', '朋友', '運程', '健康'
];

export const TAROT_CARDS = [
  { name: "0. 愚者 (The Fool)", emoji: "🃏", keywords: "冒險、天真、新的開始", desc: "象徵無限的可能性，但也暗示著缺乏計畫的風險。" },
  { name: "I. 魔術師 (The Magician)", emoji: "🪄", keywords: "創造力、技能、意志力", desc: "掌握資源與能力，是展現專業與行動的最佳時機。" },
  { name: "II. 女祭司 (The High Priestess)", emoji: "🌙", keywords: "直覺、潛意識、靜止", desc: "建議暫時保留行動，傾聽內心的聲音與直覺。" },
  { name: "III. 皇后 (The Empress)", emoji: "👑", keywords: "豐饒、母性、感官享受", desc: "象徵物質與情感的豐盛，事情將有美好的開花結果。" },
  { name: "IV. 皇帝 (The Emperor)", emoji: "🏰", keywords: "權威、結構、穩定", desc: "需要建立秩序與規則，展現領導力與控制力。" },
  { name: "V. 教皇 (The Hierophant)", emoji: "📜", keywords: "傳統、信仰、學習", desc: "遵循既有的體制或尋求專業人士的指引會更有利。" },
  { name: "VI. 戀人 (The Lovers)", emoji: "💕", keywords: "選擇、關係、價值觀", desc: "面臨重大的選擇，或暗示一段重要的人際連結。" },
  { name: "VII. 戰車 (The Chariot)", emoji: "🛡️", keywords: "意志力、勝利、征服", desc: "雖然面臨衝突，但透過堅強的意志力將能克服難關。" },
  { name: "VIII. 力量 (Strength)", emoji: "🦁", keywords: "勇氣、耐心、內在力量", desc: "以柔克剛，透過耐心與包容來化解當前的挑戰。" },
  { name: "IX. 隱士 (The Hermit)", emoji: "🕯️", keywords: "反省、孤獨、指引", desc: "需要獨處思考，從內在尋找答案，而非向外尋求。" },
  { name: "X. 命運之輪 (Wheel of Fortune)", emoji: "🎡", keywords: "轉變、運氣、週期", desc: "外在環境將發生不可控的變化，順應時勢是最佳策略。" },
  { name: "XI. 正義 (Justice)", emoji: "⚖️", keywords: "公平、因果、真相", desc: "強調理性與誠實，付出多少就會得到多少回報。" },
  { name: "XII. 倒吊人 (The Hanged Man)", emoji: "🦇", keywords: "犧牲、新視角、等待", desc: "換個角度看世界，暫時的停滯是為了更好的領悟。" },
  { name: "XIII. 死神 (Death)", emoji: "💀", keywords: "結束、轉化、重生", desc: "這不是肉體的死亡，而是某個階段的徹底結束與新篇章的開始。" },
  { name: "XIV. 節制 (Temperance)", emoji: "🏺", keywords: "平衡、溝通、融合", desc: "避免極端，尋求中庸之道，透過溝通調和對立。" },
  { name: "XV. 惡魔 (The Devil)", emoji: "⛓️", keywords: "束縛、慾望、物質", desc: "警惕過度的執著或不健康的依賴關係，需誠實面對內心慾望。" },
  { name: "XVI. 高塔 (The Tower)", emoji: "⚡", keywords: "劇變、崩潰、覺醒", desc: "突如其來的改變雖然痛苦，但能打破虛假的表象。" },
  { name: "XVII. 星星 (The Star)", emoji: "✨", keywords: "希望、靈感、療癒", desc: "困難過後的光明，保持樂觀與信心，願望有機會實現。" },
  { name: "XVIII. 月亮 (The Moon)", emoji: "🌑", keywords: "幻覺、不安、潛意識", desc: "局勢曖昧不明，隱藏著不安因素，需小心求證。" },
  { name: "XIX. 太陽 (The Sun)", emoji: "☀️", keywords: "成功、喜悅、活力", desc: "極其正面的牌，象徵目標達成，充滿活力與自信。" },
  { name: "XX. 審判 (Judgement)", emoji: "🎺", keywords: "覺醒、召喚、因果", desc: "關鍵的轉折點，過去的努力將在此時接受檢驗與裁決。" },
  { name: "XXI. 世界 (The World)", emoji: "🌍", keywords: "圓滿、完成、統合", desc: "一個階段的完美結束，象徵達成目標與新的旅程開始。" }
];

// --- Prayer System Data ---
export const PRAYER_DEITIES = [
  "觀世音菩薩", "釋迦牟尼佛", "玉皇大帝", "北極玄天上帝", 
  "文武財神", "南極仙翁壽星公", "主耶穌", "聖母瑪利亞"
];

export const PRAYER_CATEGORIES: Record<string, string[]> = {
  "愛情": [
      "遇見良緣，彼此珍惜。", "情投意合，永浴愛河。", "放下執著，隨緣自在。", "坦誠相待，減少猜忌。", "用愛包容，共渡難關。",
      "珍惜當下，守護陪伴。", "互相扶持，共同成長。", "良緣天定，靜候花開。", "心存美善，吸引真愛。", "體諒對方，和諧相處。",
      "勇敢表白，不留遺憾。", "拒絕誘惑，一心一意。", "忘記過去，擁抱未來。", "用耐心灌溉愛情的種子。", "尊重彼此的獨立空間。",
      "時常感恩對方的付出。", "在愛中學會自愛。", "願天下有情人終成眷屬。"
  ],
  "工作": [
      "職位升遷，大展鴻圖。", "事半功倍，效率倍增。", "遇見伯樂，才華盡顯。", "職場和諧，貴人相助。", "創業成功，穩步發展。",
      "克服困局，化險為夷。", "思路清晰，決策果斷。", "技能提升，專業領先。", "保持熱情，不忘初心。", "平衡勞逸，身心舒爽。",
      "目標達成，業績長紅。", "勇於承擔，累積經驗。", "在挑戰中看見機會。", "與同事精誠合作。", "工作中展現慈悲與耐性。",
      "不畏艱辛，終有回報。", "心平氣和處理繁雜事務。", "祝願事業一帆風順。"
  ],
  "生活": [
      "平安喜樂，無憂無慮。", "心寬體胖，知足常樂。", "發現日常的美好。", "遠離煩惱，清淨自在。", "生活美滿，事事順心。",
      "與大自然和諧共處。", "享受每一刻的寧靜。", "提升修養，優雅生活。", "珍惜擁有，不卑不亢。", "開拓視野，體驗人生。",
      "居所安寧，鄰里和諧。", "斷捨離，簡約而不簡單。", "讓愛充滿生活的每個角落。", "每天都有一個微笑的理由。", "感恩食物，感恩陽光。",
      "充滿希望，迎接晨曦。", "內心強大，不畏風雨。", "生活處處有驚喜。"
  ],
  "運程": [
      "時來運轉，吉星高照。", "趨吉避凶，平安大吉。", "把握良機，乘勢而上。", "衰氣散盡，好運連連。", "心誠則靈，感應天心。",
      "廣結善緣，增加福報。", "沉著應變，化解危機。", "財源滾動，福慧雙增。", "路路通達，左右逢源。", "善念一起，運勢自轉。",
      "保持正念，避開負面磁場。", "懂得放下，運氣自來。", "在低谷中蓄勢待發。", "順應天時，盡力而為。", "勤行善事，積厚流光。",
      "勇於改變，開啟新局。", "謙虛受教，貴人自來。", "祝願你一年四季走好運。"
  ],
  "人事": [
      "廣結良緣，和睦共處。", "遠離小人，親近君子。", "說話得體，受人敬重。", "寬容大量，化解怨恨。", "真誠待人，換位思考。",
      "提升親和力，廣受歡迎。", "不卑不亢，應對自如。", "化敵為友，圓融處理。", "在人群中傳遞正能量。", "學會傾聽，理解他人。",
      "讚美他人，自得其樂。", "謙卑自守，不與人爭。", "在紛擾中保持清醒。", "用慈悲心對待每個人。", "建立互信，深厚友誼。",
      "懂得拒絕，守護界限。", "在人事中修行自我。", "祝願你人緣極佳。"
  ],
  "學業": [
      "金榜題名，學業有成。", "智慧開啟，一讀即懂。", "克服惰性，勤奮好學。", "考試順利，發揮超卓。", "遇到良師，受益匪淺。",
      "舉一反三，靈活運用。", "專注力強，抗擾度高。", "持之以恆，必有收獲。", "探索未知，熱愛知識。", "學以致用，回饋社會。",
      "思路敏捷，邏輯清晰。", "在壓力中保持冷靜。", "享受學習，不以為苦。", "博覽群書，氣質自華。", "謙虛求教，不恥下問。",
      "打破瓶頸，更進一步。", "定下目標，勇往直前。", "祝願你學問日益精進。"
  ],
  "健康": [
      "身強體健，百病不侵。", "心情開朗，延年益壽。", "睡眠安穩，體力充沛。", "遠離病灶，康復神速。", "規律作息，活力滿滿。",
      "心血管通暢，筋骨舒展。", "少思寡欲，精神奕奕。", "飲食均衡，脾胃安和。", "放下負擔，身心輕盈。", "在運動中體悟生命。",
      "珍惜身體，它是靈魂的聖殿。", "呼吸順暢，內外清涼。", "減少焦慮，自然安康。", "笑口常開，就是良藥。", "聽從醫囑，自律生活。",
      "感恩每一口呼吸。", "遠離毒素，回歸自然。", "祝願你龍馬精神。"
  ],
  "家庭": [
      "闔家平安，老少安康。", "父慈子孝，家庭和睦。", "夫妻恩愛，相敬如賓。", "家和萬事興。", "共同經營溫馨港灣。",
      "化解矛盾，增進感情。", "家庭成員互相關懷。", "新添成員，喜氣洋洋。", "共享天倫，歡樂常在。", "傳承家風，厚德載物。",
      "理解長輩，關愛晚輩。", "把最好的脾氣留給家人。", "家庭環境整潔清幽。", "在困難中緊緊相依。", "分享喜悅，分擔憂愁。",
      "尊重長輩，耐心引導。", "讓家成為心靈的避風港。", "祝願你家庭幸福美滿。"
  ]
};

export const PRAYER_QUOTES = [
  "心誠則靈，日行一善，福報自來。",
  "熱愛家人，珍惜朋友，便是世間最大的修行。",
  "勇敢面對問題，逃避只會讓困難更堅硬。",
  "助人為快樂之本，多播善種，必收善果。",
  "境隨心轉，心寬路自闊。",
  "感恩當下的一切，那是獲得幸福的捷徑。"
];

// --- Slot Machine Config ---
export const SLOT_SYMBOLS = {
  "💎": { weight: 5, value: 50, id: "DIAMOND" },
  "🔔": { weight: 10, value: 20, id: "BELL" },
  "🍉": { weight: 20, value: 10, id: "WATERMELON" },
  "🍒": { weight: 30, value: 5, id: "CHERRY" },
  "🍋": { weight: 40, value: 2, id: "LEMON" }
};
