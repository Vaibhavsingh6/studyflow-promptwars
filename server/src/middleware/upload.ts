import multer from 'multer';
import { Request } from 'express';

// 10 MB maximum file size limit
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ['application/pdf'];

// Use memory storage for fast, clean in-memory buffer processing
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const isPdfMime = ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase());
  const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE: Only PDF files (.pdf) are supported.'));
  }
};

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1, // Only 1 file per request
  },
  fileFilter,
});
