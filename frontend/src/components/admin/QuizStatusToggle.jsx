import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Send, 
  FileEdit, 
  Archive, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown 
} from 'lucide-react';

/**
 * Quiz Status Pipeline & Publishing Workflow Component
 * Manages quiz status transitions ('DRAFT', 'PUBLISHED', 'ARCHIVED') with publish validation.
 */
export default function QuizStatusToggle({ quiz, onStatusChange }) {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isUpdating, setIsUpdating] = useState(false);
  const [validationWarning, setValidationWarning] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const currentStatus = quiz?.status || 'DRAFT';
  const totalQuestions = quiz?.totalQuestions || quiz?.questions?.length || 0;

  // Validate publishing requirements
  const validatePublish = () => {
    if (!quiz?.title || !quiz.title.trim()) {
      return 'Quiz title cannot be empty.';
    }
    if (!quiz?.timeLimit || quiz.timeLimit <= 0) {
      return 'Quiz must have a valid time limit greater than 0 mins.';
    }
    if (totalQuestions < 1) {
      return 'Cannot publish: Add at least 1 question to the quiz first.';
    }
    return null;
  };

  // Handle status update HTTP call
  const handleStatusUpdate = async (targetStatus) => {
    setValidationWarning(null);

    // If trying to publish, enforce validation rules
    if (targetStatus === 'PUBLISHED') {
      const err = validatePublish();
      if (err) {
        setValidationWarning(err);
        setShowDropdown(false);
        return;
      }
    }

    if (targetStatus === currentStatus) {
      setShowDropdown(false);
      return;
    }

    setIsUpdating(true);
    setShowDropdown(false);

    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = {
        'Content-Type': 'application/json',
        'x-clerk-user-id': user?.id || ''
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: targetStatus })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.quiz) {
          if (onStatusChange) {
            onStatusChange(data.quiz);
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setValidationWarning(errData.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Status update error:', err);
      setValidationWarning('Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block font-sans text-left">
      {/* Current Status Badge & Toggle Trigger */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => setShowDropdown(prev => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
            currentStatus === 'PUBLISHED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40'
              : currentStatus === 'ARCHIVED'
              ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/40'
          }`}
        >
          {isUpdating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: currentStatus === 'PUBLISHED' ? '#10b981' : currentStatus === 'ARCHIVED' ? '#64748b' : '#f59e0b'
              }}
            />
          )}
          <span>{currentStatus}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>

      {/* Validation Warning Alert Popover */}
      {validationWarning && (
        <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl bg-rose-950/90 border border-rose-800/80 text-rose-200 text-xs shadow-2xl backdrop-blur-xl z-30 space-y-1 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Publish Validation Failed</span>
          </div>
          <p className="text-[11px] text-rose-300/90 leading-relaxed">
            {validationWarning}
          </p>
        </div>
      )}

      {/* Workflow Actions Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl z-40 p-1.5 space-y-1 font-sans animate-scale-in">
          {/* Action 1: Publish */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate('PUBLISHED')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              currentStatus === 'PUBLISHED'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'hover:bg-slate-800 text-slate-300 hover:text-emerald-400'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Publish Quiz</span>
          </button>

          {/* Action 2: Unpublish to Draft */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate('DRAFT')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              currentStatus === 'DRAFT'
                ? 'bg-amber-500/20 text-amber-300'
                : 'hover:bg-slate-800 text-slate-300 hover:text-amber-400'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5 text-amber-400" />
            <span>Unpublish to Draft</span>
          </button>

          {/* Action 3: Archive */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate('ARCHIVED')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              currentStatus === 'ARCHIVED'
                ? 'bg-slate-800 text-slate-300'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-slate-400" />
            <span>Archive Quiz</span>
          </button>
        </div>
      )}
    </div>
  );
}

QuizStatusToggle.propTypes = {
  quiz: PropTypes.object.isRequired,
  onStatusChange: PropTypes.func,
};

QuizStatusToggle.defaultProps = {
  onStatusChange: null,
};
