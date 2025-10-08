// src/components/auth/LoginForm.tsx
'use client';

import React, { useState } from 'react';

interface LoginFormProps {
  // Change parameter name to 'identifier' to match backend logic
  onSubmit: (identifier: string, password: string) => Promise<void>;
  emailLabel?: string; 
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, emailLabel }) => {
  // Use 'identifier' to store the combined email/username input
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Pass the identifier state to the onSubmit handler
      await onSubmit(identifier, password); 
    } catch (error) {
      // Error handling is done in the parent page component
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        {/* Updated label to reflect the email/username choice */}
        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {emailLabel || 'Email or Username'} 
        </label>
        <div className="mt-1">
          <input
            id="identifier"
            name="identifier"
            type="text" // Changed type from 'email' to 'text' for username support
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          loading 
            ? 'bg-primary/70 cursor-not-allowed' 
            : 'bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
        }`}
      >
        {loading ? 'Processing...' : 'Sign in'}
      </button>
    </form>
  );
};

export default LoginForm;