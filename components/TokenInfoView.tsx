
import React from 'react';
import { AppView } from '../types';
import { ExternalLink, TrendingUp, BarChart3, Coins, ChevronLeft, ShieldCheck, Cpu } from 'lucide-react';
import Logo from './Logo';

interface TokenInfoViewProps {
  setView: (view: AppView) => void;
}

const TokenInfoView: React.FC<TokenInfoViewProps> = ({ setView }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* 頂部導航與標題 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-50" />
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => setView('forum')} 
            className="p-4 bg-slate-800 rounded-2xl hover:bg-yellow-500 hover:text-black transition-all group"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Token Core</h1>
            <p className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.4em]">資產詳細資料與合約審核</p>
          </div>
        </div>
        <Logo className="h-12 relative z-10" />
      </div>

      {/* 核心代幣資訊 - 提升至頂部並採用寬屏佈局 */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[3.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform">
          <Cpu size={180} className="text-yellow-500" />
        </div>
        
        {/* 代幣標誌 */}
        <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full bg-red-600 border-[8px] border-red-800 shadow-[0_0_50px_rgba(220,38,38,0.4)] flex items-center justify-center shrink-0 animate-pulse">
           <div className="flex flex-col items-center">
              <TrendingUp size={64} className="text-yellow-400 opacity-10 absolute" />
              <span className="text-white font-black text-3xl md:text-4xl italic tracking-tighter z-10">HKER</span>
           </div>
        </div>

        <div className="z-10 text-center md:text-left space-y-4">
           <div>
             <h4 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter">HKER COIN (SOL)</h4>
             <p className="text-yellow-500 text-xs font-black mt-2 uppercase tracking-[0.3em]">Hong Kong Community Digital Identity</p>
           </div>
           
           <div className="flex flex-col md:flex-row items-center gap-4">
             <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-xs md:text-sm text-yellow-500 font-mono break-all md:break-normal shadow-inner">
                <span className="text-slate-500 mr-2">CONTRACT:</span>
                B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z
             </div>
             <button 
                onClick={() => {
                  navigator.clipboard.writeText('B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z');
                  alert('合約地址已複製');
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap"
             >
               複製地址
             </button>
           </div>

           <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black text-green-400 uppercase">Solana Network</span>
              <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase">Verified Liquidity</span>
              <span className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-400 uppercase">Community Driven</span>
           </div>
        </div>
      </div>

      {/* 交易與連結區域 - 採用三格對齊佈局 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <LinkCard 
          title="Jupiter Exchange" 
          subtitle="市場交易 (SWAP)" 
          desc="Solana 生態最強交易引擎，提供最低滑點與最快成交速度，即刻買入 HKER。" 
          link="https://jup.ag/tokens/B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z"
          icon={<TrendingUp className="text-yellow-500"/>}
          btnText="立即進行交易"
          accentColor="yellow"
        />
        <LinkCard 
          title="Orca Pool" 
          subtitle="流動性數據 (LP)" 
          desc="查看 Orca 資金池的實時流動性深度、交易量及 24 小時匯率波動分析。" 
          link="https://www.orca.so/pools/6anyfgQ2G9WgeCEh3XBfrzmLLKgb2WVvW5HAsQgb2Bss"
          icon={<BarChart3 className="text-emerald-500"/>}
          btnText="分析資金池"
          accentColor="emerald"
        />
        <LinkCard 
          title="Raydium Farm" 
          subtitle="質押與獎勵 (FARM)" 
          desc="參與 Raydium 的流動性挖礦與質押計畫，為社群提供穩定動力並賺取收益。" 
          link="https://raydium.io/liquidity-pools/?token=B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z"
          icon={<Coins className="text-indigo-500"/>}
          btnText="進入質押中心"
          accentColor="indigo"
        />
      </div>

      {/* 底部合規提示 */}
      <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="p-5 bg-red-600 rounded-3xl text-white shadow-xl shrink-0">
          <ShieldCheck size={32}/>
        </div>
        <div className="text-center md:text-left">
           <h5 className="text-xl font-black text-red-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
             安全審核提醒 (SECURITY NOTICE)
           </h5>
           <p className="text-red-700 text-sm font-medium leading-relaxed mt-1">
             投資虛擬資產具有極高風險。請在投入任何資金前務必確認合約地址正確性。
             HKER Forum 為資訊分享平台，不提供任何形式的金融投資建議。請根據自身風險承受能力做出決策。
           </p>
        </div>
      </div>
    </div>
  );
};

interface LinkCardProps {
  title: string;
  subtitle: string;
  desc: string;
  link: string;
  icon: React.ReactNode;
  btnText: string;
  accentColor: string;
}

const LinkCard: React.FC<LinkCardProps> = ({ title, subtitle, desc, link, icon, btnText, accentColor }) => (
  <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 hover:shadow-2xl transition-all flex flex-col h-full group">
    <div className="flex items-center gap-5 mb-8">
      <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <div>
        <h4 className="font-black text-slate-900 text-xl tracking-tight">{title}</h4>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
    <p className="text-slate-500 text-base font-medium leading-relaxed mb-10 flex-1">
      {desc}
    </p>
    <a 
      href={link} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:bg-yellow-500 hover:text-black transition-all shadow-xl group/btn active:scale-95"
    >
      {btnText} <ExternalLink size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
    </a>
  </div>
);

export default TokenInfoView;
