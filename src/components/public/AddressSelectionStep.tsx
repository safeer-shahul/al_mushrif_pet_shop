// src/components/public/AddressSelectionStep.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaMapMarkerAlt, FaEdit, FaTrash, FaPlus, FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
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
            
            // If we find the addresses, ensure a selection is made IF we haven't selected one yet.
            if (data.length > 0 && !selectedAddress) {
                const defaultAddress = data.find(a => a.is_default) || data[0];
                // We use the setter here, forcing one re-run but ensuring initialization.
                setSelectedAddress(defaultAddress); 
            }
        } catch (err: any) {
            // ...
        } finally {
            setLoading(false);
        }
    }, [fetchUserAddresses, selectedAddress, setSelectedAddress]);

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);

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
        if (!window.confirm(`Are you sure you want to delete the address: ${addressLine}?`)) return;
        
        setIsSaving(true);
        try {
            await deleteAddress(id);
            toast.success("Address deleted.");
            
            // If the deleted address was selected, deselect it
            if (selectedAddress?.id === id) {
                setSelectedAddress(addresses.filter(a => a.id !== id)[0] || null);
            }

            // Refresh the list
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
        <div className="space-y-4">
            <div className='flex justify-between items-center border-b pb-2'>
                <h4 className="text-lg font-bold text-slate-700">1. Select Shipping Address</h4>
                <button
                    onClick={handleAddAddress}
                    className="px-3 py-1 text-sm text-white rounded-lg flex items-center bg-green-500 hover:bg-green-600 transition-colors"
                >
                    <FaPlus className='mr-1 w-3 h-3' /> Add New
                </button>
            </div>
            
            {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg">{error}</div>}
            
            {/* Address List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {addresses.length === 0 ? (
                    <div className='p-6 text-center border rounded-lg bg-blue-50'>
                        <FaExclamationTriangle className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                        <p className='text-blue-800 font-medium'>No saved addresses found</p>
                        <p className='text-blue-700 text-sm mt-1 mb-4'>Please add a delivery address to continue</p>
                        <button
                            onClick={handleAddAddress}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <FaPlus className='mr-2 inline-block' /> Add New Address
                        </button>
                    </div>
                ) : (
                    addresses.map(address => (
                        <div 
                            key={address.id}
                            onClick={() => setSelectedAddress(address)}
                            className={`p-4 border rounded-xl cursor-pointer transition-all ${
                                selectedAddress?.id === address.id ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className='flex justify-between items-start'>
                                <div>
                                    <p className="font-medium text-sm flex items-center">
                                        {address.address_line1} {address.is_default && <span className='ml-2 text-xs font-bold px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full'>DEFAULT</span>}
                                        {selectedAddress?.id === address.id && <FaCheckCircle className='ml-3 text-blue-600' />}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-0.5">{address.street}, {address.zip_pin}</p>
                                    <p className="text-xs text-gray-500">Phone: {address.phone_numbers?.[0]}</p>
                                </div>
                                <div className='flex space-x-2 flex-shrink-0 ml-4'>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }}
                                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                                        title="Edit Address"
                                        disabled={isSaving}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(address.id, address.address_line1); }}
                                        className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                        title="Delete Address"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <FaSpinner className='animate-spin' /> : <FaTrash />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* 2. Payment Method (COD only) */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
                <h4 className="text-lg font-bold text-slate-700">2. Payment Method</h4>
                <div className="p-3 border border-green-600 rounded-lg bg-green-50 flex justify-between items-center">
                    <span className="font-medium text-green-700">Cash On Delivery (COD)</span>
                    <FaCheckCircle className="text-green-600" />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button 
                    onClick={onContinue}
                    disabled={!selectedAddress || addresses.length === 0 || isSaving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    Continue to Summary
                </button>
            </div>
        </div>
    );
};

export default AddressSelectionStep;