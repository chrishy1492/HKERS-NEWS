import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { MockDB } from '../../services/mockDatabase';
import { UserRole, User } from '../../types';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<{ user: User | null, lang: 'en' | 'cn' }>();
  // Handle case where context might be null (though unlikely in current layout setup)
  const lang = context?.lang || 'cn';
  
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [solAddress, setSolAddress] = useState('');
  const [gender, setGender] = useState('Male');
  const [avatarId, setAvatarId] = useState(1);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (isLogin) {
          const user = MockDB.login(email);
          if (user) {
            navigate('/platform');
          } else {
            alert(lang === 'cn' ? '登入資料無效' : 'Invalid credentials');
          }
        } else {
          // Registration Logic
          if (!confirmEmail) {
            alert(lang === 'cn' ? '請確認您的電郵地址正確。' : "Please confirm your email address is correct.");
            return;
          }
          
          const newUser = {
            id: `HKER-${Math.floor(Math.random() * 900000) + 100000}`,
            name: name || 'Anonymous',
            email,
            password, // In real app, hash this!
            address: address || 'Not Provided',
            phone: phone || 'Not Provided',
            solAddress: solAddress || '',
            gender,
            role: UserRole.USER,
            points: 8888, // Welcome bonus Requirement #37
            avatarId,
            isBanned: false
          };
          MockDB.register(newUser);
          alert(lang === 'cn' ? '註冊成功！獲得迎新獎勵：8888 積分。' : 'Registration Successful! Welcome Bonus: 8888 Points awarded.');
          navigate('/platform');
        }
    } catch (err: any) {
        alert(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] py-10">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-4 border-hker-red">
        <h2 className="text-2xl font-bold mb-6 text-center">
            {isLogin 
                ? (lang === 'cn' ? '歡迎回來' : 'Welcome Back') 
                : (lang === 'cn' ? '加入 HKER 社群' : 'Join HKER Community')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder={lang === 'cn' ? "全名" : "Full Name"} value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg" />
                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-3 border rounded-lg">
                    <option value="Male">{lang === 'cn' ? '男' : 'Male'}</option>
                    <option value="Female">{lang === 'cn' ? '女' : 'Female'}</option>
                    <option value="Other">{lang === 'cn' ? '其他' : 'Other'}</option>
                </select>
              </div>
              <input required placeholder={lang === 'cn' ? "地址" : "Address"} value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 border rounded-lg" />
              <input required placeholder={lang === 'cn' ? "電話號碼" : "Phone Number"} value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-lg" />
              <input placeholder={lang === 'cn' ? "Solana 地址 (選填)" : "Solana Address (Optional)"} value={solAddress} onChange={e => setSolAddress(e.target.value)} className="w-full p-3 border rounded-lg" />
              
              <div className="p-3 border rounded-lg bg-gray-50">
                <label className="text-sm text-gray-500 block mb-2">{lang === 'cn' ? '選擇頭像 (1-88)' : 'Choose Avatar (1-88)'}</label>
                <div className="flex items-center gap-4">
                    <img src={`https://picsum.photos/seed/${avatarId}/50`} className="w-10 h-10 rounded-full" />
                    <input type="range" min="1" max="88" value={avatarId} onChange={e => setAvatarId(parseInt(e.target.value))} className="w-full" />
                </div>
              </div>
            </>
          )}
          
          <input required type="email" placeholder={lang === 'cn' ? "電郵地址" : "Email Address"} value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" />
          <input required type="password" placeholder={lang === 'cn' ? "密碼" : "Password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" />
          
          {!isLogin && (
             <div className="flex items-center gap-2">
                <input type="checkbox" required checked={confirmEmail} onChange={e => setConfirmEmail(e.target.checked)} id="confirm" />
                <label htmlFor="confirm" className="text-xs text-gray-600">
                    {lang === 'cn' 
                        ? <>我確認電郵正確並同意 <span className="text-blue-500 cursor-pointer" onClick={() => alert("免責聲明：嚴禁違法活動，遵守23條及國安法。")}>條款及細則</span>。</>
                        : <>I confirm my email is correct and agree to the <span className="text-blue-500 cursor-pointer" onClick={() => alert("Disclaimer: No illegal activities. 23 & NSL compliant.")}>Terms & Conditions</span>.</>}
                </label>
             </div>
          )}

          <button type="submit" className="w-full bg-hker-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition shadow-lg">
            {isLogin ? (lang === 'cn' ? '登入' : 'Login') : (lang === 'cn' ? '註冊' : 'Register')}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-gray-500 hover:text-hker-red font-bold">
            {isLogin 
                ? (lang === 'cn' ? '建立新帳戶' : 'Create New Account') 
                : (lang === 'cn' ? '返回登入' : 'Back to Login')}
          </button>
        </div>
      </div>
    </div>
  );
};