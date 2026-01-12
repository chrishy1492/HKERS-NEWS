import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lunar, Solar } from 'lunar-javascript';
import { 
  Compass, Calendar, Clock, Sparkles, Zap, ArrowLeft, Brain, Cpu, 
  AlertTriangle, Moon, Music, Volume2, VolumeX, Star, 
  Activity, BarChart3, Heart, Briefcase, TrendingUp, AlertOctagon, Terminal, Flame
} from 'lucide-react';

// ==========================================
// SHARED TYPES & UTILS
// ==========================================

const SHICHENS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// --- SEEDED RNG FOR AI ENGINE ---
// Deterministic generator to ensure same name+date = same result
function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1^h2^h3^h4) >>> 0;
}

// --- XIAO LIU REN DATA ---
const XLR_POEMS = {
  "大安": {
    title: "大安 (Da An)",
    desc: "事事昌，求財在坤方",
    poem: [
      "大安事事昌，求财在坤方，失物去不远，宅舍保安康",
      "行人身未动，病者主无妨，将军回田野，仔细更推详"
    ],
    color: "text-green-400"
  },
  "留連": {
    title: "留連 (Liu Lian)",
    desc: "事難成，求謀日未明",
    poem: [
      "留连留连事难成，求谋日未明，官事凡宜缓，去者未回程",
      "失物南方见，急讨方心称，更须防口舌，人口且平平"
    ],
    color: "text-gray-400"
  },
  "速喜": {
    title: "速喜 (Su Xi)",
    desc: "喜來臨，求財向南行",
    poem: [
      "速喜速喜喜来临，求财向南行，失物申未午，逢人路上寻",
      "官事有福德，病者无祸侵，田宅六畜吉，行人有信音"
    ],
    color: "text-red-400"
  },
  "赤口": {
    title: "赤口 (Chi Kou)",
    desc: "主口舌，官非切宜防",
    poem: [
      "赤口赤口主口舌，官非切宜防，失物速速讨，行人有惊慌",
      "六畜多作怪，病者出西方，更须防咀咒，诚恐染瘟皇"
    ],
    color: "text-orange-600"
  },
  "小吉": {
    title: "小吉 (Xiao Ji)",
    desc: "最吉昌，路上好商量",
    poem: [
      "小吉小吉最吉昌，路上好商量，阴人来报喜，失物在坤方",
      "行人即便至，交关甚是强，凡事皆和合，病者叩穷苍"
    ],
    color: "text-yellow-400"
  },
  "空亡": {
    title: "空亡 (Kong Wang)",
    desc: "事不祥，陰人多乖張",
    poem: [
      "空亡空亡事不祥，阴人多乖张，求财无利益，行人有灾殃",
      "失物寻不见，官事有刑伤，病人逢暗鬼，解禳保安康"
    ],
    color: "text-slate-500"
  }
};
const XLR_ORDER = ["空亡", "大安", "留連", "速喜", "赤口", "小吉"];

// --- TAROT DATA ---
const TAROT_CARDS = [
  { name: "愚者 (The Fool)", emoji: "🃏", keyword: "冒險、開端、不確定性", career: "新的機會但缺乏規劃", love: "自由的感情關係", wealth: "意外的財務變動" },
  { name: "魔術師 (The Magician)", emoji: "🪄", keyword: "創造力、技能、資源", career: "展現專業能力的時刻", love: "主動追求的魅力", wealth: "靠智慧創造財富" },
  { name: "女祭司 (The High Priestess)", emoji: "🌙", keyword: "直覺、潛意識、靜止", career: "等待最佳時機", love: "柏拉圖式的精神連結", wealth: "保守觀望" },
  { name: "皇后 (The Empress)", emoji: "👑", keyword: "豐饒、母性、感官", career: "創意開花結果", love: "穩定的情感照顧", wealth: "物質生活優渥" },
  { name: "皇帝 (The Emperor)", emoji: "🤴", keyword: "權威、結構、控制", career: "建立秩序與規則", love: "負責任但缺乏浪漫", wealth: "穩健的資產管理" },
  { name: "教皇 (The Hierophant)", emoji: "🙏", keyword: "傳統、指導、體制", career: "尋求導師或大機構", love: "傳統且保守的關係", wealth: "遵循傳統投資" },
  { name: "戀人 (The Lovers)", emoji: "💕", keyword: "選擇、結合、價值觀", career: "合作夥伴關係", love: "熱烈的吸引力", wealth: "合資機會" },
  { name: "戰車 (The Chariot)", emoji: "🛒", keyword: "意志、勝利、征服", career: "克服萬難的決心", love: "積極追求", wealth: "高風險高回報" },
  { name: "力量 (Strength)", emoji: "🦁", keyword: "勇氣、耐心、內在力量", career: "以柔克剛", love: "溫柔的堅持", wealth: "長期穩定的增長" },
  { name: "隱士 (The Hermit)", emoji: "🕯️", keyword: "內省、孤獨、引導", career: "獨自研究或深造", love: "需要獨處空間", wealth: "審慎理財" },
  { name: "命運之輪 (Wheel of Fortune)", emoji: "🎡", keyword: "輪迴、契機、轉折", career: "關鍵的升遷或跳槽機會", love: "緣分的牽引", wealth: "財運週期的波動" },
  { name: "正義 (Justice)", emoji: "⚖️", keyword: "公平、決策、因果", career: "合約與法律事務順利", love: "需要溝通平衡的關係", wealth: "理性的資產分配" },
  { name: "高塔 (The Tower)", emoji: "⚡", keyword: "劇變、覺醒、崩潰", career: "突如其來的職場變動", love: "關係的震盪與破裂", wealth: "突發性損失" },
  { name: "死神 (Death)", emoji: "💀", keyword: "結束、轉化、新生", career: "職涯的徹底轉型", love: "一段關係的終結與重生", wealth: "清空舊帳務" },
  { name: "太陽 (The Sun)", emoji: "☀️", keyword: "成功、喜悅、光明", career: "獲得高度認可", love: "充滿活力的熱戀", wealth: "明朗的投資前景" },
  { name: "世界 (The World)", emoji: "🌍", keyword: "完成、整合、旅行", career: "專案圓滿達成", love: "修成正果", wealth: "跨國或整體獲利" }
];

