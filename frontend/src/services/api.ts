/**
 * Centralized Typed API Client for ChurnIQ Backend with automatic host detection and fallback.
 */

import {
  CustomerInput,
  PredictionResponse,
  BatchPredictionResponse,
  HealthResponse,
  ModelInfoResponse,
  EvaluationMetricsResponse,
  InsightsResponse,
} from '../types';

const DEFAULT_CLOUD_API = 'https://churniq-tbif.onrender.com';

const getCandidateBaseUrls = (): string[] => {
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  // 1. Explicit environment variable override if provided
  if (import.meta.env.VITE_API_BASE_URL) {
    const custom = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
    return [custom, DEFAULT_CLOUD_API];
  }

  // 2. If running locally on localhost/127.0.0.1, connect to local backend port 8000 with cloud fallback
  if (isLocalhost) {
    return [
      `http://${hostname || 'localhost'}:8000`,
      'http://127.0.0.1:8000',
      'http://localhost:8000',
      DEFAULT_CLOUD_API,
    ];
  }

  // 3. If running on Render (unified full-stack), use relative path first (pure same-origin, zero CORS)
  if (hostname.includes('onrender.com')) {
    return ['', DEFAULT_CLOUD_API];
  }

  // 4. If running on Vercel, Netlify, or any other cloud host, use the live Render backend
  return [DEFAULT_CLOUD_API];
};

import {
  fallbackHealth,
  fallbackModelInfo,
  fallbackMetrics,
  fallbackInsights,
  predictLocal,
  predictBatchLocal,
} from './localEngine';

class ApiClient {
  private activeBaseUrl: string | null = null;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const candidateUrls = this.activeBaseUrl !== null ? [this.activeBaseUrl] : getCandidateBaseUrls();
    let lastError: any = null;

    for (const baseUrl of candidateUrls) {
      const url = `${baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout before falling back to local engine

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            ...(options.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            continue;
          }
          let errorMsg = `Server error (${response.status})`;
          try {
            const errJson = await response.json();
            errorMsg = errJson.detail || errorMsg;
          } catch {
            errorMsg = (await response.text()) || errorMsg;
          }
          throw new Error(errorMsg);
        }

        this.activeBaseUrl = baseUrl;
        return (await response.json()) as T;
      } catch (err: any) {
        lastError = err;
        continue;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError || new Error('Network request unavailable');
  }

  async getHealth(): Promise<HealthResponse> {
    try {
      return await this.request<HealthResponse>('/health');
    } catch {
      return fallbackHealth;
    }
  }

  async getModelInfo(): Promise<ModelInfoResponse> {
    try {
      return await this.request<ModelInfoResponse>('/model-info');
    } catch {
      return fallbackModelInfo;
    }
  }

  async getMetrics(): Promise<EvaluationMetricsResponse> {
    try {
      return await this.request<EvaluationMetricsResponse>('/metrics');
    } catch {
      return fallbackMetrics;
    }
  }

  async getInsights(): Promise<InsightsResponse> {
    try {
      return await this.request<InsightsResponse>('/insights');
    } catch {
      return fallbackInsights;
    }
  }

  async predictSingle(customer: CustomerInput): Promise<PredictionResponse> {
    try {
      return await this.request<PredictionResponse>('/predict', {
        method: 'POST',
        body: JSON.stringify(customer),
      });
    } catch {
      return predictLocal(customer);
    }
  }

  async predictBatch(records: Record<string, any>[]): Promise<BatchPredictionResponse> {
    try {
      return await this.request<BatchPredictionResponse>('/predict-batch', {
        method: 'POST',
        body: JSON.stringify(records),
      });
    } catch {
      return predictBatchLocal(records);
    }
  }
}

export const api = new ApiClient();
