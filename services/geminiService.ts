import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ProcessedContent, UserSettings } from "../types";
import { CRITICAL_KEYWORDS } from "../constants";

// Helper to retrieve API Key from various possible environment configurations
const getApiKey = (): string => {
  // 1. Check specific Vite prefix (Recommended for Vercel + Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  
  // 2. Check specific React App prefix (Create React App legacy)
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_KEY) {
    return process.env.REACT_APP_API_KEY;
  }

  // 3. Check standard process.env (Node/Webpack fallback)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }

  // 4. Fallback to window polyfill (last resort)
  if ((window as any).process && (window as any).process.env && (window as any).process.env.API_KEY) {
    return (window as any).process.env.API_KEY;
  }
  
  return '';
};

// Lazy-load the AI instance. 
// Do NOT initialize at the top level, or the app will crash if the key is missing on startup.
const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("CRITICAL: Google Gemini API Key is missing.");
    console.log("Please check your Vercel Environment Variables. Key name should be: VITE_API_KEY");
    throw new Error("Configuration Error: API Key is missing. Please check settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export const processImage = async (base64Image: string, settings: UserSettings): Promise<ProcessedContent> => {
  // Remove header if present (data:image/jpeg;base64,)
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const model = "gemini-2.5-flash";

  const prompt = `
    Analyze the text in this image. 
    1. Extract the full text.
    2. Simplify the text to make it easier to understand for someone with low vision or cognitive load (5th grade reading level).
    3. Translate the simplified text to ${settings.targetLanguage}.
    4. Determine if this text contains critical safety information (medical instructions, warnings, danger signs).
    
    Return ONLY a JSON object.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING },
            simplifiedText: { type: Type.STRING },
            translatedText: { type: Type.STRING },
            language: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            requiresAudit: { type: Type.BOOLEAN },
          },
          required: ["originalText", "simplifiedText", "translatedText", "requiresAudit"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");

    const data = JSON.parse(text) as ProcessedContent;
    
    // Fallback logic for safety keywords if model misses it
    const isCritical = CRITICAL_KEYWORDS.some(kw => data.originalText.toLowerCase().includes(kw));
    if (isCritical) data.requiresAudit = true;

    return data;

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("Failed to process image. " + (error as Error).message);
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const ai = getAI();
    // gemini-2.5-flash is extremely fast for text-to-text tasks
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: `Translate the following text into ${targetLanguage}. Return ONLY the translated text, no explanations.\n\nText: ${text}` }]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Translation failed");
  }
};

export const generateSpeech = async (text: string, language: string): Promise<AudioBuffer> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, calm voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    // Fix: Cast window to any to access webkitAudioContext for Safari support
    // IMPORTANT: Create a context ONLY for decoding, then close it to avoid hitting browser limits (usually 6)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const decodeContext = new AudioContextClass({sampleRate: 24000});
    
    try {
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        decodeContext,
        24000,
        1
      );
      return audioBuffer;
    } finally {
      // Close the context to free resources
      await decodeContext.close();
    }

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw new Error("Failed to generate speech.");
  }
};

// Helper functions from documentation
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
