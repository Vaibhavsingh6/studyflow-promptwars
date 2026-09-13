import { Router, Request, Response, NextFunction } from 'express';
import { uploadPdf } from '../middleware/upload';
import { HealthResponse, PdfProcessSuccessResponse } from '../types';
import { extractTextFromPdf, PdfExtractionError } from '../services/pdfExtractor';
import { generateStudyPack, GeminiError } from '../services/geminiService';
import { ValidationError } from '../services/validator';

const router = Router();

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  const response: HealthResponse = {
    status: 'ok',
    service: 'studyflow-backend',
    phase: 'Phase 2 - PDF to AI Study Pack',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
});

/**
 * P0 Core Endpoint: Lecture PDF -> Extraction -> Gemini -> Validation -> Study Pack
 */
router.post(
  '/process-pdf',
  uploadPdf.single('pdf'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'No PDF file was provided. Please select a lecture PDF.',
          code: 'MISSING_FILE',
        });
        return;
      }

      if (!req.file.buffer || req.file.buffer.length === 0) {
        res.status(400).json({
          error: 'The uploaded file is empty (0 bytes). Please upload a valid lecture PDF.',
          code: 'EMPTY_FILE',
        });
        return;
      }

      console.log(`[StudyFlow] Processing PDF: ${req.file.originalname} (${req.file.size} bytes)`);

      // 1. Text Extraction
      const extractedText = await extractTextFromPdf(req.file.buffer);
      console.log(`[StudyFlow] Extracted ${extractedText.length} characters of lecture text.`);

      // 2. Gemini Analysis & 3. Validation
      const studyPack = await generateStudyPack(extractedText);
      console.log(`[StudyFlow] Generated validated study pack: "${studyPack.title}" with 5 questions.`);

      const response: PdfProcessSuccessResponse = {
        success: true,
        message: 'Lecture PDF successfully analyzed and study pack generated.',
        file: {
          name: req.file.originalname,
          sizeBytes: req.file.size,
          sizeFormatted: formatBytes(req.file.size),
          mimeType: req.file.mimetype,
        },
        studyPack,
      };

      res.status(200).json(response);
    } catch (err: any) {
      if (err instanceof PdfExtractionError) {
        res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
        });
        return;
      }

      if (err instanceof GeminiError) {
        res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
        });
        return;
      }

      if (err instanceof ValidationError) {
        res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
        });
        return;
      }

      next(err);
    }
  }
);

export default router;
