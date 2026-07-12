import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import NewsCard from '@/components/NewsCard'

export const revalidate = 0 // 永遠讀最新資料，避免快取造成「手機看到舊資料」的錯覺

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: news, error } = await supabase
    .from('news_posts')
    .select('id, title_zh, title_en, content_zh, content_en, source_url, source_name, published_at, like_count')
    .order('published_at', { ascending: false })
    .limit(30)

  return (
    <div>
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        <Image src="/hero-banner.jpg" alt="Hong Kong" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-hker-ink via-hker-ink/40 to-hker-ink/10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-black tracking-widest text-hker-gold-light drop-shadow sm:text-4xl">
            HKER NEWS
          </h1>
          <p className="mt-1 text-xs tracking-[0.3em] text-stone-200/80 sm:text-sm">
            香港人 · 即時新聞
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 p-4">
        {error && (
          <p className="rounded border border-hker-red/50 bg-hker-red/10 p-3 text-sm text-red-300">
            新聞讀取失敗，請確認 Supabase 資料表與環境變數是否已設定（{error.message}）。
          </p>
        )}

        {!error && (!news || news.length === 0) && (
          <p className="text-sm text-stone-400">
            目前還沒有新聞。請確認新聞機械人（<code>/api/news-bot</code>）已設定排程並成功執行過。
          </p>
        )}

        {news?.map((n) => (
          <NewsCard
            key={n.id}
            id={n.id}
            titleZh={n.title_zh}
            titleEn={n.title_en}
            contentZh={n.content_zh}
            contentEn={n.content_en}
            sourceUrl={n.source_url}
            sourceName={n.source_name}
            publishedAt={n.published_at}
            likeCount={n.like_count}
            currentUserId={user?.id ?? null}
          />
        ))}
      </div>
    </div>
  )
}
