import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { platformService } from '../services/platformService';

interface BottomNavProps {
    onOpenMenu?: () => void;
}

export function BottomNav({ onOpenMenu }: BottomNavProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (platformService.isElectron()) {
            setIsConnected(true);
            return;
        }
        const unsubscribe = databaseService.onRemoteStatusChange(setIsConnected);
        return unsubscribe;
    }, []);

    const navItems = [
        { icon: ShoppingCart, label: 'Billing', path: '/' },
        { icon: Package, label: 'Items', path: '/inventory' },
        { icon: BarChart3, label: 'Sales', path: '/reports' },
        { icon: Menu, label: 'Menu', path: '#menu', onClick: onOpenMenu, showStatus: true },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0f172a] border-t border-white/5 flex items-center justify-around px-2 z-50 md:hidden pb-safe">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <button
                        key={item.label}
                        onClick={() => {
                            if (item.onClick) {
                                item.onClick();
                            } else {
                                navigate(item.path);
                            }
                        }}
                        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative ${isActive ? 'text-cyan-400' : 'text-gray-500'
                            }`}
                    >
                        <div className="relative">
                            <item.icon size={20} className={isActive ? 'scale-110' : ''} />
                            {item.showStatus && (
                                <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0f172a] ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                            )}
                        </div>
                        <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                        {isActive && (
                            <div className="absolute top-0 w-8 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
