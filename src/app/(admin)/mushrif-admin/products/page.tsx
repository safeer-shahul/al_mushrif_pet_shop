'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaSync, FaBox, FaTags, FaSpinner, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';
import { Product } from '@/types/product';
import { useProductService } from '@/services/admin/productService';
import { toast } from 'react-hot-toast';

const ProductListPage: React.FC = () => {
    // 💡 Toggle function imported from service
    const { fetchAllProducts, deleteProduct, toggleProductStatus } = useProductService(); 
    
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isToggling, setIsToggling] = useState<string | null>(null); // Tracks which product is currently toggling
    const hasFetchedRef = useRef(false);

    // Load function
    const loadProducts = useCallback(async () => {
        if (loading && hasFetchedRef.current) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const fetchedProducts = await fetchAllProducts(); 
            setProducts(fetchedProducts);
            setError(null);
            hasFetchedRef.current = true;
        } catch (err: any) {
            setError(err.message || 'Failed to load products');
            console.error('Error loading products:', err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [fetchAllProducts, loading]); 

    // Load on mount only
    useEffect(() => {
        if (!hasFetchedRef.current) {
            loadProducts();
        }
    }, [loadProducts]);

    // 💡 NEW HANDLER: Toggle disabled status
    const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        setIsToggling(productId);

        try {
            const updatedProduct = await toggleProductStatus(productId, newStatus);
            
            setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));

            toast.success(`Product ${newStatus ? 'disabled' : 'enabled'} successfully.`);
        } catch (err: any) {
            toast.error(err.message || "Failed to change product status.");
        } finally {
            setIsToggling(null);
        }
    };
    

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the Product: "${name}"? This will delete all variants and cannot be undone.`)) return;
        
        try {
            setError(null);
            await deleteProduct(id);
            
            // Show success toast
            toast.success('Product deleted successfully.');
            
            // Reload the list
            hasFetchedRef.current = false;
            await loadProducts();
        } catch (err: any) {
            setError(err.message || 'Failed to delete product.');
            console.error('Delete error:', err);
        }
    };

    const handleManualRefresh = () => {
        hasFetchedRef.current = false;
        loadProducts();
    };

    if (loading && products.length === 0 && !error) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <LoadingSpinner />
            </div>
        );
    }
    
    // Utility to get the variant count
    const getVariantCount = (product: Product) => product.variants?.length || 0;

    return (
        <div className="space-y-6">
            {/* Header section with actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Product Catalog Management</h1>
                    <p className="text-gray-500 mt-1">Manage core products and their variants</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleManualRefresh}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <FaSync className={`inline-block mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    <Link href="/mushrif-admin/products/edit" passHref>
                        <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-colors shadow-sm">
                            <FaPlus className="mr-2" /> Add New Product
                        </button>
                    </Link>
                </div>
            </div>

            {/* Error alert */}
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Data table */}
            {!error && products.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{product.prod_name}</div>
                                            <div className="text-xs text-gray-500">SKU: {product.prod_id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-blue-600">{product.category?.sub_cat_name || 'Uncategorized'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">{product.brand?.brand_name || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVariantCount(product) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {getVariantCount(product)} Variant{getVariantCount(product) !== 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        
                                        {/* Status Toggle Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button 
                                                onClick={() => handleToggleStatus(product.id, product.is_disabled || false)}
                                                disabled={isToggling !== null}
                                                className="transition-colors disabled:opacity-50"
                                            >
                                                {isToggling === product.id ? (
                                                    <FaSpinner className='animate-spin w-5 h-5 text-gray-500' />
                                                ) : product.is_disabled ? (
                                                    <FaTimesCircle className='w-5 h-5 text-red-500' title="Click to Enable" />
                                                ) : (
                                                    <FaCheckCircle className='w-5 h-5 text-green-500' title="Click to Disable" />
                                                )}
                                            </button>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Link href={`/mushrif-admin/products/edit?id=${product.id}`}>
                                                <button className="p-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
                                                    <FaEdit />
                                                </button>
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(product.id, product.prod_name)}
                                                className="p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
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
                </div>
            ) : (
                /* Empty state */
                !loading && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                            <FaBox className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No Products Found</h3>
                        <p className="mt-2 text-gray-500 max-w-sm mx-auto">Time to build your catalog!</p>
                        <div className="mt-6">
                            <Link href="/mushrif-admin/products/edit" passHref>
                                <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-sm">
                                    <FaPlus className="mr-2" /> Create First Product
                                </button>
                            </Link>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default ProductListPage;