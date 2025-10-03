/**
 * API service for handling all HTTP requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      // Check if we're in testing mode
      if (import.meta.env.VITE_AUTH_DISABLED === 'true') {
        // Return appropriate mock data based on request method and endpoint
        if (options.method === 'GET' || !options.method) {
          // Special handling for production stats endpoint
          if (endpoint.includes('/flock/production/stats')) {
            return {
              totalEggs: 0,
              eggsToday: 0,
              eggsThisWeek: 0,
              eggsThisMonth: 0,
              averageEggWeight: 0,
              producingChickens: 0,
              qualityDistribution: {
                AA: 0,
                A: 0,
                B: 0,
                C: 0,
                reject: 0
              },
              weeklyTrend: [],
              monthlyTrend: []
            } as T;
          }
          
          // For GET requests, return empty arrays for list endpoints
          if (endpoint.includes('/rules') || 
              endpoint.includes('/schedules') || 
              endpoint.includes('/devices') || 
              endpoint.includes('/chickens') || 
              endpoint.includes('/alerts') || 
              endpoint.includes('/reports') || 
              endpoint.includes('/metrics') || 
              endpoint.includes('/insights') ||
              endpoint.includes('/records') ||
              endpoint.includes('/groups') ||
              endpoint.includes('/executions') ||
              endpoint.includes('/events') ||
              endpoint.includes('/macro-functions') ||
              endpoint.includes('/macro-tasks') ||
              endpoint.includes('/macro-records')) {
            return [] as T;
          }
          // For single item endpoints, return a basic object
          return { success: true } as T;
        }
        // For POST, PUT, DELETE requests, return success response
        return { success: true } as T;
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();