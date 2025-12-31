
import React, { useContext, useState } from 'react';
import { DataContext } from '../contexts/DataContext';
import { STAR_LEVELS } from '../constants';

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
      alert("資料已更新 (Data Updated)");
  };

  // Requirement 2, 12, 68, 79, 80: Strict Withdrawal System
  const handleWithdraw = () => {
    const amountStr = prompt("請輸入提幣數量 (最少 1,000,000 HKER):");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    
    if (isNaN(amount) || amount < 1000000) return alert("錯誤：最少提幣數量為 1,000,000 粒！");
    if (currentUser.points < amount) return alert("錯誤：積分不足！(Insufficient Points)");
    if (!currentUser.solAddress) return alert("錯誤：請先在下方設定 SOL Wallet Address");

    // Auto deduct
    updatePoints(currentUser.id, -amount);
    
    // Text strictly from Requirement 80
    alert(
      `提幣申請成功！\n` + 
      `已扣除 ${amount.toLocaleString()} 積分。\n` +
      `標明: 1HKER token積分=1HKER Token\n` +
      `最少提币數量為1000000粒\n` +
      `如有任何提币問題可以電郵致hkerstoken@gmail.com`
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100">
      
      {/* Wallet Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl mb-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm mb-1 uppercase tracking-wider font-bold">HKER TOKEN 積分餘額</p>
            <p className="text-4xl font-black font-mono">{currentUser.points.toLocaleString()}</p>
          </div>
          <button 
            onClick={handleWithdraw} 
            className="bg-white text-blue-700 px-8 py-3 rounded-full font-bold shadow-md hover:bg-gray-100 hover:scale-105 transition-all"
          >
            申請提取 HKER Token
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 text-xs text-blue-100 space-y-1">
           <p>• 1 HKER Token積分 = 1 HKER Token</p>
           <p>• 最少提幣數量: 1,000,000 粒</p>
           <p>• 客服電郵: hkerstoken@gmail.com</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="mb-8">
         <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold text-lg text-gray-800">個人資料 (Profile)</h3>
            {!editMode ? (
                <button onClick={startEdit} className="text-blue-600 text-sm font-bold hover:underline">修改資料</button>
            ) : (
                <div className="gap-2 flex">
                    <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">儲存</button>
                    <button onClick={() => setEditMode(false)} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">取消</button>
                </div>
            )}
         </div>
         
         <div className="grid md:grid-cols-2 gap-4">
            {editMode ? (
                <>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">姓名</label>
                        <input className="w-full border p-2 rounded" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">電話</label>
                        <input className="w-full border p-2 rounded" value={formData.phone || ''} onChange={e=>setFormData({...formData, phone: e.target.value})}/>
                    </div>
                    <div className="space-y-1 col-span-2">
                        <label className="text-xs text-gray-500">地址</label>
                        <input className="w-full border p-2 rounded" value={formData.address || ''} onChange={e=>setFormData({...formData, address: e.target.value})}/>
                    </div>
                    <div className="space-y-1 col-span-2">
                        <label className="text-xs text-gray-500 font-bold text-blue-600">SOL Wallet Address (重要)</label>
                        <input className="w-full border-2 border-blue-100 p-2 rounded font-mono" value={formData.solAddress || ''} onChange={e=>setFormData({...formData, solAddress: e.target.value})} placeholder="請輸入 Solana 錢包地址"/>
                    </div>
                </>
            ) : (
                <>
                    <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500 block mb-1">姓名</span>{currentUser.name}</div>
                    <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500 block mb-1">Email</span>{currentUser.email}</div>
                    <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500 block mb-1">電話</span>{currentUser.phone || '未設定'}</div>
                    <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-500"><span className="text-xs text-gray-500 block mb-1">SOL Address</span><span className="font-mono text-xs break-all">{currentUser.solAddress || '未設定 (請設定以提幣)'}</span></div>
                </>
            )}
         </div>
      </div>
    </div>
  );
};
