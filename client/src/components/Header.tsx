import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  serverConnected: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({ serverConnected }) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">StudyFlow</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                PromptWars MVP
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">AI-Powered Student Workspace</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline font-medium">Zero-Leak Backend Security</span>
            <span className="sm:hidden font-medium">Secure</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span
              className={`h-2 w-2 rounded-full ${
                serverConnected === true
                  ? 'bg-emerald-500'
                  : serverConnected === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline">
              {serverConnected === true
                ? 'Backend Ready'
                : serverConnected === false
                ? 'Backend Disconnected'
                : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
