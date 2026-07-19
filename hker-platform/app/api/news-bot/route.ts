import { parseStringPromise } from 'xml2js'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

const SENSITIVE_KEYWORDS = [
  '國家安全法', '港獨', '顛覆國家政權', '分裂國家', '境外勢力',
  '基本法23條', '煽動', '顛覆', '恐怖活動', '勾結外國',
  '台獨', '藏獨', '疆獨', '分離主義', '暴動', '策動',
]

function containsSensitiveContent(text: string): boolean {
  return SENSITIVE_KEYWORDS.some((kw) => text.includes(kw))
}

function isWithinTwoDays(publishedAt: string): boolean {
  const t = new Date(publishedAt).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t <= TWO_DAYS_MS
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const GEMINI_CALL_INTERVAL_MS = 6000
const MAX_RETRIES = 2

const REGIONS = ['中國香港', '台灣', '英國', '美國', '加拿大', '澳洲', '歐洲']
const TOPICS = ['地產', '時事', '財經', '娛樂', '旅遊', '數碼', '汽車', '宗教', '優惠', '校園', '天氣', '社區活動']

function buildDisclaimer(sourceName: string, sourceUrl: string, lang: 'zh' | 'en'): string {
  if (lang === 'zh') {
    return `\n\n---\n本文由機械人整理自動生成，並非逐字轉載原文。\n資料來源：${sourceName}（原文網址請點擊下方「查看原文」按鈕）\n如有任何版權問題，歡迎與我們聯絡處理。`
  }
  return `\n\n---\nThis article was automatically compiled and summarized by an AI bot, not copied verbatim from the source.\nSource: ${sourceName} (click "View Original" below for the source link)\nIf you have any copyright concerns, please contact us.`
}

type ProcessedContent = {
  rewrittenZh: string | null
  titleEn: string | null
  contentEn: string | null
  region: string
  topic: string
  wasRewritten: boolean
}

function parseRetryDelayMs(errorBody: string, fallbackMs: number): number {
  const match = errorBody.match(/retry in ([\d.]+)s/i)
  if (match) {
    const seconds = parseFloat(match[1])
    if (!Number.isNaN(seconds)) {
      return Math.ceil(seconds * 1000) + 500
    }
  }
  return fallbackMs
}

async function processNewsContent(title: string, content: string): Promise<ProcessedContent> {
  const apiKey = process.env.GEMINI_API_KEY
  const fallback: ProcessedContent = {
    rewrittenZh: null,
    titleEn: null,
    contentEn: null,
    region: '中國香港',
    topic: '時事',
    wasRewritten: false,
  }
  if (!apiKey) {
    console.error('[news-bot] GEMINI_API_KEY is missing')
    return fallback
  }

  const prompt = `你是一個嚴謹的新聞編輯助理，同時也要注意版權規範。請根據以下中文新聞的標題與內文，完成四件事，並「只」回傳一個 JSON 物件，不要加任何說明文字或 markdown 符號：

1. content_zh_rewritten：用你自己的話，改寫這則新聞的重點摘要（繁體中文，約 100-200 字）。
   規則：
   - 只保留最重要的事實重點（誰、什麼事、何時、影響），不要逐句照抄或近似照抄原文的句子結構與用字。
   - 不可以捏造原文沒有提到的細節或數字。
   - 語氣可以是新聞報導的客觀語氣，但必須是「你重新組織後的表達方式」。
2. title_en：把標題翻譯成自然的英文
3. content_en：把你改寫後的中文摘要（content_zh_rewritten）翻譯成自然的英文，不是翻譯原文
4. region：從這個清單裡選一個最符合的地區：${REGIONS.join('、')}
5. topic：從這個清單裡選一個最符合的主題：${TOPICS.join('、')}

規則：只根據新聞實際內容判斷，不要編造或誇大內容。如果無法確定地區，預設選「中國香港」；無法確定主題，預設選「時事」。

原標題：${title}
原內文：${content}

回傳格式範例：{"content_zh_rewritten":"...","title_en":"...","content_en":"...","region":"中國香港","topic":"時事"}`

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

      let raw: string
      try {
        const result = await model.generateContent(prompt)
        raw = result.response.text()
      } catch (sdkError: any) {
        const message: string = sdkError?.message ?? String(sdkError)
        const statusMatch = message.match(/\[(\d{3})\s/)
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 0

        if (status === 429) {
          console.error(
            `[news-bot] Gemini API error, status 429 (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
            message.slice(0, 500)
          )
          if (/limit:\s*0\b/.test(message)) {
            console.error('[news-bot] quota limit is 0 (billing likely required), skipping retries')
            return fallback
          }
          if (attempt < MAX_RETRIES) {
            const waitMs = parseRetryDelayMs(message, GEMINI_CALL_INTERVAL_MS * 2)
            console.warn(`[news-bot] rate limited, waiting ${waitMs}ms before retry`)
            await sleep(waitMs)
            continue
          }
          return fallback
        }

        console.error(`[news-bot] Gemini API error via SDK:`, message.slice(0, 500))
        return fallback
      }

      if (!raw) {
        console.error('[news-bot] Gemini returned empty content')
        return fallback
      }
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)

      return {
        rewrittenZh: parsed.content_zh_rewritten ?? null,
        titleEn: parsed.title_en ?? null,
        contentEn: parsed.content_en ?? null,
        region: REGIONS.includes(parsed.region) ? parsed.region : '中國香港',
        topic: TOPICS.includes(parsed.topic) ? parsed.topic : '時事',
        wasRewritten: !!parsed.content_zh_rewritten,
      }
    } catch (e) {
      console.error('[news-bot] process content failed:', (e as Error).message)
      return fallback
    }
  }

  return fallback
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
        let xml = await res.text()
        xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
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
  console.log('[news-bot] CODE_VERSION: sdk-v3-2026-07-18')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ success: false, message: '缺少 Supabase 環境變數' }, { status: 500 })
  }
  const supabase = createSupabaseAdminClient(supabaseUrl, serviceKey)

  const [rssNews, newsApiNews] = await Promise.all([fetchRssNews(), fetchNewsApiNews()])
  let allNews = [...rssNews, ...newsApiNews]

  allNews = allNews.filter((n) => n.title && isWithinTwoDays(n.publishedAt))

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
  let rewriteFailures = 0
  const titles: string[] = []

  let isFirstGeminiCall = true

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
        flaggedForReview++
        console.warn('[news-bot] flagged for manual review:', news.title)
        continue
      }

      if (!isFirstGeminiCall) {
        await sleep(GEMINI_CALL_INTERVAL_MS)
      }
      isFirstGeminiCall = false

      const { rewrittenZh, titleEn, contentEn, region, topic, wasRewritten } =
        await processNewsContent(news.title, news.content)

      if (!wasRewritten) {
        rewriteFailures++
        console.warn('[news-bot] rewrite failed, falling back to original content:', news.title)
      }

      const finalContentZh =
        (rewrittenZh ?? news.content) + buildDisclaimer(news.source_name, news.url, 'zh')

      const finalContentEn = contentEn
        ? contentEn + buildDisclaimer(news.source_name, news.url, 'en')
        : null

      await supabase.from('news_posts').insert({
        title_zh: news.title,
        title_en: titleEn,
        content_zh: finalContentZh,
        content_en: finalContentEn,
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
    rewriteFailures,
    titles,
  })
}
