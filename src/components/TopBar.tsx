import { Search, Bell, User, Cloud, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { eventBus } from '../utils/EventBus';
import { cloudService } from '../services/cloudService';

interface TopBarProps {
    title?: string;
}

export function TopBar({ title }: TopBarProps) {
    const [syncStatus, setSyncStatus] = useState<'ONLINE' | 'SYNCING' | 'ERROR' | 'OFFLINE'>('OFFLINE');
    const [lastSync, setLastSync] = useState<string>('');

    useEffect(() => {
        // Init status
        const config = cloudService.getConfig();
        if (config.serverUrl && config.apiKey) {
            setSyncStatus('ONLINE'); // Assume online if configured for now
        }

        const unsubStatus = eventBus.on('SYNC_STATUS', (status) => setSyncStatus(status));
        const unsubLastSync = eventBus.on('LAST_SYNC_UPDATE', (date) => setLastSync(date));

        return () => {
            unsubStatus();
            unsubLastSync();
        };
    }, []);

    const getStatusIcon = () => {
        switch (syncStatus) {
            case 'SYNCING': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'ONLINE': return <Cloud className="w-4 h-4 text-emerald-500" />;
            case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Cloud className="w-4 h-4 text-slate-300" />;
        }
    };

    const getStatusText = () => {
        switch (syncStatus) {
            case 'SYNCING': return 'Syncing...';
            case 'ONLINE': return 'Cloud Active';
            case 'ERROR': return 'Sync Error';
            default: return 'Offline';
        }
    };

    return (
        <header className="h-14 flex items-center justify-between px-6 shrink-0 z-50 relative">
            {/* Left: Window Controls (Decorative) */}
            <div className="flex items-center gap-2 w-48">
                <div className="flex gap-2 group">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-sm group-hover:opacity-80 transition-opacity" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] shadow-sm group-hover:opacity-80 transition-opacity" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] shadow-sm group-hover:opacity-80 transition-opacity" />
                </div>
            </div>

            {/* Center: App Title */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none select-none">
                <span className="text-sm font-semibold text-theme-text opacity-90 tracking-tight">{title || 'PantherPOS'}</span>
            </div>

            {/* Right: Search & Profile */}
            <div className="flex items-center gap-4 w-auto justify-end">
                {/* Cloud Status */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full border border-black/5 shadow-sm" title={lastSync ? `Last Sync: ${new Date(lastSync).toLocaleTimeString()}` : 'Not synced yet'}>
                    {getStatusIcon()}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{getStatusText()}</span>
                </div>

                <div className="relative group hidden sm:block">
                    <Search className="w-4 h-4 text-theme-text-secondary absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-mac-blue transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-1.5 w-32 lg:w-48 text-sm input-mac rounded-full focus:w-64 transition-all duration-300 shadow-sm"
                    />
                </div>

                <button className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center hover:bg-white/80 transition-all shadow-sm border border-white/40">
                    <Bell className="w-4 h-4 text-theme-text-secondary" />
                </button>

                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-mac-blue to-mac-pink p-[2px] shadow-sm cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <User className="w-4 h-4 text-theme-text" />
                    </div>
                </div>
            </div>
        </header>
    );
}
