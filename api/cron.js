
// api/cron.js - 真實自動化新聞發佈系統 (Hybrid V5)
// Features: NewsAPI 'Everything' + RSS Fallback + Deduplication + Error Handling

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- 設定檔 ---
const FETCH_LIMIT_PER_RUN = 6; // 每小時目標 6 則

// RSS 來源清單
const RSS_SOURCES = [
    { url: 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant', name: 'Google News TW' },
    { url: 'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml', name: 'BBC 中文' },
    { url: 'https://rthk.hk/rthk/news/rss/c/expressnews.xml', name: 'RTHK' },
    { url: 'https://www.hk01.com/rss/channel/2', name: 'HK01' }
];

// Keys (Fallback)
const KEYS = {
    SB_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co',
    SB_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_ePjPbrB6vdlbMuQmOr5-6A_bn3l297A',
    GEMINI: process.env.GEMINI_API_KEY || 'AIzaSyBqGGYUTLPw5Ut2p0CpWK6-MOL7-0GuuC8',
    NEWS_API: process.env.NEWS_API_KEY || '64da19cb45c646c6bf0f73925c5bd611'
};

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const startTime = Date.now();
    
    // 1. 初始化
    const supabase = createClient(KEYS.SB_URL, KEYS.SB_KEY, { auth: { persistSession: false } });
    const ai = new GoogleGenAI({ apiKey: KEYS.GEMINI });

    console.log(`[CRON] 🚀 Job Hybrid V5 Started.`);

    let stats = { found: 0, published: 0, duplicates: 0, errors: 0 };
    
    // 時間過濾: 只抓最近 1 小時 (3600000ms)
    // RSS 比較即時，NewsAPI 有時會有延遲，放寬到 2 小時以確保有內容
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
                // sortBy=publishedAt (最新), pageSize=50 (抓更多)
                const url = `https://newsapi.org/v2/everything?q=${q}&language=zh&sortBy=publishedAt&pageSize=50&apiKey=${KEYS.NEWS_API}`;
                
                console.log('[CRON] 📡 Fetching NewsAPI (Everything)...');
                const resp = await fetch(url);
                const data = await resp.json();
                
                if (data.articles) {
                    return data.articles.filter(a => new Date(a.publishedAt).getTime() > timeFilter);
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
                
                const items = [];
                // 簡單 Regex 解析 RSS
                const itemRegex = /<item>([\s\S]*?)<\/item>/g;
                let match;
                while ((match = itemRegex.exec(xml)) !== null) {
                    const inner = match[1];
                    const getTag = (tag) => {
                        const m = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 's').exec(inner);
                        return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : null;
                    };
                    
                    const title = getTag('title');
                    const link = getTag('link');
                    const desc = (getTag('description') || '').replace(/<[^>]+>/g, '').substring(0, 300);
                    const pubDateStr = getTag('pubDate') || getTag('dc:date');
                    
                    if (title && link) {
                        if (pubDateStr) {
                           const t = new Date(pubDateStr).getTime();
                           if (!isNaN(t) && t < timeFilter) continue; 
                        }
                        
                        items.push({
                            title,
                            description: desc || title,
                            url: link,
                            source: { name: source.name },
                            publishedAt: new Date().toISOString()
                        });
                    }
                }
                return items;
            } catch (e) {
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

        console.log(`[CRON] Total Fresh Articles Found: ${allArticles.length}`);
        stats.found = allArticles.length;

        // 隨機打亂
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
                    .single();

                if (existing) {
                    stats.duplicates++;
                    continue;
                }
            } catch (err) {}

            // --- AI 改寫 (Try-Catch 包覆) ---
            try {
                console.log(`[CRON] 🤖 Rewriting: ${news.title.substring(0, 20)}...`);

                const prompt = `
                Role: HK News Editor.
                Task: Rewrite news for a Web3 community.
                Source Title: ${news.title}
                Source Desc: ${news.description}
                
                Requirements:
                1. Traditional Chinese (HK Style).
                2. Summary: 100-150 words.
                3. Region: [中國香港, 台灣, 國際, 科技].
                4. Category: [時事, 財經, 科技, 娛樂, Crypto].
                
                Output JSON ONLY: { "titleTC": "...", "summaryTC": "...", "region": "...", "category": "..." }
                `;

                const result = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });

                let aiContent = {};
                try {
                    const text = result.text.replace(/```json|```/g, '').trim();
                    aiContent = JSON.parse(text);
                } catch (e) {
                    // Fallback
                    aiContent = {
                        titleTC: news.title,
                        summaryTC: news.description,
                        region: "國際",
                        category: "時事"
                    };
                }

                const post = {
                    id: Date.now() + Math.floor(Math.random() * 1000000),
                    title: aiContent.titleTC || news.title,
                    content: aiContent.summaryTC || news.description,
                    contentCN: aiContent.summaryTC || news.description,
                    region: aiContent.region || '國際',
                    category: aiContent.category || '時事',
                    url: news.url,
                    source_name: news.source.name,
                    author: 'HKER Bot 🤖',
                    author_id: 'bot_v5',
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

            } catch (e) {
                console.error(`[CRON] ❌ Gemini/Process Error:`, e.message);
                stats.errors++;
                continue; // 重要：即使失敗，繼續下一條
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        return res.status(200).json({ success: true, duration: `${duration}s`, stats });

    } catch (globalError) {
        console.error('[CRON] 💥 Fatal Error:', globalError);
        return res.status(500).json({ error: globalError.message });
    }
}
