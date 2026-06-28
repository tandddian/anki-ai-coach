import { Material, AIGeneratedTest, AIGeneratedQuestion, MaterialCorrelation } from '../types';

// Configurable AI API endpoint
const AI_API_URL = 'https://api.deepseek.com/v1/chat/completions';
let aiApiKey: string | null = null;

export function setAIKey(key: string): void {
  aiApiKey = key;
}

export function getAIKey(): string | null {
  return aiApiKey;
}

export async function generateTest(materials: Material[], correlations: { material1Id: number; material2Id: number; score: number }[]): Promise<AIGeneratedTest> {
  let result: AIGeneratedTest;
  if (aiApiKey) {
    try {
      result = await generateTestWithAI(materials, correlations);
    } catch (error) {
      console.error('AI generation failed, falling back to rule-based:', error);
      result = generateTestRuleBased(materials, correlations);
    }
  } else {
    result = generateTestRuleBased(materials, correlations);
  }
  return validateGeneratedTest(result);
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

### Question Types (MUST include all three):
- **multiple_choice**: Traditional 4-option MCQs. Distribute correct answers across A/B/C/D — NOT all the same letter.
- **fill_in_blank**: Sentence with a blank (marked as "___"). Provide 4 answer choices. The correct answer is the word/phrase that fills the blank.
- **essay**: Open-ended synthesis/analysis question requiring paragraph-length response. No options needed (empty array). Provide a model answer in correctAnswer.

### Required Distribution:
- At least 2 multiple_choice questions
- At least 1 fill_in_blank question
- At least 1 essay question

### Difficulty Levels:

**Easy (concept identification, simple recall):**
- Test basic familiarity with the material
- Simple multiple-choice with obvious distractors
- Direct recall of definitions, names, dates

**Medium (key points, must-know content):**
- Most important concepts in each material
- Multiple-choice with plausible but incorrect alternatives
- Application of concepts to simple scenarios

**Hard (deeper understanding, cross-material synthesis):**
- Require synthesizing information from multiple materials
- Questions requiring inference, analysis, or evaluation
- For materials with correlation >= 7, create cross-material questions

## CRITICAL: Question Quality Requirements
- Each question MUST be a COMPLETE, MEANINGFUL question — a full interrogative sentence that stands on its own
- NEVER output raw sentence fragments or incomplete phrases as questions
- For fill_in_blank: the questionText should be a full sentence with "___" marking the blank, e.g., "According to Newton's Second Law, force equals ___ times acceleration."
- For essay: ask a substantive question like "Compare and contrast..." or "Explain how..." or "Analyze the relationship between..."

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
      "questionType": "multiple_choice|fill_in_blank|essay",
      "questionText": "The COMPLETE question content — a full meaningful question",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "correctAnswer": "A",
      "explanation": "Why this is correct",
      "sourceMaterialIds": [<material id>]
    }
  ]
}

## Important Notes:
- Questions should use the same language as the source materials
- Multiple choice options formatted as "A. text", "B. text", etc.
- For multiple_choice: correctAnswer should be just the letter (e.g., "A", "B") — VARY the correct letter across questions
- For fill_in_blank: correctAnswer is the word/phrase that fills the blank
- For essay: options is an empty array [], correctAnswer is a model answer paragraph
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
      model: 'deepseek-chat',
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
    name: fixTestName(parsed.name),
    questions: (parsed.questions || []).map((q: any) => ({
      difficulty: q.difficulty || 'easy',
      questionType: q.questionType || 'multiple_choice',
      questionText: q.questionText || '',
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      sourceMaterialIds: q.sourceMaterialIds || [],
    })),
    correlations: parsed.correlations || correlations,
  };
}

function fixTestName(aiName: string): string {
  const today = getDateString(new Date());
  // Extract topic after "YYYY/MM/DD - " prefix; fallback to full name
  const match = aiName?.match(/^\d{4}\/\d{2}\/\d{2}\s*-\s*(.+)/);
  const topic = match ? match[1] : (aiName || 'AI Generated Test');
  return `${today} - ${topic}`;
}

