
// api/cron.js - 真實自動化新聞發佈系統 (Vercel Serverless Function)
// v3.1 Diagnostic & Fix Edition
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- 設定檔 ---
const TRUSTED_DOMAINS = 'bbc.com,cnn.com,reuters.com,bloomberg.com,scmp.com,theguardian.com,apnews.com,wsj.com,nytimes.com';
const FETCH_LIMIT_PER_RUN = 3; 

export default async function handler(req, res) {
    // 1. 初始化設定
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const startTime = Date.now();
    
    const isForceMode = req.query.force === 'true';
    const isTestInjection = req.query.inject_test === 'true';

    console.log(`[CRON] 🚀 Job started at ${new Date().toISOString()}`);

    // 2. 環境變數詳細診斷 (Diagnostic Check)
    const envVars = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY,
        NEWS_API_KEY: process.env.NEWS_API_KEY
    };

    // 找出缺少的變數
    const missingKeys = Object.keys(envVars).filter(key => !envVars[key]);

    // 打印目前的環境狀態 (隱藏敏感值，只顯示是否設定)
    console.log('[CRON] 🔍 Env Status:', {
        SB_URL: !!envVars.NEXT_PUBLIC_SUPABASE_URL,
        SB_KEY: !!envVars.SUPABASE_SERVICE_ROLE_KEY,
        GEMINI: !!envVars.GEMINI_API_KEY,
        NEWS_API: !!envVars.NEWS_API_KEY,
        MISSING: missingKeys
    });

    if (missingKeys.length > 0) {
        console.error(`[CRON] ❌ CRITICAL ERROR: Missing Environment Variables: ${missingKeys.join(', ')}`);
        return res.status(500).json({ 
            error: 'Configuration Error', 
            missing_keys: missingKeys,
            hint: 'Please add these variables in Vercel Project Settings.'
        });
    }

    // 3. 初始化客戶端
    const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });

    // --- 模式 A: 注入測試資料 (測試 DB 寫入) ---
    if (isTestInjection) {
        console.log('[CRON] 💉 執行測試資料注入模式...');
        const testPost = {
            id: Date.now(),
            title: `【系統診斷】寫入權限測試 - ${new Date().toLocaleTimeString('en-HK')}`,
            content: "這是一條測試訊息，確認 Vercel Function 可以成功寫入 Supabase 資料庫。",
            contentCN: "這是一條測試訊息，確認 Vercel Function 可以成功寫入 Supabase 資料庫。",
            region: "全部",
            category: "系統公告",
            url: `https://test-diag-${Date.now()}.local`,
            author: "System Diag Bot 🤖",
            author_id: "bot_diag",
            created_at: new Date().toISOString()
        };
        
        const { error } = await supabase.from('posts').insert(testPost);
        
        if (error) {
            console.error('[CRON] ❌ DB Insert Failed:', error);
            return res.status(500).json({ error: 'DB Write Failed', details: error });
        }
        
        console.log('[CRON] ✅ 測試資料寫入成功');
        return res.status(200).json({ success: true, mode: 'inject_test', post: testPost });
    }

    // --- 模式 B: 真實新聞爬取 ---
    let stats = { found: 0, published: 0, duplicates: 0, errors: 0, strategy: '' };

    try {
        const fetchNews = async (url, label) => {
            console.log(`[CRON] 📡 [${label}] Fetching URL...`);
            try {
                const resp = await fetch(url);
                
                // 詳細錯誤診斷
                if (!resp.ok) {
                    const errText = await resp.text();
                    console.error(`[CRON] ⚠️ API HTTP Error (${resp.status}): ${errText}`);
                    return [];
                }

                const data = await resp.json();
                
                if (data.status === 'error') {
                    console.error(`[CRON] ❌ NewsAPI Error: [${data.code}] ${data.message}`);
                    return [];
                }

                const items = data.articles || [];
                console.log(`[CRON] ✅ [${label}] Success. Found: ${items.length} items.`);
                if (items.length > 0) {
                    console.log(`[CRON]    Sample Title: "${items[0].title}"`);
                }
                return items;
            } catch (e) {
                console.error(`[CRON] ❌ Network/Parse Exception: ${e.message}`);
                return [];
            }
        };

        const fromTime = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const query = encodeURIComponent('(Hong Kong OR Taiwan OR Crypto OR AI OR Tech)');
        
        let articles = [];

        // 策略 1: 權威媒體
        articles = await fetchNews(
            `https://newsapi.org/v2/everything?q=${query}&domains=${TRUSTED_DOMAINS}&from=${fromTime}&sortBy=publishedAt&pageSize=10&apiKey=${envVars.NEWS_API_KEY}`,
            "Strategy 1 (Trusted)"
        );
        stats.strategy = "Trusted";

        // 策略 2: 廣泛搜尋
        if (articles.length === 0) {
            console.log('[CRON] 🔄 切換至策略 2 (廣泛搜尋)...');
            articles = await fetchNews(
                `https://newsapi.org/v2/everything?q=${query}&from=${fromTime}&sortBy=relevancy&language=en&pageSize=10&apiKey=${envVars.NEWS_API_KEY}`,
                "Strategy 2 (Broad)"
            );
            stats.strategy = "Broad";
        }

        // 策略 3: 頭條保底
        if (articles.length === 0) {
             console.log('[CRON] 🔄 切換至策略 3 (頭條保底)...');
             articles = await fetchNews(
                 `https://newsapi.org/v2/top-headlines?language=en&pageSize=10&apiKey=${envVars.NEWS_API_KEY}`,
                 "Strategy 3 (Headlines)"
             );
             stats.strategy = "Headlines";
        }

        stats.found = articles.length;

        if (articles.length === 0) {
            console.log('[CRON] 🛑 最終結果：無資料。請檢查 API Key 額度或查詢條件。');
            return res.status(200).json({ success: true, message: 'No articles found', stats });
        }

        // 處理與發佈
        for (const article of articles) {
            if (stats.published >= FETCH_LIMIT_PER_RUN) break;
            if (!article.title || !article.description) continue;

            // 重複檢查
            if (!isForceMode) {
                const { data: existing } = await supabase
                    .from('posts')
                    .select('id')
                    .eq('url', article.url)
                    .single();
                
                if (existing) {
                    console.log(`[CRON] ⏭️ 跳過重複: ${article.title.substring(0, 15)}...`);
                    stats.duplicates++;
                    continue;
                }
            }

            try {
                // AI 改寫
                console.log(`[CRON] 🤖 AI Rewrite: ${article.title.substring(0, 20)}...`);
                
                const prompt = `
                Role: News Editor.
                Task: Translate/Rewrite to Traditional Chinese (HK Style).
                Input: ${article.title}
                Desc: ${article.description}
                Output JSON ONLY: { "titleTC": "...", "summaryTC": "...", "region": "中國香港/台灣/國際", "category": "時事/財經/科技" }
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
                     console.error('[CRON] JSON Parse Error, using raw title');
                     content = { titleTC: article.title, summaryTC: article.description, region: "其他", category: "時事" };
                }

                const post = {
                    id: Date.now() + Math.floor(Math.random() * 100000),
                    title: content.titleTC || article.title,
                    content: content.summaryTC || article.description,
                    contentCN: content.summaryTC || article.description,
                    region: content.region || '其他',
                    category: content.category || '時事',
                    url: article.url,
                    source_name: article.source.name,
                    author: 'HKER Bot 🤖',
                    author_id: 'bot_auto_v3',
                    created_at: new Date().toISOString()
                };

                const { error: dbError } = await supabase.from('posts').insert(post);
                if (dbError) throw dbError;

                console.log(`[CRON] ✅ Published: ${post.title}`);
                stats.published++;

            } catch (err) {
                console.error(`[CRON] ❌ Item Error: ${err.message}`);
                stats.errors++;
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        return res.status(200).json({ success: true, duration: `${duration}s`, stats });

    } catch (error) {
        console.error('[CRON] 💥 Fatal Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
