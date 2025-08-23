import { logger } from './logger';
import { 
  ApifyRun, 
  ApifyDataset, 
  ApifyRunSchema, 
  ApifyDatasetSchema,
  TikTokVideo,
  TikTokVideoSchema 
} from './tiktok/types';

export class ApifyClient {
  private token: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: {
    token: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
  }) {
    this.token = config.token;
    this.baseUrl = 'https://api.apify.com/v2';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 5000;
  }

  /**
   * Make an authenticated request to the Apify API
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    const requestOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug({
          msg: 'Making Apify API request',
          endpoint,
          attempt,
          maxRetries: this.maxRetries,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Apify API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const duration = Date.now() - startTime;

        logger.info({
          msg: 'Apify API request successful',
          endpoint,
          status: response.status,
          duration,
          attempt,
        });

        return data as T;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const duration = Date.now() - startTime;

        logger.warn({
          msg: 'Apify API request failed',
          endpoint,
          error: lastError.message,
          duration,
          attempt,
          maxRetries: this.maxRetries,
        });

        if (attempt === this.maxRetries) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    throw lastError || new Error('Unknown error occurred');
  }

  /**
   * Start a new actor run
   */
  async startActorRun(
    actorId: string, 
    input: Record<string, any> = {}
  ): Promise<ApifyRun> {
    const endpoint = `/acts/${actorId}/runs?token=${this.token}`;
    
    const response = await this.request<ApifyRun>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });

    return ApifyRunSchema.parse(response);
  }

  /**
   * Get the status of an actor run
   */
  async getRunStatus(runId: string): Promise<ApifyRun> {
    const endpoint = `/acts/runs/${runId}?token=${this.token}`;
    
    const response = await this.request<ApifyRun>(endpoint);
    return ApifyRunSchema.parse(response);
  }

  /**
   * Wait for an actor run to complete
   */
  async waitForRunCompletion(
    runId: string, 
    pollInterval: number = 5000,
    timeout: number = 300000 // 5 minutes
  ): Promise<ApifyRun> {
    const startTime = Date.now();

    while (true) {
      const run = await this.getRunStatus(runId);
      
      if (run.status === 'SUCCEEDED') {
        logger.info({
          msg: 'Actor run completed successfully',
          runId,
          duration: Date.now() - startTime,
        });
        return run;
      }

      if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
        throw new Error(`Actor run failed with status: ${run.status}`);
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Actor run timed out after ${timeout}ms`);
      }

      logger.debug({
        msg: 'Actor run still running, waiting...',
        runId,
        status: run.status,
        elapsed: Date.now() - startTime,
      });

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Get dataset items from a completed run
   */
  async getDatasetItems(
    datasetId: string, 
    options: {
      limit?: number;
      offset?: number;
      fields?: string[];
      clean?: boolean;
    } = {}
  ): Promise<TikTokVideo[]> {
    const params = new URLSearchParams({
      token: this.token,
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.offset && { offset: options.offset.toString() }),
      ...(options.fields && { fields: options.fields.join(',') }),
      ...(options.clean !== undefined && { clean: options.clean.toString() }),
    });

    const endpoint = `/datasets/${datasetId}/items?${params}`;
    
    const response = await this.request<TikTokVideo[]>(endpoint);
    
    // Validate each item
    const validatedItems: TikTokVideo[] = [];
    const invalidItems: any[] = [];

    for (const item of response) {
      try {
        const validated = TikTokVideoSchema.parse(item);
        validatedItems.push(validated);
      } catch (error) {
        invalidItems.push({ item, error: error instanceof Error ? error.message : String(error) });
        logger.warn({
          msg: 'Invalid TikTok video data received',
          postId: item.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (invalidItems.length > 0) {
      logger.warn({
        msg: 'Some TikTok videos failed validation',
        totalItems: response.length,
        validItems: validatedItems.length,
        invalidItems: invalidItems.length,
      });
    }

    return validatedItems;
  }

  /**
   * Get dataset metadata
   */
  async getDatasetInfo(datasetId: string): Promise<ApifyDataset> {
    const endpoint = `/datasets/${datasetId}?token=${this.token}`;
    
    const response = await this.request<ApifyDataset>(endpoint);
    return ApifyDatasetSchema.parse(response);
  }

  /**
   * Abort a running actor
   */
  async abortRun(runId: string): Promise<void> {
    const endpoint = `/acts/runs/${runId}/abort?token=${this.token}`;
    
    await this.request(endpoint, {
      method: 'POST',
    });

    logger.info({
      msg: 'Actor run aborted',
      runId,
    });
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<{
    id: string;
    name: string;
    username: string;
    email: string;
    plan: {
      id: string;
      name: string;
      price: number;
      currency: string;
    };
    usage: {
      computeUnits: number;
      proxyUsage: number;
      dataTransfer: number;
    };
  }> {
    const endpoint = `/users/me?token=${this.token}`;
    
    return await this.request(endpoint);
  }

  /**
   * Check if the API token is valid
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getUserInfo();
      return true;
    } catch (error) {
      logger.error({
        msg: 'Apify token validation failed',
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

/**
 * Create a configured Apify client instance
 */
export function createApifyClient(): ApifyClient {
  const token = process.env.TIKTOK_APIFY_TOKEN;
  
  if (!token) {
    throw new Error('TIKTOK_APIFY_TOKEN environment variable is required');
  }

  return new ApifyClient({
    token,
    timeout: parseInt(process.env.TIKTOK_API_TIMEOUT_MS || '30000'),
    maxRetries: parseInt(process.env.TIKTOK_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.TIKTOK_RETRY_DELAY_MS || '5000'),
  });
}
