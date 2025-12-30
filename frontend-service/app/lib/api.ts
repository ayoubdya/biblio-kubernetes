/**
 * API utility functions for making HTTP requests to backend services
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Enhanced fetch with timeout and error handling
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use default message
      }
      throw new ApiError(errorMessage, response.status);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw new ApiError(error.message);
    }

    throw new ApiError('Unknown error occurred');
  }
}

/**
 * Get the base URL for a service
 */
export function getServiceUrl(service: 'catalog' | 'user' | 'comment'): string {
  // For server-side requests
  if (typeof window === 'undefined') {
    const urls = {
      catalog: process.env.CATALOG_SERVICE_URL || 'http://catalog-service:8080',
      user: process.env.USER_SERVICE_URL || 'http://user-service:8081',
      comment: process.env.COMMENT_SERVICE_URL || 'http://comment-service:8082',
    };
    return urls[service];
  }

  // For client-side requests
  const urls = {
    catalog: process.env.NEXT_PUBLIC_CATALOG_SERVICE_URL || 'http://localhost:8090',
    user: process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8081',
    comment: process.env.NEXT_PUBLIC_COMMENT_SERVICE_URL || 'http://localhost:8082',
  };
  return urls[service];
}

/**
 * Make a GET request
 */
export async function apiGet<T>(
  service: 'catalog' | 'user' | 'comment',
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const url = `${getServiceUrl(service)}${path}`;
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response.json();
}

/**
 * Make a POST request
 */
export async function apiPost<T>(
  service: 'catalog' | 'user' | 'comment',
  path: string,
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  const url = `${getServiceUrl(service)}${path}`;
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  return response.json();
}

/**
 * Make a PUT request
 */
export async function apiPut<T>(
  service: 'catalog' | 'user' | 'comment',
  path: string,
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  const url = `${getServiceUrl(service)}${path}`;
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  return response.json();
}

/**
 * Make a DELETE request
 */
export async function apiDelete<T>(
  service: 'catalog' | 'user' | 'comment',
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const url = `${getServiceUrl(service)}${path}`;
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // DELETE might return empty response
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

/**
 * Handle API errors in a consistent way
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
