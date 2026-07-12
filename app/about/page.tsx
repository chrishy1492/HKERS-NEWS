export const metadata = { title: '關於我們 - HKER News' }

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-16 text-sm leading-relaxed text-stone-300">
      <h1 className="text-xl font-bold text-hker-gold-light">ℹ️ 關於我們</h1>
      <p>
        HKER News 是一個為香港人社群打造的新聞與休閒娛樂平台，希望在同一個地方，
        讓大家可以看到即時新聞、輕鬆玩小遊戲、參與社群討論。
      </p>
      <p>
        我們重視資訊的即時性與準確性，新聞內容會標明來源與原文連結；娛樂內容則單純作為
        休閒放鬆之用，不涉及任何真實金錢或資產交易。
      </p>
      <p>
        本站所有內容與服務均需遵守香港特別行政區及相關司法管轄區之法律法規，
        詳情請參閱本站的
        {' '}
        <a href="/disclaimer" className="text-hker-gold-light hover:underline">免責聲明</a>
        {' '}與{' '}
        <a href="/terms" className="text-hker-gold-light hover:underline">使用條款</a>
        。
      </p>
    </div>
  )
}
