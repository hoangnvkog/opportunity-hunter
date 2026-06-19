/**
 * Split an array into chunks of a specified size
 * @param items - Array to split
 * @param size - Maximum size of each chunk
 * @returns Array of chunks
 */
export function splitIntoChunks<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}
