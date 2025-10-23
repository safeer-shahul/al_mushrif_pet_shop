// src/components/public/AddressForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaUser, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import { Address } from '@/types/user';
import { useAddressService } from '@/services/public/addressService';
import LoadingSpinner from '../ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface AddressFormProps {
    initialData?: Address | null;
    onSaveSuccess: (address: Address) => void;
    onCancel: () => void;
    // Boolean to control saving state globally for the modal
    isSaving: boolean; 
    setIsSaving: (saving: boolean) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ 
    initialData, 
    onSaveSuccess, 
    onCancel, 
    isSaving,
    setIsSaving 
}) => {
    const { createAddress, updateAddress } = useAddressService();
    const isEditMode = !!initialData?.id;

    const [formData, setFormData] = useState<Partial<Address>>(initialData || { phone_numbers: [] });
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setFormData(initialData || { phone_numbers: [] });
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        setFormData(prev => ({ ...prev, phone_numbers: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        setIsSaving(true);
        
        if (!formData.address_line1 || !formData.zip_pin || (formData.phone_numbers?.length === 0)) {
            setLocalError("Please fill in Address Line 1, Zip Code, and at least one Phone Number.");
            setIsSaving(false);
            return;
        }
        
        try {
            let savedAddress: Address;

            if (isEditMode && formData.id) {
                // Update existing address
                savedAddress = await updateAddress(formData.id, formData);
                toast.success('Address updated successfully!');
            } else {
                // Create new address (Casting required for Omit type in service)
                savedAddress = await createAddress(formData as Omit<Address, 'id' | 'user_id'>);
                toast.success('New address added!');
            }
            onSaveSuccess(savedAddress);

        } catch (error: any) {
            setLocalError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} address.`);
            setIsSaving(false);
        }
    };
    
    const isDisabled = isSaving;

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-3">
                {isEditMode ? 'Edit Shipping Address' : 'Add New Address'}
            </h3>
            
            {localError && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg">{localError}</div>}
            
            {/* Address Line 1 */}
            <div className="space-y-1">
                <label htmlFor="address_line1" className="block text-sm font-medium text-slate-700">Address Line 1 <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1 || ''}
                    onChange={handleChange}
                    placeholder="Flat / Villa / Building Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={isDisabled}
                />
            </div>
            
            {/* Address Line 2 */}
            <div className="space-y-1">
                <label htmlFor="address_line2" className="block text-sm font-medium text-slate-700">Address Line 2 (Optional)</label>
                <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2 || ''}
                    onChange={handleChange}
                    placeholder="Floor / Apartment Number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    disabled={isDisabled}
                />
            </div>

            {/* Street / Zip Pin */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label htmlFor="street" className="block text-sm font-medium text-slate-700">Street / Area</label>
                    <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street || ''}
                        onChange={handleChange}
                        placeholder="Street Name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        disabled={isDisabled}
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="zip_pin" className="block text-sm font-medium text-slate-700">Zip / Pin Code <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="zip_pin"
                        name="zip_pin"
                        value={formData.zip_pin || ''}
                        onChange={handleChange}
                        placeholder="e.g., 12345"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                        disabled={isDisabled}
                    />
                </div>
            </div>

            {/* Phone Numbers */}
            <div className="space-y-1">
                <label htmlFor="phone_numbers" className="block text-sm font-medium text-slate-700 flex items-center">
                    <FaPhone className='mr-2 w-3 h-3' /> Phone Numbers (Comma separated) <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="phone_numbers"
                    name="phone_numbers"
                    value={formData.phone_numbers?.join(', ') || ''}
                    onChange={handlePhoneChange}
                    placeholder="050xxxxxxx, 055yyyyyyy"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={isDisabled}
                />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                    disabled={isDisabled}
                >
                    <FaTimes className='mr-2' /> Cancel
                </button>
                <button
                    type="submit"
                    className={`px-4 py-2 text-white font-medium rounded-lg flex items-center ${
                        isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={isDisabled}
                >
                    {isSaving ? <FaSpinner className='animate-spin mr-2' /> : <FaSave className='mr-2' />}
                    {isEditMode ? 'Update Address' : 'Add Address'}
                </button>
            </div>
        </form>
    );
};

export default AddressForm;