
import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, MapPin, Wallet, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supabase: any;
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose, supabase }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    sol_address: '',
    gender: 'M' as 'M' | 'F'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Validation
        if (!formData.name) throw new Error("請填寫姓名 (Name is required)");

        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        if (data.user) {
          // Create profile with bonus 8888
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            email,
            name: formData.name, // Use input name strictly
            phone: formData.phone || '',
            address: formData.address || '',
            sol_address: formData.sol_address || '',
            gender: formData.gender,
            points: 8888, // Register bonus
            role: 'user',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
          }]);
          
          if (profileError) {
             // Rollback auth if profile fails (rare but safe)
             console.error("Profile creation failed:", profileError);
             throw new Error("建立會員檔案失敗，請聯絡管理員");
          }
          alert('註冊成功！已獲得 8888 HKER Token 積分獎勵！');
        }
      }
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-white tracking-tighter">
              {isLogin ? '會員登入' : '註冊會員'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">電子郵件 (Email)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" required placeholder="example@gmail.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">密碼 (Password)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="grid grid-cols-1 gap-4 mt-4 animate-in slide-in-from-bottom duration-500">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="text" required placeholder="真實姓名 (Name)" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="tel" placeholder="聯絡電話 (Phone)" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="text" placeholder="聯絡地址 (Address)" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="text" placeholder="SOL Address (選填)" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white" value={formData.sol_address} onChange={e => setFormData({...formData, sol_address: e.target.value})} />
                </div>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as 'M' | 'F'})}
                >
                  <option value="M">男 (Male)</option>
                  <option value="F">女 (Female)</option>
                </select>
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl mt-6 shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin mx-auto" /> : (isLogin ? '登入' : '註冊並領取 8888 積分')}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? '還沒有帳號？' : '已經有帳號？'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-400 font-bold hover:underline"
            >
              {isLogin ? '立即註冊' : '返回登入'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
