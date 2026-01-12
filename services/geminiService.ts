
import { GoogleGenAI } from "@google/genai";
import { Post } from "../types";

const GEMINI_MODEL = "gemini-2.5-flash"; // Using Flash for speed and search capability

// Initialize Gemini Client
// In a real production app, API calls should go through a backend to hide the key.
// However, per requirements, we use the provided structure.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateNewsPost = async (region: string, topic: string): Promise<Partial<Post> | null> => {
  if (!process.env.API_KEY) {
    console.error("No API Key available for Gemini.");
    return null;
  }

  // Prompt logic
  // Note: We ask for JSON format in text, as we cannot enforce MIME type with tools.
  const prompt = `
    You are a professional news reporter bot for the "HKER News Platform".
    
    TASK:
    Search for a MAJOR, REAL news event that happened recently (preferably last 24-48 hours) specifically related to the region "${region}" and topic "${topic}".
    
    CONSTRAINTS:
    1. **MANDATORY**: Use the 'googleSearch' tool to verify facts. Do NOT invent news. If absolutely no news is found, try a broader topic for the region.
    2. **FORMAT**: Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
    3. **CONTENT**:
       - 'titleCN': Traditional Chinese (HK style) headline.
       - 'titleEN': English headline.
       - 'contentCN': Traditional Chinese summary (approx 80-120 words). Focus on facts.
       - 'contentEN': English summary (approx 80-120 words).
       - 'sourceName': The name of the news outlet (e.g., BBC, SCMP, HK01).

    JSON SCHEMA:
    {
      "titleCN": "string",
      "titleEN": "string",
      "contentCN": "string",
      "contentEN": "string",
      "sourceName": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Search Grounding
      },
    });

    const text = response.text;
    
    if (!text) {
        console.warn("Gemini returned empty text. Candidates:", JSON.stringify(response.candidates));
        // Check if there are search results but no text generation (rare but possible)
        return null;
    }

    let data;
    try {
      // Robust JSON extraction to handle potential Markdown blocks
      let jsonString = text.trim();
      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
      
      // Find the first '{' and last '}' to extract the JSON object cleanly
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }
      
      data = JSON.parse(jsonString);
    } catch (e) {
      console.warn("Gemini JSON Parse Error. Raw Text:", text);
      return null;
    }

    // Basic validation
    if (!data.titleCN) return null;

    // Extract Source URL from Grounding Metadata (Best practice for Google Search Tool)
    let sourceUrl = "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        // Find the first web URI provided by grounding
        const webChunk = chunks.find((c: any) => c.web?.uri);
        if (webChunk) {
            sourceUrl = webChunk.web.uri;
        }
    }

    // Fallback if grounding metadata didn't provide a URL (rare with googleSearch)
    if (!sourceUrl) sourceUrl = "https://news.google.com";

    return {
      titleCN: data.titleCN,
      titleEN: data.titleEN,
      contentCN: data.contentCN,
      contentEN: data.contentEN,
      sourceUrl: sourceUrl,
      sourceName: data.sourceName || "News Source",
      isBot: true,
      timestamp: Date.now(),
      likes: 0,
      loves: 0,
      authorName: 'HKER Bot 🤖',
      authorAvatar: '🤖'
    } as Partial<Post>;

  } catch (error) {
    console.error("Gemini News Generation Error:", error);
    return null;
  }
};
