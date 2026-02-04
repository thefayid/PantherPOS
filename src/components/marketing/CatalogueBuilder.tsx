import { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import type { Product } from '../../types/db';
import { Search, CheckCircle, LayoutTemplate, FileDown, Eye, Image } from 'lucide-react';
import { Button } from '../Button';
import { exportService } from '../../services/exportService';
import toast from 'react-hot-toast';

export function CatalogueBuilder() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [search, setSearch] = useState('');
    const [title, setTitle] = useState('New Collection');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        productService.getAll().then(setProducts);
    }, []);

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && p.stock > 0);

    const toggleSelect = (id: number) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(prev => prev.filter(pid => pid !== id));
        } else {
            setSelectedProducts(prev => [...prev, id]);
        }
    };

    const handleGenerate = async () => {
        if (selectedProducts.length === 0) {
            toast.error('Select at least one product');
            return;
        }

        const items = products.filter(p => selectedProducts.includes(p.id));
        const toastId = toast.loading('Generating PDF...');

        try {
            await exportService.generateCataloguePdf(
                `${title.replace(/\s+/g, '_')}.pdf`,
                title,
                items,
                layout
            );
            toast.success('Catalogue Generated!', { id: toastId });
        } catch (e: any) {
            toast.error('Failed to generate PDF', { id: toastId });
        }
    };

    return (
        <div className="flex h-full gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Sidebar: Selection */}
            <div className="w-1/3 bg-surface border border-border rounded-xl flex flex-col overflow-hidden shadow-lg">
                <div className="p-4 border-b border-border bg-muted/10">
                    <h3 className="font-bold mb-2">1. Select Products</h3>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-8 pr-2 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filtered.map(p => {
                        const isSelected = selectedProducts.includes(p.id);
                        return (
                            <div
                                key={p.id}
                                onClick={() => toggleSelect(p.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'bg-primary/10 border-primary ring-1 ring-primary/20' : 'bg-background border-border hover:bg-muted'}`}
                            >
                                <div>
                                    <div className="font-bold text-sm">{p.name}</div>
                                    <div className="text-xs text-muted-foreground">₹{p.sell_price} • Stock: {p.stock}</div>
                                </div>
                                {isSelected && <CheckCircle size={18} className="text-primary" />}
                            </div>
                        );
                    })}
                </div>
                <div className="p-3 border-t border-border text-xs text-center text-muted-foreground">
                    {selectedProducts.length} items selected
                </div>
            </div>

            {/* Main Area: Preview & Settings */}
            <div className="flex-1 flex flex-col gap-6">

                {/* Settings Card */}
                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <LayoutTemplate size={18} className="text-primary" />
                        2. Customize Catalogue
                    </h3>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Catalogue Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full text-lg font-bold p-2 bg-background border border-border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Layout Style</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLayout('grid')}
                                    className={`flex-1 p-2 rounded-lg border text-sm font-medium transition-all ${layout === 'grid' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                >
                                    Grid (Compact)
                                </button>
                                <button
                                    onClick={() => setLayout('list')}
                                    className={`flex-1 p-2 rounded-lg border text-sm font-medium transition-all ${layout === 'list' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                >
                                    List (Detailed)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Card */}
                <div className="flex-1 bg-muted/20 border border-dashed border-border rounded-xl overflow-hidden flex flex-col relative group">
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full uppercase font-bold z-10 pointer-events-none">
                        Live Preview
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-white shadow-inner custom-scrollbar">
                        {/* Mock PDF Paper Look - Updated for Modern Book Style */}
                        <div className="bg-white min-h-[800px] w-full max-w-3xl mx-auto shadow-2xl border border-gray-200 flex flex-col relative transition-all duration-300">

                            {/* Paper Header */}
                            <div className="bg-white p-12 pb-6 text-center">
                                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3 uppercase font-sans">{title}</h1>
                                <p className="text-xs text-gray-400 font-medium tracking-[0.2em] uppercase">Product Collection 2024</p>
                                <div className="mt-6 mx-auto w-16 h-0.5 bg-emerald-500 rounded-full"></div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-12 pt-4">
                                {selectedProducts.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-32 border-2 border-dashed border-gray-100 rounded-xl">
                                        <Eye size={48} className="mb-4 opacity-50" />
                                        <p className="font-medium">Select products to build your book</p>
                                    </div>
                                ) : (
                                    <div className={layout === 'grid' ? 'grid grid-cols-2 gap-8' : 'flex flex-col'}>
                                        {products.filter(p => selectedProducts.includes(p.id)).map(p => (
                                            <div key={p.id} className={`group ${layout === 'grid' ?
                                                'flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-xl transition-colors' :
                                                'flex items-center gap-6 py-4 border-b border-gray-100 last:border-0'}`}>

                                                {/* Image Area */}
                                                <div className={`${layout === 'grid' ? 'w-full aspect-[4/5] mb-4' : 'w-16 h-16 shrink-0'} bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100`}>
                                                    {p.image ? (
                                                        <img src={p.image} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="text-gray-200">
                                                            <Image size={layout === 'grid' ? 48 : 24} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info Area */}
                                                <div className={layout === 'grid' ? 'w-full' : 'flex-1 flex justify-between items-center'}>
                                                    <div>
                                                        <h4 className={`font-bold text-gray-900 leading-tight ${layout === 'grid' ? 'text-lg mb-1' : 'text-base'}`}>{p.name}</h4>
                                                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{p.barcode}</p>
                                                    </div>
                                                    <div className={`font-bold text-emerald-600 ${layout === 'grid' ? 'mt-2 text-xl' : 'text-sm'}`}>
                                                        ₹{p.sell_price.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="mt-auto p-8 border-t border-gray-50 text-center">
                                <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Panther POS Solutions</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setSelectedProducts([])}>
                        Clear Selection
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-lg"
                    >
                        <FileDown size={20} className="mr-2" />
                        Generate & Open PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}
