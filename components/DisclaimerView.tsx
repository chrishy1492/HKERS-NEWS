
import React from 'react';
import { ShieldAlert, Scale, Gamepad2, Sparkles, FileText, AlertTriangle } from 'lucide-react';

const DisclaimerView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic">💡 免責聲明 (Disclaimer)</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">HKER Forum Legal Protection Protocol</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[3.5rem] p-8 md:p-14 shadow-xl border border-slate-100">
        <div className="prose prose-slate max-w-none space-y-12">
          
          <div className="text-center pb-8 border-b border-slate-50">
            <p className="text-slate-600 font-bold leading-relaxed max-w-2xl mx-auto">
              歡迎光臨本論壇，為維護良好的社群環境及保障各方權益，請所有使用者在使用本站服務前，務必詳閱並遵守以下聲明：
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-slate-900 rounded-lg">
                <Scale size={18} className="text-white" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">一、 法律守法原則</h2>
            </div>
            <div className="pl-12 space-y-4 text-slate-600 font-medium">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-black text-slate-900 mb-1">嚴禁違法言論</p>
                <p>本論壇所有使用者之言論與行為均受法律約束。嚴禁發佈任何違反當地法律之內容。</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-black text-slate-900 mb-1">遵守特定區域法律</p>
                <p>使用者必須嚴格遵守中華人民共和國及香港特別行政區之法律法規（包括但不限於《維護國家安全條例》及相關國家安全法）。嚴禁發佈任何危害國家安全、公眾秩序或煽動違法行為之言論。</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-black text-slate-900 mb-1">拒絕有害內容</p>
                <p>本站堅決反對並嚴禁任何涉及暴力、色情、低俗或人身攻擊之訊息，一經發現將立即刪除並封禁帳號。</p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Gamepad2 size={18} className="text-black" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">二、 遊戲性質與娛樂警示</h2>
            </div>
            <div className="pl-12 space-y-4 text-slate-600 font-medium">
              <div className="p-5 bg-yellow-50/30 rounded-2xl border border-yellow-100">
                <p className="font-black text-slate-900 mb-1">非賭博性質</p>
                <p>本網站所提供之「小瑪莉」、「魚蝦蟹」、「百家樂」等遊戲，僅供社群互動與休閒娛樂使用。</p>
              </div>
              <div className="p-5 bg-yellow-50/30 rounded-2xl border border-yellow-100">
                <p className="font-black text-slate-900 mb-1">純積分機制</p>
                <p>遊戲內所有數值均為「虛擬積分」，不具備任何實際價值，亦不可兌換為現金或任何實物資產。本站嚴禁任何涉及真實金錢的博弈行為。</p>
              </div>
              <div className="p-5 bg-yellow-50/30 rounded-2xl border border-yellow-100">
                <p className="font-black text-slate-900 mb-1">理性娛樂</p>
                <p>請使用者保持健康心態，切勿沉迷虛擬遊戲。遊戲旨在舒壓，不應影響日常生活、工作或家庭。</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Sparkles size={18} className="text-white" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">三、 專業內容參考與免責</h2>
            </div>
            <div className="pl-12 space-y-4 text-slate-600 font-medium">
              <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                <p className="font-black text-slate-900 mb-1">參考性質</p>
                <p>本站所提供之「算命」、「占卜」及「運勢分析」功能，其結果僅供心理參考，不代表科學事實或必然趨勢。</p>
              </div>
              <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                <p className="font-black text-slate-900 mb-1">決策自主</p>
                <p>使用者不應將算命結果作為現實決策（如投資、醫療、法律等）之唯一依據。對於因參考相關內容而產生的任何損失，本站概不負責。</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-slate-200 rounded-lg">
                <FileText size={18} className="text-slate-700" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">四、 聲明之變更</h2>
            </div>
            <div className="pl-12 text-slate-600 font-medium">
              <p>本論壇保留隨時修訂本聲明之權利。繼續使用本站服務即代表您同意上述所有條款。</p>
            </div>
          </section>

          {/* Section 5 - Critical Token Note */}
          <section className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <AlertTriangle size={80} className="text-red-500" />
            </div>
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} className="animate-pulse" />
              <h2 className="text-xl font-black uppercase tracking-tight">五、 HKER Token 積分說明</h2>
            </div>
            <p className="text-red-900 font-black text-lg italic leading-relaxed relative z-10">
              所有 HKER Token 積分贈送計畫均設有上限，採取「送完即止」原則。積分送完後，系統將停止發放，用戶不得以此為由向本站提出任何形式之追究、賠償或投訴。
            </p>
          </section>

        </div>

        <div className="mt-16 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.5em]">
          End of Protocol • Version 2.8.0
        </div>
      </div>
    </div>
  );
};

export default DisclaimerView;
