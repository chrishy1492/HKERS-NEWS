
// api/cron.js - 真實自動化新聞發佈系統 (Vercel Serverless Function)
// v6.0 High-Impact Content Edition
// Features: NewsAPI (3h Window) + Gemini Rich Summary (200-400 words) + Deduplication

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- 設定檔 ---
const FETCH_LIMIT_PER_RUN = 6; // 每小時目標 6 則

// Fallback Keys (若 process.env 未設定)
const KEYS = {
    SB_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co',
    SB_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GEMINI: process.env.GEMINI_API_KEY || process.env.API_KEY,
    NEWS_API: process.env.NEWS_API_KEY || '64da19cb45c646c6bf0f73925c5bd611'
};

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const startTime = Date.now();
    
    // 1. 初始化
    const supabase = createClient(KEYS.SB_URL, KEYS.SB_KEY, { auth: { persistSession: false } });
    const ai = new GoogleGenAI({ apiKey: KEYS.GEMINI });

    console.log(`[CRON] 🚀 Job v6.0 Started.`);

    let stats = { found: 0, published: 0, duplicates: 0, errors: 0 };
    
    // 時間過濾: 擴大至 3 小時，確保有新聞
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();

    try {
        // --- 2. 抓取資料 (Fetch Data) ---
        let allArticles = [];

        try {
            // 擴大關鍵字: 香港 OR 國際 OR 科技 OR 財經 OR 娛樂
            const q = encodeURIComponent('香港 OR 國際 OR 科技 OR 經濟 OR 娛樂');
            // sortBy=publishedAt (最新), pageSize=100 (抓更多以備過濾)
            const url = `https://newsapi.org/v2/everything?q=${q}&language=zh&sortBy=publishedAt&pageSize=100&from=${threeHoursAgo}&apiKey=${KEYS.NEWS_API}`;
            
            console.log('[CRON] 📡 Fetching NewsAPI (3H Window)...');
            const resp = await fetch(url);
            const data = await resp.json();
            
            if (data.articles) {
                allArticles = data.articles;
            }
        } catch (e) {
            console.error('[CRON] NewsAPI Error:', e.message);
        }

        console.log(`[CRON] Total Articles Found: ${allArticles.length}`);
        stats.found = allArticles.length;

        // 如果文章太少，嘗試抓取更舊的（保底機制）
        if (allArticles.length < FETCH_LIMIT_PER_RUN) {
             console.log('[CRON] ⚠️ Not enough news, fetching Top Headlines as fallback...');
             try {
                 const fallbackUrl = `https://newsapi.org/v2/top-headlines?language=zh&pageSize=20&apiKey=${KEYS.NEWS_API}`;
                 const fbResp = await fetch(fallbackUrl);
                 const fbData = await fbResp.json();
                 if(fbData.articles) allArticles = [...allArticles, ...fbData.articles];
             } catch(e) {}
        }

        // --- 3. 處理與發佈 (Process & Publish) ---
        // 隨機打亂避免每次只發同一類
        // allArticles.sort(() => Math.random() - 0.5); 
        // 改為：優先發佈最新的，但要確保沒重複
        
        let processedCount = 0;

        for (const news of allArticles) {
            // 達到數量限制即停止 (6 則)
            if (stats.published >= FETCH_LIMIT_PER_RUN) break;
            
            // 安全限制：防止單次執行過久
            if (processedCount++ > 30) break; 

            if (!news.title || news.title.length < 5) continue;

            // --- 強力去重 (Title-based & URL-based) ---
            try {
                const { data: existing } = await supabase
                    .from('posts')
                    .select('id')
                    .or(`title.eq.${news.title},url.eq.${news.url}`)
                    .limit(1);

                if (existing && existing.length > 0) {
                    stats.duplicates++;
                    continue;
                }
            } catch (err) {}

            // --- AI 深度改寫 (Rich Content Generation) ---
            try {
                console.log(`[CRON] 🤖 Rewriting (Rich Summary): ${news.title.substring(0, 20)}...`);

                const prompt = `
                你是專業新聞編輯。請根據以下新聞資訊，撰寫一篇適合 Web3 社群閱讀的深度新聞摘要。
                
                [來源資訊]
                標題：${news.title}
                內容片段：${news.description || '無詳細內容'}
                來源：${news.source.name}
                連結：${news.url}

                [寫作要求]
                1. **標題**：繁體中文，吸引人且精準。
                2. **內文**：繁體中文，字數約 200-400 字。必須包含：
                   - 事件經過 (What happened)
                   - 背景補充 (Context)
                   - 可能的影響或市場反應 (Impact)
                3. **風格**：專業、客觀、流暢。
                4. **分類**：從 [時事, 財經, 科技, 娛樂, Crypto] 中選一個。
                5. **地區**：從 [中國香港, 台灣, 國際, 科技] 中選一個。

                請僅回傳 JSON 格式：
                { "titleTC": "...", "summaryTC": "...", "region": "...", "category": "..." }
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
                    // Fallback if JSON parsing fails
                    aiContent = {
                        titleTC: news.title,
                        summaryTC: (news.description || news.title) + "\n\n(AI 生成摘要失敗，顯示原內容)",
                        region: "國際",
                        category: "時事"
                    };
                }

                // 組合最終貼文
                const post = {
                    id: Date.now() + Math.floor(Math.random() * 1000000),
                    title: aiContent.titleTC || news.title,
                    content: aiContent.summaryTC, // 這裡現在是長文
                    contentCN: aiContent.summaryTC,
                    region: aiContent.region || '國際',
                    category: aiContent.category || '時事',
                    url: news.url,
                    source_name: news.source.name,
                    author: 'HKER AI Editor 🤖',
                    author_id: 'bot_gemini_v6',
                    created_at: new Date().toISOString() // 這裡用當下時間，讓它顯示為最新
                };

                const { error: insertError } = await supabase.from('posts').insert(post);
                
                if (insertError) {
                    console.error('[CRON] DB Insert Error:', insertError.message);
                    stats.errors++;
                } else {
                    console.log(`[CRON] ✅ Published: ${post.title}`);
                    stats.published++;
                }

                // Rate Limit Protection: Wait 2s between AI calls
                await new Promise(r => setTimeout(r, 2000));

            } catch (e) {
                console.error(`[CRON] ❌ Gemini/Process Error:`, e.message);
                stats.errors++;
                continue; 
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        return res.status(200).json({ success: true, duration: `${duration}s`, stats });

    } catch (globalError) {
        console.error('[CRON] 💥 Fatal Error:', globalError);
        return res.status(500).json({ error: globalError.message });
    }
}
