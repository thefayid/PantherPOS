import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Search, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { productService } from '../services/productService';
import { inventoryService } from '../services/inventoryService';
import type { Product } from '../types/db';

interface QuickInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Callback to reload products
}

export function QuickInventoryModal({ isOpen, onClose, onUpdate }: QuickInventoryModalProps) {
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [newStock, setNewStock] = useState('');
    const [reason, setReason] = useState('Stock Correction');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setSelectedProduct(undefined);
            setNewStock('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const searchProducts = async () => {
            if (!search) {
                setSearchResults([]);
                return;
            }
            // Simple fast search
            const all = await productService.getAll();
            const q = search.toLowerCase();
            const filtered = all.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.barcode.includes(q)
            ).slice(0, 5); // Limit to 5

            // Auto-select if exact barcode match
            const exactMatch = filtered.find(p => p.barcode === q);
            if (exactMatch && !selectedProduct) {
                handleSelect(exactMatch);
            } else {
                setSearchResults(filtered);
            }
        };

        const timeout = setTimeout(searchProducts, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleSelect = (product: Product) => {
        setSelectedProduct(product);
        setSearch(''); // Clear search on select or keep it? Keeping it clear for next scan
        setSearchResults([]);
        setNewStock(product.stock.toString());
    };

    const handleSave = async () => {
        if (!selectedProduct || !newStock) return;

        const current = selectedProduct.stock;
        const next = parseFloat(newStock);
        const diff = next - current;

        if (diff === 0) {
            alert('No change in stock value.');
            return;
        }

        try {
            await inventoryService.addLog(
                selectedProduct.id,
                'STOCKTAKE_ADJUSTMENT',
                diff,
                reason
            );
            // We also need to actually update the product record directly as addLog is just a log in some implementations, 
            // but inventoryService might not have a direct "setStock" exposed simply.
            // Let's use the private db logic via a service extension or assume productService.update works.
            // Wait, inventoryService.reportShrinkage updates stock. Let's use a direct update if possible.
            // `productService.update` requires full object. 
            // Let's use `inventoryService.reportShrinkage` logic but in reverse? 
            // No, safest is to update the product.
            await productService.update({ ...selectedProduct, stock: next });

            onUpdate(); // Reload main list

            // Reset for next item
            setSelectedProduct(undefined);
            setNewStock('');
            setSearch('');
            inputRef.current?.focus();

            // Optional: Toast success
        } catch (error) {
            console.error('Failed to update stock:', error);
            alert('Failed to update stock.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quick Inventory Adjustment">
            <div className="space-y-6">
                {!selectedProduct ? (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Scan or Search Product</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-muted/20 border border-border rounded-lg pl-9 pr-4 py-2 text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                placeholder="Scan barcode or type name..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {searchResults.length > 0 && (
                            <div className="border border-border rounded-lg overflow-hidden bg-surface">
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        className="w-full text-left px-4 py-2 hover:bg-muted/50 flex justify-between items-center"
                                        onClick={() => handleSelect(p)}
                                    >
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono">{p.barcode}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-center p-8 text-muted-foreground/50 border-2 border-dashed border-border rounded-lg">
                            Scan a barcode to start
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-primary">{selectedProduct.name}</h3>
                                <p className="text-sm text-muted-foreground font-mono">{selectedProduct.barcode}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(undefined)}>
                                <RotateCcw size={16} />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/20 rounded-lg border border-border">
                                <span className="text-xs text-muted-foreground block">Current System Stock</span>
                                <span className="text-2xl font-bold text-foreground">{selectedProduct.stock}</span>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Actual / Counted Stock</label>
                                <input
                                    type="number"
                                    className="w-full bg-background border border-border rounded-lg p-3 text-xl font-bold text-foreground focus:ring-2 focus:ring-primary outline-none"
                                    value={newStock}
                                    onChange={e => setNewStock(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleSave();
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Reason for Adjustment</label>
                            <select
                                className="w-full bg-muted/20 border border-border rounded-lg p-2 text-foreground"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            >
                                <option value="Stock Correction">Stock Correction (Audit)</option>
                                <option value="Damage">Damage / Spoilage</option>
                                <option value="Theft">Theft</option>
                                <option value="Gift">Gift / Promo</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button className="flex-1" variant="ghost" onClick={() => setSelectedProduct(undefined)}>Cancel</Button>
                            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
                                <Save size={18} className="mr-2" />
                                Update Stock
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
