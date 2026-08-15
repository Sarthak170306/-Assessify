import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ArrowLeft, 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  FileText, 
  HelpCircle, 
  Check, 
  X 
} from 'lucide-react';

/**
 * Post-Quiz Result Breakdown & Performance Analytics Component
 */
export default function QuizResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [attempt, setAttempt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'CORRECT' | 'INCORRECT'

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Attempt Result Details
  const fetchAttemptDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load assessment result (${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.attempt) {
        setAttempt(data.attempt);
      }
    } catch (err) {
      console.error('Fetch attempt details error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [attemptId, user, getToken, API_BASE_URL]);

  useEffect(() => {
    fetchAttemptDetails();
  }, [fetchAttemptDetails]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-6">
        <div className="h-48 rounded-3xl bg-slate-900/60 border border-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
        <div className="h-64 rounded-3xl bg-slate-900/60 border border-slate-800" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-100">Result Telemetry Error</h2>
        <p className="text-xs text-slate-400">{error || 'Could not retrieve attempt results.'}</p>
        <button
          type="button"
          onClick={() => navigate('/student/quizzes')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer"
        >
          Return to Quiz Catalog
        </button>
      </div>
    );
  }

  const isPassed = attempt.passed;
  const filteredQuestions = (attempt.questions || []).filter((q) => {
    if (filterTab === 'CORRECT') return q.isCorrect;
    if (filterTab === 'INCORRECT') return !q.isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in font-sans text-slate-100 pb-16">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/student/quizzes"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>

        <Link
          to={`/student/quizzes/${attempt.quizId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake Assessment</span>
        </Link>
      </div>

      {/* 1. Hero Scorecard Banner */}
      <div className={`border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-4 ${
        isPassed
          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-slate-900/60 border-emerald-500/30'
          : 'bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-slate-900/60 border-rose-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-950/60 border border-slate-800">
              <span className="text-indigo-400">{attempt.categoryName}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
              {isPassed ? '🎉 Congratulations! You Passed!' : '⚠️ Needs Improvement - Keep Practicing!'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300">
              {isPassed 
                ? `You successfully met the passing criteria of ${attempt.passingScore}% on "${attempt.quizTitle}".`
                : `You fell short of the ${attempt.passingScore}% passing score. Review the solutions below and attempt again.`}
            </p>
          </div>

          {/* Dynamic Score Ring / Circle */}
          <div className="shrink-0 text-center bg-slate-950/80 border border-slate-800 p-5 rounded-3xl min-w-[120px]">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono" style={{ color: isPassed ? '#10b981' : '#f43f5e' }}>
              {attempt.score}%
            </span>
            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
              Final Score
            </span>
          </div>
        </div>
      </div>

      {/* 2. Performance KPI Metric Cards (4-Grid Layout) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Score & Percentage */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl space-y-1">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mb-2">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Total Score</span>
          <h3 className="text-lg font-bold text-slate-100 font-mono">{attempt.score}%</h3>
          <span className="text-[11px] text-slate-400 font-mono">Target: {attempt.passingScore}%</span>
        </div>

        {/* Card 2: Correct Answers */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl space-y-1">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Correct Answers</span>
          <h3 className="text-lg font-bold text-emerald-400 font-mono">{attempt.correctCount} / {attempt.totalQuestions}</h3>
          <span className="text-[11px] text-slate-400">Correctly answered</span>
        </div>

        {/* Card 3: Incorrect Answers */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl space-y-1">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 w-fit mb-2">
            <XCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Incorrect</span>
          <h3 className="text-lg font-bold text-rose-400 font-mono">{attempt.incorrectCount} / {attempt.totalQuestions}</h3>
          <span className="text-[11px] text-slate-400">Needs review</span>
        </div>

        {/* Card 4: Total Time */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl space-y-1">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Allocated Time</span>
          <h3 className="text-lg font-bold text-slate-200 font-mono">{attempt.timeLimit} Mins</h3>
          <span className="text-[11px] text-slate-400 font-mono">Timed Session</span>
        </div>
      </div>

      {/* 3. Question-by-Question Solution Review Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Detailed Solutions & Explanations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review correct answers, your choices, and explanation notes.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({attempt.questions?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('CORRECT')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'CORRECT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Correct ({attempt.correctCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('INCORRECT')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'INCORRECT' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Incorrect ({attempt.incorrectCount})
            </button>
          </div>
        </div>

        {/* Question Review Cards */}
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No questions found matching your filter selection.
            </p>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-md"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3">
                  <span className="px-3 py-1 rounded-xl bg-slate-900 text-indigo-400 border border-slate-800 text-xs font-mono font-bold">
                    Q{idx + 1}
                  </span>

                  {q.isCorrect ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Correct (+{q.points} pt)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Incorrect
                    </span>
                  )}
                </div>

                {/* Statement */}
                <h4 className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
                  {q.text}
                </h4>

                {/* Option Choices List */}
                <div className="space-y-2 pt-1">
                  {q.options?.map((opt, oIdx) => {
                    const optLabel = String.fromCharCode(65 + oIdx);
                    const isSelected = q.selectedOptionId === opt.id;
                    const isCorrectOpt = opt.isCorrect || q.correctOptionId === opt.id;

                    let optionStyle = 'bg-slate-900/60 border-slate-800 text-slate-300';
                    if (isCorrectOpt) {
                      optionStyle = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-sm';
                    } else if (isSelected && !q.isCorrect) {
                      optionStyle = 'bg-rose-500/10 border-rose-500/50 text-rose-300 shadow-sm';
                    }

                    return (
                      <div
                        key={opt.id || oIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                            isCorrectOpt
                              ? 'bg-emerald-500 text-white'
                              : isSelected
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-900 border border-slate-800 text-slate-400'
                          }`}>
                            {optLabel}
                          </span>
                          <span className="font-medium leading-relaxed">{opt.text}</span>
                        </div>

                        {isCorrectOpt && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0">
                            ✓ Correct Answer
                          </span>
                        )}
                        {isSelected && !isCorrectOpt && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 shrink-0">
                            ✕ Your Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Explanation Box */}
                {q.explanation && (
                  <div className="bg-indigo-950/40 border border-indigo-800/60 p-4 rounded-xl text-indigo-200 text-xs space-y-1 mt-3">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Rationale & Explanation
                    </span>
                    <p className="leading-relaxed text-indigo-200/90">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
