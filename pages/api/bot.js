
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    // 1. 強力搜尋：改用 Top Headlines 以確保獲取最新熱門新聞 (擴大範圍)
    let articles = [];
    
    // 策略 A: 搜尋 Top Headlines (擴大關鍵字：香港, China, AI, Tech)
    // 修正：使用更廣泛的關鍵字組合，確保即使 NewsAPI 對單一關鍵字無結果也能抓取到相關新聞
    const query = encodeURIComponent('(香港 OR "Hong Kong" OR "China News" OR "AI")');

    try {
        const newsResponse = await fetch(
          `https://newsapi.org/v2/top-headlines?q=${query}&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
        );
        if (newsResponse.ok) {
            const newsData = await newsResponse.json();
            articles = newsData.articles || [];
        } else {
            console.warn("NewsAPI Top-Headlines Endpoint Failed:", newsResponse.statusText);
        }
    } catch (e) { console.warn("Fetch Error (Top Headlines):", e.message); }

    // 策略 B: 如果關鍵字搜尋沒結果，嘗試直接抓取香港地區頭條 (Country: hk)
    if (articles.length === 0) {
        console.log("策略 A 無結果，切換至策略 B (Region Headlines)...");
        try {
            const backupResponse = await fetch(
                `https://newsapi.org/v2/top-headlines?country=hk&pageSize=3&apiKey=${process.env.NEWS_API_KEY}`
            );
            if (backupResponse.ok) {
                const backupData = await backupResponse.json();
                articles = backupData.articles || [];
            }
        } catch (e) { console.warn("Fetch Error (Region Headlines):", e.message); }
    }

    if (articles.length === 0) {
      return res.status(200).json({ success: true, message: "當前全球無匹配新聞，等待下次運行" });
    }

    const processedArticles = articles.slice(0, 3);
    const results = [];

    for (const article of processedArticles) {
      try {
        let aiData = { 
            contentCN: article.description || article.title, 
            region: '香港', 
            category: '時事' 
        };
        
        try {
          const prompt = `翻譯並分類：${article.title}。請嚴格回傳 JSON：{"contentCN":"簡體翻譯","region":"香港","category":"時事"}`;
          const aiResult = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
             config: { responseMimeType: 'application/json' }
          });
          
          try {
             aiData = JSON.parse(aiResult.text);
          } catch (parseErr) {
             const cleanJson = aiResult.text.replace(/```json|```/g, "").trim();
             aiData = JSON.parse(cleanJson);
          }
        } catch (aiErr) {
          console.warn("AI 忙碌或出錯，使用原文替代");
        }

        // 3. 寫入資料庫 - 手動生成 ID 以避免 23502 錯誤
        const { error: dbError } = await supabase.from('posts').insert([{
          id: Date.now() + Math.floor(Math.random() * 100000),
          title: article.title,
          content: article.description || '',
          contentCN: aiData.contentCN || article.description || '',
          url: article.url,
          region: aiData.region || '香港',
          category: aiData.category || '時事',
          author: 'AI_Bot',
          author_id: 'bot_001',
          source_name: article.source.name || 'NewsAPI'
        }]);

        if (!dbError) {
            results.push(article.title);
        } else if (dbError.code === '23505') {
            // 忽略重複內容
        } else {
            console.error("DB Insert Error:", dbError.message);
        }
      } catch (innerError) { continue; }
    }

    return res.status(200).json({ success: true, inserted: results });
  } catch (error) {
    console.error("Critical Bot Error:", error);
    return res.status(200).json({ success: false, error: "System Busy" });
  }
}
