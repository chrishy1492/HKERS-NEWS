
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

/**
 * 專業新聞機器人 (Hybrid V7.1 - Quick Fix / Fail-Safe Edition)
 * 
 * 修改重點：
 * 1. 降低發佈量：限制每次 2 則，避免 Gemini 429 Rate Limit。
 * 2. 強制故障轉移：AI 失敗時，保證使用 Raw Content 發佈 (解決 Published=0)。
 * 3. 錯誤追蹤：增加詳細 Error Logs。
 */

// 1. 初始化 (使用最高權限 Key 繞過 RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // CRITICAL: Service Role required for cron jobs
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// 設定檔
const FETCH_LIMIT_PER_RUN = 2; // [FIX] 降至 2 則以避免 Rate Limit
const SEARCH_WINDOW_HOURS = 4; // 廣泛搜索 4 小時

// RSS 來源清單
const RSS_SOURCES = [
    { url: 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant', name: 'Google News TW' },
    { url: 'https://news.google.com/rss/search?q=香港&hl=zh-HK&gl=HK&ceid=HK:zh-Hant', name: 'Google News HK' },
    { url: 'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml', name: 'BBC 中文' },
    { url: 'https://news.rthk.hk/rthk/ch/news/rss/c/expressnews.xml', name: 'RTHK' }
];

// RSS 解析器
function parseRSS(xml, sourceName) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemStr = match[1];
    const titleMatch = itemStr.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemStr.match(/<title>(.*?)<\/title>/);
    const linkMatch = itemStr.match(/<link>(.*?)<\/link>/);
    const descMatch = itemStr.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || 
                      itemStr.match(/<description>(.*?)<\/description>/);
    const dateMatch = itemStr.match(/<pubDate>(.*?)<\/pubDate>/) || itemStr.match(/<dc:date>(.*?)<\/dc:date>/);

    if (titleMatch && linkMatch) {
      let cleanDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      if (cleanDesc.length > 300) cleanDesc = cleanDesc.substring(0, 300) + "...";
      
      items.push({
        title: titleMatch[1].trim(),
        url: linkMatch[1].trim(),
        description: cleanDesc || titleMatch[1].trim(),
        publishedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        source: { name: sourceName }
      });
    }
  }
  return items;
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const startTime = Date.now();

    let stats = {
        found: 0,
        duplicates: 0,
        published: 0,
        aiFailures: 0,
        dbErrors: 0,
        errorLogs: [] // [FIX] 詳細錯誤記錄
    };

    try {
        console.log("=== Bot V7.1 Quick Fix Started ===");

        // 2. 廣泛搜索資料
        const timeLimit = new Date(Date.now() - SEARCH_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
        let allArticles = [];

        // Fetch NewsAPI
        const fetchNewsAPI = async () => {
            if (!process.env.NEWS_API_KEY) return [];
            try {
                const q = encodeURIComponent('香港 OR 國際 OR 科技 OR 經濟');
                const url = `https://newsapi.org/v2/everything?q=${q}&language=zh&sortBy=publishedAt&pageSize=30&from=${timeLimit}&apiKey=${process.env.NEWS_API_KEY}`;
                const resp = await fetch(url);
                const data = await resp.json();
                return data.articles || [];
            } catch (e) {
                stats.errorLogs.push(`NewsAPI: ${e.message}`);
                return [];
            }
        };

        // Fetch RSS
        const fetchRSS = async (source) => {
            try {
                const resp = await fetch(source.url);
                const xml = await resp.text();
                const items = parseRSS(xml, source.name);
                return items.filter(i => new Date(i.publishedAt) > new Date(timeLimit));
            } catch (e) {
                console.error(`RSS Error (${source.name}):`, e.message);
                return [];
            }
        };

        const [newsApiItems, ...rssResults] = await Promise.all([
            fetchNewsAPI(),
            ...RSS_SOURCES.map(s => fetchRSS(s))
        ]);

        allArticles = [...newsApiItems];
        rssResults.forEach(list => allArticles = [...allArticles, ...list]);
        allArticles.sort(() => Math.random() - 0.5); // Shuffle

        stats.found = allArticles.length;
        console.log(`Candidates Found: ${stats.found}`);

        // 3. 處理與發佈
        const titlesPublished = [];

        for (const article of allArticles) {
            // [FIX] 嚴格限制數量
            if (stats.published >= FETCH_LIMIT_PER_RUN) break;
            
            if (!article.title || article.title.length < 5) continue;

            // 去重
            const { data: existing } = await supabase
                .from('posts')
                .select('id')
                .or(`url.eq.${article.url},title.eq.${article.title}`)
                .maybeSingle();

            if (existing) {
                stats.duplicates++;
                continue;
            }

            let finalData = {};

            // --- AI 處理區塊 (帶強力故障轉移) ---
            try {
                // 暫時添加 1秒 延遲以緩解 Rate Limit
                await new Promise(r => setTimeout(r, 1000));

                const prompt = `
                Role: Editor. Summarize for HK Web3 users.
                Title: ${article.title}
                Content: ${article.description || article.title}
                Output JSON: { "titleTC": "...", "summaryTC": "...", "region": "...", "category": "..." }
                `;

                const aiResult = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });

                const text = aiResult.text.replace(/```json|```/g, '').trim();
                finalData = JSON.parse(text);

            } catch (aiErr) {
                // [FIX] 捕捉並記錄具體錯誤
                const errorMsg = aiErr.message || "Unknown AI Error";
                console.warn(`[Fallback] AI Failed: ${errorMsg}`);
                
                stats.aiFailures++;
                stats.errorLogs.push(`AI Error (${article.title.substring(0,10)}...): ${errorMsg}`);
                
                // Fallback Logic
                finalData = {
                    titleTC: article.title,
                    summaryTC: article.description || article.title,
                    region: "國際",
                    category: "時事"
                };
            }

            // --- 寫入 DB ---
            try {
                const postPayload = {
                    id: Date.now() + Math.floor(Math.random() * 1000000),
                    title: finalData.titleTC || article.title,
                    content: finalData.summaryTC || article.description,
                    contentCN: finalData.summaryTC || article.description,
                    region: finalData.region || '國際',
                    category: finalData.category || '時事',
                    url: article.url,
                    source_name: article.source.name || 'News Source',
                    author: stats.aiFailures > 0 ? 'News Bot (Raw)' : 'AI Editor 🤖',
                    author_id: 'bot_v7_failsafe',
                    created_at: new Date().toISOString()
                };

                const { error: insertErr } = await supabase.from('posts').insert(postPayload);

                if (insertErr) {
                    if (insertErr.code !== '23505') {
                        stats.dbErrors++;
                        stats.errorLogs.push(`DB Error: ${insertErr.message}`);
                    } else {
                        stats.duplicates++;
                    }
                } else {
                    console.log(`Published: ${postPayload.title}`);
                    stats.published++;
                    titlesPublished.push(postPayload.title);
                }

            } catch (processErr) {
                stats.dbErrors++;
                stats.errorLogs.push(`Process Error: ${processErr.message}`);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        return res.status(200).json({
            success: true,
            message: `Bot Run Complete`,
            duration: `${duration}s`,
            stats,
            titles: titlesPublished
        });

    } catch (globalErr) {
        console.error("Critical Failure:", globalErr);
        return res.status(500).json({ error: globalErr.message, details: stats.errorLogs });
    }
}
