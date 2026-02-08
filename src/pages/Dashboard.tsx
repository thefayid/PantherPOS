import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { cashService } from '../services/cashService';
import { customerService } from '../services/customerService';
import { useUI } from '../context/UIContext';
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
    Target,
    RefreshCw,
    BookOpen
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
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [khataSummary, setKhataSummary] = useState({ totalBalance: 0, customerCount: 0 });

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

            const [dashboardStats, activity, hourly, payments, projection, session, lowStock, khata] = await Promise.all([
                reportService.getDashboardStats(),
                reportService.getRecentActivity(),
                reportService.getHourlySales(today, today),
                reportService.getPaymentSplit(today, today),
                reportService.getSalesProjection(),
                cashService.getCurrentSession(),
                reportService.getLowStockWarning(),
                customerService.getReceivablesSummary()
            ]);

            setStats(dashboardStats);
            setRecentActivity(activity);
            setHourlySales(hourly);
            setPaymentSplit(payments);
            setSalesGoal(projection);
            setLowStockItems(lowStock);
            setKhataSummary(khata);

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
        <div className="h-full overflow-hidden flex flex-col bg-mac-bg relative">
            {/* Top Status Ticker */}
            <StatusTicker activity={recentActivity} alerts={lowStockItems} />

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-24">
                {/* Compact Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground mb-1">COMMAND CENTER</h1>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Operational Dashboard v2.0</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Local Network</div>
                            <div className="text-xs font-mono font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Metric Charts Header */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <MetricAreaChart
                            data={hourlySales}
                            title="Hourly Sales Velocity"
                            color="#10b981"
                        />
                    </div>
                    <div className="flex flex-col gap-6">
                        <StatCard
                            title="Live Cash Flow"
                            value={cashBalance !== null ? `₹${cashBalance.toLocaleString()}` : "CLOSED"}
                            icon={IndianRupee}
                            color="text-emerald-400"
                            bg="bg-emerald-400/10"
                            subtext={sessionStartTime ? `Since ${new Date(sessionStartTime).toLocaleDateString()}` : "No Active Session"}
                            onClick={() => navigate('/cash')}
                        />
                        <div className="bg-mac-surface-secondary border border-white/5 rounded-2xl p-6 flex-1 flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sales Goal</span>
                                <span className="text-xs font-black text-amber-500">{salesGoal ? `${Math.min(100, Math.round((salesGoal.currentTotal / (salesGoal.dailyAverage || 1)) * 100))}%` : '0%'}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse"
                                    style={{ width: `${salesGoal ? Math.min(100, (salesGoal.currentTotal / (salesGoal.dailyAverage || 1)) * 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Today's Volume"
                        value={`₹${stats.todaySales.toFixed(0)}`}
                        icon={TrendingUp}
                        color="text-blue-400"
                        bg="bg-blue-400/10"
                        subtext={`${stats.billCount} Transactions`}
                    />
                    <StatCard
                        title="Avg Ticket"
                        value={`₹${(stats.billCount > 0 ? stats.todaySales / stats.billCount : 0).toFixed(0)}`}
                        icon={ShoppingCart}
                        color="text-indigo-400"
                        bg="bg-indigo-400/10"
                        subtext="Per Customer"
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
                    <StatCard
                        title="Credit Khata"
                        value={`₹${khataSummary.totalBalance.toFixed(0)}`}
                        icon={BookOpen}
                        color="text-rose-400"
                        bg="bg-rose-400/10"
                        subtext={`${khataSummary.customerCount} Active Debtors`}
                        onClick={() => navigate('/khata')}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Feed */}
                    <div className="lg:col-span-1 bg-mac-surface-secondary border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Pulse</h3>
                            <button onClick={() => loadDashboard()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-3 custom-scrollbar min-h-[300px]">
                            {recentActivity.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <ShoppingCart size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground">{item.customer_name || 'Walk-in'}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono uppercase opacity-50">{item.bill_no}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-emerald-400">₹{item.total.toFixed(0)}</div>
                                        <div className="text-[10px] text-muted-foreground">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stock Heatmap & Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <StockHeatmap items={lowStockItems} />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'New Bill', path: '/sales', icon: Plus, color: 'text-blue-400' },
                                { label: 'Inventory', path: '/products', icon: Package, color: 'text-emerald-400' },
                                { label: 'Expenses', path: '/cash', icon: Wallet, color: 'text-rose-400' },
                                { label: 'Reports', path: '/reports', icon: FileText, color: 'text-purple-400' },
                                { label: 'Khata', path: '/khata', icon: BookOpen, color: 'text-amber-400' }
                            ].map((btn, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(btn.path)}
                                    className="bg-mac-surface-secondary border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-3 transition-all hover:border-white/20 hover:-translate-y-1 group"
                                >
                                    <div className={`p-3 rounded-full bg-white/5 ${btn.color} group-hover:scale-110 transition-transform`}>
                                        <btn.icon size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">{btn.label}</span>
                                </button>
                            ))}
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
                bg-mac-surface-secondary/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col justify-between h-40 
                transition-all duration-300 group relative overflow-hidden
                ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-glow hover:border-primary/30' : 'hover:border-white/10'}
            `}
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-start relative z-10">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</span>
                <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform duration-300 shadow-inner border border-white/5`}>
                    <Icon size={18} className="drop-shadow-lg" />
                </div>
            </div>

            <div className="mt-4 relative z-10">
                <h3 className="text-3xl font-black text-foreground tracking-tighter">{value}</h3>
                {subtext && (
                    <div className="mt-2 flex items-center">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${color} bg-white/5 px-2 py-0.5 rounded-md border border-white/5`}>{subtext}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusTicker({ activity, alerts }: { activity: any[], alerts: any[] }) {
    const items = [
        ...alerts.map(a => ({ text: `⚠️ ALERT: ${a.name} is low on stock (${a.stock} left)`, color: 'text-orange-400' })),
        ...activity.map(a => ({ text: `✨ NEW SALE: ₹${a.total.toFixed(0)} to ${a.customer_name || 'Walk-in'}`, color: 'text-emerald-400' })),
        { text: `✅ SYSTEM OPERATIONAL: ${new Date().toLocaleDateString()}`, color: 'text-blue-400' }
    ];

    return (
        <div className="w-full bg-black/40 backdrop-blur-xl border-y border-white/5 h-10 flex items-center overflow-hidden font-mono text-[10px] font-black tracking-widest uppercase">
            <div className="flex gap-12 animate-[ticker_30s_linear_infinite] whitespace-nowrap px-12">
                {[...items, ...items].map((item, i) => (
                    <span key={i} className={`flex items-center gap-3 ${item.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                        {item.text}
                    </span>
                ))}
            </div>
        </div>
    );
}

function MetricAreaChart({ data, title, height = 160, color = "#3b82f6" }: { data: any[], title: string, height?: number, color?: string }) {
    if (!data.length) return <div className="h-40 flex items-center justify-center text-muted-foreground text-xs uppercase font-black">No Data Available</div>;

    const maxVal = Math.max(...data.map(d => d.total), 1);
    const width = 1000;
    const padding = 40;

    // Generate SVG path for a smooth curve
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((d.total / maxVal) * (height - padding * 2) + padding);
        return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const cx = (curr.x + next.x) / 2;
        path += ` C ${cx} ${curr.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
    }

    const fillPath = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
        <div className="bg-mac-surface-secondary border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                    <span className="text-[10px] font-bold text-foreground">LIVE STREAM</span>
                </div>
            </div>

            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-2xl">
                    <defs>
                        <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={fillPath} fill={`url(#grad-${title})`} />
                    <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-[grow_2s_ease-out]" />

                    {/* Data Points */}
                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="6" fill="#0d1117" stroke={color} strokeWidth="3" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    ))}
                </svg>
            </div>
        </div>
    );
}

function StockHeatmap({ items }: { items: any[] }) {
    return (
        <div className="bg-mac-surface-secondary border border-white/5 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Stock Health Status</h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {items.slice(0, 30).map((item, i) => {
                    const health = Math.min(100, (item.stock / (item.min_stock_level * 2)) * 100);
                    const color = health < 30 ? 'bg-rose-500' : health < 70 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                        <div
                            key={i}
                            title={`${item.name}: ${item.stock} / ${item.min_stock_level}`}
                            className={`aspect-square rounded-sm ${color} opacity-40 hover:opacity-100 hover:scale-125 transition-all duration-300 cursor-help shadow-glow border border-white/10`}
                        />
                    );
                })}
            </div>
        </div>
    );
}
