import React, { useState } from 'react';
import { StudyPack, FileMetadata } from '../types';
import {
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  UploadCloud,
  Award,
  Sparkles,
  BookmarkCheck,
} from 'lucide-react';

interface StudyPackViewProps {
  studyPack: StudyPack;
  file: FileMetadata;
  onReset: () => void;
}

export const StudyPackView: React.FC<StudyPackViewProps> = ({
  studyPack,
  file,
  onReset,
}) => {
  // Track selected option per question (0-4)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  // Track whether the quiz has been submitted for evaluation
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectOption = (questionIndex: number, option: string) => {
    if (isSubmitted) return; // Prevent changing after submission until retake
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const allAnswered = studyPack.questions.every((_, idx) => selectedAnswers[idx] !== undefined);

  // Calculate score
  const score = studyPack.questions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctAnswer ? acc + 1 : acc;
  }, 0);

  const percentage = Math.round((score / studyPack.questions.length) * 100);

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-16">
      {/* Top Source Document Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-900">{file.name}</span>
              <span className="text-xs text-slate-500">({file.sizeFormatted})</span>
            </div>
            <p className="text-xs text-emerald-700 font-medium flex items-center mt-0.5">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              AI Study Pack synthesized directly from your lecture
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Another PDF</span>
        </button>
      </div>

      {/* Main Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {studyPack.title}
        </h1>
      </div>

      {/* 1. Summary Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-900">
          <BookmarkCheck className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold">Revision Summary</h2>
        </div>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          {studyPack.summary}
        </p>
      </section>

      {/* 2. Key Points Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold">Key Takeaways &amp; Concepts</h2>
        </div>
        <ul className="space-y-2.5">
          {studyPack.keyPoints.map((point, index) => (
            <li key={index} className="flex items-start space-x-3 text-sm text-slate-800">
              <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="leading-normal">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Practice Quiz Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2 text-slate-900">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold">Practice Quiz (5 Questions)</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Test your comprehension of this lecture
          </span>
        </div>

        {/* Score Banner (when submitted) */}
        {isSubmitted && (
          <div
            role="status"
            className={`border rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-xs ${
              score >= 4
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : score >= 3
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Award className="h-7 w-7 flex-shrink-0" />
              <div>
                <p className="text-base font-bold">
                  Quiz Completed: {score} of {studyPack.questions.length} Correct ({percentage}%)
                </p>
                <p className="text-xs mt-0.5 opacity-90">
                  {score === 5
                    ? 'Outstanding! You have mastered the key concepts in this lecture.'
                    : score >= 3
                    ? 'Good progress! Review the explanations below to reinforce weaker areas.'
                    : 'Keep studying! Read through the explanations and give it another try.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetQuiz}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 shadow-xs cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retake</span>
            </button>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {studyPack.questions.map((q, qIdx) => {
            const selectedOpt = selectedAnswers[qIdx];
            const isCorrect = selectedOpt === q.correctAnswer;

            return (
              <div
                key={qIdx}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                    <span className="text-indigo-600 font-bold mr-1.5">Q{qIdx + 1}.</span>
                    {q.question}
                  </h3>
                  {isSubmitted && (
                    <span className="ml-3 flex-shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600" />
                      )}
                    </span>
                  )}
                </div>

                {/* 4 Options */}
                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isOptionSelected = selectedOpt === opt;
                    const isOptionCorrect = opt === q.correctAnswer;

                    let btnStyle = 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-800';

                    if (!isSubmitted) {
                      if (isOptionSelected) {
                        btnStyle = 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600';
                      }
                    } else {
                      if (isOptionCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-500';
                      } else if (isOptionSelected && !isCorrect) {
                        btnStyle = 'border-rose-400 bg-rose-50 text-rose-950 line-through ring-1 ring-rose-400';
                      } else {
                        btnStyle = 'border-slate-200 bg-slate-50/40 text-slate-400 opacity-70';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(qIdx, opt)}
                        disabled={isSubmitted}
                        className={`text-left p-3 rounded-lg border text-sm transition-all duration-150 flex items-start space-x-3 cursor-pointer disabled:cursor-default ${btnStyle}`}
                      >
                        <span className="font-semibold text-xs rounded-md bg-white border border-slate-200 h-6 w-6 flex items-center justify-center flex-shrink-0 text-slate-700">
                          {optionLabels[optIdx]}
                        </span>
                        <span className="flex-1 mt-0.5">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box (Revealed after submission) */}
                {isSubmitted && (
                  <div className="text-xs bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1 mt-3">
                    <p className="font-bold text-slate-700">
                      {isCorrect ? 'Correct!' : 'Incorrect.'}{' '}
                      <span className="font-normal text-slate-600">
                        Answer: <strong className="text-slate-900">{q.correctAnswer}</strong>
                      </span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Quiz Action Bar */}
        {!isSubmitted && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              {allAnswered
                ? 'All 5 questions answered. Ready to check results!'
                : `Answered ${Object.keys(selectedAnswers).length} of 5 questions.`}
            </span>
            <button
              type="button"
              onClick={() => setIsSubmitted(true)}
              disabled={!allAnswered}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
            >
              Check Quiz Answers
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
