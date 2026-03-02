import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { 
  SDKOptions,
  APIError 
} from './types';

export class SBTCGatewayError extends Error {
  public code?: string;
  public details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'SBTCGatewayError';
    this.code = code;
    this.details = details;
  }
}

export class BaseAPI {
  protected client: AxiosInstance;
  protected apiKey: string;
  protected retries: number;

  constructor(options: SDKOptions) {
    this.apiKey = options.apiKey;
    this.retries = options.retries || 3;
    
    this.client = axios.create({
      baseURL: options.baseURL || 'https://api.sbtc-gateway.com',
      timeout: options.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': '@sbtc-gateway/node/1.0.0'
      }
    });

    // Request interceptor for retries
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: any) => {
        if (error.response?.data) {
          const apiError = error.response.data as APIError;
          throw new SBTCGatewayError(
            apiError.error || 'API request failed',
            apiError.code,
            apiError.details
          );
        }
        throw new SBTCGatewayError(
          error.message || 'Network error occurred',
          'NETWORK_ERROR'
        );
      }
    );
  }

  protected async makeRequest<T>(config: AxiosRequestConfig): Promise<T> {
    return this.makeRequestWithRetry<T>(config, 0);
  }

  private async makeRequestWithRetry<T>(config: AxiosRequestConfig, attempt: number): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error: any) {
      // Handle rate limiting with exponential backoff
      if (error.response?.status === 429 && attempt < this.retries) {
        const retryAfter = error.response.headers['retry-after'] 
          ? parseInt(error.response.headers['retry-after']) * 1000 
          : Math.pow(2, attempt) * 1000;
        
        await this.sleep(retryAfter);
        return this.makeRequestWithRetry<T>(config, attempt + 1);
      }

      // Retry on server errors (5xx) but not on client errors (4xx)
      if (error.response?.status >= 500 && attempt < this.retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await this.sleep(delay);
        return this.makeRequestWithRetry<T>(config, attempt + 1);
      }

      // Don't retry on auth errors or client errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }

      // For network errors, retry with exponential backoff
      if (!error.response && attempt < this.retries) {
        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
        return this.makeRequestWithRetry<T>(config, attempt + 1);
      }

      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
