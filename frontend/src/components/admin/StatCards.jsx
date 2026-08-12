import React from 'react';
import PropTypes from 'prop-types';
import { 
  Users, 
  BookOpen, 
  FileCheck, 
  TrendingUp
} from 'lucide-react';

/**
 * System Metrics & KPI Cards Component
 * Consumes GET /api/admin/stats payload to render responsive platform metrics.
 */
export default function StatCards({ stats, isLoading }) {
  // Skeleton Loading Pulse Grid
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 animate-pulse shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80" />
              <div className="w-20 h-5 rounded-full bg-slate-800/80" />
            </div>
            <div className="w-28 h-4 rounded bg-slate-800/80" />
            <div className="w-16 h-7 rounded bg-slate-800/80" />
            <div className="w-36 h-3 rounded bg-slate-800/80" />
          </div>
        ))}
      </div>
    );
  }

  // Safe Stats Fallbacks
  const userStats = stats?.users || { total: 0, students: 0, admins: 0 };
  const quizStats = stats?.quizzes || { total: 0, published: 0, draft: 0 };
  const attemptStats = stats?.attempts || { total: 0, avgScore: 0 };

  const cards = [
    {
      title: 'Total Registered Users',
      value: (userStats.total || 0).toLocaleString(),
      subtext: `${userStats.students || 0} Students, ${userStats.admins || 0} Admins`,
      icon: Users,
      badge: 'Active Sync',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      iconContainer: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      title: 'Total Quizzes',
      value: (quizStats.total || 0).toLocaleString(),
      subtext: `${quizStats.published || 0} Published, ${quizStats.draft || 0} Drafts`,
      icon: BookOpen,
      badge: 'Engine Ready',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      iconContainer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Quiz Attempts',
      value: (attemptStats.total || 0).toLocaleString(),
      subtext: 'Total completions across platform',
      icon: FileCheck,
      badge: 'Live Data',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      iconContainer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      title: 'Average Score Performance',
      value: `${attemptStats.avgScore || 0}%`,
      subtext: 'Overall platform pass/score metric',
      icon: TrendingUp,
      badge: 'Performance',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      iconContainer: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-300 shadow-xl backdrop-blur-xl group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl border ${card.iconContainer} group-hover:scale-105 transition-transform`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>
              <span className="text-slate-400 text-xs font-medium">
                {card.title}
              </span>
              <h3 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">
                {card.value}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-800/80 pt-2 font-mono">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}

StatCards.propTypes = {
  stats: PropTypes.shape({
    users: PropTypes.shape({
      total: PropTypes.number,
      students: PropTypes.number,
      admins: PropTypes.number,
    }),
    quizzes: PropTypes.shape({
      total: PropTypes.number,
      published: PropTypes.number,
      draft: PropTypes.number,
    }),
    categories: PropTypes.shape({
      total: PropTypes.number,
    }),
    attempts: PropTypes.shape({
      total: PropTypes.number,
      avgScore: PropTypes.number,
    }),
  }),
  isLoading: PropTypes.bool,
};

StatCards.defaultProps = {
  stats: null,
  isLoading: false,
};
