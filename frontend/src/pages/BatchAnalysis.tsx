import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { BatchPredictionResponse } from '../types';
import { api } from '../services/api';

const SAMPLE_CSV_CONTENT = `customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85
5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5
3668-QPYBK,Male,0,No,No,2,Yes,No,DSL,Yes,Yes,No,No,No,No,Month-to-month,Yes,Mailed check,53.85,108.15
7795-CFOCW,Male,0,No,No,45,No,No phone service,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer (automatic),42.3,1840.75
9237-HQITU,Female,0,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.7,151.65`;

export const BatchAnalysis: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchResponse, setBatchResponse] = useState<BatchPredictionResponse | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'churn_sample_batch.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvToObjects = (text: string): Record<string, any>[] => {
    const lines = text.trim().split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row.');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const rowObj: Record<string, any> = {};
      headers.forEach((header, idx) => {
        let val: any = values[idx] ?? '';
        if (header === 'tenure') val = parseInt(val, 10);
        else if (header === 'MonthlyCharges' || header === 'TotalCharges') val = parseFloat(val);
        rowObj[header] = val;
      });
      rows.push(rowObj);
    }
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv')) {
      setError('Please upload a valid .csv file.');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setFile(selected);
    setError(null);
  };

  const handleProcessBatch = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const records = parseCsvToObjects(text);

      if (records.length > 500) {
        throw new Error(`CSV has ${records.length} records. Maximum 500 rows per batch.`);
      }

      const res = await api.predictBatch(records);
      setBatchResponse(res);
    } catch (err: any) {
      setError(err.message || 'Failed to process batch.');
    } finally {
      setLoading(false);
    }
  };

  const sanitizeCsvValue = (val: any): string => {
    if (val === null || val === undefined) return '""';
    let s = String(val);
    if (/^[=+\-@\t\r]/.test(s)) {
      s = "'" + s;
    }
    return `"${s.replace(/"/g, '""')}"`;
  };

  const handleExportResults = () => {
    if (!batchResponse || !batchResponse.results) return;

    const headers = [
      'Row',
      'CustomerID',
      'Valid',
      'ChurnPrediction',
      'Probability',
      'RiskTier',
      'Tenure',
      'Contract',
      'MonthlyCharges',
      'TotalCharges',
    ];

    const rows = batchResponse.results.map((r) => [
      r.row_index + 1,
      r.customer_id || '',
      r.is_valid ? 'Yes' : 'No',
      r.prediction || '',
      r.churn_probability !== null && r.churn_probability !== undefined ? (r.churn_probability * 100).toFixed(1) + '%' : '',
      r.risk_category || '',
      r.input_data?.tenure ?? '',
      r.input_data?.Contract ?? '',
      r.input_data?.MonthlyCharges ?? '',
      r.input_data?.TotalCharges ?? '',
    ]);

    const csvContent = [
      headers.map(sanitizeCsvValue).join(','),
      ...rows.map((row) => row.map(sanitizeCsvValue).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `churn_predictions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = batchResponse?.results.filter((item) => {
    if (filterRisk !== 'All' && item.risk_category !== filterRisk) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const cidMatch = item.customer_id?.toLowerCase().includes(q);
      const rowMatch = String(item.row_index + 1).includes(q);
      return cidMatch || rowMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-theme-border gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-theme-text flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            <span>Batch CSV Prediction</span>
          </h1>
          <p className="text-xs sm:text-sm text-theme-muted mt-1">
            Upload a CSV file to predict churn for multiple customers at once.
          </p>
        </div>
        <button
          onClick={handleDownloadSample}
          className="px-3 py-1.5 rounded-xl bg-theme-cardSub hover:bg-theme-hover text-theme-text border border-theme-border text-xs font-semibold flex items-center space-x-1.5 transition-all self-start sm:self-auto active:scale-95"
        >
          <Download className="w-4 h-4 text-emerald-500" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 sm:p-8 text-center space-y-3.5 shadow-sm transition-colors">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
          <Upload className="w-5 h-5" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-sm sm:text-base font-bold text-theme-text">Upload Customer CSV</h3>
          <p className="text-xs text-theme-muted mt-0.5">
            CSV must match the 19 feature columns. Supports up to 500 rows.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-1">
          <label className="cursor-pointer w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-95">
            <span>Choose File</span>
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>
          {file && (
            <span className="text-xs text-emerald-500 font-medium flex items-center">
              <FileCheck className="w-4 h-4 mr-1" />
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>

        {file && (
          <div className="pt-1">
            <button
              onClick={handleProcessBatch}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 text-xs font-bold shadow-md transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : (
                <span>Run Batch Predictions</span>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center justify-center space-x-2 max-w-lg mx-auto">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Batch Results & Summary */}
      {batchResponse && (
        <div className="space-y-5">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm transition-colors">
              <div className="text-[10px] text-theme-muted font-bold uppercase">Total Rows</div>
              <div className="text-lg font-black text-theme-text mt-0.5">
                {batchResponse.summary.total_records}
              </div>
            </div>
            <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm transition-colors">
              <div className="text-[10px] text-theme-muted font-bold uppercase">Predicted Churn</div>
              <div className="text-lg font-black text-rose-500 mt-0.5">
                {batchResponse.summary.predicted_churn_count}
              </div>
            </div>
            <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm transition-colors">
              <div className="text-[10px] text-theme-muted font-bold uppercase">Churn Rate</div>
              <div className="text-lg font-black text-amber-500 mt-0.5">
                {batchResponse.summary.churn_rate_percent.toFixed(1)}%
              </div>
            </div>
            <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm transition-colors">
              <div className="text-[10px] text-theme-muted font-bold uppercase">High Risk</div>
              <div className="text-lg font-black text-rose-500 mt-0.5">
                {batchResponse.summary.high_risk_count}
              </div>
            </div>
            <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm transition-colors">
              <div className="text-[10px] text-theme-muted font-bold uppercase">Medium Risk</div>
              <div className="text-lg font-black text-amber-500 mt-0.5">
                {batchResponse.summary.medium_risk_count}
              </div>
            </div>
            <div className="bg-theme-card border border-theme-border rounded-xl p-3 shadow-sm transition-colors">
              <div className="text-[10px] text-theme-muted font-bold uppercase">Low Risk</div>
              <div className="text-lg font-black text-emerald-500 mt-0.5">
                {batchResponse.summary.low_risk_count}
              </div>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter Customer ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 bg-theme-card border border-theme-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-theme-text placeholder:text-theme-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-1 bg-theme-card border border-theme-border rounded-xl p-1 text-xs">
                {['All', 'High', 'Medium', 'Low'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setFilterRisk(tier)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterRisk === tier
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-theme-muted hover:text-theme-text'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExportResults}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Results Table */}
          <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden shadow-sm transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-theme-cardSub text-theme-muted uppercase tracking-wider text-[10px] border-b border-theme-border">
                  <tr>
                    <th className="px-4 py-2.5">Row</th>
                    <th className="px-4 py-2.5">Customer ID</th>
                    <th className="px-4 py-2.5">Contract</th>
                    <th className="px-4 py-2.5">Tenure</th>
                    <th className="px-4 py-2.5">Monthly ($)</th>
                    <th className="px-4 py-2.5">Prediction</th>
                    <th className="px-4 py-2.5">Probability</th>
                    <th className="px-4 py-2.5">Risk Tier</th>
                    <th className="px-4 py-2.5">Valid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border text-theme-text">
                  {filteredResults?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-theme-muted">
                        No rows found.
                      </td>
                    </tr>
                  ) : (
                    filteredResults?.map((r) => (
                      <tr key={r.row_index} className="hover:bg-theme-cardSub transition-colors">
                        <td className="px-4 py-2.5 font-mono text-theme-muted">{r.row_index + 1}</td>
                        <td className="px-4 py-2.5 font-mono font-medium text-theme-text">
                          {r.customer_id || <span className="text-theme-muted">N/A</span>}
                        </td>
                        <td className="px-4 py-2.5">{r.input_data?.Contract || '—'}</td>
                        <td className="px-4 py-2.5">{r.input_data?.tenure ?? '—'} mos</td>
                        <td className="px-4 py-2.5">${r.input_data?.MonthlyCharges ?? '—'}</td>
                        <td className="px-4 py-2.5 font-semibold">
                          {r.prediction ? (
                            <span className={r.prediction === 'Yes' ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                              {r.prediction === 'Yes' ? 'Churn' : 'Stay'}
                            </span>
                          ) : (
                            <span className="text-theme-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono">
                          {r.churn_probability !== null && r.churn_probability !== undefined
                            ? `${(r.churn_probability * 100).toFixed(1)}%`
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {r.risk_category ? (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                r.risk_category === 'High'
                                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                                  : r.risk_category === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                              }`}
                            >
                              {r.risk_category}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {r.is_valid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <span title={r.errors.join('; ')} className="cursor-help">
                              <AlertTriangle className="w-4 h-4 text-rose-500" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