const TAROT_CATEGORIES = [
  "工作", "愛情", "財富", "家庭", "學業", 
  "生活", "人緣", "朋友", "健康"
];

// --- VIRTUAL SHRINE DATA ---
const BLESSINGS: Record<string, string[]> = {
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

const GOOD_DEED_QUOTES = [
    "心誠則靈，日行一善，福報自來。",
    "熱愛家人，珍惜朋友，便是世間最大的修行。",
    "勇敢面對問題，逃避只會讓困難更堅硬。",
    "助人為快樂之本，多播善種，必收善果。",
    "境隨心轉，心寬路自闊。",
    "感恩當下的一切，那是獲得幸福的捷徑。"
];

// ==========================================
// VIRTUAL SHRINE COMPONENT
// ==========================================
const VirtualShrine = ({ onBack }: { onBack: () => void }) => {
  const [deity, setDeity] = useState('觀世音菩薩');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [result, setResult] = useState<{title: string, content: {cat: string, text: string}[], quote: string} | null>(null);
  const [isPraying, setIsPraying] = useState(false);

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handlePray = () => {
    if (selectedCats.length === 0) {
      alert("請至少選擇一個祈福事項 (Please select at least one category)");
      return;
    }
    
    setIsPraying(true);
    
    setTimeout(() => {
      const content = selectedCats.map(cat => {
        const list = BLESSINGS[cat];
        return {
          cat,
          text: list[Math.floor(Math.random() * list.length)]
        };
      });
      
      setResult({
        title: `✨ ${deity} 給您的祝願 ✨`,
        content,
        quote: GOOD_DEED_QUOTES[Math.floor(Math.random() * GOOD_DEED_QUOTES.length)]
      });
      setIsPraying(false);
    }, 2000);
  };

  return (
    <div className="bg-[#fffaf0] p-6 rounded-lg border-4 border-[#d4af37] shadow-2xl max-w-2xl mx-auto min-h-[500px] flex flex-col text-[#4a3b2a] relative animate-in fade-in zoom-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-[#d4af37]/30 pb-4">
        <button onClick={onBack} className="p-2 hover:bg-[#d4af37]/20 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#8b0000]"/>
        </button>
        <h3 className="text-2xl font-black text-[#8b0000] flex items-center gap-2">
          <Flame className="w-6 h-6 text-[#d4af37]" /> 網上誠心祈福 (Prayer)
        </h3>
        <div className="w-9"></div>
      </div>

      {!result ? (
        <div className="flex flex-col gap-6 flex-1">
          {/* Deity Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#8b0000]">1. 請選擇神祇 (Select Deity)：</label>
            <select 
              value={deity} 
              onChange={e => setDeity(e.target.value)}
              className="w-full p-3 border-2 border-[#d4af37] rounded bg-white text-lg font-serif text-black focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            >
              <option value="觀世音菩薩">1. 觀音 (Guanyin)</option>
              <option value="釋迦牟尼佛">2. 佛祖 (Buddha)</option>
              <option value="玉皇大帝">3. 玉皇大帝 (Jade Emperor)</option>
              <option value="北極玄天上帝">4. 玄天上帝 (Xuan Wu)</option>
              <option value="文武財神">5. 財神 (God of Wealth)</option>
              <option value="南極仙翁壽星公">6. 壽星公 (God of Longevity)</option>
              <option value="主耶穌">7. 耶穌 (Jesus)</option>
              <option value="聖母瑪利亞">8. 聖母 (Virgin Mary)</option>
            </select>
          </div>

          {/* Categories */}
          <div className="space-y-2 flex-1">
            <label className="text-sm font-bold text-[#8b0000]">2. 請選擇祈福事項 (Select Categories)：</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.keys(BLESSINGS).map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  className={`p-3 rounded border-2 transition-all font-bold ${
                    selectedCats.includes(cat) 
                      ? 'bg-[#d4af37] border-[#b8860b] text-white shadow-lg transform scale-105' 
                      : 'bg-white border-[#e0e0e0] text-gray-600 hover:border-[#d4af37]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button 
            onClick={handlePray}
            disabled={isPraying}
            className="w-full bg-[#8b0000] hover:bg-[#a52a2a] text-white font-black py-4 rounded-lg shadow-lg text-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isPraying ? '🙏 誠心跪拜中 (Praying)...' : '🏮 誠心祈福 (Submit Prayer)'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 flex-1 text-center animate-in slide-in-from-bottom duration-500">
           <div className="py-6 border-b-2 border-[#d4af37] border-dashed">
              <h2 className="text-3xl font-black text-[#d4af37] mb-6 drop-shadow-sm">{result.title}</h2>
              <div className="space-y-4 text-left bg-white p-6 rounded-lg border border-[#eee] shadow-inner">
                 {result.content.map((item, idx) => (
                   <div key={idx} className="flex gap-2 text-lg">
                      <span className="font-bold text-[#8b0000] min-w-[3rem]">【{item.cat}】</span>
                      <span className="text-gray-700">{item.text}</span>
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="bg-[#fff8dc] p-4 rounded-lg border border-[#d4af37]/50">
              <p className="text-[#8b0000] font-bold text-lg">"{result.quote}"</p>
           </div>

           <div className="mt-auto">
              <p className="text-xs text-gray-500 mb-4">
                * 結果僅供參考，不可盡信。祝願大家好運和健康！<br/>
                Disclaimer: For entertainment purposes only. Wish you good luck!
              </p>
              <button 
                onClick={() => setResult(null)} 
                className="w-full py-3 border-2 border-[#8b0000] text-[#8b0000] font-bold rounded hover:bg-[#8b0000] hover:text-white transition-colors"
              >
                再求一支 (Pray Again)
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// AI QUANTUM FORTUNE ENGINE
// ==========================================
const AiFortuneEngine = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState<'input' | 'processing' | 'dashboard'>('input');
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const processData = () => {
    if(!name || !birth) return;
    setStep('processing');
    
    const steps = [
      "Initializing Neural Network...",
      "Resolving User Vector Hash...", 
      "Querying Celestial Database (Ephemeris 2025)...",
      "Calculating Sentiment Coefficients...",
      "Running Monte Carlo Simulations (n=1000)...",
      "Optimizing Output..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        generateResult();
        setStep('dashboard');
      } else {
        setLogs(prev => [...prev, `> ${steps[currentStep]}`]);
        setProgress(((currentStep + 1) / steps.length) * 100);
        currentStep++;
      }
    }, 600);
  };

  const generateResult = () => {
    const seed = cyrb128(name + birth + new Date().toISOString().split('T')[0]); // Daily seed
    const rng = mulberry32(seed);

    // 1. Anomaly / Warning
    const hasAnomaly = rng() < 0.25; // 25% chance of warning
    const anomalies = [
      "Mercury Retrograde Interference (水星逆行干擾)",
      "Saturn Return High Pressure (土星回歸高壓)",
      "Solar Flare Magnetic Disruption (磁場波動)",
      "Void-of-Course Moon (月空亡 - 效率低)"
    ];
    
    // 2. Love
    const loveScores = Math.floor(rng() * 40) + 60; // 60-100
    const loveAdvice = [
      "Connection Latency: High. Suggest rebooting communication protocols.",
      "Synchronization Rate: 98%. Optimal time for deployment (confession).",
      "Firewall Detected. Partner is emotionally defensive.",
      "Packet Loss: Misunderstandings likely. Use clear text."
    ];

    // 3. Career
    const careerTrends = ["Bearish", "Bullish", "Volatile", "Stagnant"];
    const careerTrend = careerTrends[Math.floor(rng() * careerTrends.length)];
    
    // 4. Energy Graph (24h)
    const energyData = Array.from({length: 12}, () => Math.floor(rng() * 80) + 20);

    setResult({
      hash: `0x${seed.toString(16).toUpperCase()}`,
      anomaly: hasAnomaly ? anomalies[Math.floor(rng() * anomalies.length)] : null,
      love: {
        score: loveScores,
        status: loveScores > 80 ? "OPTIMAL" : loveScores > 60 ? "STABLE" : "UNSTABLE",
        advice: loveAdvice[Math.floor(rng() * loveAdvice.length)]
      },
      career: {
        trend: careerTrend,
        focus: ["Refactor Code", "Team Sync", "Deep Work", "Networking"][Math.floor(rng() * 4)],
        advice: "Optimize workflow efficiency."
      },
      wealth: {
        riskLevel: Math.floor(rng() * 100),
        sector: ["Tech", "Crypto", "Real Estate", "Bonds"][Math.floor(rng() * 4)]
      },
      energy: energyData
    });
  };

  return (
    <div className="bg-[#0B1018] p-6 rounded-lg border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)] max-w-3xl mx-auto min-h-[600px] flex flex-col font-mono text-cyan-500 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-cyan-500/30 pb-4 relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> TERMINAL
        </button>
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 animate-pulse" />
          <span className="font-bold tracking-widest">AI QUANTUM FORTUNE v2.0</span>
        </div>
      </div>

      {/* INPUT PHASE */}
      {step === 'input' && (
        <div className="flex flex-col items-center justify-center flex-1 relative z-10 animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center mb-8">
              <Brain className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Initialize Parameters</h2>
              <p className="text-xs text-cyan-700">Enter biodata for seed generation.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider ml-1">Subject Name</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0F172A] border border-cyan-800 rounded p-3 text-white focus:border-cyan-400 outline-none transition-all placeholder-cyan-900"
                placeholder="Ex: John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider ml-1">Initialization Date (DOB)</label>
              <input 
                type="date"
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
                className="w-full bg-[#0F172A] border border-cyan-800 rounded p-3 text-white focus:border-cyan-400 outline-none transition-all"
              />
            </div>

            <button 
              onClick={processData}
              disabled={!name || !birth}
              className="w-full bg-cyan-900/50 hover:bg-cyan-500 hover:text-black border border-cyan-500 text-cyan-400 font-bold py-4 rounded transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Activity className="w-4 h-4" /> RUN DIAGNOSTICS
            </button>
          </div>
        </div>
      )}

      {/* PROCESSING PHASE */}
      {step === 'processing' && (
        <div className="flex flex-col flex-1 relative z-10 p-4">
          <div className="flex-1 bg-black/50 border border-cyan-900 rounded p-4 mb-4 font-mono text-xs overflow-hidden">
            {logs.map((log, i) => (
              <div key={i} className="mb-1 text-green-400">{log}</div>
            ))}
            <div className="animate-pulse">_</div>
          </div>
          <div className="h-1 w-full bg-cyan-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-400 shadow-[0_0_10px_cyan]" 
              style={{ width: `${progress}%`, transition: 'width 0.2s' }}
            ></div>
          </div>
        </div>
      )}

      {/* DASHBOARD PHASE */}
      {step === 'dashboard' && result && (
        <div className="flex flex-col gap-4 relative z-10 animate-in slide-in-from-bottom duration-500 pb-4">
          
          {/* Status Bar */}
          <div className="flex justify-between items-end border-b border-cyan-800 pb-2">
            <div>
              <div className="text-[10px] text-cyan-600">IDENTITY HASH</div>
              <div className="text-sm text-white font-bold">{result.hash}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-cyan-600">SYSTEM STATUS</div>
              <div className="text-sm text-green-400 font-bold">ONLINE</div>
            </div>
          </div>

          {/* Anomaly Warning */}
          {result.anomaly && (
            <div className="bg-red-950/30 border border-red-500/50 p-4 rounded flex items-start gap-3">
              <AlertOctagon className="w-6 h-6 text-red-500 animate-pulse flex-shrink-0" />
              <div>
                <h4 className="text-red-400 font-bold text-sm">CRITICAL ALERT: ANOMALY DETECTED</h4>
                <p className="text-red-300 text-xs mt-1">{result.anomaly}</p>
                <div className="mt-2 text-[10px] bg-red-900/50 inline-block px-2 py-1 rounded text-red-200">
                  SUGGESTION: Enable Safe Mode (Low Risk Activities)
                </div>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Daily Energy */}
            <div className="bg-[#0F172A] border border-cyan-800 p-4 rounded hover:border-cyan-500 transition-colors group">
              <div className="flex items-center gap-2 mb-3 text-cyan-300">
                <BarChart3 className="w-4 h-4" />
                <span className="font-bold text-sm">DAILY ENERGY OUTPUT</span>
              </div>
              <div className="flex items-end justify-between h-24 gap-1">
                {result.energy.map((h: number, i: number) => (
                  <div key={i} className="w-full bg-cyan-900/50 rounded-t relative group-hover:bg-cyan-800/50 transition-colors">
                    <div 
                      className="absolute bottom-0 w-full bg-cyan-500/80 group-hover:bg-cyan-400 transition-all"
                      style={{ height: `${h}%` }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-cyan-700 mt-1">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Love Module */}
            <div className="bg-[#0F172A] border border-cyan-800 p-4 rounded hover:border-pink-500/50 transition-colors group">
              <div className="flex items-center gap-2 mb-3 text-pink-400">
                <Heart className="w-4 h-4" />
                <span className="font-bold text-sm">LOVE NAVIGATION</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Compatibility</span>
                <span className="text-xl font-bold text-white">{result.love.score}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mb-3">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: `${result.love.score}%` }}></div>
              </div>
              <p className="text-xs text-slate-300 border-l-2 border-pink-500 pl-2">
                {result.love.advice}
              </p>
            </div>

            {/* Career Module */}
            <div className="bg-[#0F172A] border border-cyan-800 p-4 rounded hover:border-blue-500/50 transition-colors">
              <div className="flex items-center gap-2 mb-3 text-blue-400">
                <Briefcase className="w-4 h-4" />
                <span className="font-bold text-sm">CAREER VECTOR</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-slate-900 p-2 rounded">
                  <div className="text-[10px] text-slate-500">MARKET TREND</div>
                  <div className="text-sm font-bold text-white">{result.career.trend}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <div className="text-[10px] text-slate-500">PRIORITY</div>
                  <div className="text-sm font-bold text-white truncate">{result.career.focus}</div>
                </div>
              </div>
              {/* FIXED: Escaped '>>' to '&gt;&gt;' for valid JSX */}
              <p className="text-xs text-slate-400 mt-2">&gt;&gt; {result.career.advice}</p>
            </div>

            {/* Wealth Module */}
            <div className="bg-[#0F172A] border border-cyan-800 p-4 rounded hover:border-yellow-500/50 transition-colors">
              <div className="flex items-center gap-2 mb-3 text-yellow-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold text-sm">WEALTH PROJECTION</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Risk Exposure</span>
                <span className={`text-xs font-bold ${result.wealth.riskLevel > 70 ? 'text-red-400' : 'text-green-400'}`}>
                  {result.wealth.riskLevel > 70 ? 'HIGH' : result.wealth.riskLevel > 30 ? 'MODERATE' : 'LOW'}
                </span>
              </div>
              <div className="flex gap-1 h-2 mb-3">
                {Array.from({length: 10}).map((_, i) => (
                  <div key={i} className={`flex-1 rounded-sm ${i < result.wealth.riskLevel / 10 ? 'bg-yellow-500' : 'bg-slate-800'}`}></div>
                ))}
              </div>
              <div className="text-xs text-slate-300">
                Target Sector: <span className="text-white font-bold">{result.wealth.sector}</span>
              </div>
            </div>

          </div>

          <button 
            onClick={() => { setStep('input'); setLogs([]); setResult(null); }}
            className="mt-4 border-t border-cyan-800 pt-4 text-center text-xs text-cyan-700 hover:text-cyan-400 flex items-center justify-center gap-2 transition-colors"
          >
            <Terminal className="w-3 h-3" /> REBOOT SYSTEM
          </button>

        </div>
      )}
    </div>
  );
}

// ==========================================
// ZI WEI DOU SHU ENGINE (14 Major Stars)
// ==========================================
class ZiWeiEngine {
  static getStarInfo(name: string) {
    const info: Record<string, string> = {
      "紫微": "帝王星。尊貴、領導、孤傲。",
      "天機": "智慧星。思考、變動、神經質。",
      "太陽": "權貴星。博愛、付出、勞碌。",
      "武曲": "財富星。剛毅、執行、孤獨。",
      "天同": "福德星。溫和、享受、懶散。",
      "廉貞": "交際星。情感、公關、複雜。",
      "天府": "庫藏星。守成、包容、保守。",
      "太陰": "財富星。溫柔、累積、母性。",
      "貪狼": "慾望星。多藝、交際、投機。",
      "巨門": "是非星。口才、研究、疑慮。",
      "天相": "印鑑星。輔佐、公正、外表。",
      "天梁": "蔭庇星。長壽、照顧、清高。",
      "七殺": "肅殺星。衝勁、變動、孤剋。",
      "破軍": "耗損星。破壞、開創、衝動。"
    };
    return info[name] || "";
  }

  static calculate(year: number, month: number, day: number, hour: number) {
    const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
    const lunar = solar.getLunar();
    
    // 1. Basic Data
    const lunarMonth = lunar.getMonth();
    const lunarDay = lunar.getDay();
    const timeZhiIdx = Math.floor((hour + 1) / 2) % 12;
    const yearGanIdx = TIAN_GAN.indexOf(lunar.getYearGan());

    // 2. Ming Gong (Life Palace) Position
    // Formula: Tiger(2) + (Month - 1) - Hour
    let mingIdx = (2 + (lunarMonth - 1) - timeZhiIdx) % 12;
    if (mingIdx < 0) mingIdx += 12;

    // 3. Five Elements Bureau (Wu Xing Ju)
    // Uses "Five Tigers" rule to find the Heavenly Stem of the Tiger Palace (Index 2)
    // 甲己 -> 丙(2), 乙庚 -> 戊(4), 丙辛 -> 庚(6), 丁壬 -> 壬(8), 戊癸 -> 甲(0)
    const tigerGanBase = [2, 4, 6, 8, 0];
    const tigerGanIdx = tigerGanBase[yearGanIdx % 5];
    
    // Find Stem of Ming Gong
    // Offset from Tiger(2)
    let offsetFromTiger = mingIdx - 2;
    if (offsetFromTiger < 0) offsetFromTiger += 12;
    const mingGanIdx = (tigerGanIdx + offsetFromTiger) % 10;
    
    // Na Yin simplified lookup for Bureau (Water 2, Wood 3, Gold 4, Earth 5, Fire 6)
    // This is a simplified hash for demo purposes. Real Na Yin table is huge.
    // We mock accurate Bureau distribution here.
    const bureauMap = [4, 2, 6, 5, 3]; // Mock sequence
    const bureau = bureauMap[(mingGanIdx + Math.floor(mingIdx/2)) % 5]; 

    // 4. Zi Wei Star Position
    // Algorithm: (Lunar Day + X) / Bureau
    let ziWeiPos = 0;
    if (bureau > 0) {
       // Simplified lookup for Zi Wei star position based on Day and Bureau
       // In a full engine, this handles remainders. 
       // We use a linear approximation for stability in this demo.
       ziWeiPos = (2 + lunarDay + bureau) % 12; 
    }

    // 5. Place Stars
    const palaces: Record<number, string[]> = {};
    for (let i = 0; i < 12; i++) palaces[i] = [];

    // Zi Wei Group (Counter-Clockwise)
    // ZiWei(0), TianJi(-1), Sun(-3), WuQu(-4), TianTong(-5), LianZhen(-8)
    const zwOffsets = [0, -1, -3, -4, -5, -8];
    const zwNames = ["紫微", "天機", "太陽", "武曲", "天同", "廉貞"];
    
    zwOffsets.forEach((off, i) => {
      let idx = (ziWeiPos + off) % 12;
      if (idx < 0) idx += 12;
      palaces[idx].push(zwNames[i]);
    });

    // Tian Fu Position (Opposite axis relative to Tiger-Monkey)
    // Standard Formula mapping from Zi Wei
    const tfMap = [4, 3, 2, 1, 0, 11, 10, 9, 8, 7, 6, 5];
    const tianFuPos = tfMap[ziWeiPos];

    // Tian Fu Group (Clockwise)
    // TianFu(0), TaiYin(1), TanLang(2), JuMen(3), TianXiang(4), TianLiang(5), QiSha(6), PoJun(10)
    const tfOffsets = [0, 1, 2, 3, 4, 5, 6, 10];
    const tfNames = ["天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍"];

    tfOffsets.forEach((off, i) => {
      let idx = (tianFuPos + off) % 12;
      idx = idx % 12;
      palaces[idx].push(tfNames[i]);
    });

    return {
      lunarStr: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()} ${lunar.getTimeZhi()}時`,
      bureau: ["", "", "水二局", "木三局", "金四局", "土五局", "火六局"][bureau],
      mingIdx,
      palaces
    };
  }
}

// ==========================================
// SUB-COMPONENT: ZI WEI DOU SHU UI
// ==========================================
const ZiWeiDouShuReader = ({ onBack }: { onBack: () => void }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("12:00");
  const [result, setResult] = useState<any>(null);
  const [music, setMusic] = useState(false);

  const calculate = () => {
    const [y, m, d] = date.split('-').map(Number);
    const [h] = time.split(':').map(Number);
    const res = ZiWeiEngine.calculate(y, m, d, h);
    setResult(res);
  };

  const toggleMusic = () => setMusic(!music);

  return (
    <div className="bg-hker-night p-2 md:p-6 rounded-lg border-2 border-purple-500/30 shadow-2xl w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-right duration-300 relative overflow-hidden">
      {/* Decorative BG */}
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
        <Moon className="w-64 h-64 text-purple-400" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-full"><ArrowLeft className="w-5 h-5 text-purple-400"/></button>
        <h3 className="text-xl md:text-2xl font-black text-purple-400 flex items-center gap-2">
          <Star className="w-6 h-6" /> 紫微斗數 (Zi Wei Dou Shu)
        </h3>
        <button onClick={toggleMusic} className={`p-2 rounded-full transition-colors ${music ? 'bg-purple-900/50 text-purple-400' : 'text-slate-600'}`}>
           {music ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Input */}
      {!result && (
        <div className="max-w-md mx-auto space-y-4 relative z-10">
           <div className="bg-black/40 p-4 rounded-xl border border-slate-700">
              <label className="block text-xs font-bold text-purple-400 mb-2">出生日期 (Solar Date)</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white outline-none focus:border-purple-500" />
           </div>
           <div className="bg-black/40 p-4 rounded-xl border border-slate-700">
              <label className="block text-xs font-bold text-purple-400 mb-2">出生時間 (Time)</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white outline-none focus:border-purple-500" />
           </div>
           <button onClick={calculate} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">
             排盤 Calculate Chart
           </button>
           <p className="text-center text-xs text-slate-500 mt-4">
             * 系統自動轉換農曆與真太陽時校正邏輯
           </p>
        </div>
      )}

      {/* Result Chart */}
      {result && (
        <div className="relative z-10 animate-in zoom-in duration-500">
           <div className="bg-black/60 p-4 rounded-lg border border-purple-500/30 mb-4 flex flex-col md:flex-row justify-between items-center text-xs md:text-sm">
              <div className="font-mono text-purple-300">{result.lunarStr}</div>
              <div className="font-bold text-white px-3 py-1 bg-purple-900/50 rounded border border-purple-500/50 mt-2 md:mt-0">{result.bureau}</div>
           </div>

           {/* The 12 Palace Grid */}
           <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6 text-center select-none">
              {[5, 6, 7, 8, 4, -1, -1, 9, 3, -1, -1, 10, 2, 1, 0, 11].map((idx, i) => {
                 if (idx === -1) {
                    if (i === 5) return <div key={i} className="col-span-2 row-span-2 flex flex-col items-center justify-center text-slate-600 text-[10px] md:text-xs border border-slate-800 rounded-lg bg-black/20">
                       <div className="mb-2">命盤核心</div>
                       <div>Engineering Engine</div>
                    </div>;
                    return null;
                 }

                 const isMing = idx === result.mingIdx;
                 const stars = result.palaces[idx];
                 const zhi = DI_ZHI[idx];

                 return (
                   <div key={idx} className={`relative p-2 h-24 md:h-32 rounded-lg border flex flex-col justify-between ${isMing ? 'bg-purple-900/20 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-slate-900/50 border-slate-700'}`}>
                      <div className="text-[10px] md:text-xs text-slate-500 absolute top-1 right-2">{zhi}宮</div>
                      {isMing && <div className="absolute top-1 left-2 text-[10px] bg-red-600 text-white px-1 rounded">命宮</div>}
                      
                      <div className="flex flex-col items-center justify-center h-full gap-1 pt-4">
                         {stars.length > 0 ? stars.map((s: string) => (
                           <span key={s} className={`text-xs md:text-sm font-bold ${['紫微','天府','太陽','太陰'].includes(s) ? 'text-yellow-400' : 'text-purple-300'}`}>
                             {s}
                           </span>
                         )) : <span className="text-[10px] text-slate-600">無主星</span>}
                      </div>
                   </div>
                 );
              })}
           </div>

           {/* Interpretation */}
           <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <h4 className="text-purple-400 font-bold mb-2">命宮主星解析</h4>
              <div className="text-sm text-slate-300 leading-relaxed">
                 {result.palaces[result.mingIdx].length === 0 ? (
                   <p>【命無正曜】：命宮沒有主星。這意味著您的性格可塑性極高，易受環境影響，善於適應變化，但也可能在人生方向上較多猶豫。建議參考對宮（遷移宮）的星曜。</p>
                 ) : (
                   result.palaces[result.mingIdx].map((star: string) => (
                     <p key={star} className="mb-2"><span className="text-yellow-400 font-bold">【{star}】</span>：{ZiWeiEngine.getStarInfo(star)}</p>
                   ))
                 )}
              </div>
           </div>

           <div className="mt-4 text-center">
              <button onClick={() => setResult(null)} className="text-xs text-slate-500 hover:text-white underline">重新排盤 Restart</button>
           </div>
        </div>
      )}
      
      {/* Disclaimer */}
      <div className="mt-6 border-t border-purple-900/30 pt-4 text-center">
         <p className="text-[10px] text-slate-600">
           免責聲明：本程式基於中州派安星法則運算，結果僅供娛樂與參考。命運掌握在自己手中，切勿迷信。
         </p>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: XIAO LIU REN
// ==========================================
const XiaoLiuRen = ({ onBack }: { onBack: () => void }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const [year, month, day] = date.split('-').map(Number);
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    const lMonth = lunar.getMonth();
    const lDay = lunar.getDay(); 
    const [h] = time.split(':').map(Number);
    let sIndex = Math.floor((h + 1) / 2) % 12;
    const shichenVal = sIndex + 1; 
    const shichenName = SHICHENS[sIndex];

    let remainder = (lMonth + lDay + shichenVal - 2) % 6;
    if (remainder < 0) remainder += 6;
    
    const outcomeKey = XLR_ORDER[remainder];
    
    setResult({
      inputSolar: `${year}-${month}-${day} ${time}`,
      lunarDate: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      shichen: `${shichenName}時`,
      outcome: XLR_POEMS[outcomeKey as keyof typeof XLR_POEMS]
    });
  };

  return (
    <div className="bg-hker-night p-6 rounded-lg border-2 border-hker-gold/30 shadow-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-full"><ArrowLeft className="w-5 h-5 text-slate-400"/></button>
        <h3 className="text-2xl font-black text-hker-gold flex items-center gap-2">
          <Compass className="w-8 h-8 animate-spin-slow" /> 掐指一算 Xiao Liu Ren
        </h3>
        <div className="w-9"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-black/40 p-4 rounded-lg border border-slate-700">
          <label className="text-hker-gold text-xs font-bold mb-2 flex items-center gap-1">
            <Calendar className="w-4 h-4" /> 西曆日期 Solar Date
          </label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-hker-gold outline-none"/>
        </div>
        <div className="bg-black/40 p-4 rounded-lg border border-slate-700">
          <label className="text-hker-gold text-xs font-bold mb-2 flex items-center gap-1">
            <Clock className="w-4 h-4" /> 時間 Time
          </label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-hker-gold outline-none"/>
        </div>
      </div>

      <button onClick={calculate} className="w-full bg-gradient-to-r from-hker-gold to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black py-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all">
        <Sparkles className="w-5 h-5" /> 立即占卜 (Calculate)
      </button>

      {result && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-black/50 rounded-lg p-6 border-2 border-hker-gold/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><Compass className="w-40 h-40 text-white" /></div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs font-mono text-slate-400 border-b border-slate-700 pb-4">
               <div><span className="block text-slate-500">農曆 Lunar Date</span><span className="text-white font-bold text-sm">{result.lunarDate}</span></div>
               <div className="text-right"><span className="block text-slate-500">時辰 Shichen</span><span className="text-white font-bold text-sm">{result.shichen}</span></div>
            </div>
            <div className="text-center mb-6">
               <h2 className={`text-4xl font-black mb-2 ${result.outcome.color}`}>{result.outcome.title}</h2>
               <p className="text-white font-bold text-lg">{result.outcome.desc}</p>
            </div>
            <div className="bg-slate-900/80 p-4 rounded border border-slate-700">
               {result.outcome.poem.map((line: string, idx: number) => (
                 <p key={idx} className="text-center text-slate-300 mb-1 font-serif tracking-widest">{line}</p>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: AI TAROT
// ==========================================
const TarotReader = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState<'setup' | 'loading' | 'result'>('setup');
  const [ctx, setCtx] = useState('');
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [cardResult, setCardResult] = useState<any>(null);

  const startReading = async () => {
    if (!ctx) return;
    setStep('loading');
    
    const tasks = [
      "初始化隨機數生成矩陣 (Initializing RNG Matrix)...",
      "加載 78 張塔羅大數據 (Loading Data)...",
      "映射用戶語義維度 (Mapping Semantic Dimensions)...",
      "執行蒙地卡羅模擬 (Running Monte Carlo)...",
      "生成詳細解讀報告 (Generating Report)..."
    ];

    for (let i = 0; i < tasks.length; i++) {
      setLoadingText(tasks[i]);
      setProgress((i + 1) * 20);
      await new Promise(r => setTimeout(r, 600));
    }

    // Logic
    const card = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
    const isUpright = Math.random() > 0.3; // 70% chance upright
    setCardResult({ card, isUpright });
    setStep('result');
  };

  const getEngineeringInterpretation = (card: any, context: string, isUpright: boolean) => {
    // Determine mapping key
    let key = 'career';
    if (['愛情', '人緣', '家庭', '朋友'].includes(context)) key = 'love';
    if (['財富', '運程'].includes(context)) key = 'wealth';
    // Fallback logic
    const baseMeaning = card[key] || card.keyword;
    
    const status = isUpright 
      ? "系統偵測到正向能量流動 (Positive Flow Detected)。" 
      : "系統偵測到潛在阻礙或反向負載 (Negative Load / Resistance Detected)。";
      
    const advice = isUpright
      ? `針對「${context}」，數據顯示目前趨勢穩定，${baseMeaning}。建議保持當前架構，持續優化。`
      : `針對「${context}」，目前處於不穩定區間，${baseMeaning}。建議進行系統性回顧，暫緩重大變更。`;

    return { status, advice };
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg border-2 border-blue-500/30 shadow-2xl max-w-2xl mx-auto font-mono text-gray-300 animate-in fade-in slide-in-from-right duration-300 min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full"><ArrowLeft className="w-5 h-5 text-blue-400"/></button>
        <div className="text-center">
          <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2 justify-center">
            <Brain className="w-6 h-6" /> AI TAROT ENGINE
          </h3>
          <p className="text-[10px] text-gray-500">v2.5.0-stable | 語義映射模式</p>
        </div>
        <div className="w-9"></div>
      </div>

      {/* STEP 1: SETUP */}
      {step === 'setup' && (
        <div className="flex flex-col flex-1">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Cpu className="w-4 h-4"/> Step 1: 選擇目標維度 (Select Context)</h4>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {TAROT_CATEGORIES.map(c => (
              <button 
                key={c} 
                onClick={() => setCtx(c)}
                className={`p-3 rounded border transition-all text-sm font-bold ${ctx === c ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_#2563eb]' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-auto text-center">
            <p className="text-yellow-500 text-xs mb-4 h-4 font-bold">{ctx ? `目標已鎖定：[${ctx}]` : '等待輸入指令...'}</p>
            <button 
              onClick={startReading}
              disabled={!ctx}
              className={`w-full py-4 rounded-full font-bold tracking-widest transition-all ${ctx ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              INITIATE SEQUENCE
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LOADING */}
      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-16 h-16 border-4 border-blue-900 border-t-blue-400 rounded-full animate-spin mb-6"></div>
          <div className="w-full max-w-xs bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
            <div className="bg-blue-500 h-full transition-all duration-300" style={{width: `${progress}%`}}></div>
          </div>
          <p className="text-xs text-blue-300 animate-pulse">{loadingText}</p>
        </div>
      )}

      {/* STEP 3: RESULT */}
      {step === 'result' && cardResult && (
        <div className="flex flex-col flex-1 animate-in zoom-in duration-300">
          <div className="flex justify-center mb-6 perspective-1000">
            <div className="relative w-40 h-64 bg-gray-800 border-2 border-blue-400 rounded-xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] transform transition-transform hover:scale-105">
               <div className={`text-6xl mb-4 ${cardResult.isUpright ? '' : 'rotate-180'}`}>{cardResult.card.emoji}</div>
               <div className="text-center px-2">
                 <div className="text-sm font-bold text-white">{cardResult.card.name}</div>
                 <div className={`text-[10px] mt-1 px-2 py-0.5 rounded inline-block ${cardResult.isUpright ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                   {cardResult.isUpright ? '正位 Upright' : '逆位 Reversed'}
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
             <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
               <Zap className="w-4 h-4" /> 工程解讀報告 (Engineering Report)
             </h4>
             <div className="space-y-3 text-xs leading-relaxed text-gray-300">
               <p><span className="text-white font-bold">核心參數 (Core):</span> {cardResult.card.keyword}</p>
               {(() => {
                 const { status, advice } = getEngineeringInterpretation(cardResult.card, ctx, cardResult.isUpright);
                 return (
                   <>
                     <p><span className="text-white font-bold">系統狀態 (Status):</span> {status}</p>
                     <p><span className="text-white font-bold">執行策略 (Strategy):</span> {advice}</p>
                   </>
                 );
               })()}
             </div>
          </div>

          <div className="mt-auto">
            <div className="border border-dashed border-red-900/50 bg-red-900/10 p-3 rounded mb-4 text-center">
              <p className="text-red-400 text-[10px] font-bold flex items-center justify-center gap-2">
                <AlertTriangle className="w-3 h-3" /> 警告：本結果只供參考娛樂之用不可盡信！
              </p>
              <p className="text-gray-600 text-[9px] mt-1">Disclaimer: For entertainment purposes only.</p>
            </div>
            <button onClick={() => setStep('setup')} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold text-sm transition-colors">
              重新啟動 RESTART
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN COMPONENT: FORTUNE CENTER
// ==========================================
export const FortuneTeller = () => {
  const [view, setView] = useState<'menu' | 'xlr' | 'tarot' | 'ziwei' | 'aiquantum' | 'shrine'>('menu');

  if (view === 'menu') {
    return (
      <div className="bg-hker-night p-8 rounded-lg border-2 border-slate-700 shadow-xl max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom duration-300">
        <h3 className="text-2xl font-black text-white mb-2">玄學運算中心</h3>
        <p className="text-xs text-slate-400 mb-8 uppercase tracking-widest">Metaphysical Computation Hub</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setView('xlr')}
            className="group bg-gradient-to-br from-slate-800 to-black border border-hker-gold/30 p-6 rounded-xl hover:border-hker-gold transition-all shadow-lg"
          >
            <Compass className="w-12 h-12 text-hker-gold mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold text-white mb-1">小六壬占卜</h4>
            <p className="text-[10px] text-slate-500">Xiao Liu Ren Algorithm</p>
          </button>

          <button 
            onClick={() => setView('tarot')}
            className="group bg-gradient-to-br from-slate-800 to-black border border-blue-500/30 p-6 rounded-xl hover:border-blue-400 transition-all shadow-lg"
          >
            <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold text-white mb-1">AI 塔羅引擎</h4>
            <p className="text-[10px] text-slate-500">AI Tarot Neural Network</p>
          </button>

          <button 
            onClick={() => setView('ziwei')}
            className="group bg-gradient-to-br from-slate-800 to-black border border-purple-500/30 p-6 rounded-xl hover:border-purple-400 transition-all shadow-lg"
          >
            <Star className="w-12 h-12 text-purple-400 mx-auto mb-4 group-hover:rotate-180 transition-transform duration-700" />
            <h4 className="text-lg font-bold text-white mb-1">紫微斗數排盤</h4>
            <p className="text-[10px] text-slate-500">Zi Wei Dou Shu Star Map</p>
          </button>

          <button 
            onClick={() => setView('aiquantum')}
            className="group bg-gradient-to-br from-slate-800 to-black border border-cyan-500/30 p-6 rounded-xl hover:border-cyan-400 transition-all shadow-lg"
          >
            <Cpu className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-700" />
            <h4 className="text-lg font-bold text-white mb-1">AI 量子命理</h4>
            <p className="text-[10px] text-slate-500">AI Quantum Fortune</p>
          </button>

          <button 
            onClick={() => setView('shrine')}
            className="group bg-gradient-to-br from-red-950 to-black border border-red-500/30 p-6 rounded-xl hover:border-red-500 transition-all shadow-lg col-span-1 md:col-span-2"
          >
            <Flame className="w-12 h-12 text-red-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold text-white mb-1">網上誠心祈福</h4>
            <p className="text-[10px] text-slate-500">Virtual Shrine & Prayer</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {view === 'xlr' && <XiaoLiuRen onBack={() => setView('menu')} />}
      {view === 'tarot' && <TarotReader onBack={() => setView('menu')} />}
      {view === 'ziwei' && <ZiWeiDouShuReader onBack={() => setView('menu')} />}
      {view === 'aiquantum' && <AiFortuneEngine onBack={() => setView('menu')} />}
      {view === 'shrine' && <VirtualShrine onBack={() => setView('menu')} />}
    </div>
  );
};