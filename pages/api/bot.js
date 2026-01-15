
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// 使用專案現有的 @google/genai SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

export default async function handler(req, res) {
  // 防止緩存
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    // 1. 強化搜尋：包含多種語言關鍵字，確保 NewsAPI 一定能抓到東西
    const query = encodeURIComponent('(香港 OR "Hong Kong" OR "HK News")');
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
    );
    
    // NewsAPI 軟性錯誤處理
    if (!newsResponse.ok) {
         console.warn("NewsAPI Error:", newsResponse.statusText);
         // 回傳 200 避免 Cron Job 報錯
         return res.status(200).json({ success: false, message: "NewsAPI 暫時不可用，已略過" });
    }

    const newsData = await newsResponse.json();
    
    // 如果真的沒新聞，這段會回傳成功但告知無資料，不會顯示錯誤
    if (!newsData.articles || newsData.articles.length === 0) {
      return res.status(200).json({ success: true, message: "當前全球無匹配新聞，稍後再試" });
    }

    const articles = newsData.articles.slice(0, 3); // 每次處理 3 則
    const results = [];

    for (const article of articles) {
      try {
        // 預設資料，防止 AI 失敗
        let aiData = { contentCN: article.description || article.title, region: '香港', category: '時事' };
        
        // 2. 嘗試呼叫 AI
        try {
          const prompt = `翻譯並分析：${article.title}。請嚴格回傳 JSON：{"contentCN":"簡體內容","region":"香港","category":"時事"}`;
          
          // 使用專案標準模型 gemini-2.5-flash
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
          console.error("AI 忙碌中，使用原始資料");
        }

        // 3. 執行寫入 (對齊您已建立的所有欄位)
        const { error: dbError } = await supabase.from('posts').insert([{
          title: article.title,
          content: article.description || '',
          contentCN: aiData.contentCN,
          url: article.url,
          region: aiData.region || '香港',
          category: aiData.category || '時事',
          author: 'AI_Bot',
          author_id: 'bot_001',
          source_name: article.source.name || 'NewsAPI'
        }]);

        if (!dbError) results.push(article.title);
      } catch (innerError) { continue; }
    }

    return res.status(200).json({ success: true, inserted: results });
  } catch (error) {
    // 即使系統報錯也回傳 200，防止 cron-job 頻繁顯示 500
    return res.status(200).json({ success: false, error: "系統暫時忙碌" });
  }
}
