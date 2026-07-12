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
  publishedAt: string
  likeCount: number
  currentUserId: string | null
}

export default function NewsCard({
  id, titleZh, titleEn, contentZh, contentEn, sourceUrl, sourceName, publishedAt, likeCount, currentUserId,
}: Props) {
  const [lang, setLang] = useState<'zh' | 'en'>('zh')

  const title = lang === 'zh' ? titleZh : (titleEn ?? titleZh)
  const content = lang === 'zh' ? contentZh : (contentEn ?? contentZh)

  return (
    <article className="rounded-lg border border-hker-gold/20 bg-hker-charcoal p-4 shadow-sm transition hover:border-hker-gold/50">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-stone-500">
          {sourceName} · {new Date(publishedAt).toLocaleString('zh-HK')}
        </span>
        {titleEn && (
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setLang('zh')}
              className={`rounded px-2 py-0.5 ${lang === 'zh' ? 'bg-hker-red text-white' : 'bg-black/30 text-stone-400'}`}
            >
              中文
            </button>
            <button
              onClick={() => setLang('en')}
              className={`rounded px-2 py-0.5 ${lang === 'en' ? 'bg-hker-red text-white' : 'bg-black/30 text-stone-400'}`}
            >
              EN
            </button>
          </div>
        )}
      </div>

      <h2 className="mb-1 text-lg font-bold text-hker-gold-light">{title}</h2>
      <p className="mb-3 text-sm leading-relaxed text-stone-300">{content}</p>

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
    </article>
  )
}
