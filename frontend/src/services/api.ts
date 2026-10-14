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

const getCandidateBaseUrls = (): string[] => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return [import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')];
  }
  const candidates: string[] = [];
  if (typeof window !== 'undefined' && window.location) {
    const isViteDev = window.location.port === '5173' || window.location.port === '3000';
    if (!isViteDev) {
      // In production (Render, unified FastAPI server, etc.), use same origin
      candidates.push(window.location.origin);
      candidates.push('');
    } else {
      // In local Vite dev or preview, connect to backend on port 8000
      const proto = window.location.protocol || 'http:';
      candidates.push(`${proto}//${window.location.hostname}:8000`);
    }
  }
  candidates.push('http://127.0.0.1:8000');
  candidates.push('http://localhost:8000');
  return Array.from(new Set(candidates));
};

class ApiClient {
  private activeBaseUrl: string | null = null;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const candidateUrls = this.activeBaseUrl ? [this.activeBaseUrl] : getCandidateBaseUrls();
    let lastError: any = null;

    for (const baseUrl of candidateUrls) {
      const url = `${baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout per candidate

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
        // If it's a network error or abort, try the next candidate
        if (err.name === 'AbortError' || err.message === 'Failed to fetch' || err.name === 'TypeError') {
          continue;
        }
        // If it's a 4xx/5xx error from the server itself, don't keep trying other URLs
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (lastError?.name === 'AbortError') {
      throw new Error('Connection timed out. Please check if the backend server is running.');
    }
    throw new Error(
      lastError?.message === 'Failed to fetch'
        ? 'Could not connect to backend server. Make sure the API is running on port 8000.'
        : lastError?.message || 'Network request failed.'
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
