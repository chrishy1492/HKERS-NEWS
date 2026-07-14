const FORTUNE = [
  { name: '掐指一算（小六壬）', file: 'liuren.html', emoji: '🔮' },
  { name: '塔羅占卜', file: 'tarot.html', emoji: '🃏' },
  { name: '雲端祈福', file: 'prayer.html', emoji: '🏮' },
]

export default function FortunePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4">
      <h1 className="font-display mb-2 text-xl font-bold text-hker-gold-light">算命風水</h1>
      <p className="mb-4 text-xs text-hker-stone">
        以下結果僅供心理參考及休閒娛樂之用，不代表科學事實，請勿作為現實決策之唯一依據。
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FORTUNE.map((f) => (
          <a
            key={f.file}
            href={`/fortune/${f.file}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 rounded-lg border border-hker-gold/20 bg-hker-charcoal p-6 transition hover:border-hker-gold/60"
          >
            <span className="text-4xl">{f.emoji}</span>
            <span className="text-sm font-bold text-stone-200">{f.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
