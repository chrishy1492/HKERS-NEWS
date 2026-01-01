
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, VIP_LEVELS } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Settings, Coins, Star, Shield, Mail, Edit, Save, X, Key, Lock } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, setUser, lang } = useOutletContext<{ user: User | null, setUser: (u: User) => void, lang: 'en' | 'cn' }>();
  const navigate = useNavigate();
  const [withdrawAmount, setWithdrawAmount] = useState(1000000);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      phone: '',
      address: '',
      solAddress: ''
  });
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
  });

  useEffect(() => {
      if (user && !isEditing) {
          setFormData({
              phone: user.phone || '',
              address: user.address || '',
              solAddress: user.solAddress || ''
          });
      }
  }, [user, isEditing]);

  if (!user) {
    navigate('/platform/login');
    return null;
  }

  const handleWithdraw = async () => {
    if (withdrawAmount < 1000000) {
      alert(lang === 'cn' ? '最低提幣額為 1,000,000 HKER 積分。' : 'Minimum withdrawal is 1,000,000 HKER Points.');
      return;
    }
    if (user.points < withdrawAmount) {
      alert(lang === 'cn' ? '積分不足' : 'Insufficient points');
      return;
    }

    if(confirm(lang === 'cn' ? `確認提取 ${withdrawAmount} HKER？` : `Confirm withdrawal of ${withdrawAmount} HKER?`)) {
        await MockDB.updateUserPoints(user.id, -withdrawAmount);
        alert(lang === 'cn' ? '申請處理成功！' : 'Request Processed Successfully!');
    }
  };

  const handleSaveProfile = async () => {
      if (!user) return;
      const updatedUser = {
          ...user,
          phone: formData.phone,
          address: formData.address,
          solAddress: formData.solAddress
      };
      await MockDB.saveUser(updatedUser);
      setUser(updatedUser);
      setIsEditing(false);
      alert(lang === 'cn' ? "個人資料更新成功！" : "Profile updated successfully!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      if (user.password && user.password !== pwdForm.oldPassword) {
          alert(lang === 'cn' ? "舊密碼不正確！" : "Old password is incorrect!");
          return;
      }
      const updatedUser = { ...user, password: pwdForm.newPassword };
      await MockDB.saveUser(updatedUser);
      setUser(updatedUser);
      setShowPwdModal(false);
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      alert(lang === 'cn' ? "密碼更改成功！" : "Password changed successfully!");
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
      <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 p-32 bg-hker-yellow rounded-full blur-3xl opacity-10 transform translate-x-10 -translate-y-10"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
             <img src={`https://picsum.photos/seed/${user.avatarId}/200`} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-hker-yellow shadow-lg" />
             <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
                <p className="text-gray-400 font-mono text-xs mb-3">ID: {user.id}</p>
                <div className="inline-flex items-center gap-2 bg-hker-yellow text-black px-4 py-1.5 rounded-full font-bold text-sm shadow-md">
                    {currentRank.title}
                </div>
             </div>
             <div className="text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 min-w-[150px]">
                 <div className="text-3xl font-bold text-hker-yellow">{user.points.toLocaleString()}</div>
                 <div className="text-xs text-gray-300 tracking-widest mt-1">HKER POINTS</div>
             </div>
         </div>
      </div>
      
      {/* Rest of the UI remains consistent but using the async handlers above */}
      <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold flex items-center gap-2 text-gray-700"><Settings size={18} /> {lang === 'cn' ? '用戶資料' : 'User Details'}</h3>
                 {!isEditing ? (
                     <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center gap-1"><Edit size={14}/> {lang === 'cn' ? '編輯' : 'Edit'}</button>
                 ) : (
                     <div className="flex gap-2">
                         <button onClick={() => setIsEditing(false)} className="text-gray-500 text-xs font-bold"><X size={14}/></button>
                         <button onClick={handleSaveProfile} className="text-green-500 text-xs font-bold"><Save size={14}/></button>
                     </div>
                 )}
             </div>
             <div className="space-y-4 text-sm">
                 <div className="py-2 border-b"><span className="text-gray-400 text-xs block">Email</span> {user.email}</div>
                 <div className="py-2 border-b"><span className="text-gray-400 text-xs block">Phone</span> {isEditing ? <input value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} className="border w-full p-1"/> : user.phone}</div>
                 <div className="py-2 border-b"><span className="text-gray-400 text-xs block">Address</span> {isEditing ? <input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className="border w-full p-1"/> : user.address}</div>
                 <button onClick={() => setShowPwdModal(true)} className="w-full py-2 border rounded text-xs font-bold flex justify-center gap-2 mt-4"><Lock size={12}/> {lang === 'cn' ? '更改密碼' : 'Change Password'}</button>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-hker-gold/30">
               <h3 className="font-bold mb-4 flex items-center gap-2 text-hker-gold"><Coins size={18} /> {lang === 'cn' ? '提取 HKER' : 'Withdraw HKER'}</h3>
               <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(parseInt(e.target.value))} className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-lg font-bold mb-4" />
               <button onClick={handleWithdraw} className="w-full bg-hker-gold text-white font-bold py-3 rounded-lg shadow-lg active:scale-95">{lang === 'cn' ? '申請提幣' : 'Request Withdrawal'}</button>
          </div>
      </div>
      
      {showPwdModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up p-6">
                  <h3 className="font-bold mb-4">{lang === 'cn' ? '更改密碼' : 'Change Password'}</h3>
                  <form onSubmit={handleChangePassword} className="space-y-3">
                      <input type="password" required value={pwdForm.oldPassword} onChange={e=>setPwdForm({...pwdForm, oldPassword: e.target.value})} placeholder="Old Password" class="w-full border p-2 rounded"/>
                      <input type="password" required minLength={6} value={pwdForm.newPassword} onChange={e=>setPwdForm({...pwdForm, newPassword: e.target.value})} placeholder="New Password" class="w-full border p-2 rounded"/>
                      <input type="password" required minLength={6} value={pwdForm.confirmPassword} onChange={e=>setPwdForm({...pwdForm, confirmPassword: e.target.value})} placeholder="Confirm New Password" class="w-full border p-2 rounded"/>
                      <div className="flex gap-2 pt-2">
                          <button type="button" onClick={()=>setShowPwdModal(false)} className="flex-1 border py-2 rounded">Cancel</button>
                          <button type="submit" className="flex-1 bg-hker-red text-white py-2 rounded">Change</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
