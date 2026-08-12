import React from 'react';
import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';

// Fallback Realistic Trend Data
const DEFAULT_TIMELINE_DATA = [
  { month: 'Jan', attempts: 120, passed: 95 },
  { month: 'Feb', attempts: 190, passed: 150 },
  { month: 'Mar', attempts: 310, passed: 260 },
  { month: 'Apr', attempts: 280, passed: 230 },
  { month: 'May', attempts: 420, passed: 360 },
  { month: 'Jun', attempts: 540, passed: 470 },
  { month: 'Jul', attempts: 680, passed: 590 },
  { month: 'Aug', attempts: 820, passed: 710 },
];

const DEFAULT_CATEGORY_DATA = [
  { name: 'Web Development', value: 35 },
  { name: 'AI & Machine Learning', value: 25 },
  { name: 'Data Science', value: 20 },
  { name: 'Cloud Computing', value: 12 },
  { name: 'Cyber Security', value: 8 },
];

const CATEGORY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

/**
 * Custom Dark Theme Tooltip for Area Chart
 */
const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-sans space-y-1">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1">{label} Overview</p>
        <p className="text-indigo-400 flex items-center justify-between gap-4 font-mono">
          <span>Total Attempts:</span>
          <span className="font-bold">{payload[0]?.value}</span>
        </p>
        <p className="text-emerald-400 flex items-center justify-between gap-4 font-mono">
          <span>Passed Attempts:</span>
          <span className="font-bold">{payload[1]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Custom Dark Theme Tooltip for Pie Chart
 */
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900/95 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-sans space-y-1">
        <p className="font-bold text-slate-200">{data.name}</p>
        <p className="text-indigo-400 font-mono">
          Share: <span className="font-bold">{data.value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Platform Overview Charts Component
 */
export default function AnalyticsCharts({ trendData, categoryData, isLoading }) {
  // Skeleton Loading Pulses
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse shadow-xl h-80 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-48 h-5 rounded bg-slate-800" />
              <div className="w-16 h-4 rounded bg-slate-800" />
            </div>
            <div className="w-full h-52 rounded-xl bg-slate-800/60" />
          </div>
        ))}
      </div>
    );
  }

  const timelineChartData = (trendData && trendData.length > 0) ? trendData : DEFAULT_TIMELINE_DATA;
  const pieChartData = (categoryData && categoryData.length > 0) ? categoryData : DEFAULT_CATEGORY_DATA;

  const totalCategoryQuizzes = pieChartData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      {/* Chart A: Quiz Attempts & Performance Trend (Area Chart) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Quiz Attempts & Completion Trend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Monthly timeline breakdown of total vs passed completions.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
            Live Metrics
          </span>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomAreaTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="attempts"
                name="Total Attempts"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAttempts)"
              />
              <Area
                type="monotone"
                dataKey="passed"
                name="Passed Attempts"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPassed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart B: Quiz Categories Distribution (Donut / Pie Chart) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-400" /> Quizzes by Category
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active distribution across primary knowledge domains.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Categorized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
          {/* Donut Chart */}
          <div className="w-full h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-100">{totalCategoryQuizzes}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Quizzes</span>
            </div>
          </div>

          {/* Custom Category Legend List */}
          <div className="space-y-2 text-xs">
            {pieChartData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-slate-300 font-medium truncate max-w-[110px]">{cat.name}</span>
                </div>
                <span className="font-mono text-indigo-300 font-semibold">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

AnalyticsCharts.propTypes = {
  trendData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string,
      attempts: PropTypes.number,
      passed: PropTypes.number,
    })
  ),
  categoryData: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
    })
  ),
  isLoading: PropTypes.bool,
};

AnalyticsCharts.defaultProps = {
  trendData: null,
  categoryData: null,
  isLoading: false,
};
