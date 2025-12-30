import { GoogleGenAI } from "@google/genai";
import { LedgerService } from "./ledgerService";

export const GeminiService = {
  analyzeLedger: async (userQuery: string): Promise<string> => {
    // Fix: SDK must be initialized exactly as 'new GoogleGenAI({ apiKey: process.env.API_KEY })' per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    // Fetch real-time ledger data for context
    let batches = [];
    try {
      batches = await LedgerService.exportLedger();
    } catch (e) {
      console.error("Ledger export failed:", e);
    }
    
    const ledgerData = JSON.stringify(batches, null, 2);

    const systemInstruction = `
      You are the "E-Ledger Audit AI", a specialist in GS1-compliant supply chain forensics.
      Your role is to analyze the provided ledger data to identify compliance risks, duty evasion, or chain-of-custody breaks.
      
      CONTEXT DATA (Current Blockchain State):
      ${ledgerData}

      GUIDELINES:
      1. Reference specific Batch IDs or GLNs from the data.
      2. If asked about "Duty", look for 'dutyPaid: false' on batches that have moved beyond a manufacturer.
      3. For Pharma, flag batches nearing 'expiryDate'.
      4. Highlight any RECALLED or QUARANTINED statuses as critical alerts.
      5. Keep responses concise, professional, and actionable for regulatory officers.
      6. Use markdown for better readability (bolding, lists).
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: `User Query: ${userQuery}` }] }],
        config: {
          systemInstruction,
          temperature: 0.2, // Low temperature for high audit accuracy
          thinkingConfig: { thinkingBudget: 0 } // Flash model, no thinking budget needed
        },
      });

      return response.text || "I was unable to analyze the data. Please try rephrasing your request.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "An error occurred during blockchain analysis. Please check network connectivity.";
    }
  }
};