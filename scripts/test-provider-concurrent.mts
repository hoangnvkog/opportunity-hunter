import { getAIProviderFromEnv } from "../src/lib/ai/index";

const provider = getAIProviderFromEnv();
const posts = [
  { source: "reddit", url: "https://reddit.com/r/test/1", created_at: "2026-08-01T00:00:00Z", title: 'Test 1', content: 'Manual data entry wastes hours' },
  { source: "reddit", url: "https://reddit.com/r/test/2", created_at: "2026-08-01T00:00:00Z", title: 'Test 2', content: 'Spreadsheet hell for SMB accounting' },
  { source: "reddit", url: "https://reddit.com/r/test/3", created_at: "2026-08-01T00:00:00Z", title: 'Test 3', content: 'Customer support backlog is crushing us' },
];

const t0 = Date.now();
const results = await Promise.all(posts.map(p => provider.extractPainPoints([p])));
const ms = Date.now() - t0;
console.log(`3 concurrent calls: ${ms}ms total`);
results.forEach((r, i) => console.log(`  Call ${i + 1}: ${r.length} pain point(s) → ${r[0]?.pain?.slice(0, 60) ?? 'EMPTY'}`));
