
import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../../types';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Heart, Briefcase, TrendingUp, AlertTriangle, User, Calendar, ArrowLeft, Cpu, Volume2, VolumeX, X } from 'lucide-react';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdate: () => void;
}

const TOPICS = {
  daily: { 
    id: 'daily',
    title: "今日運程", 
    icon: <Sparkles size={24} />, 
    color: 'purple',
    desc: "結合星象與生肖衝煞，提供宜忌指南。",
    prompt: "分析今日運程。結合地理位置、當日星象與生肖衝煞。給予「今日宜/忌」指南及每小時運勢流向。"
  },
  love: { 
    id: 'love',
    title: "戀愛導航", 
    icon: <Heart size={24} />, 
    color: 'pink',
    desc: "心理學依戀人格與命盤契合度分析。",
    prompt: "分析戀愛運勢。結合心理學依戀人格 + 命盤契合度 (合婚)。預測正緣出現時間、目前感情問題的潛在突破口。"
  },
  career: { 
    id: 'career',
    title: "工作事業", 
    icon: <Briefcase size={24} />, 
    color: 'cyan',
    desc: "職涯天賦分析與行業景氣評估。",
    prompt: "分析工作事業。職涯天賦分析 + 行業景氣大數據。建議跳槽時機、當前職場人際關係處理策略。"
  },
  wealth: { 
    id: 'wealth',
    title: "財富指引", 
    icon: <TrendingUp size={24} />, 
    color: 'amber',
    desc: "財帛宮位分析與市場風險評估。",
    prompt: "分析財富指引。財帛宮位分析 + 市場情緒風險評估。區分「正財」與「偏財」強弱，給予理財保守或進取的建議。"
  }
};

// --- Audio Engine (Oscillators) ---
const QuantumAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.05; // Very low ambient volume
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // Sci-fi chord frequencies
    const freqs = [110, 164.81, 196, 220]; // A2, E3, G3, A3
    
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // LFO for movement
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + (Math.random() * 0.2);
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2; // Subtle vibrato
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.5;
      
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();
      
      oscillatorsRef.current.push(osc);
    });
  };

  const toggleAudio = () => {
    if (isPlaying) {
      audioCtxRef.current?.suspend();
      setIsPlaying(false);
    } else {
      if (!audioCtxRef.current) initAudio();
      audioCtxRef.current?.resume();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <button 
      onClick={toggleAudio}
      className={`fixed top-24 right-4 z-40 p-3 rounded-full border backdrop-blur-md transition-all ${isPlaying ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-900/50 border-white/10 text-slate-500'}`}
    >
      {isPlaying ? <Volume2 size={20} className="animate-pulse" /> : <VolumeX size={20} />}
    </button>
  );
};

