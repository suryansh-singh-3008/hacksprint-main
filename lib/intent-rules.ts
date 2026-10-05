export interface ParseResult {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
}

const RULES = [
  // --- English ---
  { pattern: /sales?\s+(today|aaj|yesterday|this week|this month)/i, intent: 'GET_SALES' },
  { pattern: /what\s+are\s+today'?s?\s+sales/i, intent: 'GET_SALES', defaultEntities: { period: 'today' } },
  { pattern: /profit\s+(today|yesterday|this\s+week|this\s+month)/i, intent: 'GET_PROFIT' },
  { pattern: /why.*(profit|loss)/i, intent: 'PROFIT_DIAGNOSIS', defaultEntities: { period: 'month' } },
  { pattern: /which.*(stop|avoid|not.+sell)/i, intent: 'STOP_SELLING' },
  { pattern: /costli.*supplier|supplier.*cost/i, intent: 'COSTLIEST_SUPPLIER' },
  { pattern: /sell\s+more|fast.+moving/i, intent: 'SELL_MORE' },
  { pattern: /hire|employee|staff/i, intent: 'CAN_HIRE' },
  { pattern: /who.*owe|udhaar.*list|udhaari/i, intent: 'WHO_OWES_ME' },
  { pattern: /expir|khatam|expire/i, intent: 'EXPIRY_RISK' },
  
  // --- Hindi / Hinglish ---
  { pattern: /aaj.*(bikri|sale|sales)/i, intent: 'GET_SALES', defaultEntities: { period: 'today' } },
  { pattern: /kitna.*(fayda|munafa)/i, intent: 'GET_PROFIT', defaultEntities: { period: 'today' } },
  { pattern: /munafa.*gira/i, intent: 'PROFIT_DIAGNOSIS', defaultEntities: { period: 'month' } },
  { pattern: /(udhaar.*liya|ne.*udhaar)/i, intent: 'LOG_CREDIT' }, // "Ramesh ne 200 ka udhaar liya"
  { pattern: /(?:ne\s+)?(?:diya|paid|payment)/i, intent: 'RECEIVE_PAYMENT' }, // "Ramesh ne 500 diya"
  { pattern: /haan.*kar\s*do|approve/i, intent: 'APPROVE_OFFER' },
  { pattern: /nahi|reject|mat\s+karo/i, intent: 'REJECT_OFFER' },
  { pattern: /\bundo\b|wapas/i, intent: 'UNDO' },
  { pattern: /\bstop\b|ruko/i, intent: 'STOP_SPEAKING' },
  
  // --- Kannada ---
  { pattern: /ಮಾರಾಟ|vikri/i, intent: 'GET_SALES', defaultEntities: { period: 'today' } },
  { pattern: /ಲಾಭ|laabha/i, intent: 'GET_PROFIT', defaultEntities: { period: 'today' } },
];

function extractPeriod(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('yesterday') || t.includes('kal')) return 'yesterday';
  if (t.includes('week') || t.includes('hafta')) return 'week';
  if (t.includes('month') || t.includes('mahina')) return 'month';
  return 'today';
}

function extractAmount(text: string): number | null {
  const match = text.match(/(?:₹|rs\.?|rupees?)?\s*(\d+)/i) || text.match(/(\d+)\s*(?:₹|rs\.?|rupees?|ka)/i);
  if (match && match[1]) return parseInt(match[1], 10) * 100; // to paise
  return null;
}

function extractCustomerName(text: string): string | null {
  // basic heuristic: word before 'ne'
  const neMatch = text.match(/([a-z]+)\s+ne\s+/i);
  if (neMatch) return neMatch[1];
  return null; // Let LLM handle complex cases
}

export function parseIntent(text: string, lang?: string): ParseResult {
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      const entities: Record<string, any> = { ...rule.defaultEntities };
      
      if (rule.intent === 'GET_SALES' || rule.intent === 'GET_PROFIT' || rule.intent === 'PROFIT_DIAGNOSIS') {
        if (!entities.period) entities.period = extractPeriod(text);
      }
      
      if (rule.intent === 'LOG_CREDIT' || rule.intent === 'RECEIVE_PAYMENT') {
        const amt = extractAmount(text);
        if (amt) entities.amount = amt;
        const cust = extractCustomerName(text);
        if (cust) entities.customer = cust;
        // If we can't parse amount/customer cleanly via regex, we reduce confidence so LLM takes over
        if (!amt || !cust) return { intent: rule.intent, entities, confidence: 0.5 };
      }
      
      return { intent: rule.intent, entities, confidence: 0.95 };
    }
  }
  
  return { intent: 'UNKNOWN', entities: {}, confidence: 0 };
}
