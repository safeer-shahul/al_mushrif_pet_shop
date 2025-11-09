// src/components/auth/RegisterForm.tsx
'use client';

import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface RegisterFormData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirmation: string;
}

interface RegisterFormProps {
    onSubmit: (userData: RegisterFormData) => Promise<void>;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit }) => {
    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirmation: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            // Error handling is done in the parent (LoginModal)
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    // Helper for common input styling
    const inputClasses = "mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all";
    const labelClasses = "block text-sm font-medium text-slate-700";

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                    <label htmlFor="first_name" className={labelClasses}>First Name</label>
                    <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={handleChange}
                        className={inputClasses}
                    />
                </div>
                {/* Last Name */}
                <div>
                    <label htmlFor="last_name" className={labelClasses}>Last Name</label>
                    <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={handleChange}
                        className={inputClasses}
                    />
                </div>
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className={labelClasses}>Email Address</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClasses}
                />
            </div>
            
            {/* Username */}
            <div>
                <label htmlFor="username" className={labelClasses}>Username</label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className={inputClasses}
                />
            </div>

            {/* Password */}
            <div>
                <label htmlFor="password" className={labelClasses}>Password</label>
                <div className="mt-1 relative">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={formData.password}
                        onChange={handleChange}
                        className={`${inputClasses} pr-10`}
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={togglePasswordVisibility}
                        tabIndex={-1}
                    >
                        {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            
            {/* Password Confirmation */}
            <div>
                <label htmlFor="password_confirmation" className={labelClasses}>Confirm Password</label>
                <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    required
                    minLength={8}
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className={inputClasses}
                />
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
                {loading ? 'Creating Account...' : 'Register'}
            </button>
        </form>
    );
};

export default RegisterForm;