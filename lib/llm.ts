import { parseIntent, ParseResult } from './intent-rules';
import { GeminiProvider } from './providers/gemini';
import { GroqProvider } from './providers/groq';
import { OpenRouterProvider } from './providers/openrouter';

export interface LLMProvider {
  name: string;
  isConfigured(): boolean;
  classify(text: string, lang: string): Promise<ParseResult>;
  phrase(data: object, lang: string, intent: string, template?: string): Promise<string>;
}

const providers: LLMProvider[] = [
  new GeminiProvider(),
  new GroqProvider(),
  new OpenRouterProvider()
];

const cooldowns = new Map<string, number>();

export async function classifyCommand(text: string, lang: string): Promise<{ result: ParseResult; provider: string }> {
  // 1. Rule-based parsing first (Offline / Fast)
  const ruleResult = parseIntent(text, lang);
  if (ruleResult.confidence >= 0.9) {
    return { result: ruleResult, provider: 'rule' };
  }

  // 2. Try LLM Provider Chain
  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    if ((cooldowns.get(provider.name) || 0) > Date.now()) continue;

    try {
      const res = await provider.classify(text, lang);
      // Validate result format loosely
      if (res.intent) return { result: res, provider: provider.name };
    } catch (e: any) {
      if (e.message?.includes('429')) {
        cooldowns.set(provider.name, Date.now() + 60 * 1000); // 60s cooldown
      }
      console.warn(`Provider ${provider.name} failed:`, e);
    }
  }

  // 3. Fallback to rule result even if low confidence
  return { result: ruleResult, provider: 'rule_fallback' };
}

export async function phraseReply(data: object, lang: string, intent: string, template?: string): Promise<{ text: string, provider: string }> {
  if (template) return { text: template, provider: 'template' };

  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    if ((cooldowns.get(provider.name) || 0) > Date.now()) continue;

    try {
      const text = await provider.phrase(data, lang, intent);
      if (text) return { text, provider: provider.name };
    } catch (e: any) {
      if (e.message?.includes('429')) {
        cooldowns.set(provider.name, Date.now() + 60 * 1000); // 60s cooldown
      }
    }
  }

  return { text: "I've calculated the answer, it's on the screen.", provider: 'fallback' };
}
