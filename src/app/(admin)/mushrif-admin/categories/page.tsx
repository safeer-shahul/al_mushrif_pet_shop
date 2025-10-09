// src/app/(admin)/mushrif-admin/categories/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { AnyCategory, SubCategory } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService';

const CategoryListPage: React.FC = () => {
  const { fetchAllCategories, deleteCategory } = useCategoryService();
  const [categories, setCategories] = useState<AnyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to prevent duplicate API calls
  const hasFetchedRef = useRef(false);
  
  // State to explicitly trigger a data refresh after CRUD operations
  const [refreshToggle, setRefreshToggle] = useState(0);

  // Memoize the load function to prevent recreating it on every render
  const loadCategories = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (loading && hasFetchedRef.current) {
      return;
    }
    
    setLoading(true);
    setError(null);
    hasFetchedRef.current = true;
    
    try {
      const data = await fetchAllCategories();
      setCategories(data);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
      console.error('Error loading categories:', err);
      setCategories([]); // Set empty array on error to prevent undefined issues
    } finally {
      setLoading(false);
    }
  }, [fetchAllCategories]); // Only depend on fetchAllCategories

  // Initial load
  useEffect(() => {
    // Only fetch if we haven't already
    if (!hasFetchedRef.current) {
      loadCategories();
    }
  }, []); // Empty dependency array for mount only

  // Handle refresh after CRUD operations
  useEffect(() => {
    if (refreshToggle > 0) {
      hasFetchedRef.current = false; // Reset the flag to allow new fetch
      loadCategories();
    }
  }, [refreshToggle, loadCategories]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this category?`)) return;
    
    try {
      setError(null); // Clear any previous errors
      await deleteCategory(id);
      alert('Category deleted successfully.');
      // Trigger refresh after successful delete
      setRefreshToggle(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category.');
      console.error('Delete error:', err);
    }
  };

  // Helper to find parent's name for display
  const getParentName = useCallback((parentId: string) => {
    const parent = categories.find(c => c.id === parentId);
    if (!parent) return 'N/A';
    return 'cat_name' in parent ? parent.cat_name : ('sub_cat_name' in parent ? parent.sub_cat_name : 'N/A');
  }, [categories]);

  // Manual refresh function
  const handleManualRefresh = () => {
    hasFetchedRef.current = false;
    setRefreshToggle(prev => prev + 1);
  };

  // Show loading spinner only on initial load
  if (loading && categories.length === 0 && !hasFetchedRef.current) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <Link href="/mushrif-admin/categories/create" passHref>
            <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-light transition">
              <FaPlus className="mr-2" /> Add New Category
            </button>
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Categories Table */}
      {!error && categories.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((cat) => (
                <tr key={cat.id} className={('parent_id' in cat) ? 'bg-gray-50' : ''}>
                  {/* Type Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      ('parent_id' in cat) ? 'bg-indigo-100 text-indigo-800' : 'bg-primary/10 text-primary'
                    }`}>
                      {('parent_id' in cat) ? 'Sub' : 'Root'}
                    </span>
                  </td>
                  
                  {/* Name Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {'cat_name' in cat ? cat.cat_name : ('sub_cat_name' in cat ? cat.sub_cat_name : 'N/A')}
                  </td>
                  
                  {/* Parent Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {('parent_id' in cat) ? getParentName((cat as SubCategory).parent_id) : '---'}
                  </td>
                  
                  {/* Actions Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link href={`/mushrif-admin/categories/${cat.id}`}>
                      <button className="text-primary hover:text-primary-light p-1">
                        <FaEdit />
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      disabled={loading}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!error && categories.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <p className="text-gray-500 mb-4">No categories found. Create your first category to get started.</p>
          <Link href="/mushrif-admin/categories/create" passHref>
            <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-light transition">
              <FaPlus className="mr-2" /> Create First Category
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default CategoryListPage;