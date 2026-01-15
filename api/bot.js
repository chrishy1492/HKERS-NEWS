
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

/**
 * HKER BOT - SERVERLESS FUNCTION (Vite/Root Compatibility)
 * Path: /api/bot.js
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const GEMINI_API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

const REGIONS = ["中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"];
const TOPICS = ["地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "社區活動"];

// Hard Fallback Data
const SYSTEM_NEWS = {
  titleCN: "【系統公告】AI 新聞生成服務繁忙",
  titleEN: "System Notice: AI News Service Busy",
  contentCN: "由於目前 AI 系統使用量已達上限，即時新聞生成暫時受限。我們將盡快恢復服務。請稍後再試。",
  contentEN: "Due to high traffic on our AI services, real-time news generation is temporarily limited. We are working to restore service.",
  sourceName: "System Admin"
};

// 【優化】定義一個自動重試的函數 (Retry Helper)
async function askAIWithRetry(ai, model, contents, config, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await ai.models.generateContent({ model, contents, config });
      return result;
    } catch (error) {
      const errStr = error.toString().toLowerCase();
      // 如果遇到 AI 塞車 (503/Overloaded) 或 配額 (429)，等待後重試
      if (i < retries - 1 && (errStr.includes('503') || errStr.includes('overloaded') || errStr.includes('429') || errStr.includes('quota'))) {
        console.log(`AI 忙碌中 (Busy/Quota)，正在進行第 ${i + 1} 次重試 (Retrying in 5s)...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒
        continue;
      }
      throw error;
    }
  }
  throw new Error("AI 嘗試多次後仍然失敗 (Max Retries Exceeded)");
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!SUPABASE_SERVICE_KEY) {
     return res.status(500).json({ error: "Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY" });
  }
  if (!GEMINI_API_KEY) {
     return res.status(500).json({ error: "Configuration Error: Missing GEMINI_API_KEY" });
  }

  try {
    const startTime = Date.now();
    
    // Init
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Target
    const targetRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const targetTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const model = "gemini-3-flash-preview";
    const fallbackModel = "gemini-2.5-flash";

    const getPrompt = (useSearch) => `
      You are a senior editor for HKER News.
      TASK: Search for a REAL, LATEST news event related to "${targetRegion}" and "${targetTopic}".
      ${!useSearch ? 'NOTE: Search tool unavailable. Use internal knowledge to generate a plausible news summary.' : ''}
      
      REQUIREMENTS:
      1. ${useSearch ? "Use 'googleSearch' to verify facts." : "Generate realistic content."}
      2. Return ONLY raw JSON. No markdown.
      
      OUTPUT JSON FORMAT:
      {
        "titleCN": "Traditional Chinese Headline",
        "titleEN": "English Headline",
        "contentCN": "Traditional Chinese summary (80-120 words). Focus on facts.",
        "contentEN": "English summary (80-120 words)",
        "region": "The most relevant region",
        "category": "The most relevant category",
        "sourceName": "Name of the news source"
      }
    `;

    let text = "";
    let sourceUrl = "https://news.google.com";
    let usedSearch = false;

    // ATTEMPT 1: Search (With Retry)
    try {
        const aiResponse = await askAIWithRetry(
          ai, 
          model, 
          getPrompt(true), 
          { tools: [{ googleSearch: {} }] }
        );
        
        text = aiResponse.text;
        const chunks = aiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            const webChunk = chunks.find((c) => c.web?.uri);
            if (webChunk) sourceUrl = webChunk.web.uri;
        }
        usedSearch = true;
    } catch (e) {
        console.warn("Bot Primary AI Failed. Switching to Fallback...");
        // ATTEMPT 2: Fallback (With Retry)
        try {
            const fallbackResponse = await askAIWithRetry(
              ai,
              fallbackModel,
              getPrompt(false),
              {}
            );
            text = fallbackResponse.text;
        } catch (fbErr) {
             // ATTEMPT 3: Mock
             console.error("Bot AI Failed completely. Using Mock.");
             text = JSON.stringify(SYSTEM_NEWS);
        }
    }

    if (!text) text = JSON.stringify(SYSTEM_NEWS);

    let article; 
    try {
      let jsonString = text.trim();
      jsonString = jsonString.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }
      article = JSON.parse(jsonString);
    } catch (e) {
      article = SYSTEM_NEWS;
    }

    // SAVE Logic - USE SNAKE_CASE for DB columns to fix PGRST204
    const dbPayload = {
        id: crypto.randomUUID(),
        title_cn: article.titleCN || "無標題",
        title_en: article.titleEN || "No Title",
        content_cn: article.contentCN || "內容生成中...",
        content_en: article.contentEN || "Content generating...",
        region: article.region || targetRegion || "未分類",
        category: article.category || targetTopic || "時事", 
        url: sourceUrl || article.url,
        source_name: article.sourceName || "HKER AI",
        author_name: 'HKER News Bot',
        author_id: 'bot-auto-gen', // Fixed ID for bot
        is_bot: true,
        likes: 0,
        loves: 0
    };

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert(dbPayload);

    if (error) {
       console.error("Supabase Write Error:", error);
       throw new Error(`Database Insert Failed: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    return res.status(200).json({
      status: 'success',
      message: usedSearch ? 'News Generated (Search)' : 'News Generated (Fallback/Mock)',
      data: { title: article.titleCN },
      duration: `${duration}ms`
    });

  } catch (err) {
    console.error("Bot Error:", err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
