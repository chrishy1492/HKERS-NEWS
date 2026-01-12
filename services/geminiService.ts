
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

  // Strict prompt to ensure REAL news from the last 24 hours
  const prompt = `
    You are a professional news reporter bot for the "HKER News Platform".
    
    TASK:
    Search for a MAJOR, REAL news event that happened in the **LAST 24 HOURS** specifically related to the region "${region}" and topic "${topic}".
    
    CONSTRAINTS:
    1. **MANDATORY**: Use the 'googleSearch' tool. Do NOT invent news. If no news is found, return nothing.
    2. **TIMEFRAME**: The news must be dated within the last 24 hours.
    3. **FORMAT**: Return ONLY a raw JSON object. Do not include markdown formatting like \`\`\`json.
    4. **CONTENT**:
       - 'titleCN': Traditional Chinese (HK style) headline.
       - 'titleEN': English headline.
       - 'contentCN': Traditional Chinese summary (approx 80-120 words). Focus on facts.
       - 'contentEN': English summary (approx 80-120 words).
       - 'sourceUrl': The direct URL to the news source found.
       - 'sourceName': The name of the news outlet (e.g., BBC, SCMP, HK01).

    JSON SCHEMA:
    {
      "titleCN": "string",
      "titleEN": "string",
      "contentCN": "string",
      "contentEN": "string",
      "sourceUrl": "string",
      "sourceName": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Search Grounding
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return null;

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Sometimes models wrap in markdown despite instructions
      const cleanText = text.replace(/```json|```/g, '').trim();
      data = JSON.parse(cleanText);
    }

    // Basic validation
    if (!data.titleCN || !data.sourceUrl) return null;

    return {
      titleCN: data.titleCN,
      titleEN: data.titleEN,
      contentCN: data.contentCN,
      contentEN: data.contentEN,
      sourceUrl: data.sourceUrl,
      sourceName: data.sourceName || "News Source",
      isBot: true,
      timestamp: Date.now(),
      likes: 0,
      loves: 0,
      authorName: 'HKER Bot 🤖',
      authorAvatar: '🤖',
      role: 'bot'
    } as Partial<Post>;

  } catch (error) {
    console.error("Gemini News Generation Error:", error);
    return null;
  }
};
