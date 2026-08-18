import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { 
  BrainCircuit, 
  LayoutDashboard, 
  Search, 
  History, 
  Trophy, 
  BarChart3,
  Shield, 
  RefreshCw,
  Menu,
  X
} from 'lucide-react';

export default function StudentLayout() {
  const { user } = useUser();
  const [isSwitching, setIsSwitching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const navItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Browse Quizzes', path: '/student/quizzes', icon: Search },
    { label: 'Analytics', path: '/student/analytics', icon: BarChart3 },
    { label: 'Attempt History', path: '/student/history', icon: History },
    { label: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
  ];

  const handleSwitchToAdmin = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSwitching) return;

    try {
      setIsSwitching(true);
      const userEmail = user?.primaryEmailAddress?.emailAddress || 'sarthaksharma1703@gmail.com';
      const userId = user?.id;

      const response = await fetch(`${API_BASE_URL}/users/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          clerkId: userId,
          role: 'ADMIN',
        }),
      });

      if (response.ok) {
        window.location.href = '/admin/dashboard';
      } else {
        console.error('Failed to switch role to ADMIN');
        setIsSwitching(false);
      }
    } catch (err) {
      console.error('Role switch fetch error:', err);
      setIsSwitching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Student Header Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & STUDENT Badge */}
          <div className="flex items-center gap-8">
            <Link to="/student/dashboard" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Assessify<span className="text-indigo-400"> AI</span>
                <span className="ml-2.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
                  STUDENT
                </span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 font-medium'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Dev Mode Role Switcher */}
            <button
              type="button"
              onClick={handleSwitchToAdmin}
              disabled={isSwitching}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02]"
              title="Switch role to ADMIN Mode"
            >
              {isSwitching ? (
                <RefreshCw className="w-3.5 h-3.5 text-purple-300 animate-spin" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span>{isSwitching ? 'Switching...' : 'Switch to ADMIN Mode'}</span>
            </button>

            {/* User Profile Button */}
            <div className="pl-2 border-l border-slate-800 flex items-center gap-2">
              <UserButton 
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 border-2 border-indigo-500/40 hover:border-indigo-500 transition-colors'
                  }
                }}
              />
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 border-t border-slate-800 bg-slate-950/95 flex flex-col gap-2">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleSwitchToAdmin}
              disabled={isSwitching}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold"
            >
              {isSwitching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              <span>Switch to ADMIN Mode</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Student Portal Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        Assessify AI Student Portal &bull; Interactive Quiz Platform
      </footer>
    </div>
  );
}
