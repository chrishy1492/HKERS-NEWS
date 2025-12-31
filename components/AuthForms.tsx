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
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">會員登入</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電郵</label>
          <input 
            type="email" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
          <input 
            type="password" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.password} 
            onChange={e => setForm({...form, password: e.target.value})}
          />
        </div>
        <button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors shadow-md"
        >
          登入
        </button>
        <p className="text-center text-sm text-gray-500 cursor-pointer hover:underline">忘記密碼？</p>
        <div className="mt-4 text-center">
            <span className="text-gray-600 text-sm">還沒有帳號? </span>
            <button onClick={() => setView('register')} className="text-blue-600 font-bold text-sm hover:underline">立即註冊</button>
        </div>
      </div>
    </div>
  );
};

export const RegisterForm: React.FC<AuthFormProps> = ({ setView }) => {
  const { register } = useContext(DataContext);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', password: '', gender: 'M', solAddress: '' });

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.password) return alert("請填寫必要資料 (姓名, 電郵, 密碼)");
    register(form);
    alert("註冊成功！已自動確認電郵，並獲得 8888 積分。");
    setView('home');
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">新會員註冊</h2>
      <p className="text-center text-green-600 font-bold mb-6 text-sm">🎉 註冊即送 8888 HKER 積分</p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="姓名 *" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/>
          <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={form.gender} onChange={e=>setForm({...form, gender: e.target.value})}>
              <option value="M">男</option>
              <option value="F">女</option>
          </select>
        </div>

        <input type="email" placeholder="電郵 (作為登入帳號) *" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={form.email} onChange={e=>setForm({...form, email: e.target.value})}/>
        
        <input type="password" placeholder="設定密碼 *" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={form.password} onChange={e=>setForm({...form, password: e.target.value})}/>
        
        <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="電話" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})}/>
            <input type="text" placeholder="地區/地址" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                value={form.address} onChange={e=>setForm({...form, address: e.target.value})}/>
        </div>

        <input type="text" placeholder="SOL Wallet Address (選填，用於提幣)" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" 
            value={form.solAddress} onChange={e=>setForm({...form, solAddress: e.target.value})}/>
        
        <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
            <p>註冊即代表同意本站免責聲明及服務條款。本站保留最終決定權。</p>
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors shadow-md mt-4"
        >
          確認註冊
        </button>
        <div className="mt-4 text-center">
            <span className="text-gray-600 text-sm">已有帳號? </span>
            <button onClick={() => setView('login')} className="text-blue-600 font-bold text-sm hover:underline">直接登入</button>
        </div>
      </div>
    </div>
  );
};
