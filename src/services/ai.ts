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

function buildSystemPrompt(): string {
  return `You are an expert educational assessment designer specializing in spaced repetition learning.

## Material Analysis
You will receive multiple study materials. For each material, you must:
1. Identify the core topic and key concepts
2. Extract must-know facts, definitions, and principles
3. Identify the difficulty level of each concept

## Correlation Scoring Rules (1-10)
- 1-2: Completely unrelated subjects/topics
- 3-4: Same general subject area but different specific topics
- 5-6: Related topics with some conceptual overlap
- 7-8: Strongly related - complementary concepts or prerequisite chains
- 9-10: Essentially the same topic from different sources

## Question Generation Rules

### Difficulty Levels:

**Easy (concept identification, simple recall):**
- Test basic familiarity with the material
- Simple multiple-choice with obvious distractors
- Direct recall of definitions, names, dates
- Generate at least 2 easy questions

**Medium (key points, must-know content):**
- Most important concepts in each material
- Multiple-choice with plausible but incorrect alternatives
- Application of concepts to simple scenarios
- Generate at least 3 medium questions

**Hard (deeper understanding, cross-material synthesis):**
- Require synthesizing information from multiple materials
- Questions requiring inference, analysis, or evaluation
- For materials with correlation >= 7, create cross-material questions
- Generate at least 2 hard questions

## Output Format
Return ONLY valid JSON:
{
  "name": "YYYY/MM/DD - Brief Topic Summary (max 60 chars)",
  "correlations": [
    { "material1Id": <number>, "material2Id": <number>, "score": <1-10> }
  ],
  "questions": [
    {
      "difficulty": "easy|medium|hard",
      "questionText": "The question content",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "correctAnswer": "A",
      "explanation": "Why this is correct",
      "sourceMaterialIds": [<material id>]
    }
  ]
}

## Important Notes:
- Questions MUST be in English
- Multiple choice options formatted as "A. text", "B. text", etc.
- correctAnswer should be just the letter (e.g., "A", "B")
- For cross-material questions, include all relevant material IDs
- Each question should reference at least one source material
- The test name should be descriptive of the combined topics`;
}
