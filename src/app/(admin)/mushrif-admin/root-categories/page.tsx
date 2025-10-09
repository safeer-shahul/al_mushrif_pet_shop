// src/app/(admin)/mushrif-admin/root-categories/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import { RootCategory } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService';

const RootCategoryListPage: React.FC = () => {
    const { fetchAllRootCategories, deleteRootCategory, getStorageUrl } = useCategoryService();
    const [categories, setCategories] = useState<RootCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedRef = useRef(false);
    const [refreshToggle, setRefreshToggle] = useState(0);

    const loadCategories = useCallback(async () => {
        // ... (loadCategories logic remains the same)
        if (loading && hasFetchedRef.current) return;
        
        setLoading(true);
        setError(null);
        hasFetchedRef.current = true;
        
        try {
            const data = await fetchAllRootCategories();
            setCategories(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load root categories');
            console.error('Error loading categories:', err);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, [fetchAllRootCategories, loading]);

    useEffect(() => {
        if (!hasFetchedRef.current || refreshToggle > 0) {
            loadCategories();
        }
    }, [refreshToggle, loadCategories]);

    const handleDelete = async (id: string, name: string) => {
        // ... (handleDelete logic remains the same)
        if (!window.confirm(`Are you sure you want to delete the Root Category: ${name}?`)) return;
        
        try {
            setError(null);
            await deleteRootCategory(id);
            alert('Root Category deleted successfully.');
            setRefreshToggle(prev => prev + 1);
        } catch (err: any) {
            setError(err.message || 'Failed to delete root category.');
            console.error('Delete error:', err);
        }
    };

    const handleManualRefresh = () => {
        hasFetchedRef.current = false;
        setRefreshToggle(prev => prev + 1);
    };

    if (loading && categories.length === 0 && !hasFetchedRef.current) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            {/* ... (Header and Error display remain the same) ... */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Root Category Management</h1>
                <div className="flex gap-2">
                    <button 
                        onClick={handleManualRefresh}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    <Link href="/mushrif-admin/root-categories/create" passHref>
                        <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-light transition">
                            <FaPlus className="mr-2" /> Add Root Category
                        </button>
                    </Link>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {!error && categories.length > 0 && (
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                {/* Changed header to reflect image thumbnail */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th> 
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map((cat) => {
                                // Prepare the image URL using the service utility
                                const imageUrl = getStorageUrl(cat.cat_image);

                                return (
                                    <tr key={cat.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {cat.cat_name}
                                        </td>
                                        {/* IMAGE THUMBNAIL COLUMN (UPDATED) */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {imageUrl ? (
                                                <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={cat.cat_name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-xs">No Image</span>
                                            )}
                                        </td>
                                        {/* END IMAGE THUMBNAIL COLUMN */}
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden truncate">
                                            {cat.cat_description || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Link href={`/mushrif-admin/root-categories/${cat.id}`}>
                                                <button className="text-primary hover:text-primary-light p-1">
                                                    <FaEdit />
                                                </button>
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(cat.id, cat.cat_name)}
                                                className="text-red-600 hover:text-red-800 p-1"
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
            )}
            {/* ... (Empty State remains the same) ... */}
            {!error && categories.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                    <p className="text-gray-500 mb-4">No Root Categories found.</p>
                    <Link href="/mushrif-admin/root-categories/create" passHref>
                        <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-light transition">
                            <FaPlus className="mr-2" /> Create First Root Category
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default RootCategoryListPage;