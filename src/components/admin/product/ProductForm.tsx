// src/components/admin/product/ProductForm.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaInfoCircle, FaDollarSign, FaTags, FaBox, FaFolderOpen } from 'react-icons/fa';
import dynamic from 'next/dynamic';

import { Product, ProductFilters, ProductImage } from '@/types/product';
import { Brand } from '@/types/brand';
import { RootCategory, SubCategory } from '@/types/category';
import { FilterType } from '@/types/filter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductImageManager from './ProductImageManager';

// ----------------------------------------------------------------------
// 📝 TEXTAREA IMPLEMENTATION (Temporary Replacement for WYSIWYG)
// ----------------------------------------------------------------------

interface DescriptionInputProps {
    value: string | null;
    onChange: (html: string) => void;
    placeholder?: string;
    disabled: boolean;
}

/**
 * Temporary component to replace the rich text editor with a standard textarea.
 */
const SimpleTextarea: React.FC<DescriptionInputProps> = ({ value, onChange, placeholder, disabled }) => {
    
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
    }

    return (
        <textarea
            id="description"
            name="description"
            value={value || ''}
            onChange={handleTextareaChange}
            placeholder={placeholder}
            rows={10}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            disabled={disabled}
        />
    );
};
// ----------------------------------------------------------------------
// END TEXTAREA COMPONENT
// ----------------------------------------------------------------------


