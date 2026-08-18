import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  X, 
  Layers, 
  Sliders, 
  HelpCircle, 
  CheckCircle2, 
  Loader2, 
  Wand2, 
  AlertCircle 
} from 'lucide-react';

/**
 * AI Quiz Generator Modal Component
 */
export default function AIQuizGeneratorModal({
  isOpen,
  onClose,
  onQuizGenerated,
  categories = []
}) {
  const [topic, setTopic] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const loadingMessages = [
    'Synthesizing topic concepts...',
    'Generating balanced MCQs & option choices...',
    'Verifying answer correctness & explanations...',
    'Finalizing AI assessment payload...'
  ];

  // Cycling status messages effect during generation
  useEffect(() => {
    let interval = null;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  // Set default category when modal opens or categories update
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim() || topic.trim().length < 3) {
      setError('Please enter a valid topic with at least 3 characters.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const selectedCategoryObj = categories.find((c) => c.id === categoryId);
      const categoryName = selectedCategoryObj ? selectedCategoryObj.name : 'General';

      const res = await fetch(`${API_BASE_URL}/quizzes/generate-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: topic.trim(),
          categoryId,
          categoryName,
          difficulty,
          count: parseInt(count, 10)
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `AI Generation failed (${res.status})`);
      }

      const data = await res.json();
      if (data.success && (data.quiz || data.generatedQuiz)) {
        const generated = data.quiz || data.generatedQuiz;
        if (onQuizGenerated) {
          onQuizGenerated(generated);
        }
        onClose();
        // Reset form
        setTopic('');
        setError(null);
      } else {
        throw new Error(data.message || 'AI engine returned an invalid response structure.');
      }
    } catch (err) {
      console.error('AI Quiz Generation error:', err);
      setError(err.message || 'Failed to generate quiz with AI. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-slate-100 animate-scale-in relative overflow-hidden">
        
        {/* Decorative Top Ambient Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Generate Quiz with AI
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Gemini Powered
                </span>
              </h2>
              <p className="text-xs text-slate-400">Configure parameters to synthesize an assessment.</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Error Message */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Overlay / Content */}
        {isGenerating ? (
          <div className="py-10 text-center space-y-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Sparkles className="w-7 h-7 text-purple-400 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">Generating AI Assessment</h3>
              <p className="text-xs text-indigo-400 font-mono animate-pulse">
                {loadingMessages[loadingMessageIndex]}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="space-y-5 relative z-10">
            {/* Field 1: Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Topic or Subject Matter <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Docker Orchestration, React Hooks, Node.js Async..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Field 2: Target Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Target Category Domain
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs outline-none transition-all cursor-pointer"
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

            {/* Field 3: Difficulty Level (Pill Selector) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Easy', 'Medium', 'Hard'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      difficulty === lvl
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: Number of Questions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      count === num
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generate Assessment</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
