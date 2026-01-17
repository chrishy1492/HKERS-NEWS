
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

/**
 * 專業新聞機器人 (v2.4 強化穩定版)
 * 解決問題：針對 NewsAPI 免費版數據不穩定導致的 0 則發布進行修復
 * 適配：已升級至 @google/genai SDK 與 Gemini 3.0 模型
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

const TRUSTED_DOMAINS = 'bbc.com,cnn.com,reuters.com,bloomberg.com,scmp.com,theguardian.com,apnews.com';

export default async function handler(req, res) {
    // 防止 Vercel 緩存 response
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    let stats = {
        stage: "初始化",
        raw_found: 0,
        duplicates: 0,
        published: 0,
        api_status: "unknown"
    };

    try {
        const now = new Date();
        // 往前推 36 小時，但保留 10 分鐘緩衝，避開 API 尚未索引的時間點
        const thirtySixHoursAgo = new Date(now.getTime() - (36 * 60 * 60 * 1000));
        const timeLimit = thirtySixHoursAgo.toISOString();

        const fetchNews = async (url) => {
            try {
                const resp = await fetch(url);
                const data = await resp.json();
                stats.api_status = data.status;
                if (data.status === "error") {
                    console.warn(`NewsAPI Error: ${data.message}`);
                    return [];
                }
                return data.articles || [];
            } catch (e) {
                console.error(`Fetch Error: ${e.message}`);
                return [];
            }
        };

        // --- 策略：循環嘗試不同的搜尋深度 ---
        let articles = [];
        
        // 1. 深度搜尋：權威媒體 + 地區關鍵字
        const query = encodeURIComponent('Hong Kong OR Taiwan OR USA OR UK');
        
        // 嘗試權威模式
        articles = await fetchNews(
            `https://newsapi.org/v2/everything?q=${query}&domains=${TRUSTED_DOMAINS}&from=${timeLimit}&sortBy=publishedAt&pageSize=30&apiKey=${process.env.NEWS_API_KEY}`
        );
        if (articles.length > 0) {
            stats.stage = "權威模式";
        }

        // 2. 廣度搜尋：如果 1 沒結果，放棄域名限制
        if (articles.length === 0) {
            console.log("權威模式無結果，切換廣度模式...");
            articles = await fetchNews(
                `https://newsapi.org/v2/everything?q=${query}&language=en&from=${timeLimit}&sortBy=relevancy&pageSize=30&apiKey=${process.env.NEWS_API_KEY}`
            );
            if (articles.length > 0) {
                stats.stage = "廣度模式";
            }
        }

        // 3. 基礎搜尋：如果 2 沒結果，只搜最簡單的關鍵字 (Top Headlines)
        if (articles.length === 0) {
            console.log("廣度模式無結果，切換保底模式...");
            articles = await fetchNews(
                `https://newsapi.org/v2/top-headlines?language=en&pageSize=30&apiKey=${process.env.NEWS_API_KEY}`
            );
             if (articles.length > 0) {
                stats.stage = "保底模式";
            }
        }

        stats.raw_found = articles.length;
        const results = [];

        for (const article of articles) {
            if (stats.published >= 3) break; // 縮減單次發布數量，提高 24 小時分佈頻率

            // 過濾無效或移除的文章
            if (!article.title || !article.description || article.title.includes("[Removed]")) continue;
            
            // 查重 (使用 maybeSingle 避免報錯)
            const { data: existing } = await supabase
                .from('posts')
                .select('url')
                .eq('url', article.url)
                .maybeSingle(); 
            
            if (existing) {
                stats.duplicates++;
                continue;
            }

            try {
                const prompt = `
                你是一位資深編輯。處理這則新聞：
                標題: ${article.title}
                描述: ${article.description}
                
                要求：
                1. 繁體中文改寫標題與 150 字內容，提取核心事實。
                2. 分類地區 [中國香港, 台灣, 英國, 美國, 加拿大, 澳洲, 歐洲, 其他]。
                3. 分類主題 [地產, 時事, 財經, 娛樂, 旅遊, 數碼, 汽車, 宗教, 優惠, 校園, 天氣, 社區活動]。
                回傳 JSON：{"t":"標題","c":"內容","r":"地區","s":"主題"}
                `;

                const aiResult = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });
                
                let aiData = { t: article.title, c: article.description, r: "其他", s: "時事" };
                
                try {
                    if (aiResult.text) {
                        aiData = JSON.parse(aiResult.text);
                    }
                } catch (parseError) {
                    const cleanJson = aiResult.text.replace(/```json|```/g, "").trim();
                    try { aiData = JSON.parse(cleanJson); } catch(e) {}
                }

                const { error: insertError } = await supabase.from('posts').insert([{
                    id: Date.now() + Math.floor(Math.random() * 100000), // 手動 ID
                    title: aiData.t,
                    content: aiData.c,
                    contentCN: aiData.c,
                    region: aiData.r,
                    category: aiData.s,
                    url: article.url,
                    source_name: article.source.name,
                    author: 'AI_Robot',
                    author_id: 'bot_active_worker',
                    created_at: new Date().toISOString()
                }]);

                if (!insertError) {
                    results.push(aiData.t);
                    stats.published++;
                } else {
                    console.error(`DB Write Error: ${insertError.message}`);
                }
            } catch (e) {
                console.error(`Processing Error: ${e.message}`);
                continue;
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: `運行完畢 (${stats.stage})`,
            data_info: `抓取:${stats.raw_found}, 重複:${stats.duplicates}, 發布:${stats.published}`,
            titles: results,
            details: stats
        });

    } catch (error) {
        console.error("Critical Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
