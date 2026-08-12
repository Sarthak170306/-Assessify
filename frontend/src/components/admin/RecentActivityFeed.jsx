import React from 'react';
import PropTypes from 'prop-types';
import { 
  UserPlus, 
  BookOpen, 
  Award, 
  Clock, 
  Activity
} from 'lucide-react';

const MOCK_ACTIVITIES = [
  {
    id: 'act-1',
    type: 'USER_REGISTERED',
    title: 'New user registered',
    detail: 'Sarthak Sharma (sarthaksharma1703@gmail.com)',
    timestamp: '5 mins ago',
    meta: 'Role: ADMIN',
  },
  {
    id: 'act-2',
    type: 'QUIZ_CREATED',
    title: 'Quiz created',
    detail: 'Advanced React 19 & Next.js 15 Masterclass in Web Development',
    timestamp: '25 mins ago',
    meta: '15 Questions',
  },
  {
    id: 'act-3',
    type: 'ATTEMPT_COMPLETED',
    title: 'Attempt completed',
    detail: 'Alex Rivers completed PostgreSQL Performance Tuning with score 94%',
    timestamp: '1 hour ago',
    meta: 'Passed (Grade: A+)',
  },
  {
    id: 'act-4',
    type: 'USER_REGISTERED',
    title: 'New user registered',
    detail: 'Elena Rostova (elena.student@assessify.ai)',
    timestamp: '3 hours ago',
    meta: 'Role: STUDENT',
  },
  {
    id: 'act-5',
    type: 'QUIZ_CREATED',
    title: 'Quiz created',
    detail: 'System Architecture & Distributed Systems in Cloud Computing',
    timestamp: '5 hours ago',
    meta: '20 Questions',
  },
  {
    id: 'act-6',
    type: 'ATTEMPT_COMPLETED',
    title: 'Attempt completed',
    detail: 'Marcus Vance completed Docker & Kubernetes Fundamentals with score 88%',
    timestamp: 'Yesterday',
    meta: 'Passed (Grade: A)',
  },
];

/**
 * Recent System Activity Feed Component
 * Renders real-time system activity log displaying user registrations, quiz creations, and quiz attempts.
 */
export default function RecentActivityFeed({ activities, isLoading }) {
  // Skeleton Loading Pulses
  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <div className="w-44 h-5 rounded bg-slate-800 animate-pulse" />
          <div className="w-20 h-4 rounded bg-slate-800 animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-slate-800 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-1/3 h-4 rounded bg-slate-800" />
                <div className="w-2/3 h-3 rounded bg-slate-800/70" />
              </div>
              <div className="w-14 h-3 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activityList = (activities && activities.length > 0) ? activities : MOCK_ACTIVITIES;

  const getActivityConfig = (type) => {
    switch (type) {
      case 'USER_REGISTERED':
        return {
          icon: UserPlus,
          badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          typeLabel: 'User Registration',
        };
      case 'QUIZ_CREATED':
        return {
          icon: BookOpen,
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          typeLabel: 'Quiz Published',
        };
      case 'ATTEMPT_COMPLETED':
        return {
          icon: Award,
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          typeLabel: 'Quiz Attempt',
        };
      default:
        return {
          icon: Activity,
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
          iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
          typeLabel: 'System Event',
        };
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl font-sans hover:border-slate-700/80 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Recent System Activity Log
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time feed of user registrations, quiz creations, and attempt completions.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
          Realtime Feed
        </span>
      </div>

      {/* Activity List Container */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {activityList.map((item) => {
          const config = getActivityConfig(item.type);
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all gap-3 group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl border ${config.iconBg} group-hover:scale-105 transition-transform shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-200">{item.title}</span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${config.badgeColor}`}>
                      {config.typeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0 border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                {item.meta && (
                  <span className="text-[11px] text-slate-500 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    {item.meta}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {item.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

RecentActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
      title: PropTypes.string,
      detail: PropTypes.string,
      timestamp: PropTypes.string,
      meta: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
};

RecentActivityFeed.defaultProps = {
  activities: null,
  isLoading: false,
};
