'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { FaPlus, FaEdit, FaTrash, FaSync, FaImage, FaList, FaBullhorn } from 'react-icons/fa';
import { HeroSection, HomeSection } from '@/types/content';
import { useContentService } from '@/services/admin/contentService'; 
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import HeroSectionForm from '@/components/admin/content/HeroSectionForm'; 
import HomeSectionForm from '@/components/admin/content/HomeSectionForm'; 
import { toast } from 'react-hot-toast'; 
import { useCategoryService } from '@/services/admin/categoryService';

// --- List Item Components ---

interface HeroSectionItemProps { 
    section: HeroSection, 
    onEdit: (s: HeroSection) => void, 
    onDelete: (id: string, slug: string) => void,
    getStorageUrl: (path: string | null) => string | null;
}

const HeroSectionItem: React.FC<HeroSectionItemProps> = ({ section, onEdit, onDelete, getStorageUrl }) => (
    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
            <FaImage className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className='min-w-0'>
                <p className="font-medium truncate text-slate-800">{section.slug || `Banner: ${section.id.substring(0, 8)}...`}</p>
                <p className={`text-xs ${section.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {section.is_active ? 'Active' : 'Inactive'} | Order: {section.order_sequence}
                </p>
            </div>
        </div>
        <div className="flex-shrink-0 ml-4 space-x-2">
            <button onClick={() => onEdit(section)} className="p-2 text-blue-600 hover:text-blue-800 transition-colors" title="Edit Banner"><FaEdit /></button>
            <button onClick={() => onDelete(section.id, section.slug || 'Banner')} className="p-2 text-red-600 hover:text-red-800 transition-colors" title="Delete Banner"><FaTrash /></button>
        </div>
    </div>
);

interface HomeSectionItemProps { 
    section: HomeSection,
    onEdit: (s: HomeSection) => void,
    onDelete: (id: string, title: string) => void
}

const HomeSectionItem: React.FC<HomeSectionItemProps> = ({ section, onEdit, onDelete }) => (
    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
            <FaList className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <div>
                <p className="font-medium truncate">{section.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                    {section.offer_id ? `Linked to Offer: ${section.offer_id?.substring(0, 8)}...` : `${section.product_ids?.length || 0} manual products`}
                </p>
            </div>
        </div>
        <div className="flex-shrink-0 ml-4 space-x-2">
            <button onClick={() => onEdit(section)} className="p-2 text-blue-600 hover:text-blue-800 transition-colors" title="Edit Section"><FaEdit /></button>
            <button onClick={() => onDelete(section.id, section.title)} className="p-2 text-red-600 hover:text-red-800 transition-colors" title="Delete Section"><FaTrash /></button>
        </div>
    </div>
);

const AdminContentListPage: React.FC = () => {
    const { fetchAllHeroSections, saveHeroSection, deleteHeroSection, fetchAllHomeSections, saveHomeSection, deleteHomeSection } = useContentService();
    const { getStorageUrl } = useCategoryService();
    
    // State management
    const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
    const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const hasFetchedRef = useRef(false);

    const [showHeroForm, setShowHeroForm] = useState(false);
    const [editingHero, setEditingHero] = useState<HeroSection | undefined>(undefined);
    
    const [showHomeForm, setShowHomeForm] = useState(false);
    const [editingHome, setEditingHome] = useState<HomeSection | undefined>(undefined);
    
    // Mock data - replace with real data from API
    const availableOffers = [
        { id: 'uuid-1', name: 'FLAT 25% OFF' },
        { id: 'uuid-2', name: 'Buy 1 Get 1 Free' },
    ];

    // Load content data (Hero sections and Home sections)
    const loadContent = useCallback(async () => {
        if (loading && hasFetchedRef.current) return;
        
        if (hasFetchedRef.current) setLoading(true);
        setApiError(null);
        
        try {
            const [heroData, homeData] = await Promise.all([
                fetchAllHeroSections(),
                fetchAllHomeSections(),
            ]);
            setHeroSections(heroData);
            setHomeSections(homeData);
            hasFetchedRef.current = true;
        } catch (error: any) {
            setApiError(error.message || 'Failed to load content sections.');
        } finally {
            setLoading(false);
        }
    }, [fetchAllHeroSections, fetchAllHomeSections, loading]);

    useEffect(() => {
        if (!hasFetchedRef.current) {
            loadContent();
        }
    }, [loadContent]);

    // --- Hero Section Handlers ---

    const handleEditHeroClick = (section: HeroSection) => {
        setEditingHero(section);
        setApiError(null);
        setShowHeroForm(true);
    };

    const handleSaveHero = async (data: Partial<HeroSection>, imageFile: File | null, imageRemoved: boolean, isUpdate: boolean) => {
        if (isSaving) return;
        setIsSaving(true);
        setApiError(null);
        
        try {
            await saveHeroSection(data, imageFile, imageRemoved, isUpdate);
            toast.success(data.id ? 'Banner updated.' : 'Banner created.');
            setShowHeroForm(false);
            setEditingHero(undefined);
            await loadContent();
        } catch (error: any) {
            setApiError(error.message || 'Failed to save banner.');
            // Keep the form open when there's an error
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteHero = async (id: string, slug: string) => {
        if (!window.confirm(`Are you sure you want to delete the Banner: ${slug}?`)) return;
        
        if (isSaving) return;
        setIsSaving(true);

        try {
            await deleteHeroSection(id);
            toast.success('Banner deleted.');
            // Update state optimistically
            setHeroSections(prev => prev.filter(section => section.id !== id));
            await loadContent();
        } catch (error: any) {
            toast.error(error.message || 'Deletion failed.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNewHeroClick = () => {
        setEditingHero(undefined);
        setApiError(null);
        setShowHeroForm(true);
    };
    
    // --- Home Section Handlers ---
    
    const handleEditHomeClick = (section: HomeSection) => {
        setEditingHome(section);
        setApiError(null);
        setShowHomeForm(true);
    };
    
    const handleSaveHome = async (data: Partial<HomeSection>) => {
        if (isSaving) return;
        setIsSaving(true);
        setApiError(null);
        
        try {
            await saveHomeSection(data);
            toast.success(data.id ? 'Section updated.' : 'Section created.');
            setShowHomeForm(false);
            setEditingHome(undefined);
            await loadContent();
        } catch (error: any) {
            setApiError(error.message || 'Failed to save section.');
            // Keep the form open when there's an error
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteHome = async (id: string, title: string) => {
        if (!window.confirm(`Are you sure you want to delete the Section: "${title}"?`)) return;
        
        if (isSaving) return;
        setIsSaving(true);
        
        try {
            await deleteHomeSection(id);
            toast.success('Section deleted.');
            // Update state optimistically
            setHomeSections(prev => prev.filter(section => section.id !== id));
            await loadContent();
        } catch (error: any) {
            toast.error(error.message || 'Deletion failed.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleNewHomeClick = () => {
        setEditingHome(undefined);
        setApiError(null);
        setShowHomeForm(true);
    };

    if (loading && heroSections.length === 0 && homeSections.length === 0) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="pb-4 border-b border-gray-200">
                <h1 className="text-3xl font-bold text-slate-800">Homepage Content Dashboard</h1>
                <p className="text-gray-500 mt-1">Manage banners, product feature sections, and global offers.</p>
            </header>
            
            {/* API Error Alert */}
            {apiError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <p className="text-sm text-red-700">{apiError}</p>
                </div>
            )}

            {/* Marquee Section Link */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm flex justify-between items-center">
                <div className='flex items-center space-x-3'>
                    <FaBullhorn className='w-6 h-6 text-yellow-700' />
                    <p className="font-medium text-yellow-800">Marquee / Scrolling Offer Text</p>
                </div>
                <Link href="/mushrif-admin/content/marquee" className="text-sm px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold text-slate-700 transition-colors">
                    Manage Marquee
                </Link>
            </div>
            
            {/* Hero Sections (Banners) */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-700 flex justify-between items-center">
                    Hero Section Banners
                    <button 
                        onClick={handleNewHeroClick} 
                        disabled={isSaving} 
                        className="text-sm px-4 py-2 text-white rounded-lg transition-colors flex items-center disabled:bg-gray-400 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                    >
                        <FaPlus className='mr-2' /> Add Banner
                    </button>
                </h2>
                
                {/* Form Display for Hero Section */}
                {showHeroForm && (
                    <HeroSectionForm 
                        initialData={editingHero}
                        isEditMode={!!editingHero}
                        onSave={handleSaveHero}
                        onCancel={() => { setShowHeroForm(false); setEditingHero(undefined); setApiError(null); }}
                        isLoading={isSaving}
                        apiError={apiError}
                        availableOffers={availableOffers}
                    />
                )}
                
                {/* List View for Hero Sections */}
                <div className="space-y-3">
                    {heroSections.length > 0 ? (
                        heroSections.map(section => (
                            <HeroSectionItem 
                                key={section.id} 
                                section={section}
                                onEdit={handleEditHeroClick}
                                onDelete={handleDeleteHero}
                                getStorageUrl={getStorageUrl}
                            />
                        ))
                    ) : (
                        !showHeroForm && (
                            <p className='text-gray-500 p-4 border rounded-lg bg-gray-50'>No hero banners defined.</p>
                        )
                    )}
                </div>
            </section>

            {/* Home Sections (Product Grids) */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-700 flex justify-between items-center">
                    Home Page Product Sections
                    <button 
                        onClick={handleNewHomeClick}
                        disabled={isSaving}
                        className="text-sm px-4 py-2 text-white rounded-lg transition-colors flex items-center disabled:bg-gray-400 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                    >
                        <FaPlus className='mr-2' /> Add Section
                    </button>
                </h2>
                
                {/* Form Display for Home Section */}
                {showHomeForm && (
                    <HomeSectionForm
                        initialData={editingHome}
                        isEditMode={!!editingHome}
                        onSave={handleSaveHome}
                        onCancel={() => { setShowHomeForm(false); setEditingHome(undefined); setApiError(null); }}
                        isLoading={isSaving}
                        apiError={apiError}
                        availableOffers={availableOffers}
                    />
                )}
                
                {/* List View for Home Sections */}
                <div className="space-y-3">
                    {homeSections.length > 0 ? (
                        homeSections.map(section => (
                            <HomeSectionItem 
                                key={section.id} 
                                section={section}
                                onEdit={handleEditHomeClick}
                                onDelete={handleDeleteHome}
                            />
                        ))
                    ) : (
                        !showHomeForm && (
                            <p className='text-gray-500 p-4 border rounded-lg bg-gray-50'>No featured product sections defined.</p>
                        )
                    )}
                </div>
            </section>
        </div>
    );
};

export default AdminContentListPage;