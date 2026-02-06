
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

/**
 * 專業新聞機器人 (Hybrid V7.0 - Fail-Safe Edition)
 * 修復重點：
 * 1. 權限升級：使用 SERVICE_ROLE_KEY 繞過 RLS。
 * 2. 故障轉移：AI 失敗時自動降級為原始內容 (解決 Errors=3, Published=0)。
 * 3. 廣泛搜索：時間窗口擴大至 4 小時 + RSS 補充。
 */

// 1. 初始化 (使用最高權限 Key)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // CRITICAL: Must use Service Role for backend scripts
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// RSS 來源清單 (穩定源)
const RSS_SOURCES = [
    { url: 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant', name: 'Google News TW' },
    { url: 'https://news.google.com/rss/search?q=香港&hl=zh-HK&gl=HK&ceid=HK:zh-Hant', name: 'Google News HK' },
    { url: 'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml', name: 'BBC 中文' },
    { url: 'https://news.rthk.hk/rthk/ch/news/rss/c/expressnews.xml', name: 'RTHK' }
];

// RSS 解析器 (Regex-based, Zero dependency)
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

    // 統計數據
    let stats = {
        stage: "初始化",
        found: 0,
        duplicates: 0,
        published: 0,
        aiFailures: 0,
        dbErrors: 0
    };

    try {
        console.log("=== Bot V7.0 Started ===");

        // 2. 設定搜索條件 (廣泛模式: 4小時)
        const timeLimit = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        let allArticles = [];

        // --- A. Fetch NewsAPI ---
        const fetchNewsAPI = async () => {
            if (!process.env.NEWS_API_KEY) return [];
            try {
                // 廣泛關鍵字
                const q = encodeURIComponent('香港 OR 國際 OR 科技 OR 經濟');
                const url = `https://newsapi.org/v2/everything?q=${q}&language=zh&sortBy=publishedAt&pageSize=30&from=${timeLimit}&apiKey=${process.env.NEWS_API_KEY}`;
                
                const resp = await fetch(url);
                const data = await resp.json();
                return data.articles || [];
            } catch (e) {
                console.error('NewsAPI Error:', e.message);
                return [];
            }
        };

        // --- B. Fetch RSS ---
        const fetchRSS = async (source) => {
            try {
                const resp = await fetch(source.url);
                const xml = await resp.text();
                const items = parseRSS(xml, source.name);
                // 過濾時間
                return items.filter(i => new Date(i.publishedAt) > new Date(timeLimit));
            } catch (e) {
                console.error(`RSS Error (${source.name}):`, e.message);
                return [];
            }
        };

        // 並行執行所有抓取
        const [newsApiItems, ...rssResults] = await Promise.all([
            fetchNewsAPI(),
            ...RSS_SOURCES.map(s => fetchRSS(s))
        ]);

        // 合併結果
        allArticles = [...newsApiItems];
        rssResults.forEach(list => allArticles = [...allArticles, ...list]);
        
        // 隨機打亂 (避免每次都只發同一來源)
        allArticles.sort(() => Math.random() - 0.5);

        stats.found = allArticles.length;
        stats.stage = `廣泛模式 (Found ${stats.found})`;
        
        console.log(`Candidates Found: ${stats.found}`);

        // 3. 處理循環
        const TARGET_PUBLISH_COUNT = 6;
        const titlesPublished = [];

        for (const article of allArticles) {
            if (stats.published >= TARGET_PUBLISH_COUNT) break;
            
            // 基礎過濾
            if (!article.title || article.title.length < 5) continue;

            // --- 去重檢查 (Check both URL and Title) ---
            const { data: existing } = await supabase
                .from('posts')
                .select('id')
                .or(`url.eq.${article.url},title.eq.${article.title}`)
                .maybeSingle();

            if (existing) {
                stats.duplicates++;
                continue;
            }

            // --- 核心邏輯: AI 生成 + 故障轉移 ---
            let finalData = {};

            try {
                // 嘗試使用 Gemini
                const prompt = `
                Role: Senior Editor.
                Task: Summarize news for HK Web3 audience.
                Title: ${article.title}
                Content: ${article.description || article.title}
                
                Output JSON: { "titleTC": "繁體標題", "summaryTC": "100字摘要", "region": "地區", "category": "分類" }
                `;

                const aiResult = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });

                const text = aiResult.text.replace(/```json|```/g, '').trim();
                finalData = JSON.parse(text);

            } catch (aiErr) {
                // !!! CRITICAL FALLBACK !!!
                // 如果 API Key 洩漏或報錯，執行此區塊，保證 published > 0
                console.warn(`[Fallback Triggered] AI Error: ${aiErr.message}`);
                stats.aiFailures++;
                
                finalData = {
                    titleTC: article.title,
                    summaryTC: article.description || article.title, // 使用原文
                    region: "國際", // 默認
                    category: "時事" // 默認
                };
            }

            // --- 寫入數據庫 ---
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
                    author: stats.aiFailures > 0 ? 'News Bot (Raw)' : 'AI Editor 🤖', // 標記來源
                    author_id: 'bot_v7_failsafe',
                    created_at: new Date().toISOString()
                };

                const { error: insertErr } = await supabase.from('posts').insert(postPayload);

                if (insertErr) {
                    // 忽略重複錯誤
                    if (insertErr.code !== '23505') {
                        console.error('DB Insert Error:', insertErr.message);
                        stats.dbErrors++;
                    } else {
                        stats.duplicates++;
                    }
                } else {
                    console.log(`Published: ${postPayload.title}`);
                    stats.published++;
                    titlesPublished.push(postPayload.title);
                    
                    // Optional: await postToX(postPayload); // 如果有 X 客戶端代碼
                }

            } catch (processErr) {
                console.error('Processing Fatal Error:', processErr);
                stats.dbErrors++;
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        return res.status(200).json({
            success: true,
            message: `Bot Run Complete in ${duration}s`,
            stats,
            titles: titlesPublished
        });

    } catch (globalErr) {
        console.error("Critical Bot Failure:", globalErr);
        return res.status(500).json({ error: globalErr.message });
    }
}
