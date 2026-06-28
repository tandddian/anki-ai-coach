import { Material, MaterialCorrelation } from '../types';
import { createCorrelation, getCorrelationBetweenTwo } from '../database/queries';

export async function analyzeCorrelations(materials: Material[]): Promise<MaterialCorrelation[]> {
  if (materials.length < 2) return [];

  const results: MaterialCorrelation[] = [];

  for (let i = 0; i < materials.length; i++) {
    for (let j = i + 1; j < materials.length; j++) {
      const existing = getCorrelationBetweenTwo(materials[i].id, materials[j].id);
      if (existing) {
        results.push(existing);
        continue;
      }

      const score = calculateCorrelationScore(materials[i], materials[j]);
      const correlation = createCorrelation(materials[i].id, materials[j].id, score);
      results.push(correlation);
    }
  }

  return results;
}

function calculateCorrelationScore(material1: Material, material2: Material): number {
  let score = 0;

  // Keyword overlap analysis (0-4 points)
  const words1 = extractKeywords(material1.contentText);
  const words2 = extractKeywords(material2.contentText);
  const commonWords = words1.filter(w => words2.includes(w));
  const overlapRatio = Math.min(words1.length, words2.length) > 0
    ? commonWords.length / Math.max(1, Math.min(words1.length, words2.length))
    : 0;
  score += Math.round(overlapRatio * 4);

  // Content length similarity (0-1 point)
  const len1 = material1.contentText.length;
  const len2 = material2.contentText.length;
  const lenRatio = Math.min(len1, len2) / Math.max(len1, len2);
  if (lenRatio > 0.5) score += 0.5;
  if (lenRatio > 0.8) score += 0.5;

  // Name similarity (0-2 points)
  const nameSimilarity = calculateTextSimilarity(material1.name, material2.name);
  score += Math.round(nameSimilarity * 2);

  // Same folder (+1 point)
  if (material1.folderId && material2.folderId && material1.folderId === material2.folderId) {
    score += 1;
  }

  // Same type/format (+0.5 point)
  if (material1.type === material2.type) {
    score += 0.5;
  }

  return Math.max(1, Math.min(10, Math.round(score)));
}