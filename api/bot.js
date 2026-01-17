
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

export default async function handler(req, res) {
  try {
    // 1. 第一優先：搜尋香港 (最新排序)
    let newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=(香港 OR "Hong Kong")&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
    );
    let newsData = await newsResponse.json();
    
    // 2. 第二優先：如果香港沒新聞，強制抓全球熱門新聞作為備案
    if (!newsData.articles || newsData.articles.length === 0) {
      console.log("切換至全球熱門新聞...");
      newsResponse = await fetch(
        `https://newsapi.org/v2/top-headlines?language=en&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
      );
      newsData = await newsResponse.json();
    }

    const articles = newsData.articles || [];
    const insertedTitles = [];

    for (const article of articles) {
      try {
        const prompt = `翻譯並分析：${article.title}。請嚴格回傳 JSON：{"contentCN":"簡體內容","region":"國際","category":"時事"}`;
        
        // 使用新版 @google/genai SDK
        const aiResult = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
             config: { responseMimeType: 'application/json' }
        });
        
        let aiData = { contentCN: article.description, region: '國際', category: '時事' };
        try {
            if (aiResult.text) {
                const cleanText = aiResult.text.replace(/```json|```/g, "").trim();
                aiData = JSON.parse(cleanText);
            }
        } catch(e) { }

        // 寫入資料庫 (包含 ID 生成以確保兼容性)
        const { error: dbError } = await supabase.from('posts').insert([{
          id: Date.now() + Math.floor(Math.random() * 100000),
          title: article.title,
          content: article.description || '',
          contentCN: aiData.contentCN || article.description,
          url: article.url,
          region: aiData.region || '國際',
          category: aiData.category || '時事',
          author: 'AI_Bot',
          author_id: 'bot_001',
          source_name: article.source.name || 'NewsAPI'
        }]);

        if (!dbError) insertedTitles.push(article.title);
      } catch (e) { continue; }
    }

    return res.status(200).json({ success: true, inserted: insertedTitles });
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message });
  }
}
