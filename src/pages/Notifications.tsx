import { useState, useEffect } from 'react';
import { notificationService, type Notification } from '../services/notificationService';
import { Bell, Check, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../components/Button';

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const loadData = async () => { setNotifications(await notificationService.getAll(false)); };
    useEffect(() => { loadData(); }, []);

    const handleMarkRead = async (id: number) => {
        await notificationService.markRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    };

    const handleMarkAll = async () => { await notificationService.markAllRead(); loadData(); };

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">Alerts & History</p>
                </div>
                <Button
                    onClick={handleMarkAll}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow border-none transition-all"
                >
                    <Check size={16} className="mr-2" /> Mark All Read
                </Button>
            </div>

            <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-border shadow-xl flex flex-col p-1">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
                            <Bell size={64} strokeWidth={1} className="mb-4" />
                            <span className="font-bold text-lg">No Notifications</span>
                            <p className="text-sm">You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-5 rounded-xl border flex gap-5 transition-all group ${n.is_read
                                    ? 'bg-muted/20 border-border text-muted-foreground'
                                    : 'bg-gradient-to-r from-orange-500/5 to-transparent border-orange-500/20 shadow-sm'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'LOW_STOCK'
                                    ? 'bg-orange-500/10 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                                    : 'bg-blue-500/10 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                    }`}>
                                    {n.type === 'LOW_STOCK' ? <AlertTriangle size={24} /> : <Info size={24} />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-black text-base uppercase tracking-wider ${n.is_read ? 'text-muted-foreground' : 'text-foreground'
                                            }`}>
                                            {n.title}
                                        </h3>
                                        <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 bg-muted/50 px-2 py-1 rounded border border-border">
                                            {new Date(n.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className={`text-sm leading-relaxed font-medium ${n.is_read ? 'opacity-60' : 'text-foreground/80'}`}>{n.message}</p>
                                </div>

                                {!n.is_read && (
                                    <button
                                        onClick={() => handleMarkRead(n.id)}
                                        title="Mark as Read"
                                        className="self-center p-3 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all border border-transparent hover:border-emerald-500/20"
                                    >
                                        <Check size={20} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
