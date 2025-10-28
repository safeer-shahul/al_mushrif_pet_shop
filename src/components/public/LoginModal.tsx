// src/components/public/LoginModal.tsx
'use client';

import React, { useState } from 'react';
import LoginForm from '../auth/LoginForm';
import GoogleLoginButton from '../auth/GoogleLoginButton';
import { FaTimes, FaLock } from 'react-icons/fa';
import { loginUser } from '@/utils/authApi';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    // 💡 FIX 1: Add the optional onLoginSuccess prop to the interface
    onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => { // 💡 Destructure the prop
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [loginSuccess, setLoginSuccess] = useState(false);

    if (!isOpen) return null;

    const handleLoginSuccess = (user: any, token: string) => {
        login(user, token);
        setLoginSuccess(true);
        setError(null);

        setTimeout(() => {
            onClose();
            // 💡 FIX 2: Call the callback on successful login
            if (onLoginSuccess) onLoginSuccess();
        }, 800);
    };

    const handleSubmit = async (identifier: string, password: string) => {
        setError(null);
        try {
            const { user, access_token } = await loginUser(identifier, password);
            handleLoginSuccess(user, access_token);
        } catch (err: any) {
            console.error('Login error:', err.message);
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center">
            <div className="relative bg-white w-full max-w-md mx-4 my-8 p-6 rounded-xl shadow-2xl transform transition-all">

                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                >
                    <FaTimes className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <FaLock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
                    <h2 className="text-2xl font-bold text-slate-800">
                        Sign In or Register
                    </h2>
                    <p className="text-sm text-gray-500">Access your cart, wishlist, and profile.</p>
                </div>

                {/* Success State */}
                {loginSuccess && (
                     <div className="p-4 mb-4 text-center text-sm font-medium text-green-700 bg-green-100 rounded-lg">
                        Login successful! Redirecting...
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-3 mb-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <LoginForm onSubmit={handleSubmit} />

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 text-gray-500 bg-white">OR</span>
                    </div>
                </div>

                {/* Google Button */}
                <GoogleLoginButton type="customer" />

                <p className="text-sm text-center text-gray-600 mt-4">
                    New customer? <a href="/register" onClick={() => { onClose(); }} className="font-medium hover:text-blue-600" style={{ color: 'var(--color-primary-light)' }}>
                        Create an account
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginModal;