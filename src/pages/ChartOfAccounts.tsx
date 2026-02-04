import { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import type { Account } from '../types/db';
import {
    PieChart,
    Search,
    Filter
} from 'lucide-react';

export default function ChartOfAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await accountingService.getAccounts();
            setAccounts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = (acc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (acc.code || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'ALL' || acc.type === filterType;
        return matchesSearch && matchesType;
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'ASSET': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'LIABILITY': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'EQUITY': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'INCOME': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'EXPENSE': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-6 p-2 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="bg-surface border border-border rounded-3xl p-6 flex justify-between items-center shadow-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <PieChart size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">Chart of Accounts</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">General Ledger Structure</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-2xl border border-border shadow-inner">
                        <Filter size={14} className="ml-2 text-muted-foreground" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-transparent text-xs font-bold uppercase text-foreground focus:outline-none p-1"
                        >
                            <option value="ALL">All Types</option>
                            <option value="ASSET">Assets</option>
                            <option value="LIABILITY">Liabilities</option>
                            <option value="EQUITY">Equity</option>
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expenses</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground font-bold focus:outline-none focus:border-primary transition-all w-64 shadow-inner"
                            placeholder="Search accounts..."
                        />
                    </div>

                    {/* Add Account Button (Disabled for now as per minimal scope, or we can add later) */}
                    {/* <Button className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow flex gap-2 items-center">
                        <Plus size={16} /> New Account
                    </Button> */}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-0 relative">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/30 sticky top-0 z-10 border-b border-border backdrop-blur-md">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-32">Code</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Name</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Type</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Parent / Category</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredAccounts.map((acc) => (
                                <tr key={acc.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="font-mono text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg inline-block border border-border">
                                            {acc.code}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-foreground text-sm">{acc.name}</span>
                                            {acc.description && (
                                                <span className="text-[10px] text-muted-foreground mt-1">{acc.description}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest uppercase ${getTypeColor(acc.type)}`}>
                                            {acc.type}
                                        </span>
                                    </td>
                                    <td className="p-6 text-xs font-bold text-muted-foreground">
                                        {acc.category || '-'}
                                    </td>
                                    <td className="p-6 text-right">
                                        <span className={`text-sm font-black ${acc.balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                                            ₹{Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
