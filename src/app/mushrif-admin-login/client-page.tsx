'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { loginUser } from '@/utils/authApi';
import { FaPaw } from 'react-icons/fa';

// Renamed component
const AdminLoginPageClient: React.FC = () => {
    const { login } = useAuth();
    const router = useRouter();
    // CRITICAL: useSearchParams() is the hook requiring the Suspense boundary in the parent.
    const searchParams = useSearchParams(); 
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const queryError = searchParams.get('error');
        if (queryError) {
            setError(decodeURIComponent(queryError));
        }
    }, [searchParams]);

    const handleLoginSuccess = (user: any, token: string) => {
        if (user.is_superuser || user.is_staff) {
            login(user, token);
            router.push('/mushrif-admin');
        } else {
            setError('Access Denied: Only staff and superusers can log in here. Redirecting to customer login...');
            setTimeout(() => router.replace('/login'), 3000); 
        }
    };

    const handleSubmit = async (identifier: string, password: string) => {
        setError(null);
        try {
            const { user, access_token } = await loginUser(identifier, password);
            handleLoginSuccess(user, access_token);
        } catch (err: any) {
            console.error('Admin Login error:', err.message);
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center mb-8">
                    <div className="flex justify-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                            <FaPaw className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Al Mushrif Pet Shop
                    </h2>
                    <p className="mt-1 text-gray-500">Admin Portal Access</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <LoginForm 
                        onSubmit={handleSubmit} 
                        emailLabel="Staff Email or Username" 
                    />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 text-gray-500 bg-white">OR</span>
                        </div>
                    </div>

                    <GoogleLoginButton type="admin" />
                </div>
                
                <p className="mt-4 text-center text-sm text-gray-500">
                    Need customer access? <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">Sign in here</a>
                </p>
            </div>
        </div>
    );
};

export default AdminLoginPageClient;