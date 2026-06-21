import { PainPointsRepository } from "@/lib/db/repositories/pain-points.repository";
import { EmbeddingsRepository } from "@/lib/db/repositories/embeddings.repository";
import { getAIProviderFromEnv } from "@/lib/ai/base.provider";

/**
 * Generate embeddings for pain points using OpenAI embeddings API
 * Batch processing with chunks of 100 to optimize API calls
 */
export async function generateEmbeddingsFromDatabase(limit: number = 1000): Promise<{
  processed: number;
  skipped: number;
  inserted: number;
}> {
  const painPointsRepo = await PainPointsRepository.create();
  const embeddingsRepo = await EmbeddingsRepository.create();
  const provider = getAIProviderFromEnv();

  // Check if provider supports embeddings
  if (!provider.generateEmbeddings) {
    console.warn("Current AI provider does not support embeddings generation");
    return { processed: 0, skipped: 0, inserted: 0 };
  }

  // Fetch pain points that don't have embeddings yet
  const allPainPoints = await painPointsRepo.list({ limit });
  
  const painPointsWithoutEmbeddings = [];
  for (const painPoint of allPainPoints) {
    const exists = await embeddingsRepo.existsByPainPointId(painPoint.id);
    if (!exists) {
      painPointsWithoutEmbeddings.push(painPoint);
    }
  }

  if (painPointsWithoutEmbeddings.length === 0) {
    return { processed: 0, skipped: allPainPoints.length, inserted: 0 };
  }

  // Batch processing: process in chunks of 100
  const batchSize = 100;
  let totalProcessed = 0;
  let totalInserted = 0;
  const skipped = allPainPoints.length - painPointsWithoutEmbeddings.length;

  for (let i = 0; i < painPointsWithoutEmbeddings.length; i += batchSize) {
    const batch = painPointsWithoutEmbeddings.slice(i, i + batchSize);
    
    try {
      // Prepare texts for embedding
      const texts = batch.map(pp => 
        `${pp.description} (Category: ${pp.category}, Severity: ${pp.severity}, Buying Intent: ${pp.buying_intent})`
      );

      // Generate embeddings in batch
      const embeddings = await provider.generateEmbeddings(texts);

      if (embeddings.length !== batch.length) {
        console.error(`Embeddings count mismatch: expected ${batch.length}, got ${embeddings.length}`);
        continue;
      }

      // Prepare insert data
      const insertData = batch.map((painPoint, index) => ({
        pain_point_id: painPoint.id,
        embedding: embeddings[index],
      }));

      // Insert embeddings
      await embeddingsRepo.createMany(insertData);
      totalInserted += insertData.length;
      totalProcessed += batch.length;

      console.log(`Generated embeddings for batch ${Math.floor(i / batchSize) + 1}: ${batch.length} pain points`);
    } catch (error) {
      console.error(`Failed to process batch ${Math.floor(i / batchSize) + 1}:`, error);
      // Continue with next batch instead of failing completely
    }
  }

  return {
    processed: totalProcessed,
    skipped,
    inserted: totalInserted,
  };
}

/**
 * Perform similarity search on pain point embeddings
 */
export async function searchSimilarPainPoints(
  queryText: string,
  limit: number = 10,
  threshold: number = 0.7
) {
  const provider = getAIProviderFromEnv();
  const embeddingsRepo = await EmbeddingsRepository.create();

  if (!provider.generateEmbeddings) {
    throw new Error("Current AI provider does not support embeddings generation");
  }

  // Generate embedding for query text
  const [queryEmbedding] = await provider.generateEmbeddings([queryText]);

  // Perform similarity search
  const results = await embeddingsRepo.similaritySearch(queryEmbedding, limit, threshold);

  return results;
}
