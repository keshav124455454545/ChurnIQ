import React from 'react';
import {
  BrainCircuit,
  TrendingDown,
  ShieldCheck,
  Target,
  ArrowRight,
  Database,
  BarChart,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EvaluationMetricsResponse, HealthResponse } from '../types';

interface OverviewProps {
  health: HealthResponse | null;
  metrics: EvaluationMetricsResponse | null;
  onNavigate: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ health, metrics, onNavigate }) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 dark:from-obsidian-900 dark:via-obsidian-850 dark:to-obsidian-950 border border-emerald-900/40 dark:border-obsidian-750 p-6 sm:p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Customer Churn Prediction
          </h1>
          <p className="mt-3 text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            A supervised machine learning model that predicts whether a telecom customer is likely to cancel their subscription.
            Built with Scikit-learn Random Forest, trained on the IBM Telco dataset, and served through a FastAPI backend.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('predict')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <BrainCircuit className="w-4 h-4 text-slate-950" />
              <span>Predict Individual Customer</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
            <button
              onClick={() => onNavigate('batch')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Batch CSV Prediction</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-theme-muted text-xs font-semibold">
            <span>Total Dataset</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-2xl sm:text-3xl font-extrabold text-theme-text">7,043</span>
            <span className="ml-2 text-xs text-theme-muted">customers</span>
          </div>
          <p className="mt-2 text-xs text-theme-muted">IBM Telco benchmark (19 features)</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-theme-muted text-xs font-semibold">
            <span>Historical Churn Rate</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-500">26.5%</span>
            <span className="ml-2 text-xs text-theme-muted">churned</span>
          </div>
          <p className="mt-2 text-xs text-theme-muted">1,869 churners vs 5,174 retained</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-theme-muted text-xs font-semibold">
            <span>Test ROC-AUC</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-500">
              {metrics ? metrics.test_metrics.roc_auc.toFixed(3) : '0.842'}
            </span>
            <span className="ml-2 text-xs text-theme-muted">on held-out test set</span>
          </div>
          <p className="mt-2 text-xs text-theme-muted">Random Forest classifier</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between text-theme-muted text-xs font-semibold">
            <span>Test Recall</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-500">
              {metrics ? `${(metrics.test_metrics.recall * 100).toFixed(1)}%` : '79.1%'}
            </span>
            <span className="ml-2 text-xs text-theme-muted">churners caught</span>
          </div>
          <p className="mt-2 text-xs text-theme-muted">296 of 374 test churners detected</p>
        </div>
      </div>

      {/* Two Column Layout: Model Summary & Key Data Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: How the Model Was Built */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-6 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center space-x-2 pb-3 border-b border-theme-border text-theme-text font-bold text-sm sm:text-base">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>How the Model Was Built</span>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-theme-muted">
            <div className="p-3 rounded-xl bg-theme-cardSub border border-theme-border space-y-1">
              <strong className="text-theme-text text-xs">Leakage-Safe Pipeline:</strong>
              <p className="text-xs">
                Split data into 80% train and 20% test before any scaling or encoding. All transformations fit only on training folds.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-theme-cardSub border border-theme-border space-y-1">
              <strong className="text-theme-text text-xs">Cleaned Missing Values:</strong>
              <p className="text-xs">
                Found 11 records with blank total charges. All had 0 tenure (brand-new accounts), so they were imputed with 0.0.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-theme-cardSub border border-theme-border space-y-1">
              <strong className="text-theme-text text-xs">Model Comparison:</strong>
              <p className="text-xs">
                Tested Logistic Regression, Gradient Boosting, and Random Forest using 5-fold cross-validation. Random Forest achieved the highest ROC-AUC (0.842).
              </p>
            </div>
          </div>
        </div>

        {/* Right: Key Findings */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-6 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center space-x-2 pb-3 border-b border-theme-border text-theme-text font-bold text-sm sm:text-base">
            <BarChart className="w-4 h-4 text-emerald-500" />
            <span>Top Churn Indicators in the Data</span>
          </div>
          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-theme-cardSub border border-theme-border flex justify-between items-center">
              <div>
                <div className="font-semibold text-theme-text">Month-to-Month Contracts</div>
                <div className="text-[11px] text-theme-muted">Accounts for 88.5% of all churn</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg">
                42.7% Churn
              </span>
            </div>

            <div className="p-3 rounded-xl bg-theme-cardSub border border-theme-border flex justify-between items-center">
              <div>
                <div className="font-semibold text-theme-text">First Year (&lt;12 Months Tenure)</div>
                <div className="text-[11px] text-theme-muted">Highest churn risk window</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg">
                47.4% Churn
              </span>
            </div>

            <div className="p-3 rounded-xl bg-theme-cardSub border border-theme-border flex justify-between items-center">
              <div>
                <div className="font-semibold text-theme-text">Electronic Check Payment</div>
                <div className="text-[11px] text-theme-muted">Manual monthly payment friction</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg">
                45.3% Churn
              </span>
            </div>

            <div className="p-3 rounded-xl bg-theme-cardSub border border-theme-border flex justify-between items-center">
              <div>
                <div className="font-semibold text-theme-text">Two-Year Contracts</div>
                <div className="text-[11px] text-theme-muted">Strong commitment and loyalty</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg">
                2.8% Churn
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
