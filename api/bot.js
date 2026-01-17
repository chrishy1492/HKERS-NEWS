
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    let articles = [];

    // 1. 策略 A: 廣泛搜尋 (Everything Endpoint)
    // 使用 (香港 OR "Hong Kong" OR "HK") 關鍵字，按相關性排序，抓取過去一個月內最相關的新聞
    console.log("執行策略 A: NewsAPI Everything Search...");
    try {
        const query = encodeURIComponent('(香港 OR "Hong Kong" OR "HK")');
        const newsResponse = await fetch(
          `https://newsapi.org/v2/everything?q=${query}&sortBy=relevancy&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
        );
        
        if (newsResponse.ok) {
            const newsData = await newsResponse.json();
            articles = newsData.articles || [];
        } else {
             console.warn("NewsAPI Everything Endpoint Failed:", newsResponse.statusText);
        }
    } catch (e) { console.warn("Fetch Error (Strategy A):", e.message); }

    // 2. 策略 B: 強制備案 (Top Headlines - Technology/ZH)
    // 如果策略 A 無結果 (或失敗)，強制抓取中文科技頭條，確保一定有內容產出
    if (articles.length === 0) {
        console.log("策略 A 無結果，切換至策略 B (Tech Headlines)...");
        try {
            const topResponse = await fetch(
                `https://newsapi.org/v2/top-headlines?category=technology&language=zh&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
            );
            if (topResponse.ok) {
                const topData = await topResponse.json();
                articles = topData.articles || [];
            }
        } catch (e) { console.warn("Fetch Error (Strategy B):", e.message); }
    }

    if (articles.length === 0) {
      return res.status(200).json({ success: true, message: "當前全球無匹配新聞，等待下次運行" });
    }

    // 取前 3 篇進行處理
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

        // 3. 寫入資料庫
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
            // 忽略重複內容 (Duplicate URL)
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
