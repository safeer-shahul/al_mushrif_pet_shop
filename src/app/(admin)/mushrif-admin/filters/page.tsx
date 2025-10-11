// src/app/(admin)/mushrif-admin/filters/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaSync, FaFilter, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { FilterType, FilterItem } from '@/types/filter';
import { useFilterService } from '@/services/admin/filterService';

// =================================================================
// 1. Filter Item Row Component (Nested)
// =================================================================
interface FilterItemRowProps {
    typeId: string;
    item: FilterItem;
    onItemUpdate: (typeId: string, item: FilterItem) => void;
    onItemDelete: (typeId: string, itemId: string, itemName: string) => void;
}

const FilterItemRow: React.FC<FilterItemRowProps> = ({ typeId, item, onItemUpdate, onItemDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(item.filter_name);
    const { updateFilterItem } = useFilterService();
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!newName.trim() || newName === item.filter_name) {
            setIsEditing(false);
            return;
        }
        setLoading(true);
        try {
            const response = await updateFilterItem(typeId, item.id, newName.trim());
            onItemUpdate(typeId, response.item);
            setIsEditing(false);
        } catch (err: any) {
            alert(err.message || 'Failed to update item.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <li className="flex justify-between items-center py-2 px-3 hover:bg-gray-100/50 transition-colors border-b border-gray-100 last:border-b-0">
            {isEditing ? (
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-blue-500"
                    disabled={loading}
                    autoFocus
                />
            ) : (
                <span className="text-sm text-gray-700">{item.filter_name}</span>
            )}
            <div className="flex space-x-1">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                    title="Edit Item"
                    disabled={isEditing || loading}
                >
                    <FaEdit size={12} />
                </button>
                <button
                    onClick={() => onItemDelete(typeId, item.id, item.filter_name)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                    title="Delete Item"
                    disabled={loading}
                >
                    <FaTrash size={12} />
                </button>
            </div>
        </li>
    );
};

// =================================================================
// 2. Filter Type Card Component (Main Container)
// =================================================================
interface FilterTypeCardProps {
    type: FilterType;
    onTypeUpdate: (updatedType: FilterType) => void;
    onTypeDelete: (typeId: string, typeName: string) => void;
    onListChange: () => void; // Trigger list refresh
}

const FilterTypeCard: React.FC<FilterTypeCardProps> = ({ type, onTypeUpdate, onTypeDelete, onListChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTypeEditing, setIsTypeEditing] = useState(false);
    const [newTypeName, setNewTypeName] = useState(type.filter_type_name);
    const [newItemName, setNewItemName] = useState('');
    const [typeLoading, setTypeLoading] = useState(false);
    const [itemLoading, setItemLoading] = useState(false);
    const { updateFilterType, createFilterItem, deleteFilterItem } = useFilterService();

    // Type Update Handlers
    const handleTypeSave = async () => {
        if (!newTypeName.trim() || newTypeName === type.filter_type_name) {
            setIsTypeEditing(false);
            return;
        }
        setTypeLoading(true);
        try {
            const response = await updateFilterType(type.id, newTypeName.trim());
            onTypeUpdate(response.type);
            setIsTypeEditing(false);
        } catch (err: any) {
            alert(err.message || 'Failed to update type.');
        } finally {
            setTypeLoading(false);
        }
    };

    // Item Create Handler
    const handleItemCreate = async () => {
        if (!newItemName.trim()) return;
        setItemLoading(true);
        try {
            await createFilterItem(type.id, newItemName.trim());
            setNewItemName('');
            onListChange(); // Refresh parent list to get the new item
        } catch (err: any) {
            alert(err.message || 'Failed to create item.');
        } finally {
            setItemLoading(false);
        }
    };
    
    // Item Update/Delete Handler (delegated up to main page but we can handle the state update here)
    const handleItemLocalUpdate = (typeId: string, updatedItem: FilterItem) => {
        // Find and replace the item in the local state for better UX
        const updatedItems = type.items?.map(item => 
            item.id === updatedItem.id ? updatedItem : item
        ) || [];
        onTypeUpdate({...type, items: updatedItems});
    };
    
    const handleItemLocalDelete = async (typeId: string, itemId: string, itemName: string) => {
        if (!window.confirm(`Delete filter item "${itemName}"?`)) return;
        setItemLoading(true);
        try {
            await deleteFilterItem(typeId, itemId);
            onListChange(); // Refresh parent list to remove item
        } catch(err: any) {
            alert(err.message || 'Failed to delete item. It might be in use.');
        } finally {
            setItemLoading(false);
        }
    };


    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Header / Type Name */}
            <div 
                className={`p-4 flex justify-between items-center cursor-pointer ${isExpanded ? 'border-b border-gray-200/50' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-3">
                    {isTypeEditing ? (
                         <input
                            type="text"
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                            onBlur={handleTypeSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTypeSave()}
                            className="text-lg font-semibold px-2 py-1 border border-blue-300 rounded"
                            disabled={typeLoading}
                            autoFocus
                        />
                    ) : (
                        <h3 className="text-lg font-semibold text-slate-800">{type.filter_type_name}</h3>
                    )}
                    <span className="text-sm text-gray-500">({type.items?.length || 0} Items)</span>
                </div>

                <div className="flex items-center space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); setIsTypeEditing(true); }} className="p-1 text-gray-500 hover:text-blue-600 transition-colors" title="Edit Type">
                        <FaEdit size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onTypeDelete(type.id, type.filter_type_name); }} className="p-1 text-gray-500 hover:text-red-600 transition-colors" title="Delete Type">
                        <FaTrash size={14} />
                    </button>
                    {isExpanded ? <FaChevronDown size={14} className="text-gray-500" /> : <FaChevronRight size={14} className="text-gray-500" />}
                </div>
            </div>

            {/* Content / Filter Items */}
            {isExpanded && (
                <div className="p-4 bg-gray-50">
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {type.items && type.items.length > 0 ? (
                                type.items.map(item => (
                                    <FilterItemRow 
                                        key={item.id} 
                                        typeId={type.id}
                                        item={item} 
                                        onItemUpdate={handleItemLocalUpdate}
                                        onItemDelete={handleItemLocalDelete}
                                    />
                                ))
                            ) : (
                                <li className="p-3 text-sm text-gray-500 text-center">No items defined for this type.</li>
                            )}
                        </ul>
                    </div>

                    {/* Add New Item Form */}
                    <div className="mt-4 flex space-x-2">
                        <input
                            type="text"
                            placeholder="New Item Name (e.g., Small)"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleItemCreate()}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={itemLoading}
                        />
                        <button
                            onClick={handleItemCreate}
                            disabled={itemLoading || !newItemName.trim()}
                            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            <FaPlus className="inline-block mr-1" /> Add Item
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


// =================================================================
// 3. Main Page Component
// =================================================================
const FilterListPage: React.FC = () => {
    const { fetchAllFilterTypes, createFilterType, deleteFilterType } = useFilterService();
    
    const [filterTypes, setFilterTypes] = useState<FilterType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newTypeName, setNewTypeName] = useState('');
    const [creatingType, setCreatingType] = useState(false);
    const hasFetchedRef = useRef(false);

    // Load function
    const loadFilters = useCallback(async () => {
        if (loading && hasFetchedRef.current) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const types = await fetchAllFilterTypes(); 
            setFilterTypes(types);
            hasFetchedRef.current = true;
        } catch (err: any) {
            setError(err.message || 'Failed to load filter types.');
            setFilterTypes([]);
        } finally {
            setLoading(false);
        }
    }, [fetchAllFilterTypes, loading]); 

    useEffect(() => {
        if (!hasFetchedRef.current) {
            loadFilters();
        }
    }, [loadFilters]);

    // Handler for creating a new Filter Type
    const handleCreateType = async () => {
        if (!newTypeName.trim()) return;

        setCreatingType(true);
        setError(null);

        try {
            await createFilterType(newTypeName.trim());
            setNewTypeName('');
            
            // Reload the list to include the new type
            hasFetchedRef.current = false;
            await loadFilters();
        } catch (err: any) {
            setError(err.message || 'Failed to create filter type.');
        } finally {
            setCreatingType(false);
        }
    };
    
    // Handler for deleting a Filter Type
    const handleDeleteType = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the Filter Type: "${name}"? This will also delete all associated items and remove them from all products!`)) return;

        setLoading(true);
        setError(null);
        try {
            await deleteFilterType(id);
            
            // Show success toast
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            toast.textContent = `Filter Type "${name}" deleted successfully.`;
            document.body.appendChild(toast);
            setTimeout(() => document.body.removeChild(toast), 3000);
            
            // Reload the list
            setFilterTypes(prev => prev.filter(type => type.id !== id));
            await loadFilters(); // Ensures full refresh
        } catch (err: any) {
            setError(err.message || 'Failed to delete filter type.');
        } finally {
            setLoading(false);
        }
    };
    
    // Handler for local update (Type Card calls this when a type is updated)
    const handleTypeUpdate = (updatedType: FilterType) => {
        setFilterTypes(prev => prev.map(type => 
            type.id === updatedType.id ? updatedType : type
        ));
    };


    return (
        <div className="space-y-6">
            {/* Header section with actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Product Filter Management</h1>
                    <p className="text-gray-500 mt-1">Manage filter types (e.g., Size, Color) and their corresponding items.</p>
                </div>
                <button 
                    onClick={loadFilters}
                    disabled={loading || creatingType}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors shadow-sm disabled:opacity-50"
                >
                    <FaSync className={`inline-block mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh Filters'}
                </button>
            </div>

            {/* Error alert */}
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}
            
            {/* Add New Filter Type Card */}
            <div className="bg-white p-4 border border-blue-200 rounded-xl shadow-sm flex space-x-3 items-center">
                <input
                    type="text"
                    placeholder="Enter New Filter Type Name (e.g., Size, Material, Color)"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateType()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={creatingType || loading}
                />
                <button
                    onClick={handleCreateType}
                    disabled={creatingType || loading || !newTypeName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg hover:from-teal-700 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 transition-colors shadow-sm"
                >
                    <FaPlus className="inline-block mr-1" /> {creatingType ? 'Creating...' : 'Add Type'}
                </button>
            </div>


            {/* Filter Type List */}
            <div className="space-y-4">
                {(loading && filterTypes.length === 0) ? (
                    <div className="flex items-center justify-center h-40 bg-white rounded-xl shadow-sm border border-gray-200">
                        <LoadingSpinner />
                    </div>
                ) : filterTypes.length > 0 ? (
                    filterTypes.map(type => (
                        <FilterTypeCard 
                            key={type.id} 
                            type={type} 
                            onTypeUpdate={handleTypeUpdate}
                            onTypeDelete={handleDeleteType}
                            onListChange={loadFilters} // Important: pass the full reload function
                        />
                    ))
                ) : (
                    !error && (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
                                <FaFilter className="h-8 w-8 text-teal-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No Filter Types Defined</h3>
                            <p className="mt-2 text-gray-500 max-w-sm mx-auto">Start by creating a top-level filter like "Size" or "Color".</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default FilterListPage;