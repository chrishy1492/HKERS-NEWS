
import React, { useState } from 'react';
import { 
  X, User, Shield, Wallet, Save, RefreshCw, Key, 
  Mail, Phone, MapPin, Coins, CheckCircle2, Info, Camera,
  Lock, Eye, EyeOff, Award, Sparkles
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../../types';
import { AVATARS } from '../../constants';

interface UserProfileSettingsProps {
  supabase: SupabaseClient;
  userProfile: UserProfile;
  onClose: () => void;
  onRefresh: () => void;
}

const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({ 
  supabase, userProfile, onClose, onRefresh 
}) => {
  // 1. 入會資料與個人化狀態
  const [nickname, setNickname] = useState(userProfile.nickname);
  const [avatar, setAvatar] = useState(userProfile.avatar_url);
  const [fullName, setFullName] = useState(userProfile.full_name || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [address, setAddress] = useState(userProfile.physical_address || '');
  const [gender, setGender] = useState(userProfile.gender || 'Secret');
  const [solAddress, setSolAddress] = useState(userProfile.sol_address || '');
  
  // 2. 帳號安全性狀態
  const [email, setEmail] = useState(userProfile.email);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 儲存一般資料更新
  const handleSaveProfile = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nickname, 
          avatar_url: avatar,
          full_name: fullName,
          phone: phone,
          physical_address: address,
          gender: gender,
          sol_address: solAddress
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      
      setMsg({ type: 'success', text: "帳戶資料同步成功！已更新至雲端伺服器。" });
      onRefresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setMsg({ type: 'error', text: "更新失敗: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  // 儲存帳號安全更新 (電郵/密碼)
  const handleSecurityUpdate = async (target: 'email' | 'password') => {
    setSaving(true);
    setMsg(null);
    try {
      if (target === 'email') {
        if (email === userProfile.email) return;
        const { error } = await (supabase.auth as any).updateUser({ email });
        if (error) throw error;
        setMsg({ type: 'success', text: "電郵更新請求已發送，請檢查新信箱進行確認。" });
      } else {
        if (!newPassword || newPassword.length < 6) throw new Error("密碼長度至少需要 6 位。");
        const { error } = await (supabase.auth as any).updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword('');
        setMsg({ type: 'success', text: "安全性密碼已重設，下次登入請使用新密碼。" });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: "修改失敗: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* 帳戶頂部輝煌概覽卡片 - 包含不可修改的積分 */}
      <div className="relative bg-slate-900 rounded-[48px] p-8 md:p-12 text-white overflow-hidden shadow-2xl border border-white/5 mb-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <img src={avatar} alt="Profile" className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] border-4 border-slate-700 shadow-2xl object-cover transition-transform group-hover:scale-105" />
              <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2.5 rounded-2xl shadow-xl border-4 border-slate-900">
                <Award size={24} className="text-white" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h2 className="text-4xl font-black tracking-tight">{nickname}</h2>
                <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-600/30">HKER Nexus Member</span>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 text-xs flex items-center justify-center md:justify-start gap-2">
                <Shield size={14} className="text-blue-500" />
                CITIZEN ID: {userProfile.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 px-10 py-7 rounded-[40px] flex items-center gap-6 backdrop-blur-2xl">
            <div className="w-16 h-16 bg-amber-500/20 rounded-3xl flex items-center justify-center border border-amber-500/30">
              <Coins size={32} className="text-amber-400" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">HKER Token 積分 (唯讀)</span>
              <span className="text-5xl font-black text-amber-400 font-mono tracking-tighter">
                {userProfile.points.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`mb-10 p-6 rounded-3xl border flex items-center gap-4 animate-in slide-in-from-top-4 shadow-xl ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <Info size={24} className={msg.type === 'success' ? 'text-green-600' : 'text-red-600'} />
          <p className="font-black text-sm">{msg.text}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* 左側：頭像選取模組 */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <Camera size={20} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">更換頭像 / AVATAR (88 選擇)</h3>
            </div>
            <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {AVATARS.map((url, idx) => (
                <button 
                  key={idx}
                  onClick={() => setAvatar(url)}
                  className={`relative aspect-square rounded-2xl border-4 transition-all overflow-hidden ${avatar === url ? 'border-blue-600 ring-4 ring-blue-500/10 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={url} alt={`Avt ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className="mt-6 text-[10px] text-slate-400 font-black text-center uppercase tracking-[0.2em]">點擊頭像即可即時切換</p>
          </div>
        </div>

        {/* 右側：資料編輯區 */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* 個人入會詳細資料表單 */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <User size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">編輯個人檔案</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">論壇暱稱 *</label>
                <input className="premium-edit-input" value={nickname} onChange={e => setNickname(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">真實姓名</label>
                <input className="premium-edit-input" placeholder="用於實務通訊" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">聯絡電話</label>
                <input className="premium-edit-input" placeholder="+852 9000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">性別</label>
                <select className="premium-edit-input appearance-none cursor-pointer" value={gender} onChange={e => setGender(e.target.value as any)}>
                  <option value="Male">男 / Male</option>
                  <option value="Female">女 / Female</option>
                  <option value="Other">其他 / Other</option>
                  <option value="Secret">保密 / Secret</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">通訊地址 / PHYSICAL ADDRESS</label>
              <textarea 
                rows={3}
                className="premium-edit-input pt-4 resize-none"
                placeholder="輸入您的居住或通訊地址..."
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">SOLANA 錢包地址</label>
              <div className="relative">
                <Wallet size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  className="premium-edit-input pl-14 font-mono text-xs"
                  placeholder="尚未設定 SOL 地址"
                  value={solAddress}
                  onChange={e => setSolAddress(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[28px] transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
            >
              {saving ? <RefreshCw className="animate-spin" size={24} /> : <Save size={24} />}
              <span>同步更新個人資料</span>
            </button>
          </div>

          {/* 帳號安全性模組：電郵與密碼 */}
          <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-200 shadow-xl space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-8">
              <div className="p-3 bg-white rounded-2xl text-slate-900 border border-slate-200 shadow-sm">
                <Lock size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">安全中心 / SECURITY</h3>
            </div>

            <div className="space-y-8">
              {/* 電郵變更 */}
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">變更電子郵件</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input className="premium-edit-input bg-white pl-14" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <button 
                  onClick={() => handleSecurityUpdate('email')}
                  disabled={email === userProfile.email || saving}
                  className="w-full md:w-auto bg-white border-2 border-slate-200 hover:border-blue-600 text-blue-600 font-black px-10 py-4 rounded-2xl text-xs transition-all disabled:opacity-30"
                >
                  確認同步電郵
                </button>
              </div>

              {/* 密碼重設 */}
              <div className="flex flex-col md:flex-row gap-6 items-end border-t border-slate-200 pt-8">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">設定新安全密碼</label>
                  <div className="relative">
                    <Key size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      className="premium-edit-input bg-white pl-14 pr-14" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="輸入新密碼 (至少6位)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => handleSecurityUpdate('password')}
                  disabled={!newPassword || saving}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl text-xs transition-all shadow-xl shadow-blue-500/20 disabled:opacity-30 flex items-center gap-2"
                >
                  <Key size={14} />
                  確認修改密碼
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .premium-edit-input {
          width: 100%;
          background-color: #ffffff;
          border: 2px solid #f1f5f9;
          border-radius: 24px;
          padding: 16px 20px;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          transition: all 0.2s;
        }
        .premium-edit-input:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default UserProfileSettings;
