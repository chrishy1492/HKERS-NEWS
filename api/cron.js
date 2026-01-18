
// api/cron.js - 真實自動化新聞發佈系統 (Vercel Serverless Function)
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// 設定檔與常數
const TRUSTED_DOMAINS = 'bbc.com,cnn.com,reuters.com,bloomberg.com,scmp.com,theguardian.com,apnews.com,wsj.com,nytimes.com';
const FETCH_LIMIT_PER_RUN = 5; // 提高上限至 5 篇

export default async function handler(req, res) {
    // 1. 初始化與環境檢查
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    console.log(`[CRON] Job started at ${new Date().toISOString()}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const newsApiKey = process.env.NEWS_API_KEY;

    // 檢查必要環境變數
    if (!supabaseUrl || !supabaseKey || !geminiKey || !newsApiKey) {
        console.error('[CRON] Critical Error: Missing Environment Variables (SUPABASE, GEMINI, or NEWS_API)');
        return res.status(500).json({ error: 'Missing configuration' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // 詳細狀態追蹤
    let stats = { 
        stage: "初始化 (Initializing)", 
        found: 0, 
        processed: 0, 
        success: 0, 
        duplicates: 0, 
        errors: 0 
    };

    try {
        // 2. 定義帶有詳細 Log 的新聞抓取函數
        const fetchNews = async (url) => {
            try {
                console.log(`[CRON] Fetching URL: ${url}`);
                const r = await fetch(url);
                if (!r.ok) {
                    console.warn(`[CRON] API Fetch Failed: Status ${r.status}`);
                    return [];
                }
                const data = await r.json();
                if (data.status === 'error') {
                     console.warn(`[CRON] API Error: ${data.message}`);
                     return [];
                }
                const list = data.articles || [];
                console.log(`[CRON] API Result Count: ${list.length}`);
                if (list.length > 0) {
                    console.log(`[CRON] Sample Article: ${list[0].title}`);
                }
                return list;
            } catch (e) {
                console.warn(`[CRON] Exception during fetch:`, e.message);
                return [];
            }
        };

        const yesterday = new Date(Date.now() - 36 * 3600 * 1000).toISOString(); // 過去 36 小時
        const query = encodeURIComponent('(Hong Kong OR Taiwan OR UK OR USA OR Canada OR Australia OR Europe)');
        
        let articles = [];

        // 策略 A: 權威媒體精準搜尋
        stats.stage = "策略 A: 權威媒體 (Trusted Domains)";
        articles = await fetchNews(`https://newsapi.org/v2/everything?q=${query}&domains=${TRUSTED_DOMAINS}&from=${yesterday}&sortBy=publishedAt&pageSize=20&apiKey=${newsApiKey}`);
        
        // 策略 B: 廣泛搜尋 (如果 A 無結果)
        if (articles.length === 0) {
             stats.stage = "策略 B: 廣泛搜尋 (Broad Search)";
             console.log('[CRON] No results from trusted domains, switching to broad search...');
             articles = await fetchNews(`https://newsapi.org/v2/everything?q=${query}&from=${yesterday}&sortBy=relevancy&language=en&pageSize=20&apiKey=${newsApiKey}`);
        }

        // 策略 C: 全球頭條保底 (如果 A & B 都無結果)
        if (articles.length === 0) {
             stats.stage = "策略 C: 全球頭條 (Top Headlines Fallback)";
             console.log('[CRON] No results found, switching to Top Headlines fallback...');
             articles = await fetchNews(`https://newsapi.org/v2/top-headlines?language=en&pageSize=20&apiKey=${newsApiKey}`);
        }

        stats.found = articles.length;
        
        if (articles.length === 0) {
            stats.stage = "失敗: 無資料 (No Data Found)";
            console.log('[CRON] CRITICAL: No articles found after all strategies. Check API Key or Quota.');
        }

        // 3. 處理與發佈
        for (const article of articles) {
            if (stats.success >= FETCH_LIMIT_PER_RUN) break;

            if (!article.title || !article.description || article.title.length < 10) {
                console.log('[CRON] Skipping invalid article (No title/desc)');
                continue;
            }

            stats.processed++;

            // 3.1 強制重複檢查 (Deduplication Check)
            // 先查詢資料庫是否存在相同的 URL
            const { data: existing } = await supabase
                .from('posts')
                .select('id')
                .eq('url', article.url)
                .single();
            
            if (existing) {
                console.log(`[CRON] Skipping Duplicate: ${article.title.substring(0, 30)}...`);
                stats.duplicates++;
                continue; // 直接跳過，不消耗 AI 額度
            }

            try {
                console.log(`[CRON] Processing new article: ${article.title.substring(0, 30)}...`);
                
                // 3.2 AI 改寫
                const prompt = `
                Role: Professional News Editor for a Web3 Community (HKER).
                Task: Rewrite the following news into Traditional Chinese (Hong Kong Cantonese style preferred for headlines).
                Goal: Summarize facts to avoid copyright issues. Keep it engaging.

                Input Title: ${article.title}
                Input Description: ${article.description}
                Input Source: ${article.source.name}

                Output Format: JSON ONLY. No markdown blocks.
                {
                    "titleTC": "Headline in Traditional Chinese",
                    "summaryTC": "Summary (80-150 words) in Traditional Chinese",
                    "region": "Select closest: [中國香港, 台灣, 英國, 美國, 加拿大, 澳洲, 歐洲, 其他]",
                    "category": "Select closest: [地產, 時事, 財經, 娛樂, 旅遊, 數碼, 汽車, 宗教, 優惠, 校園, 天氣, 社區活動]"
                }
                `;

                const result = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });
                
                let content = {};
                try {
                    content = JSON.parse(result.text);
                } catch (e) {
                     // 容錯處理 Markdown block
                     const match = result.text.match(/\{[\s\S]*\}/);
                     if (match) content = JSON.parse(match[0]);
                     else throw new Error('Invalid JSON from AI');
                }

                if (!content.titleTC) throw new Error('Missing title in AI response');

                // 3.3 寫入資料庫
                const post = {
                    id: Date.now() + Math.floor(Math.random() * 100000), // BigInt ID
                    title: content.titleTC,
                    content: content.summaryTC,
                    contentCN: content.summaryTC,
                    region: content.region || '其他',
                    category: content.category || '時事',
                    url: article.url,
                    source_name: article.source.name,
                    author: 'HKER Bot 🤖',
                    author_id: 'bot_cron_auto',
                    created_at: new Date().toISOString()
                };

                const { error: dbError } = await supabase.from('posts').insert(post);
                if (dbError) throw dbError;

                console.log(`[CRON] Successfully published: ${post.title}`);
                stats.success++;

            } catch (err) {
                console.error(`[CRON] Item Processing Error:`, err.message);
                stats.errors++;
            }
        }

        // 4. 完成回傳
        return res.status(200).json({ 
            success: true, 
            message: `Cron execution completed. Stage: ${stats.stage}. Found: ${stats.found}. Published: ${stats.success}. Skipped Duplicates: ${stats.duplicates}.`,
            stats 
        });

    } catch (error) {
        console.error('[CRON] Fatal Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
