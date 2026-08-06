import { getAIProviderFromEnv } from "../src/lib/ai/index";

const provider = getAIProviderFromEnv();
console.log('Provider type:', provider.constructor.name);

const start = Date.now();
const result = await provider.extractPainPoints([
  { source: "reddit", url: "https://reddit.com/r/test/1", created_at: "2026-08-01T00:00:00Z", title: 'Test', content: 'Manual data entry is so painful and error-prone and wastes hours every week' }
]);
const ms = Date.now() - start;
console.log(`Latency: ${ms}ms`);
console.log('Pain points extracted:', JSON.stringify(result, null, 2));
