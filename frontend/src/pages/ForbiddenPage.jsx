import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useUser } from '@clerk/clerk-react';
import { useAuthContext } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, RefreshCw, Lock, Shield } from 'lucide-react';

/**
 * 403 Access Denied Fallback UI Component
 * Rendered when a user tries to access a route for which their database role ('ADMIN' | 'STUDENT') lacks authorization.
 */
export default function ForbiddenPage({ requiredRole = 'ADMIN', customMessage = '' }) {
  const { user } = useUser();
  const { dbRole, role } = useAuthContext();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const [isSwitching, setIsSwitching] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const currentRole = (dbRole || role || 'STUDENT').toUpperCase();
  const targetRole = currentRole === 'ADMIN' ? 'STUDENT' : 'ADMIN';

  const handleDashboardRedirect = (e) => {
    if (e) e.preventDefault();
    const dashboardPath = currentRole === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
    window.location.href = dashboardPath;
  };

  const handleDevRoleSwitch = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSwitching) return;

    try {
      setIsSwitching(true);
      setErrorMessage(null);

      const userEmail = user?.primaryEmailAddress?.emailAddress || 'sarthaksharma1703@gmail.com';
      const userId = user?.id;

      const response = await fetch(`${API_BASE_URL}/users/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          clerkId: userId,
          role: targetRole
        })
      });

      if (response.ok) {
        const redirectPath = targetRole === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
        window.location.href = redirectPath;
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(data.message || 'Failed to switch role in development mode.');
        setIsSwitching(false);
      }
    } catch (err) {
      console.error('Dev role switch fetch error:', err);
      setErrorMessage(err.message || 'Failed to connect to backend server.');
      setIsSwitching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-rose-500/30 text-center relative z-10 shadow-2xl bg-slate-900/80 backdrop-blur-2xl">
        {/* Hero Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        {/* Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 mb-4">
          <Lock className="w-3 h-3 text-rose-400" />
          <span>403 &bull; Access Restricted</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-slate-100">
          Access Denied
        </h1>

        {/* Message */}
        <p className="text-slate-400 text-xs leading-relaxed mb-6">
          {customMessage ? (
            customMessage
          ) : (
            <>
              Your current role is <span className="font-semibold text-rose-300 font-mono">'{currentRole}'</span>, which is not authorized to access this route. Required role: <span className="font-semibold text-indigo-300 font-mono">{requiredRole}</span>.
            </>
          )}
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800/50 rounded-xl text-xs text-rose-300 text-left">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleDashboardRedirect}
            disabled={isSwitching}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" /> Go to Authorized Dashboard
          </button>

          {/* Secondary Dev Action Button */}
          <button
            type="button"
            onClick={handleDevRoleSwitch}
            disabled={isSwitching}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {isSwitching ? (
              <>
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                <span>Updating role in database...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-purple-300" />
                <span>Switch Role to '{targetRole}' (Dev Mode)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

ForbiddenPage.propTypes = {
  requiredRole: PropTypes.string,
  customMessage: PropTypes.string,
};

ForbiddenPage.defaultProps = {
  requiredRole: 'ADMIN',
  customMessage: '',
};
