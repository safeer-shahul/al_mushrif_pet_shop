// src/components/ui/ImageUploadField.tsx

import React, { useRef, useState, useEffect } from 'react';
import { FaUpload, FaTimes } from 'react-icons/fa';

interface ImageUploadFieldProps {
    name: string;
    label: string;
    existingImageUrl?: string | null;
    onChange: (file: File | null) => void;
    disabled: boolean;
    // New prop to track if the existing image was explicitly removed
    onRemoveExisting: (removed: boolean) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ 
    name, 
    label, 
    existingImageUrl, 
    onChange, 
    disabled,
    onRemoveExisting
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [currentImageExists, setCurrentImageExists] = useState(!!existingImageUrl);

    // Effect to set initial state/preview
    useEffect(() => {
        if (existingImageUrl && !filePreview) {
            setFilePreview(existingImageUrl);
            setCurrentImageExists(true);
        } else if (!existingImageUrl && !fileInputRef.current?.files?.[0]) {
            setFilePreview(null);
            setCurrentImageExists(false);
        }
    }, [existingImageUrl, filePreview]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        onChange(file);
        
        // Create local preview URL
        if (file) {
            setFilePreview(URL.createObjectURL(file));
            onRemoveExisting(false); // New file means existing wasn't explicitly removed
        } else {
            setFilePreview(existingImageUrl || null);
        }
    };

    const handleRemoveFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear file input
        }
        onChange(null);
        setFilePreview(null);

        // If an existing image was present, signal that it was removed
        if (currentImageExists) {
            onRemoveExisting(true);
            setCurrentImageExists(false);
        }
    };

    return (
        <div className="block">
            <span className="text-gray-700 font-medium">{label}</span>
            
            {/* Image Preview */}
            {(filePreview || existingImageUrl) && (
                <div className="mt-2 mb-4 w-32 h-32 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                    <img 
                        src={filePreview || existingImageUrl || ''} 
                        alt="Category Image Preview" 
                        className="object-cover w-full h-full"
                    />
                </div>
            )}
            
            <div className="mt-1 flex items-center space-x-4">
                <input
                    type="file"
                    name={name}
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled}
                />
                
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition ${
                        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                >
                    <FaUpload className="mr-2 h-4 w-4" />
                    {fileInputRef.current?.files?.[0] ? fileInputRef.current.files[0].name : 'Choose Image'}
                </button>
                
                {((filePreview || currentImageExists) && !disabled) && (
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 text-red-600 hover:text-red-800 transition"
                        title="Remove current image"
                    >
                        <FaTimes className="h-5 w-5" />
                    </button>
                )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Max 2MB. Only .jpg, .png, .gif, .svg allowed.</p>
        </div>
    );
};

export default ImageUploadField;