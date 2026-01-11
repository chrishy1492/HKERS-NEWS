import { GoogleGenAI } from "@google/genai";
import { Post } from "../types";

const GEMINI_MODEL = "gemini-3-flash-preview";

// Initialize Gemini Client
// Note: In a real production app, API calls should go through a backend to hide the key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateNewsPost = async (region: string, topic: string): Promise<Partial<Post> | null> => {
  if (!process.env.API_KEY) {
    console.error("No API Key available for Gemini.");
    return null;
  }

  const prompt = `
    Act as a professional news reporter bot for the "HKER News Platform".
    Task: Search for a REAL, IMPORTANT news event from the LAST 24 HOURS related to "${region}" (Region) and "${topic}" (Topic).
    
    Requirements:
    1. STRICTLY use the 'googleSearch' tool to find real-time information.
    2. The news MUST be from the last 24 hours. Verify the date.
    3. Return the result in a STRICT JSON format. Do not add markdown code blocks.
    4. Provide a Traditional Chinese (HK) version and an English version.
    5. Title should be catchy. Content should be a concise summary (approx 80-100 words).
    6. Include the source URL found from the search.
    
    JSON Schema:
    {
      "titleCN": "string",
      "titleEN": "string",
      "contentCN": "string",
      "contentEN": "string",
      "sourceUrl": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    return {
      titleCN: data.titleCN,
      titleEN: data.titleEN,
      contentCN: data.contentCN,
      contentEN: data.contentEN,
      sourceUrl: data.sourceUrl,
      isBot: true,
      timestamp: Date.now(),
      likes: 0,
      loves: 0
    };

  } catch (error) {
    console.error("Gemini News Generation Error:", error);
    return null;
  }
};