import { useState, useEffect, useMemo, useRef } from 'react';
import { reportService } from '../services/reportService';
import { exportService } from '../services/exportService';
import { databaseService } from '../services/databaseService';
import { settingsService } from '../services/settingsService';
import { Button } from '../components/Button';
import {
    FileText, FileSpreadsheet, FileJson as FilePdf, Download, Printer, Search,
    LayoutDashboard, Package, CreditCard, Banknote, Users, Tag, AlertTriangle,
    Truck, ClipboardList, ShieldAlert, History
} from 'lucide-react';

type ReportType = 'DAILY' | 'HOURLY' | 'PAYMENTS' | 'PRODUCTS' | 'PROFIT' | 'GST' | 'HSN' | 'OUTSTANDING' | 'TOP_CUSTOMERS' | 'PURCHASE_PRODUCTS' | 'SUPPLIERS' | 'UNPAID_PURCHASE' | 'PURCHASE_INVOICES' | 'LOW_STOCK' | 'REORDER_LIST' | 'LOSS_DAMAGE' | 'TRANSACTIONS';

const REPORT_GROUPS = [
    { title: 'Sales & Performance', items: [{ id: 'DAILY', label: 'Daily Sales', icon: LayoutDashboard }, { id: 'HOURLY', label: 'Hourly Heatmap', icon: LayoutDashboard }, { id: 'PAYMENTS', label: 'Payment Methods', icon: CreditCard }] },
    { title: 'Inventory & Products', items: [{ id: 'PRODUCTS', label: 'Product Sales', icon: Package }, { id: 'PROFIT', label: 'Profit & Margin', icon: Banknote }] },
    { title: 'Purchase', items: [{ id: 'PURCHASE_PRODUCTS', label: 'Products Purchased', icon: Package }, { id: 'SUPPLIERS', label: 'Suppliers List', icon: Truck }, { id: 'UNPAID_PURCHASE', label: 'Unpaid Purchases', icon: AlertTriangle }, { id: 'PURCHASE_INVOICES', label: 'Purchase Invoices', icon: FileText }] },
    { title: 'Stock Control', items: [{ id: 'LOW_STOCK', label: 'Low Stock Warning', icon: ShieldAlert }, { id: 'REORDER_LIST', label: 'Reorder List', icon: ClipboardList }, { id: 'LOSS_DAMAGE', label: 'Loss & Damage', icon: AlertTriangle }] },
    { title: 'Finance', items: [{ id: 'TRANSACTIONS', label: 'Transaction History', icon: History }, { id: 'OUTSTANDING', label: 'Outstanding Dues', icon: Banknote }] },
    { title: 'Taxation', items: [{ id: 'GST', label: 'GST Summary', icon: Tag }, { id: 'HSN', label: 'HSN Report', icon: Tag }] },
    { title: 'Customers', items: [{ id: 'TOP_CUSTOMERS', label: 'Top Customers', icon: Users }] }
];

