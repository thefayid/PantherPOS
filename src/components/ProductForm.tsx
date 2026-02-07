
import React, { useEffect, useState } from 'react';
import type { Product, InventoryLog } from '../types/db';
import { Button } from './Button';
import { Plus, X, Upload, Trash2, Copy, RefreshCw, Box, Layers, History, Calendar } from 'lucide-react';
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
            <div className="flex border-b border-border mb-4 gap-4 px-1">
                <button
                    onClick={() => setActiveTab('GENERAL')}
                    className={clsx(
                        "py-2 px-4 border-b-2 text-sm font-bold transition-all",
                        activeTab === 'GENERAL' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    General Info
                </button>
                <button
                    onClick={() => setActiveTab('VARIANTS')}
                    disabled={!initialData?.id}
                    className={clsx(
                        "py-2 px-4 border-b-2 text-sm font-bold transition-all",
                        activeTab === 'VARIANTS'
                            ? "border-primary text-primary"
                            : !initialData?.id ? "border-transparent text-muted-foreground/30 cursor-not-allowed" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Variants {variants.length > 0 && `(${variants.length})`}
                </button>
                <button
                    onClick={() => setActiveTab('BUNDLE')}
                    disabled={!isBundle && !initialData?.id} // Only if marked as bundle or editing
                    className={clsx(
                        "py-2 px-4 border-b-2 text-sm font-bold transition-all",
                        activeTab === 'BUNDLE'
                            ? "border-primary text-primary"
                            : (!isBundle && !initialData?.id) ? "border-transparent text-muted-foreground/30 cursor-not-allowed hidden" : "border-transparent text-muted-foreground hover:text-foreground",
                        isBundle && "inline-flex"
                    )}
                >
                    Bundle Items {bundleComponents.length > 0 && `(${bundleComponents.length})`}
                </button>
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    disabled={!initialData?.id}
                    className={clsx(
                        "py-2 px-4 border-b-2 text-sm font-bold transition-all",
                        activeTab === 'HISTORY'
                            ? "border-primary text-primary"
                            : !initialData?.id ? "border-transparent text-muted-foreground/30 cursor-not-allowed" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Stock History
                </button>
                {formData.is_batch_tracked === 1 && (
                    <button
                        type="button"
                        onClick={() => setActiveTab('BATCHES')}
                        disabled={!initialData?.id}
                        className={clsx(
                            "py-2 px-4 border-b-2 text-sm font-bold transition-all",
                            activeTab === 'BATCHES'
                                ? "border-primary text-primary"
                                : !initialData?.id ? "border-transparent text-muted-foreground/30 cursor-not-allowed" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Batches
                    </button>
                )}
            </div>

            {/* TAB CONTENT: GENERAL */}
            {activeTab === 'GENERAL' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-2 mb-4 bg-muted/20 p-3 rounded-lg border border-border">
                        <input
                            type="checkbox"
                            id="is_bundle"
                            checked={isBundle}
                            onChange={e => {
                                setIsBundle(e.target.checked);
                                if (e.target.checked) setActiveTab('BUNDLE');
                            }}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="is_bundle" className="text-sm font-bold text-foreground">
                            This is a Bundle / Combo Product
                        </label>
                        <span className="text-xs text-muted-foreground ml-2">(Stock will be calculated based on components)</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Image Upload Section */}
                        <div className="w-full md:w-1/3 space-y-2">
                            <label className="block text-sm font-medium text-foreground">Product Image</label>
                            <div className="relative aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/30 overflow-hidden hover:bg-muted/50 transition-colors group">
                                {formData.image ? (
                                    <>
                                        <img src={formData.image} alt="Product" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {isAutoImage ? 'Auto-Generated' : 'Custom Image'}
                                        </div>
                                    </>
                                ) : (
                                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-xs text-muted-foreground font-medium">Click to upload</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Form Fields Section */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-foreground">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-foreground">Barcode</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                        value={formData.barcode}
                                        onChange={e => handleChange('barcode', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleFetchInfo}
                                        disabled={isFetchingInfo || !formData.barcode}
                                        className="mt-1 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md border border-blue-200 transition-all flex items-center justify-center"
                                        title="Search Online (OpenFoodFacts)"
                                    >
                                        {isFetchingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const random = Math.floor(100000000000 + Math.random() * 900000000000);
                                            handleChange('barcode', random.toString());
                                        }}
                                        className="mt-1 px-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-md border border-border text-xs font-bold transition-all"
                                        title="Generate Unique Barcode"
                                    >
                                        GEN
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground">HSN Code</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                    value={formData.hsn_code || ''}
                                    onChange={e => handleChange('hsn_code', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground">Cost Price</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                    value={formData.cost_price}
                                    onChange={e => handleChange('cost_price', parseFloat(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground">Selling Price</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                    value={formData.sell_price}
                                    onChange={e => handleChange('sell_price', parseFloat(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground">Stock</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                    value={formData.stock}
                                    onChange={e => handleChange('stock', parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground">GST Rate (%)</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                    value={formData.gst_rate}
                                    onChange={e => handleChange('gst_rate', parseFloat(e.target.value))}
                                >
                                    {[0, 5, 12, 18, 28].map(rate => (
                                        <option key={rate} value={rate}>{rate}%</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground">Min Stock Level</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                    value={formData.min_stock_level}
                                    onChange={e => handleChange('min_stock_level', parseInt(e.target.value) || 5)}
                                />
                            </div>

                            <div className="md:col-span-2 flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_batch_tracked"
                                    checked={formData.is_batch_tracked === 1}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_batch_tracked: e.target.checked ? 1 : 0 }))}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="is_batch_tracked" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Enable Batch Tracking (Expiry Dates)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                        <Button type="submit">Save Product</Button>
                    </div>
                </form>
            )}

            {/* TAB CONTENT: VARIANTS */}
            {activeTab === 'VARIANTS' && (
                <div className="space-y-6">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                        <h4 className="text-sm font-bold text-primary mb-2">Create New Variant</h4>
                        <div className="grid grid-cols-4 gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Size</label>
                                <input className="mac-input w-full bg-background border-border text-foreground" placeholder="S, M, L..." value={variantAttributes.Size} onChange={e => setVariantAttributes({ ...variantAttributes, Size: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Color</label>
                                <input className="mac-input w-full bg-background border-border text-foreground" placeholder="Red, Blue..." value={variantAttributes.Color} onChange={e => setVariantAttributes({ ...variantAttributes, Color: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">New Barcode</label>
                                <div className="flex gap-2">
                                    <input className="mac-input w-full bg-background border-border text-foreground" placeholder="Scan or Type" value={newVariantBarcode} onChange={e => setNewVariantBarcode(e.target.value)} />
                                    <button onClick={() => setNewVariantBarcode(Math.floor(100000000000 + Math.random() * 900000000000).toString())} className="p-2 bg-muted rounded-lg hover:bg-muted/80 text-foreground border border-border" title="Generate">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <Button onClick={handleCreateVariant} className="h-10">
                                <Copy className="w-4 h-4 mr-2" /> Add Variant
                            </Button>
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
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                        <h4 className="text-sm font-bold text-primary">Add Components to Bundle</h4>
                        <div className="relative">
                            <div className="flex gap-2">
                                <Search className="absolute left-3 top-2.5 text-muted-foreground w-4 h-4" />
                                <input
                                    className="pl-9 w-full bg-background border border-border rounded-lg py-2 text-sm"
                                    placeholder="Search products to add..."
                                    value={componentSearch}
                                    onChange={e => handleComponentSearch(e.target.value)}
                                />
                            </div>
                            {foundComponents.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    {foundComponents.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => addComponent(p)}
                                            className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border/50 last:border-0 flex justify-between items-center group"
                                        >
                                            <div>
                                                <div className="font-bold text-sm text-foreground">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">Qty: {p.stock} | ₹{p.sell_price}</div>
                                            </div>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Add</span>
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
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-primary">Stock Movement History</h4>
                        <Button variant="secondary" size="sm" onClick={loadHistory} disabled={loadingHistory}>
                            <RefreshCw className={clsx("w-4 h-4 mr-2", loadingHistory && "animate-spin")} /> Refresh
                        </Button>
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
