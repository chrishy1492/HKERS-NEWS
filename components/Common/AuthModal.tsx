
import React, { useState } from 'react';
import { X, Loader2, Sparkles, User, Mail, Lock, Phone, MapPin, Wallet, Info, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { AVATARS } from '../../constants';

interface AuthModalProps {
  supabase: SupabaseClient;
  onLogin: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ supabase, onLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [errorType, setErrorType] = useState<'security' | 'auth' | 'general'>('general');

  // 表單資料狀態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [solAddress, setSolAddress] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Secret'>('Secret');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: resendError } = await (supabase.auth as any).resend({
        type: 'signup',
        email: email,
      });
      if (resendError) throw resendError;
      setSuccess("✅ 驗證郵件已重新發送！請檢查您的收件箱（及垃圾郵件箱）。");
      setShowResend(false);
    } catch (err: any) {
      setError("發送失敗：操作過於頻繁，請稍候再試。");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowResend(false);
    setErrorType('general');

    try {
      if (isRegister) {
        const { data, error: signUpError } = await (supabase.auth as any).signUp({ 
          email, 
          password,
          options: { 
            data: { 
              nickname: nickname || 'HKER_Member',
              avatar_url: selectedAvatar,
              full_name: fullName,
              phone: phone,
              physical_address: address,
              gender: gender,
              sol_address: solAddress
            } 
          }
        });
        
        if (signUpError) throw signUpError;
        
        // 即時會員：若 Supabase 後台關閉 "Confirm email" 設定，data.session 會存在。
        // 若 data.session 存在，直接登入，實現「註冊即會員」。
        
        if (data?.session) {
          onLogin();
          setIsOpen(false);
        } else {
           // 如果 Supabase 強制驗證，嘗試自動登入一次看看是否真的需要驗證
           // 因為有些配置下 signUp 不回傳 session 但可以直接 signIn
           setTimeout(async () => {
             const { data: loginData } = await (supabase.auth as any).signInWithPassword({ email, password });
             if (loginData.session) {
               onLogin();
               setIsOpen(false);
             } else {
               setSuccess("🎉 帳號建立成功！請檢查您的信箱以完成激活 (若未收到請稍候)。");
               setShowResend(true);
             }
           }, 1000);
        }

      } else {
        const { error: signInError } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onLogin();
        setIsOpen(false);
      }
    } catch (err: any) {
      console.error("Auth System Error:", err);
      
      const rawMsg = err.message || err.error_description || "系統暫時無法處理您的請求";
      const lowMsg = rawMsg.toLowerCase();
      
      // 1. 攔截頻率限制報錯 (Security Rate Limit)
      if (lowMsg.includes("for security purposes") || lowMsg.includes("after") || lowMsg.includes("seconds")) {
        setError("操作過於頻繁。為了確保您的帳號安全，系統已暫時限制請求，請於 1 分鐘後再試。");
        setErrorType('security');
      } 
      // 2. 攔截郵件未驗證報錯 (Email Not Confirmed)
      else if (lowMsg.includes("email not confirmed")) {
        setError("您的電子郵件尚未驗證。請檢查您的收件箱，或點擊下方按鈕重新發送。");
        setShowResend(true);
        setErrorType('auth');
      } 
      // 3. 攔截無效憑證報錯 (Invalid Credentials)
      else if (lowMsg.includes("invalid login credentials")) {
        setError("登入資訊有誤。請檢查您的電子郵件與密碼是否正確。");
        setErrorType('auth');
      } 
      // 4. 攔截重複註冊
      else if (lowMsg.includes("user already registered")) {
        setError("此電子郵件已被註冊。如果您忘記密碼，請嘗試重設或直接登入。");
        setErrorType('auth');
      } 
      else {
        setError(rawMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
      >
        <Sparkles size={18} />
        <span>登入 / 加入 HKER</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`bg-white rounded-[40px] w-full ${isRegister ? 'max-w-4xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto p-8 md:p-12 shadow-2xl relative border border-slate-200`}>
        <button 
          onClick={() => { setIsOpen(false); setError(null); setSuccess(null); setShowResend(false); }}
          className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {isRegister ? '建立您的 Nexus 帳戶' : '歡迎回到社區'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {isRegister ? '註冊後領取入會獎勵 88,888 積分' : '請輸入您的憑證以進入 Nexus'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-8">
          <div className={`grid gap-10 ${isRegister ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-widest border-b border-blue-50 pb-2">
                <Lock size={16} />
                <span>帳號資訊 / Security</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">電子郵件 *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="email" required className="auth-input" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">密碼 *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="password" required className="auth-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>

              {isRegister && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 text-amber-600 font-black text-sm uppercase tracking-widest border-b border-amber-50 pb-2">
                    <User size={16} />
                    <span>選擇頭像 / Avatar (88款)</span>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3 h-48 overflow-y-auto p-4 bg-slate-50 rounded-3xl border border-slate-100 custom-scrollbar">
                    {AVATARS.map((url, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(url)}
                        className={`relative aspect-square rounded-2xl border-4 transition-all overflow-hidden ${selectedAvatar === url ? 'border-blue-600 ring-4 ring-blue-500/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={url} alt={`Avt ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isRegister && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest border-b border-indigo-50 pb-2">
                  <Info size={16} />
                  <span>檔案細節 / Profile Details</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">顯示暱稱 *</label>
                    <input type="text" required className="auth-input" placeholder="我的暱稱" value={nickname} onChange={e => setNickname(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">性別</label>
                    <select className="auth-input appearance-none cursor-pointer" value={gender} onChange={e => setGender(e.target.value as any)}>
                      <option value="Male">男 / Male</option>
                      <option value="Female">女 / Female</option>
                      <option value="Other">其他 / Other</option>
                      <option value="Secret">保密 / Secret</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">真實姓名</label>
                  <input type="text" className="auth-input" placeholder="張小明" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">聯絡電話</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="tel" className="auth-input" placeholder="+852 1234 5678" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">通訊地址</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" className="auth-input" placeholder="地區, 街道名稱" value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">SOLANA 地址 (選填)</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" className="auth-input font-mono text-[10px]" placeholder="Solana Wallet Address" value={solAddress} onChange={e => setSolAddress(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {(error || success) && (
            <div className={`p-6 rounded-3xl border flex flex-col gap-4 animate-in slide-in-from-top-2 shadow-sm ${
              success 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : errorType === 'security' 
                  ? 'bg-amber-50 border-amber-200 text-amber-700' 
                  : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-4">
                {success ? <CheckCircle2 className="flex-shrink-0" size={20} /> : <AlertCircle className="flex-shrink-0" size={20} />}
                <p className="text-sm font-bold leading-relaxed">{success || error}</p>
              </div>
              
              {showResend && (
                <button 
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="w-full mt-2 bg-white/50 hover:bg-white text-slate-900 px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm active:scale-95"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  重新發送驗證郵件 / Resend Verification
                </button>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[32px] shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <span>{isRegister ? '立即入會領取獎勵' : '進入 Nexus'}</span>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(null); setSuccess(null); setShowResend(false); }}
            className="text-sm font-black text-slate-500 hover:text-blue-600 transition-colors"
          >
            {isRegister ? '已經有帳號？點此登入' : '還沒入會？立即免費註冊'}
          </button>
        </div>
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          background-color: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 20px;
          padding: 14px 14px 14px 44px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          transition: all 0.2s ease;
        }
        .auth-input:focus {
          border-color: #3b82f6;
          outline: none;
          background-color: white;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AuthModal;
