import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  BookOpen, 
  Trophy, 
  History, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Award,
  Layers,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Lightbulb,
  Clock,
  Eye
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

/**
 * Custom Dark Tooltip for Mini Chart
 */
const MiniChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs font-sans space-y-1">
        <p className="font-bold text-slate-100">{data.quizTitle || label}</p>
        <p className="text-indigo-400 font-mono font-semibold">Score: {data.scorePercentage}%</p>
      </div>
    );
  }
  return null;
};

/**
 * Student Dashboard & Performance Command Center Page
 */
export default function StudentDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Analytics & Dashboard Telemetry
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const userIdParam = user?.id ? user.id : 'me';
      const res = await fetch(`${API_BASE_URL}/analytics/student/${userIdParam}`, { headers });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP error ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.message || 'Failed to parse student dashboard telemetry.');
      }
    } catch (err) {
      console.error('StudentDashboard fetch error:', err);
      setError(err.message || 'Failed to load student dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Mini Chart Data
  const miniChartData = useMemo(() => {
    if (!dashboardData?.history || !Array.isArray(dashboardData.history)) return [];
    
    // Sort chronologically and pick recent 6
    const chronological = [...dashboardData.history].reverse().slice(-6);
    return chronological.map((h, i) => {
      const d = new Date(h.date);
      const dateFormatted = isNaN(d.getTime()) 
        ? `#${i + 1}` 
        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      return {
        ...h,
        dateFormatted,
        scorePercentage: Math.round(h.scorePercentage)
      };
    });
  }, [dashboardData]);

  // Recent 4 Attempts for List
  const recentFourAttempts = useMemo(() => {
    if (!dashboardData?.history || !Array.isArray(dashboardData.history)) return [];
    return dashboardData.history.slice(0, 4);
  }, [dashboardData]);

  const overview = dashboardData?.overview || {
    totalAttempts: 0,
    quizzesPassed: 0,
    averageScore: 0,
    highestScore: 0,
    accuracyRate: 0,
    totalTimeSpentSeconds: 0
  };

  const failedCount = Math.max(0, overview.totalAttempts - overview.quizzesPassed);

  return (
    <div className="space-y-8 font-sans pb-12 animate-fade-in">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/70 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || 'Student Avatar'} 
                className="w-16 h-16 rounded-2xl border-2 border-indigo-500/40 object-cover shadow-lg shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
                {user?.firstName?.[0] || 'S'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
                  Welcome back, {user?.firstName || user?.fullName || 'Student'}! 👋
                </h1>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm">
                Track your assessment progress, review past performance, and explore new AI-generated quizzes.
              </p>
            </div>
          </div>

          <Link
            to="/student/quizzes"
            className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 shrink-0 hover:scale-[1.02] cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore Quizzes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
            onClick={fetchDashboardData}
            className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Top Metric KPI Cards Grid (5-Grid Layout) */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-900/60 border border-slate-800 p-4" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Attempted */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Attempted</span>
              <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-100 font-mono">
                {overview.totalAttempts}
              </div>
              <span className="text-[10px] text-slate-500">Quizzes taken</span>
            </div>
          </div>

          {/* Card 2: Passed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passed</span>
              <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {overview.quizzesPassed}
              </div>
              <span className="text-[10px] text-slate-500">Criteria met</span>
            </div>
          </div>

          {/* Card 3: Failed / Review */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needs Review</span>
              <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-rose-400 font-mono">
                {failedCount}
              </div>
              <span className="text-[10px] text-slate-500">Below pass score</span>
            </div>
          </div>

          {/* Card 4: Average Score */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Score</span>
              <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-100 font-mono">
                {overview.averageScore}%
              </div>
              <span className="text-[10px] text-slate-500">Accuracy rate</span>
            </div>
          </div>

          {/* Card 5: Highest Score */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highest Score</span>
              <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-amber-400 font-mono">
                {overview.highestScore}%
              </div>
              <span className="text-[10px] text-slate-500">Personal record</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Dual-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols - Mini Trend Chart & Recent Attempts) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Mini Score Progression Trend Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Performance Progression Trend
                </h3>
              </div>
              <Link
                to="/student/analytics"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Full Telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-48 w-full">
              {miniChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="dateFormatted" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip content={<MiniChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="scorePercentage"
                      stroke="#818cf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#dashGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Complete your first assessment to unlock live score trend charting.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Recent Attempts List Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Recent Quiz Attempts
                </h3>
              </div>
              <Link
                to="/student/history"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View All History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentFourAttempts.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-slate-400">No recent quiz attempts found.</p>
                  <Link
                    to="/student/quizzes"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Start First Quiz</span>
                  </Link>
                </div>
              ) : (
                recentFourAttempts.map((item) => (
                  <div
                    key={item.attemptId}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100 text-xs sm:text-sm">{item.quizTitle}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {item.categoryName || 'General'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Attempted on {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-sm text-slate-100">
                        {item.scorePercentage}%
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        item.isPassed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {item.isPassed ? 'PASSED' : 'FAILED'}
                      </span>

                      <Link
                        to={`/student/quiz-result/${item.attemptId}`}
                        className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all cursor-pointer"
                        title="Review Result"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col - Quick Action Hub & AI Study Reminder) */}
        <div className="space-y-8">
          
          {/* Quick Action Launcher Hub */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              Quick Action Hub
            </h3>

            <div className="space-y-3">
              <Link
                to="/student/quizzes"
                className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 hover:border-indigo-500 text-indigo-200 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors">
                      Explore Quizzes
                    </h4>
                    <p className="text-[10px] text-slate-400">Browse domain catalog</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/student/leaderboard"
                className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 hover:border-amber-500 text-amber-200 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-100 group-hover:text-amber-300 transition-colors">
                      Global Leaderboard
                    </h4>
                    <p className="text-[10px] text-slate-400">Compete with learners</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/student/analytics"
                className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/30 hover:border-purple-500 text-purple-200 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-100 group-hover:text-purple-300 transition-colors">
                      Deep Performance Analytics
                    </h4>
                    <p className="text-[10px] text-slate-400">Mastery & category telemetry</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          {/* AI Daily Learning Tip & Study Reminder */}
          <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Study Recommendation</span>
            </div>

            <h4 className="font-bold text-sm text-slate-100">
              Target Weak Concepts with AI Insights
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              After submitting any assessment, review your diagnostic AI feedback card on the result page to receive tailored revision steps and key strengths analysis.
            </p>

            <div className="pt-2">
              <Link
                to="/student/analytics"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <span>Check Domain Mastery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
