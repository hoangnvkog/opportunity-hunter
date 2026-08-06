import { getAIProviderFromEnv } from "../src/lib/ai/index";

const provider = getAIProviderFromEnv();
if (!provider) {
  throw new Error("AI provider is not available");
}

// Test 1: embeddings (NVIDIA model)
const t0 = Date.now();
const embeddings = await provider.generateEmbeddings?.([
  "Manual data entry is painful",
  "Time waste on spreadsheets",
  "Cats love to sleep in the sun"
]) ?? [];
const embedMs = Date.now() - t0;
console.log(`Embeddings: ${embedMs}ms, dim=${embeddings[0]?.length}, count=${embeddings.length}`);
const cosine = (a: number[], b: number[]) => {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (magA * magB);
};
console.log(`Cosine[0↔1] (related): ${cosine(embeddings[0], embeddings[1]).toFixed(4)}`);
console.log(`Cosine[0↔2] (unrelated): ${cosine(embeddings[0], embeddings[2]).toFixed(4)}`);

// Test 2: opportunity scoring (LLM)
const t1 = Date.now();
const oppResult = await provider.generateOpportunities?.([
  { cluster_name: "Quản lý dữ liệu thủ công", description: "Doanh nghiệp nhỏ nhập liệu bằng tay, dễ sai", pain_point_indexes: [0] }
]) ?? [];
const oppMs = Date.now() - t1;
console.log(`\nOpportunity scoring: ${oppMs}ms`);
console.log(JSON.stringify(oppResult, null, 2));
