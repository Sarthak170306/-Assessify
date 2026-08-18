import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Flame, 
  Clock, 
  Target, 
  ChevronRight, 
  Sparkles, 
  User, 
  Search,
  RefreshCw,
  AlertCircle,
  Layers,
  Award,
  Zap
} from 'lucide-react';

/**
 * Student Leaderboard Page Component with Top 3 Podiums & Interactive Rankings
 */
export default function Leaderboard() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [timeframe, setTimeframe] = useState('all-time'); // 'all-time' | 'weekly'
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Leaderboard Data
  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = {
        'x-clerk-user-id': user?.id || ''
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/leaderboard/global?timeframe=${timeframe}&limit=50`, {
        headers
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP error ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.data) {
        setLeaderboardData(Array.isArray(result.data.leaderboard) ? result.data.leaderboard : []);
        setUserRank(result.data.userRank || null);
      } else {
        throw new Error(result.message || 'Failed to parse leaderboard payload.');
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(err.message || 'Failed to load leaderboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, user]);

  // Search Filtered Leaderboard Data
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboardData;
    const q = searchQuery.toLowerCase().trim();
    return leaderboardData.filter((u) => 
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [leaderboardData, searchQuery]);

  // Extract Top 3 Winners for Podiums
  const rank1 = leaderboardData.find((u) => u.rank === 1) || null;
  const rank2 = leaderboardData.find((u) => u.rank === 2) || null;
  const rank3 = leaderboardData.find((u) => u.rank === 3) || null;

  // Remaining Ranks 4+
  const ranksFourthPlus = filteredLeaderboard.filter((u) => u.rank > 3);

  // Helper for Initials Fallback
  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'ST';
  };

  // Helper for Time Formatting
  const formatSeconds = (totalSec) => {
    if (!totalSec || totalSec <= 0) return '0m';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="space-y-8 font-sans pb-24 relative">
      {/* 1. Header & Timeframe Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/10">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                Platform Leaderboard
              </h1>
              <p className="text-xs text-slate-400">
                Top performing students ranked by accuracy, completion speed, and assessments cleared.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Timeframe Toggle Pills */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => setTimeframe('all-time')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                timeframe === 'all-time'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All-Time
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('weekly')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                timeframe === 'weekly'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              This Week
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-slate-100 text-xs outline-none w-full sm:w-44"
            />
          </div>

          <button
            type="button"
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Leaderboard"
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
            onClick={fetchLeaderboard}
            className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Loading Skeleton View */}
      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="h-64 rounded-3xl bg-slate-900/60 border border-slate-800 p-6" />
            <div className="h-80 rounded-3xl bg-slate-900/60 border border-slate-800 p-6" />
            <div className="h-56 rounded-3xl bg-slate-900/60 border border-slate-800 p-6" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800" />
            ))}
          </div>
        </div>
      ) : leaderboardData.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xl my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">No Leaderboard Rankings Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No completed assessments recorded for {timeframe === 'weekly' ? 'this week' : 'all-time'}. Be the first student to complete an assessment and claim Rank #1!
          </p>
          <div className="pt-2">
            <Link
              to="/student/quizzes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4" />
              <span>Take Assessment Quiz</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Top 3 Winners Podium Showcase (Desktop & Tablet Grid) */}
          {!searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 pb-2">
              {/* RANK 2: Silver (Left) */}
              <div className="order-2 md:order-1 bg-slate-900/80 border border-slate-400/30 rounded-3xl p-6 text-center shadow-xl backdrop-blur-md relative flex flex-col justify-between h-72 hover:border-slate-400/50 transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-800 border border-slate-400/40 text-slate-300 text-[10px] font-extrabold font-mono tracking-wider flex items-center gap-1 shadow-md">
                  <Medal className="w-3.5 h-3.5 text-slate-300" /> #2 SILVER
                </div>

                <div className="mt-4 flex flex-col items-center">
                  {rank2 ? (
                    <>
                      <div className="relative mb-3">
                        {rank2.imageUrl ? (
                          <img
                            src={rank2.imageUrl}
                            alt={rank2.name}
                            className="w-16 h-16 rounded-full border-2 border-slate-300/80 object-cover shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-300/80 flex items-center justify-center text-slate-200 font-bold text-sm shadow-lg">
                            {getInitials(rank2.name, rank2.email)}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 border border-slate-400 text-slate-200 text-xs font-bold font-mono flex items-center justify-center">
                          2
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-100 line-clamp-1">{rank2.name}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{rank2.email}</p>

                      <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-bold font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-slate-300" />
                        <span>{rank2.totalScorePoints} Points</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 my-auto">Spot Open</div>
                  )}
                </div>

                {rank2 && (
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-around text-[11px] text-slate-400">
                    <div>
                      <span className="block font-bold text-slate-200 font-mono">{rank2.quizzesPassed}</span>
                      <span className="text-[10px]">Passed</span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <span className="block font-bold text-slate-200 font-mono">{rank2.averageScore}%</span>
                      <span className="text-[10px]">Avg Score</span>
                    </div>
                  </div>
                )}
              </div>

              {/* RANK 1: Gold (Center Elevated) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/50 rounded-3xl p-6 text-center shadow-2xl shadow-amber-500/20 backdrop-blur-md relative flex flex-col justify-between h-84 hover:border-amber-400 transition-all scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold font-mono tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                  <Crown className="w-4 h-4 animate-bounce" /> #1 CHAMPION
                </div>

                <div className="mt-4 flex flex-col items-center">
                  {rank1 ? (
                    <>
                      <div className="relative mb-3">
                        {rank1.imageUrl ? (
                          <img
                            src={rank1.imageUrl}
                            alt={rank1.name}
                            className="w-20 h-20 rounded-full border-4 border-amber-400 object-cover shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/20"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 border-4 border-amber-400 flex items-center justify-center text-white font-bold text-xl shadow-xl ring-4 ring-amber-400/20">
                            {getInitials(rank1.name, rank1.email)}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-sm font-mono flex items-center justify-center shadow-md">
                          1
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-white line-clamp-1">{rank1.name}</h3>
                      <p className="text-xs text-amber-200/80 line-clamp-1">{rank1.email}</p>

                      <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-black font-mono shadow-inner">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{rank1.totalScorePoints} Points</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 my-auto">Spot Open</div>
                  )}
                </div>

                {rank1 && (
                  <div className="pt-3 border-t border-amber-500/20 flex items-center justify-around text-xs text-slate-300">
                    <div>
                      <span className="block font-extrabold text-amber-400 font-mono text-sm">{rank1.quizzesPassed}</span>
                      <span className="text-[10px] text-slate-400">Passed</span>
                    </div>
                    <div className="h-6 w-px bg-amber-500/20" />
                    <div>
                      <span className="block font-extrabold text-amber-400 font-mono text-sm">{rank1.averageScore}%</span>
                      <span className="text-[10px] text-slate-400">Avg Score</span>
                    </div>
                  </div>
                )}
              </div>

              {/* RANK 3: Bronze (Right) */}
              <div className="order-3 md:order-3 bg-slate-900/80 border border-amber-700/30 rounded-3xl p-6 text-center shadow-xl backdrop-blur-md relative flex flex-col justify-between h-64 hover:border-amber-700/50 transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-800 border border-amber-700/40 text-amber-500 text-[10px] font-extrabold font-mono tracking-wider flex items-center gap-1 shadow-md">
                  <Medal className="w-3.5 h-3.5 text-amber-600" /> #3 BRONZE
                </div>

                <div className="mt-3 flex flex-col items-center">
                  {rank3 ? (
                    <>
                      <div className="relative mb-2">
                        {rank3.imageUrl ? (
                          <img
                            src={rank3.imageUrl}
                            alt={rank3.name}
                            className="w-14 h-14 rounded-full border-2 border-amber-600/80 object-cover shadow-lg"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-600/80 flex items-center justify-center text-amber-400 font-bold text-xs shadow-lg">
                            {getInitials(rank3.name, rank3.email)}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 border border-amber-600 text-amber-400 text-[11px] font-bold font-mono flex items-center justify-center">
                          3
                        </span>
                      </div>

                      <h3 className="font-bold text-xs text-slate-100 line-clamp-1">{rank3.name}</h3>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{rank3.email}</p>

                      <div className="mt-2 inline-flex items-center gap-1 px-3 py-0.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-bold font-mono">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{rank3.totalScorePoints} Points</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 my-auto">Spot Open</div>
                  )}
                </div>

                {rank3 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-around text-[10px] text-slate-400">
                    <div>
                      <span className="block font-bold text-slate-200 font-mono">{rank3.quizzesPassed}</span>
                      <span className="text-[9px]">Passed</span>
                    </div>
                    <div className="h-5 w-px bg-slate-800" />
                    <div>
                      <span className="block font-bold text-slate-200 font-mono">{rank3.averageScore}%</span>
                      <span className="text-[9px]">Avg Score</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Extended Rankings Table (Ranks 4+) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Student Standing Rankings ({filteredLeaderboard.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Total Points</th>
                    <th className="py-3 px-3">Assessments Passed</th>
                    <th className="py-3 px-3">Avg Accuracy</th>
                    <th className="py-3 px-3 text-right">Time Invested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeaderboard.map((item) => {
                    const isCurrentUser = user?.id && (item.userId === user.id || item.clerkId === user.id);

                    return (
                      <tr 
                        key={item.userId}
                        className={`transition-colors ${
                          isCurrentUser 
                            ? 'bg-indigo-950/40 border-l-4 border-l-indigo-500' 
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-3 px-3 font-mono font-bold">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                            item.rank === 1
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black'
                              : item.rank === 2
                              ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40 font-black'
                              : item.rank === 3
                              ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40 font-black'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{item.rank}
                          </span>
                        </td>

                        {/* Student User Info */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
                                {getInitials(item.name, item.email)}
                              </div>
                            )}

                            <div>
                              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {isCurrentUser && (
                                  <span className="px-2 py-0.2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9px] font-bold uppercase tracking-wider">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">{item.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Total Points */}
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">
                          {item.totalScorePoints} pts
                        </td>

                        {/* Assessments Passed */}
                        <td className="py-3 px-3 text-slate-300 font-semibold">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono">
                            {item.quizzesPassed} / {item.totalAttempts} Cleared
                          </span>
                        </td>

                        {/* Avg Accuracy */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">{item.averageScore}%</span>
                            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.averageScore >= 80 ? 'bg-emerald-500' : item.averageScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(item.averageScore, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Time Invested */}
                        <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                          {formatSeconds(item.totalTimeSpentSeconds)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Sticky Current User Status Float Bar */}
          {userRank && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[90%] bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white font-black text-sm font-mono shadow-md">
                  #{userRank.rank}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Your Leaderboard Standing</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-[11px] text-indigo-300 font-mono">
                    {userRank.totalScorePoints} Total Points &bull; {userRank.quizzesPassed} Assessments Passed
                  </div>
                </div>
              </div>

              <Link
                to="/student/quizzes"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:scale-105 shrink-0 flex items-center gap-1.5"
              >
                <span>Keep Practicing</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
