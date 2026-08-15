import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Search, 
  Clock, 
  Award, 
  HelpCircle, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2 
} from 'lucide-react';

/**
 * Student Quiz Catalog & Discovery Portal Component
 */
export default function QuizCatalog() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Published Quizzes for Student Catalog
  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${API_BASE_URL}/student/quizzes`;
      const queryParams = [];
      if (selectedCategory !== 'ALL') {
        queryParams.push(`category=${selectedCategory}`);
      }
      if (searchTerm.trim()) {
        queryParams.push(`search=${encodeURIComponent(searchTerm.trim())}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Failed to fetch catalog (${res.status})`);

      const data = await res.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error('Fetch student catalog error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchTerm, user, getToken, API_BASE_URL]);

  // Fetch Categories for Filter Tabs
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories || []);
        }
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-100 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900/80 to-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Assessment Catalog</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Explore Assessments & Practice Tests
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Test your domain expertise, track real-time score telemetry, and validate your knowledge across curated topics.
          </p>

          {/* Search Input Bar */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search assessments by topic name, skills, or key domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-3.5 text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
              : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          All Topics ({quizzes.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 3. Responsive Quiz Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          /* Skeleton Pulse Grid */
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4 animate-pulse shadow-xl">
              <div className="flex items-center justify-between">
                <div className="w-24 h-5 rounded-full bg-slate-800" />
                <div className="w-16 h-4 rounded bg-slate-800" />
              </div>
              <div className="w-48 h-6 rounded bg-slate-800" />
              <div className="w-full h-10 rounded bg-slate-800/60" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="h-8 rounded-xl bg-slate-800" />
                <div className="h-8 rounded-xl bg-slate-800" />
                <div className="h-8 rounded-xl bg-slate-800" />
              </div>
              <div className="h-10 rounded-2xl bg-slate-800 pt-2" />
            </div>
          ))
        ) : quizzes.length === 0 ? (
          /* Empty Catalog State */
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center shadow-xl">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">No published assessments found</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {searchTerm || selectedCategory !== 'ALL'
                  ? 'No practice tests matched your search terms or active category filter.'
                  : 'Check back soon! Administrators are currently configuring new practice assessments.'}
              </p>
              {(searchTerm || selectedCategory !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('ALL');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Quiz Cards */
          quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between group relative overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/5"
            >
              <div className="space-y-3">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {quiz.categoryName}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {quiz.description || 'Comprehensive skill evaluation quiz covering foundational and advanced domain principles.'}
                  </p>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-500 block">Duration</span>
                    <span className="text-xs font-mono font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {quiz.timeLimit}m
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-500 block">Questions</span>
                    <span className="text-xs font-mono font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                      <HelpCircle className="w-3 h-3 text-indigo-400" />
                      {quiz.totalQuestions}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-500 block">Passing</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                      <Award className="w-3 h-3 text-emerald-400" />
                      {quiz.passingScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary CTA Button */}
              <div className="pt-5">
                <button
                  type="button"
                  onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Start Assessment</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
