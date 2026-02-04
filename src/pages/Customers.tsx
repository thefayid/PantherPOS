import { useState, useEffect, useCallback } from 'react';
import { customerService, type Customer } from '../services/customerService';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { CustomerForm } from '../components/CustomerForm';
import { Search, Plus, Pencil, Trash2, ShoppingBag, Calendar } from 'lucide-react';
import { useKeyboard } from '../hooks/useKeyboard';
import MobileCustomers from '../components/mobile/MobileCustomers';

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

    const [viewingLedger, setViewingLedger] = useState<Customer | undefined>(undefined);
    const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const loadCustomers = useCallback(async () => {
        try {
            const data = search.length > 0 ? await customerService.search(search) : await customerService.getAll();
            setCustomers(data);
        } catch (error) { console.error('Failed to load customers:', error); }
    }, [search]);

    useEffect(() => { const timeout = setTimeout(loadCustomers, 300); return () => clearTimeout(timeout); }, [loadCustomers]);
    useKeyboard({ 'f': (e) => { e.preventDefault(); document.getElementById('customer-search')?.focus(); } });

    const handleSave = async (customerData: Omit<Customer, 'id' | 'total_purchases' | 'created_at'>) => {
        try { if (editingCustomer) { await customerService.update({ ...editingCustomer, ...customerData }); } else { await customerService.create(customerData); } setIsModalOpen(false); setEditingCustomer(undefined); loadCustomers(); } catch (error) { alert('Failed to save customer.'); }
    };

    const handleDelete = async (id: number) => { if (!confirm('Delete this customer?')) return; try { await customerService.delete(id); loadCustomers(); } catch (error) { alert('Failed to delete customer'); } };
    const openEdit = (c: Customer) => { setEditingCustomer(c); setIsModalOpen(true); };
    const openAdd = () => { setEditingCustomer(undefined); setIsModalOpen(true); };



    const viewHistory = async (c: Customer) => { console.log('View history for', c.id); /* Implementation pending */ };
    const viewLedger = async (c: Customer) => { setViewingLedger(c); handleRefreshLedger(c.id); };
    const handleRefreshLedger = async (cid: number) => { setLedgerEntries(await customerService.getLedger(cid)); };

    const handleTakePayment = async () => {
        if (!viewingLedger) return;
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) { alert('Invalid amount'); return; }
        try { await customerService.addPayment(viewingLedger.id, amount, paymentNotes); alert('Payment Recorded'); setPaymentAmount(''); setPaymentNotes(''); handleRefreshLedger(viewingLedger.id); loadCustomers(); } catch (error) { console.error(error); alert('Failed to record payment'); }
    };

    return (
        <div className="h-full bg-background text-foreground overflow-hidden">
            {/* Mobile View */}
            <div className="md:hidden h-full">
                <MobileCustomers
                    customers={customers}
                    search={search}
                    onSearchChange={setSearch}
                    onAdd={openAdd}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onViewLedger={viewLedger}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex flex-col h-full p-6">
                <h1 className="text-3xl font-bold mb-6 tracking-tight">Customers</h1>

                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center bg-surface p-4 rounded-xl border border-border shadow-lg">
                    <div className="w-full md:w-96 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input
                            id="customer-search"
                            type="text"
                            placeholder="Search customers..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-muted/20 text-foreground pl-10 pr-4 py-2.5 rounded-lg border border-border focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                        />
                    </div>
                    <button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 font-medium transition-all group">
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        <span>Add Customer</span>
                    </button>
                </div>

                <div className="flex-1 bg-surface rounded-xl border border-border flex flex-col overflow-hidden shadow-xl">
                    <div className="flex-1 overflow-auto">
                        <Table
                            data={customers}
                            columns={[
                                {
                                    header: 'Customer Details',
                                    className: 'w-1/3',
                                    accessor: (c) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-background border border-border flex items-center justify-center text-lg font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <span className="bg-muted/50 px-1.5 py-0.5 rounded border border-border">ID: {c.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Contact Info',
                                    className: 'w-1/3',
                                    accessor: (c) => (
                                        <div className="text-sm space-y-1">
                                            {c.phone && <div className="text-foreground flex items-center gap-2"><span className="text-muted-foreground text-xs">Ph:</span> {c.phone}</div>}
                                            {c.email && <div className="text-muted-foreground text-xs">{c.email}</div>}
                                            {c.address && <div className="text-muted-foreground text-xs truncate max-w-[200px]" title={c.address}>{c.address}</div>}
                                        </div>
                                    )
                                },
                                {
                                    header: 'Balance',
                                    className: 'text-right',
                                    accessor: (c) => (
                                        <div>
                                            <div className={`font-bold ${(c.balance || 0) > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                                                ₹{(c.balance || 0).toFixed(2)}
                                            </div>
                                            {(c.balance || 0) > 0 && <span className="text-[10px] text-destructive uppercase font-bold tracking-wider">Due</span>}
                                        </div>
                                    )
                                },
                                {
                                    header: 'Actions',
                                    className: 'text-right',
                                    accessor: (c) => (
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); viewLedger(c); }}
                                                className="p-2 hover:bg-blue-500/10 rounded-lg text-muted-foreground hover:text-blue-500 transition-colors"
                                                title="View Ledger"
                                            >
                                                <ShoppingBag size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); viewHistory(c); }}
                                                className="p-2 hover:bg-purple-500/10 rounded-lg text-muted-foreground hover:text-purple-500 transition-colors"
                                                title="Purchase History"
                                            >
                                                <Calendar size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                                                className="p-2 hover:bg-emerald-500/10 rounded-lg text-muted-foreground hover:text-emerald-500 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                                className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Modals - Simplified Content */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'New Customer'}>
                <CustomerForm initialData={editingCustomer} onSubmit={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            {/* Ledger/History Modals would likely use standard Modal properties now, ensuring style inheritance */}
            {viewingLedger && (
                <Modal isOpen={!!viewingLedger} onClose={() => setViewingLedger(undefined)} title={`Ledger: ${viewingLedger.name}`}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                            <div className="flex-1">
                                <label className="text-xs text-muted-foreground">Current Balance</label>
                                <div className={`text-2xl font-bold ${(viewingLedger.balance || 0) > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                                    ₹{(viewingLedger.balance || 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground">Amount</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-32 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <Button onClick={handleTakePayment} disabled={!paymentAmount} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                    Receive
                                </Button>
                            </div>
                        </div>

                        <div className="max-h-80 overflow-auto border border-border rounded-xl bg-muted/10">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/20 text-muted-foreground">
                                    <tr>
                                        <th className="p-3 text-left">Date</th>
                                        <th className="p-3 text-left">Description</th>
                                        <th className="p-3 text-right">Debit</th>
                                        <th className="p-3 text-right">Credit</th>
                                        <th className="p-3 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {ledgerEntries.map((entry, i) => (
                                        <tr key={i} className="hover:bg-muted/10 text-foreground">
                                            <td className="p-3 text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="p-3">{entry.description}</td>
                                            <td className="p-3 text-right text-destructive">{entry.debit > 0 ? `₹${entry.debit}` : '-'}</td>
                                            <td className="p-3 text-right text-emerald-500">{entry.credit > 0 ? `₹${entry.credit}` : '-'}</td>
                                            <td className="p-3 text-right font-medium">₹{entry.balance}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
