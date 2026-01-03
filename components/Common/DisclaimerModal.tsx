
import React from 'react';
import { X, ShieldAlert, Gavel, AlertTriangle, Scale, BookOpen } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl relative border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 p-6 md:p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-red-100 rounded-xl text-red-600">
               <ShieldAlert size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">免責聲明</h2>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Disclaimer & Legal Notice</p>
             </div>
           </div>
           <button 
             onClick={onClose}
             className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-all"
           >
             <X size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 overflow-y-auto space-y-8 text-slate-700 leading-relaxed font-medium custom-scrollbar">
           
           <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-black text-amber-800 mb-1">💡 網站免責聲明 (Disclaimer)</h4>
                <p className="text-sm text-amber-800/80">
                  歡迎光臨本論壇，為維護良好的社群環境及保障各方權益，請所有使用者在使用本站服務前，務必詳閱並遵守以下聲明：
                </p>
              </div>
           </div>

           <section className="space-y-4">
             <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b border-slate-100 pb-2">
               <Gavel className="text-blue-600" size={20} /> 一、 法律守法原則
             </h3>
             <ul className="list-disc pl-5 space-y-3 text-sm md:text-base text-slate-600">
               <li><strong className="text-slate-900">嚴禁違法言論：</strong> 本論壇所有使用者之言論與行為均受法律約束。嚴禁發佈任何違反當地法律之內容。</li>
               <li><strong className="text-slate-900">遵守特定區域法律：</strong> 使用者必須嚴格遵守中華人民共和國及香港特別行政區之法律法規(23條和國安法)。嚴禁發佈任何危害國家安全、公眾秩序或煽動違法行為之言論。</li>
               <li><strong className="text-slate-900">拒絕有害內容：</strong> 本站堅決反對並嚴禁任何涉及暴力、色情、低俗或人身攻擊之訊息，一經發現將立即刪除並封禁帳號。</li>
             </ul>
           </section>

           <section className="space-y-4">
             <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b border-slate-100 pb-2">
               <Scale className="text-green-600" size={20} /> 二、 遊戲性質與娛樂警示
             </h3>
             <ul className="list-disc pl-5 space-y-3 text-sm md:text-base text-slate-600">
               <li><strong className="text-slate-900">非賭博性質：</strong> 本網站所提供之「小瑪莉」、「魚蝦蟹」等遊戲，僅供社群互動與休閒娛樂使用。</li>
               <li><strong className="text-slate-900">純積分機制：</strong> 遊戲內所有數值均為「虛擬積分」，不具備任何實際價值，亦不可兌換為現金或任何實物資產。本站嚴禁任何涉及真實金錢的博弈行為。</li>
               <li><strong className="text-slate-900">理性娛樂：</strong> 請使用者保持健康心態，切勿沉迷虛擬遊戲。遊戲旨在舒壓，不應影響日常生活、工作或家庭。</li>
             </ul>
           </section>

           <section className="space-y-4">
             <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b border-slate-100 pb-2">
               <BookOpen className="text-purple-600" size={20} /> 三、 專業內容參考與免責
             </h3>
             <ul className="list-disc pl-5 space-y-3 text-sm md:text-base text-slate-600">
               <li><strong className="text-slate-900">參考性質：</strong> 本站所提供之「算命」、「占卜」及「運勢分析」功能，其結果僅供心理參考，不代表科學事實或必然趨勢。</li>
               <li><strong className="text-slate-900">決策自主：</strong> 使用者不應將算命結果作為現實決策（如投資、醫療、法律等）之唯一依據。對於因參考相關內容而產生的任何損失，本站概不負責。</li>
             </ul>
           </section>

           <section className="space-y-4">
             <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b border-slate-100 pb-2">
               四、 聲明之變更
             </h3>
             <p className="text-sm md:text-base text-slate-600">
               本論壇保留隨時修訂本聲明之權利。繼續使用本站服務即代表您同意上述所有條款。
             </p>
           </section>

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 text-center">
           <button 
             onClick={onClose}
             className="w-full md:w-auto px-12 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
           >
             我已閱讀並同意 (I Agree)
           </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
