import { PdfProcessSuccessResponse, ApiErrorResponse } from '../types';

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * Uploads lecture PDF to the backend intake pipeline for validation and preprocessing.
 */
export async function uploadLecturePdf(file: File): Promise<PdfProcessSuccessResponse> {
  const formData = new FormData();
  formData.append('pdf', file);

  try {
    const response = await fetch('/api/process-pdf', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error || `Upload failed with status ${response.status}`,
        errorData.code
      );
    }

    return data as PdfProcessSuccessResponse;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or parse error fallback
    throw new ApiError(
      err?.message || 'Unable to connect to server. Please check your connection and try again.'
    );
  }
}

/**
 * Verifies backend connectivity via health check.
 */
export async function checkBackendHealth(): Promise<{ status: string; phase: string }> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    return await response.json();
  } catch (err: any) {
    throw new ApiError('Backend service is unreachable.');
  }
}
