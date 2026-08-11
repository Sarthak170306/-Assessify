import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAuthContext } from '../../context/AuthContext';
import AdminUserManagement from '../../components/AdminUserManagement';
import { 
  Users, 
  BookOpen, 
  FolderTree, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useUser();
  const { dbUser, role, status } = useAuthContext();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Admin Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-6 sm:p-8 border border-purple-500/20 shadow-2xl">
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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Role: ADMIN
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Welcome back, {user?.firstName || user?.fullName || 'Administrator'} &bull; Database Status: <span className="text-emerald-400 font-medium">{status}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
          <span className="text-slate-400 text-xs font-medium">Total Registered Users</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">PostgreSQL</h3>
          <p className="text-[11px] text-slate-500 mt-1">Managed via Clerk & Prisma</p>
        </div>

        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-md">
              Engine Ready
            </span>
          </div>
          <span className="text-slate-400 text-xs font-medium">Created Quizzes</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">Active</h3>
          <p className="text-[11px] text-slate-500 mt-1">Configured in schema</p>
        </div>

        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Categorized
            </span>
          </div>
          <span className="text-slate-400 text-xs font-medium">Quiz Categories</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">Relational</h3>
          <p className="text-[11px] text-slate-500 mt-1">Prisma PostgreSQL model</p>
        </div>

        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md">
              Telemetry
            </span>
          </div>
          <span className="text-slate-400 text-xs font-medium">Platform Analytics</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">Day 3 Active</h3>
          <p className="text-[11px] text-slate-500 mt-1">Role authorization active</p>
        </div>
      </div>

      {/* Embedded Admin User Management */}
      <AdminUserManagement />
    </div>
  );
}
