import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  History, 
  Search, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BookOpen, 
  AlertCircle,
  Zap,
  ArrowRight,
  Filter
} from 'lucide-react';

/**
 * Student Attempt History Page Component
 */
export default function AttemptHistory() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PASSED' | 'FAILED'

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Attempt History
  const fetchAttemptHistory = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/attempts`, { headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.attempts)) {
        setAttempts(data.attempts);
      } else {
        throw new Error(data.message || 'Failed to parse attempt history.');
      }
    } catch (err) {
      console.error('AttemptHistory fetch error:', err);
      setError(err.message || 'Failed to load attempt history.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttemptHistory();
  }, [user]);

  // Search & Filter Logic
  const filteredAttempts = useMemo(() => {
    return attempts.filter((attempt) => {
      // Status Filter
      if (filterStatus === 'PASSED' && !attempt.isPassed && !attempt.passed) return false;
      if (filterStatus === 'FAILED' && (attempt.isPassed || attempt.passed)) return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = attempt.quizTitle?.toLowerCase().includes(q);
        const catMatch = attempt.categoryName?.toLowerCase().includes(q);
        return titleMatch || catMatch;
      }

      return true;
    });
  }, [attempts, searchQuery, filterStatus]);

  // Format Time Spent
  const formatTimeSpent = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '0m 0s';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* 1. Header Banner & Search / Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">Assessment Attempt History</h1>
              <p className="text-xs text-slate-400">
                Review all your past quiz attempts, score performance, and detailed solution breakdowns.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Status Filter Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({attempts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('PASSED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === 'PASSED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Passed
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('FAILED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === 'FAILED' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Needs Review
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs outline-none w-full sm:w-44"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchAttemptHistory(true)}
            disabled={isLoading || refreshing}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAttemptHistory(true)}
            className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Loading Skeleton View */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-14 rounded-2xl bg-slate-900/60 border border-slate-800" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xl my-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">No Assessment History Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            You haven't completed any assessment quizzes yet. Start taking quizzes from the catalog to build your attempt log.
          </p>
          <div className="pt-2">
            <Link
              to="/student/quizzes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <BookOpen className="w-4 h-4" />
              <span>Take a Quiz Now</span>
            </Link>
          </div>
        </div>
      ) : (
        /* 3. Modern Dark Table Layout */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Completed Attempts ({filteredAttempts.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Assessment Quiz</th>
                  <th className="py-3.5 px-4">Domain Category</th>
                  <th className="py-3.5 px-4">Score & Percentage</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Time Spent</th>
                  <th className="py-3.5 px-4">Attempt Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAttempts.map((attempt) => {
                  const isPassed = attempt.isPassed || attempt.passed;
                  const dateFormatted = new Date(attempt.completedAt || attempt.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <tr key={attempt.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Quiz Title */}
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {attempt.quizTitle}
                      </td>

                      {/* Domain Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium">
                          {attempt.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Score Percentage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-100">
                            {attempt.score}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Target: {attempt.passingScore || 70}%
                          </span>
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1 ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {isPassed ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                          <span>{isPassed ? 'PASSED' : 'FAILED'}</span>
                        </span>
                      </td>

                      {/* Time Spent */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                        {formatTimeSpent(attempt.timeTaken)}
                      </td>

                      {/* Date Attempted */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {dateFormatted}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/student/quiz-result/${attempt.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Result</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
