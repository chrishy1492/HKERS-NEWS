
import { GoogleGenAI } from "@google/genai";
import { SupabaseClient } from '@supabase/supabase-js';

// Ensure API Key exists
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * 專業工程師版：自動化新聞獵頭引擎 (v10.1 Stable Edition)
 * 
 * Update Log:
 * - 增強 JSON 解析的正則表達式，防止 AI 閒聊導致 Parse Error。
 * - 優化 Prompt 指令，強制要求純淨 JSON。
 */
export const scoutAutomatedNews = async (region: string, topic: string) => {
  if (!apiKey) {
    console.error("Gemini API Key missing");
    return null;
  }

  try {
    const isZH = region === "中國香港" || region === "台灣";
    const langInstruction = isZH 
      ? "Traditional Chinese (Hong Kong Cantonese style)." 
      : "English (Professional journalistic style).";

    const prompt = `
    SYSTEM: You are a strict JSON data generator for a news database.
    TASK: Search for the LATEST (past 24h), specific news event about "${topic}" in "${region}".
    
    REQUIREMENTS:
    1. **NO PLAGIARISM**: Rewrite facts in your own words.
    2. **FORMAT**: Output ONLY valid JSON. No markdown code blocks, no conversational text.
    3. **SUMMARY**: Use Markdown bullet points in the summary field.

    OUTPUT SCHEMA (Strict JSON):
    {
      "title": "Headline (Max 60 chars)",
      "summary": "### 💡 Key Highlights\n- Point 1\n- Point 2\n\n### 🔍 Deep Dive\nDetailed analysis...",
      "content_snippet": "A short engaging intro paragraph (plain text, max 100 chars).",
      "source_name": "Media Name (e.g. BBC, RTHK)",
      "original_url": "https://actual-url-to-source.com",
      "language": "${isZH ? 'zh' : 'en'}"
    }

    LANGUAGE: ${langInstruction}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "{}";
    
    // Engineering Fix: Robust JSON Extraction
    // 移除可能存在的 Markdown 標記，並尋找第一個 '{' 和最後一個 '}'
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    } else {
      console.warn("AI Scout: No JSON object found in response.");
      return null;
    }
    
    let data;
    try {
        data = JSON.parse(text);
    } catch (parseError) {
        console.error("AI Scout: JSON Parse Failed", text);
        return null;
    }
    
    // Validate required fields for SQL
    if (!data.title || !data.summary || !data.original_url) {
        console.warn("AI Scout: Incomplete data structure.");
        return null;
    }
    
    return data;
  } catch (error) {
    console.error("AI Scout System Error:", error);
    return null;
  }
};

/**
 * 寫入機械人日誌 (Bot Logs - Sync Area)
 * 用於數據備份與同步，對應 SQL 表：public.bot_logs
 */
export const logBotActivity = async (supabase: SupabaseClient, rawData: any, status: 'success' | 'failed') => {
  try {
    const { error } = await supabase.from('bot_logs').insert([{
      raw_data: rawData,
      processed_status: status,
      sync_time: new Date().toISOString()
    }]);
    
    if (error) console.error("Failed to sync bot log:", error.message);
  } catch (e) {
    console.error("Bot Log Exception:", e);
  }
};

/**
 * 全球即時翻譯引擎
 */
export const performQuantumTranslation = async (text: string, targetLang: 'zh' | 'en') => {
  if (!apiKey) return text;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate to ${targetLang === 'zh' ? 'Traditional Chinese (HK)' : 'English'}. Keep Markdown:\n\n${text}`,
    });
    return response.text;
  } catch (error) {
    return text;
  }
};

export const generateLionRockInsight = async (prompt: string) => {
  if (!apiKey) return "System Offline.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are the Lion Rock Assistant. Helpful, friendly. Mix English and Cantonese."
      }
    });
    return response.text || "Connection weak.";
  } catch (error) {
    return "System busy.";
  }
};
