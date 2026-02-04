import { useState, useEffect } from 'react';
import {
    Search, ShoppingBag, Plus, Minus,
    X, ShoppingCart, ScanLine
} from 'lucide-react';
import type { Product, Customer } from '../../types/db';

interface MobileBillingProps {
    products: Product[];
    cart: any[];
    onAddToCart: (p: Product) => void;
    onUpdateQuantity: (id: number, delta: number) => void;
    onRemoveFromCart: (id: number) => void;
    onCheckout: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onScan: () => void;
    grandTotal: number;
    subtotal: number;
    customer: Customer | null;
    onSelectCustomer: () => void;
}

export default function MobileBilling({
    products, cart, onAddToCart, onUpdateQuantity,
    onRemoveFromCart, onCheckout, searchTerm,
    onSearchChange, onScan, grandTotal, subtotal,
    customer, onSelectCustomer
}: MobileBillingProps) {
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Close cart automatically if empty
    useEffect(() => {
        if (cart.length === 0) setIsCartOpen(false);
    }, [cart.length]);

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden pb-Safe">
            {/* Top Bar */}
            <header className="px-4 py-3 flex gap-3 items-center bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search items..."
                        className="w-full bg-muted text-sm rounded-xl py-2.5 pl-9 pr-4 text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-all"
                    />
                </div>
                <button
                    onClick={onScan}
                    className="p-2.5 bg-muted rounded-xl text-primary hover:bg-primary/10 active:scale-95 transition-all border border-border"
                >
                    <ScanLine size={20} />
                </button>
            </header>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-3 custom-scrollbar">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                        <ShoppingBag size={48} className="mb-4 opacity-20" />
                        <p>No products found</p>
                    </div>
                ) : (
                    products.map(product => (
                        <div
                            key={product.id}
                            onClick={() => onAddToCart(product)}
                            className="bg-surface border border-border rounded-2xl p-3 flex gap-4 active:scale-[0.98] transition-all active:bg-muted shadow-sm"
                        >
                            <div className="w-20 h-20 bg-muted rounded-xl flex-shrink-0 relative overflow-hidden">
                                {product.image ? (
                                    <img src={product.image} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                        <ShoppingBag size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center min-w-0">
                                <h3 className="font-bold text-base text-foreground truncate">{product.name}</h3>
                                <p className="text-muted-foreground text-xs mb-2 truncate">{product.barcode}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-primary font-bold text-lg">₹{product.sell_price}</span>
                                    {product.stock <= 5 && (
                                        <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Low: {product.stock}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors border border-primary/20">
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Cart Bar (Floating) */}
            {cart.length > 0 && !isCartOpen && (
                <div className="fixed bottom-20 left-4 right-4 z-30 animate-in slide-in-from-bottom-5 duration-300">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-4 shadow-lg shadow-cyan-500/20 flex items-center justify-between text-white active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 px-2.5 py-1 rounded-lg text-sm font-bold">
                                {totalItems}
                            </div>
                            <span className="font-medium">View Cart</span>
                        </div>
                        <span className="font-black text-xl">₹{grandTotal.toFixed(2)}</span>
                    </button>
                </div>
            )}

            {/* Cart Drawer (Bottom Sheet) */}
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                        onClick={() => setIsCartOpen(false)}
                    />

                    {/* Sheet */}
                    <div className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-[32px] border-t border-border max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsCartOpen(false)}>
                            <div className="w-12 h-1.5 bg-muted rounded-full" />
                        </div>

                        {/* Sheet Header */}
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                <ShoppingCart className="text-primary" />
                                Current Bill
                            </h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Customer Selector */}
                        <div className="px-4 py-2">
                            <button onClick={onSelectCustomer} className="w-full bg-muted p-3 rounded-xl flex justify-between items-center text-sm border border-border text-foreground active:bg-muted/50 transition-colors">
                                <span>Customer: <span className={customer ? 'text-primary font-bold' : 'text-muted-foreground'}>{customer?.name || 'Walk-in'}</span></span>
                                <span className="text-primary text-xs font-bold uppercase tracking-wider">Change</span>
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-3 py-3 border-b border-border last:border-0">
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground text-sm mb-1">{item.name}</p>
                                        <p className="text-primary font-bold text-sm">₹{item.amount.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-muted rounded-lg p-1 h-9">
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, -1)}
                                            className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground active:text-primary transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="font-bold text-foreground min-w-[20px] text-center text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, 1)}
                                            className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground active:text-primary transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Checkout Footer */}
                        <div className="p-4 bg-background pb-safe border-t border-border mt-auto">
                            <div className="flex justify-between items-center text-sm text-muted-foreground mb-4 font-medium">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={onCheckout}
                                className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl flex items-center justify-between px-6 shadow-lg shadow-primary/20 active:scale-95 transition-all text-primary-foreground"
                            >
                                <span className="font-bold text-lg">Checkout</span>
                                <span className="font-black text-xl">₹{grandTotal.toFixed(2)}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
