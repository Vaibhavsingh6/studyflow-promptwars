import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { StudyPackView } from './components/StudyPackView';
import { checkBackendHealth } from './services/api';
import { StudyPack, FileMetadata } from './types';
import { FileUp, Sparkles, HelpCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStudyPack, setCurrentStudyPack] = useState<StudyPack | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null);

  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      try {
        await checkBackendHealth();
        if (isMounted) setServerConnected(true);
      } catch (e) {
        if (isMounted) setServerConnected(false);
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStudyPackGenerated = (studyPack: StudyPack, file: FileMetadata) => {
    setCurrentStudyPack(studyPack);
    setUploadedFile(file);
    setIsProcessing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetToUpload = () => {
    setCurrentStudyPack(null);
    setUploadedFile(null);
    setIsProcessing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine active workflow step
  const activeStep = currentStudyPack ? 3 : isProcessing ? 2 : 1;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden text-slate-900">
      <Header serverConnected={serverConnected} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* If study pack is ready, show StudyPackView; otherwise show Upload Screen */}
        {currentStudyPack && uploadedFile ? (
          <StudyPackView
            studyPack={currentStudyPack}
            file={uploadedFile}
            onReset={handleResetToUpload}
          />
        ) : (
          <>
            {/* Hero Introduction */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-3.5 shadow-2xs">
                <span>AI Productivity &bull; Lecture PDF &rarr; Notes + Quiz</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                AI-Powered Student Workspace
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
                Turn lengthy lecture slides into high-yield revision summaries and a targeted 5-question comprehension quiz in seconds.
              </p>
            </div>

            {/* 3-Stage Interactive Workflow Indicator */}
            <div className="max-w-2xl mx-auto mb-8 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div
                className={`rounded-xl p-3 sm:p-4 border transition-all ${
                  activeStep === 1
                    ? 'bg-white border-blue-600 shadow-xs ring-1 ring-blue-600'
                    : 'bg-white/60 border-slate-200 opacity-70'
                }`}
              >
                <div className={`flex justify-center mb-1.5 ${activeStep === 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                  <FileUp className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">1. PDF Intake</p>
                <p className={`text-[11px] font-medium mt-0.5 ${activeStep === 1 ? 'text-blue-700 font-semibold' : 'text-slate-400'}`}>
                  {activeStep === 1 ? 'Ready' : 'Completed'}
                </p>
              </div>

              <div
                className={`rounded-xl p-3 sm:p-4 border transition-all ${
                  activeStep === 2
                    ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600'
                    : 'bg-white/60 border-slate-200 opacity-70'
                }`}
              >
                <div className={`flex justify-center mb-1.5 ${activeStep === 2 ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">2. AI Synthesis</p>
                <p className={`text-[11px] font-medium mt-0.5 ${activeStep === 2 ? 'text-indigo-700 font-semibold' : 'text-slate-400'}`}>
                  {activeStep === 2 ? 'Analyzing...' : 'Gemini Engine'}
                </p>
              </div>

              <div
                className={`rounded-xl p-3 sm:p-4 border transition-all ${
                  activeStep === 3
                    ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                    : 'bg-white/60 border-slate-200 opacity-70'
                }`}
              >
                <div className={`flex justify-center mb-1.5 ${activeStep === 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <HelpCircle className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">3. Notes &amp; Quiz</p>
                <p className={`text-[11px] font-medium mt-0.5 ${activeStep === 3 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  5 MCQs Verified
                </p>
              </div>
            </div>

            {/* Primary Interactive File Upload Component */}
            <FileUpload
              onStudyPackGenerated={handleStudyPackGenerated}
              onProcessingChange={setIsProcessing}
            />
          </>
        )}
      </main>

      {/* Clean Minimal Student Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>&copy; StudyFlow &bull; PromptWars MVP &bull; AI Productivity &amp; Automation</p>
          <p>Zero Client Secrets &bull; Strict Schema Validation &bull; 5-Question Quiz Guarantee</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
