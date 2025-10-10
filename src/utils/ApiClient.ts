// utils/ApiClient.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
// import { User } from '@/context/AuthContext';
// ------------------------------------
// 1. Constants and Base Client
// ------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SANCTUM_CSRF_URL = process.env.NEXT_PUBLIC_SANCTUM_CSRF_URL;

const ADMIN_ROUTE_PREFIX = '/mushrif-admin';
const ADMIN_LOGIN_PATH = '/mushrif-admin-login';
const PUBLIC_HOME_PATH = '/';

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


const handleUnauthorized = (status: number) => {
    // We use window.location.pathname to check the current route client-side
    const currentPath = window.location.pathname;
    
    // Check if the user is on an admin route
    const isAdminRoute = currentPath.startsWith(ADMIN_ROUTE_PREFIX);
    
    // Determine the destination path
    const destinationPath = isAdminRoute ? ADMIN_LOGIN_PATH : PUBLIC_HOME_PATH;
    
    console.error(`Authorization error (${status}). Redirecting to ${destinationPath}.`);
    
    // NOTE: In a complete solution, we would call the logout function from useAuth here
    // to clear the token (e.g., useAuth.logout()).
    
    // Perform a hard redirect to clear all component state and ensure a clean navigation
    window.location.href = destinationPath; 
};

/**
 * Creates an Axios instance configured with the Authorization header.
 * FIX: Allow custom headers to override Content-Type for FormData.
 */
export const createAuthenticatedClient = (token: string, config?: AuthClientConfig): AxiosInstance => {
    
    const defaultHeaders: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const finalHeaders: AxiosRequestConfig['headers'] = {
        ...defaultHeaders,
        ...config?.headers,
    };

    if (config?.omitContentType) {
        delete finalHeaders['Content-Type'];
    }

    const client = axios.create({
        baseURL: API_BASE_URL,
        headers: finalHeaders,
        withCredentials: true,
    });

    // 💡 INTERCEPTOR FIX: Centralized 401/403 handling and Redirection
    client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
            if (error.response) {
                const status = error.response.status;
                
                // If 401 (Unauthorized) or 403 (Forbidden/Role Failed), handle the logout and redirect
                if (status === 401 || status === 403) {
                    // Call the function that handles clearing token and redirection
                    handleUnauthorized(status);
                    
                    // Reject the promise to stop execution in the calling component
                    return Promise.reject(error);
                }
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