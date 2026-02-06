
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

/**
 * 專業新聞機器人 (v2.2)
 * 功能：自動抓取全球新聞、AI 摘要避版權、自動分類、24小時工作
 * 優化：大幅強化抓取成功率，確保保底機制在 0 結果時強制運作，並封裝請求邏輯
 */

// 1. 初始化 Supabase 與 Gemini AI
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
// 使用新版 SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// 2. 專業新聞來源白名單
const TRUSTED_DOMAINS = 'bbc.com,cnn.com,reuters.com,bloomberg.com,scmp.com,theguardian.com,apnews.com,wsj.com,nytimes.com';

export default async function handler(req, res) {
    // 防止 Vercel 緩存 response
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    let stats = {
        stage: "初始化",
        found: 0,
        duplicates: 0,
        published: 0,
        errors: 0
    };

    try {
        console.log("機器人啟動：執行專業深度搜尋邏輯 (v2.2)...");

        // 3. 時間過濾：36 小時內
        const timeLimit = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

        // 4. 定義搜尋函數以重複利用 (含錯誤處理)
        const fetchNews = async (url) => {
            try {
                console.log(`Fetching: ${url.substring(0, 60)}...`); // Log URL for debug (partial)
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.warn(`NewsAPI HTTP Error: ${resp.status}`);
                    return [];
                }
                const data = await resp.json();
                if (data.status === "error") {
                    console.error(`NewsAPI 内部錯誤: ${data.message}`);
                    return [];
                }
                return data.articles || [];
            } catch (e) {
                console.error(`Fetch Exception: ${e.message}`);
                return [];
            }
        };

        // 關鍵字設定
        const queryKeywords = '(Hong Kong OR Taiwan OR UK OR USA OR Canada OR Australia OR Europe)';
        const query = encodeURIComponent(queryKeywords);
        
        let articles = [];

        // --- 階段一：嚴格權威模式 (Domains + Keywords) ---
        articles = await fetchNews(
            `https://newsapi.org/v2/everything?q=${query}&domains=${TRUSTED_DOMAINS}&from=${timeLimit}&sortBy=publishedAt&pageSize=40&apiKey=${process.env.NEWS_API_KEY}`
        );
        if (articles.length > 0) {
            stats.stage = "嚴格模式 (權威媒體)";
        }

        // --- 階段二：全球廣泛搜尋 (No Domains, Relevancy) ---
        if (articles.length === 0) {
            console.log("⚠️ 權威來源無資料，執行全球廣泛搜尋...");
            articles = await fetchNews(
                `https://newsapi.org/v2/everything?q=${query}&from=${timeLimit}&sortBy=relevancy&language=en&pageSize=40&apiKey=${process.env.NEWS_API_KEY}`
            );
            if (articles.length > 0) {
                stats.stage = "寬鬆模式 (全球來源)";
            }
        }

        // --- 階段三：強制保底模式 (Global Top Headlines) ---
        // 移除 query 參數，確保一定能抓到東西
        if (articles.length === 0) {
            console.log("⚠️ 依舊無資料，執行強制保底熱門頭條...");
            articles = await fetchNews(
                `https://newsapi.org/v2/top-headlines?language=en&pageSize=40&apiKey=${process.env.NEWS_API_KEY}`
            );
            if (articles.length > 0) {
                stats.stage = "保底模式 (全球熱門)";
            }
        }

        stats.found = articles.length;
        const results = [];

        // 5. 循環處理抓到的文章
        for (const article of articles) {
            if (stats.published >= 5) break; 

            // 基本過濾
            if (!article.title || article.title.length < 10 || !article.description) continue;
            
            // 檢查重複
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
                // 6. AI 改寫邏輯
                const prompt = `
                你是一位專業的新聞編輯。請將以下英文新聞進行摘要改寫，目的是規避版權問題並提供繁體中文重點。
                
                [原始標題]: ${article.title}
                [原始內容]: ${article.description}
                [新聞來源]: ${article.source.name}

                工作要求：
                1. 重新撰寫標題與內容，嚴禁直接翻譯，請用專業報導口吻改寫。
                2. 內容摘要約 150-200 字，以提取事實重點為主。
                3. 從以下清單選擇一個最相關地區：[中國香港, 台灣, 英國, 美國, 加拿大, 澳洲, 歐洲, 其他]。
                4. 從以下清單選擇一個最相關主題：[地產, 時事, 財經, 娛樂, 旅遊, 數碼, 汽車, 宗教, 優惠, 校園, 天氣, 社區活動]。

                請僅回傳 JSON 格式數據：
                {
                    "titleTC": "新編寫標題",
                    "summaryTC": "改寫摘要內容",
                    "region": "地區名稱",
                    "category": "主題名稱"
                }
                `;

                const aiResult = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview', // 使用最新模型
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
                    } catch (parseError) {
                        const cleanJson = aiResult.text.replace(/```json|```/g, "").trim();
                        try { aiData = JSON.parse(cleanJson); } catch(e) {}
                    }
                }

                // 7. 同步存儲發貼資料
                const { error: insertError } = await supabase.from('posts').insert([{
                    id: Date.now() + Math.floor(Math.random() * 100000), // 手動 ID
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
                    console.error(`DB Write Error: ${insertError.message}`);
                }

            } catch (err) {
                stats.errors++;
                console.error(`AI/Processing Error: ${err.message}`);
                continue; 
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: `執行狀態: [${stats.stage}] 獲取 ${stats.found} 則, 跳過重複 ${stats.duplicates} 則, 成功發佈 ${stats.published} 則`,
            details: stats,
            titles: results
        });

    } catch (error) {
        console.error("全局捕捉錯誤:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
