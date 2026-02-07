import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

interface UIContextType {
    isTouchMode: boolean;
    setTouchMode: (enabled: boolean) => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [isTouchMode, setIsTouchMode] = useState(false);

    useEffect(() => {
        loadMode();
    }, []);

    const loadMode = async () => {
        try {
            const settings = await settingsService.getSettings();
            setIsTouchMode(settings.touch_mode);
            updateBodyClass(settings.touch_mode);
        } catch (error) {
            console.error('Failed to load UI mode:', error);
        }
    };

    const updateBodyClass = (enabled: boolean) => {
        if (enabled) {
            document.body.classList.add('touch-mode');
        } else {
            document.body.classList.remove('touch-mode');
        }
    };

    const setTouchMode = async (enabled: boolean) => {
        setIsTouchMode(enabled);
        updateBodyClass(enabled);
        await settingsService.updateSetting('touch_mode', enabled);
    };

    return (
        <UIContext.Provider value={{ isTouchMode, setTouchMode }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
