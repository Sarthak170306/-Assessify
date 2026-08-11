import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Layers } from 'lucide-react';

export default function PlaceholderView({ title, description, badge }) {
  const location = useLocation();

  return (
    <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center max-w-3xl mx-auto my-8 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-lg">
        <Layers className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {badge || 'Assessify AI Module'}
        </span>
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">{description}</p>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono inline-block">
        Route: <span className="text-indigo-300">{location.pathname}</span>
      </div>

      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
