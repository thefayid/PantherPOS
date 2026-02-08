
import React, { useEffect, useState } from 'react';
import type { Product, InventoryLog } from '../types/db';
import { Button } from './Button';
import { Plus, X, Upload, Trash2, Copy, RefreshCw, Box, Layers, History, Calendar, Package, LayoutGrid, Info, Tag, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { BatchManager } from './BatchManager';
import { productService } from '../services/productService';
import { inventoryService } from '../services/inventoryService';
import clsx from 'clsx';
import { Table } from './Table';
import { generatePlaceholder } from '../utils/imageGenerator';
import { productImageFetcher } from '../services/productImageFetcher';
import toast from 'react-hot-toast';
import { Loader2, Search } from 'lucide-react';

interface ProductFormProps {
    initialData?: Partial<Product>;
    onSubmit: (data: Omit<Product, 'id'>) => void;
    onCancel: () => void;
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'VARIANTS' | 'BUNDLE' | 'HISTORY' | 'BATCHES'>('GENERAL');

    // Form State
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        barcode: '',
        cost_price: 0,
        sell_price: 0,
        stock: 0,
        gst_rate: 0,
        hsn_code: '',
        min_stock_level: 5,
        image: ''
    });

    // Variants State
    const [variants, setVariants] = useState<Product[]>([]);
    const [variantAttributes, setVariantAttributes] = useState({ Size: '', Color: '' });
    const [newVariantBarcode, setNewVariantBarcode] = useState('');
    const [loadingVariants, setLoadingVariants] = useState(false);

    const [isFetchingInfo, setIsFetchingInfo] = useState(false);

    // Bundle State
    const [isBundle, setIsBundle] = useState(false);
    const [bundleComponents, setBundleComponents] = useState<{ id: number, name: string, quantity: number }[]>([]);
    const [componentSearch, setComponentSearch] = useState('');
    const [foundComponents, setFoundComponents] = useState<Product[]>([]);

    // History State
    const [historyLogs, setHistoryLogs] = useState<InventoryLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Track if the current image is auto-generated
    const [isAutoImage, setIsAutoImage] = useState(true);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                barcode: initialData.barcode || '',
                cost_price: initialData.cost_price || 0,
                sell_price: initialData.sell_price || 0,
                stock: initialData.stock || 0,
                gst_rate: initialData.gst_rate || 0,
                hsn_code: initialData.hsn_code || '',
                min_stock_level: initialData.min_stock_level || 5,
                image: initialData.image || ''
            });

            // If we are editing and there is an existing image, assume it's NOT auto-generated (or we treat it as fixed)
            if (initialData.id && initialData.image) {
                setIsAutoImage(false);
            }

            if (initialData.variant_group_id) {
                loadVariants(initialData.variant_group_id);
            }
        }
    }, [initialData]);

    useEffect(() => {
        if (isAutoImage && formData.name.trim().length > 0) {
            const timer = setTimeout(() => {
                const generated = generatePlaceholder(formData.name);
                setFormData(prev => ({ ...prev, image: generated }));
            }, 300); // 300ms debounce
            return () => clearTimeout(timer);
        } else if (isAutoImage && formData.name.trim().length === 0) {
            setFormData(prev => ({ ...prev, image: '' }));
        }
    }, [formData.name, isAutoImage]);

    const loadVariants = async (groupId: string) => {
        setLoadingVariants(true);
        try {
            const data = await productService.getVariants(groupId);
            // exclude current item if it has ID (edit mode)
            const others = initialData?.id ? data.filter(p => p.id !== initialData.id) : data;
            setVariants(others);
        } catch (e) { console.error(e); }
        finally { setLoadingVariants(false); }

    };

    // Load Bundle Components
    useEffect(() => {
        if (initialData?.id && initialData.is_bundle) {
            setIsBundle(true);
            productService.getBundleComponents(initialData.id).then(comps => {
                setBundleComponents(comps.map(c => ({ id: c.product.id, name: c.product.name, quantity: c.quantity })));
            });
        }
    }, [initialData]);

    const handleComponentSearch = async (q: string) => {
        setComponentSearch(q);
        if (q.length > 1) {
            const results = await productService.search(q);
            // Filter self and already added
            const filtered = results.filter(p => p.id !== initialData?.id && !bundleComponents.find(c => c.id === p.id));
            setFoundComponents(filtered);
        } else {
            setFoundComponents([]);
        }
    };

    const addComponent = (product: Product) => {
        setBundleComponents(prev => [...prev, { id: product.id, name: product.name, quantity: 1 }]);
        setComponentSearch('');
        setFoundComponents([]);
    };

    const removeComponent = (id: number) => {
        setBundleComponents(prev => prev.filter(c => c.id !== id));
    };

    const updateComponentQty = (id: number, qty: number) => {
        setBundleComponents(prev => prev.map(c => c.id === id ? { ...c, quantity: qty } : c));
    };

    const loadHistory = async () => {
        if (!initialData?.id) return;
        setLoadingHistory(true);
        try {
            const logs = await inventoryService.getLogs(initialData.id);
            setHistoryLogs(logs);
        } catch (e) {
            console.error('Failed to load history', e);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'HISTORY' && initialData?.id) {
            loadHistory();
        }
    }, [activeTab, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData };
        if (isBundle) {
            // Bundle logic: Stock is 0 or managed? Usually 0 effectively, or computed.
            // Cost price = sum of components?
            // Let's keep manual override for now, or sum it up.
            // Pass components to service
            (finalData as any).components = bundleComponents.map(c => ({ id: c.id, quantity: c.quantity }));
        }
        onSubmit(finalData);
    };

    const handleChange = (field: keyof Omit<Product, 'id'>, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
                setIsAutoImage(false); // User manually uploaded, disable auto-gen
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFetchInfo = async () => {
        if (!formData.barcode) {
            toast.error('Please enter a barcode first');
            return;
        }

        setIsFetchingInfo(true);
        const toastId = toast.loading('Searching global product database...');

        try {
            const data = await productImageFetcher.fetchProductByBarcode(formData.barcode);

            if (data) {
                let msg = 'Product found!';
                setFormData(prev => {
                    const updates: any = {};
                    if (data.name && !prev.name) {
                        updates.name = data.name;
                        msg += ' Name updated.';
                    }
                    if (data.imageBase64) {
                        updates.image = data.imageBase64;
                        setIsAutoImage(false); // Valid real image found
                        msg += ' Image downloaded.';
                    }
                    return { ...prev, ...updates };
                });
                toast.success(msg, { id: toastId });
            } else {
                toast.error('Product not found in global database', { id: toastId });
            }
        } catch (e) {
            toast.error('Failed to fetch info', { id: toastId });
        } finally {
            setIsFetchingInfo(false);
        }
    };

    const handleCreateVariant = async () => {
        if (!initialData?.id) return;
        if (!newVariantBarcode) {
            alert('Barcode is required for new variant');
            return;
        }
        try {
            // Clean empty attrs
            const attrs: Record<string, string> = {};
            if (variantAttributes.Size) attrs.Size = variantAttributes.Size;
            if (variantAttributes.Color) attrs.Color = variantAttributes.Color;

            if (Object.keys(attrs).length === 0) {
                alert('Please specify at least one attribute (Size/Color)');
                return;
            }

            await productService.createVariant(initialData.id, attrs, newVariantBarcode);
            if (initialData.variant_group_id) loadVariants(initialData.variant_group_id);
            else {
                // We just created a group, but we don't know it here easily without refetch.
                // Ideally close modal or refetch product.
                alert('Variant created. please reopen product to see updated group.');
            }
            // Reset
            setVariantAttributes({ Size: '', Color: '' });
            setNewVariantBarcode('');
        } catch (error: any) {
            alert('Failed: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* TABS */}
            <div className="flex bg-muted/30 p-1.5 rounded-xl mb-6 gap-1 w-full sm:w-fit border border-border/50 shadow-inner">
                <button
                    type="button"
                    onClick={() => setActiveTab('GENERAL')}
                    className={clsx(
                        "flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200",
                        activeTab === 'GENERAL'
                            ? "bg-surface text-primary shadow-sm border border-border"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                >
                    <Box size={16} />
                    <span>General Info</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('VARIANTS')}
                    disabled={!initialData?.id}
                    className={clsx(
                        "flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200",
                        activeTab === 'VARIANTS'
                            ? "bg-surface text-primary shadow-sm border border-border"
                            : !initialData?.id ? "opacity-30 cursor-not-allowed hidden" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                >
                    <Layers size={16} />
                    <span>Variants {variants.length > 0 && `(${variants.length})`}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('BUNDLE')}
                    disabled={!isBundle && !initialData?.id}
                    className={clsx(
                        "flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200",
                        activeTab === 'BUNDLE'
                            ? "bg-surface text-primary shadow-sm border border-border"
                            : (!isBundle && !initialData?.id) ? "opacity-30 cursor-not-allowed hidden" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        isBundle && "inline-flex"
                    )}
                >
                    <Package size={16} />
                    <span>Bundle Items {bundleComponents.length > 0 && `(${bundleComponents.length})`}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('HISTORY')}
                    disabled={!initialData?.id}
                    className={clsx(
                        "flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200",
                        activeTab === 'HISTORY'
                            ? "bg-surface text-primary shadow-sm border border-border"
                            : !initialData?.id ? "opacity-30 cursor-not-allowed hidden" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                >
                    <History size={16} />
                    <span>History</span>
                </button>
                {formData.is_batch_tracked === 1 && (
                    <button
                        type="button"
                        onClick={() => setActiveTab('BATCHES')}
                        disabled={!initialData?.id}
                        className={clsx(
                            "flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200",
                            activeTab === 'BATCHES'
                                ? "bg-surface text-primary shadow-sm border border-border"
                                : !initialData?.id ? "opacity-30 cursor-not-allowed hidden" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        <Calendar size={16} />
                        <span>Batches</span>
                    </button>
                )}
            </div>

            {/* TAB CONTENT: GENERAL */}
            {activeTab === 'GENERAL' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Bundle Toggle Card */}
                    <div className={clsx(
                        "group relative overflow-hidden p-4 rounded-xl border transition-all duration-300",
                        isBundle
                            ? "bg-primary/5 border-primary/30 shadow-md"
                            : "bg-surface border-border hover:border-primary/20"
                    )}>
                        <div className="flex items-start gap-4">
                            <div className={clsx(
                                "p-3 rounded-xl transition-colors",
                                isBundle ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                <LayoutGrid size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="is_bundle" className="text-base font-bold text-foreground cursor-pointer select-none">
                                        Bundle / Combo Product
                                    </label>
                                    <input
                                        type="checkbox"
                                        id="is_bundle"
                                        checked={isBundle}
                                        onChange={e => {
                                            setIsBundle(e.target.checked);
                                            if (e.target.checked) setActiveTab('BUNDLE');
                                        }}
                                        className="w-5 h-5 text-primary rounded-md border-border focus:ring-primary/50 transition-all cursor-pointer"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Sell multiple items together as one package. {isBundle ? "Stock is computed from components." : "Stock is managed directly."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* LEFT: Image & Identifiers */}
                        <div className="md:col-span-4 space-y-6">
                            {/* Image Section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                        Product Image
                                    </label>
                                    <span className={clsx(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                        isAutoImage ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                                    )}>
                                        {isAutoImage ? 'AI Generated' : 'Verified Image'}
                                    </span>
                                </div>
                                <div className="group relative aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/20 overflow-hidden hover:border-primary/40 hover:bg-muted/40 transition-all duration-300 shadow-inner">
                                    {formData.image ? (
                                        <>
                                            <img src={formData.image} alt="Product" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <label className="p-2.5 bg-surface text-foreground rounded-xl cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all shadow-xl">
                                                    <Upload size={20} />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                                    className="p-2.5 bg-surface text-destructive rounded-xl hover:bg-destructive hover:text-white transition-all shadow-xl"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-3">
                                            <div className="p-4 bg-muted/50 rounded-2xl text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                                <Upload size={32} />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-sm font-bold text-foreground block">Upload Image</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 block">JPG, PNG, WEBP</span>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Main Details & Pricing */}
                        <div className="md:col-span-8 space-y-6">
                            {/* Main Info & Identifiers merged for horizontal flow */}
                            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Classic White T-Shirt"
                                        className="w-full bg-muted/30 border border-border rounded-xl px-5 py-3 text-lg font-bold placeholder:text-muted-foreground/30 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        value={formData.name}
                                        onChange={e => handleChange('name', e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                            Barcode Identification
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Scan or type..."
                                                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    value={formData.barcode}
                                                    onChange={e => handleChange('barcode', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border">
                                                <button
                                                    type="button"
                                                    onClick={handleFetchInfo}
                                                    disabled={isFetchingInfo || !formData.barcode}
                                                    className="p-2 text-primary hover:bg-surface rounded-lg transition-all disabled:opacity-30"
                                                    title="Smart Search"
                                                >
                                                    {isFetchingInfo ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const random = Math.floor(100000000000 + Math.random() * 900000000000);
                                                        handleChange('barcode', random.toString());
                                                    }}
                                                    className="px-2 text-[10px] font-black text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg transition-all"
                                                    title="Generate"
                                                >
                                                    GEN
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                            HSN / SAC Code
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter HSN..."
                                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                            value={formData.hsn_code || ''}
                                            onChange={e => handleChange('hsn_code', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                            Cost Price
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-muted/30 border border-border rounded-xl pl-8 pr-4 py-3 text-base font-bold focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                value={formData.cost_price}
                                                onChange={e => handleChange('cost_price', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                            Selling Price
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                                className="w-full bg-primary/5 border border-primary/20 rounded-xl pl-8 pr-4 py-3 text-lg font-black text-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none shadow-sm"
                                                value={formData.sell_price}
                                                onChange={e => handleChange('sell_price', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Inventory & Tax */}
                            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
                                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                                    Inventory & Tax Policies
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground">Initial Stock</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-base focus:bg-background transition-all outline-none"
                                            value={formData.stock}
                                            onChange={e => handleChange('stock', parseInt(e.target.value) || 0)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                            GST Rate
                                        </label>
                                        <select
                                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-base focus:bg-background transition-all outline-none appearance-none cursor-pointer"
                                            value={formData.gst_rate}
                                            onChange={e => handleChange('gst_rate', parseFloat(e.target.value))}
                                        >
                                            {[0, 5, 12, 18, 28].map(rate => (
                                                <option key={rate} value={rate}>{rate}% GST</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-muted-foreground">Min Stock</label>
                                            {formData.stock <= formData.min_stock_level && (
                                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                            )}
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-base focus:bg-background transition-all outline-none"
                                            value={formData.min_stock_level}
                                            onChange={e => handleChange('min_stock_level', parseInt(e.target.value) || 5)}
                                        />
                                    </div>

                                    <div className="flex items-center pt-6">
                                        <label className="relative flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                id="is_batch_tracked"
                                                checked={formData.is_batch_tracked === 1}
                                                onChange={(e) => setFormData(prev => ({ ...prev, is_batch_tracked: e.target.checked ? 1 : 0 }))}
                                                className="hidden"
                                            />
                                            <div className={clsx(
                                                "w-12 h-6 rounded-full transition-all duration-300 relative shrink-0",
                                                formData.is_batch_tracked === 1 ? "bg-primary shadow-glow-sm" : "bg-muted-foreground/20"
                                            )}>
                                                <div className={clsx(
                                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                                                    formData.is_batch_tracked === 1 ? "left-7" : "left-1"
                                                )} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-foreground">Batch Track</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 border-t border-border mt-8">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-all hover:bg-muted/50 rounded-xl"
                        >
                            Discard Changes
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-10 py-3.5 bg-primary text-primary-foreground rounded-xl font-black text-sm shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span>Save Product Record</span>
                            <Box size={18} />
                        </button>
                    </div>
                </form>
            )}

            {/* TAB CONTENT: VARIANTS */}
            {activeTab === 'VARIANTS' && (
                <div className="space-y-6">
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Layers size={18} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Create New Product Variant</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Size Attribute</label>
                                <input className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm focus:bg-background transition-all outline-none" placeholder="e.g. XL, 42..." value={variantAttributes.Size} onChange={e => setVariantAttributes({ ...variantAttributes, Size: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Color Attribute</label>
                                <input className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm focus:bg-background transition-all outline-none" placeholder="e.g. Navy, Slate..." value={variantAttributes.Color} onChange={e => setVariantAttributes({ ...variantAttributes, Color: e.target.value })} />
                            </div>
                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Variant Barcode</label>
                                <div className="flex gap-2">
                                    <input className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm font-mono focus:bg-background transition-all outline-none" placeholder="Unique Barcode" value={newVariantBarcode} onChange={e => setNewVariantBarcode(e.target.value)} />
                                    <button onClick={() => setNewVariantBarcode(Math.floor(100000000000 + Math.random() * 900000000000).toString())} className="p-2 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-all" title="Generate">
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleCreateVariant}
                                className="h-10 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                <Plus size={16} className="mr-2" /> Add Variant
                            </button>
                        </div>
                    </div>

                    {/* Variant List */}
                    <div className="border border-border rounded-xl overflow-hidden">
                        <div className="bg-muted p-3 text-xs font-bold uppercase text-muted-foreground">Existing Variants in Group</div>
                        {loadingVariants ? (
                            <div className="p-8 text-center text-muted-foreground">Loading variants...</div>
                        ) : (
                            <Table
                                data={variants}
                                columns={[
                                    { header: 'Variant Name', accessor: 'name' },
                                    { header: 'Barcode', accessor: 'barcode' },
                                    { header: 'Stock', accessor: 'stock' },
                                    { header: 'Price', accessor: (p) => `₹${p.sell_price} ` }
                                ]}
                                emptyMessage="No other variants found."
                            />
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: BUNDLE */}
            {activeTab === 'BUNDLE' && (
                <div className="space-y-6 h-full flex flex-col">
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Package size={18} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Add Components to Bundle</h4>
                        </div>
                        <div className="relative">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <input
                                        className="w-full bg-muted/30 border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:bg-background transition-all outline-none"
                                        placeholder="Search products by name or barcode..."
                                        value={componentSearch}
                                        onChange={e => handleComponentSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            {foundComponents.length > 0 && (
                                <div className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                    {foundComponents.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => addComponent(p)}
                                            className="w-full text-left px-5 py-4 hover:bg-muted/50 border-b border-border last:border-0 flex justify-between items-center group transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-muted border border-border overflow-hidden">
                                                    {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Box className="w-full h-full p-2 text-muted-foreground" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-foreground">{p.name}</div>
                                                    <div className="text-[10px] text-muted-foreground font-black uppercase">Stock: {p.stock} • ₹{p.sell_price}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100">Add Item</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-border rounded-xl">
                        <div className="bg-muted p-3 text-xs font-bold uppercase text-muted-foreground grid grid-cols-12 gap-2">
                            <div className="col-span-6">Product</div>
                            <div className="col-span-3 text-center">Qty Needed</div>
                            <div className="col-span-3 text-right">Actions</div>
                        </div>
                        {bundleComponents.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No components added yet. Search above to add items to this bundle.
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {bundleComponents.map((c, i) => (
                                    <div key={c.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/10">
                                        <div className="col-span-6 font-medium text-sm truncate" title={c.name}>{c.name}</div>
                                        <div className="col-span-3 flex justify-center">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-16 bg-background border border-border rounded p-1 text-center text-sm"
                                                value={c.quantity}
                                                onChange={e => updateComponentQty(c.id, parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-3 flex justify-end">
                                            <button
                                                onClick={() => removeComponent(c.id)}
                                                className="text-destructive hover:bg-destructive/10 p-1.5 rounded"
                                                title="Remove"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-muted/10 rounded-xl border border-border text-xs text-muted-foreground">
                        <strong>Note:</strong> When you sell this bundle, stock will be deducted from the individual components listed above.
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSubmit}>Save Bundle</Button>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: HISTORY */}
            {activeTab === 'HISTORY' && (
                <div className="space-y-4 h-full flex flex-col overflow-hidden">
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-2 text-primary">
                            <History size={18} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Stock Movement History</h4>
                        </div>
                        <button
                            onClick={loadHistory}
                            disabled={loadingHistory}
                            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-bold text-muted-foreground transition-all border border-border"
                        >
                            <RefreshCw className={clsx("w-4 h-4", loadingHistory && "animate-spin")} />
                            <span>Sync Logs</span>
                        </button>
                    </div>

                    <div className="flex-1 border border-border rounded-xl overflow-hidden flex flex-col">
                        <div className="bg-muted p-3 text-xs font-bold uppercase text-muted-foreground grid grid-cols-12 gap-2">
                            <div className="col-span-3">Date</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-2 text-right">Change</div>
                            <div className="col-span-3">Reason</div>
                            <div className="col-span-2">User</div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loadingHistory ? (
                                <div className="p-8 text-center text-muted-foreground">Loading history...</div>
                            ) : historyLogs.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No stock history found.</div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {historyLogs.map(log => (
                                        <div key={log.id} className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-muted/10 items-center">
                                            <div className="col-span-3 text-muted-foreground text-xs">
                                                {new Date(log.date).toLocaleString()}
                                            </div>
                                            <div className="col-span-2">
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    log.type === 'SALE' ? "bg-green-100 text-green-700" :
                                                        log.type === 'RETURN' ? "bg-red-100 text-red-700" :
                                                            log.type === 'RESTOCK' ? "bg-blue-100 text-blue-700" :
                                                                log.type === 'SHRINKAGE' ? "bg-orange-100 text-orange-700" :
                                                                    "bg-gray-100 text-gray-700"
                                                )}>
                                                    {log.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className={clsx(
                                                "col-span-2 text-right font-mono font-medium",
                                                log.quantity_change > 0 ? "text-green-600" : "text-destructive"
                                            )}>
                                                {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                                            </div>
                                            <div className="col-span-3 truncate text-muted-foreground" title={log.reason}>
                                                {log.reason || '-'}
                                            </div>
                                            <div className="col-span-2 text-xs text-muted-foreground truncate">
                                                {log.user_id ? `User #${log.user_id}` : 'System'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'BATCHES' && initialData && (
                <div className="h-full overflow-hidden">
                    <BatchManager product={initialData as Product} />
                </div>
            )}
        </div>
    );
}