interface ProductFormProps {
    initialData?: Partial<Product>;
    isEditMode: boolean;
    onSave: (data: Partial<Product>, id?: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    allBrands: Brand[];
    allSubCategories: SubCategory[]; 
    allFilterTypes: FilterType[];
    allRootCategories: RootCategory[];
    dependenciesLoading: boolean;
    dependenciesError: string | null;
    onFullDataRefresh: () => void;
}

// ----------------------------------------------------------------------
// Helper to flatten nested categories and generate full path for display
// ----------------------------------------------------------------------
interface FlatCategory {
    id: string;
    name: string;
    path: string;
    depth: number;
}

interface GroupedCategoriesType {
    [key: string]: FlatCategory[];
}

const flattenCategories = (rootCats: RootCategory[]): FlatCategory[] => {
    const flatList: FlatCategory[] = [];

    const getChildren = (category: any): any[] => {
        if (category.sub_categories && Array.isArray(category.sub_categories)) {
            return category.sub_categories;
        }
        if (category.subCategories && Array.isArray(category.subCategories)) {
            return category.subCategories;
        }
        if (category.children && Array.isArray(category.children)) {
            return category.children;
        }
        return [];
    };

    const traverse = (category: any, path: string[], depth: number) => {
        const categoryId = category.id || (category.cat_id || category.sub_cat_id); 
        const categoryName = category.cat_name || category.sub_cat_name || "Unknown";
        const currentPath = [...path, categoryName];
        const isRoot = Boolean(category.cat_name);
        const children = getChildren(category);
        const isLeaf = children.length === 0;

        if (isLeaf && !isRoot && categoryId) {
            flatList.push({
                id: categoryId,
                name: categoryName,
                path: currentPath.join(' > '),
                depth: depth
            });
        }

        children.forEach(child => {
            traverse(child, currentPath, depth + 1);
        });
    };

    rootCats.forEach(root => {
        traverse(root, [], 0);
    });
    return flatList.sort((a, b) => a.path.localeCompare(b.path));
};


const ProductForm: React.FC<ProductFormProps> = ({
    initialData,
    isEditMode,
    onSave,
    isLoading,
    error,
    allBrands,
    allFilterTypes,
    allRootCategories,
    dependenciesLoading,
    dependenciesError,
    onFullDataRefresh
}) => {
    const router = useRouter();

    const [formData, setFormData] = useState<Partial<Product>>(initialData || {
        can_return: true,
        can_replace: true,
        product_filters: {},
        description: null,
        base_price: null,
        base_offer_price: null,
        base_quantity: null,
        has_variants: false,
    });
    const [localLoading, setLocalLoading] = useState(false);
    const [baseImages, setBaseImages] = useState<ProductImage[]>(initialData?.images || []);
    
    const flatSubCategories = useMemo(() => {
        return flattenCategories(allRootCategories);
    }, [allRootCategories]);
    
    const groupedCategories = useMemo<GroupedCategoriesType>(() => {
        const groups: GroupedCategoriesType = {};
        flatSubCategories.forEach(cat => {
            const parts = cat.path.split(' > ');
            const topParent = parts[0];
            if (!groups[topParent]) {
                groups[topParent] = [];
            }
            groups[topParent].push(cat);
        });
        return groups;
    }, [flatSubCategories]);


    const hasVariants = formData.has_variants || false;
    const isDisabled = isLoading || localLoading || dependenciesLoading;

    useEffect(() => {
        const updatedFormData = {
            ...initialData,
            product_filters: initialData?.product_filters || {},
            can_return: initialData?.can_return ?? true,
            can_replace: initialData?.can_replace ?? true,
            description: initialData?.description ?? null,
            base_price: initialData?.base_price ?? null,
            base_offer_price: initialData?.base_offer_price ?? null,
            base_quantity: initialData?.base_quantity ?? null,
            has_variants: initialData?.has_variants ?? (isEditMode && (initialData?.variants?.length ?? 0) > 0)
        };
        setFormData(updatedFormData);
        setBaseImages(initialData?.images || []);
    }, [initialData, isEditMode]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name.includes('price') || name.includes('quantity')) {
            const numValue = value === '' ? null : Number(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // Callback function is now simplified for plain text input
    const handleDescriptionChange = useCallback((text: string) => {
        setFormData(prev => ({ ...prev, description: text }));
    }, []);

    const handleFilterChange = useCallback((filterTypeId: string, itemId: string, isChecked: boolean) => {
        setFormData(prev => {
            const currentFilters: ProductFilters = prev.product_filters || {};
            let itemIds = currentFilters[filterTypeId] || [];

            if (isChecked) {
                if (!itemIds.includes(itemId)) {
                    itemIds = [...itemIds, itemId];
                }
            } else {
                itemIds = itemIds.filter(id => id !== itemId);
            }

            const newFilters = { ...currentFilters, [filterTypeId]: itemIds.filter(Boolean) };
            
            if (newFilters[filterTypeId].length === 0) {
                delete newFilters[filterTypeId];
            }
            return { ...prev, product_filters: newFilters };
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        try {
            const dataToSave = {
                ...formData,
                product_filters: JSON.stringify(formData.product_filters),
            };

            await onSave(dataToSave as unknown as Partial<Product>, formData.id);
            onFullDataRefresh(); 
        } catch (e) {
            console.error('Product save error:', e);
        } finally {
            setLocalLoading(false);
        }
    };

    if (dependenciesLoading) {
        return <LoadingSpinner />;
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Form Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-slate-800">
                    {isEditMode ? `Edit Product: ${formData.prod_name || ''}` : 'Create New Product'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Define the core product attributes, category, brand, and filtering options.
                </p>
            </div>

            {/* Error Display */}
            {(error || dependenciesError) && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <p className="text-sm text-red-700 font-medium">{error || dependenciesError}</p>
                </div>
            )}

            {/* Form Content */}
            <div className="p-6 space-y-8">
                {/* Product Name and ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="prod_name" className="block text-sm font-medium text-slate-700">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="prod_name"
                            type="text"
                            name="prod_name"
                            value={formData.prod_name || ''}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Cat Scratch Post - Deluxe Edition"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                            disabled={isDisabled}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="prod_id" className="block text-sm font-medium text-slate-700">
                            Product ID (SKU) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="prod_id"
                            type="text"
                            name="prod_id"
                            value={formData.prod_id || ''}
                            onChange={handleChange}
                            required
                            placeholder="e.g., CAT-SCRT-001"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                            disabled={isDisabled}
                        />
                    </div>
                </div>

                {/* Categories and Brands */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="sub_cat_id" className="block text-sm font-medium text-slate-700">
                            Category (Leaf Node) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="sub_cat_id"
                                name="sub_cat_id"
                                value={formData.sub_cat_id || ''}
                                onChange={handleChange}
                                className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                                disabled={isDisabled}
                                required
                            >
                                <option value="">-- Select Final Sub Category --</option>
                                {Object.keys(groupedCategories).length === 0 ? (
                                    <option disabled value="">No categories found. Please check your data.</option>
                                ) : (
                                    Object.entries(groupedCategories).map(([parentName, categories]) => (
                                        <optgroup key={parentName} label={parentName}>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.path}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))
                                )}
                            </select>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <FaFolderOpen className='mr-1' />
                                Select the lowest level category. Each option shows the full category path.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="brand_id" className="block text-sm font-medium text-slate-700">
                            Brand <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="brand_id"
                            name="brand_id"
                            value={formData.brand_id || ''}
                            onChange={handleChange}
                            required
                            className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                            disabled={isDisabled}
                        >
                            <option value="">-- Select Brand --</option>
                            {allBrands.filter(b => b.is_active).map((brand) => (
                                <option key={brand.brand_id} value={brand.brand_id}>
                                    {brand.brand_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Product Description Section with Simple Textarea */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 flex items-center">
                            Product Description (Plain Text)
                            <FaInfoCircle className="ml-2 w-4 h-4 text-gray-400" title="Enter a detailed description." />
                        </label>
                        <SimpleTextarea // <-- Using the simple textarea component
                            value={formData.description || ''}
                            onChange={handleDescriptionChange}
                            placeholder="Enter a detailed product description..."
                            disabled={isDisabled}
                        />
                    </div>
                </div>
                
                {/* Variant Mode Toggle */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3">
                        <input
                            id="has_variants"
                            name="has_variants"
                            type="checkbox"
                            checked={hasVariants}
                            onChange={handleChange}
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={isDisabled || (isEditMode && (initialData?.variants?.length ?? 0) > 0)} 
                        />
                        <label htmlFor="has_variants" className="block text-md font-medium text-slate-700 flex items-center">
                            <FaTags className="mr-2 text-blue-500" />
                            **This product will have variants**
                            {isEditMode && (initialData?.variants?.length ?? 0) > 0 && (
                                <span className="ml-2 text-sm text-orange-600 font-normal">
                                    (Can't change: variants already exist)
                                </span>
                            )}
                        </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 ml-8">
                        {hasVariants
                            ? "Product variants allow different prices, colors, and images. Save the product first to add variants."
                            : "Single product without variants. You can add base price and inventory below."}
                    </p>
                </div>

                {/* Base Pricing, Quantity, and Images Section (Only for non-variant products) */}
                {!hasVariants && (
                    <div className="pt-4 border-t border-gray-100 space-y-6">
                        <h3 className="text-md font-semibold text-slate-800 flex items-center">
                            <FaBox className="mr-2 text-blue-500" />
                            Base Product Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="base_price" className="block text-sm font-medium text-slate-700">
                                    Base Price (AED) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="base_price"
                                        type="number"
                                        step="0.01"
                                        name="base_price"
                                        value={formData.base_price ?? ''}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        required={!hasVariants}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pl-10"
                                        disabled={isDisabled}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="base_offer_price" className="block text-sm font-medium text-slate-700">
                                    Base Offer Price (Optional)
                                </label>
                                <div className="relative">
                                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="base_offer_price"
                                        type="number"
                                        step="0.01"
                                        name="base_offer_price"
                                        value={formData.base_offer_price ?? ''}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pl-10"
                                        disabled={isDisabled}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="base_quantity" className="block text-sm font-medium text-slate-700">
                                    Stock Quantity <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="base_quantity"
                                        type="number"
                                        step="1"
                                        name="base_quantity"
                                        value={formData.base_quantity ?? ''}
                                        onChange={handleChange}
                                        placeholder="0"
                                        required={!hasVariants}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                                        disabled={isDisabled}
                                    />
                                </div>
                            </div>
                        </div>

                        {isEditMode && formData.id ? (
                            <ProductImageManager
                                parentId={formData.id}
                                images={baseImages}
                                isVariantManager={false}
                                onImagesChange={setBaseImages}
                                onPrimarySet={(imageId) => {
                                    const updatedImages = baseImages.map(img => ({
                                        ...img,
                                        is_primary: img.id === imageId
                                    }));
                                    setBaseImages(updatedImages);
                                }}
                                onActionSuccess={onFullDataRefresh}
                            />
                        ) : (
                             <p className="text-sm text-gray-500 italic">
                                 Save the product first to enable image upload.
                             </p>
                        )}
                    </div>
                )}


                {/* Filter Selector Section */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-md font-semibold text-slate-800 mb-3 flex items-center">
                        **Product Filters**
                        <FaInfoCircle className="ml-2 w-4 h-4 text-gray-400" title="Select filter items that apply to this product." />
                    </h3>

                    {allFilterTypes.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No filter types configured yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allFilterTypes.map(type => (
                                <div key={type.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                    <h4 className="font-medium text-sm text-slate-700 border-b pb-2 mb-2">{type.filter_type_name}</h4>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {type.items && type.items.length > 0 ? (
                                            type.items.map(item => {
                                                const isSelected = formData.product_filters?.[type.id]?.includes(item.id) || false;
                                                return (
                                                    <div key={item.id} className="flex items-center">
                                                        <input
                                                            id={`filter-${item.id}`}
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleFilterChange(type.id, item.id, e.target.checked)}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            disabled={isDisabled}
                                                        />
                                                        <label htmlFor={`filter-${item.id}`} className="ml-2 text-sm text-gray-700">
                                                            {item.filter_name}
                                                        </label>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-gray-400">No items available.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Form Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => router.push('/mushrif-admin/products')}
                    disabled={isDisabled}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isDisabled}
                    className={`
                        px-4 py-2 rounded-lg text-white font-medium flex items-center
                        ${isDisabled
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-sm'}
                    `}
                >
                    <FaSave className="w-4 h-4 mr-2" />
                    {isEditMode
                        ? (localLoading ? 'Updating...' : 'Update Product')
                        : (localLoading ? 'Creating...' : 'Create Product')
                    }
                </button>
            </div>
        </form>
    );
};

export default ProductForm;