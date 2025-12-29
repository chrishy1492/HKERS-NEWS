
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, VIP_LEVELS } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Settings, Coins, Star, Shield, Mail, Edit, Save, X, Key, Lock } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, setUser, lang } = useOutletContext<{ user: User | null, setUser: (u: User) => void, lang: 'en' | 'cn' }>();
  const navigate = useNavigate();
  const [withdrawAmount, setWithdrawAmount] = useState(1000000);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      phone: '',
      address: '',
      solAddress: ''
  });

  // Password Change State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
  });

  // CRITICAL FIX: Only sync formData with user context when NOT editing.
  // This prevents the form from resetting while the user is typing due to background polling.
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

  const handleWithdraw = () => {
    if (withdrawAmount < 1000000) {
      alert(lang === 'cn' ? '最低提幣額為 1,000,000 HKER 積分。\n(1 積分 = 1 HKER Token)' : 'Minimum withdrawal is 1,000,000 HKER Points.\n(1 Point = 1 HKER Token)');
      return;
    }
    if (user.points < withdrawAmount) {
      alert(lang === 'cn' ? '積分不足' : 'Insufficient points');
      return;
    }

    if(confirm(lang === 'cn' ? `確認提取 ${withdrawAmount} HKER？\n\n系統將即時扣除積分。` : `Confirm withdrawal of ${withdrawAmount} HKER?\n\nThis will deduct points immediately.`)) {
        MockDB.updateUserPoints(user.id, -withdrawAmount);
        
        // Simulating Email sending
        const emailBody = `
        To: hkerstoken@gmail.com
        Subject: Withdrawal Request - ${user.id}
        
        User: ${user.name} (ID: ${user.id})
        Email: ${user.email}
        SOL Address: ${user.solAddress}
        Amount: ${withdrawAmount} HKER
        Timestamp: ${new Date().toISOString()}
        `;
        
        alert(lang === 'cn' 
            ? `申請處理成功！\n\n系統已發送通知電郵至 hkerstoken@gmail.com\n\n${emailBody}`
            : `Request Processed Successfully!\n\nSystem has sent a notification email to hkerstoken@gmail.com\n\n${emailBody}`);
    }
  };

  const handleSaveProfile = () => {
      if (!user) return;

      const updatedUser = {
          ...user,
          phone: formData.phone,
          address: formData.address,
          solAddress: formData.solAddress
      };

      MockDB.saveUser(updatedUser);
      setUser(updatedUser); // Update context state
      setIsEditing(false);
      alert(lang === 'cn' ? "個人資料更新成功！" : "Profile updated successfully!");
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      // Verify old password (Mock check)
      if (user.password && user.password !== pwdForm.oldPassword) {
          alert(lang === 'cn' ? "舊密碼不正確！" : "Old password is incorrect!");
          return;
      }

      if (pwdForm.newPassword.length < 6) {
          alert(lang === 'cn' ? "新密碼長度至少需 6 個字符。" : "New password must be at least 6 characters long.");
          return;
      }

      if (pwdForm.newPassword !== pwdForm.confirmPassword) {
          alert(lang === 'cn' ? "新密碼不相符！" : "New passwords do not match!");
          return;
      }

      const updatedUser = {
          ...user,
          password: pwdForm.newPassword
      };

      MockDB.saveUser(updatedUser);
      setUser(updatedUser);
      setShowPwdModal(false);
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      alert(lang === 'cn' ? "密碼更改成功！下次登入請使用新密碼。" : "Password changed successfully! Please use new password for next login.");
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
      {/* Profile Card */}
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

      {/* VIP Levels Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700"><Star className="text-hker-yellow" /> {lang === 'cn' ? 'VIP 等級' : 'VIP Levels'}</h3>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-center">
             {VIP_LEVELS.map((lvl) => (
                 <div key={lvl.level} className={`p-2 rounded border ${currentRank.level === lvl.level ? 'bg-hker-yellow/20 border-hker-yellow font-bold' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                     <div className="font-bold mb-1">{lvl.level} {lang === 'cn' ? '星級' : 'Star'}</div>
                     <div>{(lvl.points / 1000).toFixed(0)}k+ pts</div>
                 </div>
             ))}
         </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2 text-gray-700"><Settings size={18} /> {lang === 'cn' ? '用戶資料' : 'User Details'}</h3>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center gap-1">
                        <Edit size={14}/> {lang === 'cn' ? '編輯' : 'Edit'}
                    </button>
                ) : (
                    <div className="flex gap-2">
                         <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700 text-xs font-bold flex items-center gap-1">
                            <X size={14}/> {lang === 'cn' ? '取消' : 'Cancel'}
                        </button>
                        <button onClick={handleSaveProfile} className="text-green-500 hover:text-green-700 text-xs font-bold flex items-center gap-1">
                            <Save size={14}/> {lang === 'cn' ? '儲存' : 'Save'}
                        </button>
                    </div>
                )}
            </div>
            
            <div className="space-y-4 text-sm flex-1">
                <div className="py-2 border-b border-gray-50">
                    <span className="text-gray-400 block text-xs mb-1">{lang === 'cn' ? '電郵 (不可更改)' : 'Email (Cannot Change)'}</span>
                    <span className="font-medium text-gray-800">{user.email}</span>
                </div>
                
                <div className="py-2 border-b border-gray-50">
                    <span className="text-gray-400 block text-xs mb-1">{lang === 'cn' ? 'Solana 地址' : 'SOL Address'}</span>
                    {isEditing ? (
                        <input 
                            value={formData.solAddress} 
                            onChange={e => setFormData({...formData, solAddress: e.target.value})}
                            className="w-full border rounded p-2 bg-gray-50 text-xs font-mono focus:border-blue-500 outline-none"
                            placeholder={lang === 'cn' ? "輸入 Solana 地址" : "Enter Solana Address"}
                        />
                    ) : (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">{user.solAddress || 'Not Set'}</span>
                    )}
                </div>

                <div className="py-2 border-b border-gray-50">
                    <span className="text-gray-400 block text-xs mb-1">{lang === 'cn' ? '電話號碼' : 'Phone'}</span>
                    {isEditing ? (
                        <input 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full border rounded p-2 bg-gray-50 text-xs focus:border-blue-500 outline-none"
                            placeholder={lang === 'cn' ? "輸入電話號碼" : "Enter Phone Number"}
                        />
                    ) : (
                        <span className="font-medium text-gray-800">{user.phone}</span>
                    )}
                </div>

                <div className="py-2 border-b border-gray-50">
                    <span className="text-gray-400 block text-xs mb-1">{lang === 'cn' ? '地址' : 'Address'}</span>
                    {isEditing ? (
                        <input 
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            className="w-full border rounded p-2 bg-gray-50 text-xs focus:border-blue-500 outline-none"
                            placeholder={lang === 'cn' ? "輸入詳細地址" : "Enter Physical Address"}
                        />
                    ) : (
                        <span className="font-medium text-gray-800 break-words">{user.address}</span>
                    )}
                </div>

                <div className="pt-4 mt-auto">
                    <button onClick={() => setShowPwdModal(true)} className="w-full py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 text-xs font-bold flex items-center justify-center gap-2">
                        <Lock size={14}/> {lang === 'cn' ? '更改密碼' : 'Change Password'}
                    </button>
                </div>
            </div>
        </div>

        {/* Withdrawal */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-hker-gold/30 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 bg-hker-gold text-white text-[10px] font-bold rounded-bl-lg">
                1 Point = 1 Token
            </div>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-hker-gold"><Coins size={18} /> {lang === 'cn' ? '提取 HKER' : 'Withdraw HKER'}</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">{lang === 'cn' ? '數量 (最少 1,000,000)' : 'Amount (Min 1,000,000)'}</label>
                    <input 
                        type="number" 
                        value={withdrawAmount} 
                        onChange={e => setWithdrawAmount(parseInt(e.target.value))}
                        className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-lg font-bold outline-none focus:border-hker-gold transition"
                        min="1000000"
                    />
                </div>
                <button 
                    onClick={handleWithdraw}
                    className="w-full bg-hker-gold text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition shadow-lg active:scale-95 transform"
                >
                    {lang === 'cn' ? '申請提幣' : 'Request Withdrawal'}
                </button>
                <div className="bg-orange-50 p-3 rounded text-[10px] text-orange-600 flex gap-2 items-start">
                    <Mail size={12} className="mt-0.5 shrink-0" />
                    <p>{lang === 'cn' ? '系統將自動扣除積分並發送請求電郵至 hkerstoken@gmail.com。處理可能需要 24-48 小時。' : 'System will automatically deduct points and send a request email to hkerstoken@gmail.com. Processing may take 24-48 hours.'}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPwdModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                  <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><Key size={18}/> {lang === 'cn' ? '更改密碼' : 'Change Password'}</h3>
                      <button onClick={() => setShowPwdModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">{lang === 'cn' ? '當前密碼' : 'Current Password'}</label>
                          <input 
                              type="password" 
                              required 
                              value={pwdForm.oldPassword}
                              onChange={e => setPwdForm({...pwdForm, oldPassword: e.target.value})}
                              className="w-full border rounded p-2 focus:border-hker-red outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">{lang === 'cn' ? '新密碼' : 'New Password'}</label>
                          <input 
                              type="password" 
                              required 
                              minLength={6}
                              value={pwdForm.newPassword}
                              onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})}
                              className="w-full border rounded p-2 focus:border-hker-red outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">{lang === 'cn' ? '確認新密碼' : 'Confirm New Password'}</label>
                          <input 
                              type="password" 
                              required 
                              minLength={6}
                              value={pwdForm.confirmPassword}
                              onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})}
                              className="w-full border rounded p-2 focus:border-hker-red outline-none"
                          />
                      </div>
                      <div className="pt-2 flex gap-3">
                          <button type="button" onClick={() => setShowPwdModal(false)} className="flex-1 py-2 border rounded hover:bg-gray-50 text-gray-600 font-bold">{lang === 'cn' ? '取消' : 'Cancel'}</button>
                          <button type="submit" className="flex-1 py-2 bg-hker-red text-white rounded hover:bg-red-700 font-bold shadow-md">{lang === 'cn' ? '更改密碼' : 'Change Password'}</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
