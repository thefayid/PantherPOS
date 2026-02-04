import { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import {
    Calculator,
    Download
} from 'lucide-react';
import { Button } from '../components/Button';

export default function TrialBalance() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await accountingService.getTrialBalance();
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const totalDebit = data.reduce((sum, acc) => {
        // Asset/Expense normally Debit positive. Liability/Income/Equity normally Credit positive.
        // In our DB, we store 'balance'.
        // Let's assume positive balance = normal balance for that type.
        // Or we just checking if Debit = Credit.
        // Actually, Trial Balance usually lists everything.
        // For Assets/Expenses: Positive Balance = Debit.
        // For Others: Positive Balance = Credit.

        if (acc.type === 'ASSET' || acc.type === 'EXPENSE') return sum + (acc.balance > 0 ? acc.balance : 0);
        // If an asset has negative balance, it's a credit.
        if ((acc.type === 'LIABILITY' || acc.type === 'EQUITY' || acc.type === 'INCOME') && acc.balance < 0) return sum + Math.abs(acc.balance);
        return sum;
    }, 0);

    const totalCredit = data.reduce((sum, acc) => {
        if (acc.type === 'LIABILITY' || acc.type === 'EQUITY' || acc.type === 'INCOME') return sum + (acc.balance > 0 ? acc.balance : 0);
        if ((acc.type === 'ASSET' || acc.type === 'EXPENSE') && acc.balance < 0) return sum + Math.abs(acc.balance);
        return sum;
    }, 0);

    if (loading) {
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
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">Trial Balance</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">As of {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <Button variant="secondary" className="gap-2 text-[10px] font-black uppercase tracking-widest">
                    <Download size={16} /> Export
                </Button>
            </div>

            <div className="flex-1 bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-0 relative">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/30 sticky top-0 z-10 border-b border-border backdrop-blur-md">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Code</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Name</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Debit</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {data.map((acc, idx) => {
                                let debit = 0;
                                let credit = 0;

                                if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
                                    if (acc.balance >= 0) debit = acc.balance;
                                    else credit = Math.abs(acc.balance);
                                } else {
                                    if (acc.balance >= 0) credit = acc.balance;
                                    else debit = Math.abs(acc.balance);
                                }

                                return (
                                    <tr key={idx} className="hover:bg-primary/5 transition-colors">
                                        <td className="p-6 text-xs font-bold text-muted-foreground">{acc.code}</td>
                                        <td className="p-6 text-sm font-black text-foreground">{acc.name}</td>
                                        <td className="p-6 text-right text-sm font-bold text-foreground">
                                            {debit > 0 ? `₹${debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="p-6 text-right text-sm font-bold text-foreground">
                                            {credit > 0 ? `₹${credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Totals */}
                            <tr className="bg-muted/20 border-t-2 border-border font-black">
                                <td colSpan={2} className="p-6 text-right text-xs uppercase tracking-widest text-foreground">Total</td>
                                <td className="p-6 text-right text-sm text-foreground">₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="p-6 text-right text-sm text-foreground">₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
