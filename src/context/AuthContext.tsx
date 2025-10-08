// src/context/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// ------------------------------------
// 1. Types
// ------------------------------------

// Define the shape of the user data stored in the context
interface User {
  id: number;
  // NOTE: 'name' is often null in Laravel Sanctum responses; we rely on first_name/last_name
  name: string | null; 
  email: string;
  username: string; // Added username for identifier login flexibility
  is_superuser: boolean; // For /mushrif-admin access
  is_staff: boolean;     // For certain privileged actions
  
  // FIX: Added first_name and last_name properties to the interface
  first_name: string | null;
  last_name: string | null;
}

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (userData: User, jwtToken: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// ------------------------------------
// 2. Context Creation
// ------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ------------------------------------
// 3. Provider Component
// ------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from localStorage on initial load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken && storedUser) {
        setToken(storedToken);
        // FIX: Ensure storedUser is cast to the new User type
        setUser(JSON.parse(storedUser)); 
      }
    } catch (error) {
      console.error('Error loading auth state from storage:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function: Store token and user data
  const login = (userData: User, jwtToken: string) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('authToken', jwtToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  // Logout function: Clear state and storage
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Optional: Redirect to login page after logout
    // window.location.href = '/login'; 
  };
  
  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!token,
    token,
    login,
    logout,
    isLoading,
  }), [user, token, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ------------------------------------
// 4. Custom Hook
// ------------------------------------

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}