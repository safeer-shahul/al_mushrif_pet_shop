// utils/ApiClient.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
// import { User } from '@/context/AuthContext';
// ------------------------------------
// 1. Constants and Base Client
// ------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SANCTUM_CSRF_URL = process.env.NEXT_PUBLIC_SANCTUM_CSRF_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined in the environment.");
}

// Create an unauthenticated Axios instance for general public requests
const publicClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ------------------------------------
// 2. CSRF Utility
// ------------------------------------

/**
 * Fetches the CSRF cookie from the Laravel backend.
 */
export const getCsrfToken = async (): Promise<void> => {
  if (!SANCTUM_CSRF_URL) {
    console.error("SANCTUM_CSRF_URL is not defined. CSRF protection might fail.");
    return;
  }
  try {
    await publicClient.get(SANCTUM_CSRF_URL);
    console.log('CSRF cookie successfully fetched.');
  } catch (error) {
    console.error('Failed to fetch CSRF cookie:', error);
    throw new Error('CSRF token acquisition failed. Cannot proceed with state-changing requests.');
  }
};

// ------------------------------------
// 3. Authenticated Client Factory
// ------------------------------------

// Define a type for custom configuration
interface AuthClientConfig {
    headers?: Record<string, string | number | boolean>;
    omitContentType?: boolean;
}

/**
 * Creates an Axios instance configured with the Authorization header.
 * FIX: Allow custom headers to override Content-Type for FormData.
 */
export const createAuthenticatedClient = (token: string, config?: AuthClientConfig): AxiosInstance => {
  
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json', // Default to JSON
    'Authorization': `Bearer ${token}`,
  };

  const finalHeaders: AxiosRequestConfig['headers'] = {
      ...defaultHeaders,
      ...config?.headers, // Merge custom headers
  };

  if (config?.omitContentType) {
      delete finalHeaders['Content-Type'];
  }

  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: finalHeaders, // Use the finalized headers
    withCredentials: true,
  });

  // Optional: Add an interceptor to handle token expiration/401/403 errors globally
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // --- Interceptor FIX: Handle 401 (Unauthorized) and 403 (Forbidden/Role Check failed) ---
        console.error(`Authorization error (${error.response.status}). Token might be expired or user role insufficient.`);
        
        // NOTE: In a real application, you'd use a mechanism (like a global state library or event emitter) 
        // to call useAuth().logout() and redirect the user. 
        // For now, we reject the promise, allowing the calling component to handle it,
        // but log the crucial error here.
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// ------------------------------------
// 4. Utility Hook (for ease of use in components)
// ------------------------------------

import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook to get the appropriate Axios client based on authentication status.
 * @param {AuthClientConfig} config Optional configuration, e.g., to omit Content-Type.
 * @returns {AxiosInstance} An Axios instance configured for API requests.
 */
export const useApiClient = (config?: AuthClientConfig): AxiosInstance => { 
  const { token } = useAuth();
  
  if (token) {
    return createAuthenticatedClient(token, config); 
  }
  
  return publicClient;
};

export { publicClient };