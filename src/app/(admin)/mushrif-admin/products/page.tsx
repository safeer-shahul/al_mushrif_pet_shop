'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaSync, FaBox, FaSearch, FaSpinner } from 'react-icons/fa';
import { Product } from '@/types/product';
import { useProductService } from '@/services/admin/productService';
import { toast } from 'react-hot-toast';

// --- Interface for Filter State ---
interface ProductFilters {
    searchTerm: string;
    statusFilter: 'all' | 'active' | 'deactive';
    lowStockFilter: boolean;
}

// --- Reusable Toggle Switch Component ---
const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: () => void;
    disabled: boolean;
    label: string;
}> = ({ checked, onChange, disabled, label }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input 
            type="checkbox" 
            value="" 
            className="sr-only peer" 
            checked={checked} 
            onChange={onChange} 
            disabled={disabled}
        />
        <div className={`w-11 h-6 ${checked ? 'bg-green-600' : 'bg-gray-200'} rounded-full peer 
            peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full 
            peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
            after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
            after:h-5 after:w-5 after:transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        </div>
        <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
    </label>
);
// ----------------------------------------

const ProductListPage: React.FC = () => {
    const { fetchAllProducts, deleteProduct, toggleProductStatus } = useProductService(); 
    
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const hasFetchedRef = useRef(false);

    // --- FILTER STATE: Individual controls ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactive'>('all');
    const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);
    
    // --- FILTER STATE: State used to trigger and hold active filters for the API call ---
    const [currentFilters, setCurrentFilters] = useState<ProductFilters>({
        searchTerm: '',
        statusFilter: 'all',
        lowStockFilter: false,
    });
    // -----------------------------------------------------------------------------------

    // Load function updated to use the properly typed currentFilters state
    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params: Record<string, string | boolean> = {};
            
            // FIX APPLIED: Accessing properties from the typed 'currentFilters' object
            if (currentFilters.searchTerm) {
                params.search = currentFilters.searchTerm;
            }
            if (currentFilters.statusFilter && currentFilters.statusFilter !== 'all') {
                params.status = currentFilters.statusFilter;
            }
            if (currentFilters.lowStockFilter) {
                params.low_stock = true;
            }
            
            const fetchedProducts = await fetchAllProducts(params); 
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
    }, [fetchAllProducts, currentFilters]); // loadProducts now depends on currentFilters

    // Effect to run loadProducts when filters change (via setCurrentFilters)
    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleApplyFilters = (e?: React.FormEvent) => {
        e?.preventDefault();
        // Update currentFilters using the values from the input states
        setCurrentFilters({ searchTerm, statusFilter, lowStockFilter });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setLowStockFilter(false);
        // Apply changes to reset list
        setCurrentFilters({ searchTerm: '', statusFilter: 'all', lowStockFilter: false });
    };

    // Handler: Toggle disabled status
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
            
            toast.success('Product deleted successfully.');
            
            hasFetchedRef.current = false;
            await loadProducts();
        } catch (err: any) {
            setError(err.message || 'Failed to delete product.');
            console.error('Delete error:', err);
        }
    };

    const getVariantCount = (product: Product) => product.variants?.length || 0;

    if (loading && products.length === 0 && !error) {
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
                    <h1 className="text-2xl font-bold text-slate-800">Product Catalog Management</h1>
                    <p className="text-gray-500 mt-1">Manage core products and their variants</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleApplyFilters()} 
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

            {/* --- FILTER/SEARCH BAR --- */}
            <form onSubmit={handleApplyFilters} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    
                    {/* Search Input */}
                    <div className="relative w-full lg:w-1/2">
                        <input
                            type="text"
                            placeholder="Search by Name, SKU, or UUID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                    
                    {/* Status Filter Dropdown */}
                    <div className="w-full lg:w-1/4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'deactive')}
                            disabled={loading}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active (Enabled)</option>
                            <option value="deactive">Deactive (Disabled)</option>
                        </select>
                    </div>

                    {/* Low Stock Checkbox */}
                    <div className="flex items-center w-full lg:w-1/4">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={lowStockFilter} 
                                onChange={(e) => setLowStockFilter(e.target.checked)} 
                                disabled={loading}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-yellow-300 peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-yellow-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900">Low Stock Only</span>
                        </label>
                    </div>

                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Apply Filters
                    </button>
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Clear Filters
                    </button>
                </div>
            </form>
            {/* ------------------------------- */}

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
                                {products.map((product) => {
                                    const isActive = !product.is_disabled;
                                    const isCurrentToggling = isToggling === product.id;
                                    
                                    return (
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
                                                {isCurrentToggling ? (
                                                    <FaSpinner className='animate-spin w-5 h-5 text-gray-500 mx-auto' />
                                                ) : (
                                                    <ToggleSwitch
                                                        checked={isActive}
                                                        // Note: We toggle the *disabled* status, so pass the current *is_disabled* state
                                                        onChange={() => handleToggleStatus(product.id, product.is_disabled || false)}
                                                        disabled={isToggling !== null}
                                                        label={isActive ? 'Active' : 'Disabled'}
                                                    />
                                                )}
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
                                    );
                                })}
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
                        <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                            {(currentFilters.searchTerm || currentFilters.statusFilter !== 'all' || currentFilters.lowStockFilter) 
                                ? 'No products match the current filters. Try clearing them.'
                                : 'Time to build your catalog!'
                            }
                        </p>
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