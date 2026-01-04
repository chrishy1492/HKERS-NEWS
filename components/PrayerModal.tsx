import React, { useState } from 'react';
import { X, Sparkles, Heart } from 'lucide-react';
import { PRAYER_DEITIES, PRAYER_CATEGORIES, PRAYER_QUOTES } from '../constants';

interface PrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrayerModal: React.FC<PrayerModalProps> = ({ isOpen, onClose }) => {
  const [selectedDeity, setSelectedDeity] = useState(PRAYER_DEITIES[0]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [result, setResult] = useState<{title: string, content: string[], quote: string} | null>(null);
  const [isPraying, setIsPraying] = useState(false);

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(prev => prev.filter(c => c !== cat));
    } else {
      setSelectedCats(prev => [...prev, cat]);
    }
  };

  const handlePrayer = () => {
    if (selectedCats.length === 0) {
      alert("請至少選擇一個祈福事項。");
      return;
    }

    setIsPraying(true);

    setTimeout(() => {
      const generatedContent = selectedCats.map(cat => {
        const blessings = PRAYER_CATEGORIES[cat];
        const randomBlessing = blessings[Math.floor(Math.random() * blessings.length)];
        return `【${cat}】${randomBlessing}`;
      });

      const randomQuote = PRAYER_QUOTES[Math.floor(Math.random() * PRAYER_QUOTES.length)];

      setResult({
        title: `✨ ${selectedDeity} 給您的祝願 ✨`,
        content: generatedContent,
        quote: randomQuote
      });
      setIsPraying(false);
    }, 2000); // 2 seconds of "praying"
  };

  const reset = () => {
    setResult(null);
    setSelectedCats([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#fffaf0] rounded-2xl w-full max-w-2xl overflow-hidden border-4 border-[#d4af37] shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#8b0000] p-4 text-center relative border-b-4 border-[#d4af37]">
          <h2 className="text-2xl font-bold text-[#ffd700] tracking-widest flex items-center justify-center gap-2">
            <Sparkles className="text-[#ffd700]" /> 網上誠心祈福系統 <Sparkles className="text-[#ffd700]" />
          </h2>
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d4af37] hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-[#5c3a21]">
          
          {!result ? (
            <div className="space-y-8">
               {/* Step 1: Deity */}
               <div className="text-center">
                  <label className="block text-lg font-bold mb-3 text-[#8b0000]">請選擇神祇</label>
                  <select 
                    value={selectedDeity}
                    onChange={(e) => setSelectedDeity(e.target.value)}
                    className="w-full max-w-md mx-auto block p-3 text-lg border-2 border-[#d4af37] rounded-lg bg-white text-[#5c3a21] focus:ring-2 focus:ring-[#8b0000] outline-none shadow-sm cursor-pointer"
                  >
                    {PRAYER_DEITIES.map((d, i) => (
                      <option key={d} value={d}>{i + 1}. {d}</option>
                    ))}
                  </select>
               </div>

               {/* Step 2: Categories */}
               <div>
                  <label className="block text-lg font-bold mb-3 text-[#8b0000] text-center">請選擇祈福事項 (可多選)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.keys(PRAYER_CATEGORIES).map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`p-3 rounded-lg border-2 transition-all font-bold ${
                          selectedCats.includes(cat) 
                            ? 'bg-[#8b0000] text-[#ffd700] border-[#8b0000] shadow-md transform scale-105' 
                            : 'bg-white text-[#5c3a21] border-[#e6cca0] hover:border-[#d4af37]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Action */}
               <div className="text-center pt-4">
                 {isPraying ? (
                   <div className="text-2xl font-bold text-[#8b0000] animate-pulse flex flex-col items-center">
                      <div className="mb-2">🙏 誠心祈禱中... 🙏</div>
                      <div className="text-sm text-[#d4af37]">心誠則靈</div>
                   </div>
                 ) : (
                   <button 
                      onClick={handlePrayer}
                      className="bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all border-2 border-[#fffaf0] ring-4 ring-[#d4af37]/30"
                   >
                      誠心跪拜並領取願福語
                   </button>
                 )}
               </div>
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
               <div className="text-center border-b-2 border-dashed border-[#d4af37] pb-4">
                  <h3 className="text-2xl font-bold text-[#8b0000] mb-2">{result.title}</h3>
                  <div className="text-sm text-gray-500">日期: {new Date().toLocaleDateString()}</div>
               </div>

               <div className="bg-white p-6 rounded-xl border border-[#e6cca0] shadow-inner space-y-4">
                  {result.content.map((line, i) => (
                    <div key={i} className="text-lg leading-relaxed border-l-4 border-[#d4af37] pl-3 py-1">
                      {line}
                    </div>
                  ))}
               </div>

               <div className="text-center bg-[#fff5e6] p-4 rounded-lg border border-[#ffd700]">
                  <p className="text-[#8b0000] font-bold text-lg italic font-serif">"{result.quote}"</p>
               </div>

               <div className="flex justify-center gap-4 pt-4">
                  <button onClick={reset} className="px-6 py-2 border-2 border-[#8b0000] text-[#8b0000] rounded-full font-bold hover:bg-[#8b0000] hover:text-white transition-colors">
                     再求一支
                  </button>
                  <button onClick={onClose} className="px-6 py-2 bg-[#d4af37] text-white rounded-full font-bold hover:bg-[#b8860b] transition-colors shadow-md">
                     領受福氣 (關閉)
                  </button>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#5c3a21] text-[#e6cca0] p-3 text-center text-xs">
           <p>⚠️ 以上資訊只供參考，不可盡信。祝願大家好運和健康！</p>
        </div>
      </div>
    </div>
  );
};
