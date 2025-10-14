// src/components/admin/product/ProductImageManager.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FaUpload, FaTrash, FaStar, FaEdit, FaTimes } from 'react-icons/fa';
import { ProductImage } from '@/types/product';
import { useProductService } from '@/services/admin/productService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ImageManagerProps {
    parentId: string; // Product ID or Variant ID
    images: ProductImage[];
    isVariantManager: boolean; 
    onImagesChange: (updatedImages: ProductImage[]) => void;
    onPrimarySet: (imageId: string) => void;
}

const ProductImageManager: React.FC<ImageManagerProps> = ({ 
    parentId, 
    images, 
    isVariantManager, 
    onImagesChange,
    onPrimarySet
}) => {
    const { uploadImages, updateImage, deleteImage, getStorageUrl } = useProductService();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [replacingImageId, setReplacingImageId] = useState<string | null>(null); 
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        setError(null);

        try {
            const newImages = await uploadImages(parentId, files, isVariantManager);
            onImagesChange([...images, ...newImages]); 
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleDeleteImage = async (image: ProductImage) => {
        if (!window.confirm(`Delete image ${image.id}?`)) return;
        
        try {
            await deleteImage(image.id);
            onImagesChange(images.filter(img => img.id !== image.id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete image.');
        }
    };
    
    const handleSetPrimary = async (image: ProductImage) => {
        if (image.is_primary) return;
        setError(null);
        
        const formData = new FormData();
        formData.append('is_primary', 'true');
        
        try {
            const updatedImage = await updateImage(image.id, formData);
            
            const newImages = images.map(img => ({
                ...img,
                is_primary: img.id === updatedImage.id,
            }));
            onImagesChange(newImages);
            onPrimarySet(updatedImage.id); 
            
        } catch (err: any) {
            setError(err.message || 'Failed to set primary image.');
        }
    };
    
    const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setReplacingImageId(imageId);
        setError(null);
        
        const formData = new FormData();
        formData.append('image_file', file);
        
        try {
            // FIX: Capture the response from updateImage
            const updatedImage = await updateImage(imageId, formData); 
            
            // Replace the image object in the array for local refresh
            const newImages = images.map(img => img.id === imageId ? updatedImage : img);
            onImagesChange(newImages); 
            
            setReplacingImageId(null); 
            
        } catch (err: any) {
            setError(err.message || 'Failed to replace image file.');
        } finally {
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
                                disabled={img.is_primary}
                            >
                                <FaStar size={12} />
                            </button>
                            <button 
                                onClick={() => setReplacingImageId(img.id)}
                                className="p-1.5 rounded-full bg-white/90 text-gray-800 hover:bg-blue-400 hover:text-white transition-colors"
                                title="Replace Image File"
                            >
                                <FaEdit size={12} />
                            </button>
                            <button 
                                onClick={() => handleDeleteImage(img)}
                                className="p-1.5 rounded-full bg-white/90 text-gray-800 hover:bg-red-500 hover:text-white transition-colors"
                                title="Delete Image"
                            >
                                <FaTrash size={12} />
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
                        <FaUpload size={20} />
                        <span className="text-xs mt-1">Add Image(s)</span>
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
                        
                        <input
                            type="file"
                            onChange={(e) => handleReplaceFile(e, imageToReplace.id)}
                            disabled={!imageToReplace || !imageToReplace.id} 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {/* Removed isUploading check here for simplicity, as replacement handler already manages visibility */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductImageManager;