import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { StudyPackView } from './components/StudyPackView';
import { checkBackendHealth } from './services/api';
import { StudyPack, FileMetadata } from './types';
import { FileUp, Sparkles, HelpCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetToUpload = () => {
    setCurrentStudyPack(null);
    setUploadedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header serverConnected={serverConnected} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* If study pack is ready, show StudyPackView; otherwise show Upload Screen */}
        {currentStudyPack && uploadedFile ? (
          <StudyPackView
            studyPack={currentStudyPack}
            file={uploadedFile}
            onReset={handleResetToUpload}
          />
        ) : (
          <>
            {/* Workspace Introduction */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-3">
                <span>P0 Workflow: Lecture PDF &rarr; Revision Notes + 5-Question Quiz</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Smart Lecture Study Pack Generator
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                Upload your lecture slides or reading material. StudyFlow extracts the core content and generates a targeted revision summary and 5-question comprehension quiz.
              </p>
            </div>

            {/* 3-Stage Workflow Architecture Tracker */}
            <div className="max-w-2xl mx-auto mb-8 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="bg-white border-2 border-blue-600 rounded-lg p-3 shadow-xs">
                <div className="flex justify-center text-blue-600 mb-1">
                  <FileUp className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">1. PDF Intake</p>
                <p className="text-[11px] text-blue-700 font-medium mt-0.5">Ready</p>
              </div>

              <div className="bg-white border-2 border-blue-600 rounded-lg p-3 shadow-xs">
                <div className="flex justify-center text-blue-600 mb-1">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">2. AI Synthesis</p>
                <p className="text-[11px] text-blue-700 font-medium mt-0.5">Gemini 2.0 Flash</p>
              </div>

              <div className="bg-white border-2 border-blue-600 rounded-lg p-3 shadow-xs">
                <div className="flex justify-center text-blue-600 mb-1">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">3. Notes &amp; Quiz</p>
                <p className="text-[11px] text-blue-700 font-medium mt-0.5">5 MCQs Verified</p>
              </div>
            </div>

            {/* Primary Interactive File Upload Component */}
            <FileUpload onStudyPackGenerated={handleStudyPackGenerated} />
          </>
        )}
      </main>

      {/* Clean Minimal Student Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>&copy; StudyFlow &bull; PromptWars MVP &bull; Phase 2</p>
          <p>Zero Client Secrets &bull; Strict Schema Validation &bull; 5-Question Quiz Guarantee</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
