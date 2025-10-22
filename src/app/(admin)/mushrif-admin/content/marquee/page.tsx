// src/app/(admin)/mushrif-admin/content/marquee/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaSync, FaBullhorn, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Marquee } from '@/types/content';
import { useMarqueeService } from '@/services/admin/marqueeService';

// =================================================================
// 1. Marquee Form Component (Nested)
// =================================================================
interface MarqueeFormProps {
    initialData?: Partial<Marquee>;
    isEditMode: boolean;
    onSave: (content: string, is_active: boolean, id?: string) => Promise<void>;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
}

const MarqueeForm: React.FC<MarqueeFormProps> = ({ 
    initialData, isEditMode, onSave, onClose, isLoading, error 
}) => {
    const [content, setContent] = useState(initialData?.content || '');
    const [isActive, setIsActive] = useState(initialData?.is_active ?? false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        await onSave(content.trim(), isActive, initialData?.id);
    };

    return (
        <div className="p-4 bg-white border border-blue-200 rounded-xl shadow-md space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
                {isEditMode ? 'Edit Marquee Message' : 'Create New Marquee Message'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-2 bg-red-100 text-red-700 text-sm rounded">{error}</div>}
                
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-slate-700">
                        Marquee Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                        required
                        placeholder="Enter the scrolling text message for active offers..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 text-sm"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex items-center">
                    <input
                        id="isActive"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <label htmlFor="isActive" className="ml-3 text-sm font-medium text-slate-700">
                        Set as Active
                    </label>
                </div>

                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        <FaPlus className={`inline mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {isEditMode ? (isLoading ? 'Saving...' : 'Update Message') : (isLoading ? 'Creating...' : 'Create Message')}
                    </button>
                </div>
            </form>
        </div>
    );
};


// =================================================================
// 2. Main Page Component
// =================================================================
const AdminMarqueePage: React.FC = () => {
    const { fetchAllMarquees, createMarquee, updateMarquee, deleteMarquee } = useMarqueeService();
    
    const [marquees, setMarquees] = useState<Marquee[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingMarquee, setEditingMarquee] = useState<Marquee | null>(null);
    const hasFetchedRef = useRef(false);

    // Load function
    const loadMarquees = useCallback(async () => {
        if (loading && hasFetchedRef.current) return;
        
        setLoading(true);
        setApiError(null);
        
        try {
            const fetchedMarquees = await fetchAllMarquees(); 
            setMarquees(fetchedMarquees);
            hasFetchedRef.current = true;
        } catch (err: any) {
            setApiError(err.message || 'Failed to load marquee content.');
            setMarquees([]);
        } finally {
            setLoading(false);
        }
    }, [fetchAllMarquees, loading]); 

    useEffect(() => {
        if (!hasFetchedRef.current) {
            loadMarquees();
        }
    }, [loadMarquees]);

    // Handle Save (Create or Update)
    const handleSave = useCallback(async (content: string, is_active: boolean, id?: string) => {
        setApiError(null);
        setLocalLoading(true);
        try {
            if (id) {
                await updateMarquee(id, content, is_active);
                alert('Marquee message updated successfully.');
            } else {
                await createMarquee(content, is_active);
                alert('Marquee message created successfully.');
            }
            
            setIsFormVisible(false);
            setEditingMarquee(null);
            await loadMarquees(); // Reload list after success
        } catch (err: any) {
            setApiError(err.message || 'Failed to save marquee message.');
        } finally {
            setLocalLoading(false);
        }
    }, [createMarquee, updateMarquee, loadMarquees]);

    // Handle Delete
    const handleDelete = async (id: string, content: string) => {
        if (!window.confirm(`Are you sure you want to delete the Marquee: "${content}"?`)) return;
        
        setLocalLoading(true);
        setApiError(null);
        try {
            await deleteMarquee(id);
            alert('Marquee deleted successfully.');
            await loadMarquees();
        } catch (err: any) {
            setApiError(err.message || 'Failed to delete marquee.');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleOpenForm = (marquee: Marquee | null = null) => {
        setEditingMarquee(marquee);
        setIsFormVisible(true);
        setApiError(null);
    };

    if (loading && marquees.length === 0 && !apiError) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header section with actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Marquee Content Management</h1>
                    <p className="text-gray-500 mt-1">Create and manage the scrolling text that displays active offers.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={loadMarquees}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <FaSync className={`inline-block mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    <button 
                        onClick={() => handleOpenForm(null)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-colors shadow-sm"
                    >
                        <FaPlus className="mr-2" /> Add New Message
                    </button>
                </div>
            </div>

            {/* Form Display */}
            {isFormVisible && (
                <MarqueeForm 
                    initialData={editingMarquee || {}}
                    isEditMode={!!editingMarquee}
                    onSave={handleSave}
                    onClose={() => { setIsFormVisible(false); setEditingMarquee(null); setApiError(null); }}
                    isLoading={localLoading}
                    error={apiError}
                />
            )}

            {/* Error alert */}
            {apiError && !isFormVisible && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <p className="text-sm text-red-700">{apiError}</p>
                </div>
            )}

            {/* Data table */}
            {!apiError && marquees.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {marquees.map((marquee, index) => (
                                    <tr key={marquee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 max-w-lg">
                                            <div className="text-sm text-gray-900 truncate">
                                                <FaBullhorn className="inline mr-2 text-blue-500" />
                                                {marquee.content}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${marquee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {marquee.is_active ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
                                                {marquee.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button 
                                                onClick={() => handleOpenForm(marquee)}
                                                className="p-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                                                disabled={localLoading}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(marquee.id, marquee.content)}
                                                className="p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                                                disabled={localLoading}
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Empty state */
                !loading && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                            <FaBullhorn className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No Marquee Messages</h3>
                        <p className="mt-2 text-gray-500 max-w-sm mx-auto">Create a message to display scrolling text across your header.</p>
                        <div className="mt-6">
                            <button 
                                onClick={() => handleOpenForm(null)}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-sm"
                            >
                                <FaPlus className="mr-2" /> Create First Message
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default AdminMarqueePage;