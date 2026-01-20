import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import { Save, AlertCircle, Camera, ExternalLink, Wallet } from 'lucide-react';

interface ProfileProps {
  userProfile: UserProfile;
  refreshProfile: () => void;
  updatePoints: (amount: number) => Promise<void>;
}

const Profile: React.FC<ProfileProps> = ({ userProfile, refreshProfile, updatePoints }) => {
  const [form, setForm] = useState({ ...userProfile });
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ ...userProfile });
  }, [userProfile]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
       full_name: form.full_name,
       phone: form.phone,
       address: form.address,
       sol_address: form.sol_address,
       gender: form.gender
    }).eq('id', userProfile.id);
    setLoading(false);

    if (error) alert('Error saving: ' + error.message);
    else {
      alert('Profile updated successfully!');
      refreshProfile();
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    
    if (!amount || amount < 1000000) {
      return alert('Minimum withdrawal is 1,000,000 HKER');
    }
    if (userProfile.hker_token < amount) {
      return alert('Insufficient points (積分不足)');
    }
    if (!userProfile.sol_address) {
      return alert('Please save your SOL wallet address first (請先儲存 SOL 錢包地址)');
    }

    if (confirm(`確認申請提幣 ${amount.toLocaleString()} HKER？\n\n系統將扣除積分。請務必截圖保留證明！`)) {
      await updatePoints(-amount);
      alert(`申請成功！\n\n已扣除 ${amount} 積分。\n請立即截圖並填寫下方的 Google Form 通知管理員。`);
      setWithdrawAmount('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
      <h2 className="text-3xl font-black mb-8 text-gray-800 border-b border-gray-200 pb-4">
        Account Management
      </h2>

      {/* Profile Edit Section */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-6">
         <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold">
            <Wallet size={20} /> 個人資料設定 (Profile Settings)
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <input type="text" value={form.email} disabled className="w-full bg-gray-100 text-gray-500 p-3 rounded-lg border border-gray-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
              <input type="text" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
               <select value={form.gender || 'M'} onChange={e => setForm({...form, gender: e.target.value})} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none">
                 <option value="M">Male</option>
                 <option value="F">Female</option>
                 <option value="O">Other</option>
               </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Physical Address</label>
              <input type="text" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-red-500">SOL Wallet Address (Required for Withdraw)</label>
              <input type="text" value={form.sol_address || ''} onChange={e => setForm({...form, sol_address: e.target.value})} placeholder="Enter your Solana Wallet Address" className="w-full p-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 focus:ring-0 outline-none font-mono text-sm" />
            </div>
         </div>
         <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50">
           <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
         </button>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6 md:p-8 rounded-2xl shadow-sm">
         <h3 className="text-2xl font-black text-amber-800 mb-6 flex items-center gap-3">
           <AlertCircle size={28} /> 提幣申請 (Withdrawal)
         </h3>
         
         {/* Important Notice */}
         <div className="bg-white/80 p-6 rounded-xl border border-amber-200 mb-8 space-y-4 text-sm text-slate-700">
           <h4 className="font-bold text-red-600 text-lg border-b border-red-100 pb-2 mb-2">1) 提幣申請須知 (Important Notice)</h4>
           
           <div className="flex gap-3 items-start">
             <Camera className="shrink-0 text-slate-400 mt-1" size={18} />
             <p>申請提幣時，請把已成功申請提幣訊息攝取螢幕(PrtScn)圖片記錄下來！<br/>
             <span className="text-xs text-slate-500">(注意：當申請提幣時螢幕中間上方位置會出現一個訊息，請按下 Ctrl+Alt+PrtScn 把圖片貼上於小畫家，然後把圖片記錄下來)</span></p>
           </div>

           <div className="space-y-2 pl-8">
             <p>申請人完成提幣申請後，請把以下資料全部電郵致 <strong className="text-blue-600 font-mono">hkerstoken@gmail.com</strong> 方可處理：</p>
             <ul className="list-disc pl-5 space-y-1 font-medium text-slate-600">
               <li>提幣數量</li>
               <li>帳戶登記電郵地址</li>
               <li>SOL Address</li>
               <li>申請成功提幣時的圖片</li>
             </ul>
             <p className="text-xs font-bold text-red-500 mt-2">請注意：必須全部提供資料後，系統才會發放 HKER 幣。</p>
           </div>
         </div>

         {/* Action Area */}
         <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-amber-100">
           <div className="flex-1 w-full">
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (Min 1,000,000)</label>
             <input 
               type="number" 
               placeholder="1000000" 
               value={withdrawAmount} 
               onChange={e => setWithdrawAmount(e.target.value)} 
               className="w-full p-3 border border-gray-300 rounded-lg text-lg font-mono" 
             />
             <p className="text-xs text-gray-400 mt-1">1 Point = 1 HKER Token</p>
           </div>
           <button onClick={handleWithdraw} className="w-full md:w-auto bg-green-600 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-green-700 shadow-md whitespace-nowrap">
             扣除積分申請 (Deduct Points)
           </button>
         </div>

         {/* Google Form Link */}
         <div className="mt-8 pt-6 border-t border-amber-200">
            <h4 className="font-bold text-amber-800 mb-4">2) 填寫申請表 (Submit Form)</h4>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSf370oikUL8JlupcS8BO8bbc-7DZg7KP7OJ5tsf3P9UkgNgtA/viewform?usp=publish-editor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95"
            >
              <ExternalLink size={20} />
              前往申請提幣表格 (Go to Withdrawal Form)
            </a>
         </div>
      </div>
    </div>
  );
};

export default Profile;