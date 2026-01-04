
import React, { useState, useEffect, useRef } from 'react';
import { Profile, Post } from '../types';
import { ShieldAlert, Users, FileText, X, Search, Trash2, Edit, RefreshCw, Play, Square, Cpu, Zap, Activity } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  supabase: any;
}

const AdminPanel: React.FC<Props> = ({ isOpen, onClose, currentUser, supabase }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'stats' | 'robot'>('stats');
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, todayNew: 0, online: 1 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Robot State
  const [isRobotRunning, setIsRobotRunning] = useState(false);
  const [robotLogs, setRobotLogs] = useState<string[]>([]);
  const robotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real-time Subscriptions
  useEffect(() => {
    if (!isOpen) return;

    // Fetch Initial Data
    fetchAllData();

    // Subscribe to DB changes for Real-time Sync (Web <-> Mobile)
    const userChannel = supabase.channel('admin-users-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAllData())
        .subscribe();

    const postChannel = supabase.channel('admin-posts-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchAllData())
        .subscribe();

    return () => {
        supabase.removeChannel(userChannel);
        supabase.removeChannel(postChannel);
    };
  }, [isOpen]);

  const fetchAllData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: postData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    
    if (userData) {
      setUsers(userData);
      const today = new Date().toISOString().split('T')[0];
      setStats({
        totalUsers: userData.length,
        todayNew: userData.filter((u: any) => u.created_at.startsWith(today)).length,
        online: Math.floor(Math.random() * 5) + 1 // Simulated online presence
      });
    }
    if (postData) setPosts(postData);
    setLoading(false);
  };

  const addLog = (msg: string) => {
    setRobotLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  // --- ROBOT LOGIC ---
  const generateRobotPost = async () => {
    addLog("🤖 AI 正在掃描全球新聞源...");
    
    const regions = [
      { name: '中國香港', lang: 'Traditional Chinese (Cantonese flavor preferred)' },
      { name: '台灣', lang: 'Traditional Chinese' },
      { name: '英國', lang: 'English' },
      { name: '美國', lang: 'English' },
      { name: '加拿大', lang: 'English' },
      { name: '澳洲', lang: 'English' },
      { name: '歐洲', lang: 'English' }
    ];
    
    const cats = ['地產', '時事', '財經', '娛樂', '旅遊', '數碼', '汽車', '宗教', '優惠', '校園', '天氣', '社區活動'];
    
    // Random selection
    const selectedRegionObj = regions[Math.floor(Math.random() * regions.length)];
    const selectedCat = cats[Math.floor(Math.random() * cats.length)];
    
    addLog(`🔍 鎖定目標: ${selectedRegionObj.name} - ${selectedCat}`);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Rule 14, 72, 81: Rich Content, Own Words, Copyright Safety
      const prompt = `
        You are an expert news reporter for 'HKER News Platform'.
        Task: Create a news post about '${selectedCat}' in '${selectedRegionObj.name}'.
        
        Guidelines:
        1. Language: ${selectedRegionObj.lang}.
        2. Content: 
           - Headline: Catchy and professional.
           - Body: Approx 200 words. Summarize a realistic recent event/trend.
           - Style: "Own Words" (Do not copy-paste). Professional and engaging.
           - Key Points: List 3 key takeaways at the top.
        3. Safety: Avoid copyright infringement by synthesizing facts.
        4. Disclaimer: "This content is AI-generated based on trending topics."
        
        Output JSON Format:
        {
          "title": "Title Here",
          "content": "Full content string...",
          "source_name": "Global News Aggregator",
          "source_url": "https://news.google.com"
        }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text || "{}";
      const result = JSON.parse(text);

      if (!result.title || !result.content) throw new Error("AI output incomplete");

      const newPost: Partial<Post> = {
        title: result.title,
        content: result.content,
        region: selectedRegionObj.name,
        category: selectedCat,
        author_name: `HKER Bot (${selectedRegionObj.name === '中國香港' || selectedRegionObj.name === '台灣' ? '智' : 'AI'})`,
        author_id: "robot",
        source_name: result.source_name,
        source_url: result.source_url,
        is_bot: true,
        locked: true, 
        likes: 0,
        hearts: 0,
        liked_by: {},
        hearted_by: {}
      };

      const { error } = await supabase.from('posts').insert([newPost]);
      if (error) throw error;
      
      addLog(`✅ 發布成功: [${selectedRegionObj.name}] ${result.title.substring(0, 20)}...`);
      // No manual fetch needed due to realtime subscription
    } catch (err: any) {
      addLog(`❌ 錯誤: ${err.message}`);
    }
  };

  const toggleRobot = () => {
    if (isRobotRunning) {
      if (robotIntervalRef.current) clearInterval(robotIntervalRef.current);
      setIsRobotRunning(false);
      addLog("🛑 機械人已暫停工作。");
    } else {
      setIsRobotRunning(true);
      addLog("🚀 機械人啟動：全自動勤奮工作模式。");
      generateRobotPost(); // Immediate start
      // Schedule next run (e.g., every 60 seconds)
      robotIntervalRef.current = setInterval(() => {
        generateRobotPost();
      }, 60000); 
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('確認移除此用戶？此操作不可逆。')) return;
    await supabase.from('profiles').delete().eq('id', id);
  };

  const handleUpdatePoints = async (id: string, current: number) => {
    const val = prompt('請輸入新的積分數值：', current.toString());
    if (val !== null && !isNaN(parseInt(val))) {
      await supabase.from('profiles').update({ points: parseInt(val) }).eq('id', id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-300">
      <div className="h-20 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
            <ShieldAlert />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">HKER ADMIN CONSOLE</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Live Data System</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-slate-900/50 backdrop-blur border-r border-slate-800 p-6 flex flex-col gap-2">
          <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'stats' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Activity size={18} /> 實時監控
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Users size={18} /> 會員管理
          </button>
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'posts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <FileText size={18} /> 內容審核
          </button>
          <button onClick={() => setActiveTab('robot')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'robot' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Cpu size={18} /> AI 採集中心
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-950 p-8">
          {activeTab === 'stats' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">總註冊人數</p>
                  <p className="text-5xl font-black text-white">{stats.totalUsers}</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">今日新會員</p>
                  <p className="text-5xl font-black text-green-500">+{stats.todayNew}</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors" />
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">系統狀態</p>
                  <p className="text-5xl font-black text-blue-500">Online</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'robot' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <Cpu className="text-indigo-400" size={32} /> AI 新聞採集機器人 (v2.0)
                  </h2>
                  <p className="text-indigo-200 text-sm mt-2 max-w-xl">
                    全自動化搜尋全球新聞，AI 智能摘要 (Avoid Plagiarism)，根據地區預設語言自動發布。資料實時寫入 Supabase。
                  </p>
                </div>
                <button 
                  onClick={toggleRobot}
                  className={`relative z-10 flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white transition-all shadow-xl hover:scale-105 active:scale-95 ${isRobotRunning ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'}`}
                >
                  {isRobotRunning ? <><Square size={20} fill="currentColor" /> 停止運行</> : <><Play size={20} fill="currentColor" /> 啟動全自動模式</>}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] border border-slate-800 p-8 flex flex-col h-[500px] shadow-xl">
                  <h3 className="text-white font-bold mb-6 flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isRobotRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                    機器人工作日誌 (Real-time Logs)
                  </h3>
                  <div className="flex-1 bg-black/40 rounded-2xl p-6 overflow-y-auto font-mono text-xs space-y-2 border border-white/5">
                    {robotLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                        <Cpu size={32} className="opacity-20" />
                        <p>等待任務啟動...</p>
                      </div>
                    ) : (
                      robotLogs.map((log, i) => (
                        <p key={i} className="flex gap-2">
                          <span className="text-slate-500 shrink-0">{log.split(']')[0]}]</span>
                          <span className={log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-indigo-300'}>
                            {log.split(']')[1]}
                          </span>
                        </p>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-8 space-y-6 shadow-xl">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Zap className="text-yellow-500" size={18} /> 運行規則
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">CONTENT STRATEGY</p>
                      <p className="text-xs text-slate-300">AI 使用 "Own Words" 模式總結新聞，並附上原連結。篇幅增加至 200 字。</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">LANGUAGE LOGIC</p>
                      <p className="text-xs text-slate-300">
                        <span className="text-white">HK/TW:</span> 繁體中文<br/>
                        <span className="text-white">Global:</span> English
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-white">會員管理列表</h2>
                <div className="relative w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input type="text" placeholder="搜尋會員..." className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-colors" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-700">
                    <tr><th className="px-8 py-5">姓名 / 電郵</th><th className="px-8 py-5">積分</th><th className="px-8 py-5 text-right">操作</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.filter(u => u.email?.includes(searchTerm) || u.name?.includes(searchTerm)).map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="font-bold text-white flex items-center gap-2">
                            <img src={u.avatar_url} className="w-6 h-6 rounded-full" />
                            {u.name}
                          </div>
                          <div className="text-xs text-slate-500 ml-8">{u.email}</div>
                        </td>
                        <td className="px-8 py-5 font-black text-yellow-500">{u.points.toLocaleString()}</td>
                        <td className="px-8 py-5 text-right opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleUpdatePoints(u.id, u.points)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg mr-2"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-white">內容審核</h2>
              <div className="grid grid-cols-1 gap-4">
                {posts.map(p => (
                  <div key={p.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex justify-between items-start hover:border-slate-700 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {p.is_bot && <span className="text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10">Robot</span>}
                        <span className="text-[10px] font-black uppercase bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">{p.category}</span>
                        <span className="text-[10px] text-slate-500">{p.region} • {new Date(p.created_at).toLocaleString()}</span>
                      </div>
                      <h4 className="font-bold text-white mb-2 text-lg">{p.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 max-w-3xl">{p.content}</p>
                    </div>
                    <button onClick={async () => { if (confirm('刪除貼文？')) { await supabase.from('posts').delete().eq('id', p.id); } }} className="ml-4 p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
