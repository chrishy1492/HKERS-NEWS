import React, { useState } from 'react';
import { 
  Flower2, Scroll, Heart, Briefcase, Sun, 
  Users, BookOpen, Activity, Home, Sparkles, 
  ChevronRight, RefreshCcw, CheckCircle2
} from 'lucide-react';

// --- Data Constants ---
const DEITIES = [
  { id: 'guanyin', name: '觀世音菩薩', title: '觀音', icon: '🌸' },
  { id: 'buddha', name: '釋迦牟尼佛', title: '佛祖', icon: '☸️' },
  { id: 'jade', name: '玉皇大帝', title: '玉皇', icon: '👑' },
  { id: 'xuantian', name: '北極玄天上帝', title: '玄帝', icon: '⚔️' },
  { id: 'wealth', name: '文武財神', title: '財神', icon: '💰' },
  { id: 'shouxing', name: '南極仙翁壽星公', title: '壽星', icon: '🍑' },
  { id: 'jesus', name: '主耶穌', title: '耶穌', icon: '✝️' },
  { id: 'mary', name: '聖母瑪利亞', title: '聖母', icon: '🌹' }
];

const CATEGORIES = [
  { id: '愛情', icon: Heart, color: 'text-pink-400', border: 'border-pink-500' },
  { id: '工作', icon: Briefcase, color: 'text-blue-400', border: 'border-blue-500' },
  { id: '生活', icon: Sun, color: 'text-orange-400', border: 'border-orange-500' },
  { id: '運程', icon: Sparkles, color: 'text-yellow-400', border: 'border-yellow-500' },
  { id: '人事', icon: Users, color: 'text-purple-400', border: 'border-purple-500' },
  { id: '學業', icon: BookOpen, color: 'text-cyan-400', border: 'border-cyan-500' },
  { id: '健康', icon: Activity, color: 'text-green-400', border: 'border-green-500' },
  { id: '家庭', icon: Home, color: 'text-red-400', border: 'border-red-500' },
];

