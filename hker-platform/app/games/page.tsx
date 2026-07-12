const GAMES = [
  { name: '幸運老虎機', file: 'slot-machine.html', emoji: '🎰' },
  { name: '小瑪莉', file: 'xiao-mali.html', emoji: '🎡' },
  { name: '量子脈衝輪盤', file: 'roulette.html', emoji: '🌀' },
  { name: '魚蝦蟹', file: 'fish-prawn-crab.html', emoji: '🐟' },
]

export default function GamesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4">
      <h1 className="mb-2 text-xl font-bold text-hker-gold-light">小遊戲</h1>
      <p className="mb-4 text-xs text-stone-500">
        以下皆為純娛樂單機小遊戲，不記錄、不累計、不涉及任何帳戶或真實價值。
      </p>
      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((g) => (
          <a
            key={g.file}
            href={`/games/${g.file}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 rounded-lg border border-hker-gold/20 bg-hker-charcoal p-6 transition hover:border-hker-gold/60"
          >
            <span className="text-4xl">{g.emoji}</span>
            <span className="text-sm font-bold text-stone-200">{g.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
