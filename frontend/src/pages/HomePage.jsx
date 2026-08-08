import React, { useState, useEffect } from 'react';
import { 
  SignedIn, 
  SignedOut, 
  UserButton, 
  SignOutButton, 
  useUser, 
  useAuth 
} from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, 
  ShieldCheck, 
  Activity, 
  Database, 
  LogOut, 
  User as UserIcon, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ArrowRight,
  Server,
  Zap,
  BookOpen,
  Award
} from 'lucide-react';

export default function HomePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { userId, sessionId } = useAuth();

  // Backend Health State
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    connected: false,
    data: null,
    latency: 0,
    error: null
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const checkBackendHealth = async () => {
    setHealthStatus(prev => ({ ...prev, loading: true, error: null }));
    const startTime = performance.now();
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setHealthStatus({
        loading: false,
        connected: data.status === 'OK',
        data: data,
        latency: latency,
        error: null
      });
    } catch (err) {
      setHealthStatus({
        loading: false,
        connected: false,
        data: null,
        latency: 0,
        error: err.message || 'Failed to connect to backend'
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Assessify<span className="gradient-text"> AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Backend Health Badge Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 text-xs">
              <span className={`w-2 h-2 rounded-full ${healthStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-300 font-medium">API:</span>
              <span className={healthStatus.connected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {healthStatus.loading ? 'Checking...' : healthStatus.connected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <SignedIn>
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <UserButton 
                  afterSignOutUrl="/sign-in"
                  appearance={{
                    elements: {
                      avatarBox: 'w-9 h-9 border-2 border-indigo-500/40 hover:border-indigo-500 transition-colors'
                    }
                  }}
                />
              </div>
            </SignedIn>

            <SignedOut>
              <div className="flex items-center gap-3">
                <Link
                  to="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </div>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* SIGNED IN PROTECTED VIEW */}
        <SignedIn>
          <div className="space-y-8">
            
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl glass-card p-6 sm:p-8 border border-indigo-500/20">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt={user.fullName || 'User Avatar'} 
                      className="w-16 h-16 rounded-2xl border-2 border-indigo-500/40 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Welcome back, {user?.firstName || user?.username || 'User'}!
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Authenticated
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      {user?.primaryEmailAddress?.emailAddress || 'User Dashboard'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <SignOutButton>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium text-sm transition-all hover:border-rose-500/50">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </SignOutButton>
                </div>
              </div>
            </div>

            {/* Grid Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: User Auth State */}
              <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Clerk Session Active
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Authentication Status</h3>
                  
                  <div className="space-y-2.5 text-xs text-slate-300 font-mono">
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">User ID:</span>
                      <span className="text-indigo-300 break-all">{userId || user?.id}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Email:</span>
                      <span className="text-slate-200">{user?.primaryEmailAddress?.emailAddress}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-500">Created:</span>
                      <span className="text-slate-300">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                  <span>Provider: Clerk SDK</span>
                  <span className="text-indigo-400 font-medium">Day 1 Ready</span>
                </div>
              </div>

              {/* Card 2: Backend API & Database Status */}
              <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                      <Server className="w-6 h-6" />
                    </div>
                    <button 
                      onClick={checkBackendHealth}
                      disabled={healthStatus.loading}
                      className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                      title="Refresh API Health"
                    >
                      <RefreshCw className={`w-4 h-4 ${healthStatus.loading ? 'animate-spin text-indigo-400' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Express API & Prisma DB</h3>

                  {healthStatus.loading ? (
                    <div className="py-6 flex flex-col items-center justify-center text-slate-400 text-sm">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                      Checking server status...
                    </div>
                  ) : healthStatus.connected ? (
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-lg flex items-center justify-between">
                        <span className="text-slate-400">API Status:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
                        </span>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between">
                        <span className="text-slate-400">PostgreSQL DB:</span>
                        <span className="text-indigo-300 font-medium">Supabase Connected</span>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between">
                        <span className="text-slate-400">Response Latency:</span>
                        <span className="text-slate-200 font-mono">{healthStatus.latency} ms</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-950/30 border border-rose-800/40 p-3 rounded-lg text-xs text-rose-300">
                      <div className="flex items-center gap-2 font-semibold text-rose-400 mb-1">
                        <XCircle className="w-4 h-4" /> Connection Failed
                      </div>
                      <p className="text-slate-400">{healthStatus.error}</p>
                      <p className="mt-2 text-slate-500 text-[11px]">
                        Ensure Express server is running on port 5000 (<code className="text-slate-300">npm run dev</code> in /backend).
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                  <span>Endpoint: /api/health</span>
                  <span className="text-slate-400">Port: 5000</span>
                </div>
              </div>

              {/* Card 3: Platform Stats & Quick Actions */}
              <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-md">
                      Assessify Engine
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Database Models</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Users</span>
                      <span className="text-slate-200 font-semibold">Configured</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Categories</span>
                      <span className="text-slate-200 font-semibold">Configured</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Quizzes</span>
                      <span className="text-slate-200 font-semibold">Configured</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Attempts</span>
                      <span className="text-slate-200 font-semibold">Configured</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Day 1 Complete</span>
                  <a 
                    href="http://localhost:5000/api/health" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    Raw API JSON <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>

          </div>
        </SignedIn>

        {/* SIGNED OUT LANDING VIEW */}
        <SignedOut>
          <div className="py-12 sm:py-20 flex flex-col items-center text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Assessify AI — Intelligent Assessment Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
              Empower Learning with <span className="gradient-text">AI-Driven Assessments</span>
            </h1>

            <p className="mt-6 text-slate-400 text-lg max-w-2xl leading-relaxed">
              Create, take, and analyze automated quizzes with real-time feedback, deep analytics, and seamless authentication powered by Clerk and Supabase PostgreSQL.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/sign-up"
                className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/sign-in"
                className="px-8 py-3.5 rounded-xl font-semibold text-slate-200 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 transition-all"
              >
                Sign In
              </Link>
            </div>

            {/* Feature Cards Grid */}
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-5xl w-full">
              
              <div className="glass-card p-6 rounded-2xl border border-slate-800">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 w-fit mb-4">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Smart Quiz Engine</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Generate comprehensive quizzes across multiple categories with customizable questions and automatic evaluation.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-800">
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 w-fit mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Clerk Authentication</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Enterprise-grade authentication with email, OAuth providers, protected routes, and session management.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-800">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 w-fit mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Prisma & Supabase</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Fully typed database access layer with PostgreSQL database hosted on Supabase for maximum speed and security.
                </p>
              </div>

            </div>

          </div>
        </SignedOut>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        Assessify AI Full-Stack Platform &bull; Day 1 Setup Complete
      </footer>
    </div>
  );
}
