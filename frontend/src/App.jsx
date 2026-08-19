import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useAuthContext } from './context/AuthContext';

// Auth Pages
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

// Layouts & Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';
import StudentLayout from './components/layouts/StudentLayout';

// Admin Pages (Real Implementations)
import AdminDashboard from './pages/admin/AdminDashboard';
import QuizManagement from './pages/admin/QuizManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import PlaceholderView from './pages/PlaceholderView';

// Student Pages (Real Implementations)
import StudentDashboard from './pages/student/StudentDashboard';
import QuizCatalog from './pages/student/QuizCatalog';
import QuizDetails from './pages/student/QuizDetails';
import QuizAttemptEngine from './pages/student/QuizAttemptEngine';
import QuizResult from './pages/student/QuizResult';
import StudentAnalytics from './pages/student/Analytics';
import StudentLeaderboard from './pages/student/Leaderboard';
import StudentAttemptHistory from './pages/student/AttemptHistory';

/**
 * Root Redirector Component
 * Smart route handler for root domain '/'
 */
function RootRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  const { dbRole, role, isSyncing, dbUser } = useAuthContext();

  if (!isLoaded || (isSyncing && !dbUser)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="text-center text-slate-400 text-xs tracking-wider uppercase font-semibold animate-pulse">
          Initializing Assessify AI...
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  const currentRole = (dbRole || role || 'STUDENT').toUpperCase();
  if (currentRole === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
}

// Module Placeholders (Remaining modules)
const UserManagement = () => (
  <PlaceholderView
    title="User Management"
    description="Manage user roles, account statuses, and permissions."
    badge="Admin Module"
  />
);

/**
 * App Component - Primary React Router Entry Point
 */
export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Routes>
        {/* 1. Root Route Handling */}
        <Route path="/" element={<RootRedirect />} />

        {/* 2. Public Authentication Routes */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* 3. Admin Portal Routes (/admin/*) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="quizzes" element={<QuizManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        {/* 4. Student Portal Routes (/student/*) */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="quizzes" element={<QuizCatalog />} />
          <Route path="quizzes/:id" element={<QuizDetails />} />
          <Route path="quiz/:id/attempt" element={<QuizAttemptEngine />} />
          <Route path="quiz-result/:attemptId" element={<QuizResult />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="history" element={<StudentAttemptHistory />} />
          <Route path="attempts" element={<Navigate to="/student/history" replace />} />
          <Route path="leaderboard" element={<StudentLeaderboard />} />
        </Route>

        {/* 5. Legacy & Catch-All Route Handling */}
        <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
