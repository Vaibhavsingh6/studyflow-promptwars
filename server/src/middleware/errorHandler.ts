import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle Multer-specific error codes
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'File size exceeds the 10MB limit. Please upload a smaller PDF.',
        code: 'FILE_TOO_LARGE',
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        error: 'Only a single PDF file may be uploaded at a time.',
        code: 'TOO_MANY_FILES',
      });
      return;
    }
    res.status(400).json({
      error: `File upload error: ${err.message}`,
      code: 'UPLOAD_ERROR',
    });
    return;
  }

  // Handle custom validation errors
  if (err && typeof err.message === 'string' && err.message.startsWith('INVALID_FILE_TYPE')) {
    res.status(400).json({
      error: 'Invalid file format. Only standard PDF (.pdf) documents are accepted.',
      code: 'INVALID_FILE_TYPE',
    });
    return;
  }

  // Generic safe error fallback - never leak stack traces or environment variables
  console.error('[SafeServerError]', err?.message || 'Unknown server error');
  res.status(err.status || 500).json({
    error: err.status === 400 ? (err.message || 'Bad Request') : 'An error occurred while processing the request. Please try again.',
    code: 'SERVER_ERROR',
  });
};
