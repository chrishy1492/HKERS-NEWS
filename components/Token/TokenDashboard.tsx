
import React, { useState } from 'react';
import { 
  Coins, LogOut, ArrowUpRight, TrendingUp, Shield, 
  ExternalLink, Wallet, Gift, Star, Clock
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, AppView, Session } from '../../types';
import HKERLogo from '../Common/HKERLogo';

interface TokenDashboardProps {
  supabase: SupabaseClient;
  session: Session | null;
  userProfile: UserProfile | null;
  updatePoints: (amount: number) => void;
  setView: (view: AppView) => void;
}

const TokenDashboard: React.FC<TokenDashboardProps> = ({ 
  supabase, session, userProfile, updatePoints, setView 
}) => {
  const [redeemStatus, setRedeemStatus] = useState<string | null>(null);

  const exchangeLinks = [
    { name: 'Jupiter Exchange', url: 'https://jup.ag/tokens/B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z', color: 'bg-green-500' },
    { name: 'Orca Pools', url: 'https://www.orca.so/pools/6anyfgQ2G9WgeCEh3XBfrzmLLKgb2WVvW5HAsQgb2Bss', color: 'bg-blue-500' },
    { name: 'Raydium Staking', url: 'https://raydium.io/liquidity-pools/?token=B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z', color: 'bg-purple-500' }
  ];

  const redemptionTiers = [
    { star: 1, cost: 100000, name: 'Bronze Member' },
    { star: 2, cost: 500000, name: 'Silver Member' },
    { star: 3, cost: 1000000, name: 'Gold Member' },
    { star: 4, cost: 5000000, name: 'Platinum Lion' },
    { star: 5, cost: 10000000, name: 'Diamond Rock Star' }
  ];

  const handleRedeem = async (cost: number, tierName: string) => {
    if (!session || !userProfile) return alert("Please login.");
    if (userProfile.points < cost) return alert("Insufficient points for this tier!");
    
    if (confirm(`Redeem ${cost.toLocaleString()} points for ${tierName}?`)) {
      updatePoints(-cost);
      setRedeemStatus(`Successfully redeemed ${tierName}! Admin will update your badge shortly.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[150px] -mr-40 -mt-40 pointer-events-none"></div>
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setView(AppView.LANDING)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={24} />
            </button>
            <div className="flex items-center space-x-3">
              <HKERLogo size={44} />
              <div>
                <h1 className="text-xl font-black italic tracking-tight uppercase leading-none">HKER Token</h1>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Digital Asset Authority</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
             {session ? (
               <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex flex-col items-end">
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Balance</span>
                 <span className="text-lg font-black text-red-500">{userProfile?.points?.toLocaleString()} <span className="text-xs text-white/50 font-mono">HKER</span></span>
               </div>
             ) : (
               <button className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-500 transition-all">Connect Wallet</button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Intro Section */}
        <section className="mb-16 grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-in fade-in slide-in-from-left duration-1000">
             <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-500/20 px-4 py-1.5 rounded-full text-red-500 text-xs font-black uppercase tracking-widest mb-8">
               <TrendingUp size={14} />
               <span>Lion Rock Web3 Sovereignty</span>
             </div>
             <h2 className="text-7xl font-black mb-8 tracking-tighter leading-none italic">
               THE SOUL OF <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-white to-red-600">NEXUS ECONOMY</span>
             </h2>
             <p className="text-slate-400 text-xl leading-relaxed mb-10 max-w-xl font-medium">
               HKER Token is the digital pulse of our global community. Earn by engaging, spend by participating, and hold as a symbol of the enduring Lion Rock spirit.
             </p>
             <div className="flex flex-wrap gap-4">
               {exchangeLinks.map(link => (
                 <a 
                   key={link.name} 
                   href={link.url} 
                   target="_blank" 
                   rel="noreferrer"
                   className={`flex items-center space-x-3 px-8 py-4 rounded-3xl border border-white/10 hover:border-red-500/50 transition-all bg-white/5 group`}
                 >
                   <span className="font-black text-sm uppercase tracking-widest">{link.name}</span>
                   <ArrowUpRight size={18} className="text-slate-500 group-hover:text-red-500 transition-all" />
                 </a>
               ))}
             </div>
          </div>
          
          <div className="relative group animate-in zoom-in duration-1000">
            {/* Main Token Visual - Styled as the provided HKER Coin */}
            <div className="absolute -inset-10 bg-red-600/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className="relative bg-slate-900 border border-white/5 rounded-[60px] p-12 shadow-2xl overflow-hidden min-h-[500px] flex flex-col justify-between">
               
               <div className="flex justify-center mb-10">
                 <div className="relative">
                   {/* 外圈光環 */}
                   <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20 scale-125"></div>
                   <HKERLogo size={220} className="shadow-[0_0_100px_rgba(185,28,28,0.4)] hover:scale-110 transition-transform duration-700" />
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter text-center">HKER Governance Asset</h3>
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Redemption Tiers</span>
                       <Gift className="text-red-500" size={18} />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                       {redemptionTiers.map(tier => (
                         <div key={tier.star} className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-600" 
                              style={{ width: userProfile?.points && userProfile.points >= tier.cost ? '100%' : '0%' }}
                            ></div>
                         </div>
                       ))}
                    </div>
                 </div>
               </div>

               {redeemStatus && (
                 <div className="mt-6 p-4 bg-red-600 text-white rounded-2xl text-xs font-black text-center animate-in slide-in-from-bottom-2">
                   {redeemStatus}
                 </div>
               )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[48px] hover:border-red-500/50 transition-all group">
            <div className="w-16 h-16 bg-red-600/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 group-hover:scale-110 transition-transform">
               <Shield size={32} className="text-red-500" />
            </div>
            <h4 className="text-2xl font-black mb-3 italic">Secure Nexus</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">End-to-end verified points-to-token bridge on the Solana network.</p>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[48px] hover:border-red-500/50 transition-all group">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
               <Wallet size={32} className="text-slate-300" />
            </div>
            <h4 className="text-2xl font-black mb-3 italic">Universal Wallet</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Integrated SOL address support for all global members.</p>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[48px] hover:border-red-500/50 transition-all group">
            <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">
               <Star size={32} className="text-white" fill="white" />
            </div>
            <h4 className="text-2xl font-black mb-3 italic">Lion Loyalty</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Stake points to unlock exclusive community access and voting rights.</p>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5 text-center">
         <div className="flex justify-center mb-8">
            <HKERLogo size={40} className="opacity-30 grayscale" />
         </div>
         <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">HKER Project • The Heartbeat of Lion Rock Web3</p>
      </footer>
    </div>
  );
};

export default TokenDashboard;
