import { useMemo } from 'react';
import type { Product } from '../types/db';
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

interface StatsProps {
    products: Product[];
}

export function InventoryStats({ products }: StatsProps) {
    const stats = useMemo(() => {
        const totalItems = products.length;
        const outOfStock = products.filter(p => p.stock <= 0).length;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.min_stock_level || 5)).length;

        const totalCostValue = products.reduce((acc, p) => p.stock > 0 ? acc + (p.stock * (p.cost_price || 0)) : acc, 0);
        const totalSellValue = products.reduce((acc, p) => p.stock > 0 ? acc + (p.stock * p.sell_price) : acc, 0);
        const potentialProfit = totalSellValue - totalCostValue;

        return { totalItems, lowStock, outOfStock, totalCostValue, totalSellValue, potentialProfit };
    }, [products]);

    const statCards = [
        { label: "Total Products", value: stats.totalItems, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
        { label: "Low Stock Alerts", value: stats.lowStock, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
        { label: "Out of Stock", value: stats.outOfStock, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
        { label: "Inventory Cost", value: `₹${(stats.totalCostValue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
        { label: "Retail Value", value: `₹${(stats.totalSellValue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
        { label: "Est. Profit", value: `₹${(stats.potentialProfit || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {statCards.map((stat, i) => (
                <div
                    key={i}
                    className={`relative overflow-hidden rounded-2xl p-4 border ${stat.border} bg-surface shadow-sm transition-transform hover:scale-[1.02]`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
                        </div>
                        <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
