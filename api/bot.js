
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

/**
 * HKER BOT - SERVERLESS FUNCTION (Vite/Root Compatibility)
 * Path: /api/bot.js
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG'; 
const GEMINI_API_KEY = process.env.API_KEY;

const REGIONS = ["中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"];
const TOPICS = ["地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "社區活動"];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server Configuration Error: Missing GEMINI_API_KEY" });
  }

  try {
    const startTime = Date.now();
    
    // Init
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Params
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    // Gemini
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a reporter for HKER News.
      TASK: Search for a REAL news event from the last 24 hours related to "${region}" and "${topic}".
      REQUIREMENTS:
      1. Use 'googleSearch' to verify facts.
      2. Return ONLY raw JSON. No markdown.
      3. JSON Schema: {"titleCN": "...", "titleEN": "...", "contentCN": "...", "contentEN": "...", "sourceName": "..."}
    `;

    const aiResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = aiResponse.text;
    if (!text) throw new Error("Gemini returned empty text");

    // Parse
    let newsData;
    try {
      let jsonString = text.trim();
      jsonString = jsonString.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }
      newsData = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Failed to parse Gemini response as JSON");
    }

    // Extract URL
    let sourceUrl = "https://news.google.com";
    const chunks = aiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const webChunk = chunks.find((c) => c.web?.uri);
        if (webChunk) sourceUrl = webChunk.web.uri;
    }

    // Save
    const newPost = {
      id: crypto.randomUUID(),
      titleCN: newsData.titleCN,
      titleEN: newsData.titleEN,
      contentCN: newsData.contentCN,
      contentEN: newsData.contentEN,
      region: region,
      topic: topic,
      authorId: 'bot-auto-gen',
      authorName: 'HKER Bot 🤖',
      authorAvatar: '🤖',
      timestamp: Date.now(),
      likes: 0,
      loves: 0,
      isBot: true,
      sourceUrl: sourceUrl,
      sourceName: newsData.sourceName || "HKER AI"
    };

    const { error: dbError } = await supabase.from('posts').insert(newPost);
    if (dbError) throw new Error(`Database Insert Failed: ${dbError.message}`);

    const duration = Date.now() - startTime;
    return res.status(200).json({
      status: 'success',
      message: 'News Generated and Saved',
      data: { title: newsData.titleCN, region, topic },
      duration: `${duration}ms`
    });

  } catch (err) {
    console.error("Bot Error:", err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
