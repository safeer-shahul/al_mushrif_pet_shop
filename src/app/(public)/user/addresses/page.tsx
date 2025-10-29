'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaAddressCard, FaPlus, FaMapMarkerAlt, FaEdit, FaTrash, FaSpinner, FaPhone } from 'react-icons/fa';
import { Address } from '@/types/user';
import { useAddressService } from '@/services/public/addressService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AddressForm from '@/components/public/AddressForm'; // Reused component
import { toast } from 'react-hot-toast';

// Define the primary color variable for easy styling consistency
const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

// --- Address Card Component (Redesigned) ---
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
            className={`relative p-5 border-2 rounded-xl transition-all bg-white shadow-md hover:shadow-lg ${
                address.is_default ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'
            } ${isDisabled ? 'opacity-70' : ''}`}
        >
            <div className='flex justify-between items-start'>
                <div className='space-y-1'>
                    <p className="font-bold text-lg flex items-center text-slate-800">
                        <FaMapMarkerAlt className='mr-3 w-5 h-5 text-gray-500' />
                        {address.address_line1} 
                    </p>
                    {/* Default Tag - Branded Green for importance */}
                    {address.is_default && (
                        <span className='ml-8 text-xs font-bold px-2 py-0.5 bg-green-500 text-white rounded-full uppercase tracking-wider shadow-sm'>
                            Default Address
                        </span>
                    )}

                    <div className='mt-3 text-sm text-gray-700 pl-6 ml-2 border-l-2 border-gray-200'>
                        <p>{address.address_line2 ? `${address.address_line2}, ` : ''}{address.street}</p>
                        <p>{address.zip_pin}</p>
                        <p className='mt-2 flex items-center font-medium'>
                            <FaPhone className='mr-2 w-3 h-3 text-gray-500' /> {address.phone_numbers?.[0]}
                        </p>
                    </div>
                </div>
                
                {/* Action Buttons (Top Right) */}
                <div className='flex space-x-2 flex-shrink-0 ml-4 absolute top-4 right-4'>
                    <button 
                        onClick={() => onEdit(address)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                        title="Edit Address"
                        disabled={isDisabled}
                    >
                        <FaEdit className='w-4 h-4' />
                    </button>
                    <button 
                        onClick={() => onDelete(address.id, address.address_line1)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                        title="Delete Address"
                        disabled={isDisabled}
                    >
                         {isDisabled ? <FaSpinner className='w-4 h-4 animate-spin' /> : <FaTrash className='w-4 h-4' />}
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
    // isSaving tracks deletion/form submission across the component
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
        
        // Refresh the list immediately to show the new/updated address
        loadAddresses();
    }

    const handleDelete = async (id: string, addressLine: string) => {
        if (isSaving || !window.confirm(`Are you sure you want to delete the address: ${addressLine}?`)) return;
        
        setIsSaving(true);
        try {
            await deleteAddress(id);
            toast.success("Address deleted successfully.");
            
            // Remove locally for faster UI update and refresh
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

    // When the user is adding/editing an address, show the form component exclusively.
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

    // --- Main Address List View ---
    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 space-y-6">
            <div className='flex justify-between items-center border-b border-gray-200 pb-4'>
                <h2 className="text-xl font-bold text-slate-800 flex items-center" style={{ color: PRIMARY_COLOR }}>
                    My Saved Addresses
                </h2>
                
                <button
                    onClick={handleAddAddress}
                    disabled={isSaving}
                    className="px-5 py-2 text-sm text-white rounded-lg flex items-center font-semibold transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg"
                    style={{ backgroundColor: PRIMARY_COLOR, color: 'white' }}
                >
                    <FaPlus className='mr-2 w-3 h-3' /> Add New Address
                </button>
            </div>
            
            {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-center"><FaTrash className='mr-2' /> {error}</div>}

            
            {/* Address List Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.length === 0 ? (
                    <div className='md:col-span-2 p-8 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50'>
                        <FaMapMarkerAlt className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                        <p className='text-lg text-slate-700 font-semibold'>You have no saved addresses.</p>
                        <p className='text-gray-600 text-sm mt-1'>Please add an address to easily checkout later.</p>
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