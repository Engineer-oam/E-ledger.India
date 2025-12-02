import { GoogleGenAI } from "@google/genai";
import { LedgerService } from "./ledgerService";

// Helper to get the AI instance
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const GeminiService = {
  analyzeLedger: async (userQuery: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return "AI services are currently unavailable. Please check your API key.";

    const ledgerData = LedgerService.getAllDataAsJson();

    const systemPrompt = `
      You are an expert Supply Chain AI Analyst for the "E-Ledger" blockchain system.
      Your goal is to assist users (Manufacturers, Distributors, Regulators) by analyzing the current state of the ledger.
      
      Here is the current Ledger Data (JSON):
      ${ledgerData}

      Rules:
      1. Answer the user's question based strictly on the provided JSON data.
      2. If you cite specific batches, mention their BatchID and GTIN.
      3. If asked about compliance or expiry, highlight items with 'expiryDate' close to today (Assume today is late 2024).
      4. Keep answers professional, concise, and helpful.
      5. Do not invent data not present in the JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + "\n\nUser Question: " + userQuery }]
          }
        ]
      });

      return response.text || "I could not generate a response.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I encountered an error analyzing the ledger. Please try again later.";
    }
  }
};