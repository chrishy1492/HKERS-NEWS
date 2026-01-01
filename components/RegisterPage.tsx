
import React, { useState } from 'react';
import { AppView } from '../types';
import { User, Mail, Lock, Phone, MapPin, Wallet, ChevronLeft, ArrowRight } from 'lucide-react';

interface RegisterPageProps {
  supabase: any;
  setView: (view: AppView) => void;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ supabase, setView, showNotification }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    fullName: '',
    address: '',
    phone: '',
    solAddress: '',
    gender: 'male'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const reg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email: formData.email, 
        password: formData.password,
        options: { 
          data: { 
            nickname: formData.nickname,
            full_name: formData.fullName,
            address: formData.address,
            phone: formData.phone,
            sol_address: formData.solAddress,
            gender: formData.gender
          } 
        }
      });

      if (error) throw error;

      // 專業工程師優化：註冊後立即嘗試自動登入
      if (data?.session) {
        showNotification("註冊成功！歡迎來到 HKER 大家庭", "info");
        setView('forum');
      } else {
        // 若伺服器配置尚未生效（仍需驗證），提示用戶直接登入試試（因應需求已移除郵件確認引導）
        showNotification("帳號創建成功，請點擊登入進入論壇", "info");
        setView('forum');
      }
    } catch (err: any) {
      showNotification(err.message || "註冊失敗，請檢查輸入資料", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-slate-50 mt-2 mb-10 animate-in fade-in zoom-in-95 duration-500">
       <button onClick={() => setView('forum')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all mb-8 font-black text-xs uppercase group">
         <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 返回登錄界面
       </button>

       <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">加入 HKER 專業社群</h2>
          <div className="inline-flex items-center gap-3 bg-yellow-50 text-yellow-700 px-6 py-2.5 rounded-[2rem] text-sm font-black border border-yellow-100 shadow-sm animate-pulse">
            🚀 立即註冊即送 88,888 HKER Token
          </div>
       </div>
       
       <form onSubmit={reg} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase ml-3"><User size={12}/> 顯示暱稱 *</label>
            <input name="nickname" type="text" placeholder="例如：幣圈大師" value={formData.nickname} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-500 focus:bg-white p-4 rounded-[1.5rem] transition-all outline-none font-bold text-slate-700" required />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase ml-3"><User size={12}/> 真實姓名 *</label>
            <input name="fullName" type="text" placeholder="您的姓名" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-500 focus:bg-white p-4 rounded-[1.5rem] transition-all outline-none font-bold text-slate-700" required />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase ml-3"><Mail size={12}/> 電子郵件 *</label>
            <input name="email" type="email" placeholder="email@example.com" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-500 focus:bg-white p-4 rounded-[1.5rem] transition-all outline-none font-bold text-slate-700" required />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase ml-3"><Lock size={12}/> 設定密碼 *</label>
            <input name="password" type="password" placeholder="密碼 (最少6位)" value={formData.password} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-500 focus:bg-white p-4 rounded-[1.5rem] transition-all outline-none font-bold text-slate-700" required minLength={6} />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase ml-3"><Phone size={12}/> 電話號碼 *</label>
            <input name="phone" type="tel" placeholder="+852 / +886 ..." value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-500 focus:bg-white p-4 rounded-[1.5rem] transition-all outline-none font-bold text-slate-700" required />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase ml-3">性別 *</label>
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.5rem]">
              <button type="button" onClick={() => setFormData(p => ({ ...p, gender: 'male' }))} className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${formData.gender === 'male' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>男士</button>
              <button type="button" onClick={() => setFormData(p => ({ ...p, gender: 'female' }))} className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${formData.gender === 'female' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>女士</button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
             <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase ml-3"><MapPin size={12}/> 通訊地址 *</label>
             <textarea name="address" placeholder="詳細收貨或聯繫地址" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-500 focus:bg-white p-5 rounded-[2rem] transition-all outline-none h-24 resize-none font-medium text-slate-700" required />
          </div>

          <div className="md:col-span-2 space-y-1.5">
             <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase ml-3"><Wallet size={12}/> SOL 地址 (選填)</label>
             <input name="solAddress" type="text" placeholder="您的 Solana 錢包地址" value={formData.solAddress} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-500 focus:bg-white p-4 rounded-[1.5rem] transition-all outline-none font-mono text-xs text-slate-700" />
          </div>

          <div className="md:col-span-2 pt-6">
            <button disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black text-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:bg-slate-800 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group">
              {loading ? '正在授權安全連接...' : (
                <>確認註冊並進入論壇 <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </div>
       </form>
       <p className="mt-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">
         HKER SECURITY PROTOCOL v2.5.0 ENFORCED
       </p>
    </div>
  );
};

export default RegisterPage;
