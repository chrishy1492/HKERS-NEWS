
import React, { useState } from 'react';
import { AppView } from '../types';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  supabase: any;
  setView: (view: AppView) => void;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ supabase, setView, showNotification }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErr('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
      setErr(error.message);
      showNotification("登入失敗，請確認帳號密碼", "error");
    } else {
      showNotification("登入成功，系統即將加載...");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-[3.5rem] p-10 md:p-14 shadow-[0_45px_120px_-20px_rgba(0,0,0,0.12)] border border-slate-50 mt-12 animate-in fade-in zoom-in-95 duration-700">
       <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-3 text-slate-900 tracking-tighter">會員登入</h2>
          <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase">HKER Ecosystem Secure Access</p>
       </div>

       <form onSubmit={login} className="space-y-6">
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input type="email" placeholder="電子郵件" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-50 pl-14 p-5 rounded-[2rem] focus:ring-2 focus:ring-yellow-500 focus:bg-white outline-none transition-all border border-transparent font-bold text-slate-700 shadow-inner" required />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input type="password" placeholder="登入密碼" value={pass} onChange={e=>setPass(e.target.value)} className="w-full bg-slate-50 pl-14 p-5 rounded-[2rem] focus:ring-2 focus:ring-yellow-500 focus:bg-white outline-none transition-all border border-transparent font-bold text-slate-700 shadow-inner" required />
          </div>

          {err && (
            <div className="flex gap-3 text-red-600 text-xs font-black bg-red-50 p-5 rounded-[1.5rem] border border-red-100 items-start animate-shake">
               <AlertCircle size={18} className="shrink-0 mt-0.5" />
               <p className="leading-relaxed">{err}</p>
            </div>
          )}

          <button disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black text-xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50 mt-4 flex items-center justify-center gap-3 group">
            {loading ? '正在授權...' : <>進入論壇 <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
       </form>

       <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] text-slate-400 font-black mb-4 uppercase tracking-[0.2em]">
            New to HKER Community? 
          </p>
          <button onClick={()=>setView('register')} className="text-slate-900 font-black text-2xl hover:text-yellow-600 transition-all group">
            立即註冊送 <span className="text-yellow-600 group-hover:underline underline-offset-8 decoration-[6px]">88,888 Token</span>
          </button>
       </div>
    </div>
  );
};

export default LoginPage;
