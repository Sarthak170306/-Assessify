require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Assessify AI Centralized Gemini AI Service
 */

// Model selection defaults
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

/**
 * Clean JSON Markdown Formatting wrapper
 */
function cleanJsonString(str) {
  if (!str) return '';
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Core Helper to Invoke Gemini API
 */
async function callGeminiAPI(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not configured in process.env. Using fallback generation mode.');
    return null;
  }

  // 1. Try @google/genai SDK first
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || undefined,
        responseMimeType: 'application/json'
      }
    });

    if (response && response.text) {
      return response.text;
    }
  } catch (err1) {
    console.warn(`[aiService] @google/genai call failed (${err1.message}). Trying @google/generative-ai fallback...`);
  }

  // 2. Fallback to @google/generative-ai SDK
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: FALLBACK_MODEL,
      systemInstruction: systemInstruction || undefined,
      generationConfig: { responseMimeType: 'application/json' }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err2) {
    console.error(`[aiService] @google/generative-ai call failed: ${err2.message}`);
    return null;
  }
}

/**
 * 1. Generate Quiz Questions from AI
 * Signature: async function generateQuizFromAI({ topic, difficulty = 'Medium', count = 5, categoryName = '' })
 */
async function generateQuizFromAI({ topic, difficulty = 'Medium', count = 5, categoryName = '' }) {
  const safeCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 20);
  const safeTopic = topic || categoryName || 'General Science & Technology';
  const safeDifficulty = difficulty || 'Medium';

  const systemInstruction = `You are a Principal Assessment Specialist and Subject Matter Expert for Assessify AI.
Your task is to generate high-quality, educationally rigorous multiple-choice questions (MCQs) for student evaluation.
Strict Rules:
1. Output MUST be valid JSON matching the specified schema.
2. Each question MUST contain exactly 4 options.
3. Exactly ONE option in each question MUST have "isCorrect": true, and the other 3 MUST have "isCorrect": false.
4. Provide a clear, educational explanation for every question.`;

  const prompt = `Generate a structured quiz on the topic: "${safeTopic}".
Difficulty Level: ${safeDifficulty}
Category Context: ${categoryName || safeTopic}
Number of Questions: ${safeCount}

Return JSON in this exact structure:
{
  "title": "${safeTopic} Assessment",
  "description": "Comprehensive ${safeDifficulty} difficulty quiz testing key concepts in ${safeTopic}.",
  "suggestedTimeLimit": ${safeCount * 2},
  "suggestedPassingScore": 70,
  "questions": [
    {
      "text": "Question statement text?",
      "options": [
        { "text": "Option A text", "isCorrect": false },
        { "text": "Option B text", "isCorrect": true },
        { "text": "Option C text", "isCorrect": false },
        { "text": "Option D text", "isCorrect": false }
      ],
      "explanation": "Detailed explanation of why Option B is correct."
    }
  ]
}`;

  try {
    const rawText = await callGeminiAPI(prompt, systemInstruction);

    if (rawText) {
      const jsonString = cleanJsonString(rawText);
      const parsedData = JSON.parse(jsonString);

      if (parsedData && Array.isArray(parsedData.questions)) {
        // Validate & Normalize Question Guardrails
        const normalizedQuestions = parsedData.questions.slice(0, safeCount).map((q, qIdx) => {
          let options = Array.isArray(q.options) ? q.options : [];
          
          // Ensure 4 options
          while (options.length < 4) {
            options.push({ text: `Option Choice ${options.length + 1}`, isCorrect: false });
          }
          options = options.slice(0, 4);

          // Guardrail: Ensure exactly 1 correct option
          const correctCount = options.filter(o => o.isCorrect).length;
          if (correctCount !== 1) {
            options = options.map((opt, idx) => ({
              ...opt,
              isCorrect: idx === 0
            }));
          }

          return {
            text: q.text || `Question ${qIdx + 1} regarding ${safeTopic}`,
            options,
            explanation: q.explanation || 'Review option choices and core concept principles.'
          };
        });

        return {
          title: parsedData.title || `${safeTopic} Assessment`,
          description: parsedData.description || `Assessment on ${safeTopic} (${safeDifficulty})`,
          suggestedTimeLimit: parseInt(parsedData.suggestedTimeLimit, 10) || safeCount * 2,
          suggestedPassingScore: parseInt(parsedData.suggestedPassingScore, 10) || 70,
          questions: normalizedQuestions
        };
      }
    }
  } catch (err) {
    console.error('generateQuizFromAI error during Gemini call:', err.message);
  }

  // Fallback Mock Generator if API key missing or Gemini unavailable
  console.log(`[aiService] Returning high-quality fallback quiz generator for topic: "${safeTopic}"`);
  return generateFallbackQuiz({ topic: safeTopic, difficulty: safeDifficulty, count: safeCount });
}

/**
 * Fallback Quiz Generator
 */
