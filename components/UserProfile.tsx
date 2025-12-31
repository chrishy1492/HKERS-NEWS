
import React, { useContext, useState } from 'react';
import { DataContext } from '../contexts/DataContext';
// Add User icon alias to lucide-react imports
import { CreditCard, Wallet, Phone, MapPin, Mail, AlertCircle, Send, User as UserIcon } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { currentUser, adminUpdateUser, updatePoints } = useContext(DataContext);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  if (!currentUser) return null;

  const startEdit = () => {
      setFormData({ ...currentUser });
      setEditMode(true);
  };

  const saveEdit = () => {
      adminUpdateUser(currentUser.id, formData);
      setEditMode(false);
      alert("個人資料更新成功！");
  };

  const handleWithdraw = async () => {
    const amountStr = prompt("請輸入提幣數量 (最少 1,000,000 HKER):");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    
    if (isNaN(amount) || amount < 1000000) return alert("錯誤：最少提幣數量為 1,000,000 粒！");
    if (currentUser.points < amount) return alert("錯誤：積分不足以完成提幣。");
    if (!currentUser.solAddress) return alert("錯誤：請先在下方設定 SOL Wallet 地址。");

    // Requirement 11, 12, 68, 79: Automatic Deduction + Email Notification
    updatePoints(currentUser.id, -amount);
    
    // Send email notification via Supabase (stored in withdrawals table)
    try {
      const { supabase } = await import('../lib/supabaseClient');
      await supabase.from('withdrawals').insert({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        solAddress: currentUser.solAddress,
        amount: amount,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      // Also send via mailto link as fallback
      const subject = encodeURIComponent(`HKER Token 提幣申請 - ${currentUser.name}`);
      const body = encodeURIComponent(
        `用戶提幣申請詳情：\n\n` +
        `用戶編號: ${currentUser.id}\n` +
        `用戶姓名: ${currentUser.name}\n` +
        `用戶電郵: ${currentUser.email}\n` +
        `SOL Address: ${currentUser.solAddress}\n` +
        `提幣數量: ${amount.toLocaleString()} HKER Token\n` +
        `申請時間: ${new Date().toLocaleString()}\n\n` +
        `系統已自動扣除用戶積分。`
      );
      window.open(`mailto:hkerstoken@gmail.com?subject=${subject}&body=${body}`, '_blank');
    } catch (error) {
      console.error('Failed to log withdrawal:', error);
    }
    
    alert(
      `提幣申請已提交！系統已自動扣除積分。\n` + 
      `提幣數量: ${amount.toLocaleString()} HKER\n` +
      `SOL Address: ${currentUser.solAddress}\n` +
      `標明: 1 HKER 積分 = 1 HKER Token\n` +
      `最少提幣數量為 1,000,000 粒\n` +
      `如有任何提幣問題請聯繫: hkerstoken@gmail.com`
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border animate-fade-in">
      
      {/* Wallet Banner */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-8 rounded-2xl mb-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
              <CreditCard size={14}/> HKER Token Balance
            </p>
            <p className="text-5xl font-black font-mono tracking-tighter drop-shadow-lg">{currentUser.points.toLocaleString()}</p>
          </div>
          <button 
            onClick={handleWithdraw} 
            className="bg-white text-blue-900 px-10 py-4 rounded-full font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Send size={20}/> 申請提取 HKER Token
          </button>
        </div>
        <div className="mt-6 pt-4 border-t border-white/20 text-[10px] text-blue-100 flex flex-col md:flex-row gap-4 font-bold">
           <span className="flex items-center gap-1.5"><AlertCircle size={10}/> 1 積分 = 1 Token</span>
           <span className="flex items-center gap-1.5"><AlertCircle size={10}/> 最少提幣: 1,000,000 粒</span>
           <span className="flex items-center gap-1.5"><AlertCircle size={10}/> Support: hkerstoken@gmail.com</span>
        </div>
      </div>

      <div className="space-y-6">
         <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2"><Wallet size={20} className="text-blue-500"/> 個人資訊 (Account Settings)</h3>
            {!editMode ? (
                <button onClick={startEdit} className="text-blue-600 text-sm font-black hover:underline px-4 py-1.5 rounded-lg bg-blue-50">修改資料</button>
            ) : (
                <div className="flex gap-2">
                    <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-black">儲存</button>
                    <button onClick={() => setEditMode(false)} className="bg-gray-300 text-white px-4 py-1.5 rounded-lg text-sm font-bold">取消</button>
                </div>
            )}
         </div>
         
         <div className="grid md:grid-cols-2 gap-6">
            {editMode ? (
                <>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">顯示姓名</label>
                        <input className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none font-bold" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">聯繫電話</label>
                        <input className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none font-bold" value={formData.phone || ''} onChange={e=>setFormData({...formData, phone: e.target.value})}/>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">通訊地址</label>
                        <input className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none font-bold" value={formData.address || ''} onChange={e=>setFormData({...formData, address: e.target.value})}/>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black text-blue-500 uppercase">SOL Wallet Address (提幣必填)</label>
                        <input className="w-full border-2 border-blue-100 p-3 rounded-xl focus:border-blue-500 outline-none font-mono text-sm" value={formData.solAddress || ''} onChange={e=>setFormData({...formData, solAddress: e.target.value})} placeholder="Solana 錢包地址..."/>
                    </div>
                </>
            ) : (
                <>
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                       <UserIcon size={20} className="text-gray-400"/>
                       <div>
                          <span className="text-[10px] text-gray-400 block font-black uppercase">姓名</span>
                          <span className="font-bold">{currentUser.name}</span>
                       </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                       <Mail size={20} className="text-gray-400"/>
                       <div>
                          <span className="text-[10px] text-gray-400 block font-black uppercase">Email</span>
                          <span className="font-bold">{currentUser.email}</span>
                       </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                       <Phone size={20} className="text-gray-400"/>
                       <div>
                          <span className="text-[10px] text-gray-400 block font-black uppercase">電話</span>
                          <span className="font-bold">{currentUser.phone || '未設定'}</span>
                       </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-4 md:col-span-2 border border-blue-100">
                       <MapPin size={20} className="text-blue-400"/>
                       <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-blue-400 block font-black uppercase">SOL Address</span>
                          <span className="font-mono text-[10px] break-all block">{currentUser.solAddress || '請設定地址以開啟提幣功能'}</span>
                       </div>
                    </div>
                </>
            )}
         </div>
      </div>
    </div>
  );
};
