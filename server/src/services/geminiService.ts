import { StudyPack } from '../types';
import { validateStudyPack, ValidationError } from './validator';

export class GeminiError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 502, code = 'GEMINI_ERROR') {
    super(message);
    this.name = 'GeminiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const PRIMARY_MODEL = 'gemini-3.5-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

/**
 * Builds the strict grounded prompt for Gemini.
 */
function buildPrompt(lectureText: string): string {
  return `You are an expert academic tutor and curriculum specialist.
Your task is to analyze the lecture text below and generate a high-yield, concise study pack for a student.

CRITICAL RULES:
1. Groundedness: Use ONLY information directly supported by the lecture text below. Do NOT fabricate, invent, or extrapolate facts.
2. Conciseness: Keep the summary and key points punchy, clear, and easy to review before an exam.
3. Multiple-Choice Questions: You MUST generate EXACTLY 5 questions. Not 4, not 6, exactly 5.
4. Options: Each question MUST have EXACTLY 4 distinct, plausible options.
5. Correct Answer: "correctAnswer" MUST be an exact string match to one of the 4 options.
6. Explanation: Provide a clear explanation for why the answer is correct based on the lecture text.

Output MUST be valid JSON adhering strictly to this schema:
{
  "title": "Concise descriptive title of the lecture",
  "summary": "2-4 sentence executive summary of the lecture material",
  "keyPoints": [
    "Key takeaway or concept 1",
    "Key takeaway or concept 2",
    "Key takeaway or concept 3",
    "Key takeaway or concept 4"
  ],
  "questions": [
    {
      "question": "Question 1 prompt?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why Option A is correct according to the lecture."
    },
    {
      "question": "Question 2 prompt?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Why Option B is correct according to the lecture."
    },
    {
      "question": "Question 3 prompt?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option C",
      "explanation": "Why Option C is correct according to the lecture."
    },
    {
      "question": "Question 4 prompt?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option D",
      "explanation": "Why Option D is correct according to the lecture."
    },
    {
      "question": "Question 5 prompt?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why Option A is correct according to the lecture."
    }
  ]
}

--- LECTURE TEXT ---
${lectureText}
`;
}

/**
 * Sends extracted lecture text to Gemini and validates the resulting study pack.
 */
export async function generateStudyPack(lectureText: string): Promise<StudyPack> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    throw new GeminiError(
      'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in server/.env.',
      500,
      'MISSING_GEMINI_API_KEY'
    );
  }

  const prompt = buildPrompt(lectureText);
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const callModel = async (model: string): Promise<Response> => {
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(35000), // 35 second timeout
    });
  };

  let response: Response;
  try {
    response = await callModel(PRIMARY_MODEL);
    // If primary model returns 404, fallback to secondary model
    if (response.status === 404) {
      console.warn(`[Gemini] ${PRIMARY_MODEL} returned 404, falling back to ${FALLBACK_MODEL}`);
      response = await callModel(FALLBACK_MODEL);
    }
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new GeminiError(
        'Gemini analysis timed out after 35 seconds. Please try again with a shorter document.',
        504,
        'GEMINI_TIMEOUT'
      );
    }
    throw new GeminiError(
      `Network error communicating with Gemini API: ${err.message}`,
      502,
      'GEMINI_NETWORK_ERROR'
    );
  }

  // Handle specific Gemini HTTP error codes safely
  if (!response.ok) {
    if (response.status === 429) {
      throw new GeminiError(
        'Gemini API rate limit reached. Please wait a few seconds before trying again.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new GeminiError(
        'Gemini API authentication rejected. Please verify that GEMINI_API_KEY in server/.env is valid.',
        500,
        'INVALID_API_KEY'
      );
    }
    throw new GeminiError(
      `Gemini service returned an error (HTTP ${response.status}). Please try again.`,
      502,
      'GEMINI_SERVICE_ERROR'
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err: any) {
    throw new GeminiError(
      'Failed to parse Gemini response payload.',
      502,
      'PARSE_ERROR'
    );
  }

  // Extract generated text from Gemini response structure
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new GeminiError(
      'Gemini returned an empty response. Please retry with clearer lecture content.',
      502,
      'EMPTY_RESPONSE'
    );
  }

  // Validate the AI output against our strict schema & business rules
  try {
    const validatedStudyPack = validateStudyPack(rawText);
    return validatedStudyPack;
  } catch (err: any) {
    if (err instanceof ValidationError) {
      throw err;
    }
    throw new ValidationError(
      `Validation failed on AI response: ${err.message}`,
      'VALIDATION_FAILED'
    );
  }
}
