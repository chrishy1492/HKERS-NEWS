
export const SUPABASE_URL = "https://wgkcwnyxjhnlkrdjvzyj.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG";

export const ADMIN_EMAILS = [
  "chrishy1494@gmail.com", 
  "hkerstoken@gmail.com", 
  "niceleung@gmail.com"
];

export const REGIONS = [
  "中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"
];

export const TOPICS = [
  "地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "宗教", "優惠", "校園", "天氣", "社區活動"
];

export const AVATARS = Array.from({ length: 90 }, (_, i) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${i}&backgroundColor=b6e3f4`);

export const GAMBLING_GAMES = [
  { id: 'littlemary', name: '小瑪莉 (Little Mary)' },
  { id: 'slots', name: '幸運老虎機 (Lucky Slots)' },
  { id: 'sicbo', name: '魚蝦蟹 (Hoo Hey How)' },
  { id: 'baccarat', name: '百家樂 (Baccarat)' },
  { id: 'roulette', name: '彈珠輪盤 (Roulette)' },
  { id: 'blackjack', name: '賭場21點 (Blackjack)' }
];

export const DIVINATION_APPS = [
  { id: 'ziwei', name: '紫微斗數 (Zi Wei Dou Shu)' },
  { id: 'finger', name: '掐指一算 (Finger Divination)' },
  { id: 'tarot', name: 'AI 塔羅 (AI Tarot)' },
];

export const FORTUNE_POEMS = {
  "大安": ["大安事事昌，求财在坤方", "失物去不远，宅舍保安康"],
  "留連": ["留连留连事难成，求谋日未明", "官事凡宜缓，去者未回程"],
  "速喜": ["速喜速喜喜来临，求财向南行", "官事有福德，病者无祸侵"],
  "赤口": ["赤口赤口主口舌，官非切宜防", "六畜多作怪，病者出西方"],
  "小吉": ["小吉小吉最吉昌，路上好商量", "行人即便至，交关甚是强"],
  "空亡": ["空亡空亡事不祥，阴人多乖张", "失物尋不見，官事有刑傷"]
};

export const SHICHEN_MAPPING = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const HOO_HEY_HOW_SYMBOLS = [
  { id: 'fish', name: '魚', icon: '🐟', color: 'bg-red-500' },
  { id: 'prawn', name: '蝦', icon: '🦐', color: 'bg-green-500' },
  { id: 'calabash', name: '葫蘆', icon: '🏺', color: 'bg-blue-500' },
  { id: 'coin', name: '金錢', icon: '💰', color: 'bg-blue-500' },
  { id: 'crab', name: '蟹', icon: '🦀', color: 'bg-green-500' },
  { id: 'rooster', name: '雞', icon: '🐓', color: 'bg-red-500' },
];

export const LITTLE_MARY_SYMBOLS = [
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

export const SLOT_SYMBOLS = {
  "💎": { weight: 5, value: 50, id: "DIAMOND" },
  "🔔": { weight: 10, value: 20, id: "BELL" },
  "🍉": { weight: 20, value: 10, id: "WATERMELON" },
  "🍒": { weight: 30, value: 5, id: "CHERRY" },
  "🍋": { weight: 40, value: 2, id: "LEMON" }
};

export const PRAYER_DEITIES = ["觀世音菩薩", "釋迦牟尼佛", "玉皇大帝", "主耶穌", "聖母瑪利亞"];
export const PRAYER_CATEGORIES = {
  "愛情": ["遇見良緣，彼此珍惜。", "情投意合，永浴愛河。"],
  "工作": ["職位升遷，大展鴻圖。", "事半功倍，效率倍增。"],
  "生活": ["平安喜樂，無憂無慮。", "心寬體胖，知足常樂。"],
  "運程": ["時來運轉，吉星高照。", "趨吉避凶，平安大吉。"]
};
export const PRAYER_QUOTES = ["心誠則靈，日行一善，福報自來。"];

// Tarot Related Constants
export const TAROT_CONTEXTS = ["愛情", "工作", "財富", "健康", "運勢"];

export const TAROT_CARDS = [
  { name: "愚者 (The Fool)", emoji: "🃏", keywords: "自由、純真、冒險", desc: "象徵新旅程的起點，不畏未知，勇往直前。" },
  { name: "魔術師 (The Magician)", emoji: "🪄", keywords: "創造力、行動、溝通", desc: "擁有掌控資源的能力，將意志轉化為現實。" },
  { name: "女祭司 (The High Priestess)", emoji: "🌙", keywords: "直覺、智慧、神秘", desc: "象徵內在的洞察力，安靜中孕育著巨大的力量。" },
  { name: "女皇 (The Empress)", emoji: "👑", keywords: "豐饒、母愛、生命力", desc: "代表創造力與物質豐富，以及對生活的熱愛。" },
  { name: "皇帝 (The Emperor)", emoji: "🏛️", keywords: "權威、紀律、結構", desc: "代表穩定的掌控與領導力，秩序的守護者。" },
  { name: "教皇 (The Hierophant)", emoji: "⛪", keywords: "傳統、信仰、引導", desc: "尋求精神上的導師，遵循社會規範與價值。" },
  { name: "戀人 (The Lovers)", emoji: "💖", keywords: "選擇、和諧、結合", desc: "象徵人際關係的平衡，以及重要的價值觀決策。" },
  { name: "戰車 (The Chariot)", emoji: "🛒", keywords: "意志、勝利、克服", desc: "憑藉堅強的意志力，克服困難並贏得最後勝利。" }
];
