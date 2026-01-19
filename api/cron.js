
// api/cron.js - 真實自動化新聞發佈系統 (Vercel Serverless Function)
// v4.0 Multi-Source Hybrid Edition
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- 設定檔 ---
const FETCH_LIMIT_PER_RUN = 6; // 目標：每小時 5-6 則
const RSS_SOURCES = [
    { url: 'https://news.google.com/rss?hl=zh-HK&gl=HK&ceid=HK:zh-Hant', name: 'Google News HK' },
    { url: 'https://www.hk01.com/rss/channel/2', name: 'HK01' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NYT Tech' }
];

export default async function handler(req, res) {
    // 1. 初始化環境
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const startTime = Date.now();
    
    const isForceMode = req.query.force === 'true';
    const isTestInjection = req.query.inject_test === 'true';

    console.log(`[CRON] 🚀 Job started at ${new Date().toISOString()}`);

    // 2. 環境變數檢查
    const envVars = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY,
        NEWS_API_KEY: process.env.NEWS_API_KEY
    };

    const missingKeys = Object.keys(envVars).filter(key => !envVars[key]);
    if (missingKeys.length > 0) {
        console.error(`[CRON] ❌ Missing Env: ${missingKeys.join(', ')}`);
        return res.status(500).json({ error: 'Config Error', missing: missingKeys });
    }

    const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });

    // --- 測試模式: 注入單筆資料 ---
    if (isTestInjection) {
        console.log('[CRON] 💉 執行測試資料注入...');
        const testPost = {
            id: Date.now(),
            title: `【系統測試】多來源架構驗證 - ${new Date().toLocaleTimeString('en-HK')}`,
            content: "此訊息用於驗證 v4.0 多來源爬蟲架構的資料庫寫入權限。",
            contentCN: "此訊息用於驗證 v4.0 多來源爬蟲架構的資料庫寫入權限。",
            region: "全部",
            category: "系統公告",
            url: `https://test-v4-${Date.now()}.local`,
            author: "System Bot 🤖",
            author_id: "bot_system_v4",
            created_at: new Date().toISOString()
        };
        const { error } = await supabase.from('posts').insert(testPost);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true, mode: 'test_injection', post: testPost });
    }

    // --- 主邏輯: 多來源爬取 ---
    let stats = { found: 0, published: 0, duplicates: 0, errors: 0 };

    try {
        let allArticles = [];

        // 來源 A: NewsAPI (廣泛搜尋)
        const fetchNewsAPI = async () => {
            try {
                // 關鍵字包含中文與英文，確保覆蓋面
                const query = encodeURIComponent('(Hong Kong OR Taiwan OR China Economy OR AI Technology OR Web3 OR Crypto OR 國際新聞)');
                const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=50&apiKey=${envVars.NEWS_API_KEY}`;
                
                console.log(`[CRON] 📡 Fetching NewsAPI (Everything)...`);
                const resp = await fetch(url);
                if (!resp.ok) return [];
                const data = await resp.json();
                return data.articles || [];
            } catch (e) {
                console.error('[CRON] NewsAPI Error:', e.message);
                return [];
            }
        };

        // 來源 B: RSS (本地與即時) - 使用 Regex 解析 XML，無需額外套件
        const fetchRSS = async (source) => {
            try {
                console.log(`[CRON] 📡 Fetching RSS: ${source.name}`);
                const resp = await fetch(source.url);
                const xml = await resp.text();
                
                const items = [];
                // 簡單的 Regex 來提取 RSS 2.0 item
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
                    // 清理 description 中的 HTML tags
                    let desc = getTag('description') || '';
                    desc = desc.replace(/<[^>]+>/g, '').substring(0, 300);

                    if (title && link) {
                        items.push({
                            title,
                            description: desc || title,
                            url: link,
                            source: { name: source.name },
                            publishedAt: new Date().toISOString() // RSS 時間格式複雜，這裡簡化處理
                        });
                    }
                }
                return items;
            } catch (e) {
                console.error(`[CRON] RSS Error (${source.name}):`, e.message);
                return [];
            }
        };

        // 並行執行所有爬取任務
        const [newsApiItems, ...rssResults] = await Promise.all([
            fetchNewsAPI(),
            ...RSS_SOURCES.map(s => fetchRSS(s))
        ]);

        // 合併結果
        allArticles = [...newsApiItems];
        rssResults.forEach(items => allArticles = [...allArticles, ...items]);

        stats.found = allArticles.length;
        console.log(`[CRON] Total Raw Articles: ${stats.found}`);

        // 隨機打亂順序，避免每次都只發同一來源
        allArticles = allArticles.sort(() => Math.random() - 0.5);

        if (allArticles.length === 0) {
            return res.status(200).json({ message: 'No articles found', stats });
        }

        // --- 發佈循環 ---
        for (const article of allArticles) {
            // 達到數量限制即停止
            if (stats.published >= FETCH_LIMIT_PER_RUN) break;
            
            // 基礎過濾
            if (!article.title || article.title.length < 5) continue;

            // --- 去重邏輯 (Deduplication) ---
            if (!isForceMode) {
                // 1. 檢查標題 (Title) - 對抗 URL 變動
                const { data: existingTitle } = await supabase
                    .from('posts')
                    .select('id')
                    .eq('title', article.title)
                    .single();
                
                if (existingTitle) {
                    stats.duplicates++;
                    continue; // 標題重複，跳過
                }

                // 2. 檢查 URL - 傳統去重
                const { data: existingUrl } = await supabase
                    .from('posts')
                    .select('id')
                    .eq('url', article.url)
                    .single();

                if (existingUrl) {
                    stats.duplicates++;
                    continue; // URL 重複，跳過
                }
            }

            // --- AI 改寫與分類 ---
            try {
                console.log(`[CRON] 🤖 AI Processing: ${article.title.substring(0, 30)}...`);
                
                const prompt = `
                Role: Senior Editor.
                Task: Summarize/Rewrite this news for a HK audience.
                
                Source Title: ${article.title}
                Source Desc: ${article.description}
                Source Name: ${article.source.name}
                
                Requirements:
                1. Language: Traditional Chinese (HK Cantonese style allowed).
                2. Tone: Professional but engaging.
                3. Length: 100-150 words.
                4. Classify Region: [中國香港, 台灣, 英國, 美國, 加拿大, 澳洲, 歐洲, 國際].
                5. Classify Category: [地產, 時事, 財經, 娛樂, 科技, 體育, 生活].

                Output JSON ONLY: { "titleTC": "...", "summaryTC": "...", "region": "...", "category": "..." }
                `;

                const result = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });

                let content = {};
                try {
                     const text = result.text.replace(/```json|```/g, '').trim();
                     content = JSON.parse(text);
                } catch (e) {
                     console.warn('[CRON] JSON Parse Fail, using raw data fallback');
                     content = { 
                         titleTC: article.title, 
                         summaryTC: article.description, 
                         region: "國際", 
                         category: "時事" 
                     };
                }

                const post = {
                    id: Date.now() + Math.floor(Math.random() * 100000),
                    title: content.titleTC || article.title,
                    content: content.summaryTC || article.description,
                    contentCN: content.summaryTC || article.description,
                    region: content.region || '國際',
                    category: content.category || '時事',
                    url: article.url,
                    source_name: article.source.name,
                    author: 'HKER Bot 🤖',
                    author_id: 'bot_auto_v4',
                    created_at: new Date().toISOString()
                };

                const { error: dbError } = await supabase.from('posts').insert(post);
                if (dbError) {
                    // 若並發時剛好寫入重複，忽略錯誤
                    if (dbError.code === '23505') {
                        stats.duplicates++;
                        continue;
                    }
                    throw dbError;
                }

                console.log(`[CRON] ✅ Published: ${post.title}`);
                stats.published++;

            } catch (err) {
                console.error(`[CRON] ❌ Item Error: ${err.message}`);
                stats.errors++;
                // 繼續下一則，不要中斷 Loop
                continue;
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        return res.status(200).json({ success: true, duration, stats });

    } catch (error) {
        console.error('[CRON] 💥 Fatal Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
