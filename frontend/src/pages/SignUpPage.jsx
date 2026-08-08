import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand Logo */}
      <div className="mb-8 flex flex-col items-center text-center z-10">
        <Link to="/" className="flex items-center gap-3 group mb-2">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight">
            Assessify<span className="gradient-text"> AI</span>
          </span>
        </Link>
        <p className="text-slate-400 text-sm max-w-sm">
          Create an account to start building & taking AI-powered quizzes
        </p>
      </div>

      {/* Clerk SignUp Component */}
      <div className="z-10 shadow-2xl rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-2">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              card: 'bg-transparent shadow-none border-none',
              headerTitle: 'text-slate-100 font-bold',
              headerSubtitle: 'text-slate-400',
              socialButtonsBlockButton: 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200',
              formButtonPrimary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-md shadow-indigo-500/25',
              formFieldInput: 'bg-slate-950 border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500/20',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-medium',
              dividerLine: 'bg-slate-800',
              dividerText: 'text-slate-500',
              identityPreviewText: 'text-slate-300',
              formFieldLabel: 'text-slate-300'
            }
          }}
        />
      </div>

      <footer className="mt-8 text-slate-500 text-xs text-center z-10">
        &copy; {new Date().getFullYear()} Assessify AI. All rights reserved.
      </footer>
    </div>
  );
}