function generateFallbackQuiz({ topic, difficulty, count }) {
  const sampleQuestions = [
    {
      text: `What is a core fundamental principle of ${topic}?`,
      options: [
        { text: `Primary architecture pattern in ${topic}`, isCorrect: true },
        { text: `Deprecated legacy protocol`, isCorrect: false },
        { text: `Unrelated frontend utility`, isCorrect: false },
        { text: `Static build configuration`, isCorrect: false }
      ],
      explanation: `The primary architecture pattern represents the core principle in ${topic}.`
    },
    {
      text: `Which of the following best describes optimization in ${topic}?`,
      options: [
        { text: `Increasing unnecessary computation`, isCorrect: false },
        { text: `Reducing execution latency and resource consumption`, isCorrect: true },
        { text: `Ignoring error handling protocols`, isCorrect: false },
        { text: `Disabling type safety checks`, isCorrect: false }
      ],
      explanation: `Optimization focuses on reducing execution latency and resource consumption.`
    },
    {
      text: `When implementing ${topic}, what is the recommended best practice?`,
      options: [
        { text: `Hardcoding static credentials`, isCorrect: false },
        { text: `Ignoring edge case exceptions`, isCorrect: false },
        { text: `Enforcing modular structure and strict validation`, isCorrect: true },
        { text: `Bypassing security middleware`, isCorrect: false }
      ],
      explanation: `Enforcing modular structure and strict validation is essential for maintainability and reliability.`
    }
  ];

  const questions = [];
  for (let i = 0; i < count; i++) {
    const template = sampleQuestions[i % sampleQuestions.length];
    questions.push({
      text: `[${difficulty}] Q${i + 1}: ${template.text}`,
      options: template.options.map(o => ({ ...o })),
      explanation: template.explanation
    });
  }

  return {
    title: `${topic} AI Assessment`,
    description: `Generated ${difficulty} assessment covering essential concepts in ${topic}.`,
    suggestedTimeLimit: Math.max(10, count * 2),
    suggestedPassingScore: 70,
    questions
  };
}

/**
 * 2. Generate Diagnostic Performance Insights
 * Signature: async function generateDiagnosticFeedback({ quizTitle, scorePercentage, isPassed, incorrectQuestions = [] })
 */
async function generateDiagnosticFeedback({ quizTitle, scorePercentage, isPassed, incorrectQuestions = [] }) {
  const safeTitle = quizTitle || 'Assessment';
  const safeScore = scorePercentage ?? 0;
  const safePassed = Boolean(isPassed);

  const systemInstruction = `You are an AI Academic Tutor for Assessify AI.
Analyze student quiz performance and output a diagnostic JSON report with constructive, encouraging, and actionable feedback.`;

  const prompt = `Analyze performance for the assessment: "${safeTitle}".
Student Score: ${safeScore}%
Passing Result: ${safePassed ? 'PASSED' : 'FAILED'}
Incorrect Questions Count: ${incorrectQuestions.length}
Sample Missed Concepts: ${incorrectQuestions.map(q => q.text).join(' | ').substring(0, 300)}

Return JSON matching this exact structure:
{
  "summary": "2-sentence diagnostic assessment of the student's attempt.",
  "strengths": ["Strength 1", "Strength 2"],
  "weakAreas": ["Concept 1 needing improvement", "Concept 2 needing improvement"],
  "recommendations": ["Actionable study tip 1", "Actionable study tip 2"]
}`;

  try {
    const rawText = await callGeminiAPI(prompt, systemInstruction);

    if (rawText) {
      const jsonString = cleanJsonString(rawText);
      const parsed = JSON.parse(jsonString);

      if (parsed && parsed.summary) {
        return {
          summary: parsed.summary,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Demonstrated basic domain familiarity'],
          weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : ['Complex problem solving under time constraint'],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Review solution rationales and retake quiz']
        };
      }
    }
  } catch (err) {
    console.error('generateDiagnosticFeedback error:', err.message);
  }

  // Fallback diagnostic feedback object
  return {
    summary: safePassed 
      ? `Solid performance on "${safeTitle}" with a score of ${safeScore}%. You demonstrated strong comprehension of core concepts.`
      : `You scored ${safeScore}% on "${safeTitle}". With targeted review of missed concepts, you can easily pass on your next attempt.`,
    strengths: safePassed 
      ? ['Accurate option selection under timed session', 'Strong grasp of foundational principles']
      : ['Completed the full evaluation', 'Identified key learning gaps for focused study'],
    weakAreas: safePassed 
      ? ['Minor edge case precision']
      : ['Advanced problem scenarios', 'Time management during question evaluation'],
    recommendations: [
      'Review question explanations in the result breakdown tab.',
      'Re-attempt the assessment to reinforce concepts.'
    ]
  };
}

module.exports = {
  generateQuizFromAI,
  generateDiagnosticFeedback
};
