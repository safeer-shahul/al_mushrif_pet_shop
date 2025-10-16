// src/components/auth/LoginForm.tsx
'use client';

import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface LoginFormProps {
  onSubmit: (identifier: string, password: string) => Promise<void>;
  emailLabel?: string; 
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, emailLabel }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(identifier, password); 
    } catch (error) {
      // Error handling is done in the parent page component
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-slate-700">
          {emailLabel || 'Email or Username'} 
        </label>
        <div className="mt-1">
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="mt-1 relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            onClick={togglePasswordVisibility}
            tabIndex={-1} // Ensures it doesn't get focus before submit button
          >
            {showPassword ? (
              <FaEyeSlash className="h-5 w-5" aria-hidden="true" />
            ) : (
              <FaEye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-white font-medium shadow-sm ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
        }`}
      >
        {loading ? 'Processing...' : 'Sign in'}
      </button>
    </form>
  );
};

export default LoginForm;