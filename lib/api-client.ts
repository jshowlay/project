import { z } from 'zod';

// Zod schemas for type safety
export const BriefRequestSchema = z.object({
  niche: z.string().min(1, 'Niche is required').max(100, 'Niche too long'),
  platforms: z.array(z.string()).min(1, 'At least one platform required'),
  geo: z.string().default('US'),
  language: z.string().default('en'),
  limit: z.number().min(1).max(50).default(10),
  time_window_hours: z.number().min(6).max(168).default(24),
  include_sources: z.boolean().default(true),
});

export const TrendItemSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  score: z.number().min(0).max(100),
  velocity: z.number().min(0).max(100),
  acceleration: z.number().min(0).max(100),
  agreement: z.number().min(0).max(100),
  freshness: z.number().min(0).max(100),
  novelty: z.number().min(0).max(100),
  sources: z.array(z.string()),
  angles: z.record(z.string(), z.array(z.string())),
  hooks: z.record(z.string(), z.array(z.string())),
  keywords: z.array(z.string()),
  timestamp: z.string(),
});

export const BriefSchema = z.object({
  id: z.string(),
  trends: z.array(TrendItemSchema),
  metadata: z.object({
    niche: z.string(),
    platforms: z.array(z.string()),
    geo: z.string(),
    generated_at: z.string(),
    total_trends: z.number(),
  }),
});

export const CurateRequestSchema = z.object({
  brief_payload: z.record(z.any()),
  persona: z.string(),
  tone: z.string().default('professional'),
  constraints: z.array(z.string()).default([]),
});

export const CurateResponseSchema = z.object({
  id: z.string(),
  original_brief: BriefSchema,
  curated_content: z.record(z.string(), z.array(z.string())),
  persona: z.string(),
  tone: z.string(),
  generated_at: z.string(),
});

// TypeScript types derived from schemas
export type BriefRequest = z.infer<typeof BriefRequestSchema>;
export type TrendItem = z.infer<typeof TrendItemSchema>;
export type Brief = z.infer<typeof BriefSchema>;
export type CurateRequest = z.infer<typeof CurateRequestSchema>;
export type CurateResponse = z.infer<typeof CurateResponseSchema>;

// API client class
class TrenderAPIClient {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (schema) {
        return schema.parse(data);
      }
      
      return data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  // Generate a trend brief
  async generateBrief(request: BriefRequest): Promise<Brief> {
    return this.request('/api/brief', {
      method: 'POST',
      body: JSON.stringify(BriefRequestSchema.parse(request)),
    }, BriefSchema);
  }

  // Get trends
  async getTrends(params: {
    niche?: string;
    hours?: number;
    limit?: number;
    geo?: string;
  }): Promise<TrendItem[]> {
    const searchParams = new URLSearchParams();
    if (params.niche) searchParams.append('niche', params.niche);
    if (params.hours) searchParams.append('hours', params.hours.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.geo) searchParams.append('geo', params.geo);

    return this.request(`/api/trends?${searchParams.toString()}`, {
      method: 'GET',
    }, z.array(TrendItemSchema));
  }

  // Curate content
  async curateContent(request: CurateRequest): Promise<CurateResponse> {
    return this.request('/api/curate', {
      method: 'POST',
      body: JSON.stringify(CurateRequestSchema.parse(request)),
    }, CurateResponseSchema);
  }

  // Get a specific brief by ID
  async getBrief(id: string): Promise<Brief> {
    return this.request(`/api/brief/${id}`, {
      method: 'GET',
    }, BriefSchema);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health', {
      method: 'GET',
    }, z.object({
      status: z.string(),
      timestamp: z.string(),
    }));
  }
}

// Export singleton instance
export const apiClient = new TrenderAPIClient();

// Export error handling utilities
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Hook for API calls with loading states
export function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAPI = async <T>(
    apiCall: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    callAPI,
  };
}

// Import useState for the hook
import { useState } from 'react';

