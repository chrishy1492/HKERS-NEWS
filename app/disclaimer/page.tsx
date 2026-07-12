export const metadata = { title: '免責聲明 - HKER News' }

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-16 text-sm leading-relaxed text-stone-300">
      <h1 className="text-xl font-bold text-hker-gold-light">💡 免責聲明 (Disclaimer)</h1>
      <p>
        歡迎光臨本論壇，為維護良好的社群環境及保障各方權益，請所有使用者在使用本站服務前，
        務必詳閱並遵守以下聲明：
      </p>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">一、法律守法原則</h2>
        <p>嚴禁違法言論：本論壇所有使用者之言論與行為均受法律約束。嚴禁發佈任何違反當地法律之內容。</p>
        <p>
          遵守特定區域法律：使用者必須嚴格遵守中華人民共和國及香港特別行政區之法律法規（第23條及《香港國安法》）。
          嚴禁發佈任何危害國家安全、公眾秩序或煽動違法行為之言論。
        </p>
        <p>拒絕有害內容：本站堅決反對並嚴禁任何涉及暴力、色情、低俗或人身攻擊之訊息，一經發現將立即刪除並封禁帳號。</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">二、遊戲性質與娛樂警示</h2>
        <p>非賭博性質：本網站所提供之小遊戲，僅供社群互動與休閒娛樂使用。</p>
        <p>
          純積分機制：遊戲內所有數值均為「虛擬積分」，不具備任何實際價值，亦不可兌換為現金或任何實物資產，
          本站嚴禁任何涉及真實金錢的博弈行為。
        </p>
        <p>理性娛樂：請使用者保持健康心態，切勿沉迷虛擬遊戲。遊戲旨在舒壓，不應影響日常生活、工作或家庭。</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">三、專業內容參考與免責</h2>
        <p>參考性質：本站所提供之算命、占卜及運勢分析功能，其結果僅供心理參考，不代表科學事實或必然趨勢。</p>
        <p>
          決策自主：使用者不應將算命結果作為現實決策（如投資、醫療、法律等）之唯一依據。
          對於因參考相關內容而產生的任何損失，本站概不負責。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">四、聲明之變更</h2>
        <p>本論壇保留隨時修訂本聲明之權利。繼續使用本站服務即代表您同意上述所有條款。</p>
      </section>
    </div>
  )
}
