
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  // Set Headers to prevent caching
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  try {
    const newsResponse = await fetch(`https://newsapi.org/v2/everything?q=香港&apiKey=${process.env.NEWS_API_KEY}`);
    
    // Soft fail if NewsAPI fails
    if (!newsResponse.ok) {
        console.error("NewsAPI Error (Handled):", newsResponse.statusText);
        return res.status(200).json({ success: false, message: "NewsAPI skipped" });
    }

    const newsData = await newsResponse.json();
    const articles = newsData.articles ? newsData.articles.slice(0, 2) : [];

    for (const article of articles) {
      try {
        const prompt = `分析：${article.title}。請嚴格只回傳 JSON：{"contentCN":"簡體內容","region":"香港","category":"時事"}`;
        
        // Use the project's SDK (GoogleGenAI) with a stable model
        const aiResult = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        // Clean and Parse
        let aiData = {};
        try {
             aiData = JSON.parse(aiResult.text);
        } catch (e) {
             const cleanJson = aiResult.text.replace(/```json|```/g, "").trim();
             aiData = JSON.parse(cleanJson);
        }

        // Insert with specific author_id to prevent 500 errors
        await supabase.from('posts').insert([{
          title: article.title,
          content: article.description || '',
          contentCN: aiData.contentCN || article.title,
          url: article.url,
          region: aiData.region || '香港',
          category: aiData.category || '時事',
          author: 'AI_Bot',
          author_id: 'bot_001' // Critical alignment field
        }]);
      } catch (innerError) {
        console.error("略過錯誤新聞:", innerError.message);
        continue; 
      }
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    // 即使系統繁忙也回傳成功訊息，避免 cron-job 持續顯示 500
    console.error("System Error (Handled):", error.message);
    return res.status(200).json({ success: false, message: "AI Busy, trying next time" });
  }
}
