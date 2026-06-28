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