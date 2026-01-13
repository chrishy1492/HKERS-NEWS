
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

    // Target (Search guidance)
    const targetRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const targetTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    // Gemini
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a senior editor for HKER News.
      TASK: Search for a REAL, LATEST news event (last 24-48h) related to "${targetRegion}" and "${targetTopic}".
      
      REQUIREMENTS:
      1. Use 'googleSearch' to verify facts. Do not invent news.
      2. Analyze the content and determine the most accurate 'region' and 'category' from the provided lists.
         - Regions: ${JSON.stringify(REGIONS)}
         - Categories: ${JSON.stringify(TOPICS)}
      3. Return ONLY raw JSON. No markdown.
      
      OUTPUT JSON FORMAT:
      {
        "titleCN": "Traditional Chinese Headline",
        "titleEN": "English Headline",
        "contentCN": "Traditional Chinese summary (80-120 words). Focus on facts.",
        "contentEN": "English summary (80-120 words)",
        "region": "The most relevant region",
        "category": "The most relevant category",
        "sourceName": "Source Name"
      }
    `;

    const aiResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = aiResponse.text;
    if (!text) throw new Error("Gemini returned empty text");

    // Parse
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
      throw new Error("Failed to parse Gemini response as JSON");
    }

    // URL
    let sourceUrl = "https://news.google.com";
    const chunks = aiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const webChunk = chunks.find((c) => c.web?.uri);
        if (webChunk) sourceUrl = webChunk.web.uri;
    }
    article.url = sourceUrl;

    // SAVE Logic (Matched to request)
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        id: crypto.randomUUID(),
        titleCN: article.titleCN,
        titleEN: article.titleEN,
        contentCN: article.contentCN,
        contentEN: article.contentEN,
        region: article.region || '未分類',      // AI Determined
        topic: article.category || '時事',       // AI Determined (mapped to DB 'topic')
        sourceUrl: article.url,
        sourceName: article.sourceName || "HKER AI",
        authorName: 'HKER News Bot',
        authorId: 'bot-auto-gen',
        isBot: true,
        timestamp: Date.now(),
        likes: 0,
        loves: 0
      });

    if (error) throw new Error(`Database Insert Failed: ${error.message}`);

    const duration = Date.now() - startTime;
    return res.status(200).json({
      status: 'success',
      message: 'News Generated and Saved',
      data: { title: article.titleCN, region: article.region, category: article.category },
      duration: `${duration}ms`
    });

  } catch (err) {
    console.error("Bot Error:", err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
