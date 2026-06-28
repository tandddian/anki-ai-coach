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

async function generateTestWithAI(
  materials: Material[],
  correlations: { material1Id: number; material2Id: number; score: number }[]
): Promise<AIGeneratedTest> {
  const materialsContext = materials.map((m) => {
    const preview = m.contentText.substring(0, 2000);
    return `[Material ${m.id}] Name: ${m.name}\nType: ${m.type}\nContent Preview:\n${preview}`;
  }).join('\n\n---\n\n');

  const userPrompt = `Here are the study materials for today's test:

${materialsContext}

Reference IDs:
${materials.map(m => `- Material ${m.id}: "${m.name}" (${m.type})`).join('\n')}

Please analyze these materials, score their correlations, and generate a comprehensive test following the system prompt instructions.`;

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content in AI response');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    name: parsed.name || `${getDateString(new Date())} - AI Generated Test`,
    questions: (parsed.questions || []).map((q: any) => ({
      difficulty: q.difficulty || 'easy',
      questionText: q.questionText || '',
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      sourceMaterialIds: q.sourceMaterialIds || [],
    })),
    correlations: parsed.correlations || correlations,
  };
}

function generateTestRuleBased(
  materials: Material[],
  correlations: { material1Id: number; material2Id: number; score: number }[]
): AIGeneratedTest {
  const questions: AIGeneratedQuestion[] = [];
  const allSentences: { text: string; materialId: number }[] = [];

  for (const material of materials) {
    const sentences = material.contentText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 300);
    for (const sentence of sentences) {
      allSentences.push({ text: sentence, materialId: material.id });
    }
  }

  const keyTerms = new Set<string>();
  for (const sentence of allSentences) {
    const words = sentence.text.split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^a-zA-Z0-9-]/g, '');
      if (clean.length > 5 || (clean.length > 2 && clean[0] === clean[0].toUpperCase())) {
        keyTerms.add(clean);
      }
    }
  }
  const termsList = Array.from(keyTerms).slice(0, 50);

  // Easy questions (fill-in-blank from materials)
  for (let i = 0; i < Math.min(2, materials.length); i++) {
    const material = materials[i];
    const sentences = allSentences.filter(s => s.materialId === material.id);
    if (sentences.length > 0) {
      const targetSentence = sentences[Math.floor(Math.random() * sentences.length)];
      const words = targetSentence.text.split(/\s+/);
      const blankWord = words[Math.floor(words.length / 2)];

      const options = [blankWord];
      const shuffled = termsList.sort(() => Math.random() - 0.5);
      for (const term of shuffled) {
        if (options.length >= 4) break;
        if (term !== blankWord) options.push(term);
      }

      questions.push({
        difficulty: 'easy',
        questionText: `Fill in the blank from "${material.name}":\n${targetSentence.text.replace(blankWord, '___')}`,
        options: options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`),
        correctAnswer: 'A',
        explanation: `The correct term is "${blankWord}" as stated in "${material.name}".`,
        sourceMaterialIds: [material.id],
      });
    }
  }

  // Medium questions (which statement is correct)
  for (let i = 0; i < Math.min(3, allSentences.length); i++) {
    const sentence = allSentences[Math.floor(Math.random() * allSentences.length)];
    const material = materials.find(m => m.id === sentence.materialId);
    const correctAnswer = `${sentence.text.substring(0, 80)}...`;
    const options = [correctAnswer];
    const otherSentences = allSentences.filter(s => s.materialId !== sentence.materialId);
    const shuffled = otherSentences.sort(() => Math.random() - 0.5);
    for (const other of shuffled) {
      if (options.length >= 4) break;
      const distractor = `${other.text.substring(0, 80)}...`;
      if (distractor !== correctAnswer) options.push(distractor);
    }
    questions.push({
      difficulty: 'medium',
      questionText: `According to "${material?.name || 'the material'}", which statement is correct?`,
      options: options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`),
      correctAnswer: 'A',
      explanation: `This is a key point from "${material?.name || 'the material'}".`,
      sourceMaterialIds: [sentence.materialId],
    });
  }
