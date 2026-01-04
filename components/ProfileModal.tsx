
import React, { useState } from 'react';
import { Profile } from '../types';
import { X, User, Phone, MapPin, Wallet, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  profile: Profile;
  onClose: () => void;
  supabase: any;
  onUpdate: () => void;
}

const ProfileModal: React.FC<Props> = ({ isOpen, profile, onClose, supabase, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: profile.name,
    phone: profile.phone || '',
    address: profile.address || '',
    sol_address: profile.sol_address || '',
    gender: profile.gender
  });

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update(editData).eq('id', profile.id);
      if (error) throw error;
      alert('資料已成功同步更新！');
      onUpdate();
    } catch (err: any) {
      alert(err.message);
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
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="text-blue-400" /> 用戶設定中心
            </h2>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X /></button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl mb-6">
              <img src={profile.avatar_url} className="w-16 h-16 rounded-full border-2 border-blue-500" alt="avatar" />
              <div>
                <h3 className="text-white font-bold">{profile.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{profile.id}</p>
                <p className="text-xs text-yellow-500 font-bold mt-1">HKER 積分: {profile.points.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" placeholder="真實姓名" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="tel" placeholder="聯絡電話" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" placeholder="聯絡地址" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white" value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} />
              </div>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" placeholder="SOL Address (提幣用)" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white" value={editData.sol_address} onChange={e => setEditData({...editData, sol_address: e.target.value})} />
              </div>
              <select 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                value={editData.gender} onChange={e => setEditData({...editData, gender: e.target.value as 'M' | 'F'})}
              >
                <option value="M">男 (Male)</option>
                <option value="F">女 (Female)</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 bg-slate-800 text-red-400 font-bold px-6 py-4 rounded-xl hover:bg-slate-700 transition-all"
              >
                <LogOut size={18} /> 登出
              </button>
              <button 
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin mx-auto" /> : '更新並同步資料'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
