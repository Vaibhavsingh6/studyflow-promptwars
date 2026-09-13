// Use the direct engine to bypass debug mode and ensure clean isolated document parsing
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export class PdfExtractionError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = 'PDF_EXTRACTION_ERROR') {
    super(message);
    this.name = 'PdfExtractionError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const MIN_TEXT_LENGTH = 50; // Minimum characters of readable text required
const MAX_TEXT_LENGTH = 50000; // Limit to ~12k tokens to prevent context overflow

/**
 * Extracts and normalizes readable text from a lecture PDF buffer.
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new PdfExtractionError(
      'The uploaded PDF file is empty.',
      400,
      'EMPTY_PDF'
    );
  }

  let parsed: { text: string; numpages: number };
  try {
    // Pass as Uint8Array for clean memory isolation in pdf.js
    parsed = await pdfParse(new Uint8Array(pdfBuffer));
  } catch (err: any) {
    throw new PdfExtractionError(
      `Failed to parse PDF document: ${err?.message || 'Corrupted or unreadable format'}.`,
      400,
      'PDF_PARSE_FAILED'
    );
  }

  // Normalize excessive whitespace and line breaks
  const rawText = parsed.text || '';
  const cleanedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Edge case: PDF has little or no extractable text (e.g. scanned image or blank slides)
  if (cleanedText.length < MIN_TEXT_LENGTH) {
    throw new PdfExtractionError(
      'The uploaded PDF contains insufficient extractable text (less than 50 characters). It may contain scanned images or lack selectable text. Please upload a lecture PDF with readable text.',
      400,
      'INSUFFICIENT_TEXT'
    );
  }

  // Edge case: Extremely large text - truncate safely to avoid prompt exhaustion
  if (cleanedText.length > MAX_TEXT_LENGTH) {
    return (
      cleanedText.substring(0, MAX_TEXT_LENGTH) +
      '\n\n[Notice: Lecture text truncated to first 50,000 characters for optimal synthesis.]'
    );
  }

  return cleanedText;
}
