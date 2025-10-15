// src/components/admin/product/ProductImageManager.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaUpload, FaTrash, FaStar, FaEdit, FaTimes, FaSpinner } from 'react-icons/fa';
import { ProductImage } from '@/types/product';
import { useProductService } from '@/services/admin/productService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ImageManagerProps {
    parentId: string; // Product ID or Variant ID
    images: ProductImage[];
    isVariantManager: boolean; 
    onImagesChange: (updatedImages: ProductImage[]) => void;
    onPrimarySet: (imageId: string) => void; 
    onActionSuccess: () => void;
}

const ProductImageManager: React.FC<ImageManagerProps> = ({ 
    parentId, 
    images, 
    isVariantManager, 
    onImagesChange,
    onPrimarySet,
    onActionSuccess
}) => {
    const { uploadImages, updateImage, deleteImage, getStorageUrl } = useProductService();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    
    const [replacingImageId, setReplacingImageId] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync images from props (important for refresh after API changes)
    useEffect(() => {
        // Only update if the parent is providing images and they're different
        if (images && images !== undefined) {
            onImagesChange(images);
        }
    }, [images, onImagesChange]);

    // Upload Handlers
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        setError(null);

        try {
            // Call API to upload images
            const newImages = await uploadImages(parentId, files, isVariantManager);
            
            // Update local state directly - no need for full refresh
            onImagesChange([...images, ...newImages]);
            
            // Clear file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            setError(err.message || "Failed to upload images");
        } finally {
            setIsUploading(false);
        }
    };
    
    // Deletion Handler
    const handleDeleteImage = async (image: ProductImage) => {
        if (!window.confirm(`Delete image ${image.id}? This cannot be undone.`)) return;
        
        setActionInProgress(image.id);
        setError(null);
        
        try {
            // Call API to delete image
            await deleteImage(image.id);
            
            // Update local state directly - no need for full refresh
            onImagesChange(images.filter(img => img.id !== image.id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete image.');
        } finally {
            setActionInProgress(null);
        }
    };
    
    // Set Primary Handler
    const handleSetPrimary = async (image: ProductImage) => {
        if (image.is_primary) return;
        
        setActionInProgress(image.id);
        setError(null);
        
        const formData = new FormData();
        // Change from string 'true' to number 1
        formData.append('is_primary', '1');  // Or use boolean 1 to represent true
        formData.append('_method', 'PUT');
        
        try {
            // Call API to set primary image
            const updatedImage = await updateImage(image.id, formData);
            
            // Update local state
            const updatedImages = images.map(img => ({
                ...img,
                is_primary: img.id === image.id 
            }));
            
            onImagesChange(updatedImages);
            onPrimarySet(image.id);
        } catch (err: any) {
            setError(err.message || 'Failed to set primary image.');
        } finally {
            setActionInProgress(null);
        }
    };
    
    // Replace File Handler (Called from the Modal)
    const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true); 
        setError(null);
        
        const formData = new FormData();
        formData.append('image_file', file);
        formData.append('_method', 'PUT');
        
        try {
            // Call API to replace image
            const updatedImage = await updateImage(imageId, formData); 
            
            // Update local state
            const newImages = images.map(img => 
                img.id === imageId ? updatedImage : img
            );
            
            onImagesChange(newImages);
            setReplacingImageId(null);
        } catch (err: any) {
            setError(err.message || 'Failed to replace image file.');
        } finally {
            setIsUploading(false);
            setReplacingImageId(null);
        }
    };

    const imageToReplace = images.find(img => img.id === replacingImageId);

    return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
            <h4 className="text-sm font-bold text-slate-800">
                {isVariantManager ? 'Variant Images' : 'Product Images (No Variants)'} ({images.length})
            </h4>
            
            {error && <p className="p-2 text-xs text-red-700 bg-red-100 rounded">{error}</p>}

            {/* Image Grid */}
            <div className="flex flex-wrap gap-4">
                {images.map((img) => (
                    <div key={img.id} className="relative w-28 h-28 border rounded overflow-hidden shadow-md group">
                        {/* Display the image */}
                        <img 
                            src={getStorageUrl(img.image_url) || ''}
                            alt={`Product image ${img.id}`} 
                            className="w-full h-full object-cover transition-opacity"
                        />
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                            <button 
                                onClick={() => handleSetPrimary(img)}
                                className={`p-1.5 rounded-full transition-colors ${img.is_primary ? 'bg-yellow-500 text-black' : 'bg-white/90 text-gray-800 hover:bg-yellow-400'}`}
                                title={img.is_primary ? 'Primary Image' : 'Set as Primary'}
                                disabled={img.is_primary || actionInProgress === img.id}
                            >
                                {actionInProgress === img.id ? <FaSpinner className="animate-spin" size={12} /> : <FaStar size={12} />}
                            </button>
                            <button 
                                onClick={() => setReplacingImageId(img.id)}
                                className="p-1.5 rounded-full bg-white/90 text-gray-800 hover:bg-blue-400 hover:text-white transition-colors"
                                title="Replace Image File"
                                disabled={actionInProgress === img.id}
                            >
                                {actionInProgress === img.id ? <FaSpinner className="animate-spin" size={12} /> : <FaEdit size={12} />}
                            </button>
                            <button 
                                onClick={() => handleDeleteImage(img)}
                                className="p-1.5 rounded-full bg-white/90 text-gray-800 hover:bg-red-500 hover:text-white transition-colors"
                                title="Delete Image"
                                disabled={actionInProgress === img.id}
                            >
                                {actionInProgress === img.id ? <FaSpinner className="animate-spin" size={12} /> : <FaTrash size={12} />}
                            </button>
                        </div>
                        
                        {/* Primary Badge */}
                        {img.is_primary && (
                            <span className="absolute top-1 left-1 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">Primary</span>
                        )}
                    </div>
                ))}

                {/* Upload Button */}
                <div className="w-28 h-28 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400 transition-colors cursor-pointer">
                    <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        disabled={isUploading}
                        className="sr-only"
                        accept="image/*"
                        id={`multi-upload-${parentId}`}
                    />
                    <label htmlFor={`multi-upload-${parentId}`} className="flex flex-col items-center justify-center h-full w-full text-gray-500 hover:text-blue-500">
                        {isUploading ? (
                            <FaSpinner className="animate-spin" size={20} />
                        ) : (
                            <FaUpload size={20} />
                        )}
                        <span className="text-xs mt-1">
                            {isUploading ? 'Uploading...' : 'Add Image(s)'}
                        </span>
                    </label>
                </div>
            </div>
            
            {/* Single Image Replace Modal/Form */}
            {replacingImageId && imageToReplace && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96 space-y-4">
                        <div className="flex justify-between items-center">
                            <h5 className="font-bold">Replace Image File</h5>
                            <button onClick={() => setReplacingImageId(null)}><FaTimes /></button>
                        </div>
                        <p className="text-sm text-gray-600">Replacing file for: {imageToReplace.image_url.substring(imageToReplace.image_url.lastIndexOf('/') + 1)}</p>
                        
                        <div className="flex justify-center mb-4">
                            <img 
                                src={getStorageUrl(imageToReplace.image_url) || ''} 
                                alt="Current image" 
                                className="w-40 h-40 object-cover border rounded-lg"
                            />
                        </div>
                        
                        <input
                            type="file"
                            onChange={(e) => handleReplaceFile(e, imageToReplace.id)}
                            disabled={isUploading} 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        
                        <div className="flex justify-end space-x-2 mt-4">
                            <button 
                                onClick={() => setReplacingImageId(null)}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            {isUploading && (
                                <button 
                                    disabled
                                    className="px-3 py-1.5 bg-blue-400 text-white rounded flex items-center"
                                >
                                    <FaSpinner className="animate-spin mr-2" /> Uploading...
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductImageManager;