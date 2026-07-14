import { parseStringPromise } from 'xml2js'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


// ⚠️ 重要：本檔案不含任何真實金鑰。所有金鑰一律從環境變數讀取，
// 請在 Vercel 專案設定 NEWS_API_KEY / GEMINI_API_KEY / SUPABASE_SERVICE_ROLE_KEY /
// NEXT_PUBLIC_SUPABASE_URL。
// 如果這幾組金鑰曾經以明文出現在任何文件、聊天紀錄或程式碼裡，
// 請視為已外洩，先到對應後台重新產生（rotate）新金鑰再部署本檔案。

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

// 這份清單不是法律判斷，只是「送人工審查」的觸發字詞，
// 命中的新聞會被標記為 needs_review，不會自動發佈。
// 香港《國家安全法》、《基本法》第23條相關內容尤其敏感，一律先擋下來給人看過。
const SENSITIVE_KEYWORDS = [
  '國家安全法', '港獨', '顛覆國家政權', '分裂國家', '境外勢力',
  '基本法23條', '煽動', '顛覆', '恐怖活動', '勾結外國',
]

function containsSensitiveContent(text: string): boolean {
  return SENSITIVE_KEYWORDS.some((kw) => text.includes(kw))
}

function isWithinTwoDays(publishedAt: string): boolean {
  const t = new Date(publishedAt).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t <= TWO_DAYS_MS
}

const REGIONS = ['中國香港', '台灣', '英國', '美國', '加拿大', '澳洲', '歐洲']
const TOPICS = ['地產', '時事', '財經', '娛樂', '旅遊', '數碼', '汽車', '宗教', '優惠', '校園', '天氣', '社區活動']

type Classification = { titleEn: string | null; contentEn: string | null; region: string; topic: string }

async function classifyAndTranslate(title: string, content: string): Promise<Classification> {
  const apiKey = process.env.GEMINI_API_KEY
  const fallback: Classification = { titleEn: null, contentEn: null, region: '中國香港', topic: '時事' }
  if (!apiKey) return fallback

  const prompt = `你是一個嚴謹的新聞編輯助理。請根據以下中文新聞的標題與內文，完成三件事，並「只」回傳一個 JSON 物件，不要加任何說明文字或 markdown 符號：
1. title_en：把標題翻譯成自然的英文
2. content_en：把內文翻譯成自然的英文
3. region：從這個清單裡選一個最符合的地區：${REGIONS.join('、')}
4. topic：從這個清單裡選一個最符合的主題：${TOPICS.join('、')}

規則：只根據新聞實際內容判斷，不要編造或誇大內容。如果無法確定地區，預設選「中國香港」；無法確定主題，預設選「時事」。

標題：${title}
內文：${content}

回傳格式範例：{"title_en":"...","content_en":"...","region":"中國香港","topic":"時事"}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    if (!res.ok) return fallback
    const data = await res.json()
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      titleEn: parsed.title_en ?? null,
      contentEn: parsed.content_en ?? null,
      region: REGIONS.includes(parsed.region) ? parsed.region : '中國香港',
      topic: TOPICS.includes(parsed.topic) ? parsed.topic : '時事',
    }
  } catch (e) {
    console.error('[news-bot] classify/translate failed:', (e as Error).message)
    return fallback
  }
}

async function translateText(text: string, targetLang: 'en' | 'zh'): Promise<string | null> {
  // 用 Gemini 做翻譯（也可換成任何翻譯 API）。翻譯失敗時回傳 null，
  // 不讓單一新聞的翻譯錯誤中斷整個流程。
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    targetLang === 'en'
                      ? `Translate the following Chinese news text into natural English. Only return the translation, no extra commentary:\n\n${text}`
                      : `請將以下英文新聞翻譯成自然的繁體中文，只回傳翻譯內容，不要加任何說明：\n\n${text}`,
                },
              ],
            },
          ],
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null
  } catch (e) {
    console.error('[news-bot] translate failed:', (e as Error).message)
    return null
  }
}

const RSS_SOURCES = [
  'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
  'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml',
  'https://news.rthk.hk/rthk/ch/news/rss/c/expressnews.xml',
]

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchRssNews() {
  const results = await Promise.all(
    RSS_SOURCES.map(async (url) => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`RSS ${res.status}`)
        const xml = await res.text()
        const parsed = await parseStringPromise(xml)
        const items = parsed?.rss?.channel?.[0]?.item || []
        return items.map((item: any) => ({
          title: stripHtml(item.title?.[0] ?? ''),
          content: stripHtml(item.description?.[0] ?? item.content?.[0] ?? ''),
          url: item.link?.[0] ?? '',
          source_name: new URL(url).hostname,
          publishedAt: item.pubDate?.[0] ?? '',
        }))
      } catch (e) {
        console.error('[news-bot] RSS fetch failed for', url, (e as Error).message)
        return []
      }
    })
  )
  return results.flat()
}

async function fetchNewsApiNews() {
  const key = process.env.NEWS_API_KEY
  if (!key) return []
  const twoDaysAgo = new Date(Date.now() - TWO_DAYS_MS).toISOString().slice(0, 10)
  const url = `https://newsapi.org/v2/everything?q=香港 OR 國際 OR 科技 OR 經濟&language=zh&sortBy=publishedAt&pageSize=50&from=${twoDaysAgo}&apiKey=${key}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`NewsAPI ${res.status}`)
    const data = await res.json()
    return (data.articles || []).map((a: any) => ({
      title: a.title,
      content: a.description || a.content || '',
      url: a.url,
      source_name: a.source?.name || 'NewsAPI',
      publishedAt: a.publishedAt,
    }))
  } catch (e) {
    console.error('[news-bot] NewsAPI fetch failed:', (e as Error).message)
    return []
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ success: false, message: '缺少 Supabase 環境變數' }, { status: 500 })
  }
  const supabase = createSupabaseAdminClient(supabaseUrl, serviceKey)

  const [rssNews, newsApiNews] = await Promise.all([fetchRssNews(), fetchNewsApiNews()])
  let allNews = [...rssNews, ...newsApiNews]

  // 過濾：必須有標題，且原新聞發布時間在 2 天內
  allNews = allNews.filter((n) => n.title && isWithinTwoDays(n.publishedAt))

  // 去重（標題 + 發布時間組合）
  const seen = new Set<string>()
  const uniqueNews = allNews.filter((n) => {
    const key = `${n.title}|${n.publishedAt}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const selected = uniqueNews.sort(() => 0.5 - Math.random()).slice(0, 6)

  let published = 0
  let flaggedForReview = 0
  let duplicates = 0
  let errors = 0
  const titles: string[] = []

  for (const news of selected) {
    try {
      const { data: existing } = await supabase
        .from('news_posts')
        .select('id')
        .eq('title_zh', news.title)
        .maybeSingle()

      if (existing) {
        duplicates++
        continue
      }

      const combinedText = `${news.title}\n${news.content}`
      const needsReview = containsSensitiveContent(combinedText)

      if (needsReview) {
        // 命中敏感詞：不自動發佈，交由人工在管理後台審查
        flaggedForReview++
        console.warn('[news-bot] flagged for manual review:', news.title)
        continue
      }

      const { titleEn, contentEn, region, topic } = await classifyAndTranslate(news.title, news.content)

      await supabase.from('news_posts').insert({
        title_zh: news.title,
        title_en: titleEn,
        content_zh: news.content,
        content_en: contentEn,
        source_url: news.url,
        source_name: news.source_name,
        region,
        topic,
        published_at: new Date(news.publishedAt).toISOString(),
      })

      try {
        await supabase.rpc('log_news_posted')
      } catch {}
      published++
      titles.push(news.title)
    } catch (e) {
      console.error('[news-bot] error processing:', news.title, (e as Error).message)
      errors++
    }
  }

  // 更新今日訪客統計，供管理後台儀表板顯示
  try {
    await supabase.rpc('log_visit')
  } catch {}

  return Response.json({
    success: true,
    found: uniqueNews.length,
    published,
    duplicates,
    flaggedForReview,
    errors,
    titles,
  })
}
