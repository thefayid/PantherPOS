import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { saleService } from '../services/saleService';
import type { BillWithItems } from '../services/saleService';
import { printerService } from '../services/printerService';
import { PinModal } from '../components/PinModal';
import type { Bill } from '../types/db';
import { Search, Calendar, RefreshCw, Eye, Printer, XOctagon, Banknote, CreditCard, Smartphone, TrendingUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Sales() {
    const navigate = useNavigate();
    const [bills, setBills] = useState<Bill[]>([]);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [status, setStatus] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ total: 0, count: 0 });
    const [todaySummary, setTodaySummary] = useState({ total: 0, count: 0 });

    const [selectedBill, setSelectedBill] = useState<BillWithItems | null>(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'CANCEL' | 'EDIT', bill: Bill | BillWithItems } | null>(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const filters = { search, startDate: dateFrom ? new Date(dateFrom).toISOString() : undefined, endDate: dateTo ? new Date(dateTo).toISOString() : undefined, status };
            const [salesResults, summaryResult, todayResult] = await Promise.all([
                saleService.getSales(filters),
                saleService.getSalesSummary(filters),
                saleService.getTodaySummary()
            ]);
            setBills(salesResults);
            setSummary(summaryResult);
            setTodaySummary(todayResult);

        } catch (error) {
            console.error('Failed to fetch sales data:', error);
        } finally {
            setLoading(false);
        }
    }, [search, dateFrom, dateTo, status]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCancelClick = (bill: Bill) => {
        if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') { handleCancel(bill.id); } else { setPendingAction({ type: 'CANCEL', bill }); setShowPinModal(true); }
    };

    const handleCancel = async (billId: number) => {
        if (!confirm('Are you sure you want to cancel this bill? Items will be returned to stock.')) return;
        try { await saleService.cancelBill(billId); fetchData(); if (selectedBill?.id === billId) setSelectedBill(null); } catch (error) { alert(String(error)); }
    };

    const performEdit = (bill: BillWithItems) => {
        if (!confirm("Editing a bill will reverse its stock deduction and let you save it as a new version. Continue?")) return;
        navigate('/', { state: { editBill: bill } });
    };

    const handlePinSuccess = () => {
        if (!pendingAction) return;
        if (pendingAction.type === 'CANCEL') { handleCancel(pendingAction.bill.id); } else if (pendingAction.type === 'EDIT') { performEdit(pendingAction.bill as BillWithItems); }
        setPendingAction(null);
    };

    const PaymentIcon = ({ mode }: { mode: string }) => {
        switch (mode) {
            case 'CASH': return <Banknote size={12} className="mr-1.5 opacity-50" />;
            case 'CARD': return <CreditCard size={12} className="mr-1.5 opacity-50" />;
            case 'UPI': return <Smartphone size={12} className="mr-1.5 opacity-50" />;
            default: return null;
        }
    };


    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <h1 className="text-3xl font-bold mb-6 tracking-tight text-foreground">Sales History</h1>

            {/* Summary Section */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={48} className="text-primary" />
                    </div>
                    <div className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Today's Sales</div>
                    <div className="text-3xl font-bold text-foreground">₹{todaySummary.total.toFixed(2)}</div>
                    <div className="absolute bottom-0 left-0 h-1 bg-primary w-full opacity-50"></div>
                </div>

                <div className="bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText size={48} className="text-blue-500" />
                    </div>
                    <div className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">Today's Bills</div>
                    <div className="text-3xl font-bold text-foreground">{todaySummary.count}</div>
                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500 w-full opacity-50"></div>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={48} />
                    </div>
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Filtered Sales</div>
                    <div className="text-3xl font-bold text-foreground">₹{summary.total.toFixed(2)}</div>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText size={48} />
                    </div>
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Filtered Bills</div>
                    <div className="text-3xl font-bold text-foreground">{summary.count}</div>
                </div>
            </div>


            {/* Filter Bar */}
            <div className="bg-surface p-4 rounded-xl border border-border mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search Bill No..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-muted/20 text-foreground pl-10 pr-4 py-2 rounded-lg border border-border focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 bg-muted/20 rounded-lg p-1 border border-border">
                    <Calendar size={16} className="ml-2 text-muted-foreground" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="bg-transparent text-foreground border-none focus:ring-0 text-sm p-1.5"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="bg-transparent text-foreground border-none focus:ring-0 text-sm p-1.5"
                    />
                </div>
                <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="bg-muted/20 text-foreground border border-border rounded-lg py-2 px-3 text-sm focus:border-primary/50 focus:outline-none"
                >
                    <option value="ALL">All Status</option>
                    <option value="PAID">Paid</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
                <button onClick={fetchData} className="p-2 rounded-lg bg-surface hover:bg-muted text-foreground border border-border transition-colors shadow-sm" title="Refresh">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Sales Table */}
            <div className="flex-1 bg-surface rounded-xl border border-border flex flex-col overflow-hidden shadow-xl">
                <div className="flex-1 overflow-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider">Bill No</th>
                                <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider">Date & Time</th>
                                <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider">Status</th>
                                <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider">Payment</th>
                                <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider text-right">Total</th>
                                <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(bill => (
                                <tr key={bill.id} className="border-b border-border hover:bg-muted/50 transition-colors group">
                                    <td className="p-4 text-sm font-bold text-foreground">#{bill.bill_no}</td>
                                    <td className="p-4 text-sm">
                                        <div className="text-foreground">{new Date(bill.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${bill.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            bill.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                            }`}>
                                            {bill.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <PaymentIcon mode={bill.payment_mode} />
                                            {bill.payment_mode}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-right font-bold text-foreground">₹{bill.total.toFixed(2)}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { saleService.getBillDetails(bill.id).then(d => { setSelectedBill(d); }); }}
                                                className="p-2 hover:bg-blue-500/10 rounded-lg text-muted-foreground hover:text-blue-500 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => { saleService.getBillDetails(bill.id).then(d => printerService.printReceipt(d)); }}
                                                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                title="Print Receipt"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            {bill.status === 'PAID' && (
                                                <button
                                                    onClick={() => handleCancelClick(bill)}
                                                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Cancel Bill"
                                                >
                                                    <XOctagon size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bills.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-muted-foreground flex flex-col items-center justify-center">
                                        <FileText size={48} className="mb-4 opacity-50" />
                                        <p>No sales records found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View/Print Modal Placeholder */}
            {selectedBill && (
                <Modal isOpen={!!selectedBill} onClose={() => setSelectedBill(null)} title={`Bill #${selectedBill.bill_no}`}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end bg-muted/50 p-4 rounded-xl border border-border">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Amount</p>
                                <h2 className="text-2xl font-bold text-primary">₹{selectedBill.total.toFixed(2)}</h2>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(selectedBill.date).toLocaleString()}</span>
                        </div>

                        <div className="max-h-96 overflow-auto border border-border rounded-xl">
                            <table className="w-full text-sm">
                                <thead className="bg-muted text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-3 text-left">Item</th>
                                        <th className="p-3 text-right">Qty</th>
                                        <th className="p-3 text-right">Price</th>
                                        <th className="p-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {selectedBill.items.map((item: any, i: number) => (
                                        <tr key={i} className="hover:bg-muted/50">
                                            <td className="p-3 text-foreground">{item.productName}</td>
                                            <td className="p-3 text-right text-muted-foreground">{item.quantity}</td>
                                            <td className="p-3 text-right text-muted-foreground">₹{item.price.toFixed(2)}</td>
                                            <td className="p-3 text-right text-foreground font-medium">₹{(item.quantity * item.price).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setSelectedBill(null)}>Close</Button>
                            <Button onClick={() => printerService.printReceipt(selectedBill)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow">
                                <Printer size={16} className="mr-2" />
                                Print Receipt
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={handlePinSuccess}
                title={pendingAction?.type === 'CANCEL' ? 'Manager PIN Required to Cancel' : 'Manager PIN Required to Edit'}
            />
        </div>
    );
}
