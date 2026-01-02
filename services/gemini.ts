
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 專業工程師版：自動化新聞獵頭引擎 (v5.0 Copyright-Safe Edition)
 * 修復重點：
 * 1. 嚴格的「題文一致性」檢查。
 * 2. 加入「版權規避」指令，強制 AI 進行改寫 (Paraphrasing) 而非複製。
 * 3. 優化 Regex 清洗邏輯。
 */
export const scoutAutomatedNews = async (region: string, topic: string) => {
  try {
    const isZH = region === "中國香港" || region === "台灣";
    const langInstruction = isZH 
      ? "Traditional Chinese (Hong Kong Cantonese style, use terms like '據報', '消息指', '最新顯示')" 
      : "English (Journalistic style)";

    // 構建更嚴謹的 Prompt，強制 AI 扮演編輯而非搬運工
    const prompt = `
    ROLE: Professional News Editor & Copyright Compliance Officer.
    TASK: Search for ONE specific, latest news event about "${topic}" in "${region}".
    
    STRICT EXECUTION STEPS:
    1. SEARCH: Find the most relevant recent news article.
    2. READ: Analyze the core facts.
    3. REWRITE (Crucial): Completely rephrase the content in your own words to avoid copyright infringement. Do NOT copy-paste sentences.
    4. CONSISTENCY CHECK: Ensure the Title and Summary Points are about the EXACT SAME event.

    OUTPUT REQUIREMENTS (JSON ONLY):
    {
      "title": "A short, punchy headline highlighting the main point (Max 20 words).",
      "summary_points": "A concise summary of the event in 3-4 bullet points or a short paragraph. Focus ONLY on key facts (Who, What, When, Why). Max 100 words.",
      "source_name": "Name of the news outlet",
      "source_url": "Direct link to the article"
    }

    LANGUAGE: ${langInstruction}
    FORMAT: Raw JSON object. No Markdown. No code blocks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a JSON-only bot. You synthesize news into original summaries. You never copy text directly.",
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "{}";
    
    // CRITICAL FIX: Extract JSON object using Regex to handle potential conversational wrappers
    // 尋找最外層的 { }，確保抓取的是完整的 JSON 對象
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    } else {
      // Fallback cleanup
      text = text.replace(/```json|```/g, '').trim();
    }

    const data = JSON.parse(text);
    
    // 二次驗證數據完整性
    if (!data.title || !data.summary_points || !data.source_url) {
        throw new Error("Incomplete data from AI");
    }
    
    // 簡單的後期處理：確保標題不包含 "標題：" 或 "Title:" 等前綴
    data.title = data.title.replace(/^(標題|Title)[:：]\s*/i, '');

    return {
      ...data,
      lang: isZH ? 'zh' : 'en' as 'zh' | 'en'
    };
  } catch (error) {
    console.error("Automated Scout Error:", error);
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
