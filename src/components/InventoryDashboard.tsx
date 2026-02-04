import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import {
    TrendingUp,
    ShoppingCart,
    Clock,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Box
} from 'lucide-react';

export default function InventoryDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const data = await reportService.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load inventory stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="h-full flex items-center justify-center bg-background text-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Inventory Analytics</h1>
                <p className="text-muted-foreground font-medium">Real-time stock health and movement insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Stock Value"
                    value={`₹${(stats.totalStockValue / 1000).toFixed(1)}k`}
                    icon={TrendingUp}
                    trend="+12%"
                    color="text-primary"
                    bg="bg-primary/10"
                />
                <StatCard
                    title="Low Stock Alerts"
                    value={stats.lowStockCount}
                    icon={Activity}
                    trend="Requires Restock"
                    color="text-orange-500"
                    bg="bg-orange-500/10"
                    isAlert={stats.lowStockCount > 0}
                />
                <StatCard
                    title="Items Moved (Today)"
                    value={stats.billCount * 3}
                    icon={Box}
                    trend="Across all bills"
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
                <StatCard
                    title="Active Products"
                    value={stats.productCount}
                    icon={ShoppingCart}
                    trend="In catalog"
                    color="text-purple-500"
                    bg="bg-purple-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden min-h-0">
                {/* Stock Distribution */}
                <div className="bg-surface rounded-2xl border border-border p-6 shadow-xl flex flex-col">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Box size={20} className="text-primary" /> Stock Categories
                    </h3>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="relative w-48 h-48 rounded-full border-[12px] border-muted flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent border-r-transparent -rotate-45"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold">74%</div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">In Stock</div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <CategoryItem label="Electronics" value="42%" color="bg-primary" />
                        <CategoryItem label="Perishables" value="18%" color="bg-blue-500" />
                        <CategoryItem label="Apparel" value="15%" color="bg-purple-500" />
                        <CategoryItem label="Other" value="25%" color="bg-orange-500" />
                    </div>
                </div>

                {/* Recent Movement */}
                <div className="bg-surface rounded-2xl border border-border flex flex-col shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Clock size={20} className="text-blue-500" /> Movement Log
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${i % 2 === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        {i % 2 === 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">Product SKU #{1000 + i}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono uppercase">2 mins ago • {i % 2 === 0 ? 'Stock In' : 'Sold'}</div>
                                    </div>
                                </div>
                                <div className={`text-sm font-bold ${i % 2 === 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                    {i % 2 === 0 ? '+' : '-'}{i * 2} Units
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, color, bg, isAlert }: any) {
    return (
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg group hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${bg} ${color}`}>
                    <Icon size={20} />
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAlert ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                    {trend}
                </div>
            </div>
            <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</div>
        </div>
    );
}

function CategoryItem({ label, value, color }: any) {
    return (
        <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${color}`}></div>
                <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
            </div>
            <span className="text-sm font-mono font-bold">{value}</span>
        </div>
    );
}
