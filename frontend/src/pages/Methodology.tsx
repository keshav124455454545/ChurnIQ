import React from 'react';
import { BookOpen, ExternalLink, Cpu, Database, Layers, CheckCircle2 } from 'lucide-react';

export const Methodology: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-theme-border">
        <h1 className="text-xl font-bold text-theme-text flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          <span>About the Model</span>
        </h1>
        <p className="text-xs text-theme-muted mt-0.5">
          Summary of dataset cleaning, model selection, and architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Dataset & Cleaning */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 space-y-2 shadow-sm">
          <h3 className="text-sm font-bold text-theme-text flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Dataset & Cleaning</span>
          </h3>
          <ul className="text-xs text-theme-muted space-y-1.5 list-disc list-inside">
            <li>IBM Telco Customer Churn dataset (7,043 records, 19 features).</li>
            <li>Target: `Churn` (Yes = 26.5%, No = 73.5%).</li>
            <li>11 rows with blank `TotalCharges` had `tenure == 0` (new signups). Imputed with `0.0`.</li>
            <li>Dropped identifier (`customerID`) to prevent memorization.</li>
          </ul>
        </div>

        {/* 2. Pipeline & Leakage Safe */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 space-y-2 shadow-sm">
          <h3 className="text-sm font-bold text-theme-text flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Leakage Prevention</span>
          </h3>
          <ul className="text-xs text-theme-muted space-y-1.5 list-disc list-inside">
            <li>Stratified 80/20 train-test split (seed = 42).</li>
            <li>Test set (1,409 rows) was held out and never used during training.</li>
            <li>Encapsulated `StandardScaler` and `OneHotEncoder` inside a Scikit-learn Pipeline.</li>
            <li>Transformers fitted strictly on training data.</li>
          </ul>
        </div>

        {/* 3. Model Benchmark */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 space-y-2 shadow-sm">
          <h3 className="text-sm font-bold text-theme-text flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Model Comparison</span>
          </h3>
          <ul className="text-xs text-theme-muted space-y-1.5 list-disc list-inside">
            <li>Tested Logistic Regression, HistGradientBoosting, and Random Forest.</li>
            <li>Used 5-fold stratified cross-validation on training partition.</li>
            <li>Random Forest gave best test performance: <strong>0.842 ROC-AUC</strong>.</li>
            <li>Optimized for Recall (<strong>79.1%</strong>) to catch at-risk customers early.</li>
          </ul>
        </div>

        {/* 4. Tech Stack */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 space-y-2 shadow-sm">
          <h3 className="text-sm font-bold text-theme-text flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <span>Tech Stack</span>
          </h3>
          <ul className="text-xs text-theme-muted space-y-1.5 list-disc list-inside">
            <li><strong>ML Pipeline:</strong> Python, Scikit-learn, Pandas, Joblib.</li>
            <li><strong>Backend API:</strong> FastAPI, Pydantic v2, Uvicorn, Pytest.</li>
            <li><strong>Frontend:</strong> React 19, TypeScript, Vite, Tailwind CSS, Recharts.</li>
            <li><strong>API Documentation:</strong> OpenAPI / Swagger UI at `/docs`.</li>
          </ul>
        </div>
      </div>

      <div className="pt-2">
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center text-xs text-emerald-500 hover:text-emerald-400 font-semibold space-x-1 transition-colors"
        >
          <span>Open Interactive API Documentation (/docs)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
