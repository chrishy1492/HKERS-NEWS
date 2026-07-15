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

const REGIONS = ['中國香港', '台灣', '英國', '美國', '加拿大', '澳洲', '歐洲']
const TOPICS = ['地產', '時事', '財經', '娛樂', '旅遊', '數碼', '汽車', '宗教', '優惠', '校園', '天氣', '社區活動']

// ============================================================
// 【修改】機械人聲明 + 版權聯絡文字
// 不再把完整原文網址寫進內文（避免撐爆卡片版面、跟畫面下方
// 「查看原文→」按鈕功能重複），改為引導使用者點擊該按鈕。
// sourceUrl 參數保留，避免呼叫端程式碼要跟著改動。
// ============================================================
function buildDisclaimer(sourceName: string, sourceUrl: string, lang: 'zh' | 'en'): string {
  if (lang === 'zh') {
    return `\n\n---\n本文由機械人整理自動生成，並非逐字轉載原文。\n資料來源：${sourceName}（原文網址請點擊下方「查看原文」按鈕）\n如有任何版權問題，歡迎與我們聯絡處理。`
  }
  return `\n\n---\nThis article was automatically compiled and summarized by an AI bot, not copied verbatim from the source.\nSource: ${sourceName} (click "View Original" below for the source link)\nIf you have any copyright concerns, please contact us.`
}

// ============================================================
// 改寫成重點摘要，避免逐字複製原文造成版權問題。
// 回傳值多了 rewrittenZh（改寫後的中文重點摘要）。
// ============================================================
type ProcessedContent = {
  rewrittenZh: string | null
  titleEn: string | null
  contentEn: string | null
  region: string
  topic: string
  wasRewritten: boolean
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

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    if (!res.ok) {
      // 【新增】把失敗的狀態碼跟回應內容印出來，才能知道真正原因
      const errorBody = await res.text()
      console.error(`[news-bot] Gemini API error, status ${res.status}:`, errorBody.slice(0, 500))
      return fallback
    }
    const data = await res.json()
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!raw) {
      // 【新增】如果 Gemini 回應成功但內容是空的，也要記錄下來
      console.error('[news-bot] Gemini returned empty content:', JSON.stringify(data).slice(0, 500))
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