function generateTestRuleBased(
  materials: Material[],
  correlations: { material1Id: number; material2Id: number; score: number }[]
): AIGeneratedTest {
  const questions: AIGeneratedQuestion[] = [];
  const allSentences: { text: string; materialId: number; materialName: string }[] = [];

  for (const material of materials) {
    const sentences = material.contentText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 300);
    for (const sentence of sentences) {
      allSentences.push({ text: sentence, materialId: material.id, materialName: material.name });
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

  // Easy questions: fill_in_blank from materials
  for (let i = 0; i < Math.min(2, materials.length); i++) {
    const material = materials[i];
    const sentences = allSentences.filter(s => s.materialId === material.id);
    if (sentences.length > 0) {
      const targetSentence = sentences[Math.floor(Math.random() * sentences.length)];
      const words = targetSentence.text.split(/\s+/);
      if (words.length < 4) continue;
      const blankIndex = Math.floor(words.length / 2);
      const blankWord = words[blankIndex];

      const options = [blankWord];
      const shuffled = termsList.sort(() => Math.random() - 0.5);
      for (const term of shuffled) {
        if (options.length >= 4) break;
        if (term.toLowerCase() !== blankWord.toLowerCase()) options.push(term);
      }
      // Pad if needed
      while (options.length < 4) {
        options.push(`distractor_${options.length}`);
      }

      // Randomize which option is correct (not always A)
      const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
      const correctIndex = shuffledOptions.indexOf(blankWord);
      const correctLetter = String.fromCharCode(65 + correctIndex);

      const blankSentence = targetSentence.text.replace(blankWord, '___');

      questions.push({
        difficulty: 'easy',
        questionType: 'fill_in_blank',
        questionText: `Fill in the blank from "${material.name}":\n${blankSentence}`,
        options: shuffledOptions.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`),
        correctAnswer: correctLetter,
        explanation: `The correct term is "${blankWord}" as stated in "${material.name}".`,
        sourceMaterialIds: [material.id],
      });
    }
  }

  // Medium questions: multiple_choice with randomized correct answer
  for (let i = 0; i < Math.min(3, allSentences.length); i++) {
    const sentence = allSentences[Math.floor(Math.random() * allSentences.length)];
    const material = materials.find(m => m.id === sentence.materialId);
    const correctAnswerText = `${sentence.text.substring(0, 80)}...`;
    const optionTexts = [correctAnswerText];
    const otherSentences = allSentences.filter(s => s.materialId !== sentence.materialId);
    const shuffledOthers = otherSentences.sort(() => Math.random() - 0.5);
    for (const other of shuffledOthers) {
      if (optionTexts.length >= 4) break;
      const distractor = `${other.text.substring(0, 80)}...`;
      if (distractor !== correctAnswerText) optionTexts.push(distractor);
    }
    // Pad if needed
    while (optionTexts.length < 4) {
      optionTexts.push(`Alternative explanation ${optionTexts.length}`);
    }

    // Randomize correct answer position
    const shuffledOptionTexts = [...optionTexts].sort(() => Math.random() - 0.5);
    const correctIndex = shuffledOptionTexts.indexOf(correctAnswerText);
    const correctLetter = String.fromCharCode(65 + correctIndex);

    questions.push({
      difficulty: 'medium',
      questionType: 'multiple_choice',
      questionText: `According to "${material?.name || 'the material'}", which statement is correct?`,
      options: shuffledOptionTexts.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`),
      correctAnswer: correctLetter,
      explanation: `This is a key point from "${material?.name || 'the material'}".`,
      sourceMaterialIds: [sentence.materialId],
    });
  }

  // Hard questions: multiple_choice cross-material synthesis with randomized correct answer
  const highCorrelationPairs = correlations.filter(c => c.score >= 7);
  const pairsToUse = highCorrelationPairs.length > 0
    ? highCorrelationPairs.slice(0, 2)
    : materials.length >= 2
      ? materials.slice(0, 2).map((_m, i) => ({
          material1Id: materials[0].id,
          material2Id: materials[Math.min(i + 1, materials.length - 1)].id,
          score: 5,
        }))
      : [];

  for (const pair of pairsToUse) {
    const m1 = materials.find(m => m.id === pair.material1Id);
    const m2 = materials.find(m => m.id === pair.material2Id);
    if (m1 && m2) {
      const hardOptions = [
        `A. They are completely unrelated topics with no connection`,
        `B. They share overlapping themes that complement each other`,
        `C. "${m1.name}" fully explains everything in "${m2.name}"`,
        `D. "${m2.name}" contradicts the main points of "${m1.name}"`,
      ];

      // Shuffle so correct answer isn't always B
      const correctText = `They share overlapping themes that complement each other`;
      const shuffledHard = [...hardOptions].sort(() => Math.random() - 0.5);
      const relettered = shuffledHard.map((opt, idx) => {
        // Replace original letter with new position letter
        return `${String.fromCharCode(65 + idx)}.${opt.substring(2)}`;
      });
      const correctOptionIdx = shuffledHard.findIndex(opt => opt.includes(correctText));
      const correctLetter = String.fromCharCode(65 + (correctOptionIdx >= 0 ? correctOptionIdx : 1));

      questions.push({
        difficulty: 'hard',
        questionType: 'multiple_choice',
        questionText: `How does the concept from "${m1.name}" relate to the content in "${m2.name}"? Provide a synthesis of the key ideas from both materials.`,
        options: relettered,
        correctAnswer: correctLetter,
        explanation: `Both materials share thematic connections. "${m1.name}" covers foundational concepts that relate to the ideas presented in "${m2.name}". Cross-referencing both provides a more complete understanding.`,
        sourceMaterialIds: [pair.material1Id, pair.material2Id],
      });
    }
  }

  // Add 1 essay question about a key topic
  const essayMaterial = materials[0];
  if (essayMaterial) {
    const topicSentences = allSentences.filter(s => s.materialId === essayMaterial.id);
    const topic = topicSentences.length > 0
      ? topicSentences.slice(0, 2).map(s => s.text.substring(0, 100)).join(' ')
      : essayMaterial.name;

    questions.push({
      difficulty: 'medium',
      questionType: 'essay',
      questionText: `Based on the material "${essayMaterial.name}", explain the key concepts and their significance. Provide specific examples from the source material to support your analysis.`,
      options: [],
      correctAnswer: `Model answer: The material "${essayMaterial.name}" covers important concepts including: ${topic}... These concepts are significant because they form the foundation for understanding the broader subject matter and have practical applications in related fields.`,
      explanation: `Essay questions encourage deeper understanding and synthesis of the material. Compare your response to the key points covered in the source.`,
      sourceMaterialIds: [essayMaterial.id],
    });
  }

  const topics = materials.map(m => m.name).join(' & ');
  const name = `${getDateString(new Date())} - Study: ${topics.substring(0, 50)}`;

  return { name, questions, correlations };
}

/**
 * Post-generation validation: cleans up and enforces quality standards on generated tests.
 */
function validateGeneratedTest(test: AIGeneratedTest): AIGeneratedTest {
  const MIN_QUESTION_LENGTH = 10;

  // Filter out bad questions: too short, or raw sentence fragments
  let questions = test.questions.filter((q) => {
    const text = q.questionText.trim();
    if (text.length < MIN_QUESTION_LENGTH) return false;
    // Filter out raw sentence fragments that don't look like questions
    // A fragment starts with lowercase and ends without question mark or period
    if (
      text[0] === text[0].toLowerCase() &&
      !text.endsWith('?') &&
      !text.endsWith('.') &&
      !text.endsWith('!')
    ) {
      return false;
    }
    return true;
  });

  if (questions.length === 0) {
    // If all questions were filtered out, return as-is rather than empty
    return test;
  }

  // Ensure we have at least one of each question type
  const hasMultipleChoice = questions.some(q => q.questionType === 'multiple_choice');
  const hasFillInBlank = questions.some(q => q.questionType === 'fill_in_blank');
  const hasEssay = questions.some(q => q.questionType === 'essay');

  // Convert some questions if types are missing
  if (!hasFillInBlank && questions.length >= 2) {
    // Convert the first non-essay question to fill_in_blank
    const toConvert = questions.find(q => q.questionType !== 'essay');
    if (toConvert) {
      toConvert.questionType = 'fill_in_blank';
      // Add blank marker if not present
      if (!toConvert.questionText.includes('___')) {
        const words = toConvert.questionText.split(' ');
        if (words.length > 3) {
          const replaceIdx = Math.floor(words.length / 2);
          const replaced = words[replaceIdx];
          words[replaceIdx] = '___';
          toConvert.questionText = words.join(' ');
          // Update correctAnswer to include the replaced word in options
          if (toConvert.options.length >= 4) {
            const letter = toConvert.correctAnswer.toUpperCase().charCodeAt(0) - 65;
            if (letter >= 0 && letter < toConvert.options.length) {
              const optionMatch = toConvert.options[letter].match(/^[A-D][.)]\s*(.+)$/i);
              if (optionMatch) {
                toConvert.correctAnswer = optionMatch[1];
              } else {
                toConvert.correctAnswer = replaced;
              }
            }
          }
        }
      }
    }
  }

  if (!hasEssay) {
    const toConvert = questions.find(q => q.questionType === 'multiple_choice');
    if (toConvert) {
      toConvert.questionType = 'essay';
      toConvert.options = [];
      toConvert.correctAnswer = `Model answer: ${toConvert.explanation || 'Review the source material.'}`;
    }
  }

  // Validate multiple choice questions
  for (const q of questions.filter(q => q.questionType === 'multiple_choice')) {
    // Ensure exactly 4 options
    if (q.options.length < 4) {
      while (q.options.length < 4) {
        q.options.push(`${String.fromCharCode(65 + q.options.length)}. Alternative answer`);
      }
    } else if (q.options.length > 4) {
      q.options = q.options.slice(0, 4);
    }

    // Ensure correctAnswer is a valid letter
    const answerLetter = q.correctAnswer.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(answerLetter)) {
      let found = false;
      for (let i = 0; i < q.options.length; i++) {
        const optText = q.options[i].replace(/^[A-D][.)]\s*/, '').trim();
        if (optText.toLowerCase() === answerLetter.toLowerCase()) {
          q.correctAnswer = String.fromCharCode(65 + i);
          found = true;
          break;
        }
      }
      if (!found) q.correctAnswer = 'A';
    }
  }

  // Check that multiple_choice questions don't all have the same correct letter
  const mcQuestions = questions.filter(q => q.questionType === 'multiple_choice');
  if (mcQuestions.length >= 2) {
    const allSameLetter = mcQuestions.every(
      q => q.correctAnswer.toUpperCase() === mcQuestions[0].correctAnswer.toUpperCase()
    );
    if (allSameLetter) {
      const letters = ['A', 'B', 'C', 'D'];
      mcQuestions.forEach((q, idx) => {
        const newLetter = letters[idx % letters.length];
        const currentIdx = q.correctAnswer.toUpperCase().charCodeAt(0) - 65;
        const newIdx = newLetter.charCodeAt(0) - 65;
        if (currentIdx !== newIdx && currentIdx < q.options.length && newIdx < q.options.length) {
          const temp = q.options[currentIdx];
          q.options[currentIdx] = q.options[newIdx];
          q.options[newIdx] = temp;
        }
        q.correctAnswer = newLetter;
      });
    }
  }

  return { ...test, questions };
}

function getDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}
