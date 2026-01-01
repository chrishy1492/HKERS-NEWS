
import React, { useState } from 'react';
import { Settings, Award, LogOut, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { TIERS, calculateTier } from '../constants';
import { UserProfile, AppView } from '../types';

interface ProfileViewProps {
  supabase: any;
  userProfile: UserProfile | null;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
  setView: (view: AppView) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ supabase, userProfile, showNotification, setView }) => {
  const [sol, setSol] = useState(userProfile?.sol_address || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!userProfile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ sol_address: sol }).eq('id', userProfile.id);
    if (!error) showNotification("地址更新成功");
    else showNotification("更新失敗", "error");
    setSaving(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setView('forum');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <div className="bg-slate-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.id}`} className="w-32 h-32 rounded-full border-4 border-yellow-500 shadow-2xl z-10 bg-white" alt="avatar" />
          <div className="z-10 text-center md:text-left">
             <h1 className="text-4xl font-black mb-2">{userProfile?.nickname || '會員'}</h1>
             <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <span className="bg-slate-800 px-4 py-1.5 rounded-full text-xs font-bold text-yellow-500 border border-slate-700 uppercase tracking-tighter">
                   {calculateTier(userProfile?.points).name} {calculateTier(userProfile?.points).icon}
                </span>
                <span className="bg-slate-800 px-4 py-1.5 rounded-full text-xs font-bold text-slate-400 border border-slate-700">
                   UID: {userProfile?.id?.slice(0, 8)}
                </span>
             </div>
          </div>
          <div className="md:ml-auto text-center md:text-right z-10">
             <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">帳戶總資產</p>
             <p className="text-5xl font-black text-white font-mono">{userProfile?.points?.toLocaleString()}</p>
             <p className="text-sm text-yellow-500 font-bold tracking-widest">HKER TOKENS</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
             <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><UserIcon size={20}/> 會員基本資料</h3>
             <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                   <UserIcon className="text-slate-400" size={18} />
                   <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">真實姓名</p>
                      <p className="font-bold">{userProfile?.name || '未填寫'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                   <Phone className="text-slate-400" size={18} />
                   <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">電話號碼</p>
                      <p className="font-bold">{userProfile?.phone || '未填寫'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                   <MapPin className="text-slate-400" size={18} />
                   <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">通訊地址</p>
                      <p className="font-bold text-sm">{userProfile?.address || '未填寫'}</p>
                   </div>
                </div>
             </div>
             
             <div className="mt-8 border-t border-slate-100 pt-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Settings size={20}/> 錢包設定</h3>
                <div className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Solana 接收地址</label>
                      <div className="flex gap-2">
                         <input value={sol} onChange={e=>setSol(e.target.value)} placeholder="SOL Address" className="w-full bg-slate-50 p-4 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs" />
                         <button onClick={save} disabled={saving} className="bg-slate-900 text-white px-6 rounded-2xl font-bold hover:bg-slate-800 transition">
                           {saving ? '...' : '儲存'}
                         </button>
                      </div>
                   </div>
                   <button 
                     onClick={() => showNotification((userProfile?.points || 0) < 1000000 ? "提幣需達到 1,000,000 PT" : "申請已提交", "error")} 
                     className="w-full bg-yellow-500 text-black py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-yellow-400 transition"
                   >
                     申請提幣至 SOLANA
                   </button>
                </div>
             </div>

             <button onClick={logout} className="mt-8 flex items-center justify-center gap-2 text-red-500 font-bold hover:text-red-700 transition">
                <LogOut size={18}/> 登出帳戶
             </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Award size={20}/> 成就與等級</h3>
             <div className="space-y-4">
                {TIERS.map(t => (
                  <div key={t.name} className={`flex justify-between items-center p-3 rounded-xl transition ${userProfile && userProfile.points >= t.required ? 'bg-yellow-50 border border-yellow-200 shadow-sm' : 'bg-slate-50 text-slate-300 opacity-60'}`}>
                     <span className="font-bold">{t.name} {t.icon}</span>
                     <span className="text-xs font-mono font-bold">{t.required.toLocaleString()} PT</span>
                  </div>
                ))}
             </div>
             <div className="mt-10 p-6 bg-slate-900 rounded-3xl text-white text-center">
                <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-2">專屬提現說明</p>
                <p className="text-[10px] opacity-70 leading-relaxed uppercase">
                   所有提現申請均需經過人工審核發帖質量。確保您的內容對社區有貢獻以獲得更快的審核。
                </p>
             </div>
          </div>
       </div>
    </div>
  );
};

export default ProfileView;
