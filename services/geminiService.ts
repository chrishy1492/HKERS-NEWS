
import { GoogleGenAI } from "@google/genai";
import { Post } from "../types";

const GEMINI_MODEL = "gemini-3-flash-preview"; 
const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash"; // Use older model for backup

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Mock News for Extreme Failure Scenarios (429 on all models)
const SYSTEM_NEWS = {
  titleCN: "【系統公告】AI 新聞生成服務繁忙",
  titleEN: "System Notice: AI News Service Busy",
  contentCN: "由於目前 AI 系統使用量已達上限，即時新聞生成暫時受限。我們將盡快恢復服務。請稍後再試。此期間您可以瀏覽其他社區帖子。",
  contentEN: "Due to high traffic on our AI services, real-time news generation is temporarily limited. We are working to restore service. Please browse other community posts in the meantime.",
  sourceName: "System Admin"
};

export const generateNewsPost = async (region: string, topic: string): Promise<Partial<Post> | null> => {
  if (!process.env.API_KEY) {
    console.error("No API Key available for Gemini.");
    return null;
  }

  // Common Prompt Builder
  const buildPrompt = (useSearch: boolean) => `
    You are a professional news reporter bot for the "HKER News Platform".
    
    TASK:
    Generate a news summary related to the region "${region}" and topic "${topic}".
    ${useSearch ? 'Search for a MAJOR, REAL news event that happened recently (last 24-48 hours).' : 'Since search is unavailable, rely on your internal knowledge base to generate a plausible, recent-sounding news piece fitting these tags. Make it realistic.'}
    
    CONSTRAINTS:
    1. ${useSearch ? "Use 'googleSearch' to verify facts." : "Be creative but plausible."}
    2. **FORMAT**: Return ONLY a valid JSON object. No markdown formatting.
    3. **CONTENT**:
       - 'titleCN': Traditional Chinese (HK style) headline.
       - 'titleEN': English headline.
       - 'contentCN': Traditional Chinese summary (approx 80-120 words). Focus on facts.
       - 'contentEN': English summary (approx 80-120 words).
       - 'sourceName': ${useSearch ? "The name of the news outlet found." : "Put 'HKER Analysis'."}

    JSON SCHEMA:
    {
      "titleCN": "string",
      "titleEN": "string",
      "contentCN": "string",
      "contentEN": "string",
      "sourceName": "string"
    }
  `;

  let text = "";
  let sourceUrl = "";
  let usedFallback = false;

  try {
    // ATTEMPT 1: Try with Search Grounding (Primary Model)
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(true),
      config: {
        tools: [{ googleSearch: {} }], 
      },
    });
    
    if (response.text) {
        text = response.text;
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            const webChunk = chunks.find((c: any) => c.web?.uri);
            if (webChunk) sourceUrl = webChunk.web.uri;
        }
    }
    
  } catch (e: any) {
    const errorMsg = e.toString().toLowerCase();
    
    // ATTEMPT 2: Fallback to Secondary Model without Tools (If 429 or Error)
    console.warn(`Gemini Primary Attempt Failed (${errorMsg}). Switching to Fallback...`);
    usedFallback = true;
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_FALLBACK_MODEL, // Switch model to avoid shared quota issues if possible
            contents: buildPrompt(false),
            config: {}, // No tools
        });
        text = response.text || "";
    } catch (retryError: any) {
        console.error("Gemini Fallback Failed:", retryError);
        
        // Robust 429 Check
        const errStr = JSON.stringify(retryError);
        const isQuotaError = 
            retryError.status === 429 || 
            (retryError.error && retryError.error.code === 429) || 
            errStr.includes('429') || 
            errStr.includes('RESOURCE_EXHAUSTED') ||
            retryError.message?.includes('429');

        // ATTEMPT 3: ULTIMATE FALLBACK (Return Mock Data if Quota Exhausted)
        if (isQuotaError) {
           console.warn("Quota Exhausted on Fallback. Returning System News.");
           return {
             ...SYSTEM_NEWS,
             // Fix 23505: Append timestamp to make URL unique per generated notice
             sourceUrl: `https://news.google.com/system-status?t=${Date.now()}`,
             isBot: true,
             timestamp: Date.now(),
             likes: 0,
             loves: 0,
             authorName: 'System Bot 🤖',
             authorAvatar: '⚠️'
           };
        }
        return null;
    }
  }

  if (!text) return null;

  let data;
  try {
    let jsonString = text.trim();
    jsonString = jsonString.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
    
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
    
    data = JSON.parse(jsonString);
  } catch (e) {
    console.warn("Gemini JSON Parse Error. Raw Text:", text);
    // If we have text but it's not JSON, we might just return null or try to salvage?
    // Returning null is safer to avoid bad UI.
    return null;
  }

  if (!data.titleCN) return null;

  // Fallback URL
  if (!sourceUrl) sourceUrl = "https://news.google.com/search?q=" + encodeURIComponent(data.titleEN || region);

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
