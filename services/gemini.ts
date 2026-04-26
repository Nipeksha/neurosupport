import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SensoryTheme } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to check API key
export const checkApiKey = () => {
  if (!apiKey) {
    console.error("API Key is missing!");
    return false;
  }
  return true;
};

/**
 * Helper to retry requests when 429 (Rate Limit) is encountered.
 * Uses exponential backoff.
 */
async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error.message?.includes('429') || 
                        error.message?.includes('quota') || 
                        error.status === 429;
    
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// --- Dyslexia Module ---

export const analyzeHandwriting = async (base64Image: string): Promise<any> => {
  if (!checkApiKey()) throw new Error("API Key missing");
  
  return withRetry(async () => {
    const model = "gemini-2.5-flash";
    const prompt = `
      Analyze this handwriting sample for potential indicators of dyslexia.
      Look for:
      1. Letter reversals (b/d, p/q).
      2. Irregular spacing between words or letters.
      3. Inconsistent letter sizing or baseline.
      4. Spelling errors phonetic in nature.
      
      Return a JSON object with:
      - probability: number (0-100)
      - observations: array of strings describing issues found.
      - recommendations: array of strings for improvement.
      
      DISCLAIMER: State clearly this is not a medical diagnosis.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            probability: { type: Type.NUMBER },
            observations: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  });
};

export const analyzePracticeAttempt = async (base64Image: string, target: string): Promise<any> => {
    if (!checkApiKey()) throw new Error("API Key missing");

    return withRetry(async () => {
        const prompt = `
          The user is practicing handwriting. They were trying to write the letter or word: "${target}".
          Analyze the image for:
          1. Shape accuracy (did they form the letter correctly?)
          2. Reversals (did they write 'd' instead of 'b'?)
          3. Legibility.

          Return a JSON object with:
          - score: number (0-100)
          - feedback: string (short, encouraging, specific correction if needed like "Watch out for reversing b and d!")
          - issues: array of strings (e.g. ["Reversed letter", "Shaky lines", "Good alignment"])
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                        issues: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        return JSON.parse(response.text || "{}");
    });
};

export const simplifyText = async (text: string): Promise<string> => {
  if (!checkApiKey()) throw new Error("API Key missing");
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rewrite the following text to be more readable for someone with dyslexia. 
      Use simple vocabulary, short sentences, and active voice. 
      Format with bullet points if appropriate for clarity.
      
      Text: "${text}"`
    });
    return response.text || "";
  });
};

export const generateVisualAid = async (word: string): Promise<string> => {
  if (!checkApiKey()) throw new Error("API Key missing");
  return withRetry(async () => {
    // Using gemini-2.5-flash-image for image generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
          parts: [{text: `A simple, clear, illustrative educational illustration of the word: "${word}". White background, high contrast, cartoon style.`}]
      },
    });
    
    // Extract image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    return "";
  });
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<Uint8Array> => {
    if (!checkApiKey()) throw new Error("API Key missing");
    
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName }
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned");

        return base64ToUint8Array(base64Audio);
    });
};

export const playPCM = async (pcmData: Uint8Array, sampleRate: number = 24000): Promise<void> => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext({ sampleRate });
    
    // Create AudioBuffer from raw PCM (16-bit mono)
    const int16Data = new Int16Array(pcmData.buffer);
    const audioBuffer = audioContext.createBuffer(1, int16Data.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Convert Int16 to Float32 [-1.0, 1.0]
    for (let i = 0; i < int16Data.length; i++) {
        channelData[i] = int16Data[i] / 32768.0;
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);

    return new Promise((resolve) => {
        source.onended = () => {
            resolve();
            audioContext.close();
        };
    });
};

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// --- New Dyslexia Assessment Features ---

export const generateReadingPassage = async (difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<string> => {
  if (!checkApiKey()) throw new Error("API Key missing");

  return withRetry(async () => {
    const prompt = `Generate a short reading passage (approx 50-80 words) for a dyslexia reading assessment.
    Difficulty Level: ${difficulty}.
    
    - Easy: Simple sentences, common words (Grade 1-2 level).
    - Medium: Compound sentences, some multisyllabic words (Grade 3-5 level).
    - Hard: Complex sentence structures, advanced vocabulary (Grade 6+ level).
    
    Return ONLY the text of the passage. No titles or extra commentary.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    return response.text?.trim() || "";
  });
}

export const analyzeReadingPerformance = async (originalText: string, transcript: string): Promise<any> => {
   if (!checkApiKey()) throw new Error("API Key missing");

   return withRetry(async () => {
     const prompt = `
       Analyze the user's reading performance by comparing the Original Text with the User's Spoken Transcript.
       
       Original Text: "${originalText}"
       User Transcript: "${transcript}"
       
       Provide a JSON analysis containing:
       - accuracyScore: number (0-100 based on word matches)
       - missedWords: array of strings (words present in original but missing or mispronounced in transcript)
       - fluencyFeedback: string (constructive feedback on their reading flow and accuracy)
       - difficultyAdjustment: "Keep Same" | "Decrease" | "Increase" (suggestion for next text)
     `;

     const response = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: prompt,
       config: {
         responseMimeType: "application/json",
         responseSchema: {
           type: Type.OBJECT,
           properties: {
              accuracyScore: { type: Type.NUMBER },
              missedWords: { type: Type.ARRAY, items: { type: Type.STRING } },
              fluencyFeedback: { type: Type.STRING },
              difficultyAdjustment: { type: Type.STRING }
           }
         }
       }
     });

     return JSON.parse(response.text || "{}");
   });
}


// --- Autism Module ---

export const detectEmotion = async (base64Image: string): Promise<string> => {
  if (!checkApiKey()) throw new Error("API Key missing");
  
  // Note: We don't aggressive retry here because it's a real-time loop, better to skip a frame
  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: "Identify the primary emotion of the person in this image. Return ONLY one word: Happy, Sad, Angry, Confused, Neutral, Anxious, or Overwhelmed." }
          ]
        }
      });
      return response.text?.trim() || "Neutral";
  } catch (error) {
      throw error; // Let the caller handle rate limits for the live loop
  }
};

export const chatWithTherapist = async (history: {role: string, content: string}[], message: string, mood: string): Promise<string> => {
  if (!checkApiKey()) throw new Error("API Key missing");
  
  return withRetry(async () => {
      const systemInstruction = `You are a compassionate, calm, and supportive AI companion for someone with autism. 
      Current user mood detected: ${mood}.
      Adjust your tone to be soothing if they are overwhelmed, or encouraging if they are happy.
      Keep responses concise (1-2 sentences max), clear, and literal (avoid idioms).
      This is a voice conversation, so write in a natural spoken style.
      Provide grounding techniques if they seem anxious.`;

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction },
        history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] }))
      });

      const result = await chat.sendMessage({ message });
      return result.text || "";
  });
};

export const evaluateAssessment = async (answers: { question: string, answer: string, domain: string }[]): Promise<any> => {
  if (!checkApiKey()) throw new Error("API Key missing");

  return withRetry(async () => {
    const prompt = `
      You are an expert screening assistant for autism traits (using frameworks like AQ, RAADS-R, CAST). 
      This is NOT a medical diagnosis. It is a traits profile generator.

      Analyze the following user responses:
      ${JSON.stringify(answers, null, 2)}

      Generate a JSON profile:
      1. 'overallLikelihood': "Low", "Medium", or "High" likelihood of autistic traits.
      2. 'domains': Scoring 0-100 for 'social', 'sensory', 'communication', 'routine', 'cognitive', 'behavioral'.
      3. 'summary': A compassionate, non-clinical summary of their profile (max 2 sentences).
      4. 'recommendations': 3 specific, actionable suggestions for using this app (e.g., "Use Calm Mode", "Play Sorting Game").
      5. 'suggestedTheme': One of "BALANCED", "CALM", "FOCUS", "OVERWHELMED".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallLikelihood: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            domains: {
              type: Type.OBJECT,
              properties: {
                social: { type: Type.NUMBER },
                sensory: { type: Type.NUMBER },
                communication: { type: Type.NUMBER },
                routine: { type: Type.NUMBER },
                cognitive: { type: Type.NUMBER },
                behavioral: { type: Type.NUMBER },
              }
            },
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedTheme: { type: Type.STRING, enum: ["BALANCED", "CALM", "FOCUS", "OVERWHELMED"] }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  });
};
