
// api/bot.js - 真實自動化新聞發佈系統 (Hybrid V7.2 - Strict Classification Edition)
// Features: 
// 1. Strict Region/Topic Enforcement (No "International")
// 2. Keyword-based Fallback Classification
// 3. Multi-Source Fetching
// 4. Robust Fail-Safe

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- 1. 嚴格分類設定 (Strict Categories) ---
const ALLOWED_REGIONS = ["中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"];
const ALLOWED_TOPICS = ["地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "宗教", "優惠", "校園", "天氣", "社區活動"];

const FETCH_LIMIT_PER_RUN = 2; // 避免 Rate Limit，每次 2 則

// RSS 來源清單
const RSS_SOURCES = [
    { url: 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant', name: 'Google News TW' },
    { url: 'https://news.google.com/rss/search?q=香港&hl=zh-HK&gl=HK&ceid=HK:zh-Hant', name: 'Google News HK' },
    { url: 'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml', name: 'BBC 中文' },
    { url: 'https://news.rthk.hk/rthk/ch/news/rss/c/expressnews.xml', name: 'RTHK' }
];

// Keys
const KEYS = {
    SB_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SB_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI: process.env.GEMINI_API_KEY || process.env.API_KEY,
    NEWS_API: process.env.NEWS_API_KEY
};

// --- 2. 輔助函數 (Helpers) ---

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
                      itemStr.match(/<description>(.*?)<\/description>/) ||
                      itemStr.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/);
    const dateMatch = itemStr.match(/<pubDate>(.*?)<\/pubDate>/) || itemStr.match(/<dc:date>(.*?)<\/dc:date>/);

    if (titleMatch && linkMatch) {
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

// 智能關鍵字分類器 (當 AI 失敗時使用)
function classifyContentByKeywords(text) {
    const t = text.toLowerCase();
    
    let region = "中國香港"; // 默認
    let category = "時事";     // 默認

    // Region Rules
    if (t.includes("台灣") || t.includes("台北") || t.includes("台積電")) region = "台灣";
    else if (t.includes("英國") || t.includes("倫敦") || t.includes("bno")) region = "英國";
    else if (t.includes("美國") || t.includes("紐約") || t.includes("美股") || t.includes("拜登") || t.includes("特朗普")) region = "美國";
    else if (t.includes("加拿大") || t.includes("溫哥華") || t.includes("多倫多")) region = "加拿大";
    else if (t.includes("澳洲") || t.includes("悉尼") || t.includes("墨爾本")) region = "澳洲";
    else if (t.includes("歐洲") || t.includes("歐盟") || t.includes("德國") || t.includes("法國")) region = "歐洲";
    
    // Topic Rules
    if (t.includes("樓") || t.includes("地產") || t.includes("房價") || t.includes("租金")) category = "地產";
    else if (t.includes("股") || t.includes("金融") || t.includes("經濟") || t.includes("匯率") || t.includes("加息")) category = "財經";
    else if (t.includes("蘋果") || t.includes("iphone") || t.includes("ai") || t.includes("科技") || t.includes("數碼")) category = "數碼";
    else if (t.includes("劇") || t.includes("星") || t.includes("演唱會") || t.includes("電影")) category = "娛樂";
    else if (t.includes("遊") || t.includes("機票") || t.includes("航空") || t.includes("酒店")) category = "旅遊";
    else if (t.includes("車") || t.includes("駕駛") || t.includes("tesla")) category = "汽車";
    else if (t.includes("教") || t.includes("佛") || t.includes("耶穌") || t.includes("禪")) category = "宗教";
    else if (t.includes("優惠") || t.includes("折") || t.includes("免費") || t.includes("開倉")) category = "優惠";
    else if (t.includes("校") || t.includes("大專") || t.includes("考試") || t.includes("dse")) category = "校園";
    else if (t.includes("雨") || t.includes("風球") || t.includes("氣溫") || t.includes("天氣")) category = "天氣";
    else if (t.includes("活動") || t.includes("市集") || t.includes("展覽")) category = "社區活動";

    return { region, category };
}

// --- 3. Main Handler ---

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const startTime = Date.now();
    
    // 初始化
    const supabase = createClient(KEYS.SB_URL, KEYS.SB_KEY, { auth: { persistSession: false } });
    const ai = new GoogleGenAI({ apiKey: KEYS.GEMINI });

    console.log(`[CRON] 🚀 Job V7.2 Strict Mode Started.`);

    let stats = { found: 0, published: 0, duplicates: 0, errors: 0, aiFailures: 0, errorDetails: [] };
    
    // 擴大時間窗口至 4 小時
    const timeFilter = Date.now() - (4 * 60 * 60 * 1000); 

    try {
        let allArticles = [];

        // Fetch NewsAPI
        const fetchNewsAPI = async () => {
            if (!KEYS.NEWS_API) return [];
            try {
                // 搜索關鍵字包含目標地區，增加命中率
                const q = encodeURIComponent('香港 OR 台灣 OR 英國 OR 美國 OR 加拿大 OR 澳洲 OR 科技 OR 財經');
                const fromDate = new Date(timeFilter).toISOString();
                const url = `https://newsapi.org/v2/everything?q=${q}&language=zh&sortBy=publishedAt&pageSize=30&from=${fromDate}&apiKey=${KEYS.NEWS_API}`;
                
                const resp = await fetch(url);
                const data = await resp.json();
                return data.articles || [];
            } catch (e) {
                stats.errorDetails.push(`NewsAPI: ${e.message}`);
                return [];
            }
        };

        // Fetch RSS
        const fetchRSS = async (source) => {
            try {
                const resp = await fetch(source.url);
                const xml = await resp.text();
                const items = parseRSS(xml, source.name);
                return items.filter(i => new Date(i.publishedAt).getTime() > timeFilter);
            } catch (e) {
                return [];
            }
        };

        const [newsApiItems, ...rssResults] = await Promise.all([
            fetchNewsAPI(),
            ...RSS_SOURCES.map(s => fetchRSS(s))
        ]);

        allArticles = [...newsApiItems];
        rssResults.forEach(list => allArticles = [...allArticles, ...list]);
        stats.found = allArticles.length;
        
        // Shuffle
        allArticles.sort(() => Math.random() - 0.5);

        // Process
        for (const news of allArticles) {
            if (stats.published >= FETCH_LIMIT_PER_RUN) break;
            if (!news.title || news.title.length < 5) continue;

            // Deduplication
            try {
                const { data: existing } = await supabase
                    .from('posts')
                    .select('id')
                    .or(`url.eq.${news.url},title.eq.${news.title}`)
                    .maybeSingle();
                if (existing) {
                    stats.duplicates++;
                    continue;
                }
            } catch (err) {}

            // Classification Logic
            let finalContent = {};
            
            try {
                // Rate Limit Delay
                await new Promise(r => setTimeout(r, 1000));

                const prompt = `
                Role: HK News Editor.
                Task: Summarize this news for a Web3 community.
                Source Title: ${news.title}
                Source Desc: ${news.description}
                
                Requirements:
                1. Traditional Chinese (HK Style).
                2. Summary: 80-120 words.
                3. Region: STRICTLY SELECT ONE FROM: [${ALLOWED_REGIONS.join(', ')}]. If uncertain, default to "中國香港".
                4. Category: STRICTLY SELECT ONE FROM: [${ALLOWED_TOPICS.join(', ')}].
                
                Output JSON ONLY: { "titleTC": "...", "summaryTC": "...", "region": "...", "category": "..." }
                `;

                const result = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });

                const text = result.text.replace(/```json|```/g, '').trim();
                finalContent = JSON.parse(text);

                // Double Check: Ensure returned region/category is valid
                if (!ALLOWED_REGIONS.includes(finalContent.region)) finalContent.region = "中國香港";
                if (!ALLOWED_TOPICS.includes(finalContent.category)) finalContent.category = "時事";

            } catch (e) {
                // AI Failed - Use Fallback Classifier
                stats.aiFailures++;
                stats.errorDetails.push(`AI Error: ${e.message}`);
                
                const fallbackClass = classifyContentByKeywords(news.title + " " + news.description);
                
                finalContent = {
                    titleTC: news.title,
                    summaryTC: news.description || news.title,
                    region: fallbackClass.region,
                    category: fallbackClass.category
                };
            }

            // DB Insert
            try {
                const post = {
                    id: Date.now() + Math.floor(Math.random() * 1000000),
                    title: finalContent.titleTC || news.title,
                    content: finalContent.summaryTC || news.description,
                    contentCN: finalContent.summaryTC || news.description,
                    region: finalContent.region, // Now strictly from allowed list
                    category: finalContent.category, // Now strictly from allowed list
                    url: news.url,
                    source_name: news.source.name || "News Feed",
                    author: stats.aiFailures > 0 ? 'HKER Bot (Raw)' : 'HKER AI 🤖',
                    author_id: 'bot_v7.2',
                    created_at: new Date().toISOString()
                };

                const { error: insertError } = await supabase.from('posts').insert(post);
                
                if (insertError) {
                    if (insertError.code === '23505') stats.duplicates++;
                    else stats.errors++;
                } else {
                    console.log(`[CRON] ✅ Published: ${post.title} [${post.region}/${post.category}]`);
                    stats.published++;
                }
            } catch (dbErr) {
                stats.errors++;
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        return res.status(200).json({ success: true, duration: `${duration}s`, stats });

    } catch (globalError) {
        return res.status(500).json({ error: globalError.message, details: stats.errorDetails });
    }
}
