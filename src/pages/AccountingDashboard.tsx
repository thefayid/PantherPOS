import { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import {
    Wallet,
    Landmark,
    Calculator,
    ArrowRightLeft,
    PlusCircle,
    ArrowUpCircle,
    ArrowDownCircle,
    History,
    ChevronRight,
    PieChart
} from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export default function AccountingDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadData();
    }, [dateFrom, dateTo]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tb, bs, pnl] = await Promise.all([
                accountingService.getTrialBalance(),
                accountingService.getBalanceSheet(),
                accountingService.getProfitAndLoss(dateFrom, dateTo)
            ]);

            // Extract specific balances
            const getBal = (code: string) => tb.find((a: any) => a.code === code)?.balance || 0;

            setStats({
                cash: getBal('1001'),
                bank: getBal('1002'),
                receivables: getBal('1003'),
                inventory: getBal('1004'),
                payables: getBal('2001'),
                gstPayable: getBal('2002'),
                netProfit: pnl.netProfit,
                income: pnl.totalIncome,
                expenses: pnl.totalExpenses,
                assets: bs.totalAssets,
                liabilities: bs.totalLiabilitiesEquity - getBal('3001') - pnl.netProfit // Simplified
            });
        } catch (error) {
            console.error('Failed to load accounting stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading && !stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-black text-primary animate-pulse tracking-[0.2em] uppercase">Auditing Ledgers...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-6 p-2 animate-in fade-in duration-500 overflow-auto no-scrollbar">
            {/* Toolbar */}
            <div className="bg-surface border border-border rounded-3xl p-6 flex justify-between items-center shadow-xl shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase flex items-center gap-3">
                        Integrated Accounting
                        <span className="text-[10px] px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full tracking-widest font-black uppercase">Core Ledger</span>
                    </h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Financial Status & Double-Entry Real-time Sync</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-2xl border border-border">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="bg-transparent text-foreground text-xs p-1 focus:outline-none font-black uppercase"
                        />
                        <span className="text-muted-foreground/30">→</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="bg-transparent text-foreground text-xs p-1 focus:outline-none font-black uppercase"
                        />
                    </div>
                    <Button
                        onClick={() => navigate('/accounting/vouchers')}
                        className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow flex gap-2 items-center"
                    >
                        <PlusCircle size={16} /> New Voucher
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                {/* Cash & Bank */}
                <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                    <div className="absolute -top-4 -right-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors transform rotate-12">
                        <Wallet size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                <Wallet size={20} />
                            </div>
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Liquid Cash</h3>
                        </div>
                        <h2 className="text-3xl font-black text-foreground tracking-tighter mb-2">{formatCurrency(stats?.cash)}</h2>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                            <Landmark size={12} />
                            <span>Bank: {formatCurrency(stats?.bank)}</span>
                        </div>
                    </div>
                </div>

                {/* Receivables */}
                <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
                    <div className="absolute -top-4 -right-4 text-blue-500/5 group-hover:text-blue-500/10 transition-colors transform rotate-12">
                        <ArrowUpCircle size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                <ArrowUpCircle size={20} />
                            </div>
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Receivables</h3>
                        </div>
                        <h2 className="text-3xl font-black text-foreground tracking-tighter mb-2">{formatCurrency(stats?.receivables)}</h2>
                        <p className="text-[10px] font-bold text-muted-foreground">Due from Customers</p>
                    </div>
                </div>

                {/* Payables */}
                <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
                    <div className="absolute -top-4 -right-4 text-orange-500/5 group-hover:text-orange-500/10 transition-colors transform rotate-12">
                        <ArrowDownCircle size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                                <ArrowDownCircle size={20} />
                            </div>
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payables</h3>
                        </div>
                        <h2 className="text-3xl font-black text-foreground tracking-tighter mb-2">{formatCurrency(stats?.payables)}</h2>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                            <PieChart size={12} />
                            <span>GST: {formatCurrency(stats?.gstPayable)}</span>
                        </div>
                    </div>
                </div>

                {/* Net Profit */}
                <div className={`bg-surface border rounded-3xl p-6 shadow-xl relative overflow-hidden group transition-all duration-300 ${stats?.netProfit >= 0 ? 'hover:border-primary/40' : 'hover:border-destructive/40'}`}>
                    <div className={`absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-colors transform rotate-12 ${stats?.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        <Calculator size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stats?.netProfit >= 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                <Calculator size={20} />
                            </div>
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Net Profit</h3>
                        </div>
                        <h2 className={`text-3xl font-black tracking-tighter mb-2 ${stats?.netProfit >= 0 ? 'text-foreground' : 'text-destructive'}`}>{formatCurrency(stats?.netProfit)}</h2>
                        <div className="flex items-center gap-2 text-[10px] font-bold opacity-60">
                            <PlusCircle size={10} className="text-primary" /> {formatCurrency(stats?.income)}
                            <span className="mx-1 opacity-20">|</span>
                            <PlusCircle size={10} className="text-destructive rotate-45" /> {formatCurrency(stats?.expenses)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Left: General Ledger Preview */}
                <div className="xl:col-span-2 bg-surface border border-border rounded-3xl shadow-xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                <History size={16} />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">P&L Detailed Breakdown</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" className="text-[10px] font-black uppercase tracking-widest px-4">Download PDF</Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-6 scrollbar-thin">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Income */}
                            <div>
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 border-l-2 border-primary pl-4">Revenue Streams</h4>
                                <div className="space-y-4">
                                    {stats?.income > 0 ? (
                                        <div className="group">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-sm font-bold text-foreground uppercase">Global Sales Revenue</span>
                                                <span className="text-sm font-black text-primary">{formatCurrency(stats.income)}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground font-bold italic">No income detected for selected period.</p>
                                    )}
                                </div>
                            </div>

                            {/* Expenses */}
                            <div>
                                <h4 className="text-[10px] font-black text-destructive uppercase tracking-[0.2em] mb-6 border-l-2 border-destructive pl-4">Operating Costs</h4>
                                <div className="space-y-6">
                                    {stats?.expenses > 0 ? (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-center p-3 rounded-2xl bg-destructive/5 border border-destructive/10">
                                                <span className="text-xs font-bold text-foreground uppercase">General Expenses</span>
                                                <span className="text-xs font-black text-destructive">{formatCurrency(stats.expenses)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground font-bold italic">No expenses recorded for selected period.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Quick Actions & Links */}
                <div className="flex flex-col gap-6">
                    <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">System Commands</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Manual Journal Entry', icon: ArrowRightLeft, path: '/accounting/vouchers', desc: 'Post non-routine transactions' },
                                { label: 'Tally Sync', icon: ArrowUpCircle, path: '/accounting/tally', desc: 'Connect to Tally Prime / ERP 9' },
                                { label: 'Chart of Accounts', icon: PieChart, path: '/accounting/chart', desc: 'Manage financial headers' },
                                { label: 'Trial Balance', icon: Calculator, path: '/accounting/reports/tb', desc: 'Verify accounting integrity' },
                                { label: 'Balance Sheet', icon: Landmark, path: '/accounting/reports/bs', desc: 'Full snapshot of equity' }
                            ].map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(item.path)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-border">
                                        <item.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground opacity-60">{item.desc}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notice Card */}
                    <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center gap-2 text-primary mb-3">
                            <PlusCircle size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Double-Entry Notice</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
                            Accounting entries are automatically posted for all Sales, Purchases, and recorded Payments. Use manual Journal Entries for adjustments and indirect expenses.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
