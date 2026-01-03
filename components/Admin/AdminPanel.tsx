
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Coins, Trash2, Shield, Search, TrendingUp, 
  ChevronRight, Loader2, BarChart3, Clock, Calendar, 
  UserCheck, Save, Edit3, Megaphone, AlertTriangle, 
  FileText, ArrowUpRight, RefreshCw, Eye, Zap
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, Post } from '../../types';
import { AVATARS } from '../../constants';

interface AdminPanelProps {
  supabase: SupabaseClient;
}

type AdminTab = 'dashboard' | 'users' | 'content' | 'broadcast';

const AdminPanel: React.FC<AdminPanelProps> = ({ supabase }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // States for search and management
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState<number>(0);

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    const [uRes, pRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('posts').select('*').order('created_at', { ascending: false })
    ]);
    
    if (uRes.data) setUsers(uRes.data);
    if (pRes.data) setPosts(pRes.data);
    setLoading(false);
  };

  const handleUpdatePoints = async (id: string, newPoints: number) => {
    const { error } = await supabase.from('profiles').update({ points: newPoints }).eq('id', id);
    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, points: newPoints } : u));
      setEditingUserId(null);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("確定要永久刪除此帖嗎？此操作不可撤銷。")) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle || !broadcastContent) return;
    setIsBroadcasting(true);
    const { error } = await supabase.from('posts').insert([{
      title: `[系統公告] ${broadcastTitle}`,
      content: broadcastContent,
      author_name: "HKER Command",
      author_avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=NexusCommand&backgroundColor=ef4444",
      region: "All",
      topic: "公告",
      is_announcement: true,
      is_readonly: true,
      likes: 0,
      hearts: 0
    }]);

    if (!error) {
      alert("系統公告已成功發送到全體用戶 Feed！");
      setBroadcastTitle('');
      setBroadcastContent('');
      fetchAdminData();
    }
    setIsBroadcasting(false);
  };

  // --- 專業數據分析引擎 ---
  const analytics = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    
    const stats = {
      totalUsers: users.length,
      todayReg: 0,
      totalPosts: posts.length,
      totalPoints: 0,
      hourlyReg: Array(24).fill(0),
      monthlyReg: Array(12).fill(0),
    };

    users.forEach(u => {
      const created = new Date(u.created_at || '');
      stats.totalPoints += (u.points || 0);
      if (created.toDateString() === today) stats.todayReg++;
      stats.hourlyReg[created.getHours()]++;
      if (created.getFullYear() === now.getFullYear()) {
        stats.monthlyReg[created.getMonth()]++;
      }
    });

    return stats;
  }, [users, posts]);

  const filteredUsers = users.filter(u => 
    u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* Admin Header */}
      <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 mb-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-600/20">
                <Shield className="text-white" size={28} />
              </div>
              <h2 className="text-4xl font-black tracking-tighter italic uppercase">HKER Command Center</h2>
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">系統管理特權模式已激活</p>
          </div>
          
          <div className="flex bg-white/5 p-1.5 rounded-[24px] backdrop-blur-xl border border-white/5">
            {[
              { id: 'dashboard', label: '中心概覽', icon: <BarChart3 size={16}/> },
              { id: 'users', label: '帳戶管理', icon: <Users size={16}/> },
              { id: 'content', label: '內容監控', icon: <FileText size={16}/> },
              { id: 'broadcast', label: '發布公告', icon: <Megaphone size={16}/> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdminStatCard label="總註冊人數" value={analytics.totalUsers} icon={<Users/>} color="blue" />
            <AdminStatCard label="今日新增" value={analytics.todayReg} icon={<UserCheck/>} color="green" />
            <AdminStatCard label="全網發帖數" value={analytics.totalPosts} icon={<FileText/>} color="purple" />
            <AdminStatCard label="全域積分規模" value={(analytics.totalPoints / 1000000).toFixed(2) + 'M'} icon={<Coins/>} color="amber" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl">
               <h3 className="font-black text-slate-900 mb-8 flex items-center gap-2"><Clock size={18}/> 24小時註冊趨勢 (每小時)</h3>
               <div className="flex items-end justify-between h-48 gap-1 pt-4">
                 {analytics.hourlyReg.map((val, i) => (
                   <div key={i} className="flex-1 bg-blue-500/20 hover:bg-blue-600 transition-all rounded-t-sm relative group" style={{ height: `${(val / (Math.max(...analytics.hourlyReg) || 1)) * 100}%` }}>
                     <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover:opacity-100">{val}</span>
                   </div>
                 ))}
               </div>
               <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400"><span>00:00</span><span>12:00</span><span>23:59</span></div>
            </div>
            
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl">
               <h3 className="font-black text-slate-900 mb-8 flex items-center gap-2"><Calendar size={18}/> 年度增長趨勢 (每月)</h3>
               <div className="flex items-end justify-between h-48 gap-2 pt-4">
                 {analytics.monthlyReg.map((val, i) => (
                   <div key={i} className="flex-1 bg-red-500/20 hover:bg-red-600 transition-all rounded-t-lg relative group" style={{ height: `${(val / (Math.max(...analytics.monthlyReg) || 1)) * 100}%` }}>
                     <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover:opacity-100">{val}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <Search className="text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索全域帳戶 (暱稱、Email、UID)..." 
              className="w-full bg-transparent border-none focus:ring-0 font-bold"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-8 py-5">用戶身分</th>
                    <th className="px-8 py-5">電郵 / 角色</th>
                    <th className="px-8 py-5">積分資產</th>
                    <th className="px-8 py-5 text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img className="w-12 h-12 rounded-2xl" src={u.avatar_url} alt="Avt" />
                          <div>
                            <div className="font-black text-slate-900">{u.nickname}</div>
                            <div className="text-[9px] font-mono text-slate-400">ID: {u.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-600">{u.email}</div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span>
                      </td>
                      <td className="px-8 py-6">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-32 bg-slate-100 border-2 border-red-500 rounded-xl px-3 py-1.5 font-black text-sm"
                              value={editPoints}
                              onChange={e => setEditPoints(parseInt(e.target.value) || 0)}
                            />
                            <button onClick={() => handleUpdatePoints(u.id, editPoints)} className="p-2 bg-slate-900 text-white rounded-xl"><Save size={16}/></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 font-black text-slate-900 text-lg">
                            <Coins size={18} className="text-amber-500" />
                            <span>{u.points?.toLocaleString()}</span>
                            <button onClick={() => { setEditingUserId(u.id); setEditPoints(u.points || 0); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-slate-900 transition-all"><Edit3 size={14}/></button>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button className="text-[10px] font-black uppercase text-slate-400 hover:text-red-600 transition-all">封禁帳戶</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Tab: Content */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><FileText size={18}/> 全域內容流監控 (按時間降序)</h3>
              <button onClick={fetchAdminData} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><RefreshCw size={20}/></button>
           </div>
           <div className="divide-y divide-slate-50">
              {posts.map(p => (
                <div key={p.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all group">
                   <div className="flex items-center gap-6">
                      <div className="text-xs font-black text-slate-300">{new Date(p.created_at).getHours()}H</div>
                      <div>
                        <div className="font-black text-slate-900 flex items-center gap-2">
                          {p.title}
                          {p.is_announcement && <span className="bg-red-500 text-white text-[8px] px-1.5 rounded-sm">公告</span>}
                        </div>
                        <div className="text-xs font-bold text-slate-400 mt-1">作者: {p.author_name} | 區域: {p.region} | 主題: {p.topic}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <button onClick={() => handleDeletePost(p.id)} className="p-3 bg-red-50 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Tab: Broadcast */}
      {activeTab === 'broadcast' && (
        <div className="max-w-3xl mx-auto animate-in zoom-in duration-500">
           <div className="bg-slate-900 rounded-[48px] p-10 md:p-16 text-white shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>
              <div className="relative z-10 space-y-8">
                 <div className="text-center">
                    <div className="w-20 h-20 bg-red-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                       <Megaphone size={40} className="text-red-500 animate-bounce" />
                    </div>
                    <h3 className="text-3xl font-black italic tracking-tighter">GLOBAL BROADCAST</h3>
                    <p className="text-slate-400 text-sm font-medium mt-2">發布全域公告，訊息將呈現在全體用戶 Feed 頂部</p>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-4">公告標題 / TITLE</label>
                       <input 
                         className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 font-black text-xl outline-none focus:border-red-500 transition-all"
                         placeholder="輸入緊急標語或更新標題..."
                         value={broadcastTitle}
                         onChange={e => setBroadcastTitle(e.target.value)}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-4">公告內容 / CONTENT</label>
                       <textarea 
                         className="w-full bg-white/5 border border-white/10 rounded-[32px] p-8 font-medium text-lg min-h-[200px] outline-none focus:border-red-500 transition-all resize-none"
                         placeholder="在此撰寫公告詳細內容..."
                         value={broadcastContent}
                         onChange={e => setBroadcastContent(e.target.value)}
                       />
                    </div>
                 </div>

                 <div className="p-6 bg-red-950/30 border border-red-500/20 rounded-3xl flex items-start gap-4 text-xs text-red-300">
                    <AlertTriangle className="flex-shrink-0" size={18} />
                    <p className="font-bold italic">注意：公告發布後無法在後台修改內容，僅能透過刪除重建。請檢查內容正確性。</p>
                 </div>

                 <button 
                   onClick={sendBroadcast}
                   disabled={isBroadcasting || !broadcastTitle || !broadcastContent}
                   className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-[32px] font-black text-xl uppercase tracking-[0.2em] shadow-2xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-30"
                 >
                   {isBroadcasting ? <Loader2 className="animate-spin" /> : <Zap size={24} fill="white" />}
                   <span>{isBroadcasting ? '正在廣播中...' : '發布全網廣播'}</span>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminStatCard = ({ label, value, icon, color }: { label: string, value: any, icon: any, color: 'blue' | 'green' | 'purple' | 'amber' }) => {
  const themes = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/5',
    green: 'bg-green-50 text-green-600 border-green-100 shadow-green-500/5',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 shadow-purple-500/5',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/5'
  };

  return (
    <div className={`p-8 rounded-[40px] border transition-all hover:scale-105 shadow-xl ${themes[color]}`}>
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-inner">
        {React.cloneElement(icon as React.ReactElement, { size: 28 })}
      </div>
      <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
};

export default AdminPanel;
