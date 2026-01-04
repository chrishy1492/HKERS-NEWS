
import React, { useState } from 'react';
import { Profile } from '../types';
import { X, User, Phone, MapPin, Wallet, LogOut, ShieldCheck, RefreshCw, Mail, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  profile: Profile;
  onClose: () => void;
  supabase: any;
  onUpdate: () => void;
}

const ProfileModal: React.FC<Props> = ({ isOpen, profile, onClose, supabase, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  
  // Info Edit State
  const [editData, setEditData] = useState({
    name: profile.name,
    phone: profile.phone || '',
    address: profile.address || '',
    sol_address: profile.sol_address || '',
    gender: profile.gender,
    email: profile.email
  });

  // Security Edit State
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const handleUpdateInfo = async () => {
    setLoading(true);
    try {
      // 1. Update Profile Table
      const { error } = await supabase.from('profiles').update({
        name: editData.name,
        phone: editData.phone,
        address: editData.address,
        sol_address: editData.sol_address,
        gender: editData.gender,
        email: editData.email
      }).eq('id', profile.id);

      if (error) throw error;

      // 2. Update Auth Email if changed (Requires confirmation usually, but attempting here)
      if (editData.email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: editData.email });
        if (authError) throw authError;
        alert('電郵已更新，請檢查信箱進行驗證。');
      }

      alert('個人資料已成功更新！');
      onUpdate();
    } catch (err: any) {
      alert('更新失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return alert("請輸入新密碼");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('密碼修改成功！');
      setNewPassword('');
    } catch (err: any) {
      alert('密碼修改失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="text-blue-400" /> 帳戶管理
            </h2>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X /></button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'info' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              基本資料
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'security' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              安全設定
            </button>
          </div>

          {activeTab === 'info' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl mb-2">
                <img src={profile.avatar_url} className="w-12 h-12 rounded-full border-2 border-blue-500" alt="avatar" />
                <div>
                  <h3 className="text-white font-bold">{profile.name}</h3>
                  <p className="text-xs text-yellow-500 font-bold mt-1">積分: {profile.points.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input type="text" placeholder="姓名" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input type="email" placeholder="電郵" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input type="tel" placeholder="電話" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input type="text" placeholder="地址" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white" value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} />
                </div>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input type="text" placeholder="SOL Address (重要: 提幣用)" className="w-full bg-slate-800 border border-yellow-600/30 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:border-yellow-500" value={editData.sol_address} onChange={e => setEditData({...editData, sol_address: e.target.value})} />
                </div>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                  value={editData.gender} onChange={e => setEditData({...editData, gender: e.target.value as 'M' | 'F'})}
                >
                  <option value="M">男</option>
                  <option value="F">女</option>
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={handleLogout} className="bg-slate-800 text-red-400 font-bold px-4 py-3 rounded-xl hover:bg-slate-700"><LogOut size={18} /></button>
                <button onClick={handleUpdateInfo} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98]">
                  {loading ? <RefreshCw className="animate-spin mx-auto" size={18} /> : '儲存修改'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-200">
                <p>請輸入新的密碼。修改後您可能需要重新登入。</p>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  placeholder="輸入新密碼 (New Password)" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-white outline-none focus:border-red-500 transition-all"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <button 
                onClick={handleUpdatePassword} 
                disabled={loading || !newPassword}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin mx-auto" /> : '確認更改密碼'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
