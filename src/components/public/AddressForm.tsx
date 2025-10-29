'use client';

import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import { Address } from '@/types/user';
import { useAddressService } from '@/services/public/addressService';
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
        // Initialize or reset form data when initialData changes
        setFormData(initialData || { phone_numbers: [] });
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Cleanly parse comma-separated numbers
        const value = e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        setFormData(prev => ({ ...prev, phone_numbers: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        
        // Basic validation
        if (!formData.address_line1 || !formData.zip_pin || (formData.phone_numbers?.length === 0)) {
            setLocalError("Please fill in Address Line 1, Zip Code, and at least one Phone Number.");
            return;
        }
        
        setIsSaving(true);
        
        try {
            let savedAddress: Address;
            const payload = { ...formData, is_default: formData.is_default || false }; // Ensure is_default is sent

            if (isEditMode && formData.id) {
                // Update existing address
                savedAddress = await updateAddress(formData.id, payload);
                toast.success('Address updated successfully!');
            } else {
                // Create new address
                savedAddress = await createAddress(payload as Omit<Address, 'id' | 'user_id'>);
                toast.success('New address added!');
            }
            onSaveSuccess(savedAddress);

        } catch (error: any) {
            setLocalError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} address.`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const isDisabled = isSaving;

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-lg md:text-2xl font-bold text-slate-800 pb-3 mb-2 flex items-center">
                <FaMapMarkerAlt className='mr-2 text-[var(--color-primary,#FF6B35)]' /> {isEditMode ? 'Edit Shipping Address' : 'Add New Address'}
            </h3>
            
            {localError && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-center"><FaTimes className='mr-2' /> {localError}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={isDisabled}
                    />
                </div>
                
                {/* Street / Area */}
                <div className="space-y-1">
                    <label htmlFor="street" className="block text-sm font-medium text-slate-700">Street / Area</label>
                    <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street || ''}
                        onChange={handleChange}
                        placeholder="Street Name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={isDisabled}
                    />
                </div>
                
                {/* Zip / Pin Code */}
                <div className="space-y-1">
                    <label htmlFor="zip_pin" className="block text-sm font-medium text-slate-700">Zip / Pin Code <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="zip_pin"
                        name="zip_pin"
                        value={formData.zip_pin || ''}
                        onChange={handleChange}
                        placeholder="e.g., 12345"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                        disabled={isDisabled}
                    />
                </div>
            </div>

            {/* Phone Numbers */}
            <div className="space-y-1 pt-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={isDisabled}
                />
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center pt-2">
                <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={!!formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="h-4 w-4 text-[var(--color-primary,#FF6B35)] border-gray-300 rounded focus:ring-[var(--color-primary,#FF6B35)]"
                    disabled={isDisabled}
                />
                <label htmlFor="is_default" className="ml-2 block text-sm font-medium text-slate-700">
                    Set as Default Shipping Address
                </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-8 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg flex items-center hover:bg-gray-100 transition-colors font-medium"
                    disabled={isDisabled}
                >
                    <FaTimes className='mr-2' /> Cancel
                </button>
                <button
                    type="submit"
                    className={`px-6 py-2 text-white font-medium rounded-lg flex items-center transition-colors shadow-md ${
                        isDisabled 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-[var(--color-primary,#FF6B35)] hover:bg-[var(--color-primary,#FF6B35)]/90'
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