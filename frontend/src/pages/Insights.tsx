import React, { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { InsightsResponse } from '../types';
import { api } from '../services/api';

export const Insights: React.FC = () => {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getInsights()
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load data.');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-theme-muted space-y-2">
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">Loading insights...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-theme-muted bg-theme-card border border-theme-border rounded-2xl p-6 space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-theme-text">Could not load insights</h3>
        <p className="text-xs text-theme-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-theme-border">
        <div>
          <h1 className="text-xl font-bold text-theme-text flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <span>Dataset Insights</span>
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">
            Churn rates across key feature segments (7,043 customers).
          </p>
        </div>
      </div>

      {/* Grid of 4 Clean Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Contract Term */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-theme-text">Churn by Contract</h3>
            <span className="text-xs font-mono font-bold text-rose-500">42.7% Month-to-month</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.churn_by_contract} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.15)" />
                <XAxis dataKey="contract" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 50]} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--theme-text)',
                  }}
                />
                <Bar dataKey="churn_rate_pct" name="Churn Rate (%)" radius={[4, 4, 0, 0]}>
                  {data.churn_by_contract.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.churn_rate_pct > 30 ? '#f43f5e' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tenure Cohort */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-theme-text">Churn by Tenure</h3>
            <span className="text-xs font-mono font-bold text-rose-500">47.4% &lt;1 Year</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.churn_by_tenure_cohort} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.15)" />
                <XAxis dataKey="cohort" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 60]} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--theme-text)',
                  }}
                />
                <Bar dataKey="churn_rate_pct" name="Churn Rate (%)" radius={[4, 4, 0, 0]}>
                  {data.churn_by_tenure_cohort.map((entry, index) => (
                    <Cell key={`cell-t-${index}`} fill={entry.churn_rate_pct > 30 ? '#f43f5e' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Internet Service */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-theme-text">Churn by Internet Type</h3>
            <span className="text-xs font-mono font-bold text-rose-500">41.9% Fiber Optic</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.churn_by_internet} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.15)" />
                <XAxis dataKey="service" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 50]} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--theme-text)',
                  }}
                />
                <Bar dataKey="churn_rate_pct" name="Churn Rate (%)" radius={[4, 4, 0, 0]}>
                  {data.churn_by_internet.map((entry, index) => (
                    <Cell key={`cell-i-${index}`} fill={entry.churn_rate_pct > 30 ? '#f43f5e' : '#14b8a6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Payment Method */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-theme-text">Churn by Payment Method</h3>
            <span className="text-xs font-mono font-bold text-rose-500">45.3% Electronic Check</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.churn_by_payment} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.15)" />
                <XAxis dataKey="method" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 55]} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--theme-text)',
                  }}
                />
                <Bar dataKey="churn_rate_pct" name="Churn Rate (%)" radius={[4, 4, 0, 0]}>
                  {data.churn_by_payment.map((entry, index) => (
                    <Cell key={`cell-p-${index}`} fill={entry.churn_rate_pct > 30 ? '#f43f5e' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
