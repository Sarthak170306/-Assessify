import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  FolderPlus, 
  Users, 
  BarChart3, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';

/**
 * Quick Admin Action Shortcuts Component
 * Provides one-click shortcut buttons on the Admin Dashboard for key workflows.
 */
export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'create-quiz',
      title: 'Create New Quiz',
      description: 'Build AI-assisted assessments',
      icon: PlusCircle,
      route: '/admin/quizzes?action=create',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/50',
    },
    {
      id: 'add-category',
      title: 'Add Category',
      description: 'Organize quiz domain topics',
      icon: FolderPlus,
      route: '/admin/categories',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/50',
    },
    {
      id: 'manage-users',
      title: 'Manage Users',
      description: 'Control roles & account status',
      icon: Users,
      route: '/admin/users',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:border-amber-500/50',
    },
    {
      id: 'detailed-analytics',
      title: 'Detailed Analytics',
      description: 'Review platform telemetry',
      icon: BarChart3,
      route: '/admin/analytics',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:border-purple-500/50',
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl font-sans hover:border-slate-700/80 transition-all">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Quick Admin Actions</h3>
            <p className="text-xs text-slate-400">One-click shortcuts to key administrative workflows.</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
          Fast Access
        </span>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => navigate(action.route)}
              className="flex flex-col justify-between text-left p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group shadow-sm hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${action.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  {action.title}
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