const BLESSING_DATA: Record<string, string[]> = {
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

const QUOTES = [
    "心誠則靈，日行一善，福報自來。",
    "熱愛家人，珍惜朋友，便是世間最大的修行。",
    "勇敢面對問題，逃避只會讓困難更堅硬。",
    "助人為快樂之本，多播善種，必收善果。",
    "境隨心轉，心寬路自闊。",
    "感恩當下的一切，那是獲得幸福的捷徑。"
];

export default function TempleEngine() {
  const [selectedDeity, setSelectedDeity] = useState<typeof DEITIES[0] | null>(null);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'praying' | 'result'>('select');
  const [resultData, setResultData] = useState<{blessings: {cat:string, text:string}[], quote: string} | null>(null);

  const toggleCategory = (catId: string) => {
    if (selectedCats.includes(catId)) {
      setSelectedCats(prev => prev.filter(c => c !== catId));
    } else {
      if (selectedCats.length >= 3) {
        alert("為表誠心，建議每次最多選擇三項祈福。");
        return;
      }
      setSelectedCats(prev => [...prev, catId]);
    }
  };

  const startPrayer = () => {
    if (!selectedDeity) {
      alert("請選擇一位神祇。");
      return;
    }
    if (selectedCats.length === 0) {
      alert("請至少選擇一個祈福事項。");
      return;
    }

    setStep('praying');
    
    // Simulate API/Prayer Time
    setTimeout(() => {
      const blessings = selectedCats.map(cat => {
        const list = BLESSING_DATA[cat];
        const text = list[Math.floor(Math.random() * list.length)];
        return { cat, text };
      });
      const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      
      setResultData({ blessings, quote });
      setStep('result');
    }, 2500);
  };

  const reset = () => {
    setSelectedDeity(null);
    setSelectedCats([]);
    setStep('select');
    setResultData(null);
  };

  return (
    <div className="w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-amber-800/50 text-slate-200 min-h-[600px] flex flex-col">
      
      {/* Header */}
      <div className="bg-slate-900/90 p-4 border-b border-amber-900/50 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-2 text-amber-500 font-bold text-lg">
          <Flower2 className="w-6 h-6" />
          <span>Digital Temple (雲端祈福)</span>
          <span className="text-[10px] bg-amber-900/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-800">v1.0.0</span>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* STEP 1: SELECTION */}
        {step === 'select' && (
          <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
            <div className="text-center space-y-2 mb-8">
               <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
                 誠心祈願 • 有求必應
               </h2>
               <p className="text-slate-400 text-sm">請選擇神祇與祈福項目，系統將為您連結靈界頻率。</p>
            </div>

            {/* Deities Grid */}
            <div className="space-y-3">
               <h3 className="text-amber-400 font-bold flex items-center gap-2">
                 <span className="w-1 h-6 bg-amber-500 rounded-full"></span> 
                 第一步：請選擇神祇 (Select Deity)
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DEITIES.map(deity => (
                    <button
                      key={deity.id}
                      onClick={() => setSelectedDeity(deity)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2
                        ${selectedDeity?.id === deity.id 
                          ? 'bg-amber-900/30 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                          : 'bg-slate-900 border-slate-700 hover:border-amber-700 hover:bg-slate-800'}`}
                    >
                       <div className="text-4xl filter drop-shadow-lg">{deity.icon}</div>
                       <div className="font-bold text-slate-200">{deity.title}</div>
                       <div className="text-[10px] text-slate-500">{deity.name}</div>
                       {selectedDeity?.id === deity.id && (
                         <div className="absolute top-2 right-2 text-amber-500"><CheckCircle2 size={16} /></div>
                       )}
                    </button>
                  ))}
               </div>
            </div>

            {/* Categories Grid */}
            <div className="space-y-3">
               <h3 className="text-amber-400 font-bold flex items-center gap-2">
                 <span className="w-1 h-6 bg-amber-500 rounded-full"></span> 
                 第二步：請選擇祈福事項 (Select Category)
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCats.includes(cat.id);
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 rounded-lg border transition-all flex items-center gap-3
                          ${isSelected ? `bg-slate-800 ${cat.border} ring-1` : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}
                      >
                         <div className={`p-2 rounded-full bg-slate-950 ${isSelected ? cat.color : 'text-slate-500'}`}>
                           <Icon size={18} />
                         </div>
                         <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{cat.id}</span>
                      </button>
                    )
                  })}
               </div>
            </div>

            <div className="pt-4 flex justify-center">
              <button 
                onClick={startPrayer}
                disabled={!selectedDeity || selectedCats.length === 0}
                className="bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-lg font-bold py-4 px-12 rounded-full shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Scroll size={20} /> 誠心跪拜並領取願福語
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: PRAYING ANIMATION */}
        {step === 'praying' && (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in space-y-6">
             <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-amber-500/30 animate-ping absolute inset-0"></div>
                <div className="w-32 h-32 rounded-full border-4 border-amber-500/50 animate-pulse flex items-center justify-center bg-slate-900 z-10 relative">
                   <span className="text-6xl">{selectedDeity?.icon}</span>
                </div>
             </div>
             <div className="text-center space-y-2">
               <h3 className="text-2xl font-bold text-amber-500">正在傳送祈願...</h3>
               <p className="text-slate-400 text-sm">Connecting to {selectedDeity?.name}...</p>
               <div className="flex gap-1 justify-center mt-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
               </div>
             </div>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 'result' && resultData && (
          <div className="max-w-2xl mx-auto animate-fade-in-up">
             
             {/* Result Card */}
             <div className="bg-[#fffaf0] text-slate-800 rounded-xl overflow-hidden shadow-2xl border-4 border-amber-400 relative">
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-800"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-800"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-800"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-800"></div>

                <div className="p-8 text-center">
                   <div className="mb-6">
                      <div className="text-6xl mb-2">{selectedDeity?.icon}</div>
                      <h2 className="text-2xl font-bold text-red-900 tracking-widest">
                        ✨ {selectedDeity?.name} 給您的祝願 ✨
                      </h2>
                      <div className="h-1 w-20 bg-amber-400 mx-auto mt-4 rounded-full"></div>
                   </div>

                   <div className="space-y-6 text-left max-w-lg mx-auto mb-8">
                      {resultData.blessings.map((b, idx) => (
                        <div key={idx} className="flex gap-3 items-start bg-white/50 p-3 rounded-lg border border-amber-100">
                           <span className="bg-red-800 text-white text-xs px-2 py-1 rounded font-bold whitespace-nowrap mt-0.5">
                             {b.cat}
                           </span>
                           <p className="text-lg font-medium text-slate-700 leading-relaxed">
                             {b.text}
                           </p>
                        </div>
                      ))}
                   </div>

                   <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 relative mt-8">
                      <div className="text-4xl text-amber-300 absolute -top-4 left-4">❝</div>
                      <p className="text-red-800 font-bold text-lg italic relative z-10">
                        {resultData.quote}
                      </p>
                      <div className="text-4xl text-amber-300 absolute -bottom-8 right-4">❞</div>
                   </div>
                </div>

                {/* Footer Warning */}
                <div className="bg-slate-100 p-3 text-center border-t border-slate-200">
                   <p className="text-xs text-slate-500">
                     ⚠️ 以上資訊只供參考，不可盡信，祝願大家好運和健康！
                   </p>
                </div>
             </div>

             <div className="mt-8 text-center">
               <button 
                 onClick={reset}
                 className="text-slate-400 hover:text-white flex items-center gap-2 mx-auto transition-colors"
               >
                 <RefreshCcw size={16} /> 誠心再來一次
               </button>
             </div>

          </div>
        )}

      </div>
    </div>
  );
}