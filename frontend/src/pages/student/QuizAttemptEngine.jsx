import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  RefreshCw 
} from 'lucide-react';

/**
 * Fullscreen Live Test Engine & Question Navigator Component
 */
export default function QuizAttemptEngine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Engine state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const autoSubmitTriggeredRef = useRef(false);

  // Fetch Quiz Questions
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/student/quizzes/${id}/questions`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load assessment questions (${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.quiz) {
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
        
        // Initialize timer (timeLimit in minutes -> seconds)
        const initialSeconds = (data.quiz.timeLimit || 30) * 60;
        setTimeLeft(initialSeconds);
        setIsTimerRunning(true);
      }
    } catch (err) {
      console.error('Fetch attempt questions error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, user, getToken, API_BASE_URL]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handle Final Submission to POST /api/attempts/submit
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting || !quiz) return;
    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = {
        'Content-Type': 'application/json',
        'x-clerk-user-id': user?.id || ''
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const totalAllocatedSeconds = (quiz.timeLimit || 30) * 60;
      const timeSpentSeconds = Math.max(0, totalAllocatedSeconds - timeLeft);

      const res = await fetch(`${API_BASE_URL}/attempts/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          quizId: quiz.id,
          timeSpentSeconds,
          answers: selectedAnswers
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result?.attemptId) {
          navigate(`/student/quiz-result/${data.result.attemptId}`);
          return;
        }
      }
      navigate('/student/history');
    } catch (err) {
      console.error('Submission error:', err);
      navigate('/student/history');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, quiz, timeLeft, selectedAnswers, user, getToken, API_BASE_URL, navigate]);

  // Live Timer Countdown Effect
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!autoSubmitTriggeredRef.current) {
            autoSubmitTriggeredRef.current = true;
            handleFinalSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, handleFinalSubmit]);

  // Format Time Left (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Option select handler
  const handleOptionSelect = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // Flag toggle handler
  const handleToggleFlag = (questionId) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Loading Assessment Engine & Questions...
          </p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-100">Engine Initialization Error</h2>
          <p className="text-xs text-slate-400">{error || 'Could not start test session.'}</p>
          <button
            type="button"
            onClick={() => navigate('/student/quizzes')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer"
          >
            Return to Quiz Catalog
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const flaggedCount = flaggedQuestions.size;
  const unansweredCount = totalQuestions - answeredCount;

  // Fallback demo question if questions array is empty
  const activeQ = currentQuestion || {
    id: 'demo-1',
    text: 'Assessment questions are currently being loaded by administrator. Choose a demo choice to test engine interface:',
    options: [
      { id: 'opt-a', text: 'Option A: Test Answer Choice 1' },
      { id: 'opt-b', text: 'Option B: Test Answer Choice 2' },
      { id: 'opt-c', text: 'Option C: Test Answer Choice 3' },
      { id: 'opt-d', text: 'Option D: Test Answer Choice 4' }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between select-none">
      {/* 1. Top Navigation & Live Countdown Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-xl px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {quiz.categoryName}
            </span>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 line-clamp-1">
              {quiz.title}
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Question <span className="font-bold text-slate-200">{currentQuestionIndex + 1}</span> of {totalQuestions || 1}
          </p>
        </div>

        {/* Live Timer Display */}
        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 rounded-2xl border flex items-center gap-2 font-mono text-sm font-bold shadow-lg transition-colors ${
            timeLeft < 60
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
              : timeLeft < 300
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Test</span>
          </button>
        </div>
      </header>

      {/* Main Body: Question Area & Right Navigation Palette */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 2. Active Question Display Area (Left 3 Columns) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            {/* Question Header & Flag Action */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <span className="px-3 py-1 rounded-xl bg-slate-950 text-indigo-400 border border-slate-800 text-xs font-mono font-bold">
                Q{currentQuestionIndex + 1} of {totalQuestions || 1}
              </span>

              <button
                type="button"
                onClick={() => handleToggleFlag(activeQ.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  flaggedQuestions.has(activeQ.id)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-400 hover:border-amber-500/30'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedQuestions.has(activeQ.id) ? 'Flagged for Review' : 'Flag for Review'}</span>
              </button>
            </div>

            {/* Question Statement Text */}
            <h2 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
              {activeQ.text}
            </h2>

            {/* Option Choices List */}
            <div className="space-y-3 pt-2">
              {activeQ.options?.map((option, idx) => {
                const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedAnswers[activeQ.id] === option.id;

                return (
                  <button
                    key={option.id || idx}
                    type="button"
                    onClick={() => handleOptionSelect(activeQ.id, option.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100 shadow-md shadow-indigo-600/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}>
                      {optionLabel}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-relaxed">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Navigation Control Bar */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {answeredCount} of {totalQuestions || 1} Answered
            </span>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Assessment</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Interactive Question Palette (Right Sidebar Grid) */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-5 h-fit">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Question Palette
            </h3>
          </div>

          {/* Palette Status Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Answered ({answeredCount})
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Flagged ({flaggedCount})
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" /> Unanswered ({unansweredCount})
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500" /> Current Active
            </div>
          </div>

          {/* Question Numbers Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 pt-2">
            {(questions.length > 0 ? questions : [activeQ]).map((q, idx) => {
              const isAnswered = Boolean(selectedAnswers[q.id]);
              const isFlagged = flaggedQuestions.has(q.id);
              const isActive = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-10 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                    isActive ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-600/30 text-white' : ''
                  } ${
                    isFlagged
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : !isActive
                      ? 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700'
                      : ''
                  }`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* 4. Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center gap-3 text-slate-100">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Submit Assessment Confirmation</h3>
                <p className="text-xs text-slate-400">Review your test telemetry before finalizing.</p>
              </div>
            </div>

            {/* Submission Telemetry Breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Answered</span>
                <span className="text-base font-mono font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Flagged</span>
                <span className="text-base font-mono font-bold text-amber-400">{flaggedCount}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Unanswered</span>
                <span className="text-base font-mono font-bold text-slate-400">{unansweredCount}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              Are you sure you want to submit your assessment answers now? You will not be able to modify options after submitting.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Back to Test
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Finalizing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
