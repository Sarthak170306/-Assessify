import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Edit3, 
  Trash2, 
  Plus, 
  Save, 
  ArrowLeft, 
  AlertCircle, 
  X, 
  Clock, 
  Award, 
  Layers, 
  HelpCircle, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

/**
 * AI-Generated Questions Preview & Verification Modal Component
 */
export default function AIQuizPreviewModal({
  isOpen,
  onClose,
  previewQuiz,
  categories = [],
  onSaveSuccess
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [timeLimit, setTimeLimit] = useState(15);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Populate local editable state when previewQuiz changes
  useEffect(() => {
    if (previewQuiz) {
      setTitle(previewQuiz.title || 'AI Generated Quiz');
      setDescription(previewQuiz.description || '');
      setCategoryId(previewQuiz.categoryId || (categories[0]?.id || ''));
      setTimeLimit(previewQuiz.timeLimit || 15);
      setPassingScore(previewQuiz.passingScore || 70);
      
      const qList = Array.isArray(previewQuiz.questions) ? previewQuiz.questions : [];
      setQuestions(qList.map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options.map(o => ({ ...o })) : [
          { text: 'Option A', isCorrect: true },
          { text: 'Option B', isCorrect: false },
          { text: 'Option C', isCorrect: false },
          { text: 'Option D', isCorrect: false }
        ]
      })));
    }
  }, [previewQuiz, categories]);

  if (!isOpen || !previewQuiz) return null;

  // Handle Question Text Change
  const handleQuestionTextChange = (idx, text) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, text } : q));
  };

  // Handle Option Text Change
  const handleOptionTextChange = (qIdx, oIdx, text) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const updatedOpts = q.options.map((opt, j) => j === oIdx ? { ...opt, text } : opt);
      return { ...q, options: updatedOpts };
    }));
  };

  // Handle Correct Option Radio Toggle
  const handleSelectCorrectOption = (qIdx, oIdx) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const updatedOpts = q.options.map((opt, j) => ({
        ...opt,
        isCorrect: j === oIdx
      }));
      return { ...q, options: updatedOpts };
    }));
  };

  // Handle Explanation Change
  const handleExplanationChange = (idx, explanation) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, explanation } : q));
  };

  // Delete Question
  const handleDeleteQuestion = (idx) => {
    if (questions.length <= 1) {
      setError('Quiz must contain at least 1 question.');
      return;
    }
    setError(null);
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add Question
  const handleAddQuestion = () => {
    setError(null);
    const newQ = {
      text: `New Question ${questions.length + 1} Statement`,
      options: [
        { text: 'Option A Choice', isCorrect: true },
        { text: 'Option B Choice', isCorrect: false },
        { text: 'Option C Choice', isCorrect: false },
        { text: 'Option D Choice', isCorrect: false }
      ],
      explanation: 'Educational explanation for the correct answer choice.'
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  // Handle Bulk Save (POST /api/quizzes/save-ai-quiz)
  const handleSaveQuiz = async (targetStatus = 'DRAFT') => {
    if (!title.trim()) {
      setError('Quiz title cannot be empty.');
      return;
    }

    if (questions.length === 0) {
      setError('Quiz must contain at least 1 question before saving.');
      return;
    }

    // Validate that every question has at least 1 correct option
    const invalidQ = questions.find((q) => !q.options.some(o => o.isCorrect));
    if (invalidQ) {
      setError('Every question must have exactly 1 correct answer option selected.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const validCategoryId = categoryId || (categories[0]?.id || '');

      const payload = {
        title: title.trim(),
        description: description ? description.trim() : '',
        categoryId: validCategoryId,
        timeLimit: parseInt(timeLimit, 10) || 15,
        passingScore: parseInt(passingScore, 10) || 70,
        status: targetStatus,
        questions: questions.map((q) => ({
          text: q.text || q.questionText || '',
          explanation: q.explanation || '',
          points: Number(q.points) || 1,
          options: (q.options || []).map((opt) => ({
            text: opt.text || opt.optionText || '',
            isCorrect: Boolean(opt.isCorrect)
          }))
        }))
      };

      const res = await fetch(`${API_BASE_URL}/quizzes/save-ai-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok && res.status !== 200 && res.status !== 201) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Bulk save failed (${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.quiz) {
        if (onSaveSuccess) {
          onSaveSuccess(data.quiz);
        }
        onClose();
      } else {
        throw new Error(data.message || 'Failed to persist AI quiz into database.');
      }
    } catch (err) {
      console.error('Save AI Quiz error:', err);
      setError(err.message || 'Failed to save AI quiz. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-100 animate-scale-in my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-950/80 border-b border-slate-800 p-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-purple-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">AI Quiz Verification & Fine-Tuning</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI Draft: {questions.length} Questions Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">Review, modify, or add questions before persisting to database.</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Scrollable Settings & Question List) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Quiz Settings Panel */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" /> Assessment Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Quiz Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Quiz title..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs outline-none cursor-pointer"
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <option value="">General Domain</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Description</label>
              <textarea
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of knowledge domain tested..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value, 10) || 15)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseInt(e.target.value, 10) || 70)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Questions Review Cards */}
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                Generated Questions ({questions.length})
              </h3>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <span className="px-3 py-1 rounded-xl bg-slate-900 text-indigo-400 border border-slate-800 text-xs font-mono font-bold">
                    Q{qIdx + 1} of {questions.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(qIdx)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Question Statement Textarea */}
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                    Question Statement
                  </label>
                  <textarea
                    rows="2"
                    value={q.text}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 text-xs leading-relaxed outline-none"
                  />
                </div>

                {/* 4 Options Grid */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Options Choice List (Select radio button for Correct Answer)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options?.map((opt, oIdx) => {
                      const optLabel = String.fromCharCode(65 + oIdx);
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                            opt.isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-opt-${qIdx}`}
                            checked={Boolean(opt.isCorrect)}
                            onChange={() => handleSelectCorrectOption(qIdx, oIdx)}
                            className="w-4 h-4 text-emerald-500 accent-emerald-500 cursor-pointer"
                          />
                          <span className="font-mono font-bold text-xs shrink-0 text-slate-400">
                            {optLabel}.
                          </span>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                            className="w-full bg-transparent text-xs outline-none text-slate-100"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Callout */}
                <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Educational Explanation
                  </span>
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                    placeholder="Explanation for the correct option..."
                    className="w-full bg-transparent text-xs text-indigo-200 outline-none placeholder:text-indigo-400/50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer Toolbar */}
        <div className="bg-slate-950/90 border-t border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Discard Preview
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveQuiz('DRAFT')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveQuiz('PUBLISHED')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save & Publish Immediately</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
