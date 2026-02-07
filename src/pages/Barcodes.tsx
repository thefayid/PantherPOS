import { useState, useEffect, useMemo, useRef } from 'react';
import { productService } from '../services/productService';
import type { Product } from '../types/db';
import { Search, Printer, Trash2, Grid, Plus, Minus, Barcode, Settings2, ScanBarcode, RotateCcw } from 'lucide-react';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { useReactToPrint } from 'react-to-print';
import LabelDesigner, { type LabelConfig } from '../components/LabelDesigner';
import { QuickAddProductModal } from '../components/QuickAddProductModal';

export default function Barcodes() {
    const STORAGE_KEY = 'barcodes_last_state_v1';
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [queue, setQueue] = useState<{ product: Product, qty: number }[]>([]);
    const [config, setConfig] = useState<LabelConfig>({
        width: 200,
        height: 120,
        fontSize: 12,
        showName: true,
        showPrice: true,
        columns: 4,
        gap: 16,
        barcodeType: '1D'
    });
    const [designerOpen, setDesignerOpen] = useState(false);
    const [scanValue, setScanValue] = useState('');
    const scanRef = useRef<HTMLInputElement>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [pendingBarcode, setPendingBarcode] = useState<string>('');
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
    });

    const restoreFromStorage = (allProducts: Product[]) => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed?.config) {
                setConfig((prev) => ({ ...prev, ...parsed.config }));
            }
            if (Array.isArray(parsed?.queue)) {
                const restored = parsed.queue
                    .map((q: any) => {
                        const p = allProducts.find(x => x.id === q.productId);
                        if (!p) return null;
                        const qty = Math.max(1, Number(q.qty) || 1);
                        return { product: p, qty };
                    })
                    .filter(Boolean) as { product: Product; qty: number }[];
                if (restored.length) setQueue(restored);
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => { loadProducts(true); }, []);
    useEffect(() => {
        // Prefer scan-first workflow.
        setTimeout(() => scanRef.current?.focus(), 100);
    }, []);

    const loadProducts = async (restore: boolean = false) => {
        const all = await productService.getAll();
        setProducts(all);
        if (restore) restoreFromStorage(all);
    };

    const addToQueue = (product: Product) => {
        setQueue(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { product, qty: 1 }];
        });
    };

    const removeFromQueue = (id: number) => { setQueue(prev => prev.filter(i => i.product.id !== id)); };
    const updateQty = (id: number, newQty: number) => { if (newQty < 1) return; setQueue(prev => prev.map(i => i.product.id === id ? { ...i, qty: newQty } : i)); };

    const filteredProducts = useMemo(() => {
        const q = search.trim().toLowerCase();
        return products
            .filter(p => p.name.toLowerCase().includes(q) || p.barcode.includes(search))
            .slice(0, 20);
    }, [products, search]);

    const persistState = () => {
        try {
            const payload = {
                config,
                queue: queue.map(i => ({ productId: i.product.id, qty: i.qty })),
                updatedAt: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        persistState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queue, config]);

    const processScan = async () => {
        const code = scanValue.trim();
        if (!code) return;

        const product = await productService.getByBarcode(code);
        if (product) {
            addToQueue(product);
            setScanValue('');
            requestAnimationFrame(() => scanRef.current?.focus());
            return;
        }

        setPendingBarcode(code);
        setCreateOpen(true);
    };

    return (
        <div className="h-full flex gap-6 bg-background text-foreground p-6 overflow-hidden">
            {/* LEFT: Product Selector */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Header / Search */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Label Printer</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative w-[280px]">
                            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                            <input
                                ref={scanRef}
                                className="w-full bg-surface border border-primary/20 rounded-xl pl-12 pr-4 py-4 text-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all shadow-lg placeholder:text-muted-foreground/50 font-mono"
                                placeholder="Scan barcode..."
                                value={scanValue}
                                onChange={(e) => setScanValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        processScan();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="relative flex-1 group">
                            <input
                                className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-4 text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-lg placeholder:text-muted-foreground/50"
                                placeholder="Search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                        </div>
                        <button
                            onClick={() => setDesignerOpen(!designerOpen)}
                            className={`p-4 rounded-xl border transition-all flex items-center gap-2 font-bold ${designerOpen ? 'bg-primary border-primary text-primary-foreground shadow-glow' : 'bg-surface border-border text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Settings2 size={20} />
                            <span className="hidden lg:inline">Design Labels</span>
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem(STORAGE_KEY);
                                setQueue([]);
                                setConfig({
                                    width: 200,
                                    height: 120,
                                    fontSize: 12,
                                    showName: true,
                                    showPrice: true,
                                    columns: 4,
                                    gap: 16,
                                    barcodeType: '1D'
                                });
                                requestAnimationFrame(() => scanRef.current?.focus());
                            }}
                            className="p-4 rounded-xl border bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all flex items-center gap-2 font-bold"
                            title="Reset queue & design"
                        >
                            <RotateCcw size={20} />
                            <span className="hidden xl:inline">Reset</span>
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto bg-surface rounded-xl border border-border shadow-inner p-4 custom-scrollbar">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(p => (
                            <button
                                key={p.id}
                                onClick={() => addToQueue(p)}
                                className="text-left p-4 bg-background hover:bg-muted border border-border hover:border-primary/50 rounded-xl transition-all group flex flex-col gap-3 h-full justify-between shadow-sm"
                            >
                                <div className="flex justify-between items-start w-full">
                                    <span className="text-[10px] font-bold bg-muted px-2 py-1 rounded text-muted-foreground">ID: {p.id}</span>
                                    <span className="text-sm font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">₹{p.sell_price}</span>
                                </div>
                                <div className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">{p.name}</div>
                                <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 p-1.5 bg-muted/50 rounded border border-border opacity-70">
                                    <Barcode size={14} /> {p.barcode}
                                </div>
                            </button>
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Search size={48} strokeWidth={1} className="mb-4" />
                            <p className="text-lg font-medium">No products found matched your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Print Queue & Designer */}
            <div className={`flex flex-col gap-4 transition-all duration-500 overflow-hidden ${designerOpen ? 'w-[750px]' : 'w-[400px]'}`}>
                <div className="flex gap-4 h-full min-h-0">
                    {/* Designer Panel */}
                    {designerOpen && (
                        <div className="flex-1 min-w-[320px] overflow-y-auto custom-scrollbar no-scrollbar">
                            <LabelDesigner config={config} onChange={setConfig} />
                        </div>
                    )}

                    {/* Queue Panel */}
                    <div className={`flex flex-col bg-surface rounded-xl border border-border shadow-xl overflow-hidden h-full ${designerOpen ? 'w-[380px]' : 'w-full'}`}>
                        <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Printer size={20} className="text-primary" /> Print Queue
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Ready to print labels</p>
                            </div>
                            <span className="text-sm font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full shadow-sm">
                                {queue.reduce((a, b) => a + b.qty, 0)} Total
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar no-scrollbar">
                            {queue.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground pb-20">
                                    <Grid size={48} className="mb-4 opacity-10" />
                                    <p className="font-bold text-lg opacity-50">Queue is empty</p>
                                    <p className="text-xs text-center opacity-40 max-w-[200px] mt-2">Select products from the left to add them to the print queue</p>
                                </div>
                            ) : (
                                queue.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl group hover:border-primary/30 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold truncate text-foreground">{item.product.name}</div>
                                            <div className="text-xs font-mono text-muted-foreground opacity-70">{item.product.barcode}</div>
                                        </div>
                                        <div className="flex items-center bg-background rounded-lg p-0.5 border border-border">
                                            <button onClick={() => updateQty(item.product.id, item.qty - 1)} disabled={item.qty <= 1} className="p-2 hover:bg-muted rounded-md disabled:opacity-30 text-foreground transition-colors"><Minus size={14} /></button>
                                            <span className="w-8 text-center font-bold text-sm text-primary">{item.qty}</span>
                                            <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="p-2 hover:bg-muted rounded-md text-foreground transition-colors"><Plus size={14} /></button>
                                        </div>
                                        <button onClick={() => removeFromQueue(item.product.id)} className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="hidden">
                            <div ref={componentRef} className="p-4 bg-white">
                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
                                        gap: `${config.gap}px`
                                    }}
                                >
                                    {queue.flatMap(item => Array(item.qty).fill(item.product)).map((p, i) => (
                                        <div
                                            key={i}
                                            className="border border-black flex flex-col items-center justify-center overflow-hidden"
                                            style={{
                                                width: `${config.width}px`,
                                                height: `${config.height}px`,
                                                padding: '5px'
                                            }}
                                        >
                                            {config.showName && (
                                                <div
                                                    className="font-bold text-center w-full truncate text-black mb-1"
                                                    style={{ fontSize: `${config.fontSize}px` }}
                                                >
                                                    {p.name.toUpperCase()}
                                                </div>
                                            )}
                                            <BarcodeLabel
                                                value={p.barcode}
                                                type={config.barcodeType}
                                                name={p.name}
                                                price={p.sell_price}
                                                className="!p-0 !bg-transparent !shadow-none !border-none scale-90"
                                            />
                                            {config.showPrice && (
                                                <div
                                                    className="font-black text-black mt-1"
                                                    style={{ fontSize: `${config.fontSize + 2}px` }}
                                                >
                                                    ₹{p.sell_price.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-muted/30">
                            <button
                                onClick={handlePrint}
                                disabled={queue.length === 0}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transaction-all shadow-lg ${queue.length === 0 ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow border border-transparent hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                <Printer size={20} /> Print {queue.reduce((a, b) => a + b.qty, 0)} Labels
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <QuickAddProductModal
                isOpen={createOpen}
                onClose={() => {
                    setCreateOpen(false);
                    setPendingBarcode('');
                    setScanValue('');
                    requestAnimationFrame(() => scanRef.current?.focus());
                }}
                initialData={{ barcode: pendingBarcode }}
                onSuccess={async () => {
                    await loadProducts(false);
                    if (pendingBarcode) {
                        const created = await productService.getByBarcode(pendingBarcode);
                        if (created) addToQueue(created);
                    }
                    setCreateOpen(false);
                    setPendingBarcode('');
                    setScanValue('');
                    requestAnimationFrame(() => scanRef.current?.focus());
                }}
            />
        </div>
    );
}
