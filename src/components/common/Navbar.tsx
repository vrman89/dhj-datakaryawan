import React from 'react';
import { Menu, X, Shield, FileText, LogOut, ExternalLink, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  currentMode: 'admin' | 'employee';
  onSwitchMode: (mode: 'admin' | 'employee') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  currentMode,
  onSwitchMode,
}) => {
  const { currentUser, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          {currentMode === 'admin' && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div 
            onClick={() => onSwitchMode(isAdmin ? 'admin' : 'employee')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md group-hover:scale-105 transition-transform">
              DHJ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  EMPLOYEE DATA
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden xs:block">
                Employee Data Management System
              </p>
            </div>
          </div>
        </div>

        {/* Right: Mode switcher & Auth Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80 text-xs">
            <button
              onClick={() => onSwitchMode('employee')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentMode === 'employee'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Form</span> Karyawan
            </button>

            <button
              onClick={() => onSwitchMode('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentMode === 'admin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* User profile / Logout if logged in */}
          {currentUser && currentMode === 'admin' && (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-white leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-medium text-emerald-400">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Keluar / Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
