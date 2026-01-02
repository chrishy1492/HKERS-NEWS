
import React, { useState } from 'react';
import { 
  User, Shield, Wallet, Save, RefreshCw, 
  Mail, Phone, MapPin, Coins, Info, Camera,
  Lock, Award, AlertTriangle, CheckCircle2, X
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
  // --- 1. 一般資料狀態 (Public Profile) ---
  const [nickname, setNickname] = useState(userProfile.nickname || '');
  const [avatar, setAvatar] = useState(userProfile.avatar_url || AVATARS[0]);
  const [fullName, setFullName] = useState(userProfile.full_name || ''); 
  const [address, setAddress] = useState(userProfile.physical_address || ''); 
  const [phone, setPhone] = useState(userProfile.phone || ''); 
  const [solAddress, setSolAddress] = useState(userProfile.sol_address || ''); 
  const [gender, setGender] = useState(userProfile.gender || 'Secret'); 

  // --- 2. 安全資料狀態 (Auth Security) ---
  const [email, setEmail] = useState(userProfile.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- 3. UI 狀態 ---
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- 函數 A: 儲存一般個人檔案 (Profile Table) ---
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setMsg(null);
    try {
      const updates = {
        nickname,
        avatar_url: avatar,
        full_name: fullName,
        phone: phone,
        physical_address: address, // 映射到資料庫的 physical_address 欄位
        gender: gender,
        sol_address: solAddress,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userProfile.id);

      if (error) throw error;
      
      setMsg({ type: 'success', text: "個人檔案資料已成功更新！ / Profile Updated Successfully." });
      onRefresh(); // 刷新 App 層級數據
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setMsg({ type: 'error', text: "更新失敗: " + err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  // --- 函數 B: 更新安全憑證 (Auth System) ---
  const handleSecurityUpdate = async () => {
    setSavingSecurity(true);
    setMsg(null);

    try {
      const attributes: any = {};
      let hasChanges = false;

      // 1. 檢查 Email 變更
      if (email !== userProfile.email) {
        attributes.email = email;
        hasChanges = true;
      }

      // 2. 檢查密碼變更
      if (newPassword) {
        if (newPassword.length < 6) throw new Error("密碼長度至少需要 6 個字符");
        if (newPassword !== confirmPassword) throw new Error("兩次輸入的密碼不一致");
        attributes.password = newPassword;
        hasChanges = true;
      }

      if (!hasChanges) {
        throw new Error("未偵測到任何安全資料變更");
      }

      // 3. 呼叫 Supabase Auth API
      const { data, error } = await supabase.auth.updateUser(attributes);

      if (error) throw error;

      let successText = "安全憑證已更新！";
      if (attributes.email) successText += " 若更改了電子郵件，請前往新信箱點擊驗證連結。";
      if (attributes.password) successText += " 下次登入請使用新密碼。";

      setMsg({ type: 'success', text: successText });
      
      // 清空密碼欄位
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      setMsg({ type: 'error', text: "安全更新失敗: " + err.message });
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* 頂部：訊息提示區 */}
      {msg && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-full shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 ${msg.type === 'success' ? 'bg-green-600 text-white border-green-500' : 'bg-red-600 text-white border-red-500'}`}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-bold">{msg.text}</span>
          <button onClick={() => setMsg(null)} className="ml-4 hover:opacity-80"><X size={16}/></button>
        </div>
      )}

      {/* 帳戶頂部輝煌概覽卡片 */}
      <div className="relative bg-slate-900 rounded-[48px] p-8 md:p-12 text-white overflow-hidden shadow-2xl border border-white/5 mb-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group cursor-pointer" title="點擊下方選單更換頭像">
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
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">HKER Token 積分</span>
              <span className="text-5xl font-black text-amber-400 font-mono tracking-tighter">
                {userProfile.points?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* 左側：頭像選取模組 */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <Camera size={20} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">更換頭像 / AVATAR</h3>
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
            <p className="mt-6 text-[10px] text-slate-400 font-black text-center uppercase tracking-[0.2em]">選擇頭像後請按右側保存</p>
          </div>
        </div>

        {/* 右側：資料編輯區 */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* 區塊 1: 一般個人檔案 (Profile) */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <User size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">個人檔案資料 (Profile)</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">顯示暱稱 / NICKNAME</label>
                <input className="premium-edit-input" value={nickname} onChange={e => setNickname(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">真實姓名 / FULL NAME</label>
                <input className="premium-edit-input" placeholder="未設定" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">聯絡電話 / PHONE</label>
                <div className="relative">
                   <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input className="premium-edit-input pl-12" placeholder="未設定" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">性別 / GENDER</label>
                <select className="premium-edit-input appearance-none cursor-pointer" value={gender} onChange={e => setGender(e.target.value as any)}>
                  <option value="Male">男 / Male</option>
                  <option value="Female">女 / Female</option>
                  <option value="Other">其他 / Other</option>
                  <option value="Secret">保密 / Secret</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">通訊地址 / ADDRESS</label>
              <div className="relative">
                 <MapPin size={18} className="absolute left-5 top-5 text-slate-300" />
                 <textarea 
                  rows={2}
                  className="premium-edit-input pl-12 pt-4 resize-none"
                  placeholder="未設定"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">SOLANA 錢包地址 / SOL ADDRESS</label>
              <div className="relative">
                <Wallet size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  className="premium-edit-input pl-12 font-mono text-xs"
                  placeholder="尚未連結 SOL 錢包"
                  value={solAddress}
                  onChange={e => setSolAddress(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-[24px] transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3 text-base active:scale-95"
            >
              {savingProfile ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
              <span>更新個人檔案</span>
            </button>
          </div>

          {/* 區塊 2: 安全中心 (Auth) */}
          <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-200 shadow-inner space-y-8 relative overflow-hidden">
             {/* 背景裝飾 */}
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Shield size={120} className="text-slate-900" />
             </div>

             <div className="flex items-center gap-4 border-b border-slate-200 pb-6 relative z-10">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">安全中心 (Security)</h3>
                <p className="text-xs text-slate-500 font-bold">修改登入憑證與敏感資料</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">登入信箱 / EMAIL ADDRESS</label>
                  <div className="relative">
                     <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                       type="email"
                       className="premium-edit-input pl-12 bg-white" 
                       value={email} 
                       onChange={e => setEmail(e.target.value)} 
                     />
                  </div>
                  <p className="text-[10px] text-amber-600 flex items-center gap-1 ml-2">
                    <Info size={10}/> 注意：修改信箱需重新驗證
                  </p>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">新密碼 / NEW PASSWORD</label>
                    <input 
                      type="password"
                      className="premium-edit-input bg-white" 
                      placeholder="不修改請留空" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">確認密碼 / CONFIRM</label>
                    <input 
                      type="password"
                      className="premium-edit-input bg-white" 
                      placeholder="再次輸入新密碼" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                    />
                  </div>
               </div>

               <button 
                onClick={handleSecurityUpdate}
                disabled={savingSecurity || (!newPassword && email === userProfile.email)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-[24px] transition-all shadow-xl shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base active:scale-95"
              >
                {savingSecurity ? <RefreshCw className="animate-spin" size={20} /> : <Shield size={20} />}
                <span>更新安全憑證</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .premium-edit-input {
          width: 100%;
          background-color: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 14px 20px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          transition: all 0.2s;
        }
        .premium-edit-input:focus {
          border-color: #2563eb;
          background-color: white;
          outline: none;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
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