export default function Reports() {
    const [activeReport, setActiveReport] = useState<ReportType>('DAILY');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const componentRef = useRef<HTMLDivElement>(null);
    const didAutoSeed = useRef(false);

    const handlePrint = () => { window.print(); };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Keep YYYY-MM-DD strings for SQLite date() comparisons.
            const from = dateFrom || undefined;
            const to = dateTo || undefined;
            let result: any[] = [];
            switch (activeReport) {
                case 'DAILY': result = await reportService.getDailySales(from, to); break;
                case 'HOURLY': result = await reportService.getHourlySales(from, to); break;
                case 'PAYMENTS': result = await reportService.getPaymentSplit(from, to); break;
                case 'PRODUCTS': result = await reportService.getProductSales(from, to); break;
                case 'PROFIT': result = await reportService.getProfitMargin(from, to); break;
                case 'GST': result = await reportService.getGstSummary(from, to); break;
                case 'HSN': result = await reportService.getHsnSummary(from, to); break;
                case 'OUTSTANDING': result = await reportService.getOutstandingReceivables(from, to); break;
                case 'TOP_CUSTOMERS': result = await reportService.getTopCustomers(from, to); break;
                case 'PURCHASE_PRODUCTS': result = await reportService.getPurchaseProducts(from, to); break;
                case 'SUPPLIERS': result = await reportService.getSupplierList(); break;
                case 'UNPAID_PURCHASE': result = await reportService.getUnpaidPurchases(); break;
                case 'PURCHASE_INVOICES': result = await reportService.getPurchaseInvoiceList(from, to); break;
                case 'LOW_STOCK': result = await reportService.getLowStockWarning(); break;
                case 'REORDER_LIST': result = await reportService.getReorderList(); break;
                case 'LOSS_DAMAGE': result = await reportService.getLossAndDamage(from, to); break;
                case 'TRANSACTIONS': result = await reportService.getTransactionHistory(from, to); break;
            }

            // Auto-seed minimal demo data once if reports are empty (and bills are empty).
            // This prevents a blank Reports screen when the app already has products/customers but no sales yet.
            if (!didAutoSeed.current && (!result || result.length === 0)) {
                didAutoSeed.current = true;
                const seeded = await databaseService.seedDemoReportsIfEmpty();
                if (seeded) {
                    switch (activeReport) {
                        case 'DAILY': result = await reportService.getDailySales(from, to); break;
                        case 'HOURLY': result = await reportService.getHourlySales(from, to); break;
                        case 'PAYMENTS': result = await reportService.getPaymentSplit(from, to); break;
                        case 'PRODUCTS': result = await reportService.getProductSales(from, to); break;
                        case 'PROFIT': result = await reportService.getProfitMargin(from, to); break;
                        case 'GST': result = await reportService.getGstSummary(from, to); break;
                        case 'HSN': result = await reportService.getHsnSummary(from, to); break;
                        case 'OUTSTANDING': result = await reportService.getOutstandingReceivables(from, to); break;
                        case 'TOP_CUSTOMERS': result = await reportService.getTopCustomers(from, to); break;
                        case 'PURCHASE_PRODUCTS': result = await reportService.getPurchaseProducts(from, to); break;
                        case 'SUPPLIERS': result = await reportService.getSupplierList(); break;
                        case 'UNPAID_PURCHASE': result = await reportService.getUnpaidPurchases(); break;
                        case 'PURCHASE_INVOICES': result = await reportService.getPurchaseInvoiceList(from, to); break;
                        case 'LOW_STOCK': result = await reportService.getLowStockWarning(); break;
                        case 'REORDER_LIST': result = await reportService.getReorderList(); break;
                        case 'LOSS_DAMAGE': result = await reportService.getLossAndDamage(from, to); break;
                        case 'TRANSACTIONS': result = await reportService.getTransactionHistory(from, to); break;
                    }
                }
            }

            setData(result || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [activeReport, dateFrom, dateTo]);

    const handleExport = async (type: 'xlsx' | 'pdf' | 'csv') => {
        const fileName = `${activeReport}_Report_${new Date().toISOString().split('T')[0]}`;
        if (type === 'xlsx') exportService.exportToExcel(`${fileName}.xlsx`, data);
        if (type === 'csv') exportService.exportToCsv(`${fileName}.csv`, data);
        if (type === 'pdf') {
            // Special-case: Daily Sales should export a complete standalone document,
            // even when the current table result is minimal/empty.
            if (activeReport === 'DAILY') {
                const store = await settingsService.getSettings().catch(() => ({ store_name: 'Business' } as any));

                const reportDate = dateTo || dateFrom || new Date().toISOString().split('T')[0];
                const generatedTime = new Date().toLocaleString();

                const stats = await databaseService.query(
                    `SELECT COALESCE(SUM(total), 0) as totalSales, COUNT(*) as transactions
                     FROM bills
                     WHERE date(date, 'localtime') = ?
                     AND (status = 'PAID' OR status IS NULL OR status = '')`,
                    [reportDate]
                );
                const totalSales = Number(stats?.[0]?.totalSales || 0);
                const transactions = Number(stats?.[0]?.transactions || 0);
                const averageTicket = transactions > 0 ? totalSales / transactions : 0;

                // Previous day (optional)
                const dt = new Date(reportDate + 'T00:00:00');
                dt.setDate(dt.getDate() - 1);
                const prevDate = dt.toISOString().split('T')[0];
                const prevStats = await databaseService.query(
                    `SELECT COALESCE(SUM(total), 0) as totalSales, COUNT(*) as transactions
                     FROM bills
                     WHERE date(date, 'localtime') = ?
                     AND (status = 'PAID' OR status IS NULL OR status = '')`,
                    [prevDate]
                );
                const prevTotalSales = Number(prevStats?.[0]?.totalSales || 0);
                const prevTransactions = Number(prevStats?.[0]?.transactions || 0);
                const prevAvgTicket = prevTransactions > 0 ? prevTotalSales / prevTransactions : 0;

                await exportService.generateDailySalesReportPdf(
                    `Daily_Sales_Report_${reportDate}.pdf`,
                    {
                        businessName: store.store_name || 'Business',
                        reportDate,
                        generatedTime,
                        totalSales,
                        transactions,
                        averageTicket,
                        previousDay: { totalSales: prevTotalSales, transactions: prevTransactions, averageTicket: prevAvgTicket },
                        posSoftwareName: 'PantherPOS',
                    }
                );
            } else {
                exportService.exportToPdf(`${fileName}.pdf`, activeReport.replace(/_/g, ' '), data);
            }
        }
        setShowExportMenu(false);
    };

    const columns = useMemo(() => {
        const formatCurrency = (val: any) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        switch (activeReport) {
            case 'DAILY': return [
                { header: 'Date', accessor: 'day', className: 'font-mono' },
                { header: 'Transactions', accessor: 'count', className: 'center font-bold' },
                { header: 'Avg Ticket', accessor: (r: any) => formatCurrency(r.avg_ticket), className: 'right' },
                { header: 'Total Revenue', accessor: (r: any) => <span className="text-emerald-500 font-black">{formatCurrency(r.total)}</span>, className: 'right' },
            ];
            case 'HOURLY': return [
                { header: 'Time Block', accessor: 'hour', className: 'font-mono' },
                { header: 'Footfall', accessor: 'count', className: 'center font-bold' },
                { header: 'Sales Volume', accessor: (r: any) => formatCurrency(r.total), className: 'right text-primary font-bold' },
            ];
            case 'PAYMENTS': return [{ header: 'Method', accessor: 'payment_mode', className: 'font-bold uppercase tracking-tight' }, { header: 'Txn Count', accessor: 'count', className: 'center' }, { header: 'Total', accessor: (r: any) => formatCurrency(r.total), className: 'right font-black text-foreground' }];
            case 'PRODUCTS': return [{ header: 'Product', accessor: 'name', className: 'font-bold' }, { header: 'Barcode', accessor: 'barcode', className: 'font-mono text-xs opacity-70' }, { header: 'Units', accessor: 'qty', className: 'center font-black text-primary' }, { header: 'Revenue', accessor: (r: any) => formatCurrency(r.total), className: 'right font-bold' }];
            case 'PROFIT': return [
                { header: 'Product', accessor: 'name', className: 'font-bold' },
                { header: 'Qty', accessor: 'qty_sold', className: 'center' },
                { header: 'Revenue', accessor: (r: any) => formatCurrency(r.revenue), className: 'right' },
                { header: 'Cost', accessor: (r: any) => formatCurrency(r.cost), className: 'right opacity-60 text-xs' },
                { header: 'Margin', accessor: (r: any) => `${Number(r.margin_percent || 0).toFixed(1)}%`, className: (r: any) => Number(r.margin_percent || 0) > 20 ? 'text-emerald-500 text-right font-black' : 'text-orange-500 text-right font-black' },
                { header: 'Profit', accessor: (r: any) => <span className={`font-black ${Number(r.profit) > 0 ? 'text-emerald-500' : 'text-destructive'}`}>{formatCurrency(r.profit)}</span>, className: 'right' }
            ];
            case 'GST': return [
                { header: 'Tax Slab', accessor: (r: any) => `${r.gst_rate}%`, className: 'font-black text-primary' },
                { header: 'Taxable', accessor: (r: any) => formatCurrency(r.taxable), className: 'right' },
                { header: 'CGST', accessor: (r: any) => formatCurrency(r.cgst), className: 'right opacity-70' },
                { header: 'SGST', accessor: (r: any) => formatCurrency(r.sgst), className: 'right opacity-70' },
                { header: 'Total GST', accessor: (r: any) => formatCurrency(r.gst), className: 'right font-black text-foreground' }
            ];
            case 'HSN': return [{ header: 'HSN', accessor: 'hsn_code', className: 'font-mono font-bold' }, { header: 'Taxable', accessor: (r: any) => formatCurrency(r.taxable), className: 'right' }, { header: 'Tax', accessor: (r: any) => formatCurrency(r.gst), className: 'right font-bold text-primary' }];
            case 'OUTSTANDING': return [
                { header: 'Customer', accessor: 'customer_name', className: 'font-bold' },
                { header: 'Contact', accessor: 'customer_phone', className: 'font-mono text-xs opacity-70' },
                { header: 'Date', accessor: (r: any) => new Date(r.date).toLocaleDateString() },
                { header: 'Overdue', accessor: (r: any) => `${r.days_overdue} days`, className: 'text-orange-500 font-black italic' },
                { header: 'Due', accessor: (r: any) => <span className="text-destructive font-black">{formatCurrency(r.total)}</span>, className: 'right' }
            ];
            case 'TOP_CUSTOMERS': return [{ header: 'Customer', accessor: 'name', className: 'font-bold' }, { header: 'Phone', accessor: 'phone', className: 'font-mono' }, { header: 'Visits', accessor: 'visits', className: 'center font-black' }, { header: 'Spent', accessor: (r: any) => formatCurrency(r.total_spent), className: 'right font-black text-primary' }];
            case 'PURCHASE_PRODUCTS': return [{ header: 'Product', accessor: 'name', className: 'font-bold' }, { header: 'Barcode', accessor: 'barcode', className: 'font-xs opacity-50' }, { header: 'Qty', accessor: 'qty_bought', className: 'center font-black' }, { header: 'Cost', accessor: (r: any) => formatCurrency(r.total_spent), className: 'right font-bold' }];
            case 'SUPPLIERS': return [{ header: 'Name', accessor: 'name', className: 'font-bold uppercase tracking-tight' }, { header: 'Contact', accessor: 'phone', className: 'font-mono' }, { header: 'GSTIN', accessor: 'gstin', className: 'text-xs opacity-70' }, { header: 'Orders', accessor: 'order_count', className: 'center font-black' }];
            case 'UNPAID_PURCHASE': return [{ header: 'Order #', accessor: 'order_no', className: 'font-mono font-bold' }, { header: 'Date', accessor: (r: any) => new Date(r.date).toLocaleDateString() }, { header: 'Amount', accessor: (r: any) => <span className="text-destructive font-black">{formatCurrency(r.total_amount)}</span>, className: 'right' }, { header: 'Status', accessor: 'status', className: 'uppercase text-[10px] font-black' }];
            case 'PURCHASE_INVOICES': return [{ header: 'Inv No', accessor: 'order_no', className: 'font-mono font-bold' }, { header: 'Supplier', accessor: 'supplier_name', className: 'font-bold' }, { header: 'Date', accessor: (r: any) => new Date(r.date).toLocaleDateString() }, { header: 'Amount', accessor: (r: any) => formatCurrency(r.total_amount), className: 'right font-black' }];
            case 'LOW_STOCK': return [{ header: 'Product', accessor: 'name', className: 'text-orange-500 font-black uppercase tracking-tight' }, { header: 'In Stock', accessor: 'stock', className: 'center font-bold' }, { header: 'Min Level', accessor: 'min_stock_level', className: 'center opacity-50' }];
            case 'REORDER_LIST': return [{ header: 'Product', accessor: 'name', className: 'font-bold' }, { header: 'Stock', accessor: 'stock', className: 'center font-black text-destructive' }, { header: 'Reorder', accessor: 'suggested_order', className: 'center font-black text-emerald-500' }];
            case 'LOSS_DAMAGE': return [{ header: 'Date', accessor: (r: any) => new Date(r.date).toLocaleDateString() }, { header: 'Product', accessor: 'product_name', className: 'font-black' }, { header: 'Type', accessor: 'type', className: 'text-[10px] uppercase font-bold' }, { header: 'Reason', accessor: 'reason', className: 'italic text-muted-foreground' }, { header: 'Qty', accessor: (r: any) => Math.abs(r.quantity_change), className: 'right font-bold text-destructive' }];
            case 'TRANSACTIONS': return [
                { header: 'Timestamp', accessor: (r: any) => new Date(r.date).toLocaleString(), className: 'text-xs opacity-70' },
                { header: 'RefID', accessor: 'ref', className: 'font-mono font-bold text-primary' },
                { header: 'Entity', accessor: (r: any) => r.customer_name || 'Walk-in' },
                { header: 'Type', accessor: (r: any) => <span className={`font-black text-[10px] uppercase tracking-widest ${r.type === 'SALE' ? 'text-emerald-500' : 'text-destructive'}`}>{r.type}</span> },
                { header: 'Operational Status', accessor: (r: any) => <span className="text-[10px] uppercase font-bold opacity-60 tracking-widest">{r.status}</span> },
                { header: 'Quantum', accessor: (r: any) => formatCurrency(r.amount), className: 'right font-black' }
            ];
            default: return [];
        }
    }, [activeReport]);

    const activeReportLabel = useMemo(() => {
        for (const group of REPORT_GROUPS) { const item = group.items.find(i => i.id === activeReport); if (item) return item.label; }
        return activeReport;
    }, [activeReport]);

    const filteredReportGroups = useMemo(() => {
        if (!searchTerm) return REPORT_GROUPS;
        return REPORT_GROUPS.map(group => ({ ...group, items: group.items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase())) })).filter(group => group.items.length > 0);
    }, [searchTerm]);

    const resolveClassName = (classNameConfig: any, row: any) => {
        if (typeof classNameConfig === 'function') return classNameConfig(row);
        return classNameConfig || '';
    };

    return (
        <div className="flex h-full gap-6">
            {/* Sidebar Navigation */}
            <div className="w-72 flex flex-col gap-5 bg-surface/50 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-2xl overflow-hidden shrink-0">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        className="w-full pl-11 pr-4 py-3 bg-muted/20 border border-border rounded-xl text-sm text-foreground font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-inner"
                        placeholder="Search report archives..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-8">
                    {filteredReportGroups.map((group, idx) => (
                        <div key={idx} className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 px-2 opacity-60">{group.title}</h3>
                            <div className="flex flex-col gap-1.5">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveReport(item.id as ReportType)}
                                        className={`
                                            flex items-center gap-4 p-3.5 rounded-xl text-xs text-left transition-all duration-300 group
                                            ${activeReport === item.id
                                                ? 'bg-primary/10 text-primary font-black shadow-sm border border-primary/30'
                                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent hover:px-5'
                                            }
                                        `}
                                    >
                                        <item.icon size={18} strokeWidth={activeReport === item.id ? 2.5 : 2} className={`${activeReport === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}`} />
                                        <span className="uppercase tracking-widest">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 min-w-0 animate-in fade-in slide-in-from-bottom-6 duration-500">
                {/* Toolbar */}
                <div className="relative z-30 p-5 bg-surface border border-border rounded-2xl flex justify-between items-center shadow-xl">
                    <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">{activeReportLabel}</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow animate-pulse" />
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                TEMPORAL RANGE: {dateFrom || 'INFINTY'} — {dateTo || 'PRESENT'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border shadow-inner">
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent text-foreground text-xs p-2 focus:outline-none font-black uppercase tracking-widest cursor-pointer" />
                            <span className="text-muted-foreground/30 font-black">→</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent text-foreground text-xs p-2 focus:outline-none font-black uppercase tracking-widest cursor-pointer" />
                        </div>

                        <button onClick={handlePrint} className="p-3 bg-muted/20 border border-border rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all shadow-sm hover:scale-105 active:scale-95">
                            <Printer size={20} />
                        </button>

                        <div className="relative">
                            <Button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 bg-primary hover:brightness-110 text-primary-foreground px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow">
                                <Download size={16} /> Finalize Export
                            </Button>
                            {showExportMenu && (
                                <div className="absolute right-0 top-full mt-3 w-48 bg-surface border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden py-2 animate-in zoom-in-95 duration-200">
                                    <button onClick={() => handleExport('csv')} className="p-4 text-left hover:bg-muted text-[10px] font-black uppercase tracking-[0.2em] flex gap-4 items-center text-muted-foreground hover:text-foreground transition-all"><div className="w-2 h-2 rounded-full bg-blue-500" /> CSV COMMA SEPARATED</button>
                                    <button onClick={() => handleExport('xlsx')} className="p-4 text-left hover:bg-muted text-[10px] font-black uppercase tracking-[0.2em] flex gap-4 items-center text-muted-foreground hover:text-foreground transition-all"><div className="w-2 h-2 rounded-full bg-emerald-500" /> EXCEL SPREADSHEET</button>
                                    <button onClick={() => handleExport('pdf')} className="p-4 text-left hover:bg-muted text-[10px] font-black uppercase tracking-[0.2em] flex gap-4 items-center text-muted-foreground hover:text-foreground transition-all"><div className="w-2 h-2 rounded-full bg-red-500" /> PORTABLE DOCUMENT</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div className="flex-1 bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl relative" ref={componentRef}>
                    <div className="absolute inset-0 overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted text-muted-foreground sticky top-0 z-10 backdrop-blur-2xl border-b border-border shadow-sm">
                                <tr>
                                    {columns.map((col: any, i: number) => (
                                        <th key={i} className={`p-5 font-black whitespace-nowrap uppercase tracking-[0.1em] text-[10px] ${typeof col.className === 'string' && col.className.includes('right') ? 'text-right' : typeof col.className === 'string' && col.className.includes('center') ? 'text-center' : ''}`}>
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {data.length > 0 ? (
                                    data.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-primary/5 transition-colors group">
                                            {columns.map((col: any, cIdx: number) => {
                                                const finalClass = resolveClassName(col.className, row);
                                                return (
                                                    <td key={cIdx} className={`p-5 text-foreground font-bold transition-all ${finalClass} ${typeof finalClass === 'string' && finalClass.includes('right') || (typeof col.className === 'string' && col.className.includes('right')) ? 'text-right' : typeof finalClass === 'string' && finalClass.includes('center') || (typeof col.className === 'string' && col.className.includes('center')) ? 'text-center' : ''}`}>
                                                        {typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length} className="p-40 text-center">
                                            <div className="flex flex-col items-center justify-center gap-6 opacity-20">
                                                <History size={80} strokeWidth={1} />
                                                <p className="font-black text-xs uppercase tracking-[0.3em]">{loading ? 'INITIALIZING DATA STREAM...' : 'NO ARCHIVED DATA DETECTED FOR PERIOD'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <style>{`
                @media print {
                    @page { size: landscape; margin: 0.5cm; }
                    body { background: white !important; color: black !important; }
                    .no-print, header, nav, aside { display: none !important; }
                    div, section, table { border: none !important; box-shadow: none !important; background: transparent !important; }
                    table { border-collapse: collapse; width: 100%; font-size: 10pt; }
                    th, td { border: 0.5pt solid #eee !important; padding: 6pt; }
                    th { font-weight: 900; background: #f9f9f9 !important; }
                    .text-emerald-500 { color: #059669 !important; }
                    .text-primary { color: #10b981 !important; }
                    .text-destructive { color: #ef4444 !important; }
                }
            `}</style>
        </div>
    );
}
