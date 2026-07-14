export const metadata = { title: '聯絡方式 - HKER News' }

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-16 text-sm leading-relaxed text-stone-300">
      <h1 className="text-xl font-bold text-hker-gold-light">✉️ 聯絡方式</h1>
      <p>如有任何查詢、意見反映，或需要檢舉違規內容，歡迎透過以下方式聯絡我們：</p>

      <div className="rounded-lg border border-hker-gold/20 bg-hker-charcoal p-4">
        <p className="text-stone-300">
          一般查詢信箱：
          <a href="mailto:hkerstoken@gmail.com" className="ml-1 text-hker-gold-light hover:underline">
            hkerstoken@gmail.com
          </a>
        </p>
      </div>

      <p className="text-xs text-stone-500">
        我們會盡快回覆您的訊息。若涉及違法或違規內容檢舉，請盡量提供貼文連結與具體說明，以協助管理團隊加快處理。
      </p>
    </div>
  )
}
