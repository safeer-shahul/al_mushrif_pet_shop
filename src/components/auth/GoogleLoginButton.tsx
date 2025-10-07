// src/components/auth/GoogleLoginButton.tsx
'use client';

import React from 'react';

// Assuming the Laravel backend has a route like /api/auth/google/redirect
const LARAVEL_GOOGLE_REDIRECT_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}auth/google/redirect`;

interface GoogleLoginButtonProps {
  type: 'customer' | 'admin';
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ type }) => {
  
  // Note: The Laravel backend should handle the OAuth flow and redirect back to /auth/callback
  const startGoogleLogin = () => {
    // We append the type to the state/query parameter so Laravel knows which login flow to use (e.g., check staff status)
    const redirectUrl = `${LARAVEL_GOOGLE_REDIRECT_URL}?type=${type}`;
    window.location.href = redirectUrl;
  };

  return (
    <button
      onClick={startGoogleLogin}
      className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {/* Placeholder for a Google icon */}
      <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">...</svg> 
      Sign in with Google {type === 'admin' ? '(Admin/Staff)' : ''}
    </button>
  );
};

export default GoogleLoginButton;