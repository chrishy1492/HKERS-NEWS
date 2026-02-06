
// api/cron.js - 真實自動化新聞發佈系統 (Hybrid V6.0 - Fail Safe Edition)
// Features: 
// 1. Multi-Source (NewsAPI + RSS)
// 2. Dynamic Time Window (2h)
// 3. Robust Deduplication
// 4. CRITICAL: Raw Content Fallback (If AI fails, still publish)

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- 設定檔 ---
const FETCH_LIMIT_PER_RUN = 6; // 每小時目標 6 則

// RSS 來源清單 (已更新至穩定源)
const RSS_SOURCES = [
    { url: 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant', name: 'Google News TW' },
    { url: 'https://news.google.com/rss/search?q=香港&hl=zh-HK&gl=HK&ceid=HK:zh-Hant', name: 'Google News HK' },
    { url: 'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml', name: 'BBC 中文' },
    { url: 'https://news.rthk.hk/rthk/ch/news/rss/c/expressnews.xml', name: 'RTHK' }
];

// Keys (Fallback)
const KEYS = {
    SB_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co',
    SB_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_ePjPbrB6vdlbMuQmOr5-6A_bn3l297A',
    GEMINI: process.env.GEMINI_API_KEY || 'AIzaSyBqGGYUTLPw5Ut2p0CpWK6-MOL7-0GuuC8',
    NEWS_API: process.env.NEWS_API_KEY || '64da19cb45c646c6bf0f73925c5bd611'
};

// RSS Helper (Zero dependency regex parser)
function parseRSS(xml, sourceName) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemStr = match[1];
    const titleMatch = itemStr.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemStr.match(/<title>(.*?)<\/title>/);
    const linkMatch = itemStr.match(/<link>(.*?)<\/link>/);
    // Try multiple description patterns
    const descMatch = itemStr.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || 
                      itemStr.match(/<description>(.*?)<\/description>/) ||
                      itemStr.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/);
    
    const dateMatch = itemStr.match(/<pubDate>(.*?)<\/pubDate>/) || itemStr.match(/<dc:date>(.*?)<\/dc:date>/);

    if (titleMatch && linkMatch) {
      // Clean up description (remove HTML tags)
      let cleanDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      if (cleanDesc.length > 500) cleanDesc = cleanDesc.substring(0, 500) + "...";

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
    
    // 1. 初始化
    const supabase = createClient(KEYS.SB_URL, KEYS.SB_KEY, { auth: { persistSession: false } });
    const ai = new GoogleGenAI({ apiKey: KEYS.GEMINI });

    console.log(`[CRON] 🚀 Job Hybrid V6.0 Started.`);

    let stats = { found: 0, published: 0, duplicates: 0, errors: 0, aiFailures: 0 };
    
    // 時間過濾: 放寬至 2 小時以確保有內容
    const timeFilter = Date.now() - (2 * 60 * 60 * 1000); 

    try {
        // --- 2. 抓取資料 (Fetch Data) ---
        let allArticles = [];

        // A. NewsAPI (Everything Endpoint)
        const fetchNewsAPI = async () => {
            if (!KEYS.NEWS_API) return [];
            try {
                // 擴大關鍵字
                const q = encodeURIComponent('香港 OR 國際 OR 科技 OR 經濟');
                const fromDate = new Date(timeFilter).toISOString();
                
                // Use 'publishedAt' sorting to get latest
                const url = `https://newsapi.org/v2/everything?q=${q}&language=zh&sortBy=publishedAt&pageSize=50&from=${fromDate}&apiKey=${KEYS.NEWS_API}`;
                
                console.log('[CRON] 📡 Fetching NewsAPI...');
                const resp = await fetch(url);
                const data = await resp.json();
                
                if (data.articles) {
                    return data.articles;
                }
                return [];
            } catch (e) {
                console.error('[CRON] NewsAPI Error:', e.message);
                return [];
            }
        };

        // B. RSS Sources
        const fetchRSS = async (source) => {
            try {
                console.log(`[CRON] 📡 Fetching RSS: ${source.name}`);
                const resp = await fetch(source.url);
                const xml = await resp.text();
                const items = parseRSS(xml, source.name);
                
                // Client-side time filter for RSS
                return items.filter(i => new Date(i.publishedAt).getTime() > timeFilter);
            } catch (e) {
                console.error(`[CRON] RSS Error (${source.name}):`, e.message);
                return [];
            }
        };

        // 並行執行所有請求
        const [newsApiItems, ...rssResults] = await Promise.all([
            fetchNewsAPI(),
            ...RSS_SOURCES.map(s => fetchRSS(s))
        ]);

        // 合併結果
        allArticles = [...newsApiItems];
        rssResults.forEach(list => allArticles = [...allArticles, ...list]);

        console.log(`[CRON] Total Fresh Articles Found (Past 2h): ${allArticles.length}`);
        stats.found = allArticles.length;

        // 隨機打亂以增加多樣性
        allArticles.sort(() => Math.random() - 0.5);

        // --- 3. 處理與發佈 (Process & Publish) ---
        for (const news of allArticles) {
            // 達到數量限制即停止
            if (stats.published >= FETCH_LIMIT_PER_RUN) break;

            if (!news.title || news.title.length < 5) continue;

            // --- 強力去重 (Title-based) ---
            try {
                const { data: existing } = await supabase
                    .from('posts')
                    .select('id')
                    .eq('title', news.title)
                    .maybeSingle();

                if (existing) {
                    stats.duplicates++;
                    continue;
                }
            } catch (err) {}

            // --- AI 改寫 (帶故障轉移 Fallback) ---
            let finalContent = {};
            
            try {
                // console.log(`[CRON] 🤖 Rewriting: ${news.title.substring(0, 15)}...`);

                const prompt = `
                Role: HK News Editor.
                Task: Summarize this news for a Web3 community.
                Source Title: ${news.title}
                Source Desc: ${news.description}
                
                Requirements:
                1. Traditional Chinese (HK Style).
                2. Summary: 80-120 words.
                3. Region: [中國香港, 台灣, 國際, 科技, 財經].
                4. Category: [時事, 財經, 科技, 娛樂, Crypto].
                
                Output JSON ONLY: { "titleTC": "...", "summaryTC": "...", "region": "...", "category": "..." }
                `;

                const result = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });

                const text = result.text.replace(/```json|```/g, '').trim();
                finalContent = JSON.parse(text);

            } catch (e) {
                console.warn(`[CRON] ⚠️ AI Failed (${e.message}). Using Fallback.`);
                stats.aiFailures++;
                
                // Fallback: Use original content if AI fails (Ensure we publish SOMETHING)
                finalContent = {
                    titleTC: news.title,
                    summaryTC: news.description || news.title,
                    region: "國際",
                    category: "時事"
                };
            }

            // --- DB Insert ---
            try {
                const post = {
                    id: Date.now() + Math.floor(Math.random() * 1000000),
                    title: finalContent.titleTC || news.title,
                    content: finalContent.summaryTC || news.description,
                    contentCN: finalContent.summaryTC || news.description, // Legacy field support
                    region: finalContent.region || '國際',
                    category: finalContent.category || '時事',
                    url: news.url,
                    source_name: news.source.name,
                    author: 'HKER Bot 🤖',
                    author_id: 'bot_v6',
                    created_at: new Date().toISOString()
                };

                const { error: insertError } = await supabase.from('posts').insert(post);
                
                if (insertError) {
                    if (insertError.code === '23505') { 
                        stats.duplicates++;
                    } else {
                        console.error('[CRON] DB Insert Error:', insertError.message);
                        stats.errors++;
                    }
                } else {
                    console.log(`[CRON] ✅ Published: ${post.title}`);
                    stats.published++;
                }
            } catch (dbErr) {
                stats.errors++;
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        return res.status(200).json({ success: true, duration: `${duration}s`, stats });

    } catch (globalError) {
        console.error('[CRON] 💥 Fatal Error:', globalError);
        return res.status(500).json({ error: globalError.message });
    }
}
