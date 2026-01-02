
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 專業工程師版：自動化新聞獵頭引擎 (v4.5)
 * 嚴格遵守：
 * 1. 標題僅限「文章重點」 (Highlight Only)
 * 2. 內容為「選擇性簡單重點文」 (Selective Key Points)
 * 3. 嚴格禁止全文複製，必須進行 AI 二次改寫以避免侵權
 * 4. 確保標題與內容出自同一新聞源
 */
export const scoutAutomatedNews = async (region: string, topic: string) => {
  try {
    const isZH = region === "中國香港" || region === "台灣";
    
    // 構建更嚴謹的 Prompt
    const prompt = `Action: Search for the ONE most significant current news about ${topic} in ${region}.
    
    Strict Operating Rules:
    1. Title: Create a high-level highlight (文章重點). Maximum 12 words.
    2. Content: Provide 2-3 rephrased, selective key points (選擇性簡單重點文). 
    3. Copyright Policy: DO NOT copy sentences from the source. Re-write everything in your own words.
    4. Consistency: The Title and Content MUST be derived from the SAME news article.
    5. Language: Use ${isZH ? 'Traditional Chinese (Hong Kong style/Cantonese phrasing)' : 'Professional English'}.
    6. Source: You must provide the exact site name and direct URL.

    Output format (Strict JSON):
    {
      "title": "Concise Highlight Title",
      "summary_points": "• Point 1 (Rephrased)\n• Point 2 (Rephrased)",
      "source_name": "Source Website Name",
      "source_url": "https://..."
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are the HKER Nexus News Scout. You are an expert at summarizing news while respecting copyright. You never copy-paste full articles. You extract only facts and rephrase them into concise community updates.",
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    return {
      ...data,
      lang: isZH ? 'zh' : 'en' as 'zh' | 'en'
    };
  } catch (error) {
    console.error("Automated Scout v4.5 Error:", error);
    return null;
  }
};

/**
 * 全球即時翻譯引擎
 */
export const performQuantumTranslation = async (text: string, targetLang: 'zh' | 'en') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following to ${targetLang === 'zh' ? 'Traditional Chinese (Hong Kong style)' : 'English'}. Keep it concise and natural:\n\n${text}`,
    });
    return response.text;
  } catch (error) {
    console.error("Translation Engine Error:", error);
    return null;
  }
};

export const generateLionRockInsight = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are the Lion Rock Assistant. You provide helpful advice on migration, Hong Kong culture, and community info. You are friendly, encouraging, and embody the 'Lion Rock Spirit' (perseverance, solidarity, and flexibility). You should use a mix of English and Traditional Chinese (Hong Kong style) where appropriate."
      }
    });
    return response.text || "Sorry, I'm having trouble processing that right now.";
  } catch (error) {
    console.error("Lion Rock Insight Error:", error);
    return "The Lion Rock spirit is strong, but my connection is weak. Please try again later.";
  }
};
