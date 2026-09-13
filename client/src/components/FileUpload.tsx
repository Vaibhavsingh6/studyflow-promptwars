import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
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
  onProcessingChange?: (isProcessing: boolean) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onStudyPackGenerated,
  onProcessingChange,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'selected' | 'uploading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Strict ref-based lock to prevent duplicate / concurrent submissions
  const isSubmittingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side file validation
  const validateFile = (selectedFile: File): { isValid: boolean; error?: string } => {
    // 1. Check extension and MIME type
    const isPdfExt = selectedFile.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = selectedFile.type === 'application/pdf' || selectedFile.type === '';

    if (!isPdfExt || !isPdfMime) {
      return {
        isValid: false,
        error: `Invalid file "${selectedFile.name}". Only standard PDF documents (.pdf) are supported.`,
      };
    }

    // 2. Check for empty file
    if (selectedFile.size === 0) {
      return {
        isValid: false,
        error: 'The selected PDF is empty (0 bytes). Please select a valid lecture PDF.',
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
    if (isSubmittingRef.current || status === 'uploading') return;

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
    if (isSubmittingRef.current || status === 'uploading') return;
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSubmittingRef.current && status !== 'uploading') {
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

    if (isSubmittingRef.current || status === 'uploading') return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleClear = () => {
    if (isSubmittingRef.current || status === 'uploading') return;
    setFile(null);
    setStatus('idle');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    // Prevent duplicate submission via ref lock and state
    if (!file || isSubmittingRef.current || status === 'uploading') return;

    isSubmittingRef.current = true;
    setStatus('uploading');
    setErrorMessage(null);
    if (onProcessingChange) onProcessingChange(true);

    try {
      const response = await uploadLecturePdf(file);
      setStatus('idle');
      isSubmittingRef.current = false;
      if (onProcessingChange) onProcessingChange(false);
      onStudyPackGenerated(response.studyPack, response.file);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Processing failed. Please check the document and try again.');
      isSubmittingRef.current = false;
      if (onProcessingChange) onProcessingChange(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Zone Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 transition-all">
        {/* Section Heading */}
        <div className="mb-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Upload Lecture PDF
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Upload your course lecture slides or readings. StudyFlow extracts the text and uses Gemini to synthesize revision notes and a 5-question quiz.
          </p>
        </div>

        {/* Hidden Accessible File Input */}
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

        {/* Empty State / Interactive Drag-and-Drop Area */}
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
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              status === 'uploading'
                ? 'opacity-50 cursor-not-allowed border-slate-300'
                : isDragging
                ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20 cursor-pointer'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shadow-xs">
                <UploadCloud className="h-7 w-7" />
              </div>

              <div>
                <p className="text-base font-semibold text-slate-800">
                  <span className="text-blue-600 hover:underline">Click to browse</span> or drag and drop your lecture
                </p>
                <p className="text-xs text-slate-500 mt-1.5">
                  Select any course slides, textbook chapters, or reading notes in PDF format
                </p>
              </div>

              {/* Requirement Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  PDF documents only (.pdf)
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Up to 10 MB limit
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Selected State & In-Flight Processing Card */}
        {file && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50/80 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3.5 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 break-words leading-tight">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-slate-500 font-medium">
                        {formatBytes(file.size)}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs font-medium text-emerald-700 inline-flex items-center">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Valid PDF ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change / Remove Actions (Disabled during upload) */}
                {status !== 'uploading' && (
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Remove file"
                      aria-label="Remove selected file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Processing UX State: "Analyzing your lecture..." */}
              {status === 'uploading' && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center space-x-3 bg-indigo-50/90 border border-indigo-200/80 p-4 rounded-xl text-indigo-950">
                    <Loader2 className="h-6 w-6 text-indigo-600 animate-spin flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900">
                        Analyzing your lecture...
                      </h4>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        Please wait while Gemini processes the lecture text and formulates your study pack.
                      </p>
                    </div>
                  </div>

                  {/* Trustworthy Workflow Steps */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center space-x-2 text-slate-800">
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                      <span>1. Extracting text from lecture document</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-800">
                      <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                      <span>2. Synthesizing revision summary &amp; key concepts with Gemini</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>3. Formulating &amp; validating 5-question comprehension quiz</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button (CTA) */}
            {status !== 'uploading' && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleUpload}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm hover:shadow-md cursor-pointer"
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
            setStatus(file ? 'selected' : 'idle');
          }}
        />
      )}
    </div>
  );
};
