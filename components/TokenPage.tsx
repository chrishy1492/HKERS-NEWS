
import React from 'react';
import { Layout, CloudRain, Lock, TrendingUp } from 'lucide-react';
import { Logo } from './Logo';

interface TokenPageProps {
  onBack: () => void;
}

export const TokenPage: React.FC<TokenPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-amber-500 font-sans">
      <nav className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-50 shadow-lg">
        <button onClick={onBack} className="flex items-center text-white hover:text-amber-500 transition-colors">
          <Layout className="mr-2" size={20} /> 回首頁
        </button>
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 shadow-sm" />
          <h1 className="text-2xl font-bold tracking-wider">TOKEN</h1>
        </div>
        <div className="w-20"></div>
      </nav>

      <div className="container mx-auto p-6 md:p-12 animate-fade-in-up">
        <div className="text-center mb-16">
          <div className="inline-block p-2 rounded-full mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
             <Logo className="w-32 h-32" />
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">HKER 計劃</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            HKER（Hongkongers Token）是一個由香港人社群發起的計畫，
            以「獅子山精神」為靈感，推動香港人團結、自由與創意的數位象徵。
            <br/><br/>
            這不是交易幣，而是一種社群精神與文化象徵，
            希望讓全球港人透過 Web3 連結，共同建立屬於我們的價值與故事。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { 
              title: "Orca Liquidity Pool", 
              desc: "資金池", 
              link: "https://www.orca.so/pools/6anyfgQ2G9WgeCEh3XBfrzmLLKgb2WVvW5HAsQgb2Bss",
              icon: <CloudRain size={32} />
            },
            { 
              title: "Raydium Liquidity Pool", 
              desc: "質押池", 
              link: "https://raydium.io/liquidity-pools/?token=B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z",
              icon: <Lock size={32} />
            },
            { 
              title: "Trade on Jupiter", 
              desc: "交易買賣 HKER", 
              link: "https://jup.ag/tokens/B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z",
              icon: <TrendingUp size={32} />
            }
          ].map((item, idx) => (
            <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="block group">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/20 h-full flex flex-col items-center text-center transform hover:-translate-y-1">
                <div className="text-amber-500 mb-6 group-hover:scale-110 transition-transform p-4 bg-slate-800 rounded-full">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 mb-4">{item.desc}</p>
                <span className="text-amber-500 text-sm font-bold mt-auto border-b border-transparent group-hover:border-amber-500 transition-colors">立即前往 &rarr;</span>
              </div>
            </a>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-slate-400 text-sm shadow-inner">
          <h3 className="text-white text-lg font-bold mb-4 flex items-center">
            <span className="mr-2">💡</span> 免責聲明 (Disclaimer)
          </h3>
          <p className="mb-2">歡迎光臨本論壇，為維護良好的社群環境及保障各方權益，請所有使用者在使用本站服務前，務必詳閱並遵守以下聲明：</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>法律守法原則：</strong>嚴禁違法言論。使用者必須嚴格遵守中華人民共和國及香港特別行政區之法律法規(23條和國安法)。</li>
            <li><strong>遊戲性質與娛樂警示：</strong>本網站所提供之遊戲僅供社群互動，所有數值均為「虛擬積分」，不可兌換為現金。</li>
            <li><strong>專業內容參考：</strong>「算命」等功能僅供參考，不應作為現實決策之唯一依據。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
