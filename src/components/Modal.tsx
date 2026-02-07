import { useUI } from '../context/UIContext';
import { cn } from '../utils/cn';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
    const { isTouchMode } = useUI();
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl'
    };


    // Close on Escape
    useEffect(() => {
        const handleKv = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKv);
        return () => window.removeEventListener('keydown', handleKv);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4 text-foreground animate-in fade-in duration-300">
            <div
                className={cn(
                    "mac-card !bg-surface shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] w-full flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300 border border-border",
                    isTouchMode ? "rounded-xl" : "rounded-[32px]",
                    sizeClasses[size]
                )}
                role="dialog"
                aria-modal="true"
            >
                <div className={cn(
                    "flex items-center justify-between border-b border-border",
                    isTouchMode ? "px-5 md:px-10 py-6" : "px-6 py-5"
                )}>
                    <h2 className="text-xl font-black text-foreground tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className={cn(
                            "text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted",
                            isTouchMode ? "rounded-lg" : "rounded-xl"
                        )}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className={cn(
                    "overflow-y-auto",
                    isTouchMode ? "p-5 md:p-10" : "p-6"
                )}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
