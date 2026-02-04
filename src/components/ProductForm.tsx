import React, { useEffect, useState } from 'react';
import type { Product } from '../types/db';
import { Button } from './Button';
import { Upload, X, Copy, RefreshCw } from 'lucide-react';
import { productService } from '../services/productService';
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
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'VARIANTS'>('GENERAL');

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
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
            </div>

            {/* TAB CONTENT: GENERAL */}
            {activeTab === 'GENERAL' && (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                                    { header: 'Price', accessor: (p) => `₹${p.sell_price}` }
                                ]}
                                emptyMessage="No other variants found."
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
