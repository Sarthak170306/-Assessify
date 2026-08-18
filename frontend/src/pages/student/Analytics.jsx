import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  TrendingUp, 
  Award, 
  Clock, 
  Target, 
  BarChart3, 
  Layers, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Sparkles
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

/**
 * Custom Dark Theme Tooltip for Recharts
 */
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-sans space-y-1">
        <p className="font-bold text-slate-100">{data.quizTitle || label}</p>
        <div className="flex items-center gap-2 text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>Score: <strong className="text-white font-mono">{data.scorePercentage ?? data.averageScore}%</strong></span>
        </div>
        {data.dateFormatted && (
          <p className="text-[10px] text-slate-400">{data.dateFormatted}</p>
        )}
        {data.masteryLevel && (
          <p className="text-[10px] font-semibold text-emerald-400">Mastery Level: {data.masteryLevel}</p>
        )}
      </div>
    );
  }
  return null;
};

/**
 * Student Analytics Dashboard Page Component
 */
export default function Analytics() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframeFilter, setTimeframeFilter] = useState('all'); // 'all' | 'recent'

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Analytics API data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = {
        'x-clerk-user-id': user?.id || ''
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const userIdParam = user?.id ? user.id : 'me';
      const res = await fetch(`${API_BASE_URL}/analytics/student/${userIdParam}`, {
        headers
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP error ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.data) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.message || 'Failed to parse analytics payload.');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load performance analytics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  // Format Total Seconds to Human Readable String (e.g. 1h 25m or 14m 30s)
  const formatTimeSpent = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '0m';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Prepare Chart Data
  const historyChartData = useMemo(() => {
    if (!analyticsData?.history || !Array.isArray(analyticsData.history)) return [];
    
    // Sort chronologically for chart plotting
    const chronological = [...analyticsData.history].reverse();
    const data = chronological.map((h, index) => {
      const d = new Date(h.date);
      const dateFormatted = isNaN(d.getTime()) 
        ? `Attempt ${index + 1}` 
        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      return {
        ...h,
        index: index + 1,
        dateFormatted,
        scorePercentage: Math.round(h.scorePercentage)
      };
    });

    if (timeframeFilter === 'recent') {
      return data.slice(-5);
    }
    return data;
  }, [analyticsData, timeframeFilter]);

  const categoryChartData = useMemo(() => {
    if (!analyticsData?.categoryBreakdown || !Array.isArray(analyticsData.categoryBreakdown)) return [];
    return analyticsData.categoryBreakdown.map((cat) => ({
      ...cat,
      averageScore: Math.round(cat.averageScore)
    }));
  }, [analyticsData]);

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* 1. Header Banner & Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Learning Analytics & Telemetry</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Track performance progression, score trends across historical quiz attempts, and domain mastery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Filter Buttons */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setTimeframeFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeframeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Attempts
            </button>
            <button
              type="button"
              onClick={() => setTimeframeFilter('recent')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeframeFilter === 'recent'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recent 5
            </button>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
            onClick={fetchAnalytics}
            className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Loading Skeleton View */}
      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-8 w-16 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 p-5" />
            <div className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 p-5" />
          </div>
        </div>
      ) : !analyticsData || analyticsData.overview.totalAttempts === 0 ? (
        /* Empty Attempts State */
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 my-8 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">No Assessment Analytics Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            You haven't completed any assessment quizzes yet. Complete your first quiz to generate live performance telemetry and category mastery analytics.
          </p>
          <div className="pt-2">
            <Link
              to="/student/quizzes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Quiz Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Top KPI Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI Card 1: Total Attempts */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Attempts</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-100 font-mono">
                  {analyticsData.overview.totalAttempts}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">{analyticsData.overview.quizzesPassed} Passed</span>
                  <span>&bull;</span>
                  <span className="text-rose-400 font-semibold">{analyticsData.overview.totalAttempts - analyticsData.overview.quizzesPassed} Review</span>
                </div>
              </div>
            </div>

            {/* KPI Card 2: Average Score */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Score</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-100 font-mono">
                  {analyticsData.overview.averageScore}%
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(analyticsData.overview.averageScore, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI Card 3: Overall Accuracy Rate */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Accuracy Rate</span>
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-100 font-mono">
                  {analyticsData.overview.accuracyRate}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>Highest score:</span>
                  <strong className="text-purple-300 font-mono">{analyticsData.overview.highestScore}%</strong>
                </div>
              </div>
            </div>

            {/* KPI Card 4: Total Time Invested */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Time Invested</span>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-100 font-mono">
                  {formatTimeSpent(analyticsData.overview.totalTimeSpentSeconds)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Total time in test engine
                </div>
              </div>
            </div>
          </div>

          {/* 4. Visual Analytics Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Performance Timeline */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Performance Progression Trend
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-medium">
                  {historyChartData.length} Attempts Plotted
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="dateFormatted" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="scorePercentage"
                      stroke="#818cf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Mastery Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Domain Category Mastery (%)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-medium">
                  {categoryChartData.length} Domains
                </span>
              </div>

              <div className="h-64 w-full">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="categoryName" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar dataKey="averageScore" radius={[6, 6, 0, 0]}>
                        {categoryChartData.map((entry, index) => {
                          const fill = entry.averageScore >= 80 ? '#10b981' : entry.averageScore >= 60 ? '#eab308' : '#f43f5e';
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No category breakdown data available yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Recent Performance History Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Recent Quiz Attempts Log ({analyticsData.history.length})
                </h3>
              </div>
              <Link
                to="/student/history"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Assessment Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Score & Result</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analyticsData.history.map((attempt) => {
                    const dateFormatted = new Date(attempt.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });

                    return (
                      <tr key={attempt.attemptId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-200">
                          {attempt.quizTitle}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {attempt.categoryName || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-100">
                              {attempt.scorePercentage}%
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              attempt.isPassed
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {attempt.isPassed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {dateFormatted}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/student/quiz-result/${attempt.attemptId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            <Zap className="w-3 h-3 text-indigo-400" />
                            <span>AI Report</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
