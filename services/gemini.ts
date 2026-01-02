
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 專業工程師版：自動化新聞獵頭引擎 (v7.0 Copyright Safe Edition)
 * 
 * 功能升級：
 * 1. 結構化內容 (Structured Layout): 強制分為「重點速讀」與「深度報導」。
 * 2. 版權規避 (Copyright Evasion): 強制語義重組 (Paraphrasing)，禁止直接引用，使用不同詞彙重寫。
 * 3. 內容增量 (Content Expansion): 篇幅增加 200%，提供更有價值的資訊。
 */
export const scoutAutomatedNews = async (region: string, topic: string) => {
  try {
    const isZH = region === "中國香港" || region === "台灣";
    const langInstruction = isZH 
      ? "Traditional Chinese (Hong Kong Cantonese professional yet engaging style). Use local terminology." 
      : "English (Professional journalistic blog style).";

    // Advanced Prompt Engineering for Copyright Safety & Structure
    const prompt = `
    ROLE: You are a Senior Editor for HKER Nexus. 
    TASK: Find a trending news event about "${topic}" in "${region}".
    
    CRITICAL COPYRIGHT RULES (MUST FOLLOW):
    1. NO PLAGIARISM: Do NOT copy-paste sentences from the source. 
    2. REWRITE COMPLETELY: You must digest the facts and REWRITE them using your own vocabulary, sentence structure, and tone.
    3. SYNTHESIZE: Combine facts to create a unique perspective.

    CONTENT STRUCTURE REQUIREMENTS:
    1. **Key Highlights (重點速讀)**: 3-4 bullet points summarizing the most critical facts.
    2. **Detailed Insight (深度報導)**: A detailed body paragraph (at least 200-300 words). Explain the context, why it matters, and potential impact. Do not be brief.

    OUTPUT FORMAT (JSON ONLY):
    {
      "title": "A catchy, rewritten headline (Max 30 chars)",
      "summary_points": "The full content string combining Highlights and Body. Use Markdown formatting (e.g., ### 💡 重點速讀\\n- Point 1...\\n\\n### 📝 深度報導\\n[Detailed rewritten article content here...])",
      "source_name": "Source Outlet Name",
      "source_url": "Source URL"
    }

    LANGUAGE: ${langInstruction}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgraded to Pro model for better writing capability
      contents: prompt,
      config: {
        systemInstruction: "You are a JSON-only API. You are a creative writer who avoids copyright infringement by rewriting content entirely.",
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "{}";
    
    // JSON Sanitation
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn("AI Scout JSON Parse Error, retrying raw text cleanup...", e);
      return null;
    }
    
    // Data Integrity Check
    if (!data.title || !data.summary_points || !data.source_url) {
        console.warn("AI Scout: Incomplete data structure received.");
        return null;
    }
    
    return {
      ...data,
      lang: isZH ? 'zh' : 'en' as 'zh' | 'en'
    };
  } catch (error) {
    console.error("AI Scout System Error:", error);
    return null;
  }
};

/**
 * 全球即時翻譯引擎 (Quantum Translation)
 */
export const performQuantumTranslation = async (text: string, targetLang: 'zh' | 'en') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following text to ${targetLang === 'zh' ? 'Traditional Chinese (HK style)' : 'English'}. Maintain the original markdown formatting and structure.\n\nText:\n${text}`,
    });
    return response.text;
  } catch (error) {
    console.error("Translation Error:", error);
    return null;
  }
};

export const generateLionRockInsight = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are the Lion Rock Assistant. Helpful, friendly, embodying the 'Lion Rock Spirit'. Mix English and Cantonese."
      }
    });
    return response.text || "Connection weak. Try again.";
  } catch (error) {
    return "System busy.";
  }
};
