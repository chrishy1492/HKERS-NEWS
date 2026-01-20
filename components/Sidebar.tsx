import React from 'react';
import { Newspaper, Gamepad2, Sparkles, UserCog, ShieldAlert, LogOut, Star, FileText } from 'lucide-react';
import { UserProfile, ViewState } from '../types';

interface SidebarProps {
  userProfile: UserProfile | null;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenDisclaimer: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ userProfile, currentView, onChangeView, onLogout, isOpen, onClose, onOpenDisclaimer }) => {
  const getRank = (pts: number) => {
    if (pts > 5000000) return '5-Star Supreme';
    if (pts > 1500000) return '4-Star General';
    if (pts > 700000) return '3-Star Master';
    if (pts > 300000) return '2-Star Elite';
    return 'Member';
  };

  const menuItems = [
    { id: 'news', label: 'News Feed', icon: Newspaper, color: 'text-blue-400' },
    { id: 'games', label: 'Game Center', icon: Gamepad2, color: 'text-purple-400' },
    { id: 'fortune', label: 'Fortune', icon: Sparkles, color: 'text-yellow-400' },
    { id: 'profile', label: 'Settings', icon: UserCog, color: 'text-gray-400' },
  ];

  if (userProfile?.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldAlert, color: 'text-red-400' });
  }

  return (
    <>
      {/* Sidebar hidden on mobile (md:flex) */}
      <aside className={`bg-gray-900 text-white w-64 flex-shrink-0 flex-col h-screen sticky top-0 z-50 transition-transform duration-300 hidden md:flex`}>
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-red-500">HKER NEWS</h1>
          <p className="text-xs text-gray-400 mt-1">Platform v4.3</p>
        </div>

        {userProfile && (
          <div className="p-4 bg-gray-800 m-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <img 
                src={userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.id}`} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full border-2 border-red-500 bg-white" 
              />
              <div className="overflow-hidden">
                <div className="font-bold truncate">{userProfile.full_name}</div>
                <div className="text-xs text-yellow-400 flex items-center gap-1">
                  <Star size={10} fill="currentColor" /> {getRank(userProfile.hker_token)}
                </div>
              </div>
            </div>
            <div className="bg-black rounded p-2 text-center border border-gray-700">
              <div className="text-xs text-gray-400">HKER Token</div>
              <div className="text-xl font-mono text-green-400 font-bold">{userProfile.hker_token.toLocaleString()}</div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2 mt-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onChangeView(item.id as ViewState); onClose(); }}
              className={`w-full text-left p-3 rounded flex items-center gap-3 transition ${currentView === item.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 pb-2 space-y-2">
           <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-2">Info & Legal</div>
           <button onClick={onOpenDisclaimer} className="w-full text-left p-3 rounded flex items-center gap-3 transition text-gray-400 hover:text-white hover:bg-gray-800/50">
             <FileText className="w-5 h-5" />
             <span>免責聲明 (Disclaimer)</span>
           </button>
        </div>

        <div className="p-4 border-t border-gray-800 text-sm space-y-3">
           <a href="https://jup.ag/" target="_blank" rel="noreferrer" className="block text-green-400 hover:text-green-300 font-bold flex items-center gap-2">
             Trade on Jupiter
           </a>
        </div>

        <div className="p-4 pt-0">
          <button onClick={onLogout} className="w-full border border-gray-600 text-gray-300 p-2 rounded hover:bg-gray-800 flex items-center justify-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;