import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  Save, 
  ArrowLeft, 
  AlertCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

/**
 * Interactive Question Builder & Management Component
 * Allows admins to dynamically add, edit, reorder, and remove MCQs for a selected quiz.
 */
export default function QuestionBuilder({ quizId, quizTitle, initialQuestions, onSave, onCancel }) {
  // Default sample question if none provided
  const createEmptyQuestion = (index) => ({
    id: `temp-q-${Date.now()}-${index}`,
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    points: 1,
    isExpanded: true
  });

  const [questions, setQuestions] = useState(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      return initialQuestions.map((q, idx) => ({
        id: q.id || `q-${idx}`,
        text: q.text || '',
        options: q.options && q.options.length === 4 
          ? q.options.map(o => (typeof o === 'string' ? o : o.text))
          : ['', '', '', ''],
        correctAnswer: q.options 
          ? q.options.findIndex(o => typeof o === 'object' && o.isCorrect) >= 0
            ? q.options.findIndex(o => typeof o === 'object' && o.isCorrect)
            : q.correctAnswer || 0
          : 0,
        explanation: q.explanation || '',
        points: q.points || 1,
        isExpanded: true
      }));
    }
    return [createEmptyQuestion(1)];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Add Question
  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, createEmptyQuestion(prev.length + 1)]);
    setValidationError(null);
  };

  // Remove Question
  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      setValidationError('A quiz must contain at least one question.');
      return;
    }
    setQuestions(prev => prev.filter((_, idx) => idx !== index));
    setValidationError(null);
  };

  // Toggle Collapse
  const handleToggleExpand = (index) => {
    setQuestions(prev => prev.map((q, idx) => 
      idx === index ? { ...q, isExpanded: !q.isExpanded } : q
    ));
  };

  // Question Text Change
  const handleTextChange = (index, text) => {
    setQuestions(prev => prev.map((q, idx) => 
      idx === index ? { ...q, text } : q
    ));
    setValidationError(null);
  };

  // Option Text Change
  const handleOptionChange = (qIndex, oIndex, text) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx === qIndex) {
        const newOptions = [...q.options];
        newOptions[oIndex] = text;
        return { ...q, options: newOptions };
      }
      return q;
    }));
    setValidationError(null);
  };

  // Correct Answer Change
  const handleCorrectAnswerChange = (qIndex, oIndex) => {
    setQuestions(prev => prev.map((q, idx) => 
      idx === qIndex ? { ...q, correctAnswer: oIndex } : q
    ));
  };

  // Explanation Change
  const handleExplanationChange = (index, explanation) => {
    setQuestions(prev => prev.map((q, idx) => 
      idx === index ? { ...q, explanation } : q
    ));
  };

  // Validate Questions
  const validateForm = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.text.trim()) {
        setValidationError(`Question #${i + 1} statement cannot be empty.`);
        return false;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          setValidationError(`Question #${i + 1} - Choice ${String.fromCharCode(65 + j)} cannot be empty.`);
          return false;
        }
      }
    }
    return true;
  };

  // Save All Handler
  const handleSaveAll = async () => {
    setValidationError(null);
    setSaveSuccess(false);

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(questions);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Save questions error:', err);
      setValidationError(err.message || 'Failed to save questions.');
    } finally {
      setIsSaving(false);
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              title="Back to Quizzes List"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-400" /> Interactive Question Builder
            </h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 pl-11">
            Configuring assessment questions for <strong className="text-indigo-300">{quizTitle || 'Selected Quiz'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-200 font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>+ Add Question</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save All Questions'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {validationError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All questions saved successfully to PostgreSQL repository!</span>
        </div>
      )}

      {/* Questions Stack */}
      <div className="space-y-5">
        {questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4 hover:border-slate-700/80 transition-all"
          >
            {/* Card Top Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono flex items-center justify-center">
                  #{qIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {q.text ? (q.text.length > 50 ? `${q.text.substring(0, 50)}...` : q.text) : `Question ${qIndex + 1}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleExpand(qIndex)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                >
                  {q.isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{q.isExpanded ? 'Collapse' : 'Expand'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:text-rose-400 text-slate-400 transition-all cursor-pointer"
                  title="Remove Question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Collapsible Card Body */}
            {q.isExpanded && (
              <div className="space-y-4 pt-1">
                {/* Question Statement Input */}
                <div>
                  <label className="block text-slate-300 font-medium text-xs mb-1.5">
                    Question Statement *
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Enter the question text or statement here..."
                    value={q.text}
                    onChange={(e) => handleTextChange(qIndex, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* 4 MCQ Option Input Grid */}
                <div>
                  <label className="block text-slate-300 font-medium text-xs mb-2">
                    Multiple Choice Options (Select radio button for correct answer) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((optText, oIndex) => {
                      const isCorrect = q.correctAnswer === oIndex;
                      return (
                        <div
                          key={oIndex}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            isCorrect 
                              ? 'border-emerald-500/50 bg-emerald-950/20 shadow-md shadow-emerald-950/40' 
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-ans-${qIndex}`}
                            checked={isCorrect}
                            onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                            className="w-4 h-4 text-emerald-500 accent-emerald-500 cursor-pointer"
                          />
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                            isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {optionLabels[oIndex]}
                          </span>
                          <input
                            type="text"
                            placeholder={`Choice ${optionLabels[oIndex]} text...`}
                            value={optText}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            className="w-full bg-transparent text-slate-100 text-xs focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Post-Quiz Explanation Input */}
                <div>
                  <label className="block text-slate-400 font-medium text-xs mb-1.5">
                    Solution Rationale / Explanation (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Provide explanatory context displayed after student submits answer..."
                    value={q.explanation}
                    onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleAddQuestion}
          className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-200 font-medium text-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>+ Add Another Question</span>
        </button>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save All Questions'}</span>
        </button>
      </div>
    </div>
  );
}

QuestionBuilder.propTypes = {
  quizId: PropTypes.string.isRequired,
  quizTitle: PropTypes.string,
  initialQuestions: PropTypes.array,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

QuestionBuilder.defaultProps = {
  quizTitle: '',
  initialQuestions: [],
  onSave: null,
  onCancel: null,
};
