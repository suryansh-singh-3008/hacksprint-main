import { GoogleGenAI } from '@google/genai';
import { ParseResult } from '../intent-rules';

export class GeminiProvider {
  name = 'gemini';
  private ai: GoogleGenAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
  }

  isConfigured() {
    return !!process.env.GEMINI_API_KEY;
  }

  async classify(text: string, lang: string): Promise<ParseResult> {
    if (!this.isConfigured()) throw new Error('Not configured');
    
    const prompt = `You are a NLU parser for a shopkeeper assistant. Extract the intent and entities.
Valid intents: GET_SALES, GET_PROFIT, PROFIT_DIAGNOSIS, STOP_SELLING, COSTLIEST_SUPPLIER, SELL_MORE, CAN_HIRE, WHO_OWES_ME, EXPIRY_RISK, LOG_CREDIT, RECEIVE_PAYMENT, APPROVE_OFFER, REJECT_OFFER, UNDO, STOP_SPEAKING, UNKNOWN.
Command: "${text}"
Language: ${lang}
Output ONLY valid JSON: {"intent": "...", "entities": {}}`;

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    if (!response.text) throw new Error('Empty response');
    const data = JSON.parse(response.text);
    return { intent: data.intent, entities: data.entities || {}, confidence: 0.9 };
  }

  async phrase(data: object, lang: string, intent: string, template?: string): Promise<string> {
    if (!this.isConfigured()) throw new Error('Not configured');
    if (template) return template; // fallback to template to save quota
    
    const prompt = `You are Veda, an AI assistant for a shopkeeper. Phrase a short 1-2 sentence spoken reply based ONLY on this data. Do not add numbers not in the data.
Intent: ${intent}
Data: ${JSON.stringify(data)}
Language: ${lang}
Output just the reply text.`;

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
    });
    return response.text || '';
  }
}
