import { useState, useEffect } from 'react';
import { estimateService } from '../services/estimateService';
import { Plus, Check, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Estimates() {
    const [estimates, setEstimates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadEstimates = async () => {
        setLoading(true);
        const data = await estimateService.getAll();
        setEstimates(data);
        setLoading(false);
    };

    useEffect(() => {
        loadEstimates();
    }, []);

    const handleConvertToBill = async (id: number) => {
        if (!confirm('Convert this estimate to a permanent Bill? This will deduct stock.')) return;
        try {
            await estimateService.convertToBill(id);
            alert('Converted successfully!');
            loadEstimates();
        } catch (e: any) {
            alert('Error: ' + e.message);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground uppercase tracking-tighter">Estimates & Quotations</h1>
                    <p className="text-muted-foreground font-medium">Manage quotes and convert them to valid commercial bills</p>
                </div>
                <button
                    onClick={() => {
                        alert("Redirecting to POS for Estimate creation. Please add items and click the Document icon next to Pay.");
                        navigate('/');
                    }}
                    className="bg-primary hover:brightness-110 text-primary-foreground px-8 py-4 rounded-2xl shadow-glow font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                    <Plus size={18} /> New Quotation
                </button>
            </div>

            <div className="flex-1 overflow-hidden bg-surface rounded-2xl border border-border shadow-xl flex flex-col">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-black uppercase tracking-widest text-xs">
                        Pulling estimate ledger...
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-md z-10">
                                <tr>
                                    <th className="p-5 border-b border-border">Quote Reference</th>
                                    <th className="p-5 border-b border-border">Timestamp</th>
                                    <th className="p-5 border-b border-border">Customer Entity</th>
                                    <th className="p-5 border-b border-border">Lifecycle Status</th>
                                    <th className="p-5 border-b border-border text-right">Total Net</th>
                                    <th className="p-5 border-b border-border text-center">Protocol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {estimates.map(e => (
                                    <tr key={e.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="p-5 font-black text-foreground font-mono">{e.estimate_no}</td>
                                        <td className="p-5 text-muted-foreground font-medium">{new Date(e.date).toLocaleDateString()}</td>
                                        <td className="p-5 text-foreground font-bold">{e.customer_name || 'Generic Walk-in'}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-colors ${e.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                e.status === 'CONVERTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    'bg-destructive/10 text-destructive border-destructive/20'
                                                }`}>
                                                {e.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right font-black text-lg text-primary">₹{e.total_amount.toFixed(2)}</td>
                                        <td className="p-5 text-center">
                                            {e.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleConvertToBill(e.id)}
                                                    className="px-5 py-2.5 bg-emerald-500 text-white hover:brightness-110 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 border border-emerald-600/30 flex items-center gap-2 mx-auto"
                                                >
                                                    <Check size={14} /> Commit to Bill
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {estimates.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-20">
                                                <FileText size={64} strokeWidth={1} />
                                                <p className="font-black text-xs uppercase tracking-widest">No active quotations found in archives</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
