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

// ============================================================================
// Keycloak Authentication
// ============================================================================

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'biblio';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'biblio-client';

export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  session_state: string;
  scope: string;
}

export interface KeycloakUserInfo {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Login with Keycloak via backend API (avoids CORS issues)
 */
export async function keycloakLogin(username: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData.error || 'Erreur d\'authentification', response.status);
  }

  return response.json();
}

/**
 * Refresh the access token using the refresh token
 */
export async function keycloakRefreshToken(refreshToken: string): Promise<AuthUser> {
  const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new ApiError('Session expirée, veuillez vous reconnecter', 401);
  }

  const tokenData: KeycloakTokenResponse = await response.json();
  const payload = parseJwt(tokenData.access_token);
  
  return {
    id: payload.sub,
    email: payload.email || '',
    name: payload.name || payload.preferred_username || '',
    username: payload.preferred_username || '',
    roles: payload.realm_access?.roles || [],
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  };
}

/**
 * Logout from Keycloak
 */
export async function keycloakLogout(refreshToken: string): Promise<void> {
  const logoutUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;
  
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: refreshToken,
  });

  try {
    await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch {
    // Ignore logout errors
  }
}

/**
 * Get the current authenticated user from localStorage
 */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('auth_user');
  if (!userStr) return null;
  
  try {
    const user: AuthUser = JSON.parse(userStr);
    
    // Check if token is expired
    if (user.expiresAt < Date.now()) {
      // Token expired, try to refresh
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

/**
 * Save user to localStorage
 */
export function saveUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_user', JSON.stringify(user));
  // Also save in old format for compatibility
  localStorage.setItem('user', JSON.stringify({
    email: user.email,
    name: user.name,
    role: user.roles.includes('admin') ? 'admin' : 'user',
  }));
}

/**
 * Clear user from localStorage
 */
export function clearUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_user');
  localStorage.removeItem('user');
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthUser | null, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

/**
 * Parse a JWT token without validation
 */
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

/**
 * Make an authenticated API request
 */
export async function apiAuthGet<T>(
  service: 'catalog' | 'user' | 'comment',
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const user = getCurrentUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (user?.accessToken) {
    headers['Authorization'] = `Bearer ${user.accessToken}`;
  }

  const url = `${getServiceUrl(service)}${path}`;
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'GET',
    headers,
  });

  return response.json();
}

/**
 * Make an authenticated POST request
 */
export async function apiAuthPost<T>(
  service: 'catalog' | 'user' | 'comment',
  path: string,
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  const user = getCurrentUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (user?.accessToken) {
    headers['Authorization'] = `Bearer ${user.accessToken}`;
  }

  const url = `${getServiceUrl(service)}${path}`;
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'POST',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  return response.json();
}

/**
 * Make an authenticated DELETE request
 */
export async function apiAuthDelete<T>(
  service: 'catalog' | 'user' | 'comment',
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const user = getCurrentUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (user?.accessToken) {
    headers['Authorization'] = `Bearer ${user.accessToken}`;
  }

  const url = `${getServiceUrl(service)}${path}`;
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'DELETE',
    headers,
  });

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
