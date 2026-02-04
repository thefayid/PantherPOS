import { Search, Plus, Filter, Package, Tag, Layers } from 'lucide-react';
import type { Product } from '../../types/db';
import type { ProductGroup } from '../../services/groupService';
import { useState } from 'react';

interface MobileInventoryProps {
    products: Product[];
    search: string;
    onSearchChange: (val: string) => void;
    onAdd: () => void;
    onEdit: (p: Product) => void;
    groups: ProductGroup[];
    selectedGroupId: number | 'all';
    onSelectGroup: (id: number | 'all') => void;
}

export default function MobileInventory({
    products, search, onSearchChange, onAdd, onEdit,
    groups, selectedGroupId, onSelectGroup
}: MobileInventoryProps) {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c] pb-safe">
            {/* Header */}
            <div className="p-4 space-y-3 bg-[#0a0f1c]/90 sticky top-0 z-10 backdrop-blur-md border-b border-white/5">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Inventory</h1>
                    <button
                        onClick={onAdd}
                        className="bg-cyan-500 hover:bg-cyan-400 text-white rounded-full p-2.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder="Search products..."
                            className="w-full bg-[#1e293b] text-white rounded-xl py-2.5 pl-10 pr-4 border border-white/5 focus:border-cyan-500 focus:outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl border border-white/5 transition-colors ${showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#1e293b] text-gray-400'}`}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {/* Group Filters (Horizontal Scroll) */}
                {showFilters && (
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        <button
                            onClick={() => onSelectGroup('all')}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedGroupId === 'all' ? 'bg-cyan-500 text-white' : 'bg-[#1e293b] text-gray-400'}`}
                        >
                            All
                        </button>
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => onSelectGroup(g.id)}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedGroupId === g.id ? 'bg-cyan-500 text-white' : 'bg-[#1e293b] text-gray-400'}`}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
                {products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No products found</p>
                    </div>
                ) : (
                    products.map(p => (
                        <div
                            key={p.id}
                            onClick={() => onEdit(p)}
                            className="bg-[#1e293b]/50 border border-white/5 rounded-2xl p-3 flex gap-4 active:scale-[0.98] transition-transform"
                        >
                            {/* Product Icon/Image Placeholder */}
                            <div className="w-16 h-16 rounded-xl bg-[#0f172a] flex items-center justify-center flex-shrink-0 text-cyan-500/50">
                                {p.image ? (
                                    <img src={p.image} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                                ) : (
                                    <Package size={24} />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-white text-base truncate pr-2">{p.name}</h3>
                                    <span className="text-cyan-400 font-bold whitespace-nowrap">₹{p.sell_price}</span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1 bg-[#0f172a] px-1.5 py-0.5 rounded border border-white/5">
                                        <Tag size={10} />
                                        <span className="font-mono">{p.barcode}</span>
                                    </div>
                                    <div className={`flex items-center gap-1 ${p.stock <= (p.min_stock_level || 5) ? 'text-red-400' : 'text-gray-400'}`}>
                                        <Layers size={10} />
                                        <span className="font-bold">{p.stock} In Stock</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Stats Footer */}
            <div className="bg-[#0a0f1c] border-t border-white/5 p-3 text-center text-xs text-gray-600">
                {products.length} Products Loaded
            </div>
        </div>
    );
}
