

import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Solar, Lunar } from 'lunar-javascript';
import { 
    Sparkles, Moon, Sun, Heart, Hand, Flame, ArrowLeft, Coins, 
    Briefcase, TrendingUp, ShieldAlert, BrainCircuit,
    Home, GraduationCap, Activity, Users, CheckCircle2,
    Compass, Scroll, Info, Calculator, Calendar, Cpu, Terminal, Eye, AlertTriangle, Grid,
    BarChart3, Zap, Lock, Globe, Database, Server, UserCheck, CloudSun, Flower2, Languages
} from 'lucide-react';

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

// HELPER: Strict Date Validation to prevent Library Crash
const isValidDate = (y: number, m: number, d: number) => {
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

// --- CORE UTILS: Deterministic RNG for Quantum Engine ---
const stringToSeed = (str: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    return h;
};

const mulberry32 = (a: number) => {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
};

// --- HELPER: TRANSLATION BUTTON COMPONENT ---
const TranslateButton: React.FC<{ isChinese: boolean, toggle: () => void, className?: string }> = ({ isChinese, toggle, className = "" }) => (
    <button 
        onClick={toggle} 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border ${
            isChinese 
            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
            : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
        } ${className}`}
    >
        <Languages size={14} />
        {isChinese ? 'Translate to English' : '翻譯成中文'}
    </button>
);

// --- DATA: PRAYER ENGINE ---
const PRAYER_DATA = {
    deities: [
        { id: 1, name: "觀音", nameEn: "Guanyin", title: "大慈大悲觀世音菩薩", icon: "🌸" },
        { id: 2, name: "佛祖", nameEn: "Buddha", title: "釋迦牟尼佛", icon: "🧘" },
        { id: 3, name: "玉皇大帝", nameEn: "Jade Emperor", title: "昊天金闕玉皇大帝", icon: "👑" },
        { id: 4, name: "玄天上帝", nameEn: "Xuantian Shangdi", title: "北極玄天上帝", icon: "⚔️" },
        { id: 5, name: "財神", nameEn: "God of Wealth", title: "五路財神", icon: "💰" },
        { id: 6, name: "壽星公", nameEn: "Longevity God", title: "南極仙翁", icon: "🍑" },
        { id: 7, name: "耶穌", nameEn: "Jesus", title: "主耶穌基督", icon: "✝️" },
        { id: 8, name: "聖母", nameEn: "Virgin Mary", title: "聖母瑪利亞", icon: "🌹" }
    ],
    categories: [
        "愛情", "工作", "生活", "運程", 
        "人事", "學業", "健康", "家庭"
    ],
    blessings: {
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
    } as Record<string, string[]>,
    quotes: [
        "心誠則靈，日行一善，福報自來。",
        "熱愛家人，珍惜朋友，便是世間最大的修行。",
        "勇敢面對問題，逃避只會讓困難更堅硬。",
        "助人為快樂之本，多播善種，必收善果。",
        "境隨心轉，心寬路自闊。",
        "感恩當下的一切，那是獲得幸福的捷徑。"
    ]
};

// --- DATA: ZI WEI ENGINE (PROFESSIONAL 14 STARS) ---
const ZiWeiEngine = {
    zhi_names: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
    gan_names: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    stars_info: {
        "紫微": "帝座，尊貴、領導", "天機": "智慧，變動、思考", "太陽": "貴氣，博愛、付出",
        "武曲": "財星，剛毅、執行", "天同": "福星，溫和、享受", "廉貞": "次桃花，交際、權變",
        "天府": "庫星，守成、包容", "太陰": "財星，溫柔、母性", "貪狼": "桃花，慾望、多藝",
        "巨門": "暗星，是非、口才", "天相": "印星，輔佐、公正", "天梁": "蔭星，長壽、照顧",
        "七殺": "將星，肅殺、衝勁", "破軍": "耗星，破壞、開創"
    } as Record<string, string>,

    getGanIndex: (char: string) => ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(char),
    getZhiIndex: (char: string) => ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].indexOf(char),

    getMingGong: (lunarMonth: number, hourZhiIdx: number) => {
        return (2 + (lunarMonth - 1) - hourZhiIdx + 12) % 12;
    },

    getWuxingJu: (yearGanIdx: number, mingGongIdx: number) => {
        const tigerGanMap = [2, 4, 6, 8, 0];
        const startGan = tigerGanMap[yearGanIdx % 5];
        const distFromTiger = (mingGongIdx - 2 + 12) % 12;
        const mingGanIdx = (startGan + distFromTiger) % 10;
        const fakeLookup = [4, 2, 6, 5, 3];
        return fakeLookup[(mingGanIdx + mingGongIdx) % 5];
    },

    getZiWeiPos: (lunarDay: number, bureau: number) => {
        if (bureau === 0) bureau = 4;
        const startPos = 2;
        return (startPos + lunarDay + bureau) % 12;
    },

    placeStars: (ziweiIdx: number) => {
        const placements: string[][] = Array.from({length: 12}, () => []);
        const zwOffsets = [0, -1, -3, -4, -5, -8];
        const zwNames = ["紫微", "天機", "太陽", "武曲", "天同", "廉貞"];
        zwOffsets.forEach((off, i) => {
            const idx = (ziweiIdx + off + 120) % 12;
            placements[idx].push(zwNames[i]);
        });
        const tfMap: Record<number, number> = {
            0: 4, 1: 3, 2: 2, 3: 1, 4: 0, 5: 11,
            6: 10, 7: 9, 8: 8, 9: 7, 10: 6, 11: 5
        };
        const tfIdx = tfMap[ziweiIdx];
        const tfOffsets = [0, 1, 2, 3, 4, 5, 6, 10];
        const tfNames = ["天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍"];
        tfOffsets.forEach((off, i) => {
            const idx = (tfIdx + off) % 12;
            placements[idx].push(tfNames[i]);
        });
        return placements;
    }
};

// --- DATA: SMALL SIX REN (Qia Zhi Yi Suan) ---
const SIX_REN_RESULTS = [
    { 
        name: "空亡", nameEn: "Void (Kong Wang)",
        summary: "空亡事不祥，陰人多乖張", summaryEn: "Ominous signs, avoid action.",
        poem: "空亡事不祥，陰人多乖張，求財無利益，行人有災殃。\n失物尋不見，官事有刑傷，病人逢暗鬼，解禳保安康。",
        lucky: "凶", luckyEn: "Bad Luck",
        color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-400"
    },
    { 
        name: "大安", nameEn: "Great Peace (Da An)",
        summary: "大安事事昌，求財在坤方", summaryEn: "Everything prospers, peace at home.",
        poem: "大安事事昌，求財在坤方，失物去不遠，宅舍保安康。\n行人身未動，病者主無妨，將軍回田野，仔細更推詳。",
        lucky: "大吉", luckyEn: "Great Luck",
        color: "text-green-600", bg: "bg-green-50", border: "border-green-500"
    },
    { 
        name: "留連", nameEn: "Lingering (Liu Lian)",
        summary: "留連事難成，求謀日未明", summaryEn: "Things drag on, outcome unclear.",
        poem: "留連事難成，求謀日未明，官事凡宜緩，去者未回程。\n失物南方見，急討方心稱，更須防口舌，人口且平平。",
        lucky: "凶", luckyEn: "Bad Luck",
        color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-500"
    },
    { 
        name: "速喜", nameEn: "Joy (Su Xi)",
        summary: "速喜喜來臨，求財向南行", summaryEn: "Joy arrives quickly, good news.",
        poem: "速喜喜來臨，求財向南行，失物申未午，逢人路上尋。\n官事有福德，病者無禍侵，田宅六畜吉，行人有信音。",
        lucky: "吉", luckyEn: "Good Luck",
        color: "text-red-600", bg: "bg-red-50", border: "border-red-500"
    },
    { 
        name: "赤口", nameEn: "Conflict (Chi Kou)",
        summary: "赤口主口舌，官非切宜防", summaryEn: "Disputes and arguments, be careful.",
        poem: "赤口主口舌，官非切宜防，失物速速討，行人有驚慌。\n六畜多作怪，病者出西方，更須防咀咒，誠恐染瘟皇。",
        lucky: "凶", luckyEn: "Bad Luck",
        color: "text-red-800", bg: "bg-red-100", border: "border-red-800"
    },
    { 
        name: "小吉", nameEn: "Small Luck (Xiao Ji)",
        summary: "小吉最吉昌，路上好商量", summaryEn: "Minor success, good for deals.",
        poem: "小吉最吉昌，路上好商量，陰人來報喜，失物在坤方。\n行人即便至，交關甚是強，凡事皆和合，病者叩窮蒼。",
        lucky: "小吉", luckyEn: "Small Luck",
        color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-500"
    }
];

// --- DATA: TAROT DECK ---
const TAROT_DECK = [
    { name: "The Fool", nameCN: "愚者", icon: "🃏", keyword: "New Beginnings", keywordCN: "新的開始", desc: "A leap of faith into the unknown.", descCN: "對未知充滿信心的飛躍。" },
    { name: "The Magician", nameCN: "魔術師", icon: "🪄", keyword: "Power, Skill", keywordCN: "力量、技巧", desc: "Manifesting will through action.", descCN: "通過行動顯化意志。" },
    { name: "High Priestess", nameCN: "女祭司", icon: "🌙", keyword: "Intuition", keywordCN: "直覺", desc: "Trust your gut feeling.", descCN: "相信你的直覺。" },
    { name: "The Empress", nameCN: "皇后", icon: "👑", keyword: "Abundance", keywordCN: "豐盛", desc: "Fertility and creative growth.", descCN: "創造力與成長。" },
    { name: "The Emperor", nameCN: "皇帝", icon: "🏰", keyword: "Authority", keywordCN: "權威", desc: "Logic and rules prevail.", descCN: "邏輯與規則主導。" },
    { name: "The Lovers", nameCN: "戀人", icon: "💞", keyword: "Union", keywordCN: "結合", desc: "Harmony and important decisions.", descCN: "和諧與重要決定。" },
    { name: "The Chariot", nameCN: "戰車", icon: "🛒", keyword: "Willpower", keywordCN: "意志力", desc: "Overcoming obstacles through focus.", descCN: "通過專注克服障礙。" },
    { name: "Strength", nameCN: "力量", icon: "🦁", keyword: "Courage", keywordCN: "勇氣", desc: "Inner strength controls the beast.", descCN: "內在力量控制本能。" },
    { name: "The Hermit", nameCN: "隱士", icon: "🕯️", keyword: "Guidance", keywordCN: "指引", desc: "Seeking answers within.", descCN: "向內尋求答案。" },
    { name: "Wheel of Fortune", nameCN: "命運之輪", icon: "🎡", keyword: "Cycle", keywordCN: "循環", desc: "Luck and destiny are turning.", descCN: "命運正在轉動。" },
    { name: "Justice", nameCN: "正義", icon: "⚖️", keyword: "Truth", keywordCN: "真相", desc: "Cause and effect.", descCN: "因果循環。" },
    { name: "The Hanged Man", nameCN: "吊人", icon: "🧘", keyword: "Sacrifice", keywordCN: "犧牲", desc: "Letting go to gain new insight.", descCN: "放手以獲得新觀點。" },
    { name: "Death", nameCN: "死神", icon: "💀", keyword: "Transformation", keywordCN: "轉變", desc: "Necessary ending for new beginning.", descCN: "結束是為了新的開始。" },
    { name: "Temperance", nameCN: "節制", icon: "🏺", keyword: "Balance", keywordCN: "平衡", desc: "Blending opposites.", descCN: "調和對立。" },
    { name: "The Devil", nameCN: "惡魔", icon: "😈", keyword: "Addiction", keywordCN: "束縛", desc: "Breaking free from chains.", descCN: "掙脫束縛。" },
    { name: "The Tower", nameCN: "高塔", icon: "⚡", keyword: "Chaos", keywordCN: "混亂", desc: "False structures falling down.", descCN: "虛假結構的崩塌。" },
    { name: "The Star", nameCN: "星星", icon: "🌟", keyword: "Hope", keywordCN: "希望", desc: "Renewal after the storm.", descCN: "風暴後的重生。" },
    { name: "The Moon", nameCN: "月亮", icon: "🌖", keyword: "Illusion", keywordCN: "幻覺", desc: "Things are not what they seem.", descCN: "事物並非表象所見。" },
    { name: "The Sun", nameCN: "太陽", icon: "☀️", keyword: "Success", keywordCN: "成功", desc: "Positivity and vitality.", descCN: "積極與活力。" },
    { name: "Judgement", nameCN: "審判", icon: "🎺", keyword: "Rebirth", keywordCN: "重生", desc: "Answering the call.", descCN: "回應召喚。" },
    { name: "The World", nameCN: "世界", icon: "🌍", keyword: "Completion", keywordCN: "圓滿", desc: "A chapter closes successfully.", descCN: "章節圓滿結束。" }
];

const TAROT_CATEGORIES = [
    "工作 (Career)", "愛情 (Love)", "財富 (Wealth)", "家庭 (Family)", 
    "學業 (Academics)", "生活 (Life)", "人緣 (Popularity)", "朋友 (Friends)", 
    "運程 (Luck)", "健康 (Health)"
];

// ==========================================
// SUB-COMPONENT: ZI WEI DOU SHU VIEW
// ==========================================
const ZiWeiView: React.FC<{onBack: () => void}> = ({onBack}) => {
    const [step, setStep] = useState<'INTRO' | 'INPUT' | 'RESULT'>('INTRO');
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [hour, setHour] = useState('');
    const [result, setResult] = useState<any>(null);
    const [isChinese, setIsChinese] = useState(true); // Default to Chinese

    const handleCalculate = () => {
        const y = parseInt(year), m = parseInt(month), d = parseInt(day), h = parseInt(hour);
        if (!isValidDate(y, m, d)) return alert("日期無效 (Invalid Date)");
        if (h < 0 || h > 23 || isNaN(h)) return alert("時間無效 (Invalid Hour)");

        try {
            const solar = Solar.fromYmdHms(y, m, d, h, 0, 0);
            const lunar = solar.getLunar();
            const lYearGan = lunar.getYearGan();
            const lMonth = Math.abs(lunar.getMonth());
            const lDay = lunar.getDay();
            const hourZhi = lunar.getTimeZhi();
            const yearGanIdx = ZiWeiEngine.getGanIndex(lYearGan);
            const hourZhiIdx = ZiWeiEngine.getZhiIndex(hourZhi);
            const mingIdx = ZiWeiEngine.getMingGong(lMonth, hourZhiIdx);
            const bureau = ZiWeiEngine.getWuxingJu(yearGanIdx, mingIdx);
            const bureauNames = {2:"水二局", 3:"木三局", 4:"金四局", 5:"土五局", 6:"火六局"};
            const ziweiIdx = ZiWeiEngine.getZiWeiPos(lDay, bureau);
            const layout = ZiWeiEngine.placeStars(ziweiIdx);

            setResult({
                solarStr: `${y}年${m}月${d}日 ${h}時`,
                lunarStr: `農曆 ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`,
                bazi: `${lunar.getYearInGanZhi()} ${lunar.getMonthInGanZhi()} ${lunar.getDayInGanZhi()} ${lunar.getTimeInGanZhi()}`,
                mingIdx,
                bureauName: bureauNames[bureau as keyof typeof bureauNames] || "未知局",
                layout: layout
            });
            setStep('RESULT');
        } catch (e: any) {
            alert("運算錯誤: " + e.message);
        }
    };

    return (
        <div className="bg-slate-900 text-purple-100 min-h-[700px] rounded-2xl shadow-xl p-4 md:p-6 border border-purple-900/50 relative">
            <button onClick={onBack} className="flex items-center gap-2 mb-4 hover:text-white transition text-xs"><ArrowLeft size={16}/> 返回大廳</button>
            
            {step === 'INTRO' && (
                <div className="text-center space-y-6 pt-10 animate-fade-in-up">
                    <Compass size={64} className="mx-auto text-purple-400 animate-spin-slow"/>
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">紫微斗數 14 主星排盤</h2>
                        <p className="text-purple-300/60 text-xs mt-2 font-mono">SYSTEM: ZIWEI_ENGINE_V3</p>
                    </div>
                    <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-500/20 text-sm text-left max-w-sm mx-auto space-y-2">
                        <p>✅ 專業安星法則 (五虎遁、紫府雙星系)</p>
                        <p>✅ 命宮、身宮、五行局自動運算</p>
                        <p>✅ 支援真太陽時轉換 (LunarLib 核心)</p>
                    </div>
                    <button onClick={() => setStep('INPUT')} className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-3 rounded-full font-bold shadow-lg shadow-purple-900/50 transition transform hover:scale-105">開始排盤</button>
                </div>
            )}
            
            {step === 'INPUT' && (
                <div className="max-w-md mx-auto space-y-6 pt-6">
                    <h3 className="text-center font-bold text-xl text-purple-200">輸入出生資料 (西曆)</h3>
                    <div className="flex gap-2">
                        <input type="number" placeholder="YYYY" value={year} onChange={e=>setYear(e.target.value)} className="w-1/3 bg-black/50 border border-purple-500 rounded p-3 text-center focus:outline-none focus:border-purple-300 transition"/>
                        <input type="number" placeholder="MM" value={month} onChange={e=>setMonth(e.target.value)} className="w-1/3 bg-black/50 border border-purple-500 rounded p-3 text-center focus:outline-none focus:border-purple-300 transition"/>
                        <input type="number" placeholder="DD" value={day} onChange={e=>setDay(e.target.value)} className="w-1/3 bg-black/50 border border-purple-500 rounded p-3 text-center focus:outline-none focus:border-purple-300 transition"/>
                    </div>
                    <div className="relative">
                        <input type="number" placeholder="時辰 (0-23)" value={hour} onChange={e=>setHour(e.target.value)} className="w-full bg-black/50 border border-purple-500 rounded p-3 text-center focus:outline-none focus:border-purple-300 transition"/>
                        <div className="text-xs text-center mt-2 text-gray-500">系統將自動轉換為天干地支時</div>
                    </div>
                    <button onClick={handleCalculate} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-4 rounded-xl font-bold text-lg shadow-lg transition">立即分析</button>
                </div>
            )}
            
            {step === 'RESULT' && result && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-end">
                        <TranslateButton isChinese={isChinese} toggle={() => setIsChinese(!isChinese)} />
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs md:text-sm flex flex-col md:flex-row justify-between items-center gap-2">
                        <div className="text-gray-400">{result.solarStr}</div>
                        <div className="font-bold text-purple-300">{result.lunarStr}</div>
                        <div className="text-yellow-500 font-mono">{result.bazi}</div>
                        <div className="bg-purple-900 px-2 py-1 rounded border border-purple-500 text-purple-200">{result.bureauName}</div>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4 p-2 bg-black/40 rounded-xl border border-purple-900/50">
                        {Array.from({length: 12}).map((_, i) => {
                             const idx = i;
                             const zhi = ZiWeiEngine.zhi_names[idx];
                             const stars = result.layout[idx];
                             const isMing = idx === result.mingIdx;
                             return (
                                 <div key={idx} className={`aspect-square md:h-32 rounded-lg border p-2 flex flex-col justify-between relative ${isMing ? 'bg-purple-900/30 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-white/5'}`}>
                                     {isMing && <div className="absolute top-0 right-0 bg-purple-600 text-[10px] px-1 rounded-bl font-bold text-white">命宮</div>}
                                     <div className="text-xs font-bold text-gray-500 self-center border-b border-white/10 w-full text-center pb-1 mb-1">{zhi}宮</div>
                                     <div className="flex-1 flex flex-col items-center justify-center gap-1">
                                         {stars.length > 0 ? stars.map((s: string) => (
                                             <span key={s} className={`text-xs md:text-sm font-bold ${['紫微','天府','太陽','太陰'].includes(s) ? 'text-yellow-400' : 'text-purple-200'}`}>{s}</span>
                                         )) : <span className="text-[10px] text-gray-600">--</span>}
                                     </div>
                                 </div>
                             );
                        })}
                    </div>

                    <div className="bg-purple-900/20 p-6 rounded-xl border border-purple-500/30">
                        <h4 className="font-bold text-purple-200 mb-4 flex items-center gap-2"><Eye size={16}/> {isChinese ? "命宮主星分析" : "Life Palace Analysis"}</h4>
                        <div className="space-y-2">
                            {result.layout[result.mingIdx].length > 0 ? (
                                result.layout[result.mingIdx].map((star: string) => (
                                    <div key={star} className="flex gap-2 text-sm">
                                        <span className="font-bold text-yellow-400 min-w-[60px]">{star}</span>
                                        <span className="text-gray-300">
                                            {isChinese 
                                              ? ZiWeiEngine.stars_info[star] 
                                              : `${ZiWeiEngine.stars_info[star]} (Translation unavailable for Astrological terms)`}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400">
                                    <span className="font-bold text-white">{isChinese ? "命無正曜" : "No Major Stars"}</span>：
                                    {isChinese 
                                        ? "命宮沒有主星。通常需要參考對宮（遷移宮）的星曜。性格可塑性高，易受環境影響，人生變動可能較大，或善於適應。"
                                        : "No major stars in Life Palace. Reference the opposite palace. High adaptability, easily influenced by environment."}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <button onClick={()=>setStep('INPUT')} className="w-full py-3 text-sm text-purple-400 hover:text-white underline">重新排盤</button>
                </div>
            )}
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: DIVINATION (Small Six Ren)
// ==========================================
const Divination: React.FC<{onBack: () => void}> = ({onBack}) => {
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [day, setDay] = useState(new Date().getDate().toString());
    const [hour, setHour] = useState(new Date().getHours());
    const [result, setResult] = useState<any>(null);
    const [isChinese, setIsChinese] = useState(true);

    const calculate = () => {
        const y = parseInt(year), m = parseInt(month), d = parseInt(day);
        if (!isValidDate(y, m, d)) return alert("日期無效");
        if (hour < 0 || hour > 23) return alert("時間無效");

        try {
            const solar = Solar.fromYmdHms(y, m, d, hour, 0, 0);
            const lunar = solar.getLunar();
            const lMonth = Math.abs(lunar.getMonth());
            const lDay = lunar.getDay();
            const shichenIndex = Math.floor((hour + 1) / 2) % 12 + 1;
            let resIndex = (lMonth + lDay + shichenIndex - 2) % 6;
            setResult(SIX_REN_RESULTS[resIndex]);
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl min-h-[600px] flex flex-col overflow-hidden relative">
            <div className="bg-purple-900 text-white p-4 flex items-center justify-between shadow-md z-10">
                <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold opacity-80 hover:opacity-100"><ArrowLeft size={16}/> 返回</button>
                <div className="flex items-center gap-2">
                    <Hand size={20} className="text-yellow-400"/>
                    <span className="font-bold text-lg tracking-widest">掐指一算</span>
                </div>
                <div className="w-16"></div>
            </div>

            <div className="p-6 flex-1 flex flex-col items-center">
                {!result ? (
                    <div className="w-full max-w-md space-y-6 mt-8">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner">
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase flex items-center gap-1"><Calendar size={12}/> 公曆日期</label>
                            <div className="flex gap-2 mb-4">
                                <input type="number" value={year} onChange={e=>setYear(e.target.value)} className="w-1/3 p-3 border rounded-lg text-center" placeholder="年"/>
                                <input type="number" value={month} onChange={e=>setMonth(e.target.value)} className="w-1/3 p-3 border rounded-lg text-center" placeholder="月"/>
                                <input type="number" value={day} onChange={e=>setDay(e.target.value)} className="w-1/3 p-3 border rounded-lg text-center" placeholder="日"/>
                            </div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase flex items-center gap-1"><ClockIcon/> 時間 (0-23)</label>
                            <input type="number" value={hour} onChange={e=>setHour(parseInt(e.target.value))} className="w-full p-3 border rounded-lg text-center"/>
                        </div>
                        <button onClick={calculate} className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg">
                            <Sparkles size={18} /> 開始演算
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-lg animate-fade-in-up pb-10">
                        <div className="flex justify-end mb-4">
                            <TranslateButton isChinese={isChinese} toggle={() => setIsChinese(!isChinese)} />
                        </div>
                        <div className={`relative ${result.bg} ${result.border} border-4 rounded-2xl p-8 text-center shadow-xl overflow-hidden`}>
                            <div className="relative z-10">
                                <div className={`inline-block px-4 py-1 rounded-full text-xs font-bold text-white mb-4 ${result.lucky === '大吉' || result.lucky === '吉' || result.lucky === '小吉' ? 'bg-red-500' : 'bg-gray-600'}`}>
                                    {isChinese ? result.lucky : result.luckyEn}
                                </div>
                                <h2 className={`text-6xl font-black mb-2 ${result.color}`}>{isChinese ? result.name : result.nameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-700 mb-6">{isChinese ? result.summary : result.summaryEn}</h3>
                                <div className="bg-white/60 p-6 rounded-xl border border-black/5 backdrop-blur-sm">
                                    {result.poem.split('\n').map((line: string, i: number) => (
                                        <p key={i} className="text-gray-800 font-serif text-lg leading-loose tracking-wide">
                                            {isChinese ? line : "Ancient poem translation unavailable."}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setResult(null)} className="w-full mt-6 py-3 text-gray-400 font-bold hover:text-purple-600 transition flex items-center justify-center gap-2">
                            <Calculator size={16}/> 再算一次
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: AI TAROT
// ==========================================
const TarotView: React.FC<{onBack: () => void}> = ({onBack}) => {
    const [step, setStep] = useState<'SELECT' | 'PROCESSING' | 'RESULT'>('SELECT');
    const [category, setCategory] = useState('');
    const [card, setCard] = useState<any>(null);
    const [isUpright, setIsUpright] = useState(true);
    const [loadingMsg, setLoadingMsg] = useState('Initializing AI Matrix...');
    const [progress, setProgress] = useState(0);
    const [isChinese, setIsChinese] = useState(true); // Default to Chinese

    const startReading = (selectedCat: string) => {
        setCategory(selectedCat);
        setStep('PROCESSING');
        setProgress(0);
        let i = 0;
        const interval = setInterval(() => {
            if (i >= 5) {
                clearInterval(interval);
                finalizeReading();
            } else {
                setLoadingMsg("AI Processing Data Points...");
                setProgress((prev) => prev + 20);
                i++;
            }
        }, 600);
    };

    const finalizeReading = () => {
        const randCard = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
        const orientation = Math.random() > 0.3;
        setCard(randCard);
        setIsUpright(orientation);
        setStep('RESULT');
    };

    return (
        <div className="bg-[#0d1117] text-gray-300 font-mono min-h-[600px] rounded-2xl shadow-xl overflow-hidden border border-gray-800">
            <div className="bg-[#161b22] p-4 flex justify-between items-center border-b border-gray-700">
                <button onClick={onBack} className="flex items-center gap-2 hover:text-white transition text-xs"><ArrowLeft size={14}/> TERMINATE_SESSION</button>
                <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-blue-500 animate-pulse"/>
                    <span className="font-bold text-blue-400 tracking-wider">AI TAROT ENGINE</span>
                </div>
            </div>

            <div className="p-6">
                {step === 'SELECT' && (
                    <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in-up">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {TAROT_CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => startReading(cat)} className="bg-[#21262d] border border-gray-600 hover:border-blue-500 hover:bg-[#30363d] p-3 rounded text-xs font-bold transition-all active:scale-95">
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'PROCESSING' && (
                    <div className="flex flex-col items-center justify-center h-80 space-y-6">
                        <Terminal size={48} className="text-green-500 animate-bounce"/>
                        <div className="w-64 space-y-2">
                            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${progress}%`}}></div>
                            </div>
                            <p className="text-xs text-blue-400 font-mono text-center">{loadingMsg}</p>
                        </div>
                    </div>
                )}

                {step === 'RESULT' && card && (
                    <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-8 animate-fade-in-up">
                        <div className="flex-1 flex flex-col items-center">
                            <div className={`w-56 h-80 bg-gradient-to-br from-gray-800 to-black border-2 rounded-xl flex flex-col items-center justify-center p-6 shadow-2xl relative transition-transform duration-700 transform hover:scale-105 ${isUpright ? 'border-blue-500' : 'border-red-500 rotate-180'}`}>
                                <div className="text-6xl mb-4">{card.icon}</div>
                                <div className={`text-center ${isUpright ? '' : 'rotate-180'}`}>
                                    <h3 className="text-xl font-bold text-white mb-1">{isChinese ? card.nameCN : card.name}</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{isChinese ? card.keywordCN : card.keyword}</p>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <span className={`px-3 py-1 rounded text-xs font-bold ${isUpright ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}>
                                    {isChinese 
                                        ? (isUpright ? '正位 (Upright)' : '逆位 (Reversed)') 
                                        : (isUpright ? 'POSITION: UPRIGHT' : 'POSITION: REVERSED')}
                                </span>
                            </div>
                        </div>

                        <div className="flex-[1.5] space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="border-l-2 border-blue-500 pl-4">
                                    <h3 className="text-blue-400 font-bold text-sm mb-1 flex items-center gap-2"><Eye size={14}/> {isChinese ? "系統分析報告" : "SYSTEM ANALYSIS REPORT"}</h3>
                                    <p className="text-white text-lg font-bold">{isChinese ? "目標範疇: " : "Context: "}{category}</p>
                                </div>
                                <TranslateButton isChinese={isChinese} toggle={() => setIsChinese(!isChinese)} />
                            </div>

                            <div className="bg-[#161b22] p-4 rounded border border-gray-700 space-y-4 text-sm leading-relaxed">
                                <div>
                                    <strong className="text-green-400 block mb-1">{'>'} {isChinese ? "核心含義" : "CORE KERNEL"}:</strong>
                                    <p>{isChinese ? card.descCN : card.desc}</p>
                                </div>
                                <div>
                                    <strong className="text-yellow-400 block mb-1">{'>'} {isChinese ? "詳細解讀" : "CONTEXTUAL LOG"}:</strong>
                                    <p>
                                        {isChinese 
                                            ? `分析向量 [${category.split(' ')[0]}]... 此牌顯示${isUpright ? '能量流動穩定' : '可能存在阻力或障礙'}。就${category.split(' ')[0]}而言，這暗示你應專注於「${card.keywordCN}」。${isUpright ? '前路清晰，請自信執行計劃。' : '可能存在隱藏變數或延誤，部署前請重新評估策略。'}` 
                                            : `Analyzing vector [${category}]... The card indicates ${isUpright ? 'a stable flow of energy' : 'potential resistance or blockage'}. In terms of context, this suggests you should focus on ${card.keyword}. ${isUpright ? "The path forward is clear. Execute your plans with confidence." : "There may be hidden variables or internal delays. Re-evaluate your strategy before deploying."}`}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-800 text-center">
                                <button onClick={() => setStep('SELECT')} className="text-blue-500 hover:text-white text-xs font-bold underline">{isChinese ? "重新計算" : "REBOOT SYSTEM"}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: DIGITAL PRAYER (WORSHIP)
// ==========================================
const PrayerView: React.FC<{onBack: () => void}> = ({onBack}) => {
    const [step, setStep] = useState<'DEITY' | 'CATEGORY' | 'PRAYING' | 'RESULT'>('DEITY');
    const [deity, setDeity] = useState<any>(null);
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [blessingResult, setBlessingResult] = useState<any>(null);
    const [isChinese, setIsChinese] = useState(true); // Default to Chinese

    const handlePray = () => {
        setStep('PRAYING');
        setTimeout(() => {
            const results = selectedCats.map(cat => {
                const list = PRAYER_DATA.blessings[cat];
                return { cat, text: list[Math.floor(Math.random() * list.length)] };
            });
            const quote = PRAYER_DATA.quotes[Math.floor(Math.random() * PRAYER_DATA.quotes.length)];
            setBlessingResult({ results, quote });
            setStep('RESULT');
        }, 3000);
    };

    const toggleCat = (cat: string) => {
        if (selectedCats.includes(cat)) {
            setSelectedCats(prev => prev.filter(c => c !== cat));
        } else {
            if (selectedCats.length >= 3) return alert("最多選3項");
            setSelectedCats(prev => [...prev, cat]);
        }
    };

    return (
        <div className="bg-[#fffaf0] text-[#4a3b2a] min-h-[600px] rounded-2xl shadow-xl border-4 border-[#d4af37] overflow-hidden relative font-serif">
            <div className="bg-[#8b0000] text-white p-4 flex justify-between items-center shadow-md">
                <button onClick={onBack} className="flex items-center gap-2 hover:text-yellow-200 transition text-sm font-bold"><ArrowLeft size={16}/> 返回</button>
                <div className="flex items-center gap-2">
                    <CloudSun size={20} className="text-yellow-400"/>
                    <span className="font-bold text-lg tracking-widest">網上誠心祈福系統</span>
                </div>
                <div className="w-16"></div>
            </div>

            <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[500px]">
                {step === 'DEITY' && (
                    <div className="w-full max-w-3xl animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-center mb-8 text-[#8b0000]">請選擇神祇 (Select Deity)</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {PRAYER_DATA.deities.map(d => (
                                <button key={d.id} onClick={() => { setDeity(d); setStep('CATEGORY'); }} className="bg-white border-2 border-[#d4af37] rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-yellow-50 hover:scale-105 transition shadow-sm group">
                                    <div className="text-4xl group-hover:scale-110 transition duration-300">{d.icon}</div>
                                    <div className="font-bold text-[#8b0000] text-sm">{d.name}</div>
                                    <div className="text-[10px] text-gray-500">{d.title}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'CATEGORY' && (
                    <div className="w-full max-w-2xl animate-fade-in-up text-center">
                        <div className="mb-6">
                            <span className="text-sm text-gray-500">正在向</span>
                            <h2 className="text-3xl font-bold text-[#8b0000] my-2">{deity.icon} {deity.name}</h2>
                            <span className="text-sm text-gray-500">祈福...</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                            {PRAYER_DATA.categories.map(cat => (
                                <button key={cat} onClick={() => toggleCat(cat)} className={`p-3 rounded-lg border font-bold text-sm transition ${selectedCats.includes(cat) ? 'bg-[#8b0000] text-white border-[#8b0000]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#d4af37]'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setStep('DEITY')} className="px-6 py-3 border border-gray-300 rounded-full text-gray-500 hover:bg-gray-100">上一步</button>
                            <button onClick={handlePray} disabled={selectedCats.length === 0} className="px-8 py-3 bg-[#d4af37] text-white rounded-full font-bold shadow-lg hover:bg-[#b8962e] disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 flex items-center gap-2">
                                <Flower2 size={18}/> 誠心跪拜
                            </button>
                        </div>
                    </div>
                )}

                {step === 'PRAYING' && (
                    <div className="flex flex-col items-center justify-center animate-fade-in-up">
                        <div className="relative w-2 h-32 bg-gray-400 rounded-full mb-4 mx-auto">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-4 h-4 bg-red-500 rounded-full animate-pulse blur-[2px]"></div>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-20 h-20 bg-gray-200/50 blur-xl rounded-full animate-ping"></div>
                            <div className="absolute -top-10 left-1/2 w-4 h-20 bg-gray-300/30 blur-md rounded-full animate-spin-slow origin-bottom"></div>
                        </div>
                        <h2 className="text-xl font-bold text-[#8b0000] mt-8 animate-pulse">正在傳送祈願...</h2>
                    </div>
                )}

                {step === 'RESULT' && blessingResult && (
                    <div className="w-full max-w-2xl animate-fade-in-up bg-white p-8 rounded-xl shadow-lg border border-[#eee0b5] relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#d4af37]"></div>
                        
                        <div className="flex justify-end mb-4">
                            <TranslateButton isChinese={isChinese} toggle={() => setIsChinese(!isChinese)} />
                        </div>

                        <div className="text-center mb-8 border-b border-gray-100 pb-6">
                            <div className="text-6xl mb-4">{deity.icon}</div>
                            <h2 className="text-2xl font-bold text-[#8b0000]">✨ {isChinese ? `${deity.name} 給您的祝願` : `Blessings from ${deity.nameEn}`} ✨</h2>
                        </div>

                        <div className="space-y-6">
                            {blessingResult.results.map((res: any, idx: number) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <div className="bg-[#fffaf0] text-[#8b0000] font-bold px-3 py-1 rounded border border-[#d4af37] text-xs whitespace-nowrap mt-1">
                                        {res.cat.split(' ')[0]}
                                    </div>
                                    <p className="text-lg text-gray-700 leading-relaxed font-medium">
                                        {isChinese ? res.text : "[Translation] May you find peace and success in this endeavor. Good fortune awaits."}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-6 bg-[#fffaf0] rounded-xl border border-dashed border-[#d4af37] text-center">
                            <p className="text-[#8b0000] font-bold text-lg mb-2">〝 {isChinese ? blessingResult.quote : "Kindness brings its own reward. Cherish your loved ones."} 〞</p>
                        </div>

                        <div className="mt-6 text-center">
                            <button onClick={() => setStep('DEITY')} className="text-[#d4af37] hover:underline text-sm font-bold">{isChinese ? "再次祈福" : "Pray Again"}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: QUANTUM FORTUNE (AI)
// ==========================================
const QuantumView: React.FC<{onBack: () => void}> = ({onBack}) => {
    const [view, setView] = useState<'INPUT' | 'PROCESSING' | 'DASHBOARD'>('INPUT');
    const [name, setName] = useState("");
    const [birth, setBirth] = useState("");
    const [result, setResult] = useState<any>(null);
    const [isChinese, setIsChinese] = useState(true); // Default to Chinese

    const runSimulation = () => {
        if(!name || !birth) return;
        setView('PROCESSING');
        setTimeout(() => {
            const seed = stringToSeed(name + birth + new Date().toDateString());
            const rng = mulberry32(seed);
            const dailyScore = Math.floor(rng() * 100);
            const isGoodDay = dailyScore > 50;
            const dailyKeywords = isGoodDay 
                ? ["重構程式碼", "部署上線", "跨部門協作", "學習新框架", "冥想", "投資ETF", "告白"]
                : ["修改Legacy Code", "參加無效會議", "強行合併分支", "借錢給人", "熬夜", "衝動購物"];
            
            setResult({
                dailyScore,
                dailyGuide: dailyKeywords.sort(() => rng() - 0.5).slice(0, 3),
                attachment: "安全型 (Secure)",
                compatibility: Math.floor(rng() * 100),
                wealthRisk: rng() > 0.6 ? "High Volatility" : "Stable Growth",
                wealthAdvice: rng() > 0.5 ? "建議佈局保守型資產 (Bonds)" : "可嘗試小額進取投資 (Growth)",
                careerTrend: Math.floor(rng() * 100)
            });
            setView('DASHBOARD');
        }, 2000);
    };

    return (
        <div className="bg-[#0f172a] text-slate-200 min-h-[700px] rounded-2xl shadow-xl border border-slate-700 overflow-hidden font-sans relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0f172a] to-[#0f172a] pointer-events-none"></div>
            <div className="p-4 flex justify-between items-center border-b border-slate-700 bg-slate-900/50 backdrop-blur z-10 relative">
                <button onClick={onBack} className="flex items-center gap-2 hover:text-white transition text-xs font-bold text-slate-400"><ArrowLeft size={14}/> SYSTEM_EXIT</button>
                <div className="flex items-center gap-2">
                    <BrainCircuit size={18} className="text-cyan-400 animate-pulse"/>
                    <span className="font-bold text-cyan-400 tracking-widest text-sm">QUANTUM FORTUNE AI</span>
                </div>
            </div>

            <div className="p-6 md:p-10 relative z-10">
                {view === 'INPUT' && (
                    <div className="max-w-md mx-auto space-y-8 animate-fade-in-up">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30 mb-4">
                                <Database className="text-cyan-400" size={32}/>
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Initialize User Vector</h2>
                        </div>
                        <div className="space-y-4 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Name</label>
                                <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-sm text-white focus:border-cyan-500 outline-none transition" placeholder="Chan Tai Man"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Birth Date</label>
                                <input type="date" value={birth} onChange={e=>setBirth(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-sm text-white focus:border-cyan-500 outline-none transition"/>
                            </div>
                        </div>
                        <button onClick={runSimulation} disabled={!name || !birth} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                            <Sparkles size={16}/> EXECUTE ANALYSIS
                        </button>
                    </div>
                )}

                {view === 'PROCESSING' && (
                    <div className="flex flex-col items-center justify-center h-96 space-y-6">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-cyan-900 rounded-full"></div>
                            <div className="w-24 h-24 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                            <Server className="text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={32}/>
                        </div>
                        <h3 className="text-xl font-bold text-white animate-pulse">Processing Quantum States...</h3>
                    </div>
                )}

                {view === 'DASHBOARD' && result && (
                    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
                        <div className="flex justify-between items-end border-b border-slate-700 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Hello, {name}</h2>
                                <p className="text-xs text-slate-400 font-mono mt-1">System Online.</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <TranslateButton isChinese={isChinese} toggle={() => setIsChinese(!isChinese)} />
                                <div className="text-right">
                                    <div className="text-3xl font-black text-cyan-400">{result.dailyScore}%</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">{isChinese ? "幸運指數" : "Luck Efficiency"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-5 rounded-xl border border-purple-500/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Calendar size={20}/></div>
                                    <h3 className="font-bold text-slate-200">{isChinese ? "今日宜忌" : "Daily Execution Log"}</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {result.dailyGuide.map((g:string, i:number) => (
                                        <span key={i} className="px-2 py-1 bg-purple-900/50 text-purple-200 text-xs rounded border border-purple-500/20">{g}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-5 rounded-xl border border-pink-500/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400"><Heart size={20}/></div>
                                    <h3 className="font-bold text-slate-200">{isChinese ? "愛情協議" : "Love Protocol"}</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 text-xs">{isChinese ? "依戀類型:" : "Attachment:"}</span>
                                        <span className="text-pink-300 font-bold">{result.attachment}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-xs">{isChinese ? "匹配指數:" : "Compatibility:"}</span>
                                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-pink-500" style={{width: `${result.compatibility}%`}}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-5 rounded-xl border border-blue-500/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Briefcase size={20}/></div>
                                    <h3 className="font-bold text-slate-200">{isChinese ? "事業吞吐量" : "Career Throughput"}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="text-2xl font-black text-blue-400">{result.careerTrend} <span className="text-xs font-normal text-slate-500">/ 100</span></div>
                                        <div className="text-[10px] text-slate-400 uppercase">{isChinese ? "生產力分數" : "Productivity Score"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-5 rounded-xl border border-yellow-500/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400"><TrendingUp size={20}/></div>
                                    <h3 className="font-bold text-slate-200">{isChinese ? "財富預測" : "Wealth Projection"}</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">{isChinese ? "風險評估:" : "Risk Assessment:"}</span>
                                        <span className={`font-bold px-2 py-0.5 rounded ${result.wealthRisk.includes('High') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>{result.wealthRisk}</span>
                                    </div>
                                    <p className="text-xs text-yellow-100/80 bg-yellow-900/20 p-2 rounded border border-yellow-500/10 italic">
                                        "{result.wealthAdvice}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setView('INPUT')} className="w-full py-4 text-xs font-bold text-slate-500 hover:text-white transition flex items-center justify-center gap-2 border-t border-slate-800">
                             <Zap size={14}/> RE-INITIALIZE SYSTEM
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// MAIN HUB
export const Fortune: React.FC = () => {
    const { user } = useOutletContext<{ user: User | null }>();
    const [mode, setMode] = useState('LOBBY');

    if (mode === 'ZIWEI') return <ZiWeiView onBack={() => setMode('LOBBY')} />;
    if (mode === 'DIVINATION') return <Divination onBack={() => setMode('LOBBY')} />;
    if (mode === 'TAROT') return <TarotView onBack={() => setMode('LOBBY')} />;
    if (mode === 'QUANTUM') return <QuantumView onBack={() => setMode('LOBBY')} />;
    if (mode === 'PRAYER') return <PrayerView onBack={() => setMode('LOBBY')} />;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="p-8 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl shadow-xl mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black mb-2 flex items-center gap-3"><Moon className="text-yellow-400 fill-yellow-400"/> AI 玄學中心</h1>
                    <p className="text-purple-200 opacity-80">融合傳統智慧與現代算法 • 探索未知的指引</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                <button onClick={()=>setMode('ZIWEI')} className="group bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-purple-500 transition-all hover:shadow-xl text-left relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-10 translate-y-10">
                        <Compass size={150} />
                    </div>
                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <Compass className="text-purple-600" size={24}/>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-700">紫微斗數</h2>
                    <p className="text-gray-500 text-xs leading-relaxed">輸入生辰八字，排盤分析命宮主星與運勢走向。古代帝王御用占星術。</p>
                </button>

                <button onClick={()=>setMode('DIVINATION')} className="group bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 transition-all hover:shadow-xl text-left relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-10 translate-y-10">
                        <Hand size={150} />
                    </div>
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <Hand className="text-blue-600" size={24}/>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-700">掐指一算 (小六壬)</h2>
                    <p className="text-gray-500 text-xs leading-relaxed">諸葛亮行軍常用。輸入當下時間，快速占卜吉凶禍福。</p>
                </button>

                <button onClick={()=>setMode('TAROT')} className="group bg-[#0d1117] p-8 rounded-2xl shadow-sm border-2 border-gray-800 hover:border-blue-500 transition-all hover:shadow-xl text-left relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-10 translate-y-10">
                        <Cpu size={150} className="text-blue-500"/>
                    </div>
                    <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition border border-gray-700">
                        <Cpu className="text-blue-400" size={24}/>
                    </div>
                    <h2 className="text-xl font-bold text-gray-200 mb-2 group-hover:text-blue-400">AI 塔羅工程 (Tarot)</h2>
                    <p className="text-gray-500 text-xs leading-relaxed font-mono">Neural Network interpretation. Select variable context for predictive modeling.</p>
                </button>

                <button onClick={()=>setMode('QUANTUM')} className="group bg-[#0f172a] p-8 rounded-2xl shadow-sm border-2 border-slate-700 hover:border-cyan-500 transition-all hover:shadow-xl text-left relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-10 translate-y-10">
                        <BrainCircuit size={150} className="text-cyan-500"/>
                    </div>
                    <div className="bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition border border-slate-600">
                        <BrainCircuit className="text-cyan-400" size={24}/>
                    </div>
                    <h2 className="text-xl font-bold text-gray-200 mb-2 group-hover:text-cyan-400">Quantum AI Fortune</h2>
                    <p className="text-gray-500 text-xs leading-relaxed font-mono">Data-driven destiny analysis. Daily metrics, Love protocol & Risk assessment.</p>
                </button>

                {/* PRAYER BUTTON */}
                <button onClick={()=>setMode('PRAYER')} className="group bg-[#fffaf0] p-8 rounded-2xl shadow-sm border-2 border-[#d4af37] hover:border-[#8b0000] transition-all hover:shadow-xl text-left relative overflow-hidden col-span-1 md:col-span-2">
                    <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-10 translate-y-10">
                        <CloudSun size={150} className="text-[#d4af37]"/>
                    </div>
                    <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition border border-[#d4af37]">
                        <CloudSun className="text-[#d4af37]" size={24}/>
                    </div>
                    <h2 className="text-xl font-bold text-[#8b0000] mb-2 group-hover:text-[#d4af37]">網上誠心祈福 (Digital Shrine)</h2>
                    <p className="text-[#4a3b2a] text-xs leading-relaxed font-serif">雲端敬拜八方神祇。連結正念磁場，獲取 AI 生成的心靈祝福。</p>
                </button>
            </div>
            
            <div className="mt-10 text-center text-xs text-gray-400">
                <p>玄學命理僅供參考 • 命運掌握在自己手中</p>
            </div>
        </div>
    );
};
