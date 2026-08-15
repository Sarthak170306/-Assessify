import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  ArrowLeft, 
  Clock, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle, 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  FileText 
} from 'lucide-react';

/**
 * Quiz Pre-start & Instructions Screen Component
 */
export default function QuizDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Quiz Details
  const fetchQuizDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/student/quizzes/${id}`, { headers });
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('This assessment was not found or is no longer published.');
        }
        throw new Error(`Failed to load assessment briefing (${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.quiz) {
        setQuiz(data.quiz);
      }
    } catch (err) {
      console.error('Fetch quiz details error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, user, getToken, API_BASE_URL]);

  useEffect(() => {
    fetchQuizDetails();
  }, [fetchQuizDetails]);

  const handleStartAttempt = () => {
    if (!isReady || !quiz) return;
    navigate(`/student/quiz/${quiz.id}/attempt`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in font-sans text-slate-100 pb-16">
      {/* 1. Back Navigation Button */}
      <div>
        <Link
          to="/student/quizzes"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessments</span>
        </Link>
      </div>

      {isLoading ? (
        /* Skeleton Pulse Loader */
        <div className="space-y-6 animate-pulse">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
            <div className="w-24 h-6 rounded-full bg-slate-800" />
            <div className="w-64 h-8 rounded bg-slate-800" />
            <div className="w-full h-12 rounded bg-slate-800/60" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-slate-900/60 border border-slate-800" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-slate-900/60 border border-slate-800" />
        </div>
      ) : error || !quiz ? (
        /* Error State Banner */
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Unable to Load Assessment</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {error || 'The requested quiz details could not be retrieved.'}
          </p>
          <button
            type="button"
            onClick={fetchQuizDetails}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      ) : (
        /* Main Briefing Screen */
        <>
          {/* 2. Hero Header Card */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-4">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {quiz.categoryName || 'General Domain'}
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Assessment Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
              {quiz.title}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
              {quiz.description || 'Welcome to this skill assessment. Please carefully review the test metrics, passing score threshold, and examination guidelines before initiating your timed session.'}
            </p>
          </div>

          {/* 3. Quick Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1: Duration */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl space-y-1">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Time Limit</span>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                {quiz.timeLimit} Minutes
              </h3>
            </div>

            {/* Metric 2: Total Questions */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl space-y-1">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mb-2">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Questions</span>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                {quiz.totalQuestions} MCQs
              </h3>
            </div>

            {/* Metric 3: Passing Score */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl space-y-1">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mb-2">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Passing Score</span>
              <h3 className="text-base font-bold text-emerald-400 font-mono">
                {quiz.passingScore}% Target
              </h3>
            </div>

            {/* Metric 4: Format / Anti-cheat */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl space-y-1">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Format</span>
              <h3 className="text-xs font-bold text-slate-200 mt-1">
                Timed Session
              </h3>
            </div>
          </div>

          {/* 4. Assessment Rules & Guidelines Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-5">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Assessment Rules & Guidelines
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">1</span>
                <p className="leading-relaxed">
                  <strong className="text-slate-100">Timer Policy:</strong> Once started, the assessment countdown timer runs continuously and cannot be paused.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">2</span>
                <p className="leading-relaxed">
                  <strong className="text-slate-100">Question Format:</strong> All questions are multiple choice (MCQs). Select the single best answer for each statement.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">3</span>
                <p className="leading-relaxed">
                  <strong className="text-slate-100">Question Navigation:</strong> You can jump freely between questions using the Question Palette before submitting.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">4</span>
                <p className="leading-relaxed">
                  <strong className="text-slate-100">Auto-Submission:</strong> When the time limit expires, your attempt will automatically finalize and submit all selected answers.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">5</span>
                <p className="leading-relaxed">
                  <strong className="text-slate-100">Integrity Guidelines:</strong> Avoid refreshing the page or navigating away during your active attempt to prevent submission loss.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Readiness Checkbox & Entry CTA */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <label className="flex items-start gap-3.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={isReady}
                onChange={(e) => setIsReady(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-slate-300 group-hover:text-slate-100 transition-colors font-medium">
                I have read all assessment instructions and guidelines, and I am ready to begin my timed test session.
              </span>
            </label>

            <button
              type="button"
              disabled={!isReady}
              onClick={handleStartAttempt}
              className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer ${
                isReady
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-[1.01]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <PlayCircle className="w-5 h-5" />
              <span>Start Assessment Now</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
