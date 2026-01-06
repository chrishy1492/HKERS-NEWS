
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, VIP_LEVELS } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Settings, Coins, Edit, Save, X, Lock, ExternalLink } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, setUser, lang } = useOutletContext<{ user: User | null, setUser: (u: User) => void, lang: 'en' | 'cn' }>();
  const navigate = useNavigate();
  const [withdrawAmount, setWithdrawAmount] = useState(1000000);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      name: '',
      phone: '',
      address: '',
      solAddress: '',
      email: '',
      gender: 'Male'
  });
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
  });
  
  // Backup button state for email
  const [showMailBackup, setShowMailBackup] = useState(false);

  useEffect(() => {
      if (user && !isEditing) {
          setFormData({
              name: user.name,
              phone: user.phone || '',
              address: user.address || '',
              solAddress: user.solAddress || '',
              email: user.email,
              gender: user.gender
          });
      }
  }, [user, isEditing]);

  if (!user) {
    navigate('/platform/login');
    return null;
  }

  const triggerEmail = (amount: number) => {
      const subject = `Withdrawal Request: ${user.name} - ${amount} HKER`;
      const body = `Dear Admin,\r\n\r\nI would like to withdraw HKER Tokens.\r\n\r\n--- Request Details ---\r\nApplicant: ${user.name}\r\nEmail: ${user.email}\r\nSOL Address: ${user.solAddress}\r\nWithdrawal Amount: ${amount} HKER\r\nDate: ${new Date().toLocaleString()}\r\n\r\nPlease process this transaction.\r\n\r\nThank you.`;
      
      const mailtoUrl = `mailto:hkerstoken@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Attempt automatic open
      window.location.href = mailtoUrl;
      
      // Always show backup button after attempt, in case browser blocked it or user closed it by mistake
      setShowMailBackup(true);
  };

  const handleWithdraw = async () => {
    if (withdrawAmount < 1000000) {
      alert(lang === 'cn' ? '最低提幣額為 1,000,000 HKER 積分。' : 'Minimum withdrawal is 1,000,000 HKER Points.');
      return;
    }
    if (user.points < withdrawAmount) {
      alert(lang === 'cn' ? '積分不足' : 'Insufficient points');
      return;
    }
    if (!user.solAddress || user.solAddress.length < 10) {
        alert(lang === 'cn' ? '請先填寫有效的 Solana 地址！' : 'Please provide a valid SOL Address in your profile first!');
        return;
    }

    if(confirm(lang === 'cn' ? `確認提取 ${withdrawAmount} HKER？(將扣除積分)` : `Confirm withdrawal of ${withdrawAmount} HKER? (Points will be deducted)`)) {
        // 1. Atomic deduct
        const res = await MockDB.updateUserPoints(user.id, -withdrawAmount);
        
        if (res !== -1) {
            // 2. Try to create System Notification Post
            try {
                await MockDB.createWithdrawalPost(user, withdrawAmount);
            } catch (error) {
                console.error("Auto-Post failed, falling back to email only", error);
            }

            // 3. Trigger Email Client
            triggerEmail(withdrawAmount);

            alert(lang === 'cn' 
                ? '申請成功！積分已扣除。系統已發布通知並嘗試開啟您的郵件軟體。' 
                : 'Success! Points deducted. System notification posted and email client opened.');
            
            setUser({...user, points: res}); // Optimistic update UI
        } else {
            alert("Transaction Error: Could not deduct points.");
        }
    }
  };

  const handleSaveProfile = async () => {
      if (!user) return;
      const updatedUser = {
          ...user,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          solAddress: formData.solAddress,
          email: formData.email,
          gender: formData.gender
      };
      await MockDB.saveUser(updatedUser);
      setUser(updatedUser);
      setIsEditing(false);
      alert(lang === 'cn' ? "個人資料更新成功！" : "Profile updated successfully!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      if (pwdForm.newPassword !== pwdForm.confirmPassword) {
          alert("Passwords do not match");
          return;
      }
      if (user.password && user.password !== pwdForm.oldPassword) {
          alert("Old password incorrect");
          return;
      }
      const updatedUser = { ...user, password: pwdForm.newPassword };
      await MockDB.saveUser(updatedUser);
      setUser(updatedUser);
      setShowPwdModal(false);
      alert("Password Updated!");
  };

  const getRank = (pts: number) => {
    if (pts >= 5000000) return VIP_LEVELS[4];
    if (pts >= 1500000) return VIP_LEVELS[3];
    if (pts >= 700000) return VIP_LEVELS[2];
    if (pts >= 300000) return VIP_LEVELS[1];
    if (pts >= 100000) return VIP_LEVELS[0];
    return { title: 'Member', level: 0 };
  };

  const currentRank = getRank(user.points);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-32 bg-hker-yellow rounded-full blur-3xl opacity-10 transform translate-x-10 -translate-y-10"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
             <div className="relative group cursor-pointer">
                 <img src={`https://picsum.photos/seed/${user.avatarId}/200`} alt="Avatar" className="w-28 h-28 rounded-full border-4 border-hker-yellow shadow-lg object-cover" />
                 <div className="absolute bottom-0 right-0 bg-hker-red text-xs font-bold px-2 py-1 rounded-full border border-white">ID: {user.avatarId}</div>
             </div>
             <div className="flex-1 text-center md:text-left space-y-2">
                <h1 className="text-3xl font-black text-white drop-shadow-md">{user.name}</h1>
                <p className="text-gray-400 font-mono text-xs">UUID: {user.id}</p>
                <div className="inline-flex items-center gap-2 bg-hker-yellow text-black px-4 py-1.5 rounded-full font-bold text-sm shadow-md border-2 border-white">
                    {currentRank.title}
                </div>
             </div>
             <div className="text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm border-2 border-white/20 min-w-[180px]">
                 <div className="text-3xl font-bold text-hker-yellow font-mono">{user.points.toLocaleString()}</div>
                 <div className="text-xs text-white font-bold tracking-widest mt-1">HKER POINTS</div>
             </div>
         </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Edit */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200">
             <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-100">
                 <h3 className="font-black text-lg flex items-center gap-2 text-gray-900"><Settings size={20} className="text-gray-700" /> {lang === 'cn' ? '用戶資料' : 'Account Details'}</h3>
                 {!isEditing ? (
                     <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full"><Edit size={14}/> {lang === 'cn' ? '編輯' : 'Edit'}</button>
                 ) : (
                     <div className="flex gap-2">
                         <button onClick={() => setIsEditing(false)} className="text-gray-600 text-xs font-bold bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-full"><X size={14}/></button>
                         <button onClick={handleSaveProfile} className="text-green-600 text-xs font-bold bg-green-50 border border-green-300 px-3 py-1.5 rounded-full"><Save size={14}/></button>
                     </div>
                 )}
             </div>
             <div className="space-y-4 text-sm">
                 <div className="grid grid-cols-3 gap-2 items-center border-b border-gray-100 pb-2">
                     <span className="text-gray-500 text-xs font-black uppercase">Full Name</span> 
                     <div className="col-span-2">{isEditing ? <input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="border-2 border-gray-300 w-full p-2 rounded bg-white text-gray-900 font-bold focus:border-hker-red outline-none"/> : <span className="font-black text-gray-900 text-base">{user.name}</span>}</div>
                 </div>
                 <div className="grid grid-cols-3 gap-2 items-center border-b border-gray-100 pb-2">
                     <span className="text-gray-500 text-xs font-black uppercase">Email</span> 
                     <div className="col-span-2">{isEditing ? <input value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} className="border-2 border-gray-300 w-full p-2 rounded bg-white text-gray-900 font-bold focus:border-hker-red outline-none"/> : <span className="font-black text-gray-900 text-sm break-all">{user.email}</span>}</div>
                 </div>
                 <div className="grid grid-cols-3 gap-2 items-center border-b border-gray-100 pb-2">
                     <span className="text-gray-500 text-xs font-black uppercase">Phone</span> 
                     <div className="col-span-2">{isEditing ? <input value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} className="border-2 border-gray-300 w-full p-2 rounded bg-white text-gray-900 font-bold focus:border-hker-red outline-none"/> : <span className="font-black text-gray-900 text-base">{user.phone}</span>}</div>
                 </div>
                 <div className="grid grid-cols-3 gap-2 items-center border-b border-gray-100 pb-2">
                     <span className="text-gray-500 text-xs font-black uppercase">Address</span> 
                     <div className="col-span-2">{isEditing ? <input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className="border-2 border-gray-300 w-full p-2 rounded bg-white text-gray-900 font-bold focus:border-hker-red outline-none"/> : <span className="font-black text-gray-900 text-base break-words">{user.address}</span>}</div>
                 </div>
                 <div className="grid grid-cols-3 gap-2 items-center border-b border-gray-100 pb-2">
                     <span className="text-gray-500 text-xs font-black uppercase">SOL Address</span> 
                     <div className="col-span-2">{isEditing ? <input value={formData.solAddress} onChange={e=>setFormData({...formData, solAddress:e.target.value})} className="border-2 border-gray-300 w-full p-2 rounded bg-white text-gray-900 font-bold focus:border-hker-red outline-none"/> : <span className="font-mono text-sm font-bold text-blue-700 break-all block bg-blue-50 p-2 rounded border border-blue-100">{user.solAddress || 'Not Set'}</span>}</div>
                 </div>
                 <div className="grid grid-cols-3 gap-2 items-center pb-2">
                     <span className="text-gray-500 text-xs font-black uppercase">Gender</span> 
                     <div className="col-span-2">{isEditing ? (
                         <select value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})} className="border-2 border-gray-300 w-full p-2 rounded bg-white text-gray-900 font-bold">
                             <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                         </select>
                     ) : <span className="font-black text-gray-900 text-base">{user.gender}</span>}</div>
                 </div>
                 
                 <div className="pt-4 flex gap-2">
                     <button onClick={() => setShowPwdModal(true)} className="flex-1 py-3 border-2 border-gray-300 rounded-lg text-xs font-black text-gray-700 flex justify-center gap-2 items-center hover:bg-gray-100 transition"><Lock size={14}/> Change Password</button>
                 </div>
             </div>
          </div>

          {/* Withdrawal */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-hker-gold flex flex-col justify-between">
               <div>
                   <h3 className="font-black mb-4 flex items-center gap-2 text-hker-gold text-lg"><Coins size={22} className="text-hker-gold" /> {lang === 'cn' ? '提取 HKER' : 'Withdraw HKER'}</h3>
                   <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-xs text-yellow-900 border border-yellow-200">
                       <p className="font-black mb-1 text-sm">Exchange Rate: 1 Point = 1 HKER</p>
                       <p className="font-bold">Min. Withdrawal: 1,000,000</p>
                       <p className="mt-2">Ensure your SOL Address is correct in profile settings.</p>
                       <p>Issues? Contact: hkerstoken@gmail.com</p>
                   </div>
                   <label className="text-xs font-black text-gray-500 uppercase mb-2 block">Amount to Withdraw</label>
                   <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(parseInt(e.target.value))} className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-xl font-black mb-6 font-mono focus:border-hker-gold outline-none text-gray-900 bg-gray-50" />
               </div>
               
               <div className="space-y-3">
                   <button onClick={handleWithdraw} className="w-full bg-hker-gold text-white font-black py-4 rounded-xl shadow-lg active:scale-95 hover:bg-yellow-500 transition border-b-4 border-yellow-600">
                       {lang === 'cn' ? '申請提幣' : 'Request Withdrawal'}
                   </button>
                   
                   {showMailBackup && (
                       <button 
                           onClick={() => triggerEmail(withdrawAmount)}
                           className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition"
                       >
                           <ExternalLink size={14} /> {lang === 'cn' ? '郵件未開啟？手動點此發送' : 'Email didn\'t open? Click here'}
                       </button>
                   )}
               </div>
          </div>
      </div>
      
      {showPwdModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up p-6 border-2 border-gray-200">
                  <h3 className="font-black mb-4 text-lg text-gray-900">Change Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                      <input type="password" required value={pwdForm.oldPassword} onChange={e=>setPwdForm({...pwdForm, oldPassword: e.target.value})} placeholder="Old Password" className="w-full border-2 border-gray-300 p-3 rounded-lg font-bold text-gray-900 placeholder-gray-400"/>
                      <input type="password" required minLength={6} value={pwdForm.newPassword} onChange={e=>setPwdForm({...pwdForm, newPassword: e.target.value})} placeholder="New Password" className="w-full border-2 border-gray-300 p-3 rounded-lg font-bold text-gray-900 placeholder-gray-400"/>
                      <input type="password" required minLength={6} value={pwdForm.confirmPassword} onChange={e=>setPwdForm({...pwdForm, confirmPassword: e.target.value})} placeholder="Confirm New Password" className="w-full border-2 border-gray-300 p-3 rounded-lg font-bold text-gray-900 placeholder-gray-400"/>
                      <div className="flex gap-3 pt-2">
                          <button type="button" onClick={()=>setShowPwdModal(false)} className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-black text-gray-600 hover:bg-gray-100">Cancel</button>
                          <button type="submit" className="flex-1 bg-hker-red text-white py-3 rounded-lg font-black hover:bg-red-700">Update</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
