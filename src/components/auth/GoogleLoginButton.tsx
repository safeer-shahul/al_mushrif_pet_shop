// src/components/auth/GoogleLoginButton.tsx
'use client';

import React, { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
// IMPORT THE NEW API UTILITY
import { initiateGoogleLogin } from '@/utils/authApi'; 

interface GoogleLoginButtonProps {
  type: 'customer' | 'admin';
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ type }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the centralized helper function to get the redirect URL
      const redirectUrl = await initiateGoogleLogin();

      // Append the 'type' to the final redirect URL that goes to Google/Laravel
      // This is a common way to signal the backend which frontend flow initiated the OAuth.
      const finalRedirectUrl = `${redirectUrl}&state=type=${type}`; 
      
      // Redirect the user to the Google authorization page
      window.location.href = finalRedirectUrl;

    } catch (err: any) {
      console.error('Google login initiation error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={startGoogleLogin}
      disabled={loading}
      className={`w-full flex justify-center items-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition ${
        loading 
          ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' 
          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
      }`}
    >
      <FaGoogle className="w-4 h-4 mr-2" />
      {loading ? 'Connecting...' : `Sign in with Google ${type === 'admin' ? '(Staff)' : ''}`}
      {error && <span className="ml-2 text-red-500">{error}</span>}
    </button>
  );
};

export default GoogleLoginButton;