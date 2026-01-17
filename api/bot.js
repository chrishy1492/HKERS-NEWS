
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

/**
 * 專業新聞機器人 (v2.0)
 * 功能：自動抓取全球新聞、AI 摘要避版權、自動分類、24小時工作
 */

// 1. 初始化 Supabase 與 Gemini AI
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
// 使用新的 SDK 初始化
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// 2. 專業新聞來源白名單 (確保公信力)
const TRUSTED_DOMAINS = 'bbc.com,cnn.com,reuters.com,bloomberg.com,scmp.com,theguardian.com,apnews.com,wsj.com';

export default async function handler(req, res) {
    // 防止 Vercel 緩存
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    let stats = {
        stage: "初始化",
        found: 0,
        duplicates: 0,
        published: 0,
        errors: 0
    };

    try {
        console.log("機器人啟動：執行專業深度搜尋邏輯...");

        // 3. 時間過濾：嚴格遵守 36 小時內的限制
        const timeLimit = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

        // 4. 全球地區關鍵字 (英文搜尋以獲取一手資料)
        const query = encodeURIComponent('(Hong Kong OR Taiwan OR UK OR USA OR Canada OR Australia OR Europe)');
        
        let articles = [];
        let apiUrl = "";
        let newsResponse = null;
        let newsData = null;

        // --- 階段一：嚴格權威模式 ---
        try {
            apiUrl = `https://newsapi.org/v2/everything?q=${query}&domains=${TRUSTED_DOMAINS}&from=${timeLimit}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;
            newsResponse = await fetch(apiUrl);
            if (newsResponse.ok) {
                newsData = await newsResponse.json();
                articles = newsData.articles || [];
            }
            stats.stage = "嚴格模式 (權威媒體)";
        } catch (e) {
            console.warn("階段一搜尋失敗:", e);
        }

        // --- 階段二：寬鬆關鍵字模式 ---
        if (articles.length === 0) {
            console.log("⚠️ 權威來源無資料，嘗試全球寬鬆搜尋...");
            try {
                apiUrl = `https://newsapi.org/v2/everything?q=${query}&from=${timeLimit}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;
                newsResponse = await fetch(apiUrl);
                if (newsResponse.ok) {
                    newsData = await newsResponse.json();
                    articles = newsData.articles || [];
                }
                stats.stage = "寬鬆模式 (全球來源)";
            } catch (e) {
                console.warn("階段二搜尋失敗:", e);
            }
        }

        // --- 階段三：保底活躍模式 ---
        if (articles.length === 0) {
            console.log("⚠️ 搜尋無匹配，執行保底熱門新聞...");
            try {
                apiUrl = `https://newsapi.org/v2/top-headlines?language=en&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;
                newsResponse = await fetch(apiUrl);
                if (newsResponse.ok) {
                    newsData = await newsResponse.json();
                    articles = newsData.articles || [];
                }
                stats.stage = "保底模式 (熱門頭條)";
            } catch (e) {
                console.warn("階段三搜尋失敗:", e);
            }
        }

        stats.found = articles.length;
        const results = [];

        // 5. 循環處理抓到的文章
        for (const article of articles) {
            // 單次運行限制發佈 3 則，防止短時間大量發貼被判斷為惡意行為
            if (stats.published >= 3) break; 

            if (!article.title || !article.description) continue;
            
            // 檢查重複：根據 URL 判斷
            const { data: existing } = await supabase
                .from('posts')
                .select('url')
                .eq('url', article.url)
                .single();
            
            if (existing) {
                stats.duplicates++;
                continue;
            }

            try {
                // 6. AI 改寫邏輯：避免侵權，提取重點
                const prompt = `
                你是一位專業的新聞編輯。請將以下英文新聞進行摘要改寫，目的是規避版權問題並提供繁體中文重點。
                
                [原始標題]: ${article.title}
                [原始內容]: ${article.description}
                [新聞來源]: ${article.source.name}

                工作要求：
                1. 重新撰寫標題與內容，嚴禁直接翻譯。
                2. 內容摘要約 150 字，以報導重點為主。
                3. 從 [中國香港, 台灣, 英國, 美國, 加拿大, 澳洲, 歐洲, 其他] 選擇一個最相關地區。
                4. 從 [地產, 時事, 財經, 娛樂, 旅遊, 數碼, 汽車, 宗教, 優惠, 校園, 天氣, 社區活動] 選擇一個主題。

                請僅回傳 JSON：
                {
                    "titleTC": "新編寫標題",
                    "summaryTC": "改寫摘要內容",
                    "region": "地區名稱",
                    "category": "主題名稱"
                }
                `;

                // 使用 Google GenAI SDK (Gemini 3.0)
                const aiResult = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });

                let aiData = {
                    titleTC: article.title,
                    summaryTC: article.description,
                    region: '其他',
                    category: '時事'
                };

                if (aiResult.text) {
                    try {
                        aiData = JSON.parse(aiResult.text);
                    } catch (parseErr) {
                        const cleanJson = aiResult.text.replace(/```json|```/g, "").trim();
                        try {
                           aiData = JSON.parse(cleanJson);
                        } catch(e) {}
                    }
                }

                // 7. 同步貯存發貼資料
                const { error: insertError } = await supabase.from('posts').insert([{
                    id: Date.now() + Math.floor(Math.random() * 100000), // 生成手動 ID
                    title: aiData.titleTC,
                    content: aiData.summaryTC,
                    contentCN: aiData.summaryTC,
                    region: aiData.region,
                    category: aiData.category,
                    url: article.url,
                    source_name: article.source.name,
                    author: 'AI_新聞工作者',
                    author_id: 'bot_active_worker',
                    created_at: new Date().toISOString()
                }]);

                if (!insertError) {
                    results.push(aiData.titleTC);
                    stats.published++;
                } else {
                    console.error("DB Insert Error:", insertError);
                }

            } catch (err) {
                stats.errors++;
                console.error(`AI 處理出錯:`, err.message);
                continue; 
            }
        }

        // 8. 回傳詳細運行報告
        return res.status(200).json({ 
            success: true, 
            message: `執行狀態: 獲取 ${stats.found} 則, 跳過重複 ${stats.duplicates} 則, 成功發佈 ${stats.published} 則`,
            details: stats,
            titles: results
        });

    } catch (error) {
        return res.status(200).json({ success: false, error: error.message });
    }
}
