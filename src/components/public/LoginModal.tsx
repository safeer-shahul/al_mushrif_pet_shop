// src/components/public/LoginModal.tsx
'use client';

import React, { useState } from 'react';
import LoginForm from '../auth/LoginForm';
import RegisterForm from '../auth/RegisterForm';
import GoogleLoginButton from '../auth/GoogleLoginButton';
import { FaTimes, FaLock, FaUserPlus } from 'react-icons/fa';
import { loginUser, registerUser } from '@/utils/authApi';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess?: () => void;
}

type ModalView = 'login' | 'register';

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [view, setView] = useState<ModalView>('login');

    React.useEffect(() => {
        if (isOpen) {
            setView('login');
            setLoginSuccess(false);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLoginSuccess = (user: any, token: string) => {
        login(user, token);
        setLoginSuccess(true);
        setError(null);

        setTimeout(() => {
            onClose();
            if (onLoginSuccess) onLoginSuccess();
        }, 800);
    };

    const handleLoginSubmit = async (identifier: string, password: string) => {
        setError(null);
        try {
            const { user, access_token } = await loginUser(identifier, password);
            handleLoginSuccess(user, access_token);
        } catch (err: any) {
            console.error('Login error:', err.message);
            setError(err.message);
        }
    };

    const handleRegisterSubmit = async (userData: any) => {
        setError(null);
        try {
            const { user, access_token } = await registerUser(userData);
            handleLoginSuccess(user, access_token);
        } catch (err: any) {
            console.error('Registration error:', err.message);
            setError(err.message);
        }
    };

    const isLoginView = view === 'login';
    const title = isLoginView ? 'Sign In' : 'Create an Account';
    const subtitle = isLoginView
        ? 'Access your cart, wishlist, and profile.'
        : 'Get started and enjoy full access.';

    const Icon = isLoginView ? FaLock : FaUserPlus;

    return (
        // 1. Outer Overlay: Ensure it covers the full viewport (h-screen)
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* 2. Inner Modal Container: Allow height up to 95% of screen height */}
            <div
                className="relative bg-white w-full max-w-md mx-4 my-8 p-6 rounded-xl shadow-2xl transform transition-all 
                           max-h-[95vh] overflow-y-auto" // 💡 FIX: Max height and internal scrolling
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    className="sticky top-0 right-0 text-gray-400 hover:text-gray-600 z-10 bg-white p-2 -mr-2" // Make button sticky
                    onClick={onClose}
                    style={{ position: 'sticky', float: 'right', marginTop: '-1rem' }}
                >
                    <FaTimes className="w-5 h-5" />
                </button>

                {/* Header (Made sticky if possible, but the original structure might not allow full sticky header easily) */}
                <div className="text-center mb-6">
                    <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
                    <h2 className="text-2xl font-bold text-slate-800">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>

                {/* Success State */}
                {loginSuccess && (
                    <div className="p-4 mb-4 text-center text-sm font-medium text-green-700 bg-green-100 rounded-lg">
                        {isLoginView ? 'Login successful! Redirecting...' : 'Registration successful! Redirecting...'}
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-3 mb-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Conditional Form Rendering */}
                {!loginSuccess && (
                    <>
                        {isLoginView ? (
                            <LoginForm onSubmit={handleLoginSubmit} />
                        ) : (
                            <RegisterForm onSubmit={handleRegisterSubmit} />
                        )}

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

                        {/* Switch Link */}
                        <p className="text-sm text-center text-gray-600 mt-4">
                            {isLoginView ? 'New customer?' : 'Already have an account?'}
                            <button
                                type="button"
                                onClick={() => setView(isLoginView ? 'register' : 'login')}
                                className="ml-1 font-medium hover:text-blue-600"
                                style={{ color: 'var(--color-primary-light)' }}
                            >
                                {isLoginView ? 'Create an account' : 'Sign in here'}
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginModal;