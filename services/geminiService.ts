import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AstrologyReport } from "../types";

// Define the response schema matching the Academic Report Structure
const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    clientName: { type: Type.STRING, description: "Name of the client (e.g., Mr. Utkarsh Goyal)" },
    ascendant: { type: Type.STRING, description: "Ascendant (Lagna) sign and Lord (e.g., Aquarius | Lord: Saturn)" },
    moonSign: { type: Type.STRING, description: "Moon Sign (Rashi) and Lord (e.g., Aries | Lord: Mars)" },
    keyObservations: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of 3-4 key astrological observations (e.g., 'Saturn is Debilitated', 'Vish Dosha in 3rd House')." 
    },
    timelineAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Timeline Label (e.g., 'Rahu Mahadasha', 'Career Forecast')" },
          value: { type: Type.STRING, description: "Date range or specific prediction text" }
        }
      },
      description: "Timeline analysis including current Mahadasha, Sade Sati status, and Career Forecast."
    },
    personalityHealth: {
      type: Type.OBJECT,
      properties: {
        temperament: { type: Type.STRING, description: "Temperament analysis (e.g., Control anger due to Rahu)." },
        caution: { type: Type.STRING, description: "Specific cautions (e.g., Potential for addiction)." },
        physical: { type: Type.STRING, description: "Physical health warnings (e.g., Headaches)." },
        advice: { type: Type.STRING, description: "Psychological or behavioral advice." }
      },
      required: ["temperament", "caution", "physical", "advice"]
    },
    structuredRemedies: {
      type: Type.OBJECT,
      properties: {
        gemstones: { type: Type.STRING, description: "Primary and Secondary Gemstone recommendations with metal/finger details." },
        rudraksha: { type: Type.STRING, description: "Specific Rudraksha recommendation." },
        rituals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific rituals/mantras." },
        lifestyle: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of lifestyle changes/donations." }
      },
      required: ["gemstones", "rudraksha", "rituals", "lifestyle"]
    },
    botanicalRemedies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of specific trees/plants to plant (e.g., 'Kadamb', 'Peepal')."
    },
    spiritualPilgrimage: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of recommended temples to visit."
    },
    summaryHighlights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING }
        }
      },
      description: "6 short highlights for visual graph."
    },
    visualThemeDescription: { type: Type.STRING },
    visualSymbolismExplanation: { type: Type.STRING },
  },
  required: [
    "clientName", "ascendant", "moonSign", "keyObservations", 
    "timelineAnalysis", "personalityHealth", "structuredRemedies", 
    "botanicalRemedies", "spiritualPilgrimage", "summaryHighlights",
    "visualThemeDescription", "visualSymbolismExplanation"
  ]
};

export const generateAstrologyReport = async (rawText: string): Promise<AstrologyReport> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemPrompt = `
    Role: Professional Astrological Consultant for 'Kalpvriksha'.
    Task: Convert raw notes into a strictly compartmentalized, academic-style consultation report.
    
    OUTPUT FORMAT REQURIEMENTS:
    1. Structure must match the 'Astrological Consultation Report' standard.
    2. Tone: Formal, precise, academic, authoritative.
    3. No fluff. Use direct statements.
    
    SECTIONS TO POPULATE:
    - CLIENT DETAILS: Extract Name, Lagna, Rashi, and Key Observations (Doshas, Strengths).
    - TIMELINE ANALYSIS: Identify running Mahadasha dates, Sade Sati status, and a specific Career Forecast.
    - PERSONALITY & HEALTH: Break down into Temperament, Caution (Bad habits/risks), Physical (Ailments), Advice (Behavioral).
    - REMEDIAL MEASURES: 
       - Gemstones (Be specific on metal/finger).
       - Rudraksha.
       - Rituals (Mantras/Offerings).
       - Lifestyle (Habits/Donations).
    - BOTANICAL REMEDIES: Trees to plant based on Nakshatra/Planets.
    - SPIRITUAL PILGRIMAGE: Specific temples.
  `;

  let report: AstrologyReport;

  try {
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: rawText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        temperature: 0.3, // Low temperature for academic precision
      },
    });

    if (textResponse.text) {
      report = JSON.parse(textResponse.text) as AstrologyReport;
    } else {
      throw new Error("Empty text response from AI");
    }
  } catch (error) {
    console.error("Gemini Text API Error:", error);
    throw error;
  }

  // We no longer generate an image. We use the static logo in the PDF service.
  return report;
};