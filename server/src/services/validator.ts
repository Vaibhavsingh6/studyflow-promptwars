import { StudyPack, QuizQuestion } from '../types';

export class ValidationError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, code = 'AI_VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 502; // AI Output Bad Gateway
    this.code = code;
  }
}

/**
 * Validates and sanitizes raw AI JSON into a strictly typed StudyPack.
 * Enforces business logic:
 *  - Non-empty title and summary
 *  - At least 1 non-empty key point
 *  - Exactly 5 multiple-choice questions
 *  - Exactly 4 unique options per question
 *  - correctAnswer must strictly match one of the 4 options
 *  - Non-empty explanation for each question
 */
export function validateStudyPack(raw: unknown): StudyPack {
  let data: any = raw;

  // Handle case where raw input is a JSON string
  if (typeof raw === 'string') {
    try {
      // Remove any markdown code blocks if present (e.g. ```json ... ```)
      const cleanJson = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      data = JSON.parse(cleanJson);
    } catch (err: any) {
      throw new ValidationError(
        `AI generated malformed JSON: ${err?.message || 'Invalid syntax'}.`,
        'MALFORMED_JSON'
      );
    }
  }

  // Must be a non-null, non-array object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError(
      'AI response must be a JSON object containing title, summary, keyPoints, and questions.',
      'INVALID_OBJECT'
    );
  }

  // 1. Validate title
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new ValidationError(
      'Study pack is missing a valid non-empty "title".',
      'MISSING_TITLE'
    );
  }

  // 2. Validate summary
  if (typeof data.summary !== 'string' || data.summary.trim().length === 0) {
    throw new ValidationError(
      'Study pack is missing a valid non-empty "summary".',
      'MISSING_SUMMARY'
    );
  }

  // 3. Validate keyPoints
  if (!Array.isArray(data.keyPoints) || data.keyPoints.length === 0) {
    throw new ValidationError(
      'Study pack must include a non-empty list of "keyPoints".',
      'MISSING_KEY_POINTS'
    );
  }

  const cleanedKeyPoints: string[] = [];
  for (let i = 0; i < data.keyPoints.length; i++) {
    const point = data.keyPoints[i];
    if (typeof point !== 'string' || point.trim().length === 0) {
      throw new ValidationError(
        `Key point at index ${i} is invalid or empty.`,
        'INVALID_KEY_POINT'
      );
    }
    cleanedKeyPoints.push(point.trim());
  }

  // 4. Validate questions - MUST BE EXACTLY 5
  if (!Array.isArray(data.questions)) {
    throw new ValidationError(
      'Study pack is missing "questions" array.',
      'MISSING_QUESTIONS'
    );
  }

  if (data.questions.length !== 5) {
    throw new ValidationError(
      `Study pack must contain exactly 5 questions (received ${data.questions.length}).`,
      'INVALID_QUESTION_COUNT'
    );
  }

  const validatedQuestions: QuizQuestion[] = [];

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    const qNum = i + 1;

    if (!q || typeof q !== 'object' || Array.isArray(q)) {
      throw new ValidationError(
        `Question ${qNum} is not a valid object.`,
        'INVALID_QUESTION_OBJECT'
      );
    }

    // Question prompt
    if (typeof q.question !== 'string' || q.question.trim().length === 0) {
      throw new ValidationError(
        `Question ${qNum} is missing valid "question" text.`,
        'MISSING_QUESTION_TEXT'
      );
    }

    // Options - MUST BE EXACTLY 4
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new ValidationError(
        `Question ${qNum} must have exactly 4 answer options (received ${Array.isArray(q.options) ? q.options.length : 'none'}).`,
        'INVALID_OPTION_COUNT'
      );
    }

    const cleanedOptions: string[] = [];
    for (let optIdx = 0; optIdx < 4; optIdx++) {
      const opt = q.options[optIdx];
      if (typeof opt !== 'string' || opt.trim().length === 0) {
        throw new ValidationError(
          `Question ${qNum}, option ${optIdx + 1} is empty or not a string.`,
          'EMPTY_OPTION'
        );
      }
      cleanedOptions.push(opt.trim());
    }

    // Enforce distinct options
    const uniqueOptions = new Set(cleanedOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== 4) {
      throw new ValidationError(
        `Question ${qNum} contains duplicate answer options. All 4 options must be distinct.`,
        'DUPLICATE_OPTIONS'
      );
    }

    // Correct answer
    if (typeof q.correctAnswer !== 'string' || q.correctAnswer.trim().length === 0) {
      throw new ValidationError(
        `Question ${qNum} is missing a "correctAnswer".`,
        'MISSING_CORRECT_ANSWER'
      );
    }

    const trimmedAnswer = q.correctAnswer.trim();
    const matchedOption = cleanedOptions.find(
      (opt) => opt.toLowerCase() === trimmedAnswer.toLowerCase()
    );

    if (!matchedOption) {
      throw new ValidationError(
        `Question ${qNum}: correctAnswer "${trimmedAnswer}" does not match any of the 4 provided options.`,
        'ANSWER_NOT_IN_OPTIONS'
      );
    }

    // Explanation
    if (typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
      throw new ValidationError(
        `Question ${qNum} is missing an "explanation".`,
        'MISSING_EXPLANATION'
      );
    }

    validatedQuestions.push({
      question: q.question.trim(),
      options: [cleanedOptions[0], cleanedOptions[1], cleanedOptions[2], cleanedOptions[3]],
      correctAnswer: matchedOption, // Use exact matching string
      explanation: q.explanation.trim(),
    });
  }

  return {
    title: data.title.trim(),
    summary: data.summary.trim(),
    keyPoints: cleanedKeyPoints,
    questions: [
      validatedQuestions[0],
      validatedQuestions[1],
      validatedQuestions[2],
      validatedQuestions[3],
      validatedQuestions[4],
    ],
  };
}
