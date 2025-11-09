'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    return (
        <ModalContext.Provider value={{ isLoginModalOpen, openLoginModal, closeLoginModal }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        // This is a critical error if the provider is missing
        throw new Error('useModal must be used within a ModalProvider. Please wrap your application in <ModalProvider>.');
    }
    return context;
};