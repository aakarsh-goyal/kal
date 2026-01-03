import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AstrologyReport, GeneratedVisuals } from "../types";

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

// Helper to generate a single image
const generateImage = async (ai: GoogleGenAI, prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // High quality model
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.warn(`Failed to generate image for prompt: ${prompt}`, error);
    return null;
  }
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

  // 1. Text Generation Phase
  try {
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: rawText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        temperature: 0.3,
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

  // 2. Image Generation Phase (Parallel)
  const visualPromises: Promise<void>[] = [];
  const visuals: GeneratedVisuals = {};

  // Common Style Guide for Consistency
  const styleGuide = "Style: Minimalist, Flat Vector Art, Esoteric/Spiritual iconography. Colors: Deep Teal (#004d40) and Vibrant Orange (#fb8c00) on White Background. No shading, no gradients, clean lines only.";

  // A. Spiritual Pilgrimage Map
  if (report.spiritualPilgrimage && report.spiritualPilgrimage.length > 0) {
    const prompt = `A minimalist, stylized map of India showing pin locations for: ${report.spiritualPilgrimage.join(", ")}. 
    ${styleGuide} Use simple dots or stars for locations.`;
    
    visualPromises.push(
      generateImage(ai, prompt).then(img => { if (img) visuals.pilgrimageMap = img; })
    );
  }

  // B. Botanical Remedies Illustration
  if (report.botanicalRemedies && report.botanicalRemedies.length > 0) {
    const prompt = `Minimalist line drawing of the following sacred trees/plants: ${report.botanicalRemedies.join(", ")}. 
    ${styleGuide} Artistic, simple, elegant nature composition.`;

    visualPromises.push(
      generateImage(ai, prompt).then(img => { if (img) visuals.botanicalSketch = img; })
    );
  }

  // C. Career Abstract
  const careerItem = report.timelineAnalysis?.find(t => t.label.toLowerCase().includes("career"));
  if (careerItem) {
    const prompt = `A symbolic, minimal astrological icon representing this career forecast: "${careerItem.value}". 
    ${styleGuide} Abstract geometric shapes, professional, upward growth.`;

    visualPromises.push(
      generateImage(ai, prompt).then(img => { if (img) visuals.careerVisual = img; })
    );
  }

  // D. Gemstone Visual (New)
  if (report.structuredRemedies?.gemstones) {
    const prompt = `A minimalist vector icon of the recommended gemstone: ${report.structuredRemedies.gemstones}. 
    ${styleGuide} Focus on the shape of the stone or ring. Simple and elegant.`;
    
    visualPromises.push(
        generateImage(ai, prompt).then(img => { if (img) visuals.gemstoneVisual = img; })
    );
  }

  // E. Personality/Aura Visual (New)
  if (report.personalityHealth?.temperament) {
    const prompt = `Abstract minimalist circle representation of this temperament: ${report.personalityHealth.temperament}. 
    ${styleGuide} Use circular patterns or aura lines.`;
    
    visualPromises.push(
        generateImage(ai, prompt).then(img => { if (img) visuals.personalityVisual = img; })
    );
  }

  // F. Planetary Alignment (New - based on observations)
  if (report.keyObservations && report.keyObservations.length > 0) {
      const prompt = `Minimalist astrological chart symbols representing: ${report.keyObservations[0]}. 
      ${styleGuide} Use planet symbols (Saturn, Mars, etc.) in a geometric arrangement.`;
      
      visualPromises.push(
          generateImage(ai, prompt).then(img => { if (img) visuals.planetaryVisual = img; })
      );
  }

  // Wait for all images to generate (or fail silently)
  try {
    await Promise.all(visualPromises);
    report.generatedVisuals = visuals;
  } catch (e) {
    console.error("Error generating visuals:", e);
    // We do not fail the whole report if images fail
  }

  return report;
};