import React, { useState } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  DollarSign,
  Calendar,
  Wifi,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { CustomerInput, PredictionResponse } from '../types';
import { api } from '../services/api';

const DEFAULT_FORM: CustomerInput = {
  gender: 'Female',
  SeniorCitizen: '0',
  Partner: 'No',
  Dependents: 'No',
  tenure: 1,
  Contract: 'Month-to-month',
  PaperlessBilling: 'Yes',
  PaymentMethod: 'Electronic check',
  MonthlyCharges: 75.0,
  TotalCharges: 75.0,
  PhoneService: 'Yes',
  MultipleLines: 'No',
  InternetService: 'Fiber optic',
  OnlineSecurity: 'No',
  OnlineBackup: 'No',
  DeviceProtection: 'No',
  TechSupport: 'No',
  StreamingTV: 'No',
  StreamingMovies: 'No',
};

const PRESET_HIGH_RISK: CustomerInput = {
  gender: 'Male',
  SeniorCitizen: '1',
  Partner: 'No',
  Dependents: 'No',
  tenure: 2,
  Contract: 'Month-to-month',
  PaperlessBilling: 'Yes',
  PaymentMethod: 'Electronic check',
  MonthlyCharges: 95.8,
  TotalCharges: 191.6,
  PhoneService: 'Yes',
  MultipleLines: 'Yes',
  InternetService: 'Fiber optic',
  OnlineSecurity: 'No',
  OnlineBackup: 'No',
  DeviceProtection: 'No',
  TechSupport: 'No',
  StreamingTV: 'Yes',
  StreamingMovies: 'Yes',
};

const PRESET_LOYAL: CustomerInput = {
  gender: 'Female',
  SeniorCitizen: '0',
  Partner: 'Yes',
  Dependents: 'Yes',
  tenure: 62,
  Contract: 'Two year',
  PaperlessBilling: 'No',
  PaymentMethod: 'Bank transfer (automatic)',
  MonthlyCharges: 24.5,
  TotalCharges: 1519.0,
  PhoneService: 'Yes',
  MultipleLines: 'No',
  InternetService: 'DSL',
  OnlineSecurity: 'Yes',
  OnlineBackup: 'Yes',
  DeviceProtection: 'Yes',
  TechSupport: 'Yes',
  StreamingTV: 'No',
  StreamingMovies: 'No',
};

export const Predict: React.FC = () => {
  const [formData, setFormData] = useState<CustomerInput>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const handleChange = (field: keyof CustomerInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericChange = (field: 'tenure' | 'MonthlyCharges' | 'TotalCharges', value: string) => {
    const num = parseFloat(value);
    setFormData((prev) => {
      const next = {
        ...prev,
        [field]: isNaN(num) ? 0 : num,
      };
      if (field === 'tenure' || field === 'MonthlyCharges') {
        const t = field === 'tenure' ? (isNaN(num) ? 0 : num) : prev.tenure;
        const m = field === 'MonthlyCharges' ? (isNaN(num) ? 0 : num) : prev.MonthlyCharges;
        next.TotalCharges = parseFloat((t * m).toFixed(2));
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.predictSingle(formData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate prediction.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-theme-cardSub border border-theme-border rounded-xl px-3 py-2 text-xs text-theme-text placeholder:text-theme-muted focus:outline-none focus:border-emerald-500 transition-colors';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Preset Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-theme-border gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-theme-text flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            <span>Single Customer Prediction</span>
          </h1>
          <p className="text-xs sm:text-sm text-theme-muted mt-1">
            Enter customer account features or load a preset to predict churn probability.
          </p>
        </div>

        {/* Preset Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-theme-muted font-semibold mr-1">Load Preset:</span>
          <button
            type="button"
            onClick={() => {
              setFormData(PRESET_HIGH_RISK);
              setResult(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20 text-xs font-semibold transition-all active:scale-95"
          >
            High Risk Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData(PRESET_LOYAL);
              setResult(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 text-xs font-semibold transition-all active:scale-95"
          >
            Loyal Customer
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData(DEFAULT_FORM);
              setResult(null);
            }}
            className="p-1.5 rounded-lg bg-theme-cardSub text-theme-muted hover:text-theme-text border border-theme-border transition-all active:scale-95"
            title="Reset form"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
          {/* Section 1: Demographics */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm transition-colors">
            <div className="flex items-center space-x-2 text-emerald-500 font-bold text-xs sm:text-sm">
              <UserCheck className="w-4 h-4" />
              <span>1. Customer Demographics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className={inputClass}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Senior Citizen</label>
                <select
                  value={String(formData.SeniorCitizen)}
                  onChange={(e) => handleChange('SeniorCitizen', e.target.value)}
                  className={inputClass}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Partner</label>
                <select
                  value={formData.Partner}
                  onChange={(e) => handleChange('Partner', e.target.value)}
                  className={inputClass}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Dependents</label>
                <select
                  value={formData.Dependents}
                  onChange={(e) => handleChange('Dependents', e.target.value)}
                  className={inputClass}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Account & Contract Terms */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm transition-colors">
            <div className="flex items-center space-x-2 text-emerald-500 font-bold text-xs sm:text-sm">
              <Calendar className="w-4 h-4" />
              <span>2. Account & Contract</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-semibold text-theme-muted">
                  <label>Tenure</label>
                  <span className="font-mono text-emerald-500 font-bold">{formData.tenure} months</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="72"
                  value={formData.tenure}
                  onChange={(e) => handleNumericChange('tenure', e.target.value)}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-theme-border rounded-lg"
                />
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.tenure}
                  onChange={(e) => handleNumericChange('tenure', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Contract Term</label>
                <select
                  value={formData.Contract}
                  onChange={(e) => handleChange('Contract', e.target.value)}
                  className={inputClass}
                >
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Payment Method</label>
                <select
                  value={formData.PaymentMethod}
                  onChange={(e) => handleChange('PaymentMethod', e.target.value)}
                  className={inputClass}
                >
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Paperless Billing</label>
                <select
                  value={formData.PaperlessBilling}
                  onChange={(e) => handleChange('PaperlessBilling', e.target.value)}
                  className={inputClass}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Services */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm transition-colors">
            <div className="flex items-center space-x-2 text-emerald-500 font-bold text-xs sm:text-sm">
              <Wifi className="w-4 h-4" />
              <span>3. Phone & Internet Services</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Internet Service</label>
                <select
                  value={formData.InternetService}
                  onChange={(e) => handleChange('InternetService', e.target.value)}
                  className={inputClass}
                >
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="DSL">DSL</option>
                  <option value="No">None</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Phone Service</label>
                <select
                  value={formData.PhoneService}
                  onChange={(e) => handleChange('PhoneService', e.target.value)}
                  className={inputClass}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">Multiple Lines</label>
                <select
                  value={formData.MultipleLines}
                  onChange={(e) => handleChange('MultipleLines', e.target.value)}
                  className={inputClass}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No phone service">No phone service</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-theme-border">
              <label className="block text-[11px] font-semibold text-theme-muted mb-2">Optional Add-ons:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { field: 'OnlineSecurity', label: 'Online Security' },
                  { field: 'OnlineBackup', label: 'Online Backup' },
                  { field: 'DeviceProtection', label: 'Device Protection' },
                  { field: 'TechSupport', label: 'Tech Support' },
                  { field: 'StreamingTV', label: 'Streaming TV' },
                  { field: 'StreamingMovies', label: 'Streaming Movies' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-[10px] text-theme-muted mb-1 truncate">{label}</label>
                    <select
                      value={(formData as any)[field]}
                      onChange={(e) => handleChange(field as any, e.target.value)}
                      className={inputClass}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="No internet service">None</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Charges */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm transition-colors">
            <div className="flex items-center space-x-2 text-emerald-500 font-bold text-xs sm:text-sm">
              <DollarSign className="w-4 h-4" />
              <span>4. Billing Amounts ($)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-semibold text-theme-muted">
                  <label>Monthly Charges</label>
                  <span className="font-mono text-emerald-500 font-bold">${Number(formData.MonthlyCharges).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="18.25"
                  max="118.75"
                  step="0.25"
                  value={formData.MonthlyCharges}
                  onChange={(e) => handleNumericChange('MonthlyCharges', e.target.value)}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-theme-border rounded-lg"
                />
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  max="500"
                  value={formData.MonthlyCharges}
                  onChange={(e) => handleNumericChange('MonthlyCharges', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1">
                  Total Charges ($)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="20000"
                  value={formData.TotalCharges}
                  onChange={(e) => handleNumericChange('TotalCharges', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Predicting...</span>
              </span>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4 text-slate-950" />
                <span>Predict Churn Risk</span>
              </>
            )}
          </button>
        </form>

        {/* Prediction Output Column */}
        <div className="lg:col-span-5 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-sm flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold">Error</h5>
                <p className="text-xs mt-1 text-rose-400">{error}</p>
              </div>
            </div>
          )}

          {result ? (
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between border-b border-theme-border pb-3">
                <h3 className="font-bold text-theme-text text-sm sm:text-base flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Prediction Result</span>
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-theme-cardSub text-emerald-500 border border-theme-border font-mono">
                  Random Forest
                </span>
              </div>

              {/* SLIDEBAR / PROBABILITY METER AT THE TOP OF THE RESULT */}
              <div className="p-4 rounded-xl bg-theme-cardSub border border-theme-border space-y-2.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-theme-muted">Churn Probability</span>
                  <span className="text-theme-text font-black text-base font-mono">
                    {(result.churn_probability * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Visual Slidebar / Progress Meter */}
                <div className="w-full bg-theme-card rounded-full h-3 overflow-hidden p-0.5 border border-theme-border">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      result.churn_probability >= 0.6
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : result.churn_probability >= 0.35
                        ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(4, result.churn_probability * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-theme-muted font-medium pt-0.5">
                  <span>0% (Retain)</span>
                  <span>50% Threshold</span>
                  <span>100% (Churn)</span>
                </div>
              </div>

              {/* Outcome Badge */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  result.prediction === 'Yes'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <div>
                  <div className="text-[10px] uppercase font-bold text-theme-muted">Prediction</div>
                  <div
                    className={`text-lg sm:text-xl font-black mt-0.5 ${
                      result.prediction === 'Yes' ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  >
                    {result.prediction === 'Yes' ? 'Likely to Churn' : 'Likely to Stay'}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    result.risk_category === 'High'
                      ? 'bg-rose-500 text-white'
                      : result.risk_category === 'Medium'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {result.risk_category} Risk
                </span>
              </div>

              {/* Practical Recommendation */}
              <div className="p-3.5 rounded-xl bg-theme-cardSub border border-theme-border space-y-1.5 text-xs">
                <div className="font-bold text-theme-text flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Recommendation</span>
                </div>
                <p className="text-theme-muted leading-relaxed">{result.explanation}</p>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-theme-card border border-dashed border-theme-border rounded-2xl p-8 text-center text-theme-muted space-y-3">
              <div className="w-10 h-10 rounded-xl bg-theme-cardSub flex items-center justify-center mx-auto text-emerald-500 border border-theme-border">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-theme-text">No Prediction Yet</h4>
              <p className="text-xs text-theme-muted max-w-xs mx-auto">
                Fill in the customer information or pick a preset, then click Predict Churn Risk.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
