import React from 'react';
import { X, Info, ExternalLink, Coins, HeartHandshake } from 'lucide-react';

interface HKERInfoModalProps {
  onClose: () => void;
}

const HKERInfoModal: React.FC<HKERInfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col border border-amber-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-white sticky top-0 z-10">
          <div className="flex items-center gap-3 text-amber-600">
            <div className="p-2 bg-amber-100 rounded-lg shadow-sm">
              <Coins size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">HKER Token 計劃</h2>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Community & Spirit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400 hover:text-gray-700" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-8 text-gray-700">
          
          {/* Spirit Section */}
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center relative overflow-hidden">
             <HeartHandshake className="w-24 h-24 text-slate-100 absolute -top-4 -right-4" />
             <h3 className="text-xl font-bold text-slate-800 mb-4 relative z-10">🦁【HKER 計劃】</h3>
             <p className="leading-relaxed text-slate-600 relative z-10 font-medium">
               HKER（Hongkongers Token）是一個由香港人社群發起的計畫，<br/>
               以「獅子山精神」為靈感，推動香港人團結、自由與創意的數位象徵。<br/><br/>
               這不是交易幣，而是一種社群精神與文化象徵，<br/>
               希望讓全球港人透過 Web3 連結，共同建立屬於我們的價值與故事。
             </p>
          </section>

          {/* Links Section */}
          <section className="space-y-4">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
               Official Resources
             </h3>
             
             <div className="grid gap-4">
                <a href="https://www.orca.so/pools/6anyfgQ2G9WgeCEh3XBfrzmLLKgb2WVvW5HAsQgb2Bss" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">O</div>
                      <div>
                        <div className="font-bold text-gray-800 group-hover:text-amber-600 transition-colors">Orca Liquidity Pool</div>
                        <div className="text-xs text-gray-400">資金池 (Liquidity)</div>
                      </div>
                   </div>
                   <ExternalLink size={18} className="text-gray-300 group-hover:text-amber-500" />
                </a>

                <a href="https://raydium.io/liquidity-pools/?token=B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">R</div>
                      <div>
                        <div className="font-bold text-gray-800 group-hover:text-amber-600 transition-colors">Raydium Pool</div>
                        <div className="text-xs text-gray-400">質押池 (Staking)</div>
                      </div>
                   </div>
                   <ExternalLink size={18} className="text-gray-300 group-hover:text-amber-500" />
                </a>

                <a href="https://jup.ag/tokens/B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">J</div>
                      <div>
                        <div className="font-bold text-gray-800 group-hover:text-amber-600 transition-colors">Jupiter Trade</div>
                        <div className="text-xs text-gray-400">交易買賣 (Trading)</div>
                      </div>
                   </div>
                   <ExternalLink size={18} className="text-gray-300 group-hover:text-amber-500" />
                </a>
             </div>
          </section>

          <section className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-xs text-amber-800 font-mono break-all">
             <div className="font-bold mb-1">Contract Address (SOL):</div>
             B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-bold text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HKERInfoModal;