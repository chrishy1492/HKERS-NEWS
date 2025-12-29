
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Gamepad2, User, Settings, LogOut, Menu, X, Globe, DollarSign, ShieldAlert, Sparkles, Lock
} from 'lucide-react';
import { MockDB } from '../../services/mockDatabase';
import { User as UserType, UserRole } from '../../types';

export const PlatformLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserType | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'cn'>('cn');

  useEffect(() => {
    const currentUser = MockDB.getCurrentUser();
    setUser(currentUser);
    const interval = setInterval(() => {
        const u = MockDB.getCurrentUser();
        if (u) setUser(u);
    }, 2000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = () => {
    MockDB.logout();
    setUser(null);
    navigate('/platform/login');
  };

  const menuItems = [
    { icon: <Home size={20} />, label: lang === 'cn' ? '首頁' : 'Home', path: '/platform' },
    { icon: <Gamepad2 size={20} />, label: lang === 'cn' ? '遊戲區' : 'Games', path: '/platform/games' },
    { icon: <Sparkles size={20} />, label: lang === 'cn' ? '算命' : 'Fortune', path: '/platform/fortune' },
    { icon: <User size={20} />, label: lang === 'cn' ? '我的帳號' : 'My Account', path: '/platform/profile' },
  ];

  if (user && user.role === UserRole.ADMIN) {
    menuItems.push({ icon: <Lock size={20} />, label: lang === 'cn' ? '管理員' : 'Admin', path: '/platform/admin' });
  }

  const toggleLang = () => setLang(prev => prev === 'cn' ? 'en' : 'cn');

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-20">
        <div className="p-6 border-b border-gray-100">
           <h2 className="text-2xl font-bold text-hker-red tracking-tight cursor-pointer" onClick={() => navigate('/')}>HKER NEWS</h2>
           <p className="text-xs text-gray-500">Lion Rock Community</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-hker-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          {user ? (
            <div className="bg-gray-50 p-3 rounded-lg mb-3 cursor-pointer hover:bg-gray-100" onClick={() => navigate('/platform/profile')}>
              <p className="font-bold text-sm truncate">{user.name}</p>
              <p className="text-xs text-hker-gold font-bold flex items-center gap-1">
                <DollarSign size={12} /> {user.points.toLocaleString()} HKER
              </p>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/platform/login')}
              className="w-full bg-hker-black text-white py-2 rounded-lg text-sm font-bold mb-3"
            >
              {lang === 'cn' ? '登入 / 註冊' : 'Login / Register'}
            </button>
          )}
          
          <div className="flex gap-2">
            <button onClick={toggleLang} className="flex-1 border-2 border-hker-black py-1 rounded text-xs hover:bg-hker-black hover:text-white transition font-bold flex justify-center items-center gap-1">
              <Globe size={12} /> {lang === 'cn' ? 'EN / 中文' : 'English / 中文'}
            </button>
            {user && (
              <button onClick={handleLogout} className="p-2 border rounded hover:bg-red-50 text-red-500">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-30 shadow-sm flex flex-col">
         <div className="flex justify-between items-center px-4 py-3 border-b">
             <h2 className="text-xl font-bold text-hker-red" onClick={() => navigate('/platform')}>HKER</h2>
             <div className="flex items-center gap-3">
                {user && (
                    <span className="text-xs font-bold text-hker-gold">{user.points} pts</span>
                )}
                <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
             </div>
         </div>
         {/* Mobile Quick Access Buttons */}
         <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 border-b border-gray-200">
             <button onClick={() => navigate('/platform/games')} className="bg-white border border-hker-red text-hker-red py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                 <Gamepad2 size={16} /> {lang === 'cn' ? '遨遊遊戲' : 'Arcade'}
             </button>
             <button onClick={() => navigate('/platform/fortune')} className="bg-white border border-purple-500 text-purple-600 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                 <Sparkles size={16} /> {lang === 'cn' ? '算命祈福' : 'Fortune'}
             </button>
         </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-white z-20 pt-28 px-6 md:hidden">
           <nav className="space-y-4">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 py-3 border-b text-lg font-medium"
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <button onClick={toggleLang} className="w-full py-3 text-left font-bold border-b flex items-center gap-2">
                 <Globe size={16} /> {lang === 'cn' ? '切換語言 (Switch to English)' : 'Switch Language (切換中文)'}
              </button>
              {!user && (
                  <button onClick={() => { navigate('/platform/login'); setSidebarOpen(false); }} className="w-full py-3 text-left font-bold text-hker-red">
                      {lang === 'cn' ? '登入' : 'Login'}
                  </button>
              )}
              {user && (
                  <button onClick={handleLogout} className="w-full py-3 text-left font-bold text-red-500">
                      {lang === 'cn' ? '登出' : 'Logout'}
                  </button>
              )}
           </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-32 md:pt-0 p-4 md:p-8 bg-gray-50 min-h-screen">
        <Outlet context={{ user, setUser, lang }} />
        
        {/* Footer / Disclaimer */}
        <footer className="mt-20 pt-10 border-t border-gray-200 text-xs text-gray-500">
           <div className="max-w-4xl mx-auto space-y-4 mb-10 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h4 className="font-bold flex items-center gap-2 text-red-600 text-sm"><ShieldAlert size={16} /> {lang === 'cn' ? '免責聲明' : 'Disclaimer'}</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                  <div>
                      <h5 className="font-bold mb-1">{lang === 'cn' ? '一、 法律守法原則' : '1. Legal Compliance'}</h5>
                      <p>{lang === 'cn' 
                          ? '嚴禁違法言論：本論壇所有使用者之言論與行為均受法律約束。嚴禁發佈任何違反當地法律之內容。遵守特定區域法律：使用者必須嚴格遵守中華人民共和國及香港特別行政區之法律法規(23條和國安法)。' 
                          : 'Users must strictly adhere to local laws, including Article 23 and the National Security Law of HKSAR. Illegal content is prohibited.'}</p>
                  </div>
                  <div>
                      <h5 className="font-bold mb-1">{lang === 'cn' ? '二、 遊戲性質與娛樂警示' : '2. Entertainment Only'}</h5>
                      <p>{lang === 'cn' 
                          ? '非賭博性質：本網站所提供之「小瑪莉」、「魚蝦蟹」等遊戲，僅供社群互動與休閒娛樂使用。純積分機制：遊戲內所有數值均為「虛擬積分」，不具備任何實際價值。'
                          : 'Games provided are for entertainment only. All points are virtual and have no monetary value. Not for gambling.'}</p>
                  </div>
                  <div>
                      <h5 className="font-bold mb-1">{lang === 'cn' ? '三、 積分獎勵與派發' : '3. Point Rewards'}</h5>
                      <p>{lang === 'cn'
                          ? '送完即止：所有 HKER Token 積分活動（包含機械人貼文互動獎勵）均為推廣性質，送完即止。當積分池耗盡後，用戶將無法獲取額外積分，用戶不得對此追究或投訴。'
                          : 'While stocks last: All HKER Token point rewards are promotional and finite. Once depleted, no further points will be issued. Users cannot complain or claim against this.'}</p>
                  </div>
                  <div>
                      <h5 className="font-bold mb-1">{lang === 'cn' ? '四、 聯絡我們' : '4. Contact Us'}</h5>
                      <p>{lang === 'cn' ? '如發現貼子有問題可舉給管理員: hkerstoken@gmail.com' : 'Report issues to: hkerstoken@gmail.com'}</p>
                  </div>
              </div>
              
              <p className="mt-4 text-center border-t pt-4">© 2024 HKER Platform. All Rights Reserved.</p>
           </div>
        </footer>
      </main>
    </div>
  );
};
