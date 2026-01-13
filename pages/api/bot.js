
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

/**
 * HKER BOT - SERVERLESS FUNCTION
 * Path: /pages/api/bot.js
 * Triggered by: cron-job.org
 */

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const GEMINI_API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

// Defined lists for validation/guidance
const REGIONS = ["中國香港", "台灣", "英國", "美國", "加拿大", "澳洲", "歐洲"];
const TOPICS = ["地產", "時事", "財經", "娛樂", "旅遊", "數碼", "汽車", "社區活動"];

export default async function handler(req, res) {
  // 1. Headers
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // 2. Checks
  if (req.method !== 'GET') return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  
  if (!SUPABASE_SERVICE_KEY) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing.");
    return res.status(500).json({ error: "Server Error: Missing SUPABASE_SERVICE_ROLE_KEY" });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server Error: Missing GEMINI_API_KEY" });
  }

  try {
    const startTime = Date.now();
    console.log("--- BOT STARTED ---");

    // --- STEP A: INIT ---
    // supabase variable here acts as supabaseAdmin due to SERVICE_KEY
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // --- STEP B: TARGET PARAMETERS ---
    const targetRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const targetTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    console.log(`Target Search: ${targetRegion} - ${targetTopic}`);

    // --- STEP C: GEMINI PROMPT ---
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a senior editor for HKER News.
      TASK: Search for a REAL, LATEST news event (last 24-48h) related to "${targetRegion}" and "${targetTopic}".
      
      REQUIREMENTS:
      1. Use 'googleSearch' to verify facts.
      2. Return ONLY raw JSON. No markdown.
      3. CRITICAL: Analyze the content and determine the most accurate 'region' and 'category'.
      
      OUTPUT JSON FORMAT:
      {
        "titleCN": "Traditional Chinese Headline",
        "titleEN": "English Headline",
        "contentCN": "Traditional Chinese summary (80-100 words)",
        "contentEN": "English summary (80-100 words)",
        "region": "The most relevant region (e.g., 中國香港, 英國, etc.)",
        "category": "The most relevant topic (e.g., 時事, 財經, 地產, etc.)",
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

    // --- STEP D: PARSE ---
    let article; // Naming consistent with your request logic
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

    // Source URL Logic
    let sourceUrl = "https://news.google.com";
    const chunks = aiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const webChunk = chunks.find((c) => c.web?.uri);
        if (webChunk) sourceUrl = webChunk.web.uri;
    }
    article.url = sourceUrl;

    // --- STEP E: SAVE (CUSTOM LOGIC) ---
    // This matches the specific structure requested, mapped to DB columns
    const { data, error } = await supabaseAdmin
      .from('posts') 
      .insert({
        id: crypto.randomUUID(),
        titleCN: article.titleCN, // Maps to 'title' concept
        titleEN: article.titleEN,
        contentCN: article.contentCN, // Maps to 'translatedContent' concept
        contentEN: article.contentEN, // Maps to 'content' concept
        region: article.region || '未分類',      // AI 自動判斷的地區
        topic: article.category || '時事',       // AI 自動判斷的主題 (Database column is 'topic')
        sourceUrl: article.url,                  // Source URL
        sourceName: article.sourceName || "HKER AI",
        
        // System Fields
        authorName: 'HKER News Bot', // Specific Author Name
        authorId: 'bot-auto-gen',
        isBot: true,
        timestamp: Date.now(),
        likes: 0,
        loves: 0
      });

    if (error) {
      console.error("Supabase Write Error:", error);
      throw new Error(`Database Insert Failed: ${error.message}`);
    }

    // --- STEP F: RESPONSE ---
    const duration = Date.now() - startTime;
    return res.status(200).json({
      status: 'success',
      message: 'News Generated and Saved',
      data: { 
        title: article.titleCN, 
        region: article.region, 
        category: article.category 
      },
      duration: `${duration}ms`
    });

  } catch (err) {
    console.error("Bot Error:", err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
