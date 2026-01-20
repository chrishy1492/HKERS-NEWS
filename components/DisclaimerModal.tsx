import React from 'react';
import { X, ShieldAlert, Scale, Gamepad2, Sparkles, FileText } from 'lucide-react';

interface DisclaimerModalProps {
  onClose: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col border border-gray-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-3 text-red-600">
            <div className="p-2 bg-red-50 rounded-lg">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">網站免責聲明</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wider">HKER Token Platform Disclaimer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
            <X size={20} className="text-gray-400 group-hover:text-gray-700" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-8 text-gray-700 leading-relaxed font-light">
          
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 flex gap-3">
            <FileText className="shrink-0 w-5 h-5 mt-0.5" />
            <p>歡迎光臨本論壇，為維護良好的社群環境及保障各方權益，請所有使用者在使用本站服務前，務必詳閱並遵守以下聲明。</p>
          </div>

          <section>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3 text-lg border-b border-gray-100 pb-2">
              <Scale size={20} className="text-blue-600" /> 
              一、 法律守法原則
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <span><strong>嚴禁違法言論：</strong>本論壇所有使用者之言論與行為均受法律約束。嚴禁發佈任何違反當地法律之內容。</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <span><strong>遵守特定區域法律：</strong>使用者必須嚴格遵守中華人民共和國及香港特別行政區之法律法規(23條和國安法)。嚴禁發佈任何危害國家安全、公眾秩序或煽動違法行為之言論。</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <span><strong>拒絕有害內容：</strong>本站堅決反對並嚴禁任何涉及暴力、色情、低俗或人身攻擊之訊息，一經發現將立即刪除並封禁帳號。</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3 text-lg border-b border-gray-100 pb-2">
              <Gamepad2 size={20} className="text-purple-600" /> 
              二、 遊戲性質與娛樂警示
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0"></span>
                <span><strong>非賭博性質：</strong>本網站所提供之「小瑪莉」、「魚蝦蟹」等遊戲，僅供社群互動與休閒娛樂使用。</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0"></span>
                <span><strong>純積分機制：</strong>遊戲內所有數值均為「虛擬積分」，不具備任何實際價值，亦不可兌換為現金或任何實物資產。本站嚴禁任何涉及真實金錢的博弈行為。</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0"></span>
                <span><strong>理性娛樂：</strong>請使用者保持健康心態，切勿沉迷虛擬遊戲。遊戲旨在舒壓，不應影響日常生活、工作或家庭。</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3 text-lg border-b border-gray-100 pb-2">
              <Sparkles size={20} className="text-yellow-600" /> 
              三、 專業內容參考與免責
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0"></span>
                <span><strong>參考性質：</strong>本站所提供之「算命」、「占卜」及「運勢分析」功能，其結果僅供心理參考，不代表科學事實或必然趨勢。</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0"></span>
                <span><strong>決策自主：</strong>使用者不應將算命結果作為現實決策（如投資、醫療、法律等）之唯一依據。對於因參考相關內容而產生的任何損失，本站概不負責。</span>
              </li>
            </ul>
          </section>

          <div className="text-xs text-gray-400 pt-4 border-t border-gray-100 text-center">
            本論壇保留隨時修訂本聲明之權利。繼續使用本站服務即代表您同意上述所有條款。
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-8 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition shadow-lg transform active:scale-95 font-bold text-sm flex items-center gap-2">
            我明白了 (I Understand)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;