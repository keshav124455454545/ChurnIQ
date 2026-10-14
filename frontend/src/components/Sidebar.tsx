import React from 'react';
import {
  Layers,
  BrainCircuit,
  FileSpreadsheet,
  Activity,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Radio,
  X,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { HealthResponse } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  health: HealthResponse | null;
  loadingHealth: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  health,
  loadingHealth,
  darkMode,
  onToggleDarkMode,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Layers, badge: null },
    { id: 'predict', label: 'Predict Risk', icon: BrainCircuit, badge: 'Live' },
    { id: 'batch', label: 'Batch CSV', icon: FileSpreadsheet, badge: '500 max' },
    { id: 'modellab', label: 'Model Lab', icon: Activity, badge: 'v1.0' },
    { id: 'insights', label: 'Insights & EDA', icon: BarChart3, badge: null },
    { id: 'methodology', label: 'Methodology', icon: BookOpen, badge: null },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-theme-card border-r border-theme-border select-none transition-colors">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-theme-border">
        <div
          className="flex items-center space-x-3 cursor-pointer overflow-hidden"
          onClick={() => handleSelectTab('overview')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white font-extrabold" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0 transition-opacity duration-200">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-theme-text font-sans">ChurnIQ</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-md">
                  Data Science
                </span>
              </div>
              <p className="text-[11px] text-theme-muted truncate">Churn Prediction Model</p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-theme-muted px-3 mb-2">
          {(!collapsed || mobileOpen) ? 'Navigation' : '•••'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              title={collapsed && !mobileOpen ? item.label : undefined}
              className={`w-full flex items-center ${
                collapsed && !mobileOpen ? 'justify-center px-2' : 'justify-between px-3.5'
              } py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-theme-muted'
                  }`}
                />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
              </div>

              {(!collapsed || mobileOpen) && item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-emerald-500 text-white dark:text-black'
                      : 'bg-theme-hover text-theme-muted'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Telemetry Badge & Controls */}
      <div className="p-3 border-t border-theme-border bg-theme-card space-y-3">
        {(!collapsed || mobileOpen) && (
          <div className="p-3 rounded-xl bg-theme-hover border border-theme-border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-theme-muted flex items-center">
                <Radio className="w-3 h-3 text-emerald-500 mr-1.5 animate-pulse" />
                Pipeline Model
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/15">
                {health?.status === 'healthy' ? 'READY' : 'CONNECTING'}
              </span>
            </div>
            <div className="text-[11px] text-theme-text font-mono flex items-center justify-between">
              <span className="text-theme-muted">Algorithm:</span>
              <span className="font-semibold">RandomForest</span>
            </div>
            <div className="text-[10px] text-theme-muted flex items-center justify-between">
              <span>Held-Out AUC:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">0.8420</span>
            </div>
          </div>
        )}

        {/* Theme Toggle & Collapse Toggle */}
        <div className="flex items-center justify-between gap-2">
          {(!collapsed || mobileOpen) && (
            <button
              onClick={onToggleDarkMode}
              className="flex-1 py-1.5 px-2 rounded-lg bg-theme-hover text-theme-text hover:text-emerald-500 text-xs flex items-center justify-center space-x-1.5 border border-theme-border transition-all"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="text-[11px] font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          )}

          {/* Desktop Collapse / Expand Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden md:flex py-1.5 px-2 rounded-lg bg-theme-hover text-theme-muted hover:text-theme-text text-xs items-center justify-center border border-theme-border transition-all ${
              collapsed ? 'w-full' : ''
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-emerald-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-theme-muted" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-theme-card shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