const AIFortune: React.FC<Props> = ({ profile, supabase, onUpdate }) => {
  const [view, setView] = useState<'input' | 'dashboard' | 'report'>('input');
  const [userData, setUserData] = useState({ name: '', birth: '' });
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<{title: string, content: string} | null>(null);

  // Initialize with profile data if available
  useEffect(() => {
    if (profile) {
      setUserData({
        name: profile.name,
        birth: '1990-01-01' // Default, user should update
      });
    }
  }, [profile]);

  const handleAnalyze = () => {
    if (!userData.name || !userData.birth) return alert("請輸入姓名與生日");
    
    setLoading(true);
    setLoadingText("正在校準量子星圖...");
    
    setTimeout(() => {
      setLoading(false);
      setView('dashboard');
      
      // Random Bad Luck Warning (Simulation)
      if (Math.random() > 0.7) {
        setWarningMsg("偵測到「水星逆行」干擾波段，建議近期多靜少動，避免重大決策。");
      } else {
        setWarningMsg(null);
      }
    }, 1500);
  };

  const generateReport = async (topicId: keyof typeof TOPICS) => {
    const topic = TOPICS[topicId];
    
    // Check points
    if (profile && profile.points < 50) return alert("積分不足 (需要 50 PTS)");
    
    if (confirm(`啟動「${topic.title}」分析引擎？(扣除 50 積分)`)) {
      if (profile) {
        await supabase.from('profiles').update({ points: profile.points - 50 }).eq('id', profile.id);
        onUpdate();
      }

      setLoading(true);
      setLoadingText(`正在連接神經網絡分析【${topic.title}】...`);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
          Role: Quantum Fortune AI (Advanced Predictive System).
          Task: ${topic.prompt}
          
          User Context:
          - Name: ${userData.name}
          - Birth Date: ${userData.birth}
          
          Output Style:
          - Tone: Futuristic, Professional, Insightful, Mystical yet Scientific.
          - Structure: Use bullet points, percentages, or "Data Blocks".
          - Language: Traditional Chinese (Taiwan/Hong Kong).
          - Length: Approx 200 words.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        setCurrentReport({
          title: topic.title,
          content: response.text || "訊號丟失，請重試。"
        });
        setView('report');

      } catch (err) {
        console.error(err);
        alert("AI 連線失敗");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden rounded-[2.5rem] border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-t-transparent border-r-cyan-500 border-b-transparent border-l-pink-500 rounded-full animate-[spin_1s_linear_infinite_reverse]" />
            <div className="absolute inset-0 flex items-center justify-center">
               <Cpu className="text-white/50 animate-pulse" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 animate-pulse">
            QUANTUM COMPUTING
          </h2>
          <p className="text-slate-500 text-xs font-mono mt-2 tracking-widest uppercase">{loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[600px] bg-slate-950 text-slate-200 font-sans rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl">
      <QuantumAudio />
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-8 h-full">
        
        {view === 'input' && (
          <div className="max-w-md mx-auto py-12 animate-in fade-in zoom-in duration-500">
             <div className="text-center mb-10">
               <div className="inline-flex p-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                 <Sparkles className="text-indigo-400" size={40} />
               </div>
               <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                 量子命理 AI
               </h1>
               <p className="text-indigo-300/60 text-sm font-bold uppercase tracking-widest">Quantum Fortune Laboratory</p>
             </div>

             <div className="space-y-6 bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-xl">
               <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Identity Name</label>
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                   <input 
                     type="text" 
                     value={userData.name}
                     onChange={e => setUserData({...userData, name: e.target.value})}
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                     placeholder="輸入姓名..."
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Initialization Date</label>
                 <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                   <input 
                     type="date" 
                     value={userData.birth}
                     onChange={e => setUserData({...userData, birth: e.target.value})}
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                   />
                 </div>
               </div>

               <button 
                 onClick={handleAnalyze}
                 className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] active:scale-[0.98] text-white font-black py-4 rounded-xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all mt-4"
               >
                 啟動分析引擎
               </button>
             </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="max-w-4xl mx-auto py-8 animate-in slide-in-from-bottom-8 duration-500">
             <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
               <div>
                 <h2 className="text-3xl font-black text-white">早安，{userData.name}</h2>
                 <p className="text-indigo-400 text-xs font-mono mt-1">
                   星圖校準完成 | 能量場: <span className="text-green-400">Stable</span>
                 </p>
               </div>
               <button onClick={() => setView('input')} className="text-xs text-slate-500 hover:text-white transition-colors">重置設定</button>
             </div>

             {warningMsg && (
               <div className="mb-8 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-4 animate-pulse">
                 <div className="p-2 bg-red-500/20 rounded-full">
                   <AlertTriangle className="text-red-400" size={20} />
                 </div>
                 <div>
                   <h4 className="text-red-400 font-bold text-sm mb-1">厄運預警系統觸發 (Warning System)</h4>
                   <p className="text-red-200/70 text-xs leading-relaxed">{warningMsg}</p>
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {Object.values(TOPICS).map((topic) => (
                 <button
                   key={topic.id}
                   onClick={() => generateReport(topic.id as any)}
                   className={`group relative overflow-hidden bg-slate-900/60 hover:bg-slate-800 backdrop-blur-md border border-white/5 hover:border-${topic.color}-500/50 p-6 rounded-3xl text-left transition-all hover:scale-[1.01] hover:shadow-2xl`}
                 >
                   <div className={`absolute top-0 right-0 p-20 bg-${topic.color}-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
                   
                   <div className="relative z-10 flex justify-between items-start mb-4">
                     <div className={`p-3 rounded-2xl bg-slate-950 border border-white/10 text-${topic.color}-400 group-hover:scale-110 transition-transform`}>
                       {topic.icon}
                     </div>
                     <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-500 font-mono">
                       AI-GEN
                     </div>
                   </div>
                   
                   <h3 className="relative z-10 text-xl font-bold text-white mb-2">{topic.title}</h3>
                   <p className="relative z-10 text-slate-400 text-xs leading-relaxed max-w-[90%]">
                     {topic.desc}
                   </p>
                 </button>
               ))}
             </div>
          </div>
        )}

        {view === 'report' && currentReport && (
          <div className="max-w-3xl mx-auto py-8 animate-in zoom-in duration-500">
            <button 
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-bold text-sm group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 返回儀表板
            </button>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                  <Cpu className="text-indigo-400" />
                  <h2 className="text-2xl font-black text-white">{currentReport.title} • 分析報告</h2>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-loose">
                  {currentReport.content.split('\n').map((line, i) => (
                    <p key={i} className={line.includes('：') || line.includes(':') ? 'font-bold text-indigo-200' : ''}>
                      {line}
                    </p>
                  ))}
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase">
                  <span>Generated by Google Gemini 2.5</span>
                  <span>Probability Confidence: 89.4%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFortune;
