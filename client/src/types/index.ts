export type UploadStatus = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export interface FileMetadata {
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  mimeType: string;
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
}

export interface StudyPack {
  title: string;
  summary: string;
  keyPoints: string[];
  questions: [QuizQuestion, QuizQuestion, QuizQuestion, QuizQuestion, QuizQuestion];
}

export interface PdfProcessSuccessResponse {
  success: true;
  message: string;
  file: FileMetadata;
  studyPack: StudyPack;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export interface ClientValidationResult {
  isValid: boolean;
  errorMessage?: string;
}
