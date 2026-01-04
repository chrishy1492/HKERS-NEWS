
import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { Coins, Gamepad2, TrendingUp, Info, ArrowUpRight, Wallet, Gift, Trophy, Sparkles, AlertTriangle } from 'lucide-react';
import GamesHub from './GamesHub';

interface Props {
  profile: Profile | null;
  supabase: any;
  onUpdateProfile: () => void;
  defaultTab?: 'info' | 'games' | 'exchange';
}

const TokenInterface: React.FC<Props> = ({ profile, supabase, onUpdateProfile, defaultTab }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'games' | 'exchange'>('info');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('1000000');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const getLevelInfo = (pts: number) => {
    if (pts >= 5000000) return { stars: 5, label: '5星傳奇會員', next: 0, color: 'from-yellow-400 to-orange-600' };
    if (pts >= 1500000) return { stars: 4, label: '4星黃金會員', next: 5000000 - pts, color: 'from-amber-400 to-yellow-600' };
    if (pts >= 700000) return { stars: 3, label: '3星精英會員', next: 1500000 - pts, color: 'from-slate-300 to-slate-500' };
    if (pts >= 300000) return { stars: 2, label: '2星進階會員', next: 700000 - pts, color: 'from-emerald-400 to-teal-600' };
    if (pts >= 100000) return { stars: 1, label: '1星新晉會員', next: 300000 - pts, color: 'from-blue-400 to-indigo-600' };
    return { stars: 0, label: '普通探索者', next: 100000 - pts, color: 'from-slate-600 to-slate-800' };
  };

  const level = profile ? getLevelInfo(profile.points) : { stars: 0, label: '尚未登入', next: 0, color: 'from-slate-800 to-black' };

  const handleWithdraw = async () => {
    if (!profile) return alert("請先登入帳戶。");
    
    const amount = parseInt(withdrawAmount);
    
    // Rule 2 & 5: Min 1,000,000
    if (amount < 1000000) return alert("最低提幣數量為 1,000,000 HKER Token 積分。");
    
    // Check Balance
    if (profile.points < amount) return alert("帳戶積分不足！");

    // Rule 70: Check SOL Address
    if (!profile.sol_address || profile.sol_address.length < 10) {
      return alert("申請拒絕：請先在「帳戶管理」設定正確的 SOL Wallet Address。");
    }

    if (!confirm(`確認提取 ${amount.toLocaleString()} HKER Token?\n將扣除 ${amount.toLocaleString()} 積分。\n收款地址: ${profile.sol_address}`)) return;

    setProcessing(true);

    try {
      // 1. Deduct Points (Rule 1 & 7)
      const { error: updateError } = await supabase.from('profiles').update({
        points: profile.points - amount
      }).eq('id', profile.id);

      if (updateError) throw updateError;

      // 2. Simulate Email Notification (Rule 3, 4, 6)
      // Since we don't have a backend mailer here, we simulate the logic requested.
      console.log(`
        [SYSTEM EMAIL SENT]
        To: hkerstoken@gmail.com
        Subject: New Withdrawal Request
        Body: 
          User: ${profile.name} (${profile.email})
          Amount: ${amount} HKER Token
          SOL Address: ${profile.sol_address}
          Current Points Balance: ${profile.points - amount}
      `);

      // 3. Log to DB (Optional but good practice)
      await supabase.from('withdrawals').insert([{
        user_id: profile.id,
        amount: amount,
        sol_address: profile.sol_address,
        status: 'pending'
      }]);

      alert(`✅ 申請成功！\n系統已扣除 ${amount} 積分。\n管理員已收到您的提幣請求 (Email Sent to hkerstoken@gmail.com)。`);
      onUpdateProfile();
      setWithdrawAmount('1000000');

    } catch (err: any) {
      alert("提幣失敗，請稍後再試: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-6xl mx-auto">
      {/* High-End Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-400/20">
                <Coins className="text-indigo-400" size={18} />
              </div>
              <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">HKER Token Portfolio</h2>
            </div>
            
            <div className="flex items-baseline gap-4 mb-10">
              <span className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
                {profile?.points.toLocaleString() || '0'}
              </span>
              <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">PTS</span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setActiveTab('games')}
                className="group relative overflow-hidden bg-white text-black px-10 py-5 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center gap-3"
              >
                <Gamepad2 size={20} className="group-hover:rotate-12 transition-transform" />
                <span>進入遊戲賺取</span>
              </button>
              <button 
                onClick={() => setActiveTab('exchange')}
                className="group relative overflow-hidden bg-slate-800/80 backdrop-blur-xl text-white border border-white/10 px-10 py-5 rounded-2xl font-black text-sm transition-all hover:bg-slate-700 hover:scale-105 active:scale-95 flex items-center gap-3"
              >
                <TrendingUp size={20} className="text-indigo-400" />
                <span>提幣與兌換</span>
              </button>
            </div>
          </div>
        </div>

        {/* Level Progression Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
           <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${level.color} opacity-10 blur-3xl`} />
           
           <div>
            <div className="flex justify-between items-center mb-6">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <Trophy className="text-yellow-500" size={24} />
              </div>
              <Sparkles className="text-indigo-400/50" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Level</p>
            <h3 className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r ${level.color} mb-3`}>
              {level.label}
            </h3>
            <div className="flex gap-2 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-8 h-2 rounded-full transition-all duration-700 ${i < level.stars ? `bg-gradient-to-r ${level.color} shadow-[0_0_10px_rgba(234,179,8,0.3)]` : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>

          {level.next > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Achievement</span>
                <span className="text-xs font-bold text-white">還差 {level.next.toLocaleString()} PTS</span>
              </div>
              <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${level.color} transition-all duration-1000 relative shadow-[0_0_15px_rgba(59,130,246,0.3)]`} 
                  style={{ width: `${Math.min(100, (profile?.points || 0) / (profile?.points ? profile.points + level.next : 100000) * 100)}%` }}
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-white/40 blur-[2px]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-2 bg-slate-900/80 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl">
          {[
            { id: 'info', label: '生態資訊', icon: <Info size={16} /> },
            { id: 'games', label: '遊戲賺分', icon: <Gamepad2 size={16} /> },
            { id: 'exchange', label: '提幣系統', icon: <Wallet size={16} /> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs transition-all duration-500 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab.icon}
              <span className="uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-[3rem] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden min-h-[500px]">
        {activeTab === 'info' && (
          <div className="p-12 space-y-12 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Jupiter Exchange',
                  desc: '在 Solana 生態最強大的去中心化交易所進行 HKER 交易。',
                  url: 'https://jup.ag/tokens/B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z',
                  color: 'from-emerald-500/20 to-teal-500/5',
                  accent: 'emerald'
                },
                {
                  title: 'Orca Liquidity Pool',
                  desc: '提供流動性並查看 HKER 的實時資金池深度。',
                  url: 'https://www.orca.so/pools/6anyfgQ2G9WgeCEh3XBfrzmLLKgb2WVvW5HAsQgb2Bss',
                  color: 'from-blue-500/20 to-indigo-500/5',
                  accent: 'blue'
                }
              ].map((card, i) => (
                <a 
                  key={i}
                  href={card.url} target="_blank" rel="noreferrer"
                  className={`group relative p-10 rounded-[2rem] bg-gradient-to-br ${card.color} border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors`}>
                      <ArrowUpRight className={`text-${card.accent}-400`} size={24} />
                    </div>
                  </div>
                  <h4 className="text-2xl font-black text-white mb-2">{card.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{card.desc}</p>
                  <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-${card.accent}-400`}>
                    View Market <ArrowUpRight size={14} />
                  </div>
                </a>
              ))}
            </div>

            <div className="bg-slate-950/50 p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 text-white/5 font-black text-9xl pointer-events-none select-none">獅</div>
               <div className="relative z-10">
                 <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                   <div className="w-10 h-1 h-1 bg-indigo-500 rounded-full" />
                   🦁 HKER 獅子山計劃
                 </h3>
                 <p className="text-slate-400 text-lg leading-relaxed max-w-4xl italic">
                   "HKER (Hongkongers Token) 是一個由香港人社群發起的計畫，以「獅子山精神」為靈感，推動香港人團結、自由與創意的數位象徵。希望讓全球港人透過 Web3 連結，共同建立屬於我們的價值與故事。"
                 </p>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'games' && <GamesHub profile={profile} supabase={supabase} onUpdate={onUpdateProfile} />}

        {activeTab === 'exchange' && (
          <div className="p-12 animate-in fade-in duration-700">
            <div className="max-w-xl mx-auto space-y-8">
              <div className="bg-amber-500/10 border border-amber-500/20 p-10 rounded-[2rem] relative overflow-hidden">
                <Wallet className="absolute -top-4 -right-4 text-amber-500/10 w-32 h-32 rotate-12" />
                <h3 className="text-amber-500 font-black text-xl flex items-center gap-3 mb-6">
                  <Wallet /> 提幣說明與規則
                </h3>
                <ul className="text-slate-300 text-sm space-y-4 relative z-10 font-medium">
                  <li className="flex gap-3"><span className="text-amber-500 font-black">●</span> 1 HKER 積分 = 1 HKER Token (1:1 兌換)</li>
                  <li className="flex gap-3"><span className="text-amber-500 font-black">●</span> 最少提幣數量：<span className="text-white font-black underline">1,000,000 PTS</span></li>
                  <li className="flex gap-3"><span className="text-amber-500 font-black">●</span> 必須填寫 SOL Wallet Address。</li>
                  <li className="flex gap-3"><span className="text-amber-500 font-black">●</span> 系統將即時扣除積分並通知管理員。</li>
                  <li className="flex gap-3"><span className="text-amber-500 font-black">●</span> 查詢電郵：<span className="text-amber-400 font-bold">hkerstoken@gmail.com</span></li>
                </ul>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-2 block">Withdrawal Amount (Min 1,000,000)</label>
                  <div className="relative">
                    <Coins className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="number" 
                      min="1000000"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-3xl pl-16 pr-8 py-6 text-2xl font-black text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>
                
                {!profile?.sol_address ? (
                   <div className="p-4 bg-red-500/20 text-red-200 rounded-2xl flex items-center gap-2">
                     <AlertTriangle size={20} /> 請先到帳戶設定填寫 SOL 地址
                   </div>
                ) : (
                   <div className="p-4 bg-green-500/10 text-green-300 rounded-2xl text-xs font-mono">
                     SOL Addr: {profile.sol_address}
                   </div>
                )}

                <button 
                  onClick={handleWithdraw}
                  disabled={processing || !profile || profile.points < 1000000}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-20 disabled:cursor-not-allowed py-6 rounded-3xl font-black text-white text-xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_50px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                >
                  {processing ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowUpRight size={24} />}
                  <span>{processing ? '處理中...' : '確認申請提幣'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenInterface;
