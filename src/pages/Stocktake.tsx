import { useState, useEffect, useRef } from 'react';
import { productService } from '../services/productService';
import { inventoryService } from '../services/inventoryService';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ClipboardList, Barcode, CheckCircle2, Search, PlusCircle, Trash2, History, XCircle, Eye } from 'lucide-react';
import { permissionsService } from '../services/permissionsService';
import { ManagerPinModal } from '../components/ManagerPinModal';

export default function Stocktake() {
    const currentUser = permissionsService.getCurrentUser();
    const canRunStocktake = permissionsService.can('RUN_STOCKTAKE', currentUser);
    const [overrideGranted, setOverrideGranted] = useState(false);
    const [isPinOpen, setIsPinOpen] = useState(false);

    if (!canRunStocktake && !overrideGranted) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-background text-foreground p-8">
                <div className="bg-surface border border-border rounded-2xl shadow-2xl p-10 max-w-xl w-full text-center space-y-4">
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Restricted</div>
                    <h2 className="text-2xl font-black tracking-tight">Stocktake Locked</h2>
                    <p className="text-sm text-muted-foreground font-medium">
                        Stocktake is restricted to Managers and Administrators.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                        <Button variant="ghost" onClick={() => window.history.back()}>Go Back</Button>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white border-none" onClick={() => setIsPinOpen(true)}>
                            Manager PIN Override
                        </Button>
                    </div>
                </div>

                <ManagerPinModal
                    isOpen={isPinOpen}
                    onClose={() => setIsPinOpen(false)}
                    minRole={permissionsService.getOverrideMinRole('RUN_STOCKTAKE')}
                    title="Manager Authorization"
                    description="Enter a Manager/Admin PIN to access Stocktake."
                    auditAction="MANAGER_OVERRIDE"
                    auditDetails={{ action: 'RUN_STOCKTAKE', page: 'Stocktake' }}
                    onApproved={() => {
                        setIsPinOpen(false);
                        setOverrideGranted(true);
                    }}
                />
            </div>
        );
    }

    const [activeSession, setActiveSession] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCountModalOpen, setIsCountModalOpen] = useState(false);
    const [scanQuery, setScanQuery] = useState('');
    const [foundProduct, setFoundProduct] = useState<any>(null);
    const [countInput, setCountInput] = useState('');
    const scanInputRef = useRef<HTMLInputElement>(null);
    const [scanBusy, setScanBusy] = useState(false);
    const [sessionNotes, setSessionNotes] = useState('');

    const [sessions, setSessions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [viewingSession, setViewingSession] = useState<any>(null);
    const [viewingItems, setViewingItems] = useState<any[]>([]);
    const [blindMode, setBlindMode] = useState(true);

    useEffect(() => { loadActiveSession(); }, []);

    const loadActiveSession = async (refreshSessions: boolean = true) => {
        try {
            setLoading(true);
            const session = await inventoryService.getActiveSession();
            if (session) {
                setActiveSession(session);
                setSessionNotes(session.notes || '');
                // Default to blind count during active sessions (reduces confirmation bias).
                setBlindMode(true);
                const sessionItems = await inventoryService.getSessionItems(session.id);
                setItems(sessionItems);
            }
            if (refreshSessions) {
                const list = await inventoryService.listSessions(25);
                setSessions(list);
            }
        } catch (error) {
            console.error('Failed to load stocktake session:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async () => {
        try {
            await inventoryService.startStocktake(sessionNotes);
            // Fetch the updated session state
            const session = await inventoryService.getActiveSession();
            setActiveSession(session);
            setItems([]);
        } catch (error) {
            alert('Failed to start session');
        }
    };

    const processScan = async (raw: string) => {
        if (!activeSession) return;
        const q = raw.trim();
        if (!q) return;
        if (scanBusy) return;

        setScanBusy(true);
        try {
            // 1) Exact barcode match first (fast + scan-first)
            let product: any | undefined;
            try {
                product = await productService.getByBarcode(q);
            } catch { /* ignore */ }

            // 2) Fallback: DB-backed search (still offline) for cases where scanner sends partials
            if (!product) {
                try {
                    const rows = await productService.search(q);
                    product = rows?.[0];
                } catch { /* ignore */ }
            }

            // 3) Last fallback: local mock search
            if (!product) {
                try {
                    product = productService.searchProductsLocal(q)[0];
                } catch { /* ignore */ }
            }

            if (!product) {
                alert(`Product not found for: ${q}`);
                setScanQuery('');
                scanInputRef.current?.focus();
                return;
            }

            setFoundProduct(product);
            setCountInput('');
            setIsCountModalOpen(true);
            setScanQuery('');
        } finally {
            setScanBusy(false);
        }
    };

    const handleSaveCount = async () => {
        if (!activeSession || !foundProduct || !countInput) return;
        try {
            const counted = parseFloat(countInput);
            await inventoryService.saveCount(activeSession.id, foundProduct.id, counted);
            await loadActiveSession(false); // keep scan loop fast
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
            setSessionNotes('');
            setBlindMode(true);
            alert('Stocktake finalized successfully!');
            await loadActiveSession();
        } catch (error) {
            alert('Failed to finalize session');
        }
    };

    const handleCancelSession = async () => {
        if (!activeSession) return;
        if (!confirm('Cancel this stocktake session? Counts will be kept for audit but will NOT update stock.')) return;
        try {
            await inventoryService.cancelStocktake(activeSession.id, 'Cancelled by user');
            setActiveSession(null);
            setItems([]);
            setSessionNotes('');
            setBlindMode(true);
            await loadActiveSession();
            alert('Session cancelled.');
        } catch (e) {
            alert('Failed to cancel session');
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

    const openSessionHistory = async (sessionId: number) => {
        try {
            const sess = await inventoryService.getSessionById(sessionId);
            const its = await inventoryService.getSessionItems(sessionId);
            setViewingSession(sess);
            setViewingItems(its);
            setIsHistoryModalOpen(true);
        } catch (e) {
            alert('Failed to load session');
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
            <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Stocktake</h1>
                        <p className="text-muted-foreground">Create a session, count items, then finalize to post adjustments.</p>
                    </div>
                    <button
                        onClick={() => setActiveTab(activeTab === 'ACTIVE' ? 'HISTORY' : 'ACTIVE')}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-surface hover:bg-muted/30 font-bold text-sm"
                    >
                        <History size={18} /> {activeTab === 'ACTIVE' ? 'View History' : 'Back to Start'}
                    </button>
                </div>

                {activeTab === 'ACTIVE' && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="bg-surface p-10 rounded-2xl border border-border shadow-2xl flex flex-col items-center max-w-2xl w-full text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <ClipboardList size={40} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 tracking-tight">System Stocktake</h2>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        Verify your physical inventory and reconcile it with the system. Click start to begin a new counting session.
                    </p>
                    <div className="w-full max-w-xl mb-6 text-left">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Session Notes (optional)</label>
                        <textarea
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            className="w-full mt-2 h-24 p-4 bg-muted/20 text-foreground border border-border rounded-2xl resize-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-bold placeholder:text-muted-foreground/30 text-sm shadow-inner"
                            placeholder="e.g. Monthly audit, Aisle 1–4 only, Team: Rahul/Meera"
                        />
                    </div>
                    <Button onClick={handleStartSession} className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow h-auto">
                        <PlusCircle size={20} className="mr-2" /> Start New Session
                    </Button>
                </div>
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="flex-1 overflow-hidden bg-surface rounded-2xl border border-border shadow-xl flex flex-col">
                        <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/30">
                            <History size={18} className="text-muted-foreground" />
                            <h3 className="text-lg font-bold text-foreground">Recent Sessions</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="p-4 font-medium border-b border-border">Session</th>
                                        <th className="p-4 font-medium border-b border-border">Status</th>
                                        <th className="p-4 font-medium border-b border-border text-center">Items</th>
                                        <th className="p-4 font-medium border-b border-border">Started</th>
                                        <th className="p-4 font-medium border-b border-border text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sessions.map((s) => (
                                        <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                                            <td className="p-4 font-bold">#{s.id}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    s.status === 'COMPLETED'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : s.status === 'IN_PROGRESS'
                                                            ? 'bg-primary/10 text-primary border-primary/20'
                                                            : 'bg-destructive/10 text-destructive border-destructive/20'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center font-mono text-muted-foreground">{s.item_count || 0}</td>
                                            <td className="p-4 text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => openSessionHistory(s.id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted/30 font-bold text-xs"
                                                >
                                                    <Eye size={16} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {sessions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                                No sessions yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Stocktake Session #${viewingSession?.id || ''}`}>
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground font-bold">
                            Status: <span className="text-foreground">{viewingSession?.status}</span>
                            {viewingSession?.finalized_at ? <span className="ml-2">• Finalized {new Date(viewingSession.finalized_at).toLocaleString()}</span> : null}
                        </div>
                        {viewingSession?.notes ? (
                            <div className="p-4 rounded-xl border border-border bg-muted/10 text-sm whitespace-pre-wrap">
                                {viewingSession.notes}
                            </div>
                        ) : null}

                        <div className="overflow-x-auto border border-border rounded-xl">
                            <table className="w-full text-left">
                                <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3 border-b border-border">Product</th>
                                        <th className="p-3 border-b border-border text-center">System</th>
                                        <th className="p-3 border-b border-border text-center">Counted</th>
                                        <th className="p-3 border-b border-border text-right">Variance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {viewingItems.map((it: any) => (
                                        <tr key={it.id}>
                                            <td className="p-3">
                                                <div className="font-bold">{it.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{it.barcode}</div>
                                            </td>
                                            <td className="p-3 text-center font-mono text-muted-foreground">{it.system_stock}</td>
                                            <td className="p-3 text-center font-mono text-foreground">{it.counted_stock}</td>
                                            <td className={`p-3 text-right font-bold ${it.variance === 0 ? 'text-muted-foreground' : it.variance > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                                                {it.variance > 0 ? '+' : ''}{it.variance}
                                            </td>
                                        </tr>
                                    ))}
                                    {viewingItems.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-muted-foreground">No items in this session.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="ghost" onClick={() => setIsHistoryModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                </Modal>
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
                <div className="flex gap-3">
                    {blindMode ? (
                        <Button
                            variant="ghost"
                            className="border border-border"
                            onClick={() => {
                                if (confirm("Reveal expected stock & variances? This can bias counting. Recommended only after counting is complete.")) {
                                    setBlindMode(false);
                                }
                            }}
                        >
                            <Eye size={18} className="mr-2" /> Review Variances
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            className="border border-border"
                            onClick={() => setBlindMode(true)}
                        >
                            <ClipboardList size={18} className="mr-2" /> Back to Blind Count
                        </Button>
                    )}
                    <Button onClick={handleCancelSession} variant="ghost" className="border border-border">
                        <XCircle size={18} className="mr-2" /> Cancel Session
                    </Button>
                    <Button onClick={handleFinalize} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-glow border-none px-6">
                        <CheckCircle2 size={18} className="mr-2" /> Finalize & Update Stock
                    </Button>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
                    <input
                        ref={scanInputRef}
                        type="text"
                        value={scanQuery}
                        onChange={(e) => setScanQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                processScan(scanQuery);
                            }
                        }}
                        className="w-full bg-muted/20 border border-border rounded-xl px-16 py-4 text-xl font-mono text-foreground focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/30 transition-all shadow-inner"
                        placeholder={scanBusy ? "Processing scan..." : "Scan barcode → Enter count → Next"}
                        autoFocus
                    />
                </div>
                <div className="mt-2 text-xs text-muted-foreground font-bold">
                    Scan-first mode: scan a barcode, press Enter, count, press Enter again. {blindMode ? "Blind count enabled (expected stock hidden)." : "Review mode (variances visible)."}
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-border shadow-xl flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-4 font-medium border-b border-border">Product</th>
                                <th className="p-4 font-medium border-b border-border text-center">Counted</th>
                                {!blindMode && (
                                    <>
                                        <th className="p-4 font-medium border-b border-border text-center">System Stock</th>
                                        <th className="p-4 font-medium border-b border-border text-right">Variance</th>
                                    </>
                                )}
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
                                    <td className="p-4 text-center">
                                        <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg border border-primary/20">{item.counted_stock}</span>
                                    </td>
                                    {!blindMode && (
                                        <>
                                            <td className="p-4 text-center font-mono text-muted-foreground">{item.system_stock}</td>
                                            <td className={`p-4 text-right font-bold ${item.variance === 0 ? 'text-muted-foreground' : item.variance > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                                                {item.variance > 0 ? '+' : ''}{item.variance}
                                            </td>
                                        </>
                                    )}
                                    <td className="p-4 text-right">
                                        <button onClick={() => removeItem(item.product_id)} className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={blindMode ? 3 : 5} className="p-12 text-center text-muted-foreground">
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
                            <div className="text-center text-xs font-bold mt-2 p-2 rounded-lg border border-border text-muted-foreground bg-muted/10 uppercase tracking-widest">
                                Blind count: system stock is hidden during counting
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
