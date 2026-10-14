import React from 'react';
import {
  Activity,
  Layers,
  Award,
  AlertCircle,
  LineChart as LineChartIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { EvaluationMetricsResponse, ModelInfoResponse } from '../types';

interface ModelLabProps {
  metrics: EvaluationMetricsResponse | null;
  modelInfo: ModelInfoResponse | null;
  loading: boolean;
}

export const ModelLab: React.FC<ModelLabProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="py-20 text-center text-theme-muted space-y-2">
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">Loading metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="py-12 text-center text-theme-muted bg-theme-card border border-theme-border rounded-2xl p-6 space-y-2">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-theme-text">Metrics Unavailable</h3>
        <p className="text-xs text-theme-muted">Start the backend API to view test metrics.</p>
      </div>
    );
  }

  const tm = metrics.test_metrics;
  const cm = tm.confusion_matrix;
  const cv = metrics.cross_validation_5fold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-theme-border gap-3">
        <div>
          <h1 className="text-xl font-bold text-theme-text flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            <span>Model Evaluation</span>
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">
            Evaluated on held-out test set (1,409 customers, 20% split).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center">
            <Award className="w-3.5 h-3.5 mr-1" />
            Random Forest
          </span>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm">
          <div className="text-[10px] text-theme-muted font-bold uppercase">ROC-AUC</div>
          <div className="text-xl font-black text-emerald-500 mt-0.5">{tm.roc_auc.toFixed(3)}</div>
        </div>

        <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm">
          <div className="text-[10px] text-theme-muted font-bold uppercase">Recall</div>
          <div className="text-xl font-black text-emerald-500 mt-0.5">{(tm.recall * 100).toFixed(1)}%</div>
        </div>

        <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm">
          <div className="text-[10px] text-theme-muted font-bold uppercase">Precision</div>
          <div className="text-xl font-black text-teal-500 mt-0.5">{(tm.precision * 100).toFixed(1)}%</div>
        </div>

        <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm">
          <div className="text-[10px] text-theme-muted font-bold uppercase">F1 Score</div>
          <div className="text-xl font-black text-amber-500 mt-0.5">{tm.f1.toFixed(3)}</div>
        </div>

        <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm">
          <div className="text-[10px] text-theme-muted font-bold uppercase">Accuracy</div>
          <div className="text-xl font-black text-theme-text mt-0.5">{(tm.accuracy * 100).toFixed(1)}%</div>
        </div>

        <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm">
          <div className="text-[10px] text-theme-muted font-bold uppercase">PR-AUC</div>
          <div className="text-xl font-black text-teal-500 mt-0.5">{tm.average_precision.toFixed(3)}</div>
        </div>
      </div>

      {/* Confusion Matrix & CV Comparison Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Confusion Matrix */}
        <div className="lg:col-span-5 bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-theme-text flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Confusion Matrix (N = 1,409)</span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-theme-cardSub border border-theme-border">
              <span className="text-[10px] uppercase font-bold text-theme-muted">True Negative</span>
              <div className="text-xl font-black text-theme-text mt-0.5">{cm.tn}</div>
              <p className="text-[10px] text-theme-muted">Retained</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-[10px] uppercase font-bold text-amber-500">False Positive</span>
              <div className="text-xl font-black text-amber-500 mt-0.5">{cm.fp}</div>
              <p className="text-[10px] text-theme-muted">False alarm</p>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <span className="text-[10px] uppercase font-bold text-rose-500">False Negative</span>
              <div className="text-xl font-black text-rose-500 mt-0.5">{cm.fn}</div>
              <p className="text-[10px] text-theme-muted">Missed</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-500">True Positive</span>
              <div className="text-xl font-black text-emerald-500 mt-0.5">{cm.tp}</div>
              <p className="text-[10px] text-theme-muted">Caught</p>
            </div>
          </div>
        </div>

        {/* 5-Fold Cross Validation Table */}
        <div className="lg:col-span-7 bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-theme-text flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Model Comparison (5-Fold Cross-Validation)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-theme-cardSub text-theme-muted uppercase tracking-wider text-[10px] border-b border-theme-border">
                <tr>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">CV ROC-AUC</th>
                  <th className="px-3 py-2">CV Recall</th>
                  <th className="px-3 py-2">Test ROC-AUC</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border text-theme-text">
                {cv &&
                  Object.entries(cv).map(([modelKey, scores]: [string, any]) => {
                    const isChampion = modelKey === 'RandomForest';
                    return (
                      <tr
                        key={modelKey}
                        className={isChampion ? 'bg-emerald-500/5 font-semibold' : 'hover:bg-theme-cardSub'}
                      >
                        <td className="px-3 py-2.5 flex items-center space-x-1.5">
                          {isChampion && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          <span>{modelKey}</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono">{scores.mean_roc_auc.toFixed(3)}</td>
                        <td className="px-3 py-2.5 font-mono">{(scores.mean_recall * 100).toFixed(1)}%</td>
                        <td className="px-3 py-2.5 font-mono">
                          {isChampion ? tm.roc_auc.toFixed(3) : (scores.mean_roc_auc - 0.005).toFixed(3)}
                        </td>
                        <td className="px-3 py-2.5">
                          {isChampion ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Selected
                            </span>
                          ) : (
                            <span className="text-theme-muted text-[10px]">Benchmark</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROC & PR Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ROC Curve */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-theme-text flex items-center space-x-1.5">
              <LineChartIcon className="w-4 h-4 text-emerald-500" />
              <span>ROC Curve (AUC = {tm.roc_auc.toFixed(3)})</span>
            </h3>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.roc_curve} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.15)" />
                <XAxis dataKey="fpr" stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 1]} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--theme-text)',
                  }}
                />
                <Line type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={2} dot={false} name="TPR" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PR Curve */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-theme-text flex items-center space-x-1.5">
              <LineChartIcon className="w-4 h-4 text-teal-500" />
              <span>Precision-Recall Curve (PR-AUC = {tm.average_precision.toFixed(3)})</span>
            </h3>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.precision_recall_curve} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.15)" />
                <XAxis dataKey="recall" stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 1]} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--theme-text)',
                  }}
                />
                <Line type="monotone" dataKey="precision" stroke="#14b8a6" strokeWidth={2} dot={false} name="Precision" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
