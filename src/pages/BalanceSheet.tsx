import { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import {
    Landmark,
    Download,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { Button } from '../components/Button';

export default function BalanceSheet() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await accountingService.getBalanceSheet();
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => `₹${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    if (loading || !data) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-6 p-2 animate-in fade-in duration-500">
            <div className="bg-surface border border-border rounded-3xl p-6 flex justify-between items-center shadow-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Landmark size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">Balance Sheet</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Statement of Financial Position</p>
                    </div>
                </div>
                <Button variant="secondary" className="gap-2 text-[10px] font-black uppercase tracking-widest">
                    <Download size={16} /> Export
                </Button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    {/* ASSETS */}
                    <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Assets</h2>
                            <TrendingUp className="text-emerald-500" size={20} />
                        </div>

                        <div className="space-y-3 flex-1">
                            {data.assets.length === 0 && <p className="text-muted-foreground text-xs italic">No assets recorded.</p>}
                            {data.assets.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-muted/10">
                                    <span className="text-sm font-bold text-muted-foreground">{item.name}</span>
                                    <span className="font-black text-foreground">{formatCurrency(item.balance)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Total Assets</span>
                            <span className="text-xl font-black text-emerald-600">{formatCurrency(data.totalAssets)}</span>
                        </div>
                    </div>

                    {/* LIABILITIES & EQUITY */}
                    <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Liabilities & Equity</h2>
                            <TrendingDown className="text-orange-500" size={20} />
                        </div>

                        <div className="space-y-6 flex-1">
                            {/* Liabilities */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-2 mb-2">Liabilities</h3>
                                {data.liabilities.length === 0 && <p className="text-muted-foreground text-xs italic pl-2">No liabilities recorded.</p>}
                                {data.liabilities.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-muted/10">
                                        <span className="text-sm font-bold text-muted-foreground">{item.name}</span>
                                        <span className="font-black text-foreground">{formatCurrency(item.balance)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Equity */}
                            <div className="space-y-3 pt-4 border-t border-border/50">
                                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-2 mb-2">Equity</h3>
                                {data.equity.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-muted/10">
                                        <span className="text-sm font-bold text-muted-foreground">{item.name}</span>
                                        <span className="font-black text-foreground">{formatCurrency(item.balance)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center bg-orange-500/5 p-4 rounded-2xl border border-orange-500/10">
                            <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Total Liabilities & Equity</span>
                            <span className="text-xl font-black text-orange-600">{formatCurrency(data.totalLiabilitiesEquity)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
