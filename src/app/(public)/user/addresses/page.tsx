// src/app/(public)/user/addresses/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaAddressCard, FaPlus, FaMapMarkerAlt, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { Address } from '@/types/user';
import { useAddressService } from '@/services/public/addressService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AddressForm from '@/components/public/AddressForm'; // Reused component
import { toast } from 'react-hot-toast';

// --- Address Card Component (Simplified for display within the list) ---
interface AddressCardProps {
    address: Address;
    onEdit: (addr: Address) => void;
    onDelete: (id: string, line: string) => void;
    isDisabled: boolean;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, onEdit, onDelete, isDisabled }) => {
    return (
        <div 
            key={address.id}
            className={`p-4 border rounded-xl transition-all border-gray-300 bg-white shadow-sm`}
        >
            <div className='flex justify-between items-start'>
                <div>
                    <p className="font-medium text-sm flex items-center text-slate-800">
                        <FaMapMarkerAlt className='mr-2 w-4 h-4 text-blue-600' />
                        {address.address_line1} {address.is_default && <span className='ml-2 text-xs font-bold px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full'>DEFAULT</span>}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{address.street}, {address.zip_pin}</p>
                    <p className="text-xs text-gray-500">Phone: {address.phone_numbers?.[0]}</p>
                </div>
                <div className='flex space-x-2 flex-shrink-0 ml-4'>
                    <button 
                        onClick={() => onEdit(address)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                        title="Edit Address"
                        disabled={isDisabled}
                    >
                        <FaEdit />
                    </button>
                    <button 
                        onClick={() => onDelete(address.id, address.address_line1)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                        title="Delete Address"
                        disabled={isDisabled}
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Main Page Component ---

const AddressManagementPage: React.FC = () => {
    const { fetchUserAddresses, deleteAddress } = useAddressService();
    
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); 
    const [error, setError] = useState<string | null>(null);

    // State for managing the Address Form overlay
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    // Fetch addresses function
    const loadAddresses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchUserAddresses();
            setAddresses(data || []);
        } catch (err: any) {
            setError(err.message || "Failed to load addresses.");
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    }, [fetchUserAddresses]);

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
        
        // Refresh the list immediately
        loadAddresses();
    }

    const handleDelete = async (id: string, addressLine: string) => {
        if (!window.confirm(`Are you sure you want to delete the address: ${addressLine}?`)) return;
        
        setIsSaving(true);
        try {
            await deleteAddress(id);
            toast.success("Address deleted.");
            
            // Remove locally and refresh
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch (err: any) {
            toast.error(err.message || "Failed to delete address.");
        } finally {
            setIsSaving(false);
        }
    }

    if (loading) {
        return <LoadingSpinner />;
    }

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

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center border-b pb-3">
                <FaAddressCard className="mr-2 text-blue-600" /> My Saved Addresses
            </h2>
            
            {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg">{error}</div>}

            <div className='flex justify-end'>
                <button
                    onClick={handleAddAddress}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm text-white rounded-lg flex items-center bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                    {isSaving ? (
                        <>
                            <FaSpinner className='mr-1 w-3 h-3 animate-spin' /> Processing
                        </>
                    ) : (
                        <>
                            <FaPlus className='mr-1 w-3 h-3' /> Add New Address
                        </>
                    )}
                </button>
            </div>
            
            {/* Address List Display */}
            <div className="space-y-3">
                {addresses.length === 0 ? (
                    <div className='p-6 text-center border rounded-lg bg-gray-50'>
                        <FaMapMarkerAlt className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                        <p className='text-slate-700 font-medium'>You have no saved addresses.</p>
                        <p className='text-gray-500 text-sm mt-1'>Click "Add New Address" to begin.</p>
                    </div>
                ) : (
                    addresses.map(address => (
                        <AddressCard 
                            key={address.id}
                            address={address}
                            onEdit={handleEditAddress}
                            onDelete={handleDelete}
                            isDisabled={isSaving}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default AddressManagementPage;