
import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Heart, Sparkles, Loader2, Volume2, VolumeX, 
  ChevronRight, Info, AlertTriangle, User, Compass, Star, Hand
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { UserProfile } from '../../types';

// Use the API key directly from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DEITIES = [
  { id: 'guanyin', name: '觀音菩薩', title: '大慈大悲', icon: '🙏', color: 'from-blue-50 to-white' },
  { id: 'buddha', name: '釋迦牟尼佛', title: '普渡眾生', icon: '☸️', color: 'from-amber-50 to-white' },
  { id: 'jade', name: '玉皇大帝', title: '統御萬靈', icon: '👑', color: 'from-yellow-50 to-white' },
  { id: 'xuantian', name: '玄天上帝', title: '斬妖除魔', icon: '🐢', color: 'from-slate-50 to-white' },
  { id: 'wealth', name: '財神', title: '招財進寶', icon: '💰', color: 'from-orange-50 to-white' },
  { id: 'shou', name: '壽星公', title: '長命百歲', icon: '🍑', color: 'from-red-50 to-white' },
  { id: 'jesus', name: '主耶穌', title: '救贖世人', icon: '✝️', color: 'from-indigo-50 to-white' },
  { id: 'mary', name: '聖母瑪利亞', title: '神聖恩寵', icon: '🌹', color: 'from-pink-50 to-white' },
];

const CATEGORIES = [
  { id: 'love', name: '愛情婚姻', icon: '❤️' },
  { id: 'career', name: '事業前景', icon: '💼' },
  { id: 'life', name: '生活平安', icon: '🍀' },
  { id: 'fortune', name: '財運亨通', icon: '📈' },
  { id: 'people', name: '人際和諧', icon: '🤝' },
  { id: 'study', name: '學業進步', icon: '📚' },
  { id: 'health', name: '身體健康', icon: '💪' },
  { id: 'family', name: '家庭美滿', icon: '🏠' },
];

const DigitalPrayer: React.FC<{ userProfile: UserProfile | null, updatePoints: (amount: number) => void }> = ({ userProfile, updatePoints }) => {
  const [selectedDeity, setSelectedDeity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isWorshipping, setIsWorshipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3'); // 舒服靈性音樂
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15;
    }
    if (!isMuted) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    return () => audioRef.current?.pause();
  }, [isMuted]);

  const handleWorship = async () => {
    if (!selectedDeity || !selectedCategory) return;
    
    setIsWorshipping(true);
    setResult(null);
    setAiInsight(null);

    // 模擬誠心跪拜動畫
    await new Promise(r => setTimeout(r, 2500));

    try {
      const deityName = DEITIES.find(d => d.id === selectedDeity)?.name;
      const catName = CATEGORIES.find(c => c.id === selectedCategory)?.name;

      const prompt = `你是一位精通各類宗教文化且充滿智慧的「獅子山命理大師」。
      現在用戶選擇向【${deityName}】祈求關於【${catName}】的事項。
      用戶詢問的問題是：「${query || '誠心祈求指引'}」。
      
      請生成 1 句專業的【願福語】，並提供 1 段深度【AI 大師指引】。
      
      要求：
      1. 願福語必須包含：勸人多做善事、幫助別人、勇於面對問題、心誠則靈、熱愛家人或熱愛朋友等核心。
      2. 大師指引必須融合「獅子山精神」（拼搏、變通、團結）。
      3. 語氣現代、專業、溫暖，混合廣東話與 English (Kongish) 更有共鳴。
      4. 返回格式：{"blessing": "願福語內容", "insight": "大師指引內容"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.8 
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      setResult(parsed.blessing);
      setAiInsight(parsed.insight);
      
      // 祈福獎勵
      updatePoints(100); 

    } catch (err) {
      console.error(err);
      setResult("心誠則靈，凡事多行善舉，必有福報降臨。");
      setAiInsight("AI 連線稍有延遲，但大師的心與你同在。保持正念，勇於面對當前困難，便是最好的修行。");
    } finally {
      setIsWorshipping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-orange-950 text-orange-400 rounded-[32px] border border-orange-500/30 shadow-[0_0_30px_rgba(234,88,12,0.2)]">
            <Flame size={36} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">NEXUS PRAYER</h1>
            <p className="text-orange-600 font-bold uppercase tracking-[0.2em] text-[10px]">Digital Lion Rock Spiritual Hub v2.1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-orange-600 transition-all"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div className="bg-orange-50 border border-orange-100 px-5 py-2.5 rounded-2xl flex items-center gap-3">
            <Star size={16} className="text-orange-500" />
            <span className="text-xs font-black text-orange-700 uppercase tracking-widest">心誠則靈</span>
          </div>
        </div>
      </header>

      {!result && !isWorshipping ? (
        <div className="grid lg:grid-cols-12 gap-10">
          {/* 左側：選擇區 */}
          <div className="lg:col-span-8 space-y-10">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">1</span>
                <h2 className="text-xl font-black text-slate-900">請選擇祈求神祇 / Select Deity</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DEITIES.map(deity => (
                  <button 
                    key={deity.id}
                    onClick={() => setSelectedDeity(deity.id)}
                    className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 group bg-white ${selectedDeity === deity.id ? 'border-orange-500 ring-4 ring-orange-500/10 scale-105 z-10 shadow-xl' : 'border-slate-100 hover:border-orange-200'}`}
                  >
                    <span className="text-4xl group-hover:scale-110 transition-transform">{deity.icon}</span>
                    <div className="text-center">
                      <span className="block font-black text-slate-900">{deity.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{deity.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">2</span>
                <h2 className="text-xl font-black text-slate-900">請選擇祈福類別 / Category</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-4 rounded-2xl font-black text-sm transition-all border-2 flex items-center gap-3 ${selectedCategory === cat.id ? 'bg-orange-600 border-orange-400 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-orange-200'}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">3</span>
                <h2 className="text-xl font-black text-slate-900">輸入心中祝願 / Your Prayer (選填)</h2>
              </div>
              <textarea 
                className="w-full bg-white border-2 border-slate-100 rounded-[32px] p-6 font-bold text-slate-900 focus:border-orange-500 outline-none transition-all min-h-[120px] shadow-sm"
                placeholder="在此輸入您的祈求與心聲..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </section>
          </div>

          {/* 右側：動作區 */}
          <div className="lg:col-span-4">
             <div className="bg-white rounded-[48px] border border-slate-200 p-8 shadow-2xl space-y-8 sticky top-24">
                <div className="text-center space-y-4">
                   <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto text-4xl border border-orange-100">
                     {selectedDeity ? DEITIES.find(d => d.id === selectedDeity)?.icon : '🏮'}
                   </div>
                   <h3 className="text-2xl font-black text-slate-900">準備祈福儀式</h3>
                   <p className="text-xs font-medium text-slate-500 leading-relaxed">
                     心存善念，勇於面對。系統將根據您的誠心請求神祇指引，並提供大師解惑建議。
                   </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                     <span>當前選擇</span>
                     <span className="text-orange-600">已就緒</span>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between font-bold text-sm">
                        <span className="text-slate-400">神祇:</span>
                        <span className="text-slate-900">{selectedDeity ? DEITIES.find(d => d.id === selectedDeity)?.name : '未選擇'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm">
                        <span className="text-slate-400">事項:</span>
                        <span className="text-slate-900">{selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.name : '未選擇'}</span>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handleWorship}
                  disabled={!selectedDeity || !selectedCategory}
                  className="w-full bg-slate-950 hover:bg-black text-white py-6 rounded-[32px] font-black text-lg uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                  {/* Fixed missing import for Hand icon */}
                  <Hand size={24} className="group-hover:scale-125 transition-transform" />
                  <span>誠心跪拜並領取祝願</span>
                </button>
             </div>
          </div>
        </div>
      ) : isWorshipping ? (
        <div className="min-h-[500px] flex flex-col items-center justify-center space-y-10 animate-in fade-in zoom-in">
           <div className="relative">
             <div className="w-32 h-32 border-[12px] border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center text-5xl">🙏</div>
           </div>
           <div className="text-center space-y-3">
             <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter">誠心跪拜中...</h2>
             <p className="text-orange-600 font-bold uppercase tracking-[0.3em] text-xs animate-pulse">正在向雲端傳遞您的誠心與祝願</p>
           </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-10 duration-700">
           {/* 神聖結果卡片 */}
           <div className="bg-white rounded-[64px] border border-orange-200 p-10 md:p-16 shadow-[0_30px_100px_rgba(234,88,12,0.1)] relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500"></div>
              
              <div className="space-y-10 relative z-10">
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-black uppercase tracking-widest">
                  祝願結果 / THE BLESSING
                </div>

                <div className="space-y-4">
                  <span className="text-6xl md:text-8xl block">{DEITIES.find(d => d.id === selectedDeity)?.icon}</span>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight italic">
                    ✨ {DEITIES.find(d => d.id === selectedDeity)?.name} 給您的祝願 ✨
                  </h3>
                </div>

                <div className="bg-orange-50/50 p-10 rounded-[48px] border-2 border-dashed border-orange-200 text-3xl md:text-4xl font-black text-orange-900 leading-tight italic">
                  「{result}」
                </div>

                <div className="max-w-2xl mx-auto space-y-6 pt-6 border-t border-slate-100">
                   <div className="flex items-center justify-center gap-3 text-slate-400">
                     <Sparkles size={18} className="text-orange-400" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI 大師指引 / MASTER INSIGHT</span>
                     <Sparkles size={18} className="text-orange-400" />
                   </div>
                   <p className="text-lg text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                     {aiInsight}
                   </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
                  <button 
                    onClick={() => { setResult(null); setSelectedDeity(null); setSelectedCategory(null); setAiInsight(null); }}
                    className="px-10 py-5 bg-slate-900 text-white rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                  >
                    再次祈福
                  </button>
                  <div className="flex items-center gap-3 px-8 py-5 bg-orange-50 rounded-[28px] border border-orange-100 text-orange-600 text-xs font-black">
                    <Star size={18} />
                    <span>獲得 100 誠心積分</span>
                  </div>
                </div>
              </div>
           </div>

           {/* 免責聲明 */}
           <div className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 flex items-start gap-5">
              <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={24} />
              <div className="space-y-1">
                <p className="text-xs text-amber-900 font-black uppercase tracking-[0.2em]">
                  專業資訊：以上資訊只供參考，不可盡信。
                </p>
                <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                  雲端祈福為數位化宗教文化體驗，祝願大家好運和健康！獅子山精神的核心在於拼搏與變通，祈福之餘，勇於面對問題與關愛家人才是幸福的根基。
                </p>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes bow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }
        .bow-animate { animation: bow 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default DigitalPrayer;
