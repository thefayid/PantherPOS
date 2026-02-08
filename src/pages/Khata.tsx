import { useState, useEffect, useCallback } from 'react';
import { customerService, type Customer } from '../services/customerService';
import { whatsappService } from '../services/whatsappService';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Search, Send, IndianRupee, Users, AlertCircle, ArrowUpRight, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

export default function Khata() {
    const [debtors, setDebtors] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [summary, setSummary] = useState({ totalBalance: 0, customerCount: 0 });
    const [loading, setLoading] = useState(true);

    // Ledger Modal State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [allDebtors, stats] = await Promise.all([
                customerService.getCustomersWithBalance(),
                customerService.getReceivablesSummary()
            ]);
            setDebtors(allDebtors);
            setSummary(stats);
        } catch (error) {
            console.error('Failed to load Khata data:', error);
            toast.error('Failed to load credit data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefreshLedger = async (cid: number) => {
        setLedgerEntries(await customerService.getLedger(cid));
    };

    const openLedger = async (c: Customer) => {
        setSelectedCustomer(c);
        handleRefreshLedger(c.id);
    };

    const handleTakePayment = async () => {
        if (!selectedCustomer) return;
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Invalid amount');
            return;
        }
        try {
            await customerService.addPayment(selectedCustomer.id, amount, paymentNotes);
            toast.success('Payment Received & Ledger Updated');
            setPaymentAmount('');
            setPaymentNotes('');
            handleRefreshLedger(selectedCustomer.id);
            loadData(); // Refresh main list
        } catch (error) {
            console.error(error);
            toast.error('Failed to record payment');
        }
    };

    const sendReminder = (c: Customer) => {
        const success = whatsappService.sendBalanceReminder(c);
        if (success) {
            toast.success(`Reminder sent to ${c.name}`);
        } else {
            toast.error('Customer has no phone number');
        }
    };

    const filteredDebtors = debtors.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.phone?.includes(search)
    );

    return (
        <div className="h-full bg-background text-foreground flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <IndianRupee className="text-primary w-8 h-8" />
                        CUSTOMER KHATA
                    </h1>
                    <p className="text-muted-foreground font-medium">Manage outstanding credit and payment collections</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-surface border border-border px-6 py-3 rounded-2xl shadow-sm text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Receivable</p>
                        <p className="text-2xl font-black text-rose-500">₹{summary.totalBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-surface border border-border px-6 py-3 rounded-2xl shadow-sm text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Debtors</p>
                        <p className="text-2xl font-black text-primary">{summary.customerCount}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search debtor name or phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-surface text-foreground pl-12 pr-4 py-3.5 rounded-2xl border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-surface rounded-3xl border border-border shadow-2xl">
                <Table
                    data={filteredDebtors}
                    columns={[
                        {
                            header: 'Customer',
                            accessor: (c) => (
                                <div className="flex items-center gap-4 py-1">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-black text-foreground">{c.name}</div>
                                        <div className="text-xs text-muted-foreground">{c.phone || 'No Phone'}</div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            header: 'Outstanding Balance',
                            className: 'text-right',
                            accessor: (c) => (
                                <div className="text-right">
                                    <div className="text-lg font-black text-rose-500">₹{c.balance.toFixed(2)}</div>
                                    {c.last_visit && (
                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                            Last Activity: {new Date(c.last_visit).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            )
                        },
                        {
                            header: 'Actions',
                            className: 'text-right',
                            accessor: (c) => (
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => openLedger(c)}
                                        className="p-2.5 bg-muted/50 hover:bg-primary/20 hover:text-primary rounded-xl transition-all group"
                                        title="Collect Payment & View Ledger"
                                    >
                                        <History size={18} />
                                    </button>
                                    <button
                                        onClick={() => sendReminder(c)}
                                        className="p-2.5 bg-muted/50 hover:bg-emerald-500/20 hover:text-emerald-500 rounded-xl transition-all"
                                        title="Send WhatsApp Reminder"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                />

                {debtors.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Users className="w-16 h-16 opacity-10 mb-4" />
                        <p className="font-bold">No active debtors found.</p>
                        <p className="text-xs uppercase tracking-widest mt-1 opacity-50">Zero balance accounts are not shown here.</p>
                    </div>
                )}
            </div>

            {/* Ledger & Payment Modal */}
            <Modal
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                title={selectedCustomer ? `Khata Ledger: ${selectedCustomer.name}` : ''}
                size="lg"
            >
                <div className="space-y-6">
                    {/* Quick Payment Strip */}
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Current Due Balance</p>
                            <p className="text-3xl font-black text-rose-500">₹{selectedCustomer?.balance.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    className="bg-background border border-border rounded-xl pl-7 pr-3 py-3 w-32 font-black focus:border-primary focus:outline-none"
                                    placeholder="0"
                                />
                            </div>
                            <Button onClick={handleTakePayment} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6">
                                RECORD PAYMENT
                            </Button>
                        </div>
                    </div>

                    {/* Ledger List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <ArrowUpRight size={14} />
                            Transaction History
                        </h3>
                        <div className="border border-border rounded-2xl overflow-hidden bg-background">
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Date</th>
                                            <th className="px-4 py-3 text-left">Details</th>
                                            <th className="px-4 py-3 text-right">Debit</th>
                                            <th className="px-4 py-3 text-right">Credit</th>
                                            <th className="px-4 py-3 text-right">Running</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border font-medium">
                                        {ledgerEntries.map((entry, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20">
                                                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(entry.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-xs">{entry.description}</td>
                                                <td className="px-4 py-3 text-right text-rose-500">{entry.type === 'DEBIT' ? `₹${entry.amount}` : '-'}</td>
                                                <td className="px-4 py-3 text-right text-emerald-500">{entry.type === 'CREDIT' ? `₹${entry.amount}` : '-'}</td>
                                                <td className="px-4 py-3 text-right font-black">₹{entry.balance_after.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {ledgerEntries.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground opacity-30 italic">No ledger entries found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
