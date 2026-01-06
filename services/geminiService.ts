
import { GoogleGenAI } from "@google/genai";
import { StationData, TransportType, Station } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchStationDepartures = async (station: Station): Promise<StationData> => {
  const stationIdentity = station.code ? `${station.name} (${station.code})` : station.name;
  
  const prompt = `
    Provide a list of CURRENT real-time live departures from ${stationIdentity} station.
    Include ALL available services (National Rail, and if applicable, Tube or Trams).
    
    For each departure, identify:
    - Destination
    - Scheduled departure time
    - Platform number
    - Status (e.g., On time, Delayed, Cancelled)
    - Operator (e.g., SWR, Southern, GWR, Thameslink)
    - Type (TRAIN, TUBE, or TRAM)

    Return the data in a clean structured format.
    Focus on departures happening in the next 60-90 minutes.
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
    
    const extractionPrompt = `
      Extract the station departure information from the following text into a valid JSON array.
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
      stationName: station.name,
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
