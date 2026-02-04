import { useState, useEffect, useRef } from 'react';
import { productService } from '../services/productService';
import { inventoryService } from '../services/inventoryService';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ClipboardList, Barcode, CheckCircle2, Search, PlusCircle, Trash2 } from 'lucide-react';

export default function Stocktake() {
    const [activeSession, setActiveSession] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCountModalOpen, setIsCountModalOpen] = useState(false);
    const [scanQuery, setScanQuery] = useState('');
    const [foundProduct, setFoundProduct] = useState<any>(null);
    const [countInput, setCountInput] = useState('');
    const scanInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadActiveSession(); }, []);

    const loadActiveSession = async () => {
        try {
            setLoading(true);
            const session = await inventoryService.getActiveSession();
            if (session) {
                setActiveSession(session);
                const sessionItems = await inventoryService.getSessionItems(session.id);
                setItems(sessionItems);
            }
        } catch (error) {
            console.error('Failed to load stocktake session:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async () => {
        try {
            const sessionId = await inventoryService.startStocktake();
            // Fetch the updated session state
            const session = await inventoryService.getActiveSession();
            setActiveSession(session);
            setItems([]);
        } catch (error) {
            alert('Failed to start session');
        }
    };

    useEffect(() => {
        if (scanQuery.length > 0) {
            const timer = setTimeout(() => {
                const product = productService.searchProductsLocal(scanQuery)[0];
                if (product) {
                    setFoundProduct(product);
                    setCountInput('');
                    setIsCountModalOpen(true);
                    setScanQuery('');
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [scanQuery]);

    const handleSaveCount = async () => {
        if (!activeSession || !foundProduct || !countInput) return;
        try {
            const counted = parseFloat(countInput);
            await inventoryService.saveCount(activeSession.id, foundProduct.id, counted);
            await loadActiveSession();
            setIsCountModalOpen(false);
            setFoundProduct(null);
            scanInputRef.current?.focus();
        } catch (error) {
            alert('Failed to save count');
        }
    };

    const handleFinalize = async () => {
        if (!confirm('Finalizing will update all system stock levels based on your counts. This cannot be undone.')) return;
        try {
            await inventoryService.finalizeStocktake(activeSession.id);
            setActiveSession(null);
            setItems([]);
            alert('Stocktake finalized successfully!');
        } catch (error) {
            alert('Failed to finalize session');
        }
    };

    const removeItem = async (productId: number) => {
        if (!confirm('Remove this item from the list?')) return;
        try {
            await inventoryService.deleteCount(activeSession.id, productId);
            loadActiveSession();
        } catch (error) {
            alert('Failed to remove item');
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background text-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!activeSession) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-background text-foreground p-6">
                <div className="bg-surface p-12 rounded-2xl border border-border shadow-2xl flex flex-col items-center max-w-lg text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <ClipboardList size={40} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 tracking-tight">System Stocktake</h2>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        Verify your physical inventory and reconcile it with the system. Click start to begin a new counting session.
                    </p>
                    <Button onClick={handleStartSession} className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow h-auto">
                        <PlusCircle size={20} className="mr-2" /> Start New Session
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Active Stocktake</h1>
                    <p className="text-muted-foreground">Session started on {new Date(activeSession.created_at).toLocaleString()}</p>
                </div>
                <Button onClick={handleFinalize} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-glow border-none px-6">
                    <CheckCircle2 size={18} className="mr-2" /> Finalize & Update Stock
                </Button>
            </div>

            <div className="mb-6">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
                    <input
                        ref={scanInputRef}
                        type="text"
                        value={scanQuery}
                        onChange={(e) => setScanQuery(e.target.value)}
                        className="w-full bg-muted/20 border border-border rounded-xl px-16 py-4 text-xl font-mono text-foreground focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/30 transition-all shadow-inner"
                        placeholder="Scan Barcode or Search Product..."
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-border shadow-xl flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-4 font-medium border-b border-border">Product</th>
                                <th className="p-4 font-medium border-b border-border text-center">System Stock</th>
                                <th className="p-4 font-medium border-b border-border text-center">Counted</th>
                                <th className="p-4 font-medium border-b border-border text-right">Variance</th>
                                <th className="p-4 font-medium border-b border-border text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item, i) => (
                                <tr key={i} className="hover:bg-muted/50 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-foreground text-lg">{item.name}</div>
                                        <div className="text-sm text-muted-foreground font-mono bg-muted/50 inline-block px-2 py-0.5 rounded border border-border mt-1">
                                            {item.barcode}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-mono text-muted-foreground">{item.system_stock}</td>
                                    <td className="p-4 text-center">
                                        <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg border border-primary/20">{item.counted_stock}</span>
                                    </td>
                                    <td className={`p-4 text-right font-bold ${item.variance === 0 ? 'text-muted-foreground' : item.variance > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                                        {item.variance > 0 ? '+' : ''}{item.variance}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => removeItem(item.product_id)} className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                                <ClipboardList size={32} className="opacity-50" />
                                            </div>
                                            <p>No items counted yet. Scan a product to start.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isCountModalOpen} onClose={() => setIsCountModalOpen(false)} title="Verify Stock Count">
                {foundProduct && (
                    <div className="flex flex-col gap-6 p-1">
                        <div className="text-center p-6 bg-muted/50 border border-border rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Barcode size={48} />
                            </div>
                            <h3 className="font-bold text-xl text-foreground mb-2">{foundProduct.name}</h3>
                            <p className="font-mono text-emerald-500 text-sm bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/20">
                                {foundProduct.barcode}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-center block text-xs font-bold text-muted-foreground uppercase tracking-widest">Enter Quantity Found</label>
                            <input
                                type="number"
                                value={countInput}
                                onChange={(e) => setCountInput(e.target.value)}
                                className="w-full bg-muted/20 border border-border rounded-xl p-6 text-5xl font-bold text-center text-foreground focus:border-primary/50 focus:outline-none shadow-inner"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCount(); }}
                                placeholder="0"
                            />
                            <div className={`text-center text-sm font-bold mt-2 p-2 rounded-lg border flex justify-center items-center gap-2 ${(parseFloat(countInput || '0') - foundProduct.stock) === 0 ? 'bg-muted/5 border-border text-muted-foreground' :
                                (parseFloat(countInput || '0') - foundProduct.stock) > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                    'bg-destructive/10 border-destructive/20 text-destructive'
                                }`}>
                                Variance: {parseFloat(countInput || '0') - foundProduct.stock} (System: {foundProduct.stock})
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-border">
                            <Button variant="ghost" onClick={() => setIsCountModalOpen(false)} className="flex-1">Cancel</Button>
                            <Button onClick={handleSaveCount} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow text-lg py-6">Confirm Count</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
