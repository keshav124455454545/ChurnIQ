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

class ApiClient {
  private activeBaseUrl: string | null = null;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const candidateUrls = this.activeBaseUrl !== null ? [this.activeBaseUrl] : getCandidateBaseUrls();
    let lastError: any = null;

    for (const baseUrl of candidateUrls) {
      const url = `${baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25-second timeout to accommodate cloud cold starts

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          // If a static host returned 404 for an API endpoint, try the next candidate
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

        // Successfully connected to this baseUrl, cache it
        this.activeBaseUrl = baseUrl;
        return (await response.json()) as T;
      } catch (err: any) {
        lastError = err;
        // If it's a network error, 404, or abort, try the next candidate
        if (err.name === 'AbortError' || err.message === 'Failed to fetch' || err.name === 'TypeError') {
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (lastError?.name === 'AbortError') {
      throw new Error('Connecting to model service... The cloud backend is initializing (~15s). Please click Retry.');
    }
    throw new Error(
      lastError?.message === 'Failed to fetch'
        ? 'Connecting to model service... The cloud backend is waking up (~15s). Please click Retry.'
        : lastError?.message || 'Connecting to model service... Please wait.'
    );
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async getModelInfo(): Promise<ModelInfoResponse> {
    return this.request<ModelInfoResponse>('/model-info');
  }

  async getMetrics(): Promise<EvaluationMetricsResponse> {
    return this.request<EvaluationMetricsResponse>('/metrics');
  }

  async getInsights(): Promise<InsightsResponse> {
    return this.request<InsightsResponse>('/insights');
  }

  async predictSingle(customer: CustomerInput): Promise<PredictionResponse> {
    return this.request<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async predictBatch(records: Record<string, any>[]): Promise<BatchPredictionResponse> {
    return this.request<BatchPredictionResponse>('/predict-batch', {
      method: 'POST',
      body: JSON.stringify(records),
    });
  }
}

export const api = new ApiClient();
