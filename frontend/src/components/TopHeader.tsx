import React, { useState, useRef } from 'react';
import {
  BrainCircuit,
  FileSpreadsheet,
  BarChart3,
  BookOpen,
  Sparkles,
  ExternalLink,
  Sun,
  Moon,
  Activity,
  Layers,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { HealthResponse } from '../types';

interface TopHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthResponse | null;
  loadingHealth: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  health,
  loadingHealth,
  darkMode,
  onToggleDarkMode,
}) => {
  const [mobileSlidebarOpen, setMobileSlidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'predict', label: 'Predict Churn', icon: BrainCircuit },
    { id: 'batch', label: 'Batch CSV', icon: FileSpreadsheet },
    { id: 'modellab', label: 'Model Evaluation', icon: Activity },
    { id: 'insights', label: 'Data Insights', icon: BarChart3 },
    { id: 'methodology', label: 'About the Model', icon: BookOpen },
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -140 : 140,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-theme-card/95 backdrop-blur-md border-b border-theme-border transition-colors">
      {/* Top Brand & Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand & Mobile Slidebar Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Slidebar Menu Button */}
          <button
            onClick={() => setMobileSlidebarOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl bg-theme-cardSub border border-theme-border text-theme-text hover:text-emerald-500 transition-all active:scale-95 shadow-sm"
            aria-label="Toggle top mobile slidebar"
            title="Open navigation slidebar"
          >
            {mobileSlidebarOpen ? (
              <X className="w-4 h-4 text-emerald-500" />
            ) : (
              <Menu className="w-4 h-4 text-emerald-500" />
            )}
          </button>

          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-black">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg text-theme-text tracking-tight">
                ChurnIQ
              </span>
              <span className="hidden xs:inline-block text-[11px] px-2 py-0.5 rounded-full bg-theme-cardSub border border-theme-border text-theme-muted font-medium">
                Churn Predictor
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Dark Mode + Model Status + Docs */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Status Chip */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-theme-cardSub border border-theme-border text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-theme-text">Online</span>
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-theme-cardSub border border-theme-border text-theme-text hover:text-emerald-500 transition-all active:scale-95 shadow-sm"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-600" />
            )}
          </button>

          {/* API Docs Link */}
          <a
            href={typeof window !== 'undefined' && window.location.hostname.includes('onrender.com') ? '/docs' : 'https://churniq-tbif.onrender.com/docs'}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-theme-cardSub hover:bg-emerald-500/10 text-theme-text hover:text-emerald-500 border border-theme-border text-xs font-semibold transition-all"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
          </a>
        </div>
      </div>

      {/* Top Slidebar (Horizontal Scrollable Tabs with Chevrons) */}
      <div className="border-t border-theme-border bg-theme-card/60">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 flex items-center">
          {/* Left Slide Arrow (Mobile) */}
          <button
            onClick={() => handleScroll('left')}
            className="sm:hidden p-1.5 rounded-lg text-theme-muted hover:text-theme-text active:scale-90 flex-shrink-0"
            aria-label="Slide tabs left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Horizontal Slideable Container */}
          <nav
            ref={scrollContainerRef}
            className="flex items-center space-x-2 py-2 overflow-x-auto scrollbar-none scroll-smooth flex-1 px-1"
            aria-label="Top tabs slidebar"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'text-theme-muted hover:text-theme-text hover:bg-theme-cardSub'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Slide Arrow (Mobile) */}
          <button
            onClick={() => handleScroll('right')}
            className="sm:hidden p-1.5 rounded-lg text-theme-muted hover:text-theme-text active:scale-90 flex-shrink-0"
            aria-label="Slide tabs right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Top Slide-down Drawer / Slidebar Panel */}
      {mobileSlidebarOpen && (
        <>
          <div
            onClick={() => setMobileSlidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
          />
          <div className="fixed top-0 left-0 right-0 z-50 bg-theme-card border-b border-theme-border shadow-2xl p-4 sm:p-5 space-y-4 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-sm text-theme-text">Navigation Slidebar</span>
              </div>
              <button
                onClick={() => setMobileSlidebarOpen(false)}
                className="p-1.5 rounded-lg bg-theme-cardSub text-theme-muted hover:text-theme-text border border-theme-border"
                aria-label="Close slidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileSlidebarOpen(false);
                    }}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-theme-cardSub text-theme-text hover:bg-theme-hover border border-theme-border'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-emerald-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-theme-border flex items-center justify-between text-xs text-theme-muted">
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-emerald-500 font-semibold"
              >
                <span>Interactive API Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span>Model Online (v1.0)</span>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
