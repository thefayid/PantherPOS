import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { eventBus } from '../utils/EventBus';
import Sidebar from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { Toaster } from 'react-hot-toast';
import type { User } from '../types/db';

interface AppShellProps {
    children: React.ReactNode;
    user: User;
    onLogout: () => void;
}

export default function AppShell({ children, user, onLogout }: AppShellProps) {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const unsub = eventBus.on('NAVIGATE', (data) => navigate(data.path));
        return unsub;
    }, [navigate]);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-300">
            <Toaster position="top-right"
                toastOptions={{
                    className: '!bg-surface !text-foreground !border !border-border',
                    style: {} // Handled by classes now
                }}
            />

            {/* Sidebar (Responsive) */}
            <Sidebar
                user={user}
                onLogout={onLogout}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 h-full min-w-0 bg-background relative flex flex-col pb-16 md:pb-0">
                <div className="flex-1 overflow-hidden relative z-10">
                    {children}
                </div>
            </main>

            {/* Bottom Nav (Mobile Only) */}
            <BottomNav onOpenMenu={() => setIsMobileMenuOpen(true)} />
        </div>
    );

}
