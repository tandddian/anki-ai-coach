import { Material, AIGeneratedTest, AIGeneratedQuestion, MaterialCorrelation } from '../types';

// Configurable AI API endpoint
const AI_API_URL = 'https://api.openai.com/v1/chat/completions';
let aiApiKey: string | null = null;

export function setAIKey(key: string): void {
  aiApiKey = key;
}

export function getAIKey(): string | null {
  return aiApiKey;
}

export async function generateTest(materials: Material[], correlations: { material1Id: number; material2Id: number; score: number }[]): Promise<AIGeneratedTest> {
  if (aiApiKey) {
    try {
      return await generateTestWithAI(materials, correlations);
    } catch (error) {
      console.error('AI generation failed, falling back to rule-based:', error);
      return generateTestRuleBased(materials, correlations);
    }
  }
  return generateTestRuleBased(materials, correlations);
}
