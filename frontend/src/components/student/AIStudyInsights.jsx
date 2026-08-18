import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Loader2, 
  RefreshCw, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

/**
 * Post-Quiz AI Study Guide & Recommendations Component
 */
export default function AIStudyInsights({ 
  attemptId, 
  isPassed = false, 
  initialFeedback = null 
}) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [isLoading, setIsLoading] = useState(!initialFeedback);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch or Generate AI Diagnostic Feedback
  const fetchFeedback = useCallback(async () => {
    if (!attemptId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to load AI study guide (${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.feedback) {
        setFeedback(data.feedback);
      } else {
        throw new Error(data.message || 'AI feedback service unavailable.');
      }
    } catch (err) {
      console.error('Fetch AI feedback error:', err);
      setError(err.message || 'Could not generate AI study insights.');
    } finally {
      setIsLoading(false);
    }
  }, [attemptId, API_BASE_URL]);

  useEffect(() => {
    if (initialFeedback) {
      setFeedback(initialFeedback);
      setIsLoading(false);
    } else {
      fetchFeedback();
    }
  }, [initialFeedback, fetchFeedback]);

  return (
    <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-5 animate-fade-in font-sans text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                AI Diagnostic Insights & Study Guide
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Gemini Powered
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized performance analysis and tailored revision roadmap.
            </p>
          </div>
        </div>

        {/* Retry Action Button if error or manual refresh */}
        {error && (
          <button
            type="button"
            onClick={fetchFeedback}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Retry AI Analysis</span>
          </button>
        )}
      </div>

      {/* Loading Skeleton / Shimmer Card */}
      {isLoading && (
        <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800 animate-pulse">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
            Synthesizing Diagnostic Insights
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Analyzing your assessment responses, evaluating option selections, and crafting a personalized revision roadmap...
          </p>
        </div>
      )}

      {/* Error Fallback */}
      {!isLoading && error && !feedback && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{error} Standard solution review remains available below.</span>
          </div>
          <button
            type="button"
            onClick={fetchFeedback}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Core Content Sections (Rendered once loaded) */}
      {!isLoading && feedback && (
        <div className="space-y-5">
          {/* 1. Performance Analytical Summary Box */}
          {feedback.summary && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                Analytical Summary
              </span>
              <p className="text-slate-300 font-medium leading-normal">{feedback.summary}</p>
            </div>
          )}

          {/* 2. 3-Column Segmented Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Section A: Key Strengths */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Strengths
              </span>
              <ul className="space-y-2 text-xs">
                {feedback.strengths && feedback.strengths.length > 0 ? (
                  feedback.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-emerald-200/90 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic text-[11px]">No specific strengths recorded.</li>
                )}
              </ul>
            </div>

            {/* Section B: Focus / Weak Areas */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Focus Areas
              </span>
              <ul className="space-y-2 text-xs">
                {feedback.weakAreas && feedback.weakAreas.length > 0 ? (
                  feedback.weakAreas.map((weakness, i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-200/90 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-emerald-300 font-medium text-[11px]">No critical weak areas identified!</li>
                )}
              </ul>
            </div>

            {/* Section C: Revision Roadmap / Actionable Next Steps */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-indigo-400" /> Revision Roadmap
              </span>
              <ul className="space-y-2 text-xs">
                {feedback.recommendations && feedback.recommendations.length > 0 ? (
                  feedback.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-indigo-200/90 leading-snug">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic text-[11px]">Continue practicing advanced concepts.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
