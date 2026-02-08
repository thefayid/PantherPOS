import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { saleService } from '../services/saleService';
import type { BillWithItems } from '../services/saleService';
import { printerService } from '../services/printerService';
import { PinModal } from '../components/PinModal';
import type { Bill } from '../types/db';
import { Search, Calendar, RefreshCw, Eye, Printer, XOctagon, Banknote, CreditCard, Smartphone, TrendingUp, FileText, MessageSquare, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { whatsappService } from '../services/whatsappService';
import { exportService } from '../services/exportService';

const BillPreviewItems = ({ billId }: { billId: number }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        saleService.getBillDetails(billId)
            .then(data => {
                if (active) {
                    setItems(data.items);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [billId]);

    if (loading) return <div className="p-4 text-center text-[10px] font-black uppercase text-muted-foreground animate-pulse tracking-widest">Decoding line items...</div>;

    return (
        <div className="divide-y divide-border/50">
            {items.map((item, i) => (
                <div key={i} className="p-3 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="text-[10px] font-bold text-foreground truncate uppercase">{item.productName}</div>
                        <div className="text-[9px] text-muted-foreground font-mono">{item.barcode}</div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-[10px] font-black text-foreground">₹{(item.quantity * item.price).toFixed(2)}</div>
                        <div className="text-[9px] text-muted-foreground uppercase">{item.quantity} x ₹{item.price}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function Sales() {
    const navigate = useNavigate();
    const [bills, setBills] = useState<Bill[]>([]);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [status, setStatus] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ total: 0, count: 0, gross: 0, refunds: 0 });
    const [todaySummary, setTodaySummary] = useState({ total: 0, count: 0, gross: 0, refunds: 0 });

    const [selectedBill, setSelectedBill] = useState<BillWithItems | null>(null);
    const [previewBill, setPreviewBill] = useState<Bill & { customer_name?: string; customer_phone?: string } | null>(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'CANCEL' | 'EDIT', bill: Bill | BillWithItems } | null>(null);

    // New states for custom modals replacement
    const [phoneModalBill, setPhoneModalBill] = useState<Bill & { customer_name?: string; customer_phone?: string } | null>(null);
    const [manualPhone, setManualPhone] = useState('');
    const [cancelModalBill, setCancelModalBill] = useState<Bill | null>(null);

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
        setCancelModalBill(bills.find(b => b.id === billId) || null);
    };

    const confirmCancel = async () => {
        if (!cancelModalBill) return;
        try {
            await saleService.cancelBill(cancelModalBill.id);
            fetchData();
            if (selectedBill?.id === cancelModalBill.id) setSelectedBill(null);
            setCancelModalBill(null);
        } catch (error) {
            alert(String(error));
        }
    };

    const performEdit = (bill: BillWithItems) => {
        // Keeping edit for now, but usually it should also be a modal if confirm() is broken.
        // For now, let's fix the critical prompt() issue first.
        navigate('/', { state: { editBill: bill } });
    };

    const handlePinSuccess = () => {
        if (!pendingAction) return;
        if (pendingAction.type === 'CANCEL') { handleCancel(pendingAction.bill.id); } else if (pendingAction.type === 'EDIT') { performEdit(pendingAction.bill as BillWithItems); }
        setPendingAction(null);
    };

    const PaymentIcon = ({ mode }: { mode: string }) => {
        switch (mode) {
            case 'CASH': return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Banknote size={12} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Cash</span>
                </div>
            );
            case 'CARD': return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <CreditCard size={12} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Card</span>
                </div>
            );
            case 'UPI': return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <Smartphone size={12} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-wider">UPI</span>
                </div>
            );
            default: return null;
        }
    };

    const handleWhatsAppShare = async (bill: Bill & { customer_name?: string; customer_phone?: string }) => {
        try {
            const fullBill = await saleService.getBillDetails(bill.id);
            // Ensure customer info from the search results is kept if missing in bill record
            const enrichedBill = {
                ...fullBill,
                customer_phone: bill.customer_phone || (fullBill as any).customer_phone,
                customer_name: bill.customer_name || (fullBill as any).customer_name
            };

            if (enrichedBill.customer_phone) {
                whatsappService.sendReceipt(enrichedBill, enrichedBill.customer_name);
            } else {
                setManualPhone('');
                setPhoneModalBill(enrichedBill as any);
            }
        } catch (error) {
            alert('Failed to fetch bill details for sharing');
        }
    };

    const handleShareReceiptPdf = async (bill: Bill) => {
        try {
            const fullBill = await saleService.getBillDetails(bill.id);
            const path = await exportService.generateBillPdf(fullBill);

            if (path && navigator.share) {
                // Try to share the file if supported (mobile browsers)
                try {
                    const response = await fetch(path);
                    const blob = await response.blob();
                    const file = new File([blob], `Receipt_${bill.bill_no}.pdf`, { type: 'application/pdf' });

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: `Receipt #${bill.bill_no}`,
                            text: `Bill receipt for invoice #${bill.bill_no}`
                        });
                    }
                } catch (shareError) {
                    console.log('Native share failed or not applicable, file saved locally.');
                }
            }
        } catch (error) {
            alert('Failed to generate or share PDF');
        }
    };

    const submitManualWhatsApp = async () => {
        if (!phoneModalBill || !manualPhone) return;
        const fullBill = await saleService.getBillDetails(phoneModalBill.id);
        whatsappService.sendReceipt({ ...fullBill, customer_phone: manualPhone } as any, phoneModalBill.customer_name);
        setPhoneModalBill(null);
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
                    <div className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Today's Sales (Net)</div>
                    <div className="text-3xl font-bold text-foreground">₹{todaySummary.total.toFixed(2)}</div>
                    <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-emerald-500">G: ₹{todaySummary.gross?.toFixed(2) || '0.00'}</span>
                        <span className="text-red-500">R: ₹{todaySummary.refunds?.toFixed(2) || '0.00'}</span>
                    </div>
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
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Net Sales</div>
                    <div className="text-3xl font-bold text-foreground">₹{summary.total.toFixed(2)}</div>
                    <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-emerald-500">Gross: ₹{summary.gross?.toFixed(2) || '0.00'}</span>
                        <span className="text-red-500">Ref: ₹{summary.refunds?.toFixed(2) || '0.00'}</span>
                    </div>
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
                <button onClick={() => { console.log('Manual Refresh'); fetchData(); }} className="p-2 rounded-lg bg-surface hover:bg-muted text-foreground border border-border transition-colors shadow-sm" title="Refresh">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>



            {/* Main Content Layout */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sales Table */}
                <div className={`flex-1 bg-surface rounded-xl border border-border flex flex-col overflow-hidden shadow-xl transition-all duration-300 ${previewBill ? 'mr-[400px]' : ''}`}>
                    <div className="flex-1 overflow-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider">Bill No</th>
                                    <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider">Date & Time</th>
                                    <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider">Status</th>
                                    <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider">Customer</th>
                                    <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider">Payment</th>
                                    <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider text-right">Total</th>
                                    <th className="p-4 font-medium border-b border-border text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map(bill => (
                                    <tr key={bill.id} className={`border-b border-border hover:bg-muted/50 transition-colors group cursor-pointer ${previewBill?.id === bill.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`} onClick={() => setPreviewBill(bill)}>
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
                                        <td className="p-4 text-sm">
                                            <div className="text-foreground font-medium">{(bill as any).customer_name || 'Walk-in'}</div>
                                            <div className="text-xs text-muted-foreground">{(bill as any).customer_phone || ''}</div>
                                        </td>
                                        <td className="p-4">
                                            <PaymentIcon mode={bill.payment_mode} />
                                        </td>
                                        <td className="p-4 text-sm text-right font-bold text-foreground">₹{bill.total.toFixed(2)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(bill as any); }}
                                                    className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-colors shadow-sm"
                                                    title="Share on WhatsApp"
                                                >
                                                    <MessageSquare size={16} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); saleService.getBillDetails(bill.id).then(d => { setSelectedBill(d); }); }}
                                                    className="p-2 hover:bg-blue-500/10 rounded-lg text-muted-foreground hover:text-blue-500 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); saleService.getBillDetails(bill.id).then(d => printerService.printReceipt(d)); }}
                                                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Print Receipt"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                {bill.status === 'PAID' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancelClick(bill); }}
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
                                        <td colSpan={7} className="p-20 text-center text-muted-foreground flex flex-col items-center justify-center">
                                            <FileText size={48} className="mb-4 opacity-50" />
                                            <p>No sales records found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Preview Sidebar */}
                {previewBill && (
                    <div className="fixed right-6 top-[180px] bottom-6 w-[380px] bg-surface border border-border rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-20">
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-foreground uppercase tracking-wider text-xs">Quick Preview: #{previewBill.bill_no}</h3>
                            <button onClick={() => setPreviewBill(null)} className="p-1 hover:bg-muted rounded-lg">
                                <ChevronRight size={20} className="rotate-180" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-4 no-scrollbar">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">TOTAL VALUATION</div>
                                <div className="text-3xl font-black text-foreground">₹{previewBill.total.toFixed(2)}</div>
                                <div className="mt-2 flex items-center justify-between">
                                    <PaymentIcon mode={previewBill.payment_mode} />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(previewBill.date).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">CUSTOMER INTELLIGENCE</div>
                                <div className="p-3 bg-muted/20 border border-border rounded-xl">
                                    <div className="text-sm font-bold text-foreground">{(previewBill as any).customer_name || 'Walk-in Customer'}</div>
                                    <div className="text-xs text-muted-foreground">{(previewBill as any).customer_phone || 'No phone data'}</div>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <Button
                                            onClick={() => handleWhatsAppShare(previewBill)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-[9px] font-black uppercase tracking-widest gap-2 shadow-glow"
                                        >
                                            <MessageSquare size={14} /> WhatsApp
                                        </Button>
                                        <Button
                                            onClick={() => handleShareReceiptPdf(previewBill)}
                                            variant="secondary"
                                            className="h-8 text-[9px] font-black uppercase tracking-widest gap-2"
                                        >
                                            <FileText size={14} /> Share PDF
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">BILLING DATA</div>
                                    <button
                                        onClick={() => saleService.getBillDetails(previewBill.id).then(d => setSelectedBill(d))}
                                        className="text-[10px] font-black text-primary hover:underline uppercase"
                                    >
                                        Full Report
                                    </button>
                                </div>
                                <div className="rounded-xl border border-border overflow-hidden">
                                    <div className="p-3 bg-muted text-[10px] font-black uppercase tracking-widest flex border-b border-border">
                                        <span className="flex-1">Product</span>
                                        <span className="w-16 text-right">Qty/Price</span>
                                    </div>
                                    <div className="max-h-60 overflow-auto no-scrollbar bg-surface/50">
                                        <BillPreviewItems billId={previewBill.id} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-border grid grid-cols-2 gap-3">
                            <Button variant="secondary" onClick={() => saleService.getBillDetails(previewBill.id).then(d => printerService.printReceipt(d))} className="text-[10px] font-black uppercase tracking-widest h-10">
                                <Printer size={14} className="mr-2" /> Print
                            </Button>
                            <Button onClick={() => saleService.getBillDetails(previewBill.id).then(d => setSelectedBill(d))} className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest h-10">
                                <Eye size={14} className="mr-2" /> Full Doc
                            </Button>
                        </div>
                    </div>
                )}
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

            {/* Manual Phone Entry Modal */}
            <Modal isOpen={!!phoneModalBill} onClose={() => setPhoneModalBill(null)} title="WhatsApp Sharing" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Enter customer WhatsApp number (with country code):</p>
                    <input
                        autoFocus
                        type="text"
                        placeholder="e.g., 919876543210"
                        value={manualPhone}
                        onChange={e => setManualPhone(e.target.value)}
                        className="w-full bg-muted/20 text-foreground px-4 py-3 rounded-xl border border-border focus:border-primary focus:outline-none text-lg font-bold"
                        onKeyDown={e => e.key === 'Enter' && submitManualWhatsApp()}
                    />
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setPhoneModalBill(null)}>Cancel</Button>
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={submitManualWhatsApp}>
                            <MessageSquare size={16} className="mr-2" /> Share
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Cancel Confirmation Modal */}
            <Modal isOpen={!!cancelModalBill} onClose={() => setCancelModalBill(null)} title="Cancel Bill?" size="md">
                <div className="space-y-4">
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
                        This action will return all items to stock and invalidate this bill. This cannot be undone.
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setCancelModalBill(null)}>No, Keep It</Button>
                        <Button className="flex-1 bg-destructive text-white h-12" onClick={confirmCancel}>
                            Confirm Cancellation
                        </Button>
                    </div>
                </div>
            </Modal>

            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={handlePinSuccess}
                title={pendingAction?.type === 'CANCEL' ? 'Manager PIN Required to Cancel' : 'Manager PIN Required to Edit'}
            />
        </div>
    );
}
