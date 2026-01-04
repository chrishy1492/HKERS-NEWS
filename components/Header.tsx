
import React, { useState } from 'react';
import { Search, ShieldAlert, Menu, X } from 'lucide-react';
import { Profile } from '../types';
import Logo from './Logo';

const REGIONS = ['中國香港', '台灣', '英國', '美國', '加拿大', '澳洲', '歐洲'];
const CATEGORIES = ['全部', '地產', '時事', '財經', '娛樂', '旅遊', '數碼', '汽車', '宗教', '優惠', '校園', '天氣', '社區活動'];

interface Props {
  user: any;
  profile: Profile | null;
  onAuthClick: () => void;
  onProfileClick: () => void;
  onAdminClick: () => void;
  onLogoClick: () => void;
  selectedRegion: string;
  setSelectedRegion: (r: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  isAdminUser: boolean;
}

const Header: React.FC<Props> = (props) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] h-20">
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Left: Logo and Desktop Filters */}
          <div className="flex items-center gap-6">
            <button 
              onClick={props.onLogoClick} 
              className="flex items-center gap-3 group transition-transform active:scale-95"
            >
              <Logo size="md" className="group-hover:rotate-3 transition-transform duration-500" />
              <div className="hidden xl:flex flex-col items-start leading-none">
                <span className="text-xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  HKER NEWS
                </span>
                <span className="text-[10px] font-bold text-blue-400 tracking-[0.2em] uppercase">PLATFORM</span>
              </div>
            </button>
            
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 ml-1">REGION</span>
                <select 
                  value={props.selectedRegion} 
                  onChange={(e) => props.setSelectedRegion(e.target.value)}
                  className="bg-slate-900/50 text-white text-xs font-bold rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer hover:bg-slate-800/80"
                >
                  {REGIONS.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 ml-1">TOPIC</span>
                <select 
                  value={props.selectedCategory} 
                  onChange={(e) => props.setSelectedCategory(e.target.value)}
                  className="bg-slate-900/50 text-white text-xs font-bold rounded-xl px-4 py-2 border border-white/10 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer hover:bg-slate-800/80"
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300" size={18} />
              <input 
                type="text" 
                placeholder="搜尋獅子山下的熱門話題..." 
                className="w-full bg-slate-900/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-600"
                value={props.searchQuery}
                onChange={(e) => props.setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {props.isAdminUser && (
              <button 
                onClick={props.onAdminClick}
                className="p-3 text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/10 rounded-2xl transition-all active:scale-95"
                title="管理控制台"
              >
                <ShieldAlert size={20} />
              </button>
            )}
            
            {props.profile ? (
              <button 
                onClick={props.onProfileClick}
                className="flex items-center gap-3 p-1.5 bg-slate-900/80 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all group active:scale-95 shadow-xl"
              >
                <div className="relative">
                   <img src={props.profile.avatar_url} alt="avatar" className="w-9 h-9 rounded-xl border border-white/10" />
                   <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full" />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none pr-2">
                  <span className="text-[11px] font-black text-white uppercase tracking-tighter mb-1">{props.profile.name}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-[10px] text-yellow-500 font-black">{props.profile.points.toLocaleString()} PTS</span>
                  </div>
                </div>
              </button>
            ) : (
              <button 
                onClick={props.onAuthClick}
                className="relative overflow-hidden group bg-gradient-to-tr from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                <span className="relative z-10">立即加入</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            )}
            <button className="lg:hidden p-3 bg-slate-900/50 rounded-2xl text-slate-400 hover:text-white border border-white/10" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full bg-slate-950/95 backdrop-blur-3xl border-b border-white/10 p-6 animate-in slide-in-from-top duration-300 space-y-4 shadow-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">REGION</label>
                <select 
                  value={props.selectedRegion} 
                  onChange={(e) => props.setSelectedRegion(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-2xl p-4 text-sm font-bold border border-white/10 outline-none"
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">TOPIC</label>
                <select 
                  value={props.selectedCategory} 
                  onChange={(e) => props.setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-2xl p-4 text-sm font-bold border border-white/10 outline-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="搜尋..." 
                className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none"
                value={props.searchQuery}
                onChange={(e) => props.setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
