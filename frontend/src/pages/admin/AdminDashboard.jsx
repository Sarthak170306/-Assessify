import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useAuthContext } from '../../context/AuthContext';
import AdminUserManagement from '../../components/AdminUserManagement';
import StatCards from '../../components/admin/StatCards';
import QuickActions from '../../components/admin/QuickActions';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import RecentActivityFeed from '../../components/admin/RecentActivityFeed';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { status } = useAuthContext();

  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchAdminStats = useCallback(async () => {
    if (!user) return;
    setIsLoadingStats(true);
    setFetchError(null);

    try {
      let token = null;
      try {
        token = await getToken();
      } catch (tErr) {
        console.warn('Could not retrieve Clerk token:', tErr);
      }

      const headers = {
        'x-clerk-user-id': user.id,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/admin/stats`, { headers });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to fetch admin stats (${response.status})`);
      }

      const data = await response.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch admin stats error:', err);
      setFetchError(err.message);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user, getToken, API_BASE_URL]);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Admin Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-6 sm:p-8 border border-purple-500/20 shadow-2xl bg-slate-900/60 backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || 'Admin Avatar'} 
                className="w-16 h-16 rounded-2xl border-2 border-purple-500/40 object-cover shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user?.firstName?.[0] || 'A'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Admin Command Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Role: ADMIN
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Welcome back, {user?.firstName || user?.fullName || 'Administrator'} &bull; Database Status: <span className="text-emerald-400 font-medium">{status}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAdminStats}
            disabled={isLoadingStats}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
            <span>Sync Metrics</span>
          </button>
        </div>
      </div>

      {/* Fetch Error Callout */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Failed to load live system metrics: {fetchError}</span>
        </div>
      )}

      {/* Dynamic KPI Metrics & System Stat Cards */}
      <StatCards stats={stats} isLoading={isLoadingStats} />

      {/* Quick Admin Action Shortcuts */}
      <QuickActions />

      {/* Interactive Platform Overview Charts */}
      <AnalyticsCharts isLoading={isLoadingStats} />

      {/* Real-time System Activity Feed Log */}
      <RecentActivityFeed isLoading={isLoadingStats} />

      {/* Embedded Admin User Management */}
      <AdminUserManagement />
    </div>
  );
}
