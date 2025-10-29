'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaMapMarkerAlt, FaEdit, FaTrash, FaPlus, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaPhone } from 'react-icons/fa';
import { Address } from '@/types/user';
import { useAddressService } from '@/services/public/addressService';
import LoadingSpinner from '../ui/LoadingSpinner';
import AddressForm from './AddressForm';
import { toast } from 'react-hot-toast';

interface AddressSelectionStepProps {
    selectedAddress: Address | null;
    setSelectedAddress: (address: Address | null) => void;
    onContinue: () => void;
}

const AddressSelectionStep: React.FC<AddressSelectionStepProps> = ({
    selectedAddress,
    setSelectedAddress,
    onContinue,
}) => {
    const { fetchUserAddresses, deleteAddress } = useAddressService();
    
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); 
    const [error, setError] = useState<string | null>(null);

    // State for managing the Address Form
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const loadAddresses = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await fetchUserAddresses();
            setAddresses(data || []);
            
            // Auto-select logic
            if (data.length > 0) {
                 const newDefault = data.find(a => a.is_default) || data[0];
                 // If no address is currently selected OR the selected address was deleted/updated
                 if (!selectedAddress || !data.some(a => a.id === selectedAddress.id)) {
                    setSelectedAddress(newDefault); 
                 }
            } else {
                 setSelectedAddress(null);
            }

        } catch (err: any) {
             setError('Failed to load your addresses. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [fetchUserAddresses, selectedAddress, setSelectedAddress]);

    useEffect(() => {
        // Only load addresses if we are not currently in the saving state
        if (!isSaving) {
            loadAddresses();
        }
    }, [loadAddresses, isSaving]);

    // --- Form Management Handlers ---
    const handleAddAddress = () => {
        setEditingAddress(null);
        setShowAddressForm(true);
    };

    const handleEditAddress = (address: Address) => {
        setEditingAddress(address);
        setShowAddressForm(true);
    };
    
    const handleFormCancel = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
    }
    
    const handleSaveSuccess = (savedAddress: Address) => {
        setShowAddressForm(false);
        setEditingAddress(null);
        setIsSaving(false);
        
        // Refresh the list and select the new/updated address
        loadAddresses().then(() => {
             setSelectedAddress(savedAddress);
        });
    }

    // --- Delete Handler ---
    const handleDelete = async (id: string, addressLine: string) => {
        if (isSaving || !window.confirm(`Are you sure you want to delete the address: ${addressLine}?`)) return;
        
        setIsSaving(true);
        try {
            await deleteAddress(id);
            toast.success("Address deleted.");
            
            // After successful deletion, reload addresses. loadAddresses handles re-selecting a default.
            await loadAddresses();

        } catch (err: any) {
            toast.error(err.message || "Failed to delete address.");
        } finally {
            setIsSaving(false);
        }
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    // --- Address Form Modal Overlay ---
    if (showAddressForm) {
        return (
            <AddressForm
                initialData={editingAddress}
                onSaveSuccess={handleSaveSuccess}
                onCancel={handleFormCancel}
                isSaving={isSaving}
                setIsSaving={setIsSaving}
            />
        );
    }

    // --- Main Address Selection View ---
    return (
        <div className="space-y-6">
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center'>
                <h4 className="text-lg md:text-xl font-bold text-slate-800">Select Shipping Address</h4>
                <button
                    onClick={handleAddAddress}
                    className="px-4 py-2 text-sm text-white rounded-lg flex items-center bg-[var(--color-primary,#FF6B35)] hover:bg-[var(--color-primary,#FF6B35)]/90 transition-colors font-semibold"
                    disabled={isSaving}
                >
                    <FaPlus className='mr-1 w-3 h-3' /> Add New
                </button>
            </div>
            
            {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-center"><FaExclamationTriangle className='mr-2' /> {error}</div>}
            
            {/* Address List */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {addresses.length === 0 ? (
                    <div className='p-6 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50'>
                        <FaExclamationTriangle className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                        <p className='text-gray-700 font-medium'>No saved addresses found</p>
                        <p className='text-gray-600 text-sm mt-1'>Please add a delivery address to continue.</p>
                    </div>
                ) : (
                    addresses.map(address => (
                        <div 
                            key={address.id}
                            onClick={() => { if (!isSaving) setSelectedAddress(address); }}
                            className={`p-4 border rounded-xl cursor-pointer transition-all relative ${
                                selectedAddress?.id === address.id 
                                    ? 'border border-[var(--color-primary,#FF6B35)] bg-white shadow-md' 
                                    : 'border-gray-300 hover:border-gray-400'
                            } ${isSaving ? 'opacity-70' : ''}`}
                        >
                            {/* Checkmark Icon */}
                            {selectedAddress?.id === address.id && (
                                <FaCheckCircle 
                                    className='absolute top-2 right-2 w-5 h-5 text-white bg-[var(--color-primary,#FF6B35)] rounded-full p-0.5 shadow-lg' 
                                    title="Selected Address"
                                />
                            )}

                            <div className='flex justify-between items-start pr-8'>
                                <div>
                                    <p className="font-bold text-base text-slate-800">
                                        {address.address_line1} 
                                        {address.is_default && <span className='ml-2 text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full'>DEFAULT</span>}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{address.address_line2 ? `${address.address_line2}, ` : ''}{address.street}, {address.zip_pin}</p>
                                    <p className="text-sm text-gray-500 flex items-center mt-2">
                                        <FaPhone className='mr-2 w-3 h-3' /> {address.phone_numbers?.[0]}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Actions on the bottom right */}
                             <div className='absolute bottom-2 right-4 flex space-x-3'>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }}
                                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                                    title="Edit Address"
                                    disabled={isSaving}
                                >
                                    <FaEdit className='w-4 h-4' />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(address.id, address.address_line1); }}
                                    className="p-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                    title="Delete Address"
                                    disabled={isSaving}
                                >
                                    {isSaving ? <FaSpinner className='animate-spin w-4 h-4' /> : <FaTrash className='w-4 h-4' />}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* 2. Payment Method (COD only) */}
            <div className="border-t border-gray-200 space-y-2">
                <h4 className="text-xl font-bold text-slate-800">Payment Method</h4>
                <div className="p-4 border border-green-600 rounded-xl bg-green-50 flex flex-col md:flex-row justify-between items-center shadow-sm">
                    <span className="font-semibold text-green-700 flex items-center">
                        <FaCheckCircle className="mr-2 text-green-600 w-4 h-4" /> Cash On Delivery (COD)
                    </span>
                    <span className="text-sm text-gray-500">AED 0.00 Processing Fee</span>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button 
                    onClick={onContinue}
                    disabled={!selectedAddress || addresses.length === 0 || isSaving}
                    className="px-8 py-3 bg-[var(--color-primary,#FF6B35)] w-full text-white font-medium text-lg rounded-lg hover:bg-[var(--color-primary,#FF6B35)]/90 disabled:bg-gray-400 transition-colors shadow-lg disabled:shadow-none"
                >
                    Continue to Summary
                </button>
            </div>
        </div>
    );
};

export default AddressSelectionStep;