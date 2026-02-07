import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { cashService } from '../services/cashService';
import {
    TrendingUp,
    AlertTriangle,
    IndianRupee,
    ShoppingCart,
    Clock,
    PackagePlus,
    UserCircle,
    LayoutDashboard,
    CreditCard,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    Users,
    FileText,
    Plus,
    Minus,
    Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        todaySales: 0,
        billCount: 0,
        lowStockCount: 0,
        totalStockValue: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    // Charts Data
    const [hourlySales, setHourlySales] = useState<any[]>([]);
    const [paymentSplit, setPaymentSplit] = useState<any[]>([]);

    // New Functional Widgets Data
    const [cashBalance, setCashBalance] = useState<number | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
    const [openingBalance, setOpeningBalance] = useState<number>(0);
    const [salesGoal, setSalesGoal] = useState<any>(null);

    useEffect(() => {
        loadDashboard();

        // Auto-refresh every minute
        const interval = setInterval(() => {
            loadDashboard(true);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];

            const [dashboardStats, activity, hourly, payments, projection, session] = await Promise.all([
                reportService.getDashboardStats(),
                reportService.getRecentActivity(),
                reportService.getHourlySales(today, today),
                reportService.getPaymentSplit(today, today),
                reportService.getSalesProjection(),
                cashService.getCurrentSession()
            ]);

            setStats(dashboardStats);
            setRecentActivity(activity);
            setHourlySales(hourly);
            setPaymentSplit(payments);
            setSalesGoal(projection);

            // Calculate Live Cash if session is open
            if (session) {
                const txns = await cashService.getTransactions(session.id);
                const balance = txns.reduce((sum, t) => {
                    const amount = Number(t.amount) || 0;
                    if (t.type === 'PAYOUT' || t.type === 'REFUND' || t.type === 'DROP' || t.type === 'CLOSING') {
                        return sum - amount;
                    } else {
                        // OPENING, SALE, PAYIN
                        return sum + amount;
                    }
                }, 0);
                setCashBalance(balance);
                setSessionStartTime(session.start_time);
                setOpeningBalance(session.start_cash || 0);
            } else {
                setCashBalance(null);
                setSessionStartTime(null);
                setOpeningBalance(0);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-bold text-muted-foreground animate-pulse">LOADING ANALYTICS...</span>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-2 space-y-6 custom-scrollbar pb-20">
            {/* Header */}
            <div className="flex justify-between items-end bg-surface/50 backdrop-blur-lg p-6 rounded-xl border border-border shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold mb-2 tracking-tight text-foreground">Dashboard Overview</h1>
                    <p className="text-sm text-emerald-500 font-bold flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        System Operational
                    </p>
                </div>
                <div className="text-xs font-mono bg-muted/40 px-4 py-2 rounded-lg border border-border flex items-center gap-2 text-muted-foreground shadow-inner">
                    <Clock size={14} className="text-primary" />
                    <span>UPDATED: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Today's Sales"
                    value={`₹${stats.todaySales.toFixed(0)}`}
                    icon={IndianRupee}
                    color="text-blue-400"
                    bg="bg-blue-400/10"
                    subtext={`${stats.billCount} Bills`}
                />
                <StatCard
                    title="Avg. Ticket"
                    value={`₹${(stats.billCount > 0 ? stats.todaySales / stats.billCount : 0).toFixed(0)}`}
                    icon={ShoppingCart}
                    color="text-indigo-400"
                    bg="bg-indigo-400/10"
                    subtext="Per Customer"
                />
                <StatCard
                    title="Net Profit (Est.)"
                    value={`₹${(stats.todaySales * 0.2).toFixed(0)}`}
                    icon={TrendingUp}
                    color="text-emerald-400"
                    bg="bg-emerald-400/10"
                    subtext="~20% Margin"
                />

                <StatCard
                    title="Inventory"
                    value={`₹${(stats.totalStockValue / 1000).toFixed(1)}k`}
                    icon={PackagePlus}
                    color="text-purple-400"
                    bg="bg-purple-400/10"
                    subtext="Stock Value"
                />

                <StatCard
                    title="Low Stock"
                    value={stats.lowStockCount}
                    icon={AlertTriangle}
                    color="text-orange-400"
                    bg="bg-orange-400/10"
                    subtext="Items Alert"
                    onClick={() => navigate('/products')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Charts Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Hourly Sales Chart */}
                    <div className="bg-surface/50 backdrop-blur-md border border-border rounded-xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Clock size={18} className="text-primary" />
                                Hourly Activity
                            </h3>
                        </div>
                        <div className="h-40 flex items-end gap-2">
                            {['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'].map(hour => {
                                const hourData = hourlySales.find(h => h.hour.startsWith(hour));
                                const val = hourData ? hourData.total : 0;
                                const maxVal = Math.max(...hourlySales.map(h => h.total), 1); // Avoid div by 0
                                const height = (val / maxVal) * 100;

                                return (
                                    <div key={hour} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                                        <div className="w-full bg-muted/20 rounded-t-sm relative h-full flex items-end overflow-hidden group-hover:bg-muted/40 transition-colors">
                                            <div
                                                style={{ height: `${height}%` }}
                                                className={`w-full transition-all duration-500 rounded-t-sm ${height > 0 ? 'bg-primary/80' : 'bg-transparent'}`}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-border">
                                                    ₹{val}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono">{hour}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Payment Split & Sales Trend */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Payment Split */}
                        <div className="bg-surface/50 backdrop-blur-md border border-border rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <IndianRupee size={18} className="text-green-400" />
                                Payments
                            </h3>
                            <div className="space-y-3">
                                {paymentSplit.length > 0 ? paymentSplit.map((p, i) => {
                                    const total = paymentSplit.reduce((acc, curr) => acc + curr.total, 0);
                                    const percent = (p.total / total) * 100;
                                    return (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span>{p.payment_mode || 'Unknown'}</span>
                                                <span>₹{p.total.toFixed(0)} ({percent.toFixed(0)}%)</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${percent}%` }}
                                                    className={`h-full rounded-full ${p.payment_mode === 'CASH' ? 'bg-green-500' :
                                                        p.payment_mode === 'UPI' ? 'bg-blue-500' : 'bg-purple-500'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center text-muted-foreground text-sm py-4">No payments recorded today</div>
                                )}
                            </div>
                        </div>

                        {/* 7 Day Trend (Mini) */}
                        <div className="bg-surface/50 backdrop-blur-md border border-border rounded-xl p-6 shadow-lg flex flex-col">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <TrendingUp size={18} className="text-blue-400" />
                                7-Day Trend
                            </h3>
                            <div className="flex items-end justify-between gap-2 flex-1">
                                {stats.salesTrend && stats.salesTrend.slice(-7).map((day: any, idx: number) => {
                                    const maxVal = Math.max(...stats.salesTrend.map((d: any) => d.total), 1);
                                    const heightPercent = (day.total / maxVal) * 100;
                                    return (
                                        <div key={idx} className="flex-1 h-full flex items-end">
                                            <div
                                                style={{ height: `${Math.max(heightPercent, 10)}%` }}
                                                className="w-full bg-blue-500/20 hover:bg-blue-500/40 rounded-sm transition-all relative group"
                                            >
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    ₹{day.total}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Recent Activity */}
                <div className="bg-surface/50 backdrop-blur-md border border-border rounded-xl flex flex-col shadow-lg h-[400px]">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-xl font-bold flex items-center gap-3 text-foreground">
                            <Clock size={20} className="text-purple-400" />
                            Live Feed
                        </h3>
                    </div>

                    <div className="flex-1 overflow-auto p-4 flex flex-col gap-3 relative no-scrollbar">
                        {recentActivity.map((item) => (
                            <div key={item.id} className="p-4 rounded-xl bg-card border border-border flex justify-between items-center hover:bg-muted transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <ShoppingCart size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-foreground group-hover:text-blue-500 transition-colors">{item.customer_name || 'Walk-in Customer'}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 rounded w-fit mt-1">{item.bill_no}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-emerald-400">₹{item.total.toFixed(2)}</div>
                                    <div className="text-[10px] text-muted-foreground">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="p-4 border-t border-border grid grid-cols-2 gap-3 bg-muted/20">
                        <button onClick={() => navigate('/products')} className="p-3 rounded-xl bg-background border border-border flex items-center justify-center gap-2 hover:bg-muted/80 hover:border-primary/30 hover:text-primary transition-all group">
                            <PackagePlus size={16} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wide text-foreground group-hover:text-primary">Add Item</span>
                        </button>
                        <button onClick={() => navigate('/staff')} className="p-3 rounded-xl bg-background border border-border flex items-center justify-center gap-2 hover:bg-muted/80 hover:border-primary/30 hover:text-primary transition-all group">
                            <UserCircle size={16} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wide text-foreground group-hover:text-primary">Add User</span>
                        </button>
                    </div>
                </div>

                {/* --- QUICK ACTIONS --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onClick={() => navigate('/billing')} className="bg-surface border border-border hover:border-blue-500/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group hover:shadow-md h-24">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Plus size={18} strokeWidth={3} />
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-bold text-foreground">New Bill</div>
                        </div>
                    </button>

                    <button onClick={() => navigate('/products')} className="bg-surface border border-border hover:border-emerald-500/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group hover:shadow-md h-24">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <Package size={18} strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-bold text-foreground">Add Item</div>
                        </div>
                    </button>

                    <button onClick={() => navigate('/cash-register')} className="bg-surface border border-border hover:border-rose-500/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group hover:shadow-md h-24">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            <Wallet size={18} strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-bold text-foreground">Expense</div>
                        </div>
                    </button>

                    <button onClick={() => navigate('/reports')} className="bg-surface border border-border hover:border-purple-500/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group hover:shadow-md h-24">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <FileText size={18} strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-bold text-foreground">Reports</div>
                        </div>
                    </button>
                </div>

                {/* --- FUNCTIONAL WIDGETS (Live Cash & Sales Goal) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Live Cash Widget */}
                    <div
                        onClick={() => navigate('/cash-register')}
                        className="bg-surface/50 backdrop-blur-md border border-border rounded-xl p-6 shadow-lg flex items-center justify-between relative overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all group"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-muted-foreground group-hover:text-emerald-500 transition-colors">Live Cash In Hand</span>
                            </div>
                            <div className="text-3xl font-black text-foreground tracking-tight">
                                {cashBalance !== null ? `₹${cashBalance.toLocaleString()}` : <span className="text-sm text-muted-foreground">Session Closed</span>}
                            </div>
                            {cashBalance !== null && (
                                <div className="text-[10px] font-medium mt-1 flex flex-col gap-0.5">
                                    <span className="text-emerald-500 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active Session
                                    </span>
                                    <div className="flex flex-col text-muted-foreground opacity-80">
                                        <span title="Cash already in drawer when session started">Opening: ₹{openingBalance.toLocaleString()}</span>
                                        <span>Since: {new Date(sessionStartTime!).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <IndianRupee size={24} />
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
                    </div>

                    {/* Sales Goal Widget */}
                    <div className="bg-surface/50 backdrop-blur-md border border-border rounded-xl p-6 shadow-lg flex flex-col justify-center relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-muted-foreground">Daily Sales Goal</span>
                            </div>
                            <div className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                                {salesGoal ? `${Math.min(100, Math.round((salesGoal.currentTotal / (salesGoal.dailyAverage || 1)) * 100))}%` : '0%'}
                            </div>
                        </div>

                        <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden relative z-10">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out relative"
                                style={{ width: `${salesGoal ? Math.min(100, (salesGoal.currentTotal / (salesGoal.dailyAverage || 1)) * 100) : 0}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-2 text-[10px] font-medium text-muted-foreground relative z-10">
                            <span>₹{salesGoal?.currentTotal?.toLocaleString() || 0}</span>
                            <span>Target: ₹{salesGoal?.dailyAverage ? Math.round(salesGoal.dailyAverage).toLocaleString() : '---'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg, subtext, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`
                bg-surface/50 backdrop-blur-md border border-border rounded-xl p-6 flex flex-col justify-between h-40 
                transition-all duration-300 group
                ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-glow hover:border-primary/30' : 'hover:border-border'}
            `}
        >
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
                <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} className="drop-shadow-lg" />
                </div>
            </div>

            <div className="mt-4">
                <h3 className="text-3xl font-bold text-foreground tracking-tight">{value}</h3>
                {subtext && (
                    <div className="mt-2 flex items-center">
                        <p className={`text-xs font-bold ${color} bg-muted/50 px-2 py-0.5 rounded-md`}>{subtext}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
