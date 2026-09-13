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
  Check,
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
  // Track selected option per question (index 0 to 4)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  // Track whether quiz has been submitted
  const [isSubmitted, setIsSubmitted] = useState(false);

  const totalQuestions = studyPack.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === totalQuestions;

  const handleSelectOption = (questionIndex: number, option: string) => {
    if (isSubmitted) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    // Scroll smoothly to quiz top
    const quizSection = document.getElementById('practice-quiz-section');
    if (quizSection) {
      quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Compute exact score (0 to 5)
  const score = studyPack.questions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctAnswer ? acc + 1 : acc;
  }, 0);

  const percentage = Math.round((score / totalQuestions) * 100);
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-16">
      {/* Top Source Document Context Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900 truncate">{file.name}</span>
              <span className="text-xs text-slate-500 font-medium">({file.sizeFormatted})</span>
            </div>
            <p className="text-xs text-emerald-700 font-medium flex items-center mt-0.5">
              <Sparkles className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span>AI Study Pack generated from lecture content</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex-shrink-0"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>Upload Another PDF</span>
        </button>
      </div>

      {/* Main Title Section */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Lecture Revision Pack</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 break-words">
          {studyPack.title}
        </h1>
      </div>

      {/* 1. Revision Summary Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
          <BookmarkCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <h2 className="text-lg font-bold tracking-tight">Revision Summary</h2>
        </div>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed break-words">
          {studyPack.summary}
        </p>
      </section>

      {/* 2. Key Takeaways Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <h2 className="text-lg font-bold tracking-tight">Key Takeaways &amp; Concepts</h2>
        </div>
        <ul className="space-y-3">
          {studyPack.keyPoints.map((point, index) => (
            <li key={index} className="flex items-start space-x-3.5 text-sm text-slate-800">
              <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="leading-relaxed break-words flex-1">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Practice Quiz Section */}
      <section id="practice-quiz-section" className="space-y-6 pt-2">
        {/* Quiz Header & Live Progress Indicator */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 text-slate-900">
              <HelpCircle className="h-5 w-5 text-indigo-600 flex-shrink-0" />
              <h2 className="text-xl font-bold tracking-tight">Practice Quiz (5 Questions)</h2>
            </div>
            <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-fit">
              Progress: {answeredCount} of {totalQuestions} Answered
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-500">
            Select one answer for each question based on the lecture material, then check your results.
          </p>

          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isSubmitted
                  ? 'bg-emerald-500'
                  : allAnswered
                  ? 'bg-blue-600'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              role="progressbar"
              aria-valuenow={answeredCount}
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
            />
          </div>
        </div>

        {/* Score Banner (Shown once submitted) */}
        {isSubmitted && (
          <div
            role="status"
            className={`border rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs transition-all ${
              score >= 4
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : score >= 3
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                  score >= 4
                    ? 'bg-emerald-600 text-white'
                    : score >= 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  Quiz Completed: {score} of {totalQuestions} Correct ({percentage}%)
                </h3>
                <p className="text-xs sm:text-sm mt-0.5 opacity-90">
                  {score === 5
                    ? 'Outstanding! You answered every question correctly.'
                    : score >= 3
                    ? 'Solid grasp of the core concepts! Review the explanations below.'
                    : 'Keep reviewing the notes above and give the quiz another try.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetQuiz}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 shadow-xs cursor-pointer flex-shrink-0 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retake Quiz</span>
            </button>
          </div>
        )}

        {/* 5 Questions List */}
        <div className="space-y-6">
          {studyPack.questions.map((q, qIdx) => {
            const selectedOpt = selectedAnswers[qIdx];
            const isCorrect = selectedOpt === q.correctAnswer;

            return (
              <div
                key={qIdx}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4 transition-all"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 mb-1.5">
                      Question {qIdx + 1} of {totalQuestions}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                      {q.question}
                    </h3>
                  </div>

                  {/* Submission Status Badge */}
                  {isSubmitted && (
                    <span className="flex-shrink-0 mt-0.5">
                      {isCorrect ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                          <XCircle className="h-4 w-4 mr-1 text-rose-600" />
                          Incorrect
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isOptionSelected = selectedOpt === opt;
                    const isOptionCorrect = opt === q.correctAnswer;

                    let btnStyle =
                      'border-slate-200 hover:border-slate-300 bg-slate-50/70 text-slate-800';

                    if (!isSubmitted) {
                      if (isOptionSelected) {
                        btnStyle =
                          'border-blue-600 bg-blue-50/90 text-blue-950 font-semibold ring-2 ring-blue-500 shadow-xs';
                      }
                    } else {
                      if (isOptionCorrect) {
                        btnStyle =
                          'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500';
                      } else if (isOptionSelected && !isCorrect) {
                        btnStyle =
                          'border-rose-400 bg-rose-50 text-rose-950 line-through ring-2 ring-rose-400';
                      } else {
                        btnStyle =
                          'border-slate-200 bg-slate-50/40 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(qIdx, opt)}
                        disabled={isSubmitted}
                        className={`text-left p-3.5 rounded-xl border text-sm transition-all duration-150 flex items-start space-x-3 cursor-pointer disabled:cursor-default ${btnStyle}`}
                      >
                        <span
                          className={`font-bold text-xs rounded-lg h-6 w-6 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isOptionSelected && !isSubmitted
                              ? 'bg-blue-600 text-white'
                              : isOptionCorrect && isSubmitted
                              ? 'bg-emerald-600 text-white'
                              : isOptionSelected && isSubmitted && !isCorrect
                              ? 'bg-rose-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          {optionLabels[optIdx]}
                        </span>
                        <span className="flex-1 mt-0.5 break-words leading-relaxed">{opt}</span>

                        {isOptionSelected && !isSubmitted && (
                          <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* AI Explanation Box (Revealed after submission) */}
                {isSubmitted && (
                  <div className="text-xs bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200 space-y-1.5 mt-2">
                    <p className="font-bold text-slate-800 flex items-center">
                      <span className="mr-1.5">Explanation:</span>
                      <span className="font-normal text-slate-600">
                        Correct Answer is{' '}
                        <strong className="text-slate-900 font-semibold">
                          ({optionLabels[q.options.indexOf(q.correctAnswer)]}) {q.correctAnswer}
                        </strong>
                      </span>
                    </p>
                    <p className="text-slate-600 leading-relaxed break-words">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Quiz Action Section (Hidden once submitted) */}
        {!isSubmitted && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 text-center sm:text-left">
              {allAnswered ? (
                <span className="font-semibold text-emerald-700 inline-flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                  All 5 questions answered. Ready to check your score!
                </span>
              ) : (
                <span>
                  Please select an answer for all 5 questions to submit ({answeredCount}/5 answered).
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (allAnswered) {
                  setIsSubmitted(true);
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }
              }}
              disabled={!allAnswered}
              className="w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              Check Quiz Answers
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
