import React, { useEffect, useState } from 'react';
import { TopHeader } from './components/TopHeader';
import { AlertBanner } from './components/AlertBanner';
import { Overview } from './pages/Overview';
import { Predict } from './pages/Predict';
import { BatchAnalysis } from './pages/BatchAnalysis';
import { ModelLab } from './pages/ModelLab';
import { Insights } from './pages/Insights';
import { Methodology } from './pages/Methodology';
import { api } from './services/api';
import { HealthResponse, EvaluationMetricsResponse, ModelInfoResponse } from './types';
import { BrainCircuit } from 'lucide-react';

export const App: React.FC = () => {
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const validTabs = ['overview', 'predict', 'batch', 'modellab', 'insights', 'methodology'];
    return validTabs.includes(hash) ? hash : 'overview';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('churniq_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<EvaluationMetricsResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('churniq_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('churniq_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchBackendData = async () => {
    setLoadingHealth(true);
    setBackendError(null);
    try {
      const h = await api.getHealth();
      setHealth(h);

      if (h.model_ready) {
        const [mInfo, mMetrics] = await Promise.allSettled([
          api.getModelInfo(),
          api.getMetrics(),
        ]);
        if (mInfo.status === 'fulfilled') setModelInfo(mInfo.value);
        if (mMetrics.status === 'fulfilled') setMetrics(mMetrics.value);
      }
    } catch (err: any) {
      setBackendError(err.message || 'Connecting to model service... Please wait.');
      // Auto-retry once after 2.5s in case cloud backend was spinning up from sleep
      setTimeout(() => {
        fetchBackendData();
      }, 2500);
    } finally {
      setLoadingHealth(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchBackendData();

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash) setActiveTabState(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchBackendData();
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
      {/* Top Header with Horizontal Slidebar Navigation */}
      <TopHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        loadingHealth={loadingHealth}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <Overview health={health} metrics={metrics} onNavigate={setActiveTab} />
        )}

        {activeTab === 'predict' && <Predict />}

        {activeTab === 'batch' && <BatchAnalysis />}

        {activeTab === 'modellab' && (
          <ModelLab metrics={metrics} modelInfo={modelInfo} loading={loadingHealth} />
        )}

        {activeTab === 'insights' && <Insights />}

        {activeTab === 'methodology' && <Methodology />}
      </main>

      {/* Clean, Simple Footer */}
      <footer className="border-t border-theme-border bg-theme-card py-5 text-center text-xs text-theme-muted transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-theme-text">ChurnIQ</span>
            <span>• Customer Churn Prediction Project</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-theme-muted">
            <span>Random Forest Model</span>
            <span>•</span>
            <span>FastAPI</span>
            <span>•</span>
            <span>IBM Telco Dataset</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
