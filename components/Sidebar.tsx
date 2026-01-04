
import React from 'react';
import { Gamepad2, Sparkles, UserCircle, Settings, HelpCircle, Trophy } from 'lucide-react';

interface Props {
  onNavigate: (view: 'news' | 'games' | 'fortune' | 'account') => void;
  activeView: string;
}

const Sidebar: React.FC<Props> = ({ onNavigate, activeView }) => {
  const menuItems = [
    { id: 'games', label: '遊戲專區', icon: <Gamepad2 size={20} />, color: 'text-purple-400' },
    { id: 'fortune', label: '算命風水', icon: <Sparkles size={20} />, color: 'text-amber-400' },
    { id: 'account', label: '帳戶管理', icon: <UserCircle size={20} />, color: 'text-blue-400' },
  ];

  return (
    <aside className="w-64 hidden lg:flex flex-col bg-slate-900/50 border-r border-slate-800 h-[calc(100vh-64px)] sticky top-16 p-4">
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-4">快捷導航</p>
        
        <button 
          onClick={() => onNavigate('news')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'news' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Trophy size={20} /> 最新動態
        </button>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === item.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <span className={item.color}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-4">
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800 p-4 rounded-2xl border border-indigo-500/20">
          <p className="text-xs font-bold text-indigo-300 mb-1">獅子山精神 🦁</p>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            HKER Token 致力於建立全球港人價值的數位象徵。
          </p>
        </div>
        
        <div className="flex items-center justify-between px-2 text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
          <span>© 2026 HKER NEWS</span>
          <button className="hover:text-slate-400">幫助中心</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
