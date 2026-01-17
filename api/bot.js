
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// 權威新聞來源白名單
const TRUSTED_DOMAINS = 'bbc.com,cnn.com,reuters.com,bloomberg.com,scmp.com,theguardian.com,apnews.com';

export default async function handler(req, res) {
  // 防止 Vercel 緩存此 API 回應
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    console.log("機器人啟動：開始搜尋全球權威新聞...");

    // 1. 設定時間限制：只抓取過去 36 小時內的新聞
    const timeLimit = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

    // 2. 設定搜尋關鍵字 (涵蓋主要地區與科技關鍵字)
    const query = encodeURIComponent('(Hong Kong OR Taiwan OR UK OR USA OR Canada OR Australia OR Europe)');
    
    let articles = [];

    // 策略 A: 針對權威網域 (Trusted Domains) 進行搜尋
    try {
        const apiUrl = `https://newsapi.org/v2/everything?q=${query}&domains=${TRUSTED_DOMAINS}&from=${timeLimit}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`;
        const newsResponse = await fetch(apiUrl);
        const newsData = await newsResponse.json();
        articles = newsData.articles || [];
    } catch (e) {
        console.warn("權威媒體搜尋失敗:", e.message);
    }

    // 策略 B: 如果權威媒體沒資料，切換到寬鬆模式 (Global Top Headlines)
    if (articles.length === 0) {
        console.log("權威來源無新資料，切換至全球熱門...");
        try {
            const backupUrl = `https://newsapi.org/v2/top-headlines?category=general&language=en&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`;
            const backupRes = await fetch(backupUrl);
            const backupData = await backupRes.json();
            articles = backupData.articles || [];
        } catch (e) {
            console.warn("備案搜尋失敗:", e.message);
        }
    }

    const results = [];

    // 3. 逐條處理新聞
    for (const article of articles) {
        // 跳過無內容的新聞
        if (!article.title || !article.description) continue;
        
        // 檢查資料庫是否已存在 (避免重複)
        const { data: existing } = await supabase
            .from('posts')
            .select('url')
            .eq('url', article.url)
            .single();
        
        if (existing) {
            console.log(`跳過重複新聞: ${article.title}`);
            continue;
        }

        try {
            // 4. AI 核心處理 (改寫、分類、翻譯)
            const prompt = `
            你是一個專業的國際新聞編輯。請處理以下英文新聞：
            
            [標題]: ${article.title}
            [內容]: ${article.description}
            [來源]: ${article.source.name}

            請執行以下任務：
            1. 【版權處理】：不要直接翻譯，請用「總結摘要」的方式重新編寫新聞內容，提取 3-5 個重點。語言使用「繁體中文 (Traditional Chinese)」。
            2. 【地區分類】：從此清單選擇一個最相關的：[中國香港, 台灣, 英國, 美國, 加拿大, 澳洲, 歐洲]。如果不確定，選 "其他"。
            3. 【主題分類】：從此清單選擇一個最相關的：[地產, 時事, 財經, 娛樂, 旅遊, 數碼, 汽車, 宗教, 優惠, 校園, 天氣, 社區活動]。
            4. 【標題優化】：給出一個吸引人的繁體中文標題。

            請嚴格回傳 JSON 格式如下，不要有 Markdown 標記：
            {
                "titleTC": "中文標題",
                "summaryTC": "重點摘要內容...",
                "region": "地區",
                "category": "主題"
            }
            `;

            // 使用最新的 Gemini 模型
            const aiResult = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            let aiData = { 
                titleTC: article.title, 
                summaryTC: article.description, 
                region: '國際', 
                category: '時事' 
            };

            if (aiResult.text) {
                try {
                    aiData = JSON.parse(aiResult.text);
                } catch (parseErr) {
                    const cleanJson = aiResult.text.replace(/```json|```/g, "").trim();
                    aiData = JSON.parse(cleanJson);
                }
            }

            // 5. 寫入資料庫
            const { error: insertError } = await supabase.from('posts').insert([{
                id: Date.now() + Math.floor(Math.random() * 100000), // 生成唯一 ID
                title: aiData.titleTC,           // AI 改寫的標題
                content: aiData.summaryTC,       // 英文內容欄位填入摘要 (作為備份)
                contentCN: aiData.summaryTC,     // 中文內容欄位
                region: aiData.region,           // 自動分類地區
                category: aiData.category,       // 自動分類主題
                url: article.url,                // 原始連結 (保留出處)
                source_name: article.source.name,// 新聞來源
                author: 'HKER News Bot',         // 機器人名稱
                author_id: 'bot_automatic_001'   // 機器人ID
            }]);

            if (!insertError) {
                results.push(aiData.titleTC);
                console.log(`成功發佈: ${aiData.titleTC}`);
            } else {
                console.error(`DB Error: ${insertError.message}`);
            }

        } catch (err) {
            console.error(`AI 處理失敗 (${article.title}):`, err.message);
            continue;
        }
    }

    return res.status(200).json({ 
        success: true, 
        message: `成功發佈 ${results.length} 則新聞`,
        titles: results 
    });

  } catch (error) {
    console.error("系統錯誤:", error);
    return res.status(200).json({ success: false, error: error.message });
  }
}
