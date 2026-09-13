export interface HealthResponse {
  status: 'ok';
  service: string;
  phase: string;
  timestamp: string;
}

export interface UploadedFileInfo {
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
  file: UploadedFileInfo;
  studyPack: StudyPack;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}
