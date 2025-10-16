// src/components/auth/GoogleLoginButton.tsx
'use client';

import React, { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
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
      const redirectUrl = await initiateGoogleLogin();
      const finalRedirectUrl = `${redirectUrl}?type=${type}`;
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
      className={`w-full flex justify-center items-center py-2.5 px-4 border rounded-lg shadow-sm text-sm font-medium transition ${
        loading 
          ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
          : 'bg-white text-slate-700 hover:bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary'
      }`}
    >
      <FaGoogle className="w-4 h-4 mr-2 text-blue-600" />
      {loading ? 'Connecting...' : `Sign in with Google ${type === 'admin' ? '(Staff)' : ''}`}
      {error && <span className="ml-2 text-red-500">{error}</span>}
    </button>
  );
};

export default GoogleLoginButton;