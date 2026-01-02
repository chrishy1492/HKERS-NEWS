
import React from 'react';
import { REGIONS, TOPICS } from '../../constants';
import { ForumSubView } from '../../types';
import { LayoutGrid, Globe, Compass, Gamepad2, MessageSquare, Filter } from 'lucide-react';

interface SidebarProps {
  currentRegion: string;
  setRegion: (region: string) => void;
  currentTopic: string;
  setTopic: (topic: string) => void;
  setSubView: (view: ForumSubView) => void;
  activeSubView: ForumSubView;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentRegion, setRegion, currentTopic, setTopic, setSubView, activeSubView 
}) => {
  return (
    <div className="p-6 space-y-8 flex flex-col h-full bg-white">
      {/* 1. Nexus Core - 導航中心 */}
      <div>
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Nexus Core / 核心導航</h3>
        <div className="space-y-1.5">
          <button 
            onClick={() => setSubView(ForumSubView.FEED)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeSubView === ForumSubView.FEED ? 'bg-[#B91C1C] text-white shadow-lg shadow-red-900/30' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <LayoutGrid size={18} />
            <span>社區動態 / Feed</span>
          </button>
          
          <button 
            onClick={() => setSubView(ForumSubView.FORTUNE_HUB)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeSubView.includes('fortune') ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Compass size={18} />
            <span>風水算命 / Fortune</span>
          </button>

          <button 
            onClick={() => setSubView(ForumSubView.GAMES_HUB)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeSubView.includes('games') ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Gamepad2 size={18} />
            <span>遊戲特區 / Game Zone</span>
          </button>

          <button 
            onClick={() => setSubView(ForumSubView.AI_CHAT)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeSubView === ForumSubView.AI_CHAT ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <MessageSquare size={18} />
            <span>AI 助手 / Nexus Chat</span>
          </button>
        </div>
      </div>

      {/* 2. Topics - 內容主題過濾 */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Filter size={14} className="text-[#B91C1C]" />
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Topics / 內容範疇</h3>
        </div>
        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          <button 
            onClick={() => { setTopic('All'); setSubView(ForumSubView.FEED); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${currentTopic === 'All' && activeSubView === ForumSubView.FEED ? 'bg-red-50 text-[#B91C1C] font-black border-l-4 border-[#B91C1C]' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            全部主題 / All Topics
          </button>
          {TOPICS.map(t => (
            <button 
              key={t} 
              onClick={() => { setTopic(t); setSubView(ForumSubView.FEED); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${currentTopic === t && activeSubView === ForumSubView.FEED ? 'bg-red-50 text-[#B91C1C] font-black border-l-4 border-[#B91C1C]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Regions - 地區 Hubs */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Globe size={14} className="text-blue-500" />
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Regional Hubs / 地區中樞</h3>
        </div>
        <div className="space-y-1">
          <button 
            onClick={() => { setRegion('All'); setSubView(ForumSubView.FEED); }}
            className={`w-full text-left px-4 py-2 rounded-xl text-sm font-semibold transition-all ${currentRegion === 'All' && activeSubView === ForumSubView.FEED ? 'bg-blue-50 text-blue-700 font-black border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Global Nexus / 全球
          </button>
          {REGIONS.map(r => (
            <button 
              key={r} 
              onClick={() => { setRegion(r); setSubView(ForumSubView.FEED); }}
              className={`w-full text-left px-4 py-2 rounded-xl text-sm font-semibold transition-all ${currentRegion === r && activeSubView === ForumSubView.FEED ? 'bg-blue-50 text-blue-700 font-black border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Sidebar;
