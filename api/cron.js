
// api/cron.js - 真實自動化新聞發佈系統 (Vercel Serverless Function)
// v5.0 Ultimate Hybrid Edition
// Features: NewsAPI Everything + RSS Fallbacks + Time Filtering + Robust Deduplication

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- 設定檔 ---
const FETCH_LIMIT_PER_RUN = 6; // 每小時目標 6 則

// RSS 來源清單 (無需 Key，穩定備援)
const RSS_SOURCES = [
    { url: 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant', name: 'Google News TW' },
    { url: 'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml', name: 'BBC 中文' },
    { url: 'https://rthk.hk/rthk/news/rss/c/expressnews.xml', name: 'RTHK' },
    { url: 'https://www.hk01.com/rss/channel/2', name: 'HK01' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NYT Tech' }
];

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const startTime = Date.now();
    
    // --- 1. 環境變數 ---
    const envVars = {
        SB_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SB_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        GEMINI: process.env.GEMINI_API_KEY || process.env.API_KEY,
        NEWS_API: process.env.NEWS_API_KEY
    };

    if (!envVars.SB_URL || !envVars.SB_KEY || !envVars.GEMINI) {
        return res.status(500).json({ error: 'Missing Essential Config' });
    }

    const supabase = createClient(envVars.SB_URL, envVars.SB_KEY, { auth: { persistSession: false } });
    const ai = new GoogleGenAI({ apiKey: envVars.GEMINI });

    console.log(`[CRON] 🚀 Job v5.0 Started. Target: ${FETCH_LIMIT_PER_RUN} posts.`);

    let stats = { found: 0, published: 0, duplicates: 0, errors: 0 };
    
    // 計算 1 小時前的時間戳 (用於過濾)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    try {
        // --- 2. 抓取資料 (Fetch Data) ---
        let allArticles = [];

        // A. NewsAPI (Everything Endpoint - 抓取量大)
        const fetchNewsAPI = async () => {
            if (!envVars.NEWS_API) return [];
            try {
                // 擴大關鍵字，只抓取最近的
                const q = encodeURIComponent('香港 OR 國際 OR 科技 OR 經濟 OR AI OR Crypto');
                const url = `https://newsapi.org/v2/everything?q=${q}&language=zh&sortBy=publishedAt&pageSize=50&apiKey=${envVars.NEWS_API}`;
                
                console.log('[CRON] 📡 Fetching NewsAPI (Everything)...');
                const resp = await fetch(url);
                const data = await resp.json();
                
                if (data.articles) {
                    // 預先過濾時間
                    return data.articles.filter(a => new Date(a.publishedAt).getTime() > oneHourAgo);
                }
                return [];
            } catch (e) {
                console.error('[CRON] NewsAPI Error:', e.message);
                return [];
            }
        };

        // B. RSS Sources (穩定備援)
        const fetchRSS = async (source) => {
            try {
                console.log(`[CRON] 📡 Fetching RSS: ${source.name}`);
                const resp = await fetch(source.url);
                const xml = await resp.text();
                
                const items = [];
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
                    const desc = (getTag('description') || '').replace(/<[^>]+>/g, '').substring(0, 200);
                    const pubDateStr = getTag('pubDate') || getTag('dc:date');
                    
                    if (title && link) {
                        // Check time (if pubDate exists)
                        if (pubDateStr) {
                            const pubTime = new Date(pubDateStr).getTime();
                            if (!isNaN(pubTime) && pubTime < oneHourAgo) continue; // Skip old news
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
                // RSS 失敗不影響整體
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

        // 隨機打亂 (避免每次都先發某個來源)
        allArticles.sort(() => Math.random() - 0.5);

        console.log(`[CRON] Total Fresh Articles Found: ${allArticles.length}`);
        stats.found = allArticles.length;

        // --- 3. 處理與發佈 (Process & Publish) ---
        for (const news of allArticles) {
            if (stats.published >= FETCH_LIMIT_PER_RUN) break;

            // 基礎過濾
            if (!news.title || news.title.length < 5) continue;

            // --- 強力去重 (Title-based) ---
            // URL 經常變動 (帶參數)，用標題去重最準
            try {
                const { data: existing } = await supabase
                    .from('posts')
                    .select('id')
                    .eq('title', news.title) // 檢查標題
                    .single(); // 使用 single() 提高效率

                if (existing) {
                    stats.duplicates++;
                    continue;
                }
            } catch (err) {
                // Supabase returns error if .single() finds 0 rows, ignore it
            }

            // --- AI 處理 (錯誤隔離) ---
            try {
                console.log(`[CRON] 🤖 Rewriting: ${news.title.substring(0, 20)}...`);

                const prompt = `
                Role: HK News Editor.
                Task: Rewrite news for a Web3 community.
                Source: ${news.title}
                Desc: ${news.description}
                
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
                    // Fallback if JSON fails
                    aiContent = {
                        titleTC: news.title,
                        summaryTC: news.description,
                        region: "國際",
                        category: "時事"
                    };
                }

                // 寫入資料庫
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
                    if (insertError.code === '23505') { // Unique violation
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
                console.error(`[CRON] ❌ Item Error (${news.title}):`, e.message);
                stats.errors++;
                continue; // 重要：即使這條失敗，繼續下一條
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        return res.status(200).json({ success: true, duration: `${duration}s`, stats });

    } catch (globalError) {
        console.error('[CRON] 💥 Fatal Error:', globalError);
        return res.status(500).json({ error: globalError.message });
    }
}
