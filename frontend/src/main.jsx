import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Safety check component if publishable key is missing
function MissingKeyWarning() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold mb-2 text-rose-400">Missing Clerk Publishable Key</h2>
        <p className="text-slate-300 text-sm mb-4">
          The <code className="bg-slate-950 px-2 py-1 rounded text-indigo-300 font-mono text-xs">VITE_CLERK_PUBLISHABLE_KEY</code> environment variable is missing or empty.
        </p>
        <p className="text-slate-400 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 text-left font-mono">
          Please add your key to <span className="text-emerald-400">frontend/.env</span>:<br/>
          <span className="text-slate-300">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</span>
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {!PUBLISHABLE_KEY ? (
      <MissingKeyWarning />
    ) : (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/sign-in">
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    )}
  </React.StrictMode>
);
