
import React, { useState, useContext } from 'react';
import { DataContext } from '../contexts/DataContext';
import { ForumView } from '../types';

interface AuthFormProps {
  setView: (view: ForumView) => void;
}

export const LoginForm: React.FC<AuthFormProps> = ({ setView }) => {
  const { login } = useContext(DataContext);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = () => {
    if (login(form.email, form.password)) {
      setView('home');
    } else {
      alert("登入失敗：電郵或密碼錯誤");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-2xl mt-10 animate-fade-in border border-gray-100">
      <h2 className="text-2xl font-black mb-6 text-center text-slate-900 tracking-tighter">會員登入 (Member Access)</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">電郵帳號</label>
          <input 
            type="email" 
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold transition-all"
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})}
            placeholder="example@hker.com"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">安全密碼</label>
          <input 
            type="password" 
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold transition-all"
            value={form.password} 
            onChange={e => setForm({...form, password: e.target.value})}
            placeholder="••••••••"
          />
        </div>
        <button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-xl transition-all transform active:scale-95"
        >
          立即登入
        </button>
        <div className="mt-6 text-center">
            <span className="text-gray-400 text-xs font-bold">尚未加入我們？</span>
            <button onClick={() => setView('register')} className="text-blue-600 font-black text-xs hover:underline ml-1">免費註冊</button>
        </div>
      </div>
    </div>
  );
};

export const RegisterForm: React.FC<AuthFormProps> = ({ setView }) => {
  const { register } = useContext(DataContext);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', password: '', gender: 'M', solAddress: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) return alert("請填寫必要資料 (姓名, 電郵, 密碼)");
    
    setLoading(true);
    await register(form);
    
    // 成功後延遲提示，此時 DataContext 已設置 currentUser 並寫入 localStorage
    setTimeout(() => {
        alert("🎉 註冊成功！系統已為您分配唯一會員編號。您已獲得 8888 積分獎勵，且已自動登入。");
        setLoading(false);
        setView('home');
    }, 500);
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl mt-10 animate-fade-in border border-gray-100">
      <h2 className="text-2xl font-black mb-2 text-center text-slate-900 tracking-tighter">建立新帳戶 (Join HKER)</h2>
      <p className="text-center text-green-600 font-black mb-8 text-xs bg-green-50 py-2 rounded-xl border border-green-100">🎁 註冊首贈 8888 HKER Token 積分</p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">真實姓名 *</label>
              <input type="text" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" 
                value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/>
           </div>
           <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">性別</label>
              <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" 
                value={form.gender} onChange={e=>setForm({...form, gender: e.target.value})}>
                  <option value="M">男 (Male)</option>
                  <option value="F">女 (Female)</option>
              </select>
           </div>
        </div>

        <div className="space-y-1">
           <label className="text-[10px] font-black text-gray-400 uppercase">登入電郵 *</label>
           <input type="email" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" 
              value={form.email} onChange={e=>setForm({...form, email: e.target.value})}/>
        </div>
        
        <div className="space-y-1">
           <label className="text-[10px] font-black text-gray-400 uppercase">安全密碼 *</label>
           <input type="password" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" 
              value={form.password} onChange={e=>setForm({...form, password: e.target.value})}/>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">聯繫電話</label>
              <input type="text" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" 
                value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})}/>
           </div>
           <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">地區</label>
              <input type="text" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" 
                value={form.address} onChange={e=>setForm({...form, address: e.target.value})}/>
           </div>
        </div>

        <div className="space-y-1">
           <label className="text-[10px] font-black text-blue-500 uppercase">SOL Wallet Address (選填)</label>
           <input type="text" className="w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl outline-none font-mono text-[10px] break-all" 
              value={form.solAddress} onChange={e=>setForm({...form, solAddress: e.target.value})} placeholder="例如: 7A...3f"/>
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all transform active:scale-95 flex items-center justify-center ${loading ? 'bg-gray-400 text-white' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20'}`}
        >
          {loading ? '同步數據中...' : '確認註冊並自動登入'}
        </button>

        <div className="mt-4 text-center">
            <span className="text-gray-400 text-xs font-bold">已有帳號？</span>
            <button onClick={() => setView('login')} className="text-blue-600 font-black text-xs hover:underline ml-1">立即登入</button>
        </div>
      </div>
    </div>
  );
};
