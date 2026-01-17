
import { GoogleGenAI, Type } from "@google/genai";
import { Post } from "../types";

const GEMINI_MODEL = "gemini-3-flash-preview"; 

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Mock News for Failure Scenarios (Quota Exceeded, Network Error, etc.)
const SYSTEM_NEWS = {
  titleCN: "【系統公告】AI 新聞生成服務繁忙",
  titleEN: "System Notice: AI News Service Busy",
  contentCN: "由於目前 AI 系統使用量已達上限或連線不穩定，即時新聞生成暫時受限。系統已自動生成此公告。請稍後再試。此期間您可以瀏覽其他社區帖子。",
  contentEN: "Due to high traffic or network instability, real-time news generation is temporarily limited. This notice was generated automatically. Please try again later.",
  sourceName: "HKER System"
};

export const generateNewsPost = async (region: string, topic: string): Promise<Partial<Post> | null> => {
  // Graceful handling of missing API Key
  if (!process.env.API_KEY) {
    console.error("No API Key available for Gemini.");
    return {
        ...SYSTEM_NEWS,
        contentCN: "系統未檢測到有效的 API Key。請聯繫管理員檢查環境變數配置。",
        contentEN: "No valid API Key detected. Please contact the administrator.",
        sourceUrl: "https://hker.news/system-status",
        isBot: true,
        timestamp: Date.now(),
        likes: 0,
        loves: 0,
        authorName: 'System Bot 🤖',
        authorAvatar: '⚠️',
        id: `sys-no-key-${Date.now()}` // Temporary ID
    };
  }

  // Common Prompt
  const basePrompt = `
    You are a professional news reporter bot for the "HKER News Platform".
    TASK: Generate a news summary related to the region "${region}" and topic "${topic}".
    
    REQUIREMENTS:
    - titleCN: Traditional Chinese (HK style) headline.
    - titleEN: English headline.
    - contentCN: Traditional Chinese summary (80-120 words).
    - contentEN: English summary (80-120 words).
    - sourceName: The name of the news outlet or "HKER Analysis".
  `;

  let data: any = null;
  let sourceUrl = "";

  // --- ATTEMPT 1: Search Grounding (Real-time news) ---
  try {
    const prompt = `${basePrompt}
    Search for a MAJOR, REAL news event that happened recently (last 24-48 hours).
    Verify facts using Google Search.
    Output the result as a valid JSON object.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json", // Enforce JSON even with tools
      },
    });

    if (response.text) {
        try {
            data = JSON.parse(response.text);
        } catch (e) {
            // Try to extract JSON if markdown exists
            const text = response.text;
            const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            if (jsonStr) data = JSON.parse(jsonStr);
        }

        // Extract Source URL from grounding metadata
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            const webChunk = chunks.find((c: any) => c.web?.uri);
            if (webChunk) sourceUrl = webChunk.web.uri;
        }
    }
  } catch (e: any) {
    console.warn("Gemini Primary Attempt Failed:", e.message);
  }

  // --- ATTEMPT 2: Fallback (Creative Generation without Search) ---
  if (!data || !data.titleCN) {
    console.log("Switching to Fallback Model (No Search)...");
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL, // Reuse same model, it's efficient
            contents: `${basePrompt}
            Since search is unavailable, rely on your internal knowledge base to generate a PLAUSIBLE, realistic-sounding news piece fitting these tags.
            Do not make up fake events if possible, generalize real trends.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        titleCN: { type: Type.STRING },
                        titleEN: { type: Type.STRING },
                        contentCN: { type: Type.STRING },
                        contentEN: { type: Type.STRING },
                        sourceName: { type: Type.STRING },
                    },
                    required: ["titleCN", "titleEN", "contentCN", "contentEN", "sourceName"],
                }
            },
        });
        
        if (response.text) {
            data = JSON.parse(response.text);
        }
    } catch (e: any) {
        console.error("Gemini Fallback Failed:", e.message);
        // If Quota Error or other critical failure, use SYSTEM_NEWS
        return {
             ...SYSTEM_NEWS,
             sourceUrl: `https://news.google.com/search?q=${encodeURIComponent(topic)}`,
             isBot: true,
             timestamp: Date.now(),
             likes: 0,
             loves: 0,
             authorName: 'System Bot 🤖',
             authorAvatar: '⚠️',
             id: `sys-error-${Date.now()}`
        };
    }
  }

  // Final Validation
  if (!data || !data.titleCN) {
      return {
          ...SYSTEM_NEWS,
          contentCN: "生成新聞時發生未預期的錯誤，請稍後再試。",
          contentEN: "Unexpected error during news generation. Please try again later.",
          sourceUrl: "https://hker.news",
          isBot: true,
          timestamp: Date.now(),
          likes: 0,
          loves: 0,
          authorName: 'System Bot 🤖',
          authorAvatar: '⚠️',
          id: `sys-fail-${Date.now()}`
      };
  }

  // Fallback URL if grounding failed
  if (!sourceUrl) {
      sourceUrl = "https://news.google.com/search?q=" + encodeURIComponent(data.titleEN || region);
  }

  return {
    titleCN: data.titleCN,
    titleEN: data.titleEN,
    contentCN: data.contentCN,
    contentEN: data.contentEN,
    sourceUrl: sourceUrl,
    sourceName: data.sourceName || "HKER AI",
    isBot: true,
    timestamp: Date.now(),
    likes: 0,
    loves: 0,
    authorName: 'HKER Bot 🤖',
    authorAvatar: '🤖'
  } as Partial<Post>;
};
