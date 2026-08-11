import React from 'react';
import PropTypes from 'prop-types';
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';
import ForbiddenPage from '../pages/ForbiddenPage';

/**
 * ProtectedRoute Guard Component
 * Guards routes based on Clerk authentication state and PostgreSQL database roles ('ADMIN' | 'STUDENT').
 */
export default function ProtectedRoute({ allowedRoles = [], children = null }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { dbUser, role, dbRole, isSyncing, isLoading } = useAuthContext();

  const isAuthLoading = !isLoaded || ((isSyncing || isLoading) && !dbUser);

  // State 1: Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-sm w-full shadow-2xl">
          <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Verifying session & permissions...</h3>
            <p className="text-xs text-slate-400 mt-1">Please wait while Assessify AI checks authentication state.</p>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Unauthenticated Check
  if (!isSignedIn || !user) {
    return <Navigate to="/sign-in" replace />;
  }

  // State 3: Role Authorization Guard & 403 Forbidden UI
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    const currentRole = (dbRole || role || 'STUDENT').toUpperCase();

    const isAuthorized = normalizedAllowed.includes(currentRole);

    if (!isAuthorized) {
      return <ForbiddenPage requiredRole={allowedRoles.join(' or ')} />;
    }
  }

  // State 4: Authorized - Render children or Outlet
  return children ? children : <Outlet />;
}

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node,
};

ProtectedRoute.defaultProps = {
  allowedRoles: [],
  children: null,
};
