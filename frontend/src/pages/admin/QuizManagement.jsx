import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import QuestionBuilder from '../../components/admin/QuestionBuilder';
import QuizStatusToggle from '../../components/admin/QuizStatusToggle';
import AIQuizGeneratorModal from '../../components/admin/AIQuizGeneratorModal';
import AIQuizPreviewModal from '../../components/admin/AIQuizPreviewModal';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Filter, 
  RefreshCw, 
  HelpCircle, 
  FileText, 
  AlertTriangle, 
  X, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function QuizManagement() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Question Builder mode state
  const [selectedQuizForBuilder, setSelectedQuizForBuilder] = useState(null);

  // AI Quiz Generator & Preview modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewQuizData, setPreviewQuizData] = useState(null);

  // Delete modal state
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    timeLimit: 30,
    passingScore: 70,
    status: 'DRAFT'
  });
  const [categories, setCategories] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch Quizzes from GET /api/quizzes
  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${API_BASE_URL}/quizzes`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error(`Failed to fetch quizzes (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error('Fetch quizzes error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, getToken, API_BASE_URL]);

  // Fetch Categories for dropdown select
  const fetchCategories = useCallback(async () => {
    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/categories`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
          return;
        }
      }
      // Fallback categories
      setCategories([
        { id: 'f23b7d8a-995e-4cef-8d39-7c44bac20da1', name: 'Web Development' },
        { id: 'cat-ai-ml', name: 'AI & Machine Learning' },
        { id: 'cat-data-sci', name: 'Data Science' },
      ]);
    } catch (e) {
      setCategories([
        { id: 'f23b7d8a-995e-4cef-8d39-7c44bac20da1', name: 'Web Development' },
        { id: 'cat-ai-ml', name: 'AI & Machine Learning' }
      ]);
    }
  }, [user, getToken, API_BASE_URL]);

  useEffect(() => {
    fetchQuizzes();
    fetchCategories();
  }, [fetchQuizzes, fetchCategories]);

  // Handle Quiz Status Pipeline Toggle Update
  const handleQuizStatusChange = (updatedQuiz) => {
    setQuizzes(prev => prev.map(q => 
      q.id === updatedQuiz.id ? { ...q, ...updatedQuiz } : q
    ));
  };

  // Handle AI Generated Quiz Callback -> Opens AI Preview Modal
  const handleAiQuizGenerated = (generatedQuiz) => {
    if (generatedQuiz) {
      setPreviewQuizData(generatedQuiz);
      setIsPreviewModalOpen(true);
    }
  };

  // Handle AI Save Success Callback
  const handleAiSaveSuccess = (createdQuiz) => {
    if (createdQuiz) {
      setQuizzes(prev => [createdQuiz, ...prev]);
      fetchQuizzes();
    }
  };

  // Handle QuestionBuilder Save
  const handleQuestionsSave = async (questions) => {
    if (!selectedQuizForBuilder) return;
    try {
      setQuizzes(prev => prev.map(q => 
        q.id === selectedQuizForBuilder.id 
          ? { ...q, totalQuestions: questions.length, questions } 
          : q
      ));
    } catch (err) {
      console.error('Save questions error:', err);
    }
  };

  // If in QuestionBuilder Mode, render QuestionBuilder component
  if (selectedQuizForBuilder) {
    return (
      <QuestionBuilder
        quizId={selectedQuizForBuilder.id}
        quizTitle={selectedQuizForBuilder.title}
        initialQuestions={selectedQuizForBuilder.questions || []}
        onSave={handleQuestionsSave}
        onCancel={() => setSelectedQuizForBuilder(null)}
      />
    );
  }

  // Calculate Summary KPI Stats
  const totalQuizzesCount = quizzes.length;
  const publishedQuizzesCount = quizzes.filter(q => q.status === 'PUBLISHED').length;
  const draftQuizzesCount = quizzes.filter(q => q.status === 'DRAFT' || q.status === 'ARCHIVED').length;

  // Filtered Quiz List
  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.categoryName && q.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Delete Quiz
  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    setIsDeleting(true);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = { 'x-clerk-user-id': user?.id || '' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/quizzes/${quizToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== quizToDelete.id));
        setQuizToDelete(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Failed to delete quiz');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete quiz');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Create Quiz Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setIsSubmitting(true);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = {
        'Content-Type': 'application/json',
        'x-clerk-user-id': user?.id || ''
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        ...formData,
        categoryId: formData.categoryId || (categories[0]?.id || 'f23b7d8a-995e-4cef-8d39-7c44bac20da1')
      };

      const res = await fetch(`${API_BASE_URL}/quizzes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.quiz) {
          setQuizzes(prev => [data.quiz, ...prev]);
          setShowCreateModal(false);
          setFormData({
            title: '',
            description: '',
            categoryId: '',
            timeLimit: 30,
            passingScore: 70,
            status: 'DRAFT'
          });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Failed to create quiz');
      }
    } catch (err) {
      console.error('Create quiz error:', err);
      alert('Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-indigo-400" /> Quiz Management Repository
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Create, publish, configure time limits, and monitor platform quizzes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchQuizzes}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* AI Quiz Generator Trigger Button */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quiz</span>
          </button>
        </div>
      </div>

      {/* 1. Quiz KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card A: Total Quizzes */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium">Total Quizzes</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">
              {isLoading ? '...' : totalQuizzesCount}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Configured in PostgreSQL</p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card B: Active / Published Quizzes */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium">Published & Active</span>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">
              {isLoading ? '...' : publishedQuizzesCount}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Available for student attempts</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card C: Draft / Archived Quizzes */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium">Drafts & Archived</span>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">
              {isLoading ? '...' : draftQuizzesCount}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Pending question configuration</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Quiz Management Table & Data List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
        {/* Toolbar Header Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search quizzes by title, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Drafts Only</option>
              <option value="ARCHIVED">Archived Only</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3.5">Quiz Details</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Passing Score</th>
                <th className="p-3.5">Status Pipeline</th>
                <th className="p-3.5">Questions</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {isLoading ? (
                /* Skeleton Loading Pulse Rows */
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4 space-y-2">
                      <div className="w-48 h-4 rounded bg-slate-800" />
                      <div className="w-64 h-3 rounded bg-slate-800/60" />
                    </td>
                    <td className="p-4"><div className="w-16 h-4 rounded bg-slate-800" /></td>
                    <td className="p-4"><div className="w-12 h-4 rounded bg-slate-800" /></td>
                    <td className="p-4"><div className="w-24 h-6 rounded-xl bg-slate-800" /></td>
                    <td className="p-4"><div className="w-10 h-4 rounded bg-slate-800" /></td>
                    <td className="p-4 text-right"><div className="w-24 h-6 rounded bg-slate-800 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredQuizzes.length === 0 ? (
                /* Empty State Callout */
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-200">No quizzes found</h3>
                      <p className="text-xs text-slate-400">
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'No quizzes matched your search or status filter criteria.'
                          : 'Get started by creating your very first assessment quiz.'}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAiModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" /> Generate with AI
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Quiz Rows */
                filteredQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm group-hover:text-indigo-300 transition-colors">
                          {quiz.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {quiz.categoryName}
                        </span>
                      </div>
                      {quiz.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {quiz.description}
                        </p>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {quiz.timeLimit} mins
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono font-semibold text-emerald-400">
                        {quiz.passingScore}%
                      </span>
                    </td>

                    <td className="p-3.5">
                      {/* Dynamic Quiz Status Pipeline Toggle */}
                      <QuizStatusToggle
                        quiz={quiz}
                        onStatusChange={handleQuizStatusChange}
                      />
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-slate-300">
                        {quiz.totalQuestions || 0} questions
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Manage Questions */}
                        <button
                          type="button"
                          title="Manage Questions"
                          onClick={() => setSelectedQuizForBuilder(quiz)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:text-indigo-400 text-slate-400 transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Questions</span>
                        </button>

                        {/* Edit Quiz */}
                        <button
                          type="button"
                          title="Edit Quiz"
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-slate-200 text-slate-400 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Quiz */}
                        <button
                          type="button"
                          title="Delete Quiz"
                          onClick={() => setQuizToDelete(quiz)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:text-rose-400 text-slate-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Quiz Generator Modal */}
      <AIQuizGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onQuizGenerated={handleAiQuizGenerated}
        categories={categories}
      />

      {/* AI Quiz Verification & Preview Modal */}
      <AIQuizPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        previewQuiz={previewQuizData}
        categories={categories}
        onSaveSuccess={handleAiSaveSuccess}
      />

      {/* Delete Confirmation Modal */}
      {quizToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Delete Quiz Confirmation</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              Are you sure you want to permanently delete <strong className="text-slate-100">{quizToDelete.title}</strong>? All associated questions and student attempt data will be deleted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuizToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Create New Assessment Quiz
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Quiz Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced TypeScript & Node.js Patterns"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Short summary of knowledge domain tested..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value, 10) || 70 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Web Development</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                >
                  {isSubmitting ? 'Saving...' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
