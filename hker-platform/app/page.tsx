import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NewsCard from '@/components/NewsCard'
import RidgeDivider from '@/components/RidgeDivider'

export const revalidate = 0 // 永遠讀最新資料，避免快取造成「手機看到舊資料」的錯覺

const REGIONS = ['中國香港', '台灣', '英國', '美國', '加拿大', '澳洲', '歐洲']
const TOPICS = ['地產', '時事', '財經', '娛樂', '旅遊', '數碼', '汽車', '宗教', '優惠', '校園', '天氣', '社區活動']

function buildHref(current: { region?: string; topic?: string; q?: string }, changes: { region?: string; topic?: string }) {
  const params = new URLSearchParams()
  const region = changes.region !== undefined ? changes.region : current.region
  const topic = changes.topic !== undefined ? changes.topic : current.topic
  if (region) params.set('region', region)
  if (topic) params.set('topic', topic)
  if (current.q) params.set('q', current.q)
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { region?: string; topic?: string; q?: string }
}) {
  const supabase = await createClient()
  const { region, topic, q } = searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('news_posts')
    .select('id, title_zh, title_en, content_zh, content_en, source_url, source_name, region, topic, published_at, like_count')
    .order('published_at', { ascending: false })
    .limit(30)

  if (region) query = query.eq('region', region)
  if (topic) query = query.eq('topic', topic)
  if (q) query = query.or(`title_zh.ilike.%${q}%,content_zh.ilike.%${q}%`)

  const { data: news, error } = await query

  return (
    <div>
      <div className="relative h-40 w-full overflow-hidden sm:h-56">
        <Image src="/hero-banner.jpg" alt="HKER" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-hker-ink via-hker-ink/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <RidgeDivider />
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 p-4">
        {/* 地區篩選 */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildHref({ region, topic, q }, { region: undefined })}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${!region ? 'bg-hker-lacquer text-white' : 'bg-hker-charcoal text-stone-300 hover:text-hker-gold-light'}`}
          >
            全部地區
          </Link>
          {REGIONS.map((r) => (
            <Link
              key={r}
              href={buildHref({ region, topic, q }, { region: r })}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${region === r ? 'bg-hker-lacquer text-white' : 'bg-hker-charcoal text-stone-300 hover:text-hker-gold-light'}`}
            >
              {r}
            </Link>
          ))}
        </div>

        {/* 主題篩選 */}
        <div className="flex flex-wrap gap-2 border-b border-hker-gold/10 pb-4">
          <Link
            href={buildHref({ region, topic, q }, { topic: undefined })}
            className={`rounded px-2.5 py-1 text-xs transition ${!topic ? 'bg-hker-gold/20 text-hker-gold-light' : 'text-hker-stone hover:text-hker-gold-light'}`}
          >
            全部主題
          </Link>
          {TOPICS.map((t) => (
            <Link
              key={t}
              href={buildHref({ region, topic, q }, { topic: t })}
              className={`rounded px-2.5 py-1 text-xs transition ${topic === t ? 'bg-hker-gold/20 text-hker-gold-light' : 'text-hker-stone hover:text-hker-gold-light'}`}
            >
              {t}
            </Link>
          ))}
        </div>

        {error && (
          <p className="rounded border border-hker-lacquer/50 bg-hker-lacquer/10 p-3 text-sm text-red-300">
            新聞讀取失敗，請確認 Supabase 資料表與環境變數是否已設定（{error.message}）。
          </p>
        )}

        {!error && (!news || news.length === 0) && (
          <p className="text-sm text-hker-stone">
            {q || region || topic
              ? '沒有符合篩選條件的新聞。'
              : '目前還沒有新聞。請確認新聞機械人（/api/news-bot）已設定排程並成功執行過。'}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
              region={n.region}
              topic={n.topic}
              publishedAt={n.published_at}
              likeCount={n.like_count}
              currentUserId={user?.id ?? null}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
