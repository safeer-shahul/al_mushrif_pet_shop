// utils/ApiClient.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
// import { User } from '@/context/AuthContext';
// ------------------------------------
// 1. Constants and Base Client
// ------------------------------------

// Use environment variables for configuration
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
  withCredentials: true, // Crucial for Laravel Sanctum cookie-based CSRF
});

// ------------------------------------
// 2. CSRF Utility
// ------------------------------------

/**
 * Fetches the CSRF cookie from the Laravel backend.
 * This must be called before the first POST/PUT/DELETE request.
 */
export const getCsrfToken = async (): Promise<void> => {
  if (!SANCTUM_CSRF_URL) {
    console.error("SANCTUM_CSRF_URL is not defined. CSRF protection might fail.");
    return;
  }
  try {
    // The call to the Sanctum endpoint sets the XSRF-TOKEN cookie in the browser
    await publicClient.get(SANCTUM_CSRF_URL);
    console.log('CSRF cookie successfully fetched.');
  } catch (error) {
    console.error('Failed to fetch CSRF cookie:', error);
    // Depending on the app's requirements, you might want to throw or return false
    throw new Error('CSRF token acquisition failed. Cannot proceed with state-changing requests.');
  }
};

// ------------------------------------
// 3. Authenticated Client Factory
// ------------------------------------

/**
 * Creates an Axios instance configured with the Authorization header.
 * @param token The JWT token to include in the Authorization header.
 */
export const createAuthenticatedClient = (token: string): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // JWT token for authentication
    },
    withCredentials: true, // Still needed for Sanctum's cookie-based CSRF protection
  });

  // Optional: Add an interceptor to handle token expiration/401 errors globally
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response && error.response.status === 401) {
        // Handle unauthorized error (e.g., token expired, revoked)
        // NOTE: A proper implementation would trigger `useAuth().logout()` here.
        // Since we cannot use hooks outside components, this is just a log:
        console.error('Authentication error (401). Token might be expired.');
        // If you were using a library like Zustand, you could call a store action here.
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
 * Automatically uses the JWT token for authenticated requests.
 * @returns {AxiosInstance} An Axios instance configured for API requests.
 */
export const useApiClient = (): AxiosInstance => {
  const { token } = useAuth();
  
  // If a token exists, return the authenticated client
  if (token) {
    return createAuthenticatedClient(token);
  }
  
  // If no token, return the public client
  return publicClient;
};

// Export the public client for unauthenticated routes that don't need the hook
export { publicClient };