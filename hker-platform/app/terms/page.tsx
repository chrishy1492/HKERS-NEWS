export const metadata = { title: '使用條款 - HKER News' }

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-16 text-sm leading-relaxed text-stone-300">
      <h1 className="text-xl font-bold text-hker-gold-light">📄 使用條款</h1>
      <p>使用本網站（下稱「本站」）即代表您同意遵守以下條款。若您不同意本條款之任何部分，請勿使用本站服務。</p>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">一、服務範圍</h2>
        <p>本站提供新聞瀏覽、社群討論、休閒小遊戲及相關互動功能，服務內容可能隨時調整、新增或終止，恕不另行個別通知。</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">二、帳戶責任</h2>
        <p>使用者須提供真實、正確之註冊資料，並妥善保管自己的帳號密碼。因帳號密碼保管不當所生之損失，由使用者自行負責。</p>
        <p>每人僅限申請一個帳號，不得以任何方式偽冒他人身分或干擾其他使用者正常使用本站服務。</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">三、內容規範</h2>
        <p>使用者於本站發佈之任何內容，須遵守本站
          {' '}<a href="/disclaimer" className="text-hker-gold-light hover:underline">免責聲明</a>{' '}
          所列之法律守法原則，不得發佈違法、危害國家安全、暴力、色情、低俗或人身攻擊之內容。
        </p>
        <p>管理團隊有權在不事先通知的情況下，移除違規內容、暫停或終止違規帳號之使用權限。</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">四、智慧財產權</h2>
        <p>本站之名稱、標誌、版面設計及原創內容之智慧財產權歸本站所有；使用者發佈之原創內容，其著作權仍歸使用者本人所有，惟使用者同意授權本站於站內展示、傳播該內容。</p>
        <p>本站轉載之新聞內容均標明原始來源與連結，相關著作權歸屬原出處所有。</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">五、服務變更與終止</h2>
        <p>本站保留隨時修改、暫停或終止全部或部分服務之權利，亦保留隨時修訂本條款之權利。條款如有變更，將公告於本站，使用者繼續使用本站服務即視為同意變更後之條款。</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-hker-gold-light">六、準據法</h2>
        <p>本條款之解釋與適用，以及與本條款有關的爭議，均應依照香港特別行政區之法律予以規範。</p>
      </section>
    </div>
  )
}
