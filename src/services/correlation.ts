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

function extractKeywords(text: string): string[] {
  if (!text) return [];

  const words = text
    .toLowerCase()
    .split(/[\s,.;:!?()\[\]{}"'\/\\]+/)
    .filter(w => w.length > 4)
    .filter(w => !isStopWord(w));

  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  return Object.entries(freq)
    .filter(([_, count]) => count >= 2)
    .map(([word]) => word);
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'about', 'above', 'after', 'again', 'against', 'being', 'below', 'between',
    'could', 'does', 'doing', 'during', 'each', 'few', 'from', 'further',
    'have', 'having', 'here', 'into', 'itself', 'just', 'more', 'most',
    'other', 'over', 'same', 'should', 'some', 'such', 'than', 'that',
    'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'under', 'until', 'very', 'what', 'when', 'where', 'which',
    'while', 'who', 'whom', 'will', 'with', 'would', 'your',
  ]);
  return stopWords.has(word.toLowerCase());
}

function calculateTextSimilarity(s1: string, s2: string): number {
  const words1 = new Set(s1.toLowerCase().split(/[\s,.]+/).filter(w => w.length > 2));
  const words2 = new Set(s2.toLowerCase().split(/[\s,.]+/).filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;

  let common = 0;
  for (const word of words1) {
    if (words2.has(word)) common++;
  }

  return common / Math.sqrt(words1.size * words2.size);
}