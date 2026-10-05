import { ParseResult } from '../intent-rules';

export class GroqProvider {
  name = 'groq';
  private apiKey: string;
  private modelName: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.modelName = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  }

  isConfigured() { return !!this.apiKey; }

  async classify(text: string, lang: string): Promise<ParseResult> {
    if (!this.isConfigured()) throw new Error('Not configured');
    
    const prompt = `Output ONLY valid JSON matching {"intent": "...", "entities": {}}. Valid intents: GET_SALES, GET_PROFIT, PROFIT_DIAGNOSIS, STOP_SELLING, COSTLIEST_SUPPLIER, SELL_MORE, CAN_HIRE, WHO_OWES_ME, EXPIRY_RISK, LOG_CREDIT, RECEIVE_PAYMENT, APPROVE_OFFER, REJECT_OFFER, UNDO, STOP_SPEAKING, UNKNOWN.
Command: "${text}"`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });
    
    if (!res.ok) {
      if (res.status === 429) throw new Error('429');
      throw new Error(`Groq error: ${res.status}`);
    }
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return { intent: parsed.intent, entities: parsed.entities || {}, confidence: 0.85 };
  }

  async phrase(data: object, lang: string, intent: string, template?: string): Promise<string> {
    if (template) return template;
    if (!this.isConfigured()) throw new Error('Not configured');
    
    const prompt = `You are Veda, an AI assistant for a shopkeeper. Phrase a short 1-2 sentence spoken reply based ONLY on this data. Language: ${lang}. Data: ${JSON.stringify(data)}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });
    
    if (!res.ok) throw new Error(`Groq error: ${res.status}`);
    const resData = await res.json();
    return resData.choices[0].message.content.trim();
  }
}
