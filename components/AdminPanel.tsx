
import React, { useState, useContext, useMemo } from 'react';
import { Shield, Users, Search, Trash2, Edit, Activity, BarChart3, Clock, TrendingUp, Save, X } from 'lucide-react';
import { DataContext } from '../contexts/DataContext';
import { User, UserRole } from '../types';

export const AdminPanel: React.FC = () => {
  const { users, visitorLogs, adminUpdateUser, deleteUser } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members'>('dashboard');
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 1. 流量統計分析 (Hourly Analytics)
  const stats = useMemo(() => {
    const now = new Date();
    const Y = now.getFullYear().toString();
    const M = (now.getMonth() + 1).toString();
    const D = now.getDate().toString();
    
    let todayLogins = 0;
    let todayGuests = 0;
    
    if (visitorLogs[Y]?.[M]?.[D]) {
      Object.values(visitorLogs[Y][M][D]).forEach((h: any) => {
        todayLogins += h.members;
        todayGuests += h.guests;
      });
    }

    return { todayLogins, todayGuests, totalUsers: users.length };
  }, [visitorLogs, users]);

  // 2. 會員過濾 (Filtering)
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdate = () => {
    if (editingUser) {
      adminUpdateUser(editingUser.id, editingUser);
      setEditingUser(null);
      alert("全平台數據已實時同步完成。");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
      {/* Header Tabs */}
      <div className="bg-slate-900 p-2 flex gap-1">
         <button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <BarChart3 size={16}/> 流量控制台 (Real-time Stats)
         </button>
         <button onClick={() => setActiveTab('members')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'members' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <Users size={16}/> 會員管理表 (Full Member List)
         </button>
      </div>

      <div className="p-4 md:p-8">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
                   <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg"><Users size={24}/></div>
                   <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase">註冊會員總數</p>
                      <p className="text-3xl font-black text-slate-900">{stats.totalUsers}</p>
                   </div>
                </div>
                <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center gap-4">
                   <div className="bg-green-600 text-white p-3 rounded-2xl shadow-lg"><Activity size={24}/></div>
                   <div>
                      <p className="text-[10px] font-black text-green-600 uppercase">今日登錄人次</p>
                      <p className="text-3xl font-black text-slate-900">{stats.todayLogins}</p>
                   </div>
                </div>
                <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 flex items-center gap-4">
                   <div className="bg-purple-600 text-white p-3 rounded-2xl shadow-lg"><TrendingUp size={24}/></div>
                   <div>
                      <p className="text-[10px] font-black text-purple-600 uppercase">今日訪客流量</p>
                      <p className="text-3xl font-black text-slate-900">{stats.todayGuests}</p>
                   </div>
                </div>
             </div>

             <div className="bg-slate-50 p-6 rounded-3xl border border-gray-200">
                <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
                  <Clock size={16}/> 即時監控日誌 (Hourly Monitoring Log)
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                   {Object.entries(visitorLogs).reverse().map(([Y, months]) => 
                      Object.entries(months).reverse().map(([M, days]) => 
                        Object.entries(days).reverse().map(([D, hours]) => 
                           Object.entries(hours).reverse().map(([H, data]: [string, any]) => (
                             <div key={`${Y}-${M}-${D}-${H}`} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center text-xs font-bold">
                                <span className="text-gray-400">{Y}/{M}/{D} {H}:00</span>
                                <div className="flex gap-4">
                                   <span className="text-blue-600">會員: {data.members}</span>
                                   <span className="text-slate-400">訪客: {data.guests}</span>
                                </div>
                             </div>
                           ))
                        )
                      )
                   )}
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="搜尋編號 ID / 姓名 / 電郵..." 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-sm shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
             </div>

             {editingUser ? (
               <div className="bg-white border-2 border-blue-500 p-6 rounded-3xl shadow-xl animate-fade-in relative">
                  <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X/></button>
                  <h3 className="font-black text-lg mb-6 flex items-center gap-2 text-blue-600">
                    <Edit size={20}/> 修改用戶資料：{editingUser.id}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">HKER Token 積分</label>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-xl font-black text-blue-600 text-xl"
                          value={editingUser.points}
                          onChange={e => setEditingUser({...editingUser, points: parseInt(e.target.value) || 0})}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">權限級別</label>
                        <select 
                          className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold"
                          value={editingUser.role}
                          onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                        >
                           <option value="user">普通用戶</option>
                           <option value="moderator">版主</option>
                           <option value="admin">管理員</option>
                        </select>
                     </div>
                  </div>
                  <button onClick={handleUpdate} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2"><Save size={18}/> 保存並同步</button>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-3">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div className="flex items-center gap-4">
                          <img src={u.avatar} className="w-12 h-12 rounded-2xl bg-slate-100" />
                          <div>
                             <div className="font-black text-slate-900 flex items-center gap-2">
                               {u.name} 
                               <span className="bg-slate-100 text-[9px] px-2 py-0.5 rounded text-slate-500 font-mono tracking-tighter uppercase">{u.id}</span>
                             </div>
                             <div className="text-[10px] text-gray-400 font-bold">{u.email}</div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                          <div className="text-right">
                             <div className="text-[9px] font-black text-gray-400 uppercase">HKER Token</div>
                             <div className="font-mono font-black text-blue-600">{u.points.toLocaleString()}</div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => setEditingUser(u)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition"><Edit size={18}/></button>
                             {u.role !== 'admin' && (
                               <button onClick={() => {if(confirm(`確定永久移除編號 ${u.id} 的帳戶？`)) deleteUser(u.id)}} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 size={18}/></button>
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
