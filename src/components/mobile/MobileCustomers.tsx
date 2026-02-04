import { Search, Plus, User, Phone, MapPin, MoreVertical, Pencil, ShoppingBag, Trash2 } from 'lucide-react';
import type { Customer } from '../../types/db';
import { useState } from 'react';

interface MobileCustomersProps {
    customers: Customer[];
    search: string;
    onSearchChange: (val: string) => void;
    onAdd: () => void;
    onEdit: (c: Customer) => void;
    onDelete: (id: number) => void;
    onViewLedger: (c: Customer) => void;
}

export default function MobileCustomers({
    customers, search, onSearchChange, onAdd, onEdit, onDelete, onViewLedger
}: MobileCustomersProps) {
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c] pb-safe">
            {/* Header */}
            <div className="p-4 space-y-4 bg-[#0a0f1c]/90 sticky top-0 z-10 backdrop-blur-md border-b border-white/5">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Customers</h1>
                    <button
                        onClick={onAdd}
                        className="bg-cyan-500 hover:bg-cyan-400 text-white rounded-full p-2.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Search by name, phone..."
                        className="w-full bg-[#1e293b] text-white rounded-xl py-3 pl-10 pr-4 border border-white/5 focus:border-cyan-500 focus:outline-none transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
                {customers.map(c => (
                    <div
                        key={c.id}
                        className="bg-[#1e293b]/50 border border-white/5 rounded-2xl p-4 flex gap-4 relative active:scale-[0.99] transition-transform"
                        onClick={() => {
                            if (openMenuId === c.id) setOpenMenuId(null);
                            else onViewLedger(c);
                        }}
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-cyan-400 font-bold text-lg flex-shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-white truncate text-lg">{c.name}</h3>
                                {c.balance !== 0 && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.balance > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                        {c.balance > 0 ? 'Due' : 'Adv'} ₹{Math.abs(c.balance).toFixed(0)}
                                    </span>
                                )}
                            </div>

                            <div className="mt-1 space-y-0.5">
                                {c.phone && (
                                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                        <Phone size={12} />
                                        <span>{c.phone}</span>
                                    </div>
                                )}
                                {c.address && (
                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                        <MapPin size={12} />
                                        <span className="truncate">{c.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Menu Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === c.id ? null : c.id);
                            }}
                            className="absolute top-4 right-2 text-gray-500 p-2 -mt-2 -mr-2 hover:text-white"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {/* Context Menu */}
                        {openMenuId === c.id && (
                            <div className="absolute top-10 right-4 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[140px]">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onEdit(c); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3"
                                >
                                    <Pencil size={16} className="text-cyan-400" /> Edit
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onViewLedger(c); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3"
                                >
                                    <ShoppingBag size={16} className="text-purple-400" /> Ledger
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onDelete(c.id); }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 border-t border-white/5"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {customers.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <User size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No customers found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
