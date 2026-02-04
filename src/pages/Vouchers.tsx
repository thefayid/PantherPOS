import { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import type { Voucher, Account } from '../types/db';
import {
    Plus,
    Search,
    ArrowRightLeft,
    Calendar,
    History,
    X,
    Check
} from 'lucide-react';
import { Button } from '../components/Button';

export default function Vouchers() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    // New Voucher State
    const [newVoucher, setNewVoucher] = useState({
        type: 'JOURNAL' as const,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [
            { account_id: 0, type: 'DEBIT' as const, amount: 0, description: '' },
            { account_id: 0, type: 'CREDIT' as const, amount: 0, description: '' }
        ]
    });

    useEffect(() => {
        loadData();
    }, [dateFrom, dateTo]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [v, a] = await Promise.all([
                accountingService.getVouchers(dateFrom, dateTo),
                accountingService.getAccounts()
            ]);
            setVouchers(v);
            setAccounts(a);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePostVoucher = async () => {
        try {
            // Validate
            if (newVoucher.items.some(i => i.account_id === 0 || i.amount <= 0)) {
                alert('Please fill all account and amount fields');
                return;
            }

            const totalAmount = newVoucher.items
                .filter((i: any) => i.type === 'DEBIT')
                .reduce((sum: number, i: any) => sum + i.amount, 0);

            await accountingService.postVoucher({
                date: newVoucher.date,
                type: newVoucher.type,
                total_amount: totalAmount,
                notes: newVoucher.notes
            }, newVoucher.items);

            setIsModalOpen(false);
            loadData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const addItem = () => {
        setNewVoucher({
            ...newVoucher,
            items: [...newVoucher.items, { account_id: 0, type: 'DEBIT', amount: 0, description: '' }]
        });
    };

    const removeItem = (idx: number) => {
        setNewVoucher({
            ...newVoucher,
            items: newVoucher.items.filter((_, i) => i !== idx)
        });
    };

    const filteredVouchers = vouchers.filter((v: Voucher) =>
        (v.voucher_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full gap-6 p-2 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="bg-surface border border-border rounded-3xl p-6 flex justify-between items-center shadow-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <ArrowRightLeft size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">Voucher Ledger</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Double-entry audit trail</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground font-bold focus:outline-none focus:border-primary transition-all w-64 shadow-inner"
                            placeholder="Voucher # or notes..."
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-2xl border border-border shadow-inner">
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent text-[10px] font-black uppercase text-foreground focus:outline-none" />
                        <span className="text-muted-foreground/30">→</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent text-[10px] font-black uppercase text-foreground focus:outline-none" />
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow flex gap-2 items-center"
                    >
                        <Plus className="w-4 h-4" /> New Entry
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-0 relative">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/30 sticky top-0 z-10 border-b border-border backdrop-blur-md">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Voucher # / Date</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Type</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Notes</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredVouchers.map((v) => (
                                <tr key={v.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-foreground uppercase tracking-tight text-sm">{v.voucher_no}</span>
                                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-muted-foreground">
                                                <Calendar size={10} />
                                                {new Date(v.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest
                                            ${v.type === 'SALES' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                v.type === 'PURCHASE' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    v.type === 'JOURNAL' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                        'bg-primary/10 text-primary border-primary/20'}
                                         uppercase`}>
                                            {v.type}
                                        </span>
                                    </td>
                                    <td className="p-6 font-black text-foreground text-sm">
                                        ₹{(v.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-6 text-xs font-bold text-muted-foreground line-clamp-1 max-w-md">
                                        {v.notes || '-'}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex justify-center">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                                <Check size={14} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredVouchers.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-32 text-center opacity-20">
                                        <div className="flex flex-col items-center gap-6">
                                            <History size={60} strokeWidth={1} />
                                            <p className="font-black text-xs uppercase tracking-[0.3em]">No vouchers found in this period</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Voucher Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-surface border border-border rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
                            <div>
                                <h2 className="text-xl font-black text-foreground tracking-tighter uppercase">New Accounting Entry</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Record manual double-entry transaction</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-auto custom-scrollbar flex flex-col gap-8">
                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">Voucher Type</label>
                                    <select
                                        value={newVoucher.type}
                                        onChange={e => setNewVoucher({ ...newVoucher, type: e.target.value as any })}
                                        className="w-full bg-muted/20 border border-border rounded-2xl p-4 text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                                    >
                                        <option value="JOURNAL">JOURNAL</option>
                                        <option value="RECEIPT">RECEIPT</option>
                                        <option value="PAYMENT">PAYMENT</option>
                                        <option value="CONTRA">CONTRA</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">Transaction Date</label>
                                    <input
                                        type="date"
                                        value={newVoucher.date}
                                        onChange={e => setNewVoucher({ ...newVoucher, date: e.target.value })}
                                        className="w-full bg-muted/20 border border-border rounded-2xl p-4 text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">Voucher Note</label>
                                    <input
                                        type="text"
                                        placeholder="Brief description..."
                                        value={newVoucher.notes}
                                        onChange={e => setNewVoucher({ ...newVoucher, notes: e.target.value })}
                                        className="w-full bg-muted/20 border border-border rounded-2xl p-4 text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Ledger Items */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end mb-2">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Entry Particulars</h4>
                                    <Button variant="secondary" onClick={addItem} className="text-[10px] font-black px-4 rounded-xl"><Plus className="mr-1 w-3 h-3" /> Add Account</Button>
                                </div>

                                <div className="space-y-3">
                                    {newVoucher.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 items-center bg-muted/5 p-4 rounded-2xl border border-border/50 animate-in slide-in-from-right-4 duration-300">
                                            <div className="w-24 shrink-0">
                                                <select
                                                    value={item.type}
                                                    onChange={e => {
                                                        const items = [...newVoucher.items];
                                                        items[idx].type = e.target.value as any;
                                                        setNewVoucher({ ...newVoucher, items });
                                                    }}
                                                    className={`w-full p-3 rounded-xl text-[10px] font-black tracking-widest focus:outline-none border
                                                        ${item.type === 'DEBIT' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}
                                                >
                                                    <option value="DEBIT">DEBIT</option>
                                                    <option value="CREDIT">CREDIT</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <select
                                                    value={item.account_id}
                                                    onChange={e => {
                                                        const items = [...newVoucher.items];
                                                        items[idx].account_id = Number(e.target.value);
                                                        setNewVoucher({ ...newVoucher, items });
                                                    }}
                                                    className="w-full bg-background border border-border rounded-xl p-3 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                                                >
                                                    <option value={0}>Select Account...</option>
                                                    {accounts.map(acc => (
                                                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-40">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={item.amount || ''}
                                                    onChange={e => {
                                                        const items = [...newVoucher.items];
                                                        items[idx].amount = Number(e.target.value);
                                                        setNewVoucher({ ...newVoucher, items });
                                                    }}
                                                    className="w-full bg-background border border-border rounded-xl p-3 text-sm font-black text-foreground focus:outline-none focus:border-primary text-right"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeItem(idx)}
                                                className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center">
                            <div className="flex gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground">Total debits</span>
                                    <span className="text-sm font-black text-emerald-500">
                                        ₹{(newVoucher.items.filter((i: any) => i.type === 'DEBIT').reduce((sum: number, i: any) => sum + i.amount, 0) || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground">Total credits</span>
                                    <span className="text-sm font-black text-blue-500">
                                        ₹{(newVoucher.items.filter((i: any) => i.type === 'CREDIT').reduce((sum: number, i: any) => sum + i.amount, 0) || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                                <Button
                                    onClick={handlePostVoucher}
                                    className="bg-primary hover:brightness-110 text-primary-foreground px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow"
                                >
                                    Confirm Posting
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
