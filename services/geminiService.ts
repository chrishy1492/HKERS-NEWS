import { GoogleGenAI, Type } from "@google/genai";
import { NewsGenerationResult } from "../types";

// Ensure API key is available
if (!process.env.API_KEY) {
  console.error("Missing process.env.API_KEY. Bot features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// 1. Original Search Mode (Fallback)
export const generateNewsPost = async (region: string, topic: string): Promise<NewsGenerationResult | null> => {
  try {
    const isChineseRegion = ['Hong Kong', 'Taiwan', 'China'].includes(region);
    const langInstruction = isChineseRegion ? "Focus on Traditional Chinese sources." : "Focus on English sources.";

    const prompt = `
      Search for ONE latest breaking news (past 24 hours) in ${region} regarding ${topic}.
      ${langInstruction}
      Summary Rule: DO NOT COPY. Rewrite in your own words.
      Output JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title_en: { type: Type.STRING },
            title_cn: { type: Type.STRING },
            content_en: { type: Type.STRING },
            content_cn: { type: Type.STRING },
            source_url: { type: Type.STRING },
            language: { type: Type.STRING }
          },
          required: ["title_en", "title_cn", "content_en", "content_cn", "source_url", "language"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as NewsGenerationResult;
    }
    return null;

  } catch (error) {
    console.error("Gemini Search Generation Error:", error);
    return null;
  }
};

// 2. New Source Processing Mode (For NewsAPI/RSS items)
export const generateFromSource = async (title: string, url: string, region: string): Promise<NewsGenerationResult | null> => {
  try {
    const prompt = `
      You are a professional news editor bot.
      I will provide a news headline and URL.
      Your task:
      1. Visit the URL (or search for this specific news) to understand the content.
      2. Summarize the key points in YOUR OWN WORDS (Copyright Safety). 100-150 words.
      3. Provide the summary in both English and Traditional Chinese.
      4. If the region is Hong Kong/Taiwan, prioritize Chinese context.
      
      Headline: ${title}
      URL: ${url}
      Region: ${region}

      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Use search to verify/read content if URL scraping is restricted
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title_en: { type: Type.STRING },
            title_cn: { type: Type.STRING },
            content_en: { type: Type.STRING },
            content_cn: { type: Type.STRING },
            source_url: { type: Type.STRING },
            language: { type: Type.STRING }
          },
          required: ["title_en", "title_cn", "content_en", "content_cn", "source_url"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Ensure source_url is the original one provided if AI hallucinates a google search link
      data.source_url = url; 
      return data as NewsGenerationResult;
    }
    return null;

  } catch (error) {
    console.error("Gemini Source Processing Error:", error);
    return null;
  }
};

export const translateText = async (text: string, targetLang: 'en' | 'zh'): Promise<string | null> => {
  try {
    const prompt = `Translate the following text to ${targetLang === 'en' ? 'English' : 'Traditional Chinese'}. Keep the tone professional.\n\nText: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || null;
  } catch (error) {
    console.error("Translation Error:", error);
    return null;
  }
};