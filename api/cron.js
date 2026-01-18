
// api/cron.js - 真實自動化新聞發佈系統 (Vercel Serverless Function)
// v3.0 Professional Edition with Diagnostics
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- 設定檔 ---
const TRUSTED_DOMAINS = 'bbc.com,cnn.com,reuters.com,bloomberg.com,scmp.com,theguardian.com,apnews.com,wsj.com,nytimes.com';
const FETCH_LIMIT_PER_RUN = 3; // 每次執行限制發佈篇數 (避免超時)

export default async function handler(req, res) {
    // 1. 初始化設定 (防止 Vercel 緩存)
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const startTime = Date.now();
    
    // --- 參數控制 ---
    // ?force=true : 跳過重複檢查
    // ?inject_test=true : 不爬新聞，直接寫入一條測試資料 (測試 DB 寫入權限用)
    const isForceMode = req.query.force === 'true';
    const isTestInjection = req.query.inject_test === 'true';

    console.log(`[CRON] 🚀 Job started at ${new Date().toISOString()} | Force: ${isForceMode} | Inject: ${isTestInjection}`);

    // 2. 環境變數檢查
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 必須使用 Service Role Key 以繞過 RLS
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const newsApiKey = process.env.NEWS_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey || !newsApiKey) {
        console.error('[CRON] ❌ CRITICAL: Missing Environment Variables');
        return res.status(500).json({ 
            error: 'Configuration Error', 
            details: { sb: !!supabaseUrl, key: !!supabaseKey, ai: !!geminiKey, news: !!newsApiKey }
        });
    }

    // 3. 初始化客戶端
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // --- 模式 A: 注入測試資料 (排除 API 問題，專測 DB) ---
    if (isTestInjection) {
        console.log('[CRON] 💉 執行測試資料注入模式...');
        const testPost = {
            id: Date.now(),
            title: `【系統測試】自動化發佈測試 - ${new Date().toLocaleTimeString('en-HK')}`,
            content: "這是一條由 Cron Job 強制注入的測試新聞，用於驗證 Vercel 到 Supabase 的寫入權限是否正常。",
            contentCN: "這是一條由 Cron Job 強制注入的測試新聞，用於驗證 Vercel 到 Supabase 的寫入權限是否正常。",
            region: "全部",
            category: "系統公告",
            url: `https://test-injection-${Date.now()}.local`,
            author: "System Bot 🤖",
            author_id: "bot_system_test",
            created_at: new Date().toISOString()
        };
        
        const { error } = await supabase.from('posts').insert(testPost);
        
        if (error) {
            console.error('[CRON] ❌ DB 寫入失敗:', error);
            return res.status(500).json({ error: 'DB Write Failed', details: error });
        }
        
        console.log('[CRON] ✅ 測試資料寫入成功');
        return res.status(200).json({ success: true, mode: 'inject_test', post: testPost });
    }

    // --- 模式 B: 真實新聞爬取 ---
    let stats = { found: 0, published: 0, duplicates: 0, errors: 0, strategy: '' };

    try {
        // 定義爬蟲函數 (含詳細錯誤診斷)
        const fetchNews = async (url, strategyName) => {
            console.log(`[CRON] 🔍 [${strategyName}] Requesting: ${url}`);
            try {
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.warn(`[CRON] ⚠️ API HTTP Error: ${resp.status} ${resp.statusText}`);
                    return [];
                }
                const data = await resp.json();
                
                // NewsAPI 特有的錯誤回傳
                if (data.status === 'error') {
                    console.error(`[CRON] ❌ NewsAPI Error: ${data.code} - ${data.message}`);
                    return [];
                }
                
                if (!data.articles || data.articles.length === 0) {
                    console.log(`[CRON] ⚠️ [${strategyName}] No articles returned.`);
                    return [];
                }

                console.log(`[CRON] ✅ [${strategyName}] Found ${data.articles.length} articles.`);
                // 打印第一條標題以確認資料品質
                console.log(`[CRON]    Sample: "${data.articles[0].title}"`);
                return data.articles;
            } catch (e) {
                console.error(`[CRON] ❌ Fetch Exception: ${e.message}`);
                return [];
            }
        };

        // 時間範圍: 過去 24 小時
        const fromTime = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const query = encodeURIComponent('(Hong Kong OR Taiwan OR Crypto OR AI OR Tech)');
        
        let articles = [];

        // 策略 1: 精準權威 (Trusted Domains)
        articles = await fetchNews(
            `https://newsapi.org/v2/everything?q=${query}&domains=${TRUSTED_DOMAINS}&from=${fromTime}&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey}`,
            "Strategy 1: Trusted"
        );
        stats.strategy = "Trusted";

        // 策略 2: 廣泛搜尋 (Broad Search) - 如果策略 1 沒結果
        if (articles.length === 0) {
            console.log('[CRON] 🔄 Switching to Strategy 2...');
            articles = await fetchNews(
                `https://newsapi.org/v2/everything?q=${query}&from=${fromTime}&sortBy=relevancy&language=en&pageSize=10&apiKey=${newsApiKey}`,
                "Strategy 2: Broad"
            );
            stats.strategy = "Broad";
        }

        // 策略 3: 全球頭條 (Top Headlines Fallback) - 最後保底
        if (articles.length === 0) {
            console.log('[CRON] 🔄 Switching to Strategy 3 (Fallback)...');
            articles = await fetchNews(
                `https://newsapi.org/v2/top-headlines?language=en&pageSize=10&apiKey=${newsApiKey}`,
                "Strategy 3: Headlines"
            );
            stats.strategy = "Headlines";
        }

        stats.found = articles.length;

        if (articles.length === 0) {
            console.log('[CRON] 🛑 No articles found after all strategies. Job ending.');
            return res.status(200).json({ success: true, message: 'No news found', stats });
        }

        // --- 處理新聞 ---
        for (const article of articles) {
            if (stats.published >= FETCH_LIMIT_PER_RUN) break;
            
            // 基礎過濾
            if (!article.title || article.title === '[Removed]' || !article.description) continue;

            // 1. 重複檢查 (Deduplication)
            if (!isForceMode) {
                const { data: existing } = await supabase
                    .from('posts')
                    .select('id')
                    .eq('url', article.url)
                    .single();
                
                if (existing) {
                    console.log(`[CRON] ⏭️ 跳過重複: ${article.title.substring(0, 20)}...`);
                    stats.duplicates++;
                    continue;
                }
            } else {
                console.log(`[CRON] ⚠️ Force Mode: Skipping duplicate check.`);
            }

            // 2. AI 摘要與翻譯
            try {
                console.log(`[CRON] 🤖 AI Processing: ${article.title.substring(0, 30)}...`);
                
                const prompt = `
                Role: Senior News Editor for a HK Tech/Web3 Community.
                Task: Summarize and translate this news into Traditional Chinese (Hong Kong style).
                
                Source Title: ${article.title}
                Source Desc: ${article.description}
                Source Name: ${article.source.name}

                Requirements:
                1. Title: Catchy, standard HK news style.
                2. Content: Concise summary (80-120 words).
                3. Region: Choose [中國香港, 台灣, 英國, 美國, 加拿大, 澳洲, 歐洲, 其他].
                4. Category: Choose [地產, 時事, 財經, 娛樂, 旅遊, 數碼, 汽車, 宗教, 優惠, 校園, 天氣, 社區活動].
                
                Output JSON ONLY: { "titleTC": "...", "summaryTC": "...", "region": "...", "category": "..." }
                `;

                const result = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });

                let content = {};
                try {
                     // 嘗試解析，處理可能存在的 Markdown 標記
                     const text = result.text.replace(/```json|```/g, '').trim();
                     content = JSON.parse(text);
                } catch (e) {
                     console.error('[CRON] ❌ JSON Parse Error:', result.text);
                     throw new Error('AI Response Invalid');
                }

                // 3. 寫入資料庫
                const post = {
                    id: Date.now() + Math.floor(Math.random() * 100000), // Numeric ID for BigInt compatibility
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

                console.log(`[CRON] ✅ 發佈成功: ${post.title}`);
                stats.published++;

            } catch (err) {
                console.error(`[CRON] ❌ Item Error: ${err.message}`);
                stats.errors++;
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[CRON] 🏁 Job finished in ${duration}s. Stats:`, stats);

        return res.status(200).json({ 
            success: true, 
            duration: `${duration}s`,
            stats 
        });

    } catch (fatalError) {
        console.error('[CRON] 💥 Fatal System Error:', fatalError);
        return res.status(500).json({ error: fatalError.message });
    }
}
