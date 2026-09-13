import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X, ArrowRight, Loader2 } from 'lucide-react';
import { StudyPack, FileMetadata } from '../types';
import { uploadLecturePdf } from '../services/api';
import { StatusAlert } from './StatusAlert';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface FileUploadProps {
  onStudyPackGenerated: (studyPack: StudyPack, file: FileMetadata) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onStudyPackGenerated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'selected' | 'uploading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side file validation
  const validateFile = (selectedFile: File): { isValid: boolean; error?: string } => {
    // 1. Check extension and MIME type
    const isPdfExt = selectedFile.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = selectedFile.type === 'application/pdf' || selectedFile.type === '';

    if (!isPdfExt || !isPdfMime) {
      return {
        isValid: false,
        error: `Invalid file type "${selectedFile.name}". Only PDF documents (.pdf) are supported.`,
      };
    }

    // 2. Check for empty file
    if (selectedFile.size === 0) {
      return {
        isValid: false,
        error: 'The selected PDF is empty (0 bytes). Please upload a valid document.',
      };
    }

    // 3. Check file size limit (10MB)
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        error: `File is too large (${formatBytes(selectedFile.size)}). The maximum allowed size is 10 MB.`,
      };
    }

    return { isValid: true };
  };

  const handleFileSelection = (candidateFile: File) => {
    if (status === 'uploading') return; // Prevent change during active processing

    setErrorMessage(null);

    const validation = validateFile(candidateFile);
    if (!validation.isValid) {
      setStatus('error');
      setErrorMessage(validation.error || 'Invalid file.');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFile(candidateFile);
    setStatus('selected');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (status === 'uploading') return;
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== 'uploading') {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (status === 'uploading') return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleClear = () => {
    if (status === 'uploading') return;
    setFile(null);
    setStatus('idle');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    // Edge case 13: Prevent duplicate submission while already processing
    if (!file || status === 'uploading') return;

    setStatus('uploading');
    setErrorMessage(null);

    try {
      const response = await uploadLecturePdf(file);
      setStatus('idle');
      onStudyPackGenerated(response.studyPack, response.file);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Processing failed. Please check the document and try again.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Zone Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Upload Lecture PDF</h2>
          <p className="text-sm text-slate-500 mt-1">
            Provide your course slides or reading material. StudyFlow will extract the content and generate a concise revision summary and 5-question quiz.
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          disabled={status === 'uploading'}
          className="hidden"
          id="pdf-upload-input"
          aria-label="Upload lecture PDF"
        />

        {/* Interactive Dropzone (Empty or Dragging State) */}
        {!file && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (status !== 'uploading') {
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (status === 'uploading') return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              status === 'uploading'
                ? 'opacity-50 cursor-not-allowed border-slate-300'
                : isDragging
                ? 'border-blue-500 bg-blue-50/70 cursor-pointer'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 cursor-pointer'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  <span className="text-blue-600 underline underline-offset-2">Click to browse</span> or drag and drop your PDF
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported format: <span className="font-medium text-slate-700">PDF (.pdf)</span> &bull; Maximum size:{' '}
                  <span className="font-medium text-slate-700">10 MB</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Selected / Processing State */}
        {file && (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate mr-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {status !== 'uploading' && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      title="Remove file"
                      aria-label="Remove selected file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* In-Flight Processing Message (Required UX: "Analyzing your lecture...") */}
            {status === 'uploading' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center space-x-3 text-indigo-700 bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
                  <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Analyzing your lecture...</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Extracting text and generating revision notes &amp; quiz with Gemini...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action Button (Disabled during submission to prevent duplicates) */}
            {status !== 'uploading' && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleUpload}
                  className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors duration-150 cursor-pointer shadow-sm"
                >
                  <span>Generate Study Pack</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Alert Display */}
      {status === 'error' && errorMessage && (
        <StatusAlert
          type="error"
          title="Analysis Error"
          message={errorMessage}
          onDismiss={() => {
            setErrorMessage(null);
            setStatus('idle');
          }}
        />
      )}
    </div>
  );
};
