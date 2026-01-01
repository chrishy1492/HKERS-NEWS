
import React, { useState, useEffect } from 'react';
import { 
  Globe, Award, ThumbsUp, Heart, Lock, UserPlus, Sparkles, Cpu, 
  Languages, ExternalLink, Clock, MessageSquareOff, TrendingUp, Info
} from 'lucide-react';
import { REGIONS, TOPICS } from '../constants';
import { Post, UserProfile, AppView } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ForumViewProps {
  supabase: any;
  userProfile: UserProfile | null;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
  onAuthRequired: () => void;
  setView: (view: AppView) => void;
}

const ForumView: React.FC<ForumViewProps> = ({ supabase, userProfile, showNotification, onAuthRequired, setView }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [region, setRegion] = useState('全部');
  const [topic, setTopic] = useState('全部');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  // 防刷分機制：每個帳號對每個貼文限制 3 次讚/心
  const [actionHistory, setActionHistory] = useState<Record<string, number>>({});

  const fetchPosts = async () => {
    let q = supabase.from('posts').select('*, profiles(nickname, role, id)').order('created_at', { ascending: false });
    if (region !== '全部') q = q.eq('region', region);
    if (topic !== '全部') q = q.eq('topic', topic);
    const { data } = await q;
    if (data) setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
    const sub = supabase.channel('public_posts').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [region, topic, supabase]);

  const handlePost = async () => {
    if (!userProfile) {
      showNotification("請先登錄以發布文章", "error");
      onAuthRequired();
      return;
    }
    if (!content.trim() || loading) return;
    setLoading(true);
    const { error } = await supabase.from('posts').insert({
      content, 
      region: region === '全部' ? '中國香港' : region, 
      topic: topic === '全部' ? '時事' : topic,
      author_id: userProfile.id
    });
    
    if (!error) {
      await supabase.from('profiles').update({ points: userProfile.points + 888 }).eq('id', userProfile.id);
      setContent(''); 
      showNotification("發布成功，獎勵 888 積分！");
    } else {
      showNotification("發布失敗，請重試", "error");
    }
    setLoading(false);
  };

  const handleAction = async (id: string, type: 'like' | 'heart') => {
    if (!userProfile) {
      showNotification("請先登錄參與互動", "error");
      onAuthRequired();
      return;
    }

    const actionKey = `${id}_${type}`;
    const currentCount = actionHistory[actionKey] || 0;

    if (currentCount >= 3) {
      showNotification(`您對此貼文的${type === 'like' ? '讚' : '心'}已達 3 次上限，請勿刷分`, "error");
      return;
    }

    const post = posts.find(p => p.id === id);
    if (!post) return;
    const updates = type === 'like' ? { likes: (post.likes || 0) + 1 } : { hearts: (post.hearts || 0) + 1 };
    
    await supabase.from('posts').update(updates).eq('id', id);
    await supabase.from('profiles').update({ points: userProfile.points + 150 }).eq('id', userProfile.id);
    
    setActionHistory(prev => ({ ...prev, [actionKey]: currentCount + 1 }));
    showNotification(`互動成功！積分 +150 (剩餘次數: ${2 - currentCount})`);
  };

  const handleTranslate = async (post: Post) => {
    if (translatingId) return;
    setTranslatingId(post.id);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Translate the following news content to ${post.is_bot && post.region.includes('香港') ? 'English' : 'Traditional Chinese'}. 
      Return ONLY the translated text.\n\nContent: ${post.content}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      const translatedText = response.text || "Translation Failed";
      
      setPosts(prev => prev.map(p => p.id === post.id ? { 
        ...p, 
        translated_content: translatedText,
        is_translated: !p.is_translated 
      } : p));

    } catch (err) {
      showNotification("翻譯服務暫時不可用", "error");
    } finally {
      setTranslatingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* --- 左側邊欄 (Left Sidebar) --- */}
      <div className="hidden lg:block lg:col-span-1 space-y-6">
         {/* 新增按鈕：HKER Token 詳細資料 */}
         <button 
           onClick={() => setView('token_info')}
           className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-[2rem] shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all group border-b-4 border-yellow-700"
         >
           <div className="flex items-center gap-3">
             <Info size={24} className="group-hover:rotate-12 transition-transform" />
             <span className="font-black text-sm uppercase tracking-tighter">HKER Token 詳細資</span>
           </div>
           <TrendingUp size={18} />
         </button>

         {/* 1. 地區篩選 - 第一高位 */}
         <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 ring-2 ring-yellow-500/10">
            <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Globe size={18} className="text-yellow-500"/> 地區篩選 (REGION)
            </h3>
            <div className="flex flex-col gap-1.5">
               {['全部', ...REGIONS].map(r => (
                 <button 
                  key={r} 
                  onClick={() => setRegion(r)} 
                  className={`text-left px-4 py-3 rounded-2xl text-sm transition-all flex items-center justify-between group ${region === r ? 'bg-yellow-500 text-black font-black shadow-lg scale-[1.02]' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
                 >
                    {r}
                    {region === r && <TrendingUp size={14} className="animate-bounce text-black"/>}
                 </button>
               ))}
            </div>
         </div>

         {/* 2. 主題篩選 - 第二高位 */}
         <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100">
            <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Award size={18} className="text-yellow-500"/> 熱門話題 (TOPICS)
            </h3>
            <div className="flex flex-wrap gap-2.5">
               {['全部', ...TOPICS].map(t => (
                 <button 
                  key={t} 
                  onClick={() => setTopic(t)} 
                  className={`px-4 py-2.5 rounded-full text-[10px] font-black border transition-all ${topic === t ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105' : 'border-slate-100 text-slate-400 hover:border-slate-300 bg-slate-50'}`}
                 >
                    {t}
                 </button>
               ))}
            </div>
         </div>

         {/* 系統狀態摘要 */}
         <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Cpu size={40} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-black text-xs uppercase tracking-tighter mb-4">AI 核心狀態</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>網頁/手機同步</span>
                <span className="text-green-400">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>即時數據流</span>
                <span className="text-yellow-500 font-mono tracking-tighter">CONNECTED</span>
              </div>
            </div>
         </div>
      </div>

      {/* --- 中間：主內容區 (Middle Feed) --- */}
      <div className="lg:col-span-3 space-y-8 order-1 lg:order-none">
         {userProfile ? (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-50 group animate-in fade-in duration-700">
               <div className="flex gap-5 mb-6">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.id}`} className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-50 shadow-sm transition-transform group-hover:rotate-3" alt="me" />
                  <textarea 
                   value={content} 
                   onChange={e=>setContent(e.target.value)} 
                   placeholder="分享你的 Web3 見解，獲得 888 積分獎勵..." 
                   className="w-full bg-slate-50 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white h-32 resize-none transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-inner" 
                  />
               </div>
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest px-2">
                    <Sparkles size={12} className="text-yellow-500"/> 發布至：{region} / {topic}
                  </div>
                  <button 
                   onClick={handlePost} 
                   disabled={loading}
                   className="bg-slate-900 text-white font-black px-12 py-4 rounded-full hover:bg-yellow-500 hover:text-black shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                   {loading ? '加載中...' : '發布文章'}
                  </button>
               </div>
            </div>
         ) : (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5">
               <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:bg-yellow-500/10 transition-colors duration-1000" />
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-inner">
                     <Lock size={48} className="text-yellow-500 animate-pulse" />
                  </div>
                  <div className="text-center md:text-left">
                     <h3 className="text-3xl font-black text-white mb-3 tracking-tight">解鎖 HKER 專屬社群</h3>
                     <p className="text-slate-400 text-base font-medium leading-relaxed max-w-lg opacity-80">
                       加入我們的 Web3 專業網絡。新成員註冊即領 <span className="text-yellow-500 font-black">88,888 HKER PT</span> 並開始賺取社交獎勵。
                     </p>
                  </div>
                  <button 
                     onClick={onAuthRequired}
                     className="md:ml-auto bg-yellow-500 text-slate-900 px-10 py-5 rounded-[2rem] font-black text-sm flex items-center gap-3 hover:bg-white transition-all shadow-2xl active:scale-95 whitespace-nowrap"
                  >
                     <UserPlus size={20}/> 立即獲取積分
                  </button>
               </div>
            </div>
         )}

         {/* 帖子列表 */}
         <div className="space-y-6">
            {posts.map(post => (
              <div key={post.id} className={`bg-white p-8 rounded-[2.5rem] shadow-sm border ${post.is_bot ? 'border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20' : 'border-slate-50'} hover:border-yellow-500/30 hover:shadow-xl transition-all group animate-in slide-in-from-bottom-5 duration-500 relative`}>
                 
                 {post.is_bot && (
                   <div className="absolute -top-3 left-10">
                      <div className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 border-2 border-white">
                        <Cpu size={12}/> AI NEWS BOT
                      </div>
                   </div>
                 )}

                 <div className="flex justify-between mb-6">
                    <div className="flex items-center gap-4">
                       <div className="relative">
                         <img 
                          src={post.is_bot ? `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${post.id}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`} 
                          className={`w-12 h-12 rounded-xl border border-slate-100 group-hover:scale-110 transition-transform shadow-sm ${post.is_bot ? 'bg-indigo-50' : 'bg-slate-50'}`} 
                          alt="author" 
                         />
                         {post.is_bot && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>}
                       </div>
                       <div>
                          <p className="font-black text-slate-900 text-base">{post.is_bot ? 'HKER 新聞專員' : (post.profiles?.nickname || '匿名會員')}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="px-2.5 py-1 bg-slate-50 text-slate-400 text-[9px] font-black rounded-lg uppercase tracking-widest border border-slate-100">{post.region}</span>
                             <span className="text-slate-200">/</span>
                             <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-yellow-100">{post.topic}</span>
                             <span className="flex items-center gap-1 text-[9px] text-slate-300 font-bold ml-2">
                               <Clock size={10}/> {new Date(post.created_at).toLocaleString()}
                             </span>
                          </div>
                       </div>
                    </div>
                    
                    {post.is_bot && (
                      <button 
                        onClick={() => handleTranslate(post)}
                        disabled={!!translatingId}
                        className="h-fit px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 disabled:opacity-50"
                      >
                        <Languages size={14} className={translatingId === post.id ? 'animate-spin' : ''} />
                        {post.is_translated ? '顯示原文' : 'AI 翻譯 (ZH/EN)'}
                      </button>
                    )}
                 </div>
                 
                 <p className="text-slate-600 leading-relaxed mb-8 whitespace-pre-wrap font-medium text-sm md:text-base border-l-4 border-slate-50 pl-6 group-hover:border-yellow-500 transition-colors">
                   {post.is_translated ? post.translated_content : post.content}
                 </p>

                 {post.is_bot && post.source_name && (
                   <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-slate-400"/>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">來源：{post.source_name}</span>
                      </div>
                      <a 
                        href={post.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:underline"
                      >
                        閱讀原文 <ExternalLink size={12}/>
                      </a>
                   </div>
                 )}

                 <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-8">
                      <button onClick={()=>handleAction(post.id, 'like')} className="flex items-center gap-2.5 text-slate-400 hover:text-yellow-600 transition-all font-black text-[11px] uppercase tracking-[0.15em] group/btn">
                         <div className="p-2.5 bg-slate-50 rounded-xl group-hover/btn:bg-yellow-50 transition-colors relative">
                            <ThumbsUp size={18} className="group-hover/btn:scale-110 transition-transform" /> 
                            {actionHistory[`${post.id}_like`] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                {actionHistory[`${post.id}_like`]}
                              </span>
                            )}
                         </div>
                         <span>{post.likes || 0} 支持</span>
                      </button>
                      <button onClick={()=>handleAction(post.id, 'heart')} className="flex items-center gap-2.5 text-slate-400 hover:text-pink-600 transition-all font-black text-[11px] uppercase tracking-[0.15em] group/btn">
                         <div className="p-2.5 bg-slate-50 rounded-xl group-hover/btn:bg-pink-50 transition-colors relative">
                            <Heart size={18} className="group-hover/btn:scale-110 transition-transform" /> 
                            {actionHistory[`${post.id}_heart`] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                {actionHistory[`${post.id}_heart`]}
                              </span>
                            )}
                         </div>
                         <span>{post.hearts || 0} 熱愛</span>
                      </button>
                    </div>

                    {post.is_bot && (
                      <div className="flex items-center gap-2 text-slate-300 font-black text-[9px] uppercase tracking-widest italic bg-slate-50 px-4 py-2 rounded-lg">
                        <MessageSquareOff size={14}/> 系統鎖定：此新聞不可留言
                      </div>
                    )}
                 </div>
              </div>
            ))}
         </div>
      </div>
      
      {/* 手機版快速篩選器 - 始終顯示於頂部 */}
      <div className="lg:hidden flex flex-col gap-4 mb-6">
         <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
            <span className="bg-yellow-500 text-black px-4 py-2 rounded-full text-[10px] font-black whitespace-nowrap flex items-center gap-1 shrink-0"><Globe size={12}/> 地區</span>
            {['全部', ...REGIONS].map(r => (
              <button key={r} onClick={() => setRegion(r)} className={`px-4 py-2 rounded-full text-[10px] font-black whitespace-nowrap border transition-all ${region === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-400'}`}>{r}</button>
            ))}
         </div>
         <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
            <span className="bg-slate-100 text-slate-400 px-4 py-2 rounded-full text-[10px] font-black whitespace-nowrap flex items-center gap-1 shrink-0"><Award size={12}/> 主題</span>
            {['全部', ...TOPICS].map(t => (
              <button key={t} onClick={() => setTopic(t)} className={`px-4 py-2 rounded-full text-[10px] font-black whitespace-nowrap border transition-all ${topic === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-400'}`}>{t}</button>
            ))}
         </div>
      </div>

    </div>
  );
};

export default ForumView;
