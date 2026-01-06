
import { GoogleGenAI } from "@google/genai";
import { StationData, TransportType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchWimbledonDepartures = async (): Promise<StationData> => {
  const prompt = `
    Provide a list of CURRENT real-time live departures from Wimbledon Station (WIM).
    Include ALL services: South Western Railway, Thameslink, District Line (Tube), and Tramlink.
    
    For each departure, identify:
    - Destination
    - Scheduled departure time
    - Platform number (e.g., 1-10)
    - Status (e.g., On time, Delayed, Cancelled)
    - Operator (e.g., SWR, TfL)
    - Type (TRAIN, TUBE, or TRAM)

    Return the data in a clean structured format that I can easily parse.
    Focus on departures happening in the next 60 minutes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
      }));

    // We'll ask Gemini to be structured, but we need to parse its response.
    // If it's not strictly JSON, we'll use another pass or a simple heuristic.
    // For this app, let's process the text into a structured object.
    
    const extractionPrompt = `
      Extract the train departure information from the following text into a valid JSON array.
      The JSON should be an array of objects with these keys: 
      "destination" (string), "time" (string, HH:MM), "platform" (string), "status" (string), "operator" (string), "type" (string: "TRAIN", "TUBE", or "TRAM").
      
      Text:
      ${text}
    `;

    const jsonResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: extractionPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const departures = JSON.parse(jsonResponse.text || "[]");

    return {
      lastUpdated: new Date().toLocaleTimeString(),
      departures: departures.map((d: any, index: number) => ({
        ...d,
        id: `dep-${index}-${Date.now()}`,
        type: d.type as TransportType || TransportType.TRAIN
      })),
      sources,
    };
  } catch (error) {
    console.error("Error fetching departures:", error);
    throw error;
  }
};
