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
    <article className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {sourceName} · {new Date(publishedAt).toLocaleString('zh-HK')}
        </span>
        {titleEn && (
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setLang('zh')}
              className={`rounded px-2 py-0.5 ${lang === 'zh' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'}`}
            >
              中文
            </button>
            <button
              onClick={() => setLang('en')}
              className={`rounded px-2 py-0.5 ${lang === 'en' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'}`}
            >
              EN
            </button>
          </div>
        )}
      </div>

      <h2 className="mb-1 text-lg font-bold">{title}</h2>
      <p className="mb-3 text-sm text-slate-300">{content}</p>

      <div className="flex items-center justify-between">
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline">
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
