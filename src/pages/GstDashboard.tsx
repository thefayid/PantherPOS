import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { exportService } from '../services/exportService';
import {
    LayoutDashboard,
    FileText,
    ArrowUpCircle,
    ArrowDownCircle,
    Calculator,
    Calendar,
    ChevronRight,
    Search,
    Download,
    Info,
    ArrowRightLeft,
    ShoppingCart,
    Tag,
    History
} from 'lucide-react';
import { Button } from '../components/Button';

export default function GstDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [activeGstr, setActiveGstr] = useState<'GSTR-1' | 'GSTR-3B' | 'GSTR-2'>('GSTR-1');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadStats();
    }, [dateFrom, dateTo, activeGstr]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const gstStats = await reportService.getGstDashboardStats(dateFrom, dateTo);
            setStats(gstStats);

            let details: any[] = [];
            if (activeGstr === 'GSTR-1') {
                details = await reportService.getGstr1Details(dateFrom, dateTo);
            } else if (activeGstr === 'GSTR-2') {
                details = await reportService.getItcSummary(dateFrom, dateTo);
            } else if (activeGstr === 'GSTR-3B') {
                details = await reportService.getGstr3bSummary(dateFrom, dateTo);
            }
            setTableData(details || []);
        } catch (error) {
            console.error('Failed to load GST stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!tableData || tableData.length === 0) return;
        const filename = `${activeGstr}_Summary_${dateFrom}_to_${dateTo}.xlsx`;
        await exportService.exportToExcel(filename, tableData);
    };

    const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const filteredData = tableData.filter(item => {
        const query = searchQuery.toLowerCase();
        if (activeGstr === 'GSTR-1') {
            return ((item.bill_no || '').toLowerCase().includes(query) || (item.customer_name || '').toLowerCase().includes(query));
        } else if (activeGstr === 'GSTR-2') {
            return (item.party_name || '').toLowerCase().includes(query);
        } else if (activeGstr === 'GSTR-3B') {
            return (item.nature_of_supplies || '').toLowerCase().includes(query);
        }
        return true;
    });

    if (loading && !stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-black text-primary animate-pulse tracking-[0.2em] uppercase">Initializing Tax Stream...</span>
            </div>
        );
    }

    return (
        <div className="flex h-full gap-6 animate-in fade-in duration-500 p-2">
            {/* Left Sidebar: GSTR Reports Links */}
            <div className="w-80 flex flex-col gap-6 shrink-0 no-print">
                <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-black tracking-tighter text-foreground uppercase">GSTR Reports</h2>
                    </div>

                    <div className="space-y-2">
                        {[
                            { id: 'GSTR-3B', label: 'GSTR-3B Summary', icon: LayoutDashboard, desc: 'Monthly Return Summary' },
                            { id: 'GSTR-1', label: 'Sales Return GSTR-1', icon: ShoppingCart, desc: 'Outward Supplies' },
                            { id: 'GSTR-2', label: 'Purchase Return GSTR-2', icon: Tag, desc: 'Inward Supplies' }
                        ].map((report) => (
                            <button
                                key={report.id}
                                onClick={() => setActiveGstr(report.id as any)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border group ${activeGstr === report.id ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
                            >
                                <report.icon size={20} className={activeGstr === report.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} />
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-widest">{report.label}</p>
                                    <p className="text-[10px] font-bold opacity-60">{report.desc}</p>
                                </div>
                                <ChevronRight size={14} className="ml-auto opacity-40 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-border mt-2">
                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/20 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all group">
                            <Download size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">View Archives</span>
                        </button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 text-primary mb-3">
                        <Info size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Compliance Notice</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-bold">
                        Calculations are based on "PAID" sales and "RECEIVED" purchase orders. Ensure HSN codes and GST rates are correctly mapped in your product master.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Dashboard Toolbar */}
                <div className="relative z-30 p-6 bg-surface border border-border rounded-3xl flex justify-between items-center shadow-xl">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase flex items-center gap-3">
                                {activeGstr} Summary
                                <span className="text-[10px] px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full tracking-widest font-black">LIVE ANALYTICS</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5 text-muted-foreground">
                                <Calendar size={12} />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                    FISCAL PERIOD: {dateFrom} — {dateTo}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-2xl border border-border shadow-inner">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="bg-transparent text-foreground text-xs p-1 focus:outline-none font-black uppercase tracking-widest cursor-pointer"
                            />
                            <span className="text-muted-foreground/30 font-black">→</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="bg-transparent text-foreground text-xs p-1 focus:outline-none font-black uppercase tracking-widest cursor-pointer"
                            />
                        </div>
                        <Button
                            onClick={handleExport}
                            className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow flex gap-2 items-center"
                        >
                            <Download size={16} /> Export JSON/CSV
                        </Button>
                    </div>
                </div>

                {/* Primary KPI Section */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 shrink-0">
                    {/* Output GST Card */}
                    <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
                            <ArrowUpCircle size={100} strokeWidth={1} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                                    <ArrowUpCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Output GST</h3>
                                    <p className="text-[10px] font-bold text-primary">Collected from Sales</p>
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-foreground tracking-tighter mb-4">{formatCurrency(stats?.output.total)}</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/10 p-3 rounded-2xl border border-border/50">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">CGST</p>
                                    <p className="text-sm font-bold text-foreground">{formatCurrency(stats?.output.cgst)}</p>
                                </div>
                                <div className="bg-muted/10 p-3 rounded-2xl border border-border/50">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">SGST</p>
                                    <p className="text-sm font-bold text-foreground">{formatCurrency(stats?.output.sgst)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input GST / ITC Card */}
                    <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-8 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
                            <ArrowDownCircle size={100} strokeWidth={1} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner border border-emerald-500/20">
                                    <ArrowDownCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Input GST (ITC)</h3>
                                    <p className="text-[10px] font-bold text-emerald-500">Paid on Purchases</p>
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-foreground tracking-tighter mb-4">{formatCurrency(stats?.input.total)}</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/10 p-3 rounded-2xl border border-border/50">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total CGST</p>
                                    <p className="text-sm font-bold text-foreground">{formatCurrency(stats?.input.cgst)}</p>
                                </div>
                                <div className="bg-muted/10 p-3 rounded-2xl border border-border/50">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total SGST</p>
                                    <p className="text-sm font-bold text-foreground">{formatCurrency(stats?.input.sgst)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GST Payable Card */}
                    <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-orange-500/40 transition-all duration-500 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/5 via-surface to-surface">
                        <div className="absolute top-0 right-0 p-8 text-orange-500/5 group-hover:text-orange-500/10 transition-colors">
                            <Calculator size={100} strokeWidth={1} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner border border-orange-500/20">
                                    <Calculator size={24} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Net GST Payable</h3>
                                    <p className="text-[10px] font-bold text-orange-500">Current Liability</p>
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-foreground tracking-tighter mb-4">{formatCurrency(stats?.payable)}</h2>
                            <div className="flex items-center gap-2 bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest">Calculated as (Output - Input)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Table Section */}
                <div className="flex-1 bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col relative min-h-[400px]">
                    <div className="p-6 border-b border-border bg-muted/5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                                <ArrowRightLeft size={18} className="text-primary" />
                                {activeGstr === 'GSTR-3B' ? 'Section-wise Summary' : activeGstr === 'GSTR-1' ? 'Sales Invoices & Tax' : 'Party-wise Purchase & ITC'}
                                <Info size={14} className="text-muted-foreground hover:text-primary cursor-help" />
                            </h3>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground font-bold focus:outline-none focus:border-primary transition-all shadow-inner w-64"
                                placeholder="Search..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/30 sticky top-0 z-10 border-b border-border backdrop-blur-md">
                                {activeGstr === 'GSTR-1' && (
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bill No / Customer</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">GST Rate</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Taxable Value</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">GST Amt</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Total Bill</th>
                                    </tr>
                                )}
                                {activeGstr === 'GSTR-2' && (
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Party / Supplier Name</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">GST Rating</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Taxable Amount</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">ITC Amount</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Date Received</th>
                                    </tr>
                                )}
                                {activeGstr === 'GSTR-3B' && (
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nature of Supplies</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Total Taxable Value</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Integrated Tax</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Central Tax (CGST)</th>
                                        <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">State Tax (SGST)</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                                        {activeGstr === 'GSTR-1' && (
                                            <>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-foreground uppercase tracking-tight text-sm">{item.bill_no}</span>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.customer_name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20 tracking-widest">
                                                        {item.gst_rate}% TAX
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right font-black text-muted-foreground text-sm">{formatCurrency(item.taxable_value)}</td>
                                                <td className="p-6 text-right font-black text-primary text-base">{formatCurrency(item.gst_amount)}</td>
                                                <td className="p-6 text-right font-black text-foreground text-sm">{formatCurrency(item.taxable_value + item.gst_amount)}</td>
                                            </>
                                        )}
                                        {activeGstr === 'GSTR-2' && (
                                            <>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border">
                                                            {item.party_name[0]}
                                                        </div>
                                                        <span className="font-bold text-foreground uppercase tracking-tight text-sm">{item.party_name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 tracking-widest">
                                                        {item.gst_rate}% TAX
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right font-black text-muted-foreground text-sm">{formatCurrency(item.total_received)}</td>
                                                <td className="p-6 text-right font-black text-emerald-500 text-base">{formatCurrency(item.itc_amount)}</td>
                                                <td className="p-6 text-right font-black text-muted-foreground text-[10px] uppercase tracking-widest">PAID / RECEIVED</td>
                                            </>
                                        )}
                                        {activeGstr === 'GSTR-3B' && (
                                            <>
                                                <td className="p-6">
                                                    <span className="font-bold text-foreground uppercase tracking-tight text-sm">{item.nature_of_supplies}</span>
                                                </td>
                                                <td className="p-6 text-right font-black text-muted-foreground text-sm">{formatCurrency(item.total_taxable_value)}</td>
                                                <td className="p-6 text-right font-black text-foreground text-sm">{formatCurrency(item.integrated_tax)}</td>
                                                <td className="p-6 text-right font-black text-foreground text-sm">{formatCurrency(item.central_tax)}</td>
                                                <td className="p-6 text-right font-black text-foreground text-sm">{formatCurrency(item.state_tax)}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-32 text-center opacity-20">
                                            <div className="flex flex-col items-center gap-6">
                                                <History size={60} strokeWidth={1} />
                                                <p className="font-black text-xs uppercase tracking-[0.3em]">No Data detected in this period</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
