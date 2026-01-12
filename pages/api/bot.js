
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

/**
 * HKER BOT - SERVERLESS FUNCTION
 * Path: /pages/api/bot.js
 * Triggered by: cron-job.org
 */

// --- CONFIGURATION ---
// 使用 Vercel 環境變量，如果沒有則使用您提供的預設值 (建議在 Vercel 後台設定 Service Role Key 以獲得完整寫入權限)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG'; 
const GEMINI_API_KEY = process.env.API_KEY;

// Constants for randomization
const REGIONS = ["中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"];
const TOPICS = ["地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "社區活動"];

export default async function handler(req, res) {
  // 1. Config: Prevent caching
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // 2. Method Check
  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 3. API Key Check
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server Configuration Error: Missing GEMINI_API_KEY" });
  }

  try {
    const startTime = Date.now();
    console.log("--- BOT STARTED ---");

    // --- STEP A: INIT CLIENTS ---
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // --- STEP B: RANDOMIZE PARAMETERS ---
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    console.log(`Target: ${region} - ${topic}`);

    // --- STEP C: GEMINI GENERATION ---
    // Note: Server-side Gemini call needs to handle tools carefully
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a reporter for HKER News.
      TASK: Search for a REAL news event from the last 24 hours related to "${region}" and "${topic}".
      
      REQUIREMENTS:
      1. Use 'googleSearch' to find facts.
      2. Return ONLY raw JSON. No markdown formatting.
      3. JSON Schema:
      {
        "titleCN": "Traditional Chinese Headline",
        "titleEN": "English Headline",
        "contentCN": "Traditional Chinese summary (80-120 words)",
        "contentEN": "English summary (80-120 words)",
        "sourceName": "Source Name (e.g. BBC)"
      }
    `;

    const aiResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = aiResponse.text;
    if (!text) throw new Error("Gemini returned empty text");

    // --- STEP D: PARSE JSON ---
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
      console.error("JSON Parse Error", text);
      throw new Error("Failed to parse Gemini response as JSON");
    }

    // Attempt to extract source URL from grounding metadata
    let sourceUrl = "https://news.google.com";
    const chunks = aiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const webChunk = chunks.find((c) => c.web?.uri);
        if (webChunk) sourceUrl = webChunk.web.uri;
    }

    // --- STEP E: SAVE TO SUPABASE ---
    const newPost = {
      id: crypto.randomUUID(), // Node.js 19+ supports this, or use uuid package if needed. Vercel usually supports it.
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

    if (dbError) {
      console.error("Supabase Error:", dbError);
      throw new Error(`Database Insert Failed: ${dbError.message}`);
    }

    // --- STEP F: SUCCESS RESPONSE ---
    const duration = Date.now() - startTime;
    return res.status(200).json({
      status: 'success',
      message: 'News Generated and Saved',
      data: {
        title: newsData.titleCN,
        region,
        topic
      },
      duration: `${duration}ms`
    });

  } catch (err) {
    console.error("Bot Execution Error:", err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack
    });
  }
}
