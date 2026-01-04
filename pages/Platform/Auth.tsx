
import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { MockDB } from '../../services/mockDatabase';
import { UserRole, User, ADMIN_EMAILS } from '../../types';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<{ user: User | null, lang: 'en' | 'cn' }>();
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        if (isLogin) {
          // Pass password to login function
          const user = await MockDB.login(email, password);
          if (user) {
            navigate('/platform');
          } else {
            alert(lang === 'cn' ? '登入失敗：請檢查電郵或密碼' : 'Login Failed: Check email or password');
          }
        } else {
          // Registration Logic
          if (!confirmEmail) {
            alert("Please confirm your email address is correct.");
            setIsLoading(false);
            return;
          }
          
          let initialRole = UserRole.USER;
          if (ADMIN_EMAILS.includes(email.toLowerCase())) {
              initialRole = UserRole.ADMIN;
          }

          const newUser: User = {
            id: `HKER-${Math.floor(Math.random() * 900000) + 100000}`,
            name: name || 'Anonymous',
            email,
            password, 
            address: address || 'Not Provided',
            phone: phone || 'Not Provided',
            solAddress: solAddress || '',
            gender,
            role: initialRole,
            points: 8888, // Welcome bonus
            avatarId,
            isBanned: false,
            joinedAt: Date.now(),
            lastActive: Date.now()
          };
          
          await MockDB.register(newUser);
          alert(lang === 'cn' ? '註冊成功！獲得 8888 積分。' : 'Registration Successful! Welcome Bonus: 8888 Points awarded.');
          navigate('/platform');
        }
    } catch (err: any) {
        alert(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] py-10">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-4 border-hker-red">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            {isLogin 
                ? (lang === 'cn' ? '歡迎回來' : 'Welcome Back') 
                : (lang === 'cn' ? '加入 HKER 社群' : 'Join HKER Community')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder={lang === 'cn' ? "全名" : "Full Name"} value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-hker-red outline-none" />
                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-3 border rounded-lg">
                    <option value="Male">Male (男)</option>
                    <option value="Female">Female (女)</option>
                    <option value="Other">Other (其他)</option>
                </select>
              </div>
              <input required placeholder={lang === 'cn' ? "地址" : "Address"} value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-hker-red outline-none" />
              <input required placeholder={lang === 'cn' ? "電話號碼" : "Phone Number"} value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-hker-red outline-none" />
              <input placeholder={lang === 'cn' ? "Solana 地址 (選填)" : "Solana Address (Optional)"} value={solAddress} onChange={e => setSolAddress(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-hker-red outline-none" />
              
              <div className="p-3 border rounded-lg bg-gray-50">
                <label className="text-sm text-gray-500 block mb-2">{lang === 'cn' ? '選擇頭像 (1-88)' : 'Choose Avatar (1-88)'}</label>
                <div className="flex items-center gap-4">
                    <img src={`https://picsum.photos/seed/${avatarId}/50`} className="w-10 h-10 rounded-full border-2 border-white shadow" />
                    <input type="range" min="1" max="88" value={avatarId} onChange={e => setAvatarId(parseInt(e.target.value))} className="w-full accent-hker-red" />
                </div>
              </div>
            </>
          )}
          
          <input required type="email" placeholder={lang === 'cn' ? "電郵地址" : "Email Address"} value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-hker-red outline-none" />
          <input required type="password" placeholder={lang === 'cn' ? "密碼" : "Password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-hker-red outline-none" />
          
          {!isLogin && (
             <div className="flex items-start gap-2">
                <input type="checkbox" required checked={confirmEmail} onChange={e => setConfirmEmail(e.target.checked)} id="confirm" className="mt-1" />
                <label htmlFor="confirm" className="text-xs text-gray-600">
                    {lang === 'cn' 
                        ? <>我確認電郵正確並同意 <span className="text-blue-500 font-bold">條款及細則</span> (嚴禁違法活動，遵守23條及國安法)。</>
                        : <>I confirm my email is correct and agree to the <span className="text-blue-500 font-bold">Terms & Conditions</span> (Strict compliance with Article 23 & NSL).</>}
                </label>
             </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full bg-hker-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition shadow-lg disabled:opacity-50 flex justify-center">
            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (isLogin ? (lang === 'cn' ? '登入' : 'Login') : (lang === 'cn' ? '註冊' : 'Register'))}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-gray-500 hover:text-hker-red font-bold">
            {isLogin 
                ? (lang === 'cn' ? '建立新帳戶 (獲得 8888 積分)' : 'Create New Account (Get 8888 Pts)') 
                : (lang === 'cn' ? '返回登入' : 'Back to Login')}
          </button>
        </div>
      </div>
    </div>
  );
};
