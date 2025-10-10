// src/app/(admin)/mushrif-admin/sub-categories/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaSync, FaImage, FaLayerGroup } from 'react-icons/fa';
import { SubCategory } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService';

const SubCategoryListPage: React.FC = () => {
    const router = useRouter();
    const { fetchAllSubCategories, deleteSubCategory, getStorageUrl } = useCategoryService();
    
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedRef = useRef(false);

    // Load function - memoized with proper dependencies
    const loadCategories = useCallback(async () => {
        // Prevent duplicate calls while already loading
        if (loading && hasFetchedRef.current) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const subs = await fetchAllSubCategories(); 
            setSubCategories(subs);
            setError(null);
            hasFetchedRef.current = true;
        } catch (err: any) {
            setError(err.message || 'Failed to load sub categories');
            console.error('Error loading sub categories:', err);
            setSubCategories([]);
        } finally {
            setLoading(false);
        }
    }, [fetchAllSubCategories, loading]); 

    // Load on mount only
    useEffect(() => {
        if (!hasFetchedRef.current) {
            loadCategories();
        }
    }, [loadCategories]);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the Sub Category: ${name}?`)) return;
        
        try {
            setError(null);
            await deleteSubCategory(id);
            
            // Show success message with modern toast notification
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
            toast.textContent = 'Sub Category deleted successfully.';
            document.body.appendChild(toast);
            setTimeout(() => document.body.removeChild(toast), 3000);
            
            // Reload the list after successful delete
            hasFetchedRef.current = false;
            await loadCategories();
        } catch (err: any) {
            setError(err.message || 'Failed to delete sub category. Check for nested children.');
            console.error('Delete error:', err);
        }
    };

    const handleManualRefresh = () => {
        hasFetchedRef.current = false;
        loadCategories();
    };

    if (loading && subCategories.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header section with actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Sub Category Management</h1>
                    <p className="text-gray-500 mt-1">Manage and organize your sub categories</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleManualRefresh}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <FaSync className={`inline-block mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    <Link href="/mushrif-admin/sub-categories/create" passHref>
                        <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm">
                            <FaPlus className="mr-2" /> Add Sub Category
                        </button>
                    </Link>
                </div>
            </div>

            {/* Error alert */}
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FaTrash className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Data table */}
            {!error && subCategories.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {subCategories.map((cat, index) => {
                                    const imageUrl = getStorageUrl(cat.sub_cat_image);
                                    return (
                                        <tr key={cat.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{cat.sub_cat_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-blue-600">{cat.parent_display_name || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {imageUrl ? (
                                                    <a href={imageUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                        <img 
                                                            src={imageUrl} 
                                                            alt={cat.sub_cat_name} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </a>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                        <FaImage className="text-gray-400 w-6 h-6" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-500 max-w-xs overflow-hidden truncate">
                                                    {cat.sub_cat_description || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <Link href={`/mushrif-admin/sub-categories/${cat.id}`}>
                                                    <button className="p-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
                                                        <FaEdit />
                                                    </button>
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(cat.id, cat.sub_cat_name)}
                                                    className="p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                                                    disabled={loading}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Empty state */}
            {!error && subCategories.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                        <FaLayerGroup className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Sub Categories Found</h3>
                    <p className="mt-2 text-gray-500 max-w-sm mx-auto">Create your first sub category to organize your products</p>
                    <div className="mt-6">
                        <Link href="/mushrif-admin/sub-categories/create" passHref>
                            <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-sm">
                                <FaPlus className="mr-2" /> Create First Sub Category
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubCategoryListPage;