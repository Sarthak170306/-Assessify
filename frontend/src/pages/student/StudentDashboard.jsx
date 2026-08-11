import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Trophy, 
  History, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  BrainCircuit,
  Award
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useUser();
  const { dbUser, role, status } = useAuthContext();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Student Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-6 sm:p-8 border border-indigo-500/20 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || 'Student Avatar'} 
                className="w-16 h-16 rounded-2xl border-2 border-indigo-500/40 object-cover shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user?.firstName?.[0] || 'S'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Welcome to Student Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Role: STUDENT
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Hello, {user?.firstName || user?.fullName || 'Student'}! Explore AI-generated quizzes and track your performance.
              </p>
            </div>
          </div>

          <Link
            to="/student/quizzes"
            className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> Browse Quizzes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-800">
          <div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 w-fit mb-4">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Interactive Quiz Engine</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Test your knowledge across programming, AI, and mathematics with timed questions and instant feedback.
            </p>
          </div>
          <Link 
            to="/student/quizzes"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mt-2"
          >
            Start a Quiz <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-800">
          <div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 w-fit mb-4">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Attempt History & Analytics</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Review past submissions, detailed breakdown per question, and track your scoring progress over time.
            </p>
          </div>
          <Link 
            to="/student/attempts"
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 mt-2"
          >
            View History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-800">
          <div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 w-fit mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Student Leaderboards</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Compete with fellow learners on global and category-specific leaderboards.
            </p>
          </div>
          <Link 
            to="/student/leaderboard"
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 mt-2"
          >
            View Leaderboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
}
