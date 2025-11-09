// src/utils/authApi.ts

import { publicClient, getCsrfToken } from './ApiClient';
import { User } from '@/context/AuthContext';
import { AxiosError } from 'axios';

// Define the expected successful response structure
interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

/**
 * Handles the login process (for both customer and admin).
 * 1. Fetches CSRF token.
 * 2. Attempts login using identifier (email/username) and password.
 * 3. Handles and formats errors for the frontend.
 * * @param identifier Email or Username
 * @param password User's password
 * @returns Promise<AuthResponse> containing user data and JWT token
 */
export const loginUser = async (identifier: string, password: string): Promise<AuthResponse> => {
  const API_LOGIN_ENDPOINT = '/auth/login';

  try {
    // Step 1: Secure the request by fetching the CSRF cookie
    await getCsrfToken();

    // Step 2: Perform the login POST request
    const response = await publicClient.post(API_LOGIN_ENDPOINT, {
      identifier,
      password,
    });

    const { user, access_token, token_type } = response.data;

    if (!user || !access_token) {
      throw new Error("Login API succeeded but returned incomplete data.");
    }

    return { user, access_token, token_type };

  } catch (err) {
    // Step 3: Handle Axios and API errors
    const axiosError = err as AxiosError;
    let errorMessage = 'An unexpected error occurred during login.';

    if (axiosError.response) {
      const data = axiosError.response.data as any;

      // Check for Laravel validation errors (specifically the 'identifier' field)
      errorMessage = data.errors?.identifier?.[0]
        || data.message
        || `Server error: ${axiosError.response.statusText}`;

    } else if (axiosError.request) {
      errorMessage = 'No response from the API server. Check your connection or API URL.';
    }

    // Throw a formatted error message that the page component can display
    throw new Error(errorMessage);
  }
};

/**
 * Handles the user registration process.
 * @param userData User data including username, email, password, etc.
 * @returns Promise<AuthResponse> containing newly created user data and JWT token
 */
export const registerUser = async (userData: any): Promise<AuthResponse> => {
  const API_REGISTER_ENDPOINT = '/auth/register';

  try {
    // Step 1: Secure the request by fetching the CSRF cookie
    await getCsrfToken();

    // Step 2: Perform the registration POST request
    const response = await publicClient.post(API_REGISTER_ENDPOINT, userData);

    const { user, access_token, token_type } = response.data;

    if (!user || !access_token) {
      throw new Error("Registration API succeeded but returned incomplete data.");
    }

    return { user, access_token, token_type };

  } catch (err) {
    // Step 3: Handle Axios and API errors
    const axiosError = err as AxiosError;
    let errorMessage = 'An unexpected error occurred during registration.';

    if (axiosError.response) {
      const data = axiosError.response.data as any;

      // Check for common Laravel validation errors and format a friendly message
      if (data.errors) {
        // Join all validation messages into one string
        errorMessage = Object.values(data.errors).flat().join(' | ');
      } else {
        errorMessage = data.message || `Server error: ${axiosError.response.statusText}`;
      }

    } else if (axiosError.request) {
      errorMessage = 'No response from the API server. Check your connection or API URL.';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Initiates the Google login flow.
 * @returns Promise<string> the redirect URL from the Laravel backend.
 */
export const initiateGoogleLogin = async (): Promise<string> => {
  const API_REDIRECT_ENDPOINT = '/auth/google/redirect';

  try {
    // Send a GET request to the API to get the external redirect URL
    const response = await publicClient.get(API_REDIRECT_ENDPOINT);
    const redirectUrl = response.data.redirect_url;

    if (!redirectUrl) {
      throw new Error('API did not provide a valid Google redirect URL.');
    }

    return redirectUrl;

  } catch (err) {
    throw new Error('Could not initiate Google login flow. Server connection failed.');
  }
};