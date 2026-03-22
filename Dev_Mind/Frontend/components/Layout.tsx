import React from 'react';
import { NavigationPage } from '../types';
import { Icons } from './UI';

interface LayoutProps {
  children: React.ReactNode;
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, onLogout }) => {

  const NavItem = ({ page, icon: Icon, label }: { page: NavigationPage; icon: any; label: string }) => {
    const isActive = activePage === page;
    return (
      <button
        onClick={() => onNavigate(page)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 group ${isActive
          ? 'bg-white shadow-sm text-indigo-600'
          : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
          }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-100 to-cyan-100 relative">
      {/* Global Background Animations */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.5] animate-scroll"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[100px] animate-blob mix-blend-multiply filter"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/30 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply filter"></div>
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-amber-500/30 rounded-full blur-[80px] animate-blob animation-delay-4000 mix-blend-multiply filter"></div>
        <div className="absolute top-[20%] right-[20%] w-[25%] h-[25%] bg-cyan-500/30 rounded-full blur-[60px] animate-blob animation-delay-1000 mix-blend-multiply filter"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/40 bg-white/30 backdrop-blur-xl flex flex-col relative z-20 shadow-sm">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Icons.Brain className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
            DevMind
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <NavItem page="dashboard" icon={Icons.LayoutDashboard} label="Overview" />
          <NavItem page="live-detection" icon={Icons.Activity} label="Live Detection" />
          <NavItem page="analytics" icon={Icons.BarChart2} label="Analytics" />
          <NavItem page="projects" icon={Icons.FolderKanban} label="Projects" />
          <NavItem page="settings" icon={Icons.Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-white/40">
          <div className="bg-white/40 rounded-xl p-3 mb-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Icons.ShieldCheck className="w-3 h-3 text-teal-600" />
              <span className="font-semibold text-teal-700">Privacy Active</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">Data stored locally. No cloud upload.</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-2 w-full rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
          >
            <Icons.LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <header className="sticky top-0 z-20 px-8 py-4 bg-white/30 backdrop-blur-md border-b border-white/40 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 capitalize">{activePage.replace('-', ' ')}</h1>
            <p className="text-sm text-slate-500">Welcome back, Developer.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/60 rounded-full border border-white/50 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-600">System Monitoring Active</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 border border-white shadow-sm"></div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};
