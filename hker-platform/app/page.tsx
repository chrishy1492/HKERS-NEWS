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
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="mb-2 text-xl font-bold text-cyan-400">最新新聞</h1>

      {error && (
        <p className="rounded bg-red-900/40 p-3 text-sm text-red-300">
          新聞讀取失敗，請確認 Supabase 資料表與環境變數是否已設定（{error.message}）。
        </p>
      )}

      {!error && (!news || news.length === 0) && (
        <p className="text-sm text-slate-400">
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
  )
}
