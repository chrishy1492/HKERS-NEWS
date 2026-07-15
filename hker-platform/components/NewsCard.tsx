'use client'
import { useState } from 'react'
import NewsShareLike from '@/components/NewsShareLike'

type Props = {
  id: number
  titleZh: string
  titleEn: string | null
  contentZh: string
  contentEn: string | null
  sourceUrl: string
  sourceName: string | null
  region?: string | null
  topic?: string | null
  publishedAt: string
  likeCount: number
  currentUserId: string | null
}

export default function NewsCard({
  id, titleZh, titleEn, contentZh, contentEn, sourceUrl, sourceName, region, topic, publishedAt, likeCount, currentUserId,
}: Props) {
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const title = lang === 'zh' ? titleZh : (titleEn ?? titleZh)
  const content = lang === 'zh' ? contentZh : (contentEn ?? contentZh)

  return (
    <article className="break-inside-avoid-column mb-4 flex gap-3 rounded-md bg-hker-charcoal/60 pr-4 shadow-sm transition hover:bg-hker-charcoal">
      <div className="w-1 shrink-0 rounded-full bg-hker-lacquer" />
      <div className="flex-1 py-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-hker-stone">
            <span>{sourceName} · {new Date(publishedAt).toLocaleString('zh-HK')}</span>
            {region && <span className="rounded bg-black/30 px-1.5 py-0.5 normal-case text-hker-gold-light">{region}</span>}
            {topic && <span className="rounded bg-black/30 px-1.5 py-0.5 normal-case text-hker-gold-light">{topic}</span>}
          </div>
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            disabled={!titleEn}
            className="flex items-center gap-1 rounded-full bg-hker-lacquer/90 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-hker-lacquer disabled:cursor-not-allowed disabled:bg-black/30 disabled:text-stone-500"
            title={titleEn ? '翻譯這則新聞' : '此則新聞暫無翻譯'}
          >
            🌐 {lang === 'zh' ? '譯做英文' : '轉回中文'}
          </button>
        </div>
        <h2 className="font-display mb-1.5 text-xl font-bold leading-snug text-hker-gold-light">{title}</h2>
        <p className="mb-3 text-sm leading-relaxed text-stone-300 whitespace-pre-line">{content}</p>
        <div className="flex items-center justify-between border-t border-hker-gold/10 pt-3">
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-hker-gold-light hover:underline">
            查看原文 →
          </a>
          <NewsShareLike
            newsId={id}
            title={title}
            url={sourceUrl}
            initialLikeCount={likeCount}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </article>
  )
}
