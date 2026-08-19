import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Users, 
  HelpCircle, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  BarChart2, 
  Clock, 
  ArrowUpRight, 
  ShieldAlert, 
  Eye, 
  RefreshCw,
  Sparkles,
  Layers,
  BookOpen,
  AlertCircle,
  BarChart3,
  Check
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

/**
 * Custom Dark Theme Tooltip for Admin Recharts
 */
const CustomAdminTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-sans space-y-1">
        <p className="font-bold text-slate-100">{data.title || data.dateFormatted || data.name || label}</p>
        {data.categoryName && (
          <p className="text-[10px] text-indigo-400 font-semibold">Category: {data.categoryName}</p>
        )}
        <div className="flex items-center gap-2 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{payload[0].name || 'Value'}: <strong className="text-white font-mono">{payload[0].value}</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Admin Analytics & Platform Insights Command Center
 */
export default function AdminAnalytics() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [platformData, setPlatformData] = useState(null);
  const [attemptsFeed, setAttemptsFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Admin Analytics & Attempts Feed
  const fetchAdminOverview = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = {
        'x-clerk-user-id': user?.id || ''
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch /api/admin/analytics (or /api/analytics/overview) and /api/admin/attempts in parallel
      const [analyticsRes, attemptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/analytics`, { headers }).catch(() => null) ||
        fetch(`${API_BASE_URL}/analytics/overview`, { headers }),

        fetch(`${API_BASE_URL}/admin/attempts`, { headers }).catch(() => null)
      ]);

      let dataObj = null;
      if (analyticsRes && analyticsRes.ok) {
        const result = await analyticsRes.json();
        dataObj = result.data || result.stats || result;
      }

      let attemptsList = [];
      if (attemptsRes && attemptsRes.ok) {
        const attemptsResult = await attemptsRes.json();
        attemptsList = attemptsResult.attempts || [];
      } else if (dataObj?.recentAttemptsFeed) {
        attemptsList = dataObj.recentAttemptsFeed;
      }

      if (dataObj) {
        setPlatformData(dataObj);
        setAttemptsFeed(attemptsList);
      } else {
        throw new Error('Failed to retrieve administrative analytics.');
      }
    } catch (err) {
      console.error('Admin Analytics fetch error:', err);
      setError(err.message || 'Failed to load platform analytics.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
  }, [user]);

  // Pass vs Fail Distribution Data for Pie Chart
  const passFailData = useMemo(() => {
    if (!platformData) {
      return [
        { name: 'Passed', value: 0, color: '#10b981' },
        { name: 'Needs Review', value: 0, color: '#f43f5e' }
      ];
    }

    const passed = platformData.passedAttempts || 0;
    const failed = platformData.failedAttempts || 0;

    if (passed === 0 && failed === 0 && attemptsFeed.length > 0) {
      let pCount = 0;
      let fCount = 0;
      attemptsFeed.forEach((a) => {
        if (a.isPassed || a.passed) pCount++;
        else fCount++;
      });
      return [
        { name: 'Passed (≥70%)', value: pCount, color: '#10b981' },
        { name: 'Needs Review (<70%)', value: fCount, color: '#f43f5e' }
      ];
    }

    return [
      { name: 'Passed (≥70%)', value: passed, color: '#10b981' },
      { name: 'Needs Review (<70%)', value: failed, color: '#f43f5e' }
    ];
  }, [platformData, attemptsFeed]);

  // Formatter for Student Initials
  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'ST';
  };

  const totalStudents = platformData?.totalStudents ?? platformData?.totalUsers ?? 0;
  const totalQuizzes = platformData?.totalQuizzes ?? 0;
  const publishedQuizzes = platformData?.publishedQuizzes ?? 0;
  const draftQuizzes = platformData?.draftQuizzes ?? 0;
  const totalQuestions = platformData?.totalQuestions ?? 0;
  const totalAttempts = platformData?.totalAttempts ?? 0;
  const passRate = platformData?.passRate ?? (totalAttempts > 0 ? Math.round(((platformData?.passedAttempts || 0) / totalAttempts) * 100) : 0);
  const averageScore = platformData?.averageScore ?? platformData?.platformAverageScore ?? 0;

  return (
    <div className="space-y-8 font-sans pb-12 animate-fade-in">
      {/* 1. Header Banner & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Platform Analytics Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Admin Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Monitor platform adoption, pass/fail ratios, quiz completion volume, and live attempt audit streams.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAdminOverview(true)}
          disabled={isLoading || refreshing}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing Data...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAdminOverview(true)}
            className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Loading Skeleton View */}
      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 p-5" />
            <div className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 p-5" />
          </div>
        </div>
      ) : !platformData ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
          No platform analytics available.
        </div>
      ) : (
        <>
          {/* 3. Executive Statistics KPI Grid (6-Card Layout) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Card 1: Total Students */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Students</span>
                <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-slate-100 font-mono">
                  {totalStudents}
                </div>
                <span className="text-[10px] text-blue-400 font-semibold">Registered Learners</span>
              </div>
            </div>

            {/* Card 2: Total Quizzes */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quizzes</span>
                <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-slate-100 font-mono">
                  {totalQuizzes}
                </div>
                <span className="text-[10px] text-slate-400">
                  {publishedQuizzes} Pub &bull; {draftQuizzes} Draft
                </span>
              </div>
            </div>

            {/* Card 3: Total Questions */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Questions</span>
                <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-slate-100 font-mono">
                  {totalQuestions}
                </div>
                <span className="text-[10px] text-slate-400">Question Item Bank</span>
              </div>
            </div>

            {/* Card 4: Total Attempts */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attempts</span>
                <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-slate-100 font-mono">
                  {totalAttempts}
                </div>
                <span className="text-[10px] text-slate-400">Assessments completed</span>
              </div>
            </div>

            {/* Card 5: Pass Rate */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pass Rate</span>
                <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {passRate}%
                </div>
                <span className="text-[10px] text-slate-400">Score &ge; 70% criteria</span>
              </div>
            </div>

            {/* Card 6: Platform Avg Score */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Score</span>
                <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-slate-100 font-mono">
                  {averageScore}%
                </div>
                <span className="text-[10px] text-slate-400">Global average accuracy</span>
              </div>
            </div>
          </div>

          {/* 4. Visual Analytics & Comparative Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Quiz Attempts Over Time */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Quiz Attempts Over Time (Daily Timeline)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-medium">
                  {platformData.attemptsOverTime?.length || 0} Days Logged
                </span>
              </div>

              <div className="h-64 w-full">
                {platformData.attemptsOverTime && platformData.attemptsOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={platformData.attemptsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adminChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="dateFormatted" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomAdminTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Attempts Count"
                        stroke="#818cf8"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#adminChartGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No daily timeline attempts recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Most Popular Assessments */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Most Popular Assessments (Attempt Volume)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-medium">
                  Top 5 Assessments
                </span>
              </div>

              <div className="h-64 w-full">
                {platformData.mostPopularQuizzes && platformData.mostPopularQuizzes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData.mostPopularQuizzes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="title" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomAdminTooltip />} />
                      <Bar dataKey="attemptsCount" name="Attempts" fill="#818cf8" radius={[6, 6, 0, 0]}>
                        {platformData.mostPopularQuizzes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#a855f7'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No attempt data available for popular quizzes.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Live Student Attempts Audit Stream */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Live Assessment Feed ({attemptsFeed.length})
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Real-Time Audit Stream
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Student Name & Email</th>
                    <th className="py-3 px-3">Assessment Quiz</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Score & Status</th>
                    <th className="py-3 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {attemptsFeed.length > 0 ? (
                    attemptsFeed.map((attempt) => {
                      const isPassed = attempt.isPassed || attempt.passed;
                      const dateFormatted = new Date(attempt.completedAt || attempt.createdAt || attempt.date).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={attempt.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Student Info */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[10px] shrink-0">
                                {getInitials(attempt.userName, attempt.userEmail)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200">{attempt.userName}</div>
                                <div className="text-[10px] text-slate-400">{attempt.userEmail}</div>
                              </div>
                            </div>
                          </td>

                          {/* Quiz Title */}
                          <td className="py-3 px-3 font-semibold text-slate-200">
                            {attempt.quizTitle}
                          </td>

                          {/* Category Badge */}
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {attempt.categoryName || 'General'}
                            </span>
                          </td>

                          {/* Score & Status */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-100">
                                {attempt.scorePercentage ?? attempt.score}%
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isPassed
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {isPassed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                          </td>

                          {/* Timestamp */}
                          <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                            {dateFormatted}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">
                        No student attempts recorded in feed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
