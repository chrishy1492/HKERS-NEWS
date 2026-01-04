
import React, { useState, useRef, useEffect } from 'react';
import { Profile } from '../../types';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Volume2, VolumeX, Hand, Scroll, Heart, ChevronLeft, Sun, Moon, Cloud, Star } from 'lucide-react';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

const DEITIES = [
  { id: 1, name: '觀音', title: '大慈大悲', icon: '🌸', color: 'text-pink-400', bg: 'bg-pink-900/20' },
  { id: 2, name: '佛祖', title: '釋迦牟尼', icon: '🕉️', color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  { id: 3, name: '玉皇大帝', title: '萬天之主', icon: '👑', color: 'text-amber-400', bg: 'bg-amber-900/20' },
  { id: 4, name: '玄天上帝', title: '蕩魔天尊', icon: '⚔️', color: 'text-blue-400', bg: 'bg-blue-900/20' },
  { id: 5, name: '財神', title: '招財進寶', icon: '💰', color: 'text-red-400', bg: 'bg-red-900/20' },
  { id: 6, name: '壽星公', title: '長命百歲', icon: '🍑', color: 'text-orange-400', bg: 'bg-orange-900/20' },
  { id: 7, name: '耶穌', title: '救世主', icon: '✝️', color: 'text-slate-200', bg: 'bg-slate-700/30' },
  { id: 8, name: '聖母', title: '瑪利亞', icon: '🌹', color: 'text-rose-300', bg: 'bg-rose-900/20' },
];

const BLESSING_DATA: Record<string, string[]> = {
    "愛情": [
        "遇見良緣，彼此珍惜。","情投意合，永浴愛河。","放下執著，隨緣自在。","坦誠相待，減少猜忌。","用愛包容，共渡難關。",
        "珍惜當下，守護陪伴。","互相扶持，共同成長。","良緣天定，靜候花開。","心存美善，吸引真愛。","體諒對方，和諧相處。",
        "勇敢表白，不留遺憾。","拒絕誘惑，一心一意。","忘記過去，擁抱未來。","用耐心灌溉愛情的種子。","尊重彼此的獨立空間。",
        "時常感恩對方的付出。","在愛中學會自愛。","願天下有情人終成眷屬。"
    ],
    "工作": [
        "職位升遷，大展鴻圖。","事半功倍，效率倍增。","遇見伯樂，才華盡顯。","職場和諧，貴人相助。","創業成功，穩步發展。",
        "克服困局，化險為夷。","思路清晰，決策果斷。","技能提升，專業領先。","保持熱情，不忘初心。","平衡勞逸，身心舒爽。",
        "目標達成，業績長紅。","勇於承擔，累積經驗。","在挑戰中看見機會。","與同事精誠合作。","工作中展現慈悲與耐性。",
        "不畏艱辛，終有回報。","心平氣和處理繁雜事務。","祝願事業一帆風順。"
    ],
    "生活": [
        "平安喜樂，無憂無慮。","心寬體胖，知足常樂。","發現日常的美好。","遠離煩惱，清淨自在。","生活美滿，事事順心。",
        "與大自然和諧共處。","享受每一刻的寧靜。","提升修養，優雅生活。","珍惜擁有，不卑不亢。","開拓視野，體驗人生。",
        "居所安寧，鄰里和諧。","斷捨離，簡約而不簡單。","讓愛充滿生活的每個角落。","每天都有一個微笑的理由。","感恩食物，感恩陽光。",
        "充滿希望，迎接晨曦。","內心強大，不畏風雨。","生活處處有驚喜。"
    ],
    "運程": [
        "時來運轉，吉星高照。","趨吉避凶，平安大吉。","把握良機，乘勢而上。","衰氣散盡，好運連連。","心誠則靈，感應天心。",
        "廣結善緣，增加福報。","沉著應變，化解危機。","財源滾動，福慧雙增。","路路通達，左右逢源。","善念一起，運勢自轉。",
        "保持正念，避開負面磁場。","懂得放下，運氣自來。","在低谷中蓄勢待發。","順應天時，盡力而為。","勤行善事，積厚流光。",
        "勇於改變，開啟新局。","謙虛受教，貴人自來。","祝願你一年四季走好運。"
    ],
    "人事": [
        "廣結良緣，和睦共處。","遠離小人，親近君子。","說話得體，受人敬重。","寬容大量，化解怨恨。","真誠待人，換位思考。",
        "提升親和力，廣受歡迎。","不卑不亢，應對自如。","化敵為友，圓融處理。","在人群中傳遞正能量。","學會傾聽，理解他人。",
        "讚美他人，自得其樂。","謙卑自守，不與人爭。","在紛擾中保持清醒。","用慈悲心對待每個人。","建立互信，深厚友誼。",
        "懂得拒絕，守護界限。","在人事中修行自我。","祝願你人緣極佳。"
    ],
    "學業": [
        "金榜題名，學業有成。","智慧開啟，一讀即懂。","克服惰性，勤奮好學。","考試順利，發揮超卓。","遇到良師，受益匪淺。",
        "舉一反三，靈活運用。","專注力強，抗擾度高。","持之以恆，必有收獲。","探索未知，熱愛知識。","學以致用，回饋社會。",
        "思路敏捷，邏輯清晰。","在壓力中保持冷靜。","享受學習，不以為苦。","博覽群書，氣質自華。","謙虛求教，不恥下問。",
        "打破瓶頸，更進一步。","定下目標，勇往直前。","祝願你學問日益精進。"
    ],
    "健康": [
        "身強體健，百病不侵。","心情開朗，延年益壽。","睡眠安穩，體力充沛。","遠離病灶，康復神速。","規律作息，活力滿滿。",
        "心血管通暢，筋骨舒展。","少思寡欲，精神奕奕。","飲食均衡，脾胃安和。","放下負擔，身心輕盈。","在運動中體悟生命。",
        "珍惜身體，它是靈魂的聖殿。","呼吸順暢，內外清涼。","減少焦慮，自然安康。","笑口常開，就是良藥。","聽從醫囑，自律生活。",
        "感恩每一口呼吸。","遠離毒素，回歸自然。","祝願你龍馬精神。"
    ],
    "家庭": [
        "闔家平安，老少安康。","父慈子孝，家庭和睦。","夫妻恩愛，相敬如賓。","家和萬事興。","共同經營溫馨港灣。",
        "化解矛盾，增進感情。","家庭成員互相關懷。","新添成員，喜氣洋洋。","共享天倫，歡樂常在。","傳承家風，厚德載物。",
        "理解長輩，關愛晚輩。","把最好的脾氣留給家人。","家庭環境整潔清幽。","在困難中緊緊相依。","分享喜悅，分擔憂愁。",
        "尊重長輩，耐心引導。","讓家成為心靈的避風港。","祝願你家庭幸福美滿。"
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

const Worship: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [step, setStep] = useState<'deity' | 'category' | 'praying' | 'result'>('deity');
  const [selectedDeity, setSelectedDeity] = useState<typeof DEITIES[0] | null>(null);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [result, setResult] = useState<{ blessings: string[], quote: string, aiGuidance: string } | null>(null);
  
  // Audio
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Gentle guzheng/meditation music
    audioRef.current = new Audio('https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3'); 
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    return () => { audioRef.current?.pause(); };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.play().catch(() => {});
      setIsMuted(false);
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
  };

  const handleDeitySelect = (deity: typeof DEITIES[0]) => {
    setSelectedDeity(deity);
    setStep('category');
  };

  const toggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(prev => prev.filter(c => c !== cat));
    } else {
      if (selectedCats.length >= 3) {
        alert("最多選擇 3 個祈福事項");
        return;
      }
      setSelectedCats(prev => [...prev, cat]);
    }
  };

  const startPrayer = async () => {
    if (selectedCats.length === 0) return alert("請至少選擇一個祈福事項");
    if (!selectedDeity) return;

    // Optional: Deduct points for "offering"
    if (profile && profile.points >= 50) {
        if(confirm("是否獻上 50 積分香油錢以示誠心？(非強制)")) {
            await supabase.from('profiles').update({ points: profile.points - 50 }).eq('id', profile.id);
            onUpdate();
        }
    }

    setStep('praying');
    if (!isMuted) audioRef.current?.play().catch(() => {});

    // Generate Blessings locally
    const blessings = selectedCats.map(cat => {
        const list = BLESSING_DATA[cat];
        return `【${cat}】${list[Math.floor(Math.random() * list.length)]}`;
    });

    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    // AI Generation for guidance
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Role: Spiritual Guide.
            Context: User is praying to ${selectedDeity.name} for ${selectedCats.join(', ')}.
            Task: Write a short, warm, spiritual guidance message (max 50 words) encouraging kindness, facing problems, and loving family.
            Language: Traditional Chinese.
        `;
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const aiText = res.text || "心存善念，必有迴響。";
        
        setTimeout(() => {
            setResult({ blessings, quote, aiGuidance: aiText });
            setStep('result');
        }, 3000); // 3s prayer animation

    } catch (e) {
        setResult({ blessings, quote, aiGuidance: "誠心祈求，上天庇佑。" });
        setStep('result');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-500 min-h-[600px] flex flex-col relative bg-[#fffaf0] rounded-[2.5rem] overflow-hidden border-4 border-[#d4af37] shadow-2xl">
      
      {/* Header */}
      <div className="bg-[#8b0000] p-6 text-center relative">
        <div className="absolute top-4 right-4">
             <button onClick={toggleAudio} className="text-[#d4af37] hover:text-white transition-colors">
                {isMuted ? <VolumeX /> : <Volume2 />}
             </button>
        </div>
        <h2 className="text-3xl font-black text-[#d4af37] tracking-widest flex items-center justify-center gap-3">
            <Sparkles /> 網上誠心祈福系統 <Sparkles />
        </h2>
        <p className="text-red-200 text-xs mt-2 font-bold">雲端參拜 • 心誠則靈 • AI 祝願</p>
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        
        {step === 'deity' && (
            <div className="animate-in slide-in-from-right duration-500">
                <h3 className="text-center text-[#8b0000] font-bold text-xl mb-6">請選擇祈福神祇</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DEITIES.map(deity => (
                        <button 
                            key={deity.id}
                            onClick={() => handleDeitySelect(deity)}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-[#d4af37]/30 hover:border-[#d4af37] hover:bg-[#fff5e6] transition-all group ${deity.bg}`}
                        >
                            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-md">{deity.icon}</span>
                            <span className="text-[#8b0000] font-black text-lg">{deity.name}</span>
                            <span className="text-slate-500 text-xs font-bold">{deity.title}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {step === 'category' && selectedDeity && (
            <div className="animate-in slide-in-from-right duration-500 max-w-2xl mx-auto">
                <button onClick={() => setStep('deity')} className="mb-6 flex items-center text-slate-500 hover:text-[#8b0000] font-bold">
                    <ChevronLeft /> 返回重選
                </button>
                
                <div className="text-center mb-8">
                    <div className="text-6xl mb-2">{selectedDeity.icon}</div>
                    <h3 className="text-[#8b0000] font-black text-2xl">向 {selectedDeity.name} 祈求</h3>
                    <p className="text-slate-500 text-sm">請選擇祈福事項 (最多3項)</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    {Object.keys(BLESSING_DATA).map(cat => (
                        <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`p-4 rounded-xl border-2 font-bold transition-all flex items-center justify-between
                                ${selectedCats.includes(cat) 
                                    ? 'bg-[#8b0000] text-[#d4af37] border-[#8b0000]' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#d4af37]'}
                            `}
                        >
                            <span>{cat}</span>
                            {selectedCats.includes(cat) && <Heart size={16} fill="currentColor" />}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={startPrayer}
                    className="w-full bg-[#d4af37] hover:bg-[#c5a028] text-[#8b0000] font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-xl"
                >
                    <Hand /> 誠心跪拜並領取願福語
                </button>
            </div>
        )}

        {step === 'praying' && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="relative w-32 h-32 mb-8">
                     <div className="absolute inset-0 bg-[#d4af37] rounded-full opacity-20 animate-ping"></div>
                     <div className="absolute inset-4 bg-[#8b0000] rounded-full opacity-20 animate-pulse"></div>
                     <div className="absolute inset-0 flex items-center justify-center text-8xl animate-bounce">
                        🙏
                     </div>
                </div>
                <h3 className="text-2xl font-black text-[#8b0000] mb-2">誠心祈禱中...</h3>
                <p className="text-slate-500 font-bold">心誠則靈 • 感應天心</p>
            </div>
        )}

        {step === 'result' && result && selectedDeity && (
            <div className="animate-in zoom-in duration-700 max-w-2xl mx-auto text-center">
                 <div className="bg-white border-2 border-[#d4af37] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Decorative Corner */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#8b0000] rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#8b0000] rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#8b0000] rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#8b0000] rounded-br-xl"></div>

                    <h3 className="text-2xl font-black text-[#8b0000] mb-6 flex items-center justify-center gap-2">
                        {selectedDeity.icon} {selectedDeity.name} 給您的祝願
                    </h3>

                    <div className="space-y-4 mb-8 text-left bg-[#fffaf0] p-6 rounded-xl border border-[#d4af37]/30">
                        {result.blessings.map((b, i) => (
                            <p key={i} className="text-slate-700 font-bold text-lg leading-relaxed flex items-start gap-2">
                                <span className="text-[#d4af37]">✦</span> {b}
                            </p>
                        ))}
                    </div>

                    <div className="mb-6">
                        <p className="text-[#8b0000] font-bold italic border-t border-b border-[#d4af37]/30 py-4">
                            "{result.aiGuidance}"
                        </p>
                    </div>

                    <div className="text-sm text-slate-500 font-bold mb-8">
                        每日金句：{result.quote}
                    </div>

                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-xs text-slate-500 mb-6">
                        ⚠️ 結果必須標明：以上資訊只供參考，不可盡信，祝願大家好運和健康！
                    </div>

                    <button 
                        onClick={() => { setStep('deity'); setResult(null); setSelectedCats([]); }}
                        className="bg-[#8b0000] text-white px-8 py-3 rounded-full font-bold hover:bg-[#6d0000] transition-colors"
                    >
                        再次祈福
                    </button>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Worship;
