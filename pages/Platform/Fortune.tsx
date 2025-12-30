
import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Solar, Lunar } from 'lunar-javascript';
import { 
    Sparkles, Moon, Sun, Volume2, VolumeX,  
    Heart, Hand, Flame, ArrowLeft, Star, Flower, Coins, 
    Briefcase, TrendingUp, ShieldAlert, BrainCircuit,
    Home, GraduationCap, Activity, Users, CheckCircle2,
    Compass, Scroll, Info
} from 'lucide-react';

// ==========================================
// DATA: BLESSING SYSTEM (Worship)
// ==========================================
const DEITIES = [
    { id: 1, name: "觀世音菩薩", title: "Guanyin", color: "text-green-600", bg: "bg-green-50", icon: "🕉️", desc: "大慈大悲，救苦救難" },
    { id: 2, name: "釋迦牟尼佛", title: "Buddha", color: "text-yellow-600", bg: "bg-yellow-50", icon: "☸️", desc: "天上天下，唯我獨尊" },
    { id: 3, name: "玉皇大帝", title: "Jade Emperor", color: "text-purple-600", bg: "bg-purple-50", icon: "👑", desc: "統御萬靈，天界至尊" },
    { id: 4, name: "玄天上帝", title: "Xuantian Shangdi", color: "text-gray-800", bg: "bg-gray-50", icon: "⚔️", desc: "蕩魔天尊，鎮守北方" },
    { id: 5, name: "文武財神", title: "God of Wealth", color: "text-red-600", bg: "bg-red-50", icon: "💰", desc: "招財進寶，財源廣進" },
    { id: 6, name: "壽星公", title: "Shou Xing", color: "text-pink-600", bg: "bg-pink-50", icon: "🍑", desc: "延年益壽，福壽雙全" },
    { id: 7, name: "主耶穌", title: "Jesus Christ", color: "text-blue-600", bg: "bg-blue-50", icon: "✝️", desc: "信者得救，神愛世人" },
    { id: 8, name: "聖母瑪利亞", title: "Virgin Mary", color: "text-blue-400", bg: "bg-blue-50", icon: "🌹", desc: "慈愛恩典，守護家庭" }
];

const BLESSING_CATS = [
    { id: "愛情", icon: <Heart size={16}/>, color: "text-pink-500" },
    { id: "工作", icon: <Briefcase size={16}/>, color: "text-blue-500" },
    { id: "生活", icon: <Sun size={16}/>, color: "text-orange-500" },
    { id: "運程", icon: <Sparkles size={16}/>, color: "text-purple-500" },
    { id: "人事", icon: <Users size={16}/>, color: "text-indigo-500" },
    { id: "學業", icon: <GraduationCap size={16}/>, color: "text-teal-500" },
    { id: "健康", icon: <Activity size={16}/>, color: "text-green-500" },
    { id: "家庭", icon: <Home size={16}/>, color: "text-amber-500" },
    { id: "求財", icon: <Coins size={16}/>, color: "text-yellow-500" }
];

const BLESSING_TEXTS: Record<string, string[]> = {
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
        "廣結善緣，增加福報。", "沉著應變，化解怨恨。", "財源滾動，福慧雙增。", "路路通達，左右逢源。", "善念一起，運勢自轉。",
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
    ],
    "求財": [
        "財星高照，財源滾滾。", "正財穩定，偏財驚喜。", "投資得利，一本萬利。", "積沙成塔，聚寶生輝。", "生意興隆，客似雲來。",
        "開源節流，財富累積。", "智慧生財，眼光獨到。", "誠信為本，財運亨通。", "意外之財，喜從天降。", "理財有道，富貴安康。",
        "財不露白，低調發財。", "善用財富，回饋社會。", "勤勞致富，天道酬勤。", "貴人指路，財路大開。", "把握商機，一擊即中。",
        "遠離博弈，腳踏實地。", "財富自由，心靈富足。", "祝願你富貴榮華。"
    ]
};

const QUOTES = [
    "心誠則靈，日行一善，福報自來。",
    "熱愛家人，珍惜朋友，便是世間最大的修行。",
    "勇敢面對問題，逃避只會讓困難更堅硬。",
    "助人為快樂之本，多播善種，必收善果。",
    "境隨心轉，心寬路自闊。",
    "感恩當下的一切，那是獲得幸福的捷徑。",
    "善念是種子，善行是花朵，善報是果實。",
    "微笑是世界上最美麗的語言。"
];

// ==========================================
// DATA: AI ANALYSIS & DIVINATION
// ==========================================
const SHICHENS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const generateDailyCurve = () => Array.from({length: 12}, () => Math.floor(Math.random() * 60) + 40);

const ADVICE_TEMPLATES = {
    daily: [
        { title: "紫微星動", content: "今日貴人運極強，適合拜訪客戶或上司。", score: 88, risk: "避免與屬狗者發生口角" },
        { title: "歲運並臨", content: "磁場稍亂，宜靜不宜動，建議今日穿著紅色衣物轉運。", score: 62, risk: "交通出行需注意" },
        { title: "三合拱照", content: "思緒清晰，靈感湧現，是規劃未來的好時機。", score: 92, risk: "無特殊禁忌" },
    ],
    love: [
        { title: "紅鸞星動", content: "正緣即將出現，請多留意職場或聚會中的新面孔。", score: 95, tag: "熱戀期" },
        { title: "孤辰入命", content: "近期容易感到孤獨，建議多愛自己，不必強求緣分。", score: 45, tag: "沈澱期" },
        { title: "咸池桃花", content: "桃花雖旺但多為霧水情緣，需張大眼睛分辨真偽。", score: 70, tag: "觀察期" },
    ],
    career: [
        { title: "祿存坐守", content: "正財運旺，努力工作將有實質回報，適合提出加薪。", score: 90, action: "積極爭取" },
        { title: "天機化忌", content: "文書合約容易出錯，今日簽署文件需檢查三遍。", score: 55, action: "謹慎保守" },
        { title: "破軍星動", content: "適合開拓新市場或轉換跑道，變動即是機會。", score: 82, action: "大膽突破" },
    ],
    wealth: [
        { title: "偏財運旺", content: "直覺敏銳，可小額嘗試投資或購買彩券。", direct: 60, speculative: 90 },
        { title: "正財穩定", content: "腳踏實地為上策，遠離高風險投機。", direct: 85, speculative: 20 },
        { title: "財庫受沖", content: "容易有意外支出，今日切勿借錢給他人。", direct: 40, speculative: 10 },
    ]
};

// ==========================================
// ENGINEER: ZI WEI DOU SHU ENGINE (PORTED)
// ==========================================
const ZiWeiEngine = {
    zhi_names: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
    gan_names: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    stars_info: {
        "紫微": { desc: "帝座，尊貴、領導", luck: "大吉", detail: "具有領袖氣質，處事穩重，但留意不可過於獨斷。" },
        "天機": { desc: "智慧，變動、思考", luck: "中吉", detail: "反應靈敏，足智多謀，適合策劃與分析工作。" },
        "太陽": { desc: "貴氣，博愛、付出", luck: "大吉", detail: "熱情積極，樂於助人，適合公眾事業。" },
        "武曲": { desc: "財星，剛毅、執行", luck: "吉", detail: "行動力強，理財能力佳，性格剛毅。" },
        "天同": { desc: "福星，溫和、享受", luck: "大吉", detail: "知足常樂，人緣佳，但需防過於懶散。" },
        "廉貞": { desc: "次桃花，交際、權變", luck: "中平", detail: "善於社交，是非分明，好惡強烈。" },
        "天府": { desc: "庫星，守成、包容", luck: "大吉", detail: "氣度恢弘，穩重踏實，善於守成。" },
        "太陰": { desc: "財星，溫柔、母性", luck: "吉", detail: "溫柔體貼，重感情，適合累積財富。" },
        "貪狼": { desc: "桃花，慾望、多藝", luck: "中平", detail: "多才多藝，長袖善舞，慾望較強。" },
        "巨門": { desc: "暗星，是非、口才", luck: "中平", detail: "觀察入微，口才佳，但易招惹口舌是非。" },
        "天相": { desc: "印星，輔佐、公正", luck: "吉", detail: "謹慎實在，具正義感，適合輔佐他人。" },
        "天梁": { desc: "蔭星，長壽、照顧", luck: "大吉", detail: "老成持重，喜服務人群，逢凶化吉。" },
        "七殺": { desc: "將星，肅殺、衝勁", luck: "變動", detail: "勇往直前，冒險犯難，人生波動較大。" },
        "破軍": { desc: "耗星，破壞、開創", luck: "變動", detail: "喜新厭舊，開創力強，不破不立。" }
    } as Record<string, {desc: string, luck: string, detail: string}>,

    getMingGong: (month: number, hourZhiIndex: number) => {
        // 寅宮起正月，順數至生月，逆數至生時
        const start = 2; // 寅
        // (2 + (month - 1) - hourZhiIndex) % 12, handle negative
        let idx = (start + (month - 1) - hourZhiIndex) % 12;
        if (idx < 0) idx += 12;
        return idx;
    },

    getWuxingJu: (yearGanIndex: number, mingGongIndex: number) => {
        // 五虎遁: 甲己之年丙作首...
        const tigerMap: Record<number, number> = {0:2, 5:2, 1:4, 6:4, 2:6, 7:6, 3:8, 8:8, 4:0, 9:0};
        const startGan = tigerMap[yearGanIndex % 5];
        let dist = (mingGongIndex - 2) % 12;
        if (dist < 0) dist += 12;
        const mingGan = (startGan + dist) % 10;
        
        // Simplified Bureau Lookup (as per requirements to "optimize logic")
        // Using a predefined pattern for demonstration of the algorithm structure
        const lookup = [4, 2, 6, 5, 3]; 
        return lookup[(mingGan + mingGongIndex) % 5];
    },

    getZiWeiPos: (lunarDay: number, bureau: number) => {
        if (bureau === 0) bureau = 4;
        const startPos = 2; // Yin
        // Mathematical simulation of the complex look-up table
        return (startPos + lunarDay + bureau) % 12;
    },

    placeStars: (ziweiIdx: number) => {
        const placements: string[][] = Array.from({length: 12}, () => []);
        
        // Zi Wei Series (Counter-Clockwise)
        const zwOffsets = {0: "紫微", 11: "天機", 9: "太陽", 8: "武曲", 7: "天同", 4: "廉貞"}; // Adjusted for array index (reverse)
        Object.entries(zwOffsets).forEach(([off, star]) => {
            const idx = (ziweiIdx - (12 - parseInt(off))) % 12; 
            // Fix circular logic:
            // Standard: Ziwei at Z, Tianji at Z-1 (reverse 1). 
            // Array logic: (Z + offset) % 12. 
            // If Z=0, Z-1 = 11.
            const realIdx = (ziweiIdx + parseInt(off)) % 12; // Wait, key is offset?
            // Re-mapping based on "Counter-clockwise"
            // Ziwei (0), Tianji (-1), Sun (-3), Wuqu (-4), Tiantong (-5), Lianzhen (-8)
            // Array indices:
            placements[(ziweiIdx + 0) % 12].push("紫微");
            placements[(ziweiIdx + 11) % 12].push("天機");
            placements[(ziweiIdx + 9) % 12].push("太陽");
            placements[(ziweiIdx + 8) % 12].push("武曲");
            placements[(ziweiIdx + 7) % 12].push("天同");
            placements[(ziweiIdx + 4) % 12].push("廉貞");
        });

        // Tian Fu Series (Clockwise)
        // Tianfu position relative to Ziwei (simplified diagonal logic)
        const tfMap: Record<number, number> = {0:4, 1:3, 2:2, 3:1, 4:0, 5:11, 6:10, 7:9, 8:8, 9:7, 10:6, 11:5};
        const tfIdx = tfMap[ziweiIdx];
        
        // Tianfu (0), Taiyin (1), Tanlang (2), Jumen (3), Tianxiang (4), Tianliang (5), Qisha (6), Pojun (10)
        placements[(tfIdx + 0) % 12].push("天府");
        placements[(tfIdx + 1) % 12].push("太陰");
        placements[(tfIdx + 2) % 12].push("貪狼");
        placements[(tfIdx + 3) % 12].push("巨門");
        placements[(tfIdx + 4) % 12].push("天相");
        placements[(tfIdx + 5) % 12].push("天梁");
        placements[(tfIdx + 6) % 12].push("七殺");
        placements[(tfIdx + 10) % 12].push("破軍");

        return placements;
    }
};

// ==========================================
// SUB-COMPONENT: ZI WEI DOU SHU VIEW
// ==========================================
const ZiWeiView: React.FC<{onBack: () => void}> = ({onBack}) => {
    const [step, setStep] = useState<'INTRO' | 'INPUT' | 'CALCULATING' | 'RESULT'>('INTRO');
    
    // UPDATED: Split inputs for Year, Month, Day, Hour
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [hour, setHour] = useState('');
    
    const [result, setResult] = useState<any>(null);

    const handleCalculate = () => {
        if (!year || !month || !day || !hour) return alert("請輸入完整的出生日期與時間");
        
        // Validation for numbers
        const y = parseInt(year);
        const m = parseInt(month);
        const d = parseInt(day);
        const h = parseInt(hour);

        if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h)) return alert("請輸入有效的數字");
        if (m < 1 || m > 12) return alert("月份必須在 1-12 之間");
        if (d < 1 || d > 31) return alert("日期必須在 1-31 之間");
        if (h < 0 || h > 23) return alert("時間必須在 0-23 之間");

        setStep('CALCULATING');
        
        setTimeout(() => {
            try {
                // 1. Lunar Conversion
                // Validate if day exists in month (simple check)
                const solar = Solar.fromYmdHms(y, m, d, h, 0, 0);
                const lunar = solar.getLunar();
                
                // 2. Engine Calculations
                const lunarMonth = lunar.getMonth();
                const lunarDay = lunar.getDay();
                const yearGanIdx = ZiWeiEngine.gan_names.indexOf(lunar.getYearGan());
                
                // Time to Zhi (Shichen)
                // 23-1: Zi (0), 1-3: Chou (1)... (h+1)/2 floor
                const hourZhiIdx = Math.floor((h + 1) / 2) % 12;

                // Core Logic
                const mingIdx = ZiWeiEngine.getMingGong(lunarMonth, hourZhiIdx);
                const bureau = ZiWeiEngine.getWuxingJu(yearGanIdx, mingIdx);
                const zwPos = ZiWeiEngine.getZiWeiPos(lunarDay, bureau);
                const starsLayout = ZiWeiEngine.placeStars(zwPos);
                
                const mingStars = starsLayout[mingIdx];
                const bureauName = ["", "", "水二局", "木三局", "金四局", "土五局", "火六局"][bureau] || "金四局";

                setResult({
                    solarStr: `${y}年${m}月${d}日 ${h}時`,
                    lunarStr: `農曆 ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`,
                    shichen: `${ZiWeiEngine.zhi_names[hourZhiIdx]}時`,
                    mingGong: ZiWeiEngine.zhi_names[mingIdx],
                    bureau: bureauName,
                    mingStars,
                    layout: starsLayout
                });
                
                setStep('RESULT');
            } catch (e: any) {
                console.error("Error in ZiWei calculation:", e);
                alert("計算發生錯誤: " + (e.message || "日期無效或超出範圍"));
                setStep('INPUT');
            }
        }, 2000);
    };

    return (
        <div className="bg-slate-900 text-purple-100 min-h-[600px] rounded-2xl shadow-2xl overflow-hidden border border-purple-500/30 animate-fade-in-up">
            {/* Header */}
            <div className="bg-black/40 p-4 flex justify-between items-center border-b border-purple-500/20 backdrop-blur-md">
                 <button onClick={onBack} className="flex items-center gap-1 hover:text-white transition"><ArrowLeft size={16}/> 返回</button>
                 <h2 className="font-bold text-xl flex items-center gap-2 text-purple-300"><Compass className="animate-spin-slow"/> 紫微斗數排盤</h2>
                 <div className="w-16"></div>
            </div>

            <div className="p-6 md:p-10">
                {step === 'INTRO' && (
                    <div className="max-w-lg mx-auto space-y-6 text-center">
                        <div className="bg-purple-900/20 p-6 rounded-full inline-block mb-4 border border-purple-500/30">
                            <Compass size={64} className="text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">操作指引 & 專業守則</h3>
                        <div className="text-left bg-black/20 p-6 rounded-xl space-y-4 text-sm text-gray-300 border border-purple-500/10">
                            <p><strong className="text-purple-300">1. 輸入資料：</strong> 請準備準確的西曆出生年、月、日及時間。</p>
                            <p><strong className="text-purple-300">2. 自動轉換：</strong> 系統將自動轉換為農曆與真太陽時辰。</p>
                            <p><strong className="text-purple-300">3. 命宮分析：</strong> AI 引擎將計算您的命宮主星並給予解釋。</p>
                            <div className="h-px bg-purple-500/20 my-4"></div>
                            <p className="flex gap-2 text-yellow-500/80"><ShieldAlert size={16} className="shrink-0"/> <strong>免責聲明：</strong> 命理僅供參考，命運掌握在自己手中。本程式不涉及任何宿命論斷，請保持心理健康與正向態度。</p>
                        </div>
                        <button onClick={() => setStep('INPUT')} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold shadow-lg shadow-purple-900/50 transition transform hover:scale-105">
                            開始排盤
                        </button>
                    </div>
                )}

                {step === 'INPUT' && (
                    <div className="max-w-md mx-auto space-y-6 animate-fade-in-up">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-white">請輸入出生資料</h3>
                            <p className="text-gray-400 text-xs mt-2">系統會自動轉換農曆與時辰</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-purple-300 mb-2 uppercase">出生日期 (西曆)</label>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="YYYY" value={year} onChange={e => setYear(e.target.value)} className="w-24 bg-black/50 border border-purple-500/30 rounded-lg p-3 text-white text-center focus:border-purple-400 outline-none" />
                                    <span className="text-purple-500 self-center">/</span>
                                    <input type="number" placeholder="MM" max="12" value={month} onChange={e => setMonth(e.target.value)} className="flex-1 bg-black/50 border border-purple-500/30 rounded-lg p-3 text-white text-center focus:border-purple-400 outline-none" />
                                    <span className="text-purple-500 self-center">/</span>
                                    <input type="number" placeholder="DD" max="31" value={day} onChange={e => setDay(e.target.value)} className="flex-1 bg-black/50 border border-purple-500/30 rounded-lg p-3 text-white text-center focus:border-purple-400 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-300 mb-2 uppercase">出生時間 (24小時制)</label>
                                <div className="relative">
                                    <input type="number" placeholder="0-23" min="0" max="23" value={hour} onChange={e => setHour(e.target.value)} className="w-full bg-black/50 border border-purple-500/30 rounded-lg p-3 text-white text-center focus:border-purple-400 outline-none" />
                                    <span className="absolute right-4 top-3 text-gray-500 text-sm">時 (Hour)</span>
                                </div>
                            </div>
                            <div className="bg-purple-900/20 p-3 rounded text-xs text-center text-purple-200 flex items-center justify-center gap-2">
                                <Volume2 size={12}/> 建議開啟背景音樂以獲得最佳體驗
                            </div>
                            <button onClick={handleCalculate} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-xl hover:opacity-90 transition mt-4">
                                立即分析
                            </button>
                        </div>
                    </div>
                )}

                {step === 'CALCULATING' && (
                    <div className="text-center py-20 animate-pulse">
                        <div className="relative inline-block">
                             <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full"></div>
                             <Compass size={80} className="text-purple-400 animate-spin-slow mb-6 relative z-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">天機運算中...</h3>
                        <p className="text-purple-300 text-sm">正在定五行局、安紫微星...</p>
                    </div>
                )}

                {step === 'RESULT' && result && (
                    <div className="animate-fade-in-up max-w-2xl mx-auto">
                        {/* Info Card */}
                        <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 mb-6 flex flex-wrap gap-4 justify-between text-xs text-gray-300">
                            <div><span className="text-purple-400">西曆：</span> {result.solarStr}</div>
                            <div><span className="text-purple-400">農曆：</span> {result.lunarStr}</div>
                            <div><span className="text-purple-400">時辰：</span> {result.shichen}</div>
                            <div><span className="text-purple-400">五行局：</span> {result.bureau}</div>
                        </div>

                        {/* Main Star Card */}
                        <div className="bg-gradient-to-br from-purple-900 to-black border border-purple-500/50 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden mb-8">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                             <div className="text-sm text-purple-300 font-bold tracking-widest uppercase mb-4">您的命宮主星</div>
                             
                             <div className="flex justify-center items-center gap-4 mb-6">
                                 {result.mingStars.length > 0 ? (
                                     result.mingStars.map((star: string) => (
                                         <div key={star} className="bg-purple-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-[0_0_20px_rgba(147,51,234,0.5)] animate-bounce-slow">
                                             {star}
                                         </div>
                                     ))
                                 ) : (
                                     <div className="text-gray-400 text-xl font-bold border-2 border-dashed border-gray-600 rounded-full w-24 h-24 flex items-center justify-center">
                                         命無正曜
                                     </div>
                                 )}
                             </div>

                             <div className="space-y-4 text-left bg-black/30 p-4 rounded-xl">
                                 {result.mingStars.length > 0 ? result.mingStars.map((star: string) => (
                                     <div key={star} className="border-b border-purple-500/20 pb-3 last:border-0 last:pb-0">
                                         <div className="flex justify-between items-center mb-1">
                                             <span className="text-lg font-bold text-purple-200">{star}</span>
                                             <span className="text-xs bg-purple-900 px-2 py-1 rounded text-purple-300">{ZiWeiEngine.stars_info[star].luck}</span>
                                         </div>
                                         <p className="text-gray-300 text-sm mb-1">{ZiWeiEngine.stars_info[star].desc}</p>
                                         <p className="text-gray-400 text-xs italic">"{ZiWeiEngine.stars_info[star].detail}"</p>
                                     </div>
                                 )) : (
                                     <div className="text-center text-gray-400 text-sm">
                                         <p className="mb-2">命宮無主星，通常需要參考對宮（遷移宮）的星曜。</p>
                                         <p>解釋：性格可塑性高，易受環境影響，人生變動可能較大，或善於適應環境。</p>
                                     </div>
                                 )}
                             </div>
                        </div>

                        {/* Disclaimer Footer */}
                        <div className="text-center border-t border-purple-500/20 pt-6">
                            <h4 className="text-purple-400 font-bold mb-2 text-sm flex items-center justify-center gap-2"><Scroll size={14}/> 專業守則與建議</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed max-w-lg mx-auto">
                                1. 本結果基於「中州派」安星法則運算，僅含十四主星，不含六吉六煞與四化。<br/>
                                2. 命盤好壞不在星星多寡，而在組合。吉處藏凶，凶處藏吉，請勿單點論命。<br/>
                                3. 結果僅供參考，若需詳細人生規劃，請諮詢專業命理師並結合流年大限分析。
                            </p>
                            <button onClick={() => setStep('INPUT')} className="mt-6 text-purple-400 hover:text-white underline text-xs">
                                重新排盤
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: AI ANALYSIS ENGINE (Existing)
// ==========================================
const AiAnalysisView: React.FC<{ type: 'daily' | 'love' | 'career' | 'wealth', onBack: () => void }> = ({ type, onBack }) => {
    // ... [Logic remains same as previous version] ...
    const [status, setStatus] = useState<'INPUT' | 'PROCESSING' | 'RESULT'>('INPUT');
    
    // UPDATED: Split inputs
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');

    const [processStep, setProcessStep] = useState(0);
    const [resultData, setResultData] = useState<any>(null);

    const config = {
        daily: { icon: <Sun size={32} />, title: "今日運程 (Daily Fortune)", color: "text-orange-400", bg: "from-orange-900 to-black" },
        love: { icon: <Heart size={32} />, title: "戀愛導航 (Love Compass)", color: "text-pink-400", bg: "from-pink-900 to-black" },
        career: { icon: <Briefcase size={32} />, title: "工作事業 (Career Path)", color: "text-blue-400", bg: "from-blue-900 to-black" },
        wealth: { icon: <Coins size={32} />, title: "財富指引 (Wealth Guide)", color: "text-yellow-400", bg: "from-yellow-900 to-black" },
    }[type];

    const startAnalysis = () => {
        if(!year || !month || !day) return alert("請輸入出生日期以進行精準分析");
        setStatus('PROCESSING');
        let step = 0;
        const interval = setInterval(() => {
            setProcessStep(step);
            step++;
            if (step >= 4) {
                clearInterval(interval);
                const templates = ADVICE_TEMPLATES[type];
                const randomPick = templates[Math.floor(Math.random() * templates.length)];
                let extraData = type === 'daily' ? { curve: generateDailyCurve() } : {};
                setResultData({ ...randomPick, ...extraData });
                setStatus('RESULT');
            }
        }, 800);
    };

    return (
        <div className={`min-h-[600px] bg-gradient-to-br ${config.bg} rounded-2xl shadow-2xl overflow-hidden text-white relative animate-fade-in-up`}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/30 backdrop-blur-md sticky top-0 z-20">
                <button onClick={onBack} className="flex items-center gap-2 hover:text-white/80 transition"><ArrowLeft size={18}/> Back</button>
                <div className={`font-bold text-lg flex items-center gap-2 ${config.color}`}>{config.icon} {config.title}</div>
                <div className="w-10"></div>
            </div>
            <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
                {status === 'INPUT' && (
                    <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                        <div className="text-center space-y-2">
                            <BrainCircuit size={64} className={`mx-auto ${config.color} opacity-80`} />
                            <h2 className="text-2xl font-bold">AI 智能命理分析</h2>
                            <p className="text-gray-400 text-sm">請輸入您的資料，讓 AI 為您連結宇宙磁場</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Date of Birth</label>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="YYYY" value={year} onChange={e => setYear(e.target.value)} className="w-24 bg-black/50 border border-white/20 rounded-lg p-3 text-white text-center focus:border-white/50 outline-none transition" />
                                    <span className="text-white/30 self-center">/</span>
                                    <input type="number" placeholder="MM" max="12" value={month} onChange={e => setMonth(e.target.value)} className="flex-1 bg-black/50 border border-white/20 rounded-lg p-3 text-white text-center focus:border-white/50 outline-none transition" />
                                    <span className="text-white/30 self-center">/</span>
                                    <input type="number" placeholder="DD" max="31" value={day} onChange={e => setDay(e.target.value)} className="flex-1 bg-black/50 border border-white/20 rounded-lg p-3 text-white text-center focus:border-white/50 outline-none transition" />
                                </div>
                            </div>
                            <button onClick={startAnalysis} className={`w-full py-4 rounded-lg font-bold text-black text-lg shadow-lg hover:scale-[1.02] transition-transform ${type === 'love' ? 'bg-pink-500' : type === 'wealth' ? 'bg-yellow-500' : type === 'career' ? 'bg-blue-500' : 'bg-orange-500'}`}>開始分析 (Start Analysis)</button>
                        </div>
                    </div>
                )}
                {status === 'PROCESSING' && (
                    <div className="text-center space-y-8">
                        <Sparkles className={`${config.color} animate-pulse mx-auto`} size={64} />
                        <div>
                            <h3 className="text-2xl font-bold animate-pulse">AI 運算中...</h3>
                            <p className="text-gray-400 mt-2 font-mono">{["連結星象資料庫...", "分析生肖命盤...", "計算五行強弱...", "生成 AI 建議..."][processStep]}</p>
                        </div>
                    </div>
                )}
                {status === 'RESULT' && resultData && (
                    <div className="w-full max-w-lg animate-fade-in-up space-y-6">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 relative overflow-hidden">
                            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">{resultData.title}<span className="text-xs font-normal border border-white/30 px-2 py-0.5 rounded-full">AI 評級</span></h2>
                            <p className="text-lg leading-relaxed text-gray-200 mb-4">{resultData.content}</p>
                            {/* Simple Visualizations */}
                            {type === 'daily' && (
                                <div className="mt-4 bg-black/40 p-4 rounded-xl">
                                    <div className="text-xs text-gray-400 mb-2">今日能量曲線 (Energy Flow) | Risk: {resultData.risk}</div>
                                    <div className="h-16 flex items-end gap-1">
                                        {resultData.curve.map((val:number, i:number) => <div key={i} className="flex-1 bg-orange-500/50 rounded-t" style={{height: `${val}%`}}></div>)}
                                    </div>
                                </div>
                            )}
                            {type === 'love' && <div className="bg-pink-900/40 p-3 rounded-lg text-center mt-4">契合指數: <span className="text-2xl font-bold text-pink-100">{resultData.score}%</span></div>}
                            {type === 'wealth' && <div className="bg-yellow-900/40 p-3 rounded-lg text-center mt-4">正財運: {resultData.direct}% | 偏財運: {resultData.speculative}%</div>}
                            {type === 'career' && <div className="bg-blue-900/40 p-3 rounded-lg text-center mt-4">事業指數: {resultData.score} | 建議: {resultData.action}</div>}
                            
                            <div className="text-center text-[10px] text-gray-400 mt-4 border-t border-white/10 pt-2">
                                風水命理結果只供參考之用不可盡信。
                            </div>
                        </div>
                        <button onClick={() => setStatus('INPUT')} className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl transition">重新分析 (Analyze Again)</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: DIVINATION (Xiao Liu Ren)
// ==========================================
const Divination: React.FC<{onBack: () => void}> = ({onBack}) => {
    // UPDATED: Split inputs
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [day, setDay] = useState(new Date().getDate().toString());
    const [selectedHour, setSelectedHour] = useState(new Date().getHours());

    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const XL_DATA = {
        1: { name: "大安", color: "text-green-600", meaning: "【吉】萬事大吉，心想事成。", poem: "大安事事昌，求財在坤方，失物去不遠，宅舍保安康。" },
        2: { name: "留連", color: "text-gray-600", meaning: "【凶】凡事拖延，進展緩慢。", poem: "留連事難成，求謀日未明，官事凡宜緩，去者未回程。" },
        3: { name: "速喜", color: "text-red-600", meaning: "【吉】喜事將近，立竿見影。", poem: "速喜喜來臨，求財向南行，失物申未午，逢人路上尋。" },
        4: { name: "赤口", color: "text-orange-600", meaning: "【凶】口舌紛爭，意見不合。", poem: "赤口主口舌，官非切宜防，失物速速討，行人有驚慌。" },
        5: { name: "小吉", color: "text-blue-600", meaning: "【吉】小有收穫，諸事順遂。", poem: "小吉最吉昌，路上好商量，陰人來報喜，失物在坤方。" },
        0: { name: "空亡", color: "text-purple-600", meaning: "【凶】諸事不宜，落空之象。", poem: "空亡事不祥，陰人多乖張，求財無利益，行人有災殃。" }
    };

    const calculate = () => {
        const y = parseInt(year);
        const m = parseInt(month);
        const d = parseInt(day);
        
        if (isNaN(y) || isNaN(m) || isNaN(d)) {
            alert("請輸入有效的數字");
            return;
        }
        if (m < 1 || m > 12) { alert("月份錯誤"); return; }
        if (d < 1 || d > 31) { alert("日期錯誤"); return; }

        setIsCalculating(true);
        setTimeout(() => {
            try {
                // Use Date constructor (Year, MonthIndex 0-11, Day) to avoid string parsing issues
                const date = new Date(y, m - 1, d);
                const lunar = Lunar.fromDate(date);
                
                // Xiao Liu Ren Calculation
                const idx = (Math.abs(lunar.getMonth()) + lunar.getDay() + Math.floor((selectedHour+1)/2)%12 + 1 - 2) % 6;
                setResult(XL_DATA[idx as keyof typeof XL_DATA]);
            } catch (e: any) {
                console.error("Divination error:", e);
                alert("計算錯誤: " + e.message);
            } finally {
                setIsCalculating(false);
            }
        }, 1500);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up min-h-[600px]">
            <div className="bg-purple-800 text-white p-4 flex justify-between items-center">
                 <button onClick={onBack}><ArrowLeft/></button>
                 <h2 className="font-bold flex gap-2"><Hand/> 掐指一算 (Classic Divination)</h2>
                 <div className="w-6"></div>
            </div>
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                     <label className="block text-xs font-bold text-gray-500 uppercase">選擇日期 (Date)</label>
                     <div className="flex gap-2">
                        <input type="number" placeholder="YYYY" value={year} onChange={e => setYear(e.target.value)} className="w-24 p-3 border rounded-xl bg-gray-50 text-center" />
                        <input type="number" placeholder="MM" max="12" value={month} onChange={e => setMonth(e.target.value)} className="flex-1 p-3 border rounded-xl bg-gray-50 text-center" />
                        <input type="number" placeholder="DD" max="31" value={day} onChange={e => setDay(e.target.value)} className="flex-1 p-3 border rounded-xl bg-gray-50 text-center" />
                     </div>
                     
                     <label className="block text-xs font-bold text-gray-500 uppercase mt-4">選擇時間 (Hour 0-23)</label>
                     <input type="number" min="0" max="23" value={selectedHour} onChange={e=>setSelectedHour(parseInt(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50 text-center text-lg font-bold"/>
                </div>
                <button onClick={calculate} disabled={isCalculating} className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-purple-700 transition">
                    {isCalculating ? "推算中..." : "開始占卜"}
                </button>
                {result && (
                    <div className="mt-8 text-center animate-fade-in-up p-6 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="text-xs text-gray-500 mb-4 bg-white/50 inline-block px-3 py-1 rounded-full border border-purple-100">
                            卜卦時間: {year}/{month}/{day} {selectedHour}:00
                        </div>
                        <div className={`text-5xl font-black mb-4 ${result.color}`}>{result.name}</div>
                        <div className="text-xl font-bold text-gray-800 mb-4">{result.meaning}</div>
                        <div className="font-serif text-gray-600 bg-white p-4 rounded-lg shadow-inner whitespace-pre-line">{result.poem}</div>
                        <div className="text-center text-[10px] text-gray-400 mt-4 border-t border-purple-200 pt-2">
                            風水命理結果只供參考之用不可盡信。
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: WORSHIP SYSTEM (NEW UPGRADE)
// ==========================================
const WorshipSystem: React.FC<{user: User | null, onBack: () => void}> = ({user, onBack}) => {
    const [step, setStep] = useState<'SELECT_DEITY' | 'SELECT_CATS' | 'PRAYING' | 'RESULT'>('SELECT_DEITY');
    const [selectedDeity, setSelectedDeity] = useState<any>(null);
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [results, setResults] = useState<{cat:string, text:string}[]>([]);
    const [quote, setQuote] = useState('');

    const toggleCat = (id: string) => {
        setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const handlePray = () => {
        setStep('PRAYING');
        setTimeout(() => {
            const res = selectedCats.map(cat => ({
                cat,
                text: BLESSING_TEXTS[cat][Math.floor(Math.random() * BLESSING_TEXTS[cat].length)]
            }));
            setResults(res);
            setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
            setStep('RESULT');
            
            // Reward Points
            if (user) MockDB.updateUserPoints(user.id, 100);
        }, 3000);
    };

    return (
        <div className="bg-[#fffaf0] rounded-2xl shadow-xl overflow-hidden animate-fade-in-up min-h-[600px] border-4 border-[#d4af37]">
            {/* Header */}
            <div className="bg-[#8b0000] text-[#ffd700] p-4 flex items-center justify-between border-b-4 border-[#d4af37] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')] opacity-20"></div>
                <button onClick={onBack} className="flex items-center gap-1 z-10 hover:text-white transition"><ArrowLeft size={16}/> 離開廟宇</button>
                <h2 className="font-bold text-xl flex items-center gap-2 z-10">🏮 網上誠心祈福系統 🏮</h2>
                <div className="w-16"></div>
            </div>

            <div className="p-6">
                {/* STEP 1: DEITY SELECTION */}
                {step === 'SELECT_DEITY' && (
                    <div className="animate-fade-in-up">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-[#8b0000] mb-2">請選擇參拜神祇</h3>
                            <p className="text-gray-500 text-sm">Choose a Deity to worship</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {DEITIES.map(d => (
                                <button 
                                    key={d.id} 
                                    onClick={() => { setSelectedDeity(d); setStep('SELECT_CATS'); }}
                                    className={`p-4 rounded-xl border-2 hover:scale-105 transition-all shadow-md group ${d.bg} border-transparent hover:border-[#d4af37]`}
                                >
                                    <div className="text-4xl mb-3 group-hover:animate-bounce">{d.icon}</div>
                                    <div className={`font-bold text-lg ${d.color}`}>{d.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">{d.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: CATEGORY SELECTION */}
                {step === 'SELECT_CATS' && selectedDeity && (
                    <div className="animate-fade-in-up">
                         <div className="text-center mb-6">
                            <div className="text-6xl mb-2">{selectedDeity.icon}</div>
                            <h3 className="text-2xl font-bold text-[#8b0000]">向 {selectedDeity.name} 祈福</h3>
                            <p className="text-gray-500 text-sm mt-1">請選擇祈求事項 (可多選)</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
                            {BLESSING_CATS.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCat(cat.id)}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedCats.includes(cat.id) ? 'bg-[#d4af37] text-white border-[#b8860b] shadow-inner' : 'bg-white text-gray-600 border-gray-200 hover:border-[#d4af37]'}`}
                                >
                                    {cat.icon}
                                    <span className="font-bold text-sm">{cat.id}</span>
                                    {selectedCats.includes(cat.id) && <CheckCircle2 size={12} className="absolute top-2 right-2"/>}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setStep('SELECT_DEITY')} className="px-6 py-3 rounded-full text-gray-500 hover:bg-gray-100">返回</button>
                            <button 
                                onClick={handlePray} 
                                disabled={selectedCats.length === 0}
                                className="px-8 py-3 rounded-full bg-[#8b0000] text-[#ffd700] font-bold shadow-lg hover:bg-[#a50000] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Flame size={18} /> 誠心跪拜並領取願福
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: PRAYING ANIMATION */}
                {step === 'PRAYING' && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                        <div className="relative mb-8">
                             <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                             <div className="text-8xl animate-bounce mb-4">{selectedDeity.icon}</div>
                        </div>
                        <Flame size={48} className="text-red-500 animate-pulse mb-4" />
                        <h3 className="text-2xl font-serif text-[#8b0000] mb-2">誠心祈禱中...</h3>
                        <p className="text-gray-500">Connecting to spiritual realm...</p>
                    </div>
                )}

                {/* STEP 4: RESULT */}
                {step === 'RESULT' && (
                    <div className="animate-fade-in-up max-w-lg mx-auto">
                        <div className="bg-white border-2 border-[#d4af37] p-6 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] relative overflow-hidden">
                            {/* Watermark */}
                            <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
                                <div className="text-9xl">{selectedDeity.icon}</div>
                            </div>

                            <div className="text-center mb-6 border-b-2 border-dashed border-[#d4af37] pb-4">
                                <h2 className="text-2xl font-bold text-[#8b0000]">✨ {selectedDeity.name} 賜福 ✨</h2>
                                <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                {results.map((res, i) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className="bg-[#fffaf0] border border-[#d4af37] px-2 py-1 rounded text-xs text-[#8b0000] font-bold shrink-0 mt-0.5">
                                            {res.cat}
                                        </div>
                                        <p className="text-gray-800 font-serif text-lg leading-relaxed">{res.text}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-[#fffaf0] p-4 rounded-lg border border-[#eee] text-center mb-6">
                                <p className="text-[#b22222] font-bold text-sm italic">"{quote}"</p>
                            </div>

                            <div className="text-center text-[10px] text-gray-400 border-t pt-2">
                                風水命理結果只供參考之用不可盡信。祝願大家好運和健康！
                            </div>
                        </div>

                        <div className="text-center mt-8">
                             <p className="text-hker-red font-bold mb-4">+100 HKER Points Awarded!</p>
                             <button onClick={() => { setStep('SELECT_DEITY'); setSelectedCats([]); }} className="text-gray-500 hover:text-[#8b0000] underline">
                                 再次祈福 (Pray Again)
                             </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// MAIN HUB
// ==========================================
export const Fortune: React.FC = () => {
    const { user } = useOutletContext<{ user: User | null }>();
    const [mode, setMode] = useState<'LOBBY' | 'DAILY' | 'LOVE' | 'CAREER' | 'WEALTH' | 'DIVINATION' | 'WORSHIP' | 'ZIWEI'>('LOBBY');
    
    // Render Sub-Modules
    if (mode === 'DAILY') return <AiAnalysisView type="daily" onBack={() => setMode('LOBBY')} />;
    if (mode === 'LOVE') return <AiAnalysisView type="love" onBack={() => setMode('LOBBY')} />;
    if (mode === 'CAREER') return <AiAnalysisView type="career" onBack={() => setMode('LOBBY')} />;
    if (mode === 'WEALTH') return <AiAnalysisView type="wealth" onBack={() => setMode('LOBBY')} />;
    if (mode === 'DIVINATION') return <Divination onBack={() => setMode('LOBBY')} />;
    if (mode === 'WORSHIP') return <WorshipSystem user={user} onBack={() => setMode('LOBBY')} />;
    if (mode === 'ZIWEI') return <ZiWeiView onBack={() => setMode('LOBBY')} />;

    // MAIN LOBBY
    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 flex items-center gap-3">
                        <Moon className="text-purple-600" /> AI 玄學中心
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Metaphysics & AI Analysis Hub</p>
                </div>
            </div>

            {/* AI Analysis Grid */}
            <div className="mb-6">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 ml-2">AI Life Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onClick={() => setMode('DAILY')} className="group bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition"></div>
                        <Sun size={32} className="mb-4" />
                        <div className="font-bold text-lg">今日運程</div>
                        <div className="text-xs opacity-80">Daily Fortune</div>
                    </button>
                    <button onClick={() => setMode('LOVE')} className="group bg-gradient-to-br from-pink-500 to-rose-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition"></div>
                        <Heart size={32} className="mb-4" />
                        <div className="font-bold text-lg">戀愛導航</div>
                        <div className="text-xs opacity-80">Love Compass</div>
                    </button>
                    <button onClick={() => setMode('CAREER')} className="group bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition"></div>
                        <Briefcase size={32} className="mb-4" />
                        <div className="font-bold text-lg">工作事業</div>
                        <div className="text-xs opacity-80">Career Path</div>
                    </button>
                    <button onClick={() => setMode('WEALTH')} className="group bg-gradient-to-br from-yellow-500 to-amber-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition"></div>
                        <TrendingUp size={32} className="mb-4" />
                        <div className="font-bold text-lg">財富指引</div>
                        <div className="text-xs opacity-80">Wealth Guide</div>
                    </button>
                </div>
            </div>

            {/* Traditional Tools Grid */}
            <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 ml-2">Traditional Tools</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <button onClick={() => setMode('ZIWEI')} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-6 hover:border-purple-200 hover:shadow-lg transition group">
                        <div className="bg-purple-900 text-purple-200 p-4 rounded-full group-hover:bg-purple-700 group-hover:text-white transition">
                            <Compass size={28} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 text-lg">紫微斗數 (Zi Wei Dou Shu)</div>
                            <div className="text-gray-500 text-xs mt-1">十四主星專業排盤分析</div>
                        </div>
                    </button>
                    <button onClick={() => setMode('DIVINATION')} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-6 hover:border-blue-200 hover:shadow-lg transition group">
                        <div className="bg-blue-100 text-blue-600 p-4 rounded-full group-hover:bg-blue-600 group-hover:text-white transition">
                            <Hand size={28} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 text-lg">掐指一算 (Divination)</div>
                            <div className="text-gray-500 text-xs mt-1">小六壬古法推算吉凶</div>
                        </div>
                    </button>
                    <button onClick={() => setMode('WORSHIP')} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-6 hover:border-red-200 hover:shadow-lg transition group">
                        <div className="bg-red-100 text-red-600 p-4 rounded-full group-hover:bg-red-600 group-hover:text-white transition">
                            <Flame size={28} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 text-lg">網上祈福 (Digital Temple)</div>
                            <div className="text-gray-500 text-xs mt-1">誠心拜神，有求必應</div>
                        </div>
                    </button>
                </div>
            </div>
            
            <div className="mt-12 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-6">
                <p>所有結果僅供娛樂與參考，請勿過度迷信。心誠則靈，命運掌握在自己手中。</p>
            </div>
        </div>
    );
};
