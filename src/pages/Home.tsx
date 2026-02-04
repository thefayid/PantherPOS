import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { customerService } from '../services/customerService';
import {
    Search, Plus, Trash2, CreditCard, Banknote, Smartphone,
    Minus, User, ShoppingBag,
    Percent, MessageSquare, Save, RotateCcw, Lock as LockIcon,
    ArrowRightLeft, XCircle, Pencil, CheckCircle, Printer, FileText, Download, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { estimateService } from '../services/estimateService';
import { cartService } from '../services/cartService';
import { productService } from '../services/productService';
import { billService } from '../services/billService';
import { printerService } from '../services/printerService';
import { exportService } from '../services/exportService'; // Added
import { eventBus } from '../utils/EventBus';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { cn } from '../utils/classNames';
import { platformService } from '../services/platformService';
import { barcodeService } from '../services/barcodeService';

import type { Product, Customer } from '../types/db';
import MobileBilling from '../components/mobile/MobileBilling';

interface CartItem extends Product {
    quantity: number;
    amount: number;
}

export default function Home() {
    const navigate = useNavigate();
    // --- STATE ---
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(false);

    // Order Details State
    const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
    const [billNotes, setBillNotes] = useState('');
    const [billDiscount, setBillDiscount] = useState(0); // Fixed amount for now

    // Modals
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI' | 'SPLIT'>('CASH');
    const [paymentStep, setPaymentStep] = useState<'SELECT_MODE' | 'CONFIRM_AMOUNT' | 'RECEIPT_OPTIONS'>('SELECT_MODE');
    const [paidAmount, setPaidAmount] = useState(0);
    const [lastBill, setLastBill] = useState<any>(null); // Added lastBill
    const [discountModalOpen, setDiscountModalOpen] = useState(false);
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null);
    const [quantityModalOpen, setQuantityModalOpen] = useState(false);
    const [newQuantity, setNewQuantity] = useState('');
    const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [whatsAppPhone, setWhatsAppPhone] = useState('');

    // Customer Selection
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerResults, setCustomerResults] = useState<Customer[]>([]);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        loadProducts();
        setCart(cartService.getCart());

        const removeUpdate = eventBus.on('CART_UPDATED', (items) => setCart(items));
        const removeToast = eventBus.on('SHOW_TOAST', (data) => {
            if (data.type === 'error') toast.error(data.message);
            else if (data.type === 'success') toast.success(data.message);
        });

        // Keyboard Shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') { e.preventDefault(); setPaymentMode('CASH'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); }
            if (e.key === 'F2') { e.preventDefault(); setPaymentMode('CARD'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); }
            if (e.key === 'F3') { e.preventDefault(); setPaymentMode('UPI'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); }
            if (e.key === 'F4') {
                e.preventDefault();
                if (selectedCartIndex !== null && cart[selectedCartIndex]) {
                    setNewQuantity(cart[selectedCartIndex].quantity.toString());
                    setQuantityModalOpen(true);
                } else if (cart.length > 0) {
                    // Default to last item if none selected
                    setSelectedCartIndex(cart.length - 1);
                    setNewQuantity(cart[cart.length - 1].quantity.toString());
                    setQuantityModalOpen(true);
                }
            }
            if (e.key === 'F10' || (e.ctrlKey && e.key === 'f')) { e.preventDefault(); searchInputRef.current?.focus(); }
            if (e.key === 'F12' && cartService.getCart().length > 0) { e.preventDefault(); setPaymentModalOpen(true); }
            if (e.key === 'Escape') {
                setPaymentModalOpen(false);
                setDiscountModalOpen(false);
                setCommentModalOpen(false);
                setQuantityModalOpen(false);
                setWhatsAppModalOpen(false);
            }
            if (e.key === 'Delete') {
                if (selectedCartIndex !== null && cart[selectedCartIndex]) {
                    removeFromCart(cart[selectedCartIndex].id);
                    setSelectedCartIndex(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            removeUpdate();
            removeToast();
        };
    }, [cart, selectedCartIndex]); // Added dependencies for accurate cart access in shortcuts

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchTerm) {
                productService.search(searchTerm).then(setProducts);
            } else {
                productService.getAll().then(res => setProducts(res.slice(0, 50)));
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    // Quantity Modal Auto Focus
    useEffect(() => {
        if (quantityModalOpen) {
            setTimeout(() => quantityInputRef.current?.select(), 100);
        }
    }, [quantityModalOpen]);

    // Customer Search Effect
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (customerModalOpen) {
                if (customerSearchTerm.trim()) {
                    try {
                        const res = await customerService.search(customerSearchTerm);
                        setCustomerResults(res);
                    } catch (e) { console.error(e); }
                } else {
                    const res = await customerService.getAll();
                    setCustomerResults(res.slice(0, 20));
                }
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [customerSearchTerm, customerModalOpen]);

    const loadProducts = async () => {
        try {
            const res = await productService.getAll();
            setProducts(res.slice(0, 50));
        } catch (e) {
            console.error(e);
        }
    };

    const addToCart = (product: Product) => {
        cartService.addItem(product, 1);
        toast.success(`Added ${product.name}`, { icon: '🛒', position: 'bottom-center' }); // Changed position
        setSearchTerm('');
        searchInputRef.current?.focus();
        // Select the newly added item (usually last)
        setTimeout(() => setSelectedCartIndex(cartService.getCart().length - 1), 50);
    };

    const updateQuantity = (id: number, delta: number) => cartService.updateQuantity(id, delta);
    const setQuantity = (id: number, qty: number) => {
        cartService.setQuantity(id, qty);
        setQuantityModalOpen(false);
    };

    const removeFromCart = (id: number) => {
        cartService.removeItem(id);
        if (selectedCartIndex !== null) setSelectedCartIndex(null);
    };

    const clearCart = () => { cartService.clear(); setBillNotes(''); setBillDiscount(0); setOrderType('DINE_IN'); setCustomer(null); setSelectedCartIndex(null); };

    const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);
    const grandTotal = Math.max(0, subtotal - billDiscount);

    const handleCameraScan = async () => {
        const result = await barcodeService.scanMobile();
        if (result) {
            setSearchTerm(result);
            const p = await productService.getByBarcode(result);
            if (p) {
                addToCart(p);
            } else {
                toast.error(`Product with barcode ${result} not found`);
            }
        }
    };

    // --- ACTIONS ---
    const handleSaveEstimate = async () => {
        if (cart.length === 0) return;
        if (!confirm('Save current items as an Estimate / Quotation?')) return;
        setProcessing(true);
        try {
            await estimateService.create({
                sub_total: subtotal,
                discount_amount: billDiscount,
                tax_amount: 0, // Simplified for now
                total_amount: grandTotal,
                payment_mode: 'CASH',
                customer_id: customer?.id,
                status: 'ACTIVE'
            }, cart.map(item => ({
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.sell_price,
                tax_rate: item.gst_rate || 0,
                total_amount: item.amount
            })));
            toast.success('Estimate Saved Successfully');
            clearCart();
        } catch (error: any) {
            toast.error('Failed to save estimate: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const billNo = await billService.saveBill({
                items: cart, subtotal, totalTax: 0, grandTotal, paymentMode, tenders: [{ mode: paymentMode, amount: grandTotal }],
                taxInclusive: true, isInterState: false, customer_id: customer?.id,
                discount_amount: billDiscount, points_redeemed: 0, points_earned: 0,
                order_type: orderType, notes: billNotes
            });

            let details: any = null;
            try {
                const saleService = await import('../services/saleService').then(m => m.saleService);
                details = await saleService.getBillDetailsByNo(billNo);
            } catch (e) {
                console.warn("Failed to fetch bill details, using local fallback", e);
                // Fallback construction of bill details for UI/Receipt
                details = {
                    bill_no: billNo,
                    date: new Date().toISOString(),
                    total: grandTotal,
                    subtotal: subtotal,
                    cgst: 0, sgst: 0, igst: 0, // Simplified, printer might need these but 0 is safe
                    items: cart.map(c => {
                        const taxable = (c.sell_price * c.quantity) / (1 + (c.gst_rate || 0) / 100);
                        return {
                            ...c,
                            productName: c.name,
                            taxable_value: taxable,
                            gst_amount: (c.sell_price * c.quantity) - taxable,
                            hsn_code: c.hsn_code || '---'
                        };
                    }),
                    notes: billNotes,
                    payment_mode: paymentMode
                };
            }

            toast.success(`Bill Saved: ${billNo}`);
            setLastBill(details);
            setPaymentStep('RECEIPT_OPTIONS');
            // Do NOT clear cart yet, wait for "New Sale"
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setProcessing(false);
        }
    };

    interface GridButton {
        label: string;
        icon?: any;
        color: string;
        bg: string;
        key?: string;
        action: () => void;
        border?: string;
        hover?: string;
    }

    // Button Grid Configuration
    const gridButtons: GridButton[] = [
        // Row 1
        {
            label: 'Delete',
            icon: XCircle,
            color: 'text-muted-foreground',
            bg: 'bg-surface hover:bg-muted',
            action: () => {
                if (selectedCartIndex !== null && cart[selectedCartIndex]) {
                    removeFromCart(cart[selectedCartIndex].id);
                } else {
                    toast.error("Select an item to delete");
                }
            }
        },
        { label: 'Search', icon: Search, color: 'text-foreground', bg: 'bg-surface hover:bg-muted', key: 'F3', action: () => searchInputRef.current?.focus() },
        {
            label: 'Quantity',
            icon: ShoppingBag,
            color: 'text-foreground',
            bg: 'bg-surface hover:bg-muted',
            key: 'F4',
            action: () => {
                if (selectedCartIndex !== null && cart[selectedCartIndex]) {
                    setNewQuantity(cart[selectedCartIndex].quantity.toString());
                    setQuantityModalOpen(true);
                } else {
                    toast.error("Select an item to change quantity");
                }
            }
        },
        { label: 'New sale', icon: Plus, color: 'text-foreground', bg: 'bg-surface hover:bg-muted', key: 'F8', action: clearCart },

        // Row 2 (Payment Shortcuts)
        { label: 'Cash', color: 'text-foreground', bg: 'bg-surface hover:bg-muted', key: 'F12', border: 'border-b-4 border-green-500', action: () => { setPaymentMode('CASH'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); } },
        { label: 'UPI', color: 'text-foreground', bg: 'bg-surface hover:bg-muted', border: 'border-b-4 border-sky-400', action: () => { setPaymentMode('UPI'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); } },
        { label: 'Card', color: 'text-foreground', bg: 'bg-surface hover:bg-muted', border: 'border-b-4 border-yellow-400', action: () => { setPaymentMode('CARD'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); } },
        { label: 'Credit', color: 'text-foreground', bg: 'bg-surface hover:bg-muted', border: 'border-b-4 border-red-400', action: () => { toast.error("Credit sale not fully implemented"); } },

        // Row 3 (Operations)
        { label: 'Drawer', icon: Banknote, color: 'text-foreground', bg: 'bg-surface hover:bg-muted', action: () => printerService.openDrawer() },
        { label: 'Takeaway', icon: ShoppingBag, color: orderType === 'TAKEAWAY' ? 'text-primary-foreground' : 'text-foreground', bg: orderType === 'TAKEAWAY' ? 'bg-primary' : 'bg-surface hover:bg-muted', action: () => setOrderType(prev => prev === 'TAKEAWAY' ? 'DINE_IN' : 'TAKEAWAY') },
        { label: 'Discount', icon: Percent, color: 'text-foreground', bg: 'bg-surface hover:bg-muted', key: 'F2', action: () => setDiscountModalOpen(true) },
        { label: 'Comment', icon: MessageSquare, color: 'text-foreground', bg: 'bg-surface hover:bg-muted', action: () => setCommentModalOpen(true) },

        // Row 4 (Actions)
        { label: 'Save sale', icon: Save, color: 'text-foreground', bg: 'bg-surface hover:bg-muted', key: 'F9', action: handleSaveEstimate },
        { label: 'Refund', icon: RotateCcw, color: 'text-foreground', bg: 'bg-surface hover:bg-muted', action: () => navigate('/sales') }, // Goto sales for return
        { label: 'Customer', icon: User, color: customer ? 'text-primary' : 'text-foreground', bg: 'bg-surface hover:bg-muted', action: () => setCustomerModalOpen(true) },
        { label: 'Lock', icon: LockIcon, color: 'text-foreground', bg: 'bg-surface hover:bg-muted', action: () => navigate('/login') },

        // Row 5 (Misc)
        { label: 'Transfer', icon: ArrowRightLeft, color: 'text-foreground', bg: 'bg-surface hover:bg-muted', key: 'F7', action: () => { } },
        { label: 'Void order', icon: Trash2, color: 'text-destructive-foreground', bg: 'bg-destructive hover:bg-destructive/90', action: () => { if (confirm('Void entire order?')) clearCart(); } },
        // Merging Payment button as big green one in last slot(s)
    ];


    return (
        <div className="flex h-full bg-background text-foreground font-sans overflow-hidden">

            {/* === MOBILE LAYOUT === */}
            <div className="md:hidden w-full h-full">
                <MobileBilling
                    products={products}
                    cart={cart}
                    onAddToCart={addToCart}
                    onUpdateQuantity={updateQuantity}
                    onRemoveFromCart={removeFromCart}
                    onCheckout={() => {
                        if (cart.length > 0) setPaymentModalOpen(true);
                    }}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onScan={handleCameraScan}
                    grandTotal={grandTotal}
                    subtotal={subtotal}
                    customer={customer}
                    onSelectCustomer={() => navigate('/customers')}
                />
            </div>

            {/* === DESKTOP LAYOUT (Main + Right Panel) === */}
            <div className="hidden md:flex w-full h-full">
                {/* === MAIN CONTENT (LEFT/CENTER) === */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-border bg-background/30">
                    {/* Search Bar */}
                    <div className="p-6 pb-2">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && products.length > 0) addToCart(products[0]); }}
                                placeholder="Scan barcode or search... (Enter to add)"
                                className="w-full bg-surface text-foreground text-lg placeholder:text-muted-foreground rounded-2xl pl-14 pr-14 py-4 border border-border shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            />
                            {platformService.isCapacitor() && (
                                <button
                                    onClick={handleCameraScan}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
                                >
                                    <Camera size={24} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 p-6 overflow-y-auto no-scrollbar relative">
                        {/* Show suggestions if no search term, or results if searching. Only show empty state if NO products at all. */}
                        {products.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/20 pointer-events-none">
                                <Search className="w-24 h-24 mb-6 opacity-20" strokeWidth={1.5} />
                                <h2 className="text-xl font-medium text-muted-foreground/40">No Products Found</h2>
                                <p className="mt-2 text-sm text-muted-foreground/30">Add products to see them here</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-3 pb-4">
                                {products.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className="bg-surface hover:bg-muted/50 rounded-lg cursor-pointer transition-all border border-border hover:border-primary/50 group shadow-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                    >
                                        {/* Image Section */}
                                        <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden">
                                            {p.image ? (
                                                <img
                                                    src={p.image}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                    <ShoppingBag size={24} />
                                                </div>
                                            )}
                                            {/* Price Tag Overlay */}
                                            <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-md text-white px-1.5 py-0.5 rounded text-xs font-bold shadow-sm">
                                                ₹{p.sell_price}
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="p-2">
                                            <div className="text-foreground font-medium truncate text-xs" title={p.name}>{p.name}</div>
                                            <div className="flex justify-between items-center mt-1.5">
                                                <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0 rounded border border-border truncate max-w-[60px]">{p.barcode}</span>
                                                {p.stock <= (p.min_stock_level || 5) && (
                                                    <span className="text-[9px] text-red-500 font-bold px-1 py-0 bg-red-500/10 rounded">Low: {p.stock}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* === RIGHT PANEL (CART & BUTTONS) === */}
                <div className="w-[450px] bg-surface flex flex-col flex-shrink-0 z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] border-l border-border">
                    {/* Header / Current Bill */}
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Current Bill</h2>
                                {customer ? (
                                    <div className="flex items-center gap-1 text-xs text-primary font-bold animate-in fade-in">
                                        <User size={12} /> {customer.name}
                                        <button onClick={() => setCustomer(null)} className="hover:text-destructive ml-1"><XCircle size={12} /></button>
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => setCustomerModalOpen(true)}>
                                        <User size={12} /> Walk-in Customer
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-mono bg-background px-2 py-1 rounded text-muted-foreground border border-border/50">Order: {orderType}</span>
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 no-scrollbar bg-background/30">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20">
                                <p>No items in cart</p>
                            </div>
                        ) : (
                            cart.map((item, index) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedCartIndex(index)}
                                    className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all shadow-sm",
                                        selectedCartIndex === index
                                            ? "bg-primary/20 border-primary"
                                            : "bg-surface/50 border-transparent hover:bg-surface hover:border-border"
                                    )}
                                >
                                    {/* Quantity */}
                                    <div className="flex flex-col items-center gap-0.5">
                                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="hover:bg-muted rounded p-0.5 text-foreground"><Plus size={12} /></button>
                                        <span className="text-sm font-bold w-6 text-center text-foreground">{item.quantity}</span>
                                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="hover:bg-muted rounded p-0.5 text-foreground"><Minus size={12} /></button>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate text-foreground">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">₹{item.sell_price} x {item.quantity}</div>
                                    </div>

                                    {/* Total */}
                                    <div className="text-right">
                                        <div className="font-bold text-sm text-foreground">₹{item.amount.toFixed(2)}</div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={14} /></button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals Section */}
                    <div className="px-4 py-2 bg-surface border-t border-border">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {billDiscount > 0 && (
                            <div className="flex justify-between text-sm text-primary mb-1">
                                <span>Discount</span>
                                <span>-₹{billDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end border-t border-dashed border-border pt-2">
                            <span className="text-lg font-bold text-foreground">Total</span>
                            <span className="text-2xl font-black text-primary">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* BUTTON GRID */}
                    <div className="bg-muted p-2 grid grid-cols-4 gap-1 h-[320px]">
                        {gridButtons.map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.action}
                                className={cn(
                                    "flex flex-col items-center justify-center p-1 rounded transition-all shadow-sm active:scale-95 border border-border/50 relative",
                                    btn.bg,
                                    btn.hover || "hover:brightness-95",
                                    btn.border
                                )}
                            >
                                {/* Key Hint */}
                                {btn.key && <span className="absolute top-1 left-2 text-[10px] font-bold opacity-50">{btn.key}</span>}

                                {btn.icon && <btn.icon size={20} className={cn("mb-1", btn.color)} />}
                                <span className={cn("text-xs font-medium text-center leading-none", btn.color)}>{btn.label}</span>
                            </button>
                        ))}
                        {/* Big Payment Button */}
                        <div className="col-span-2 row-span-1">
                            <button
                                onClick={() => { if (cart.length > 0) setPaymentModalOpen(true); }}
                                className="w-full h-full bg-primary hover:bg-primary/90 text-primary-foreground rounded flex flex-col items-center justify-center shadow-md active:scale-95 transition-all"
                            >
                                <span className="text-xl font-bold mb-1">F10</span>
                                <span className="text-sm font-medium opacity-90">Payment</span>
                            </button>
                        </div>

                        <div className="col-span-1 flex items-center justify-center bg-surface rounded border border-border text-primary font-bold tracking-widest cursor-pointer hover:bg-muted">
                            •••
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <Modal isOpen={paymentModalOpen} onClose={() => { if (paymentStep !== 'RECEIPT_OPTIONS') { setPaymentModalOpen(false); setPaymentStep('SELECT_MODE'); } }} title={
                paymentStep === 'SELECT_MODE' ? `Collect Payment: ₹${grandTotal.toFixed(2)}` :
                    paymentStep === 'CONFIRM_AMOUNT' ? `Confirm ${paymentMode} Payment` :
                        'Payment Successful'
            }>
                <div className="space-y-6 pt-2">
                    {paymentStep === 'SELECT_MODE' && (
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'CASH', label: 'Cash', icon: Banknote },
                                { id: 'CARD', label: 'Card', icon: CreditCard },
                                { id: 'UPI', label: 'UPI', icon: Smartphone }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setPaymentMode(m.id as any);
                                        setPaidAmount(grandTotal);
                                        setPaymentStep('CONFIRM_AMOUNT');
                                    }}
                                    className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border bg-card hover:bg-accent text-muted-foreground hover:border-primary hover:text-primary transition-all"
                                >
                                    <m.icon size={24} />
                                    <span className="font-bold">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {paymentStep === 'CONFIRM_AMOUNT' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-200">
                            <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-muted-foreground">Total Payable</span>
                                    <span className="font-bold text-foreground">₹{grandTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        Paid Amount
                                        <Pencil size={14} className="opacity-50" />
                                    </span>
                                    <div className="w-1/2">
                                        <input
                                            type="number"
                                            autoFocus
                                            className="w-full text-right bg-transparent border-b-2 border-primary text-2xl font-bold focus:outline-none"
                                            value={paidAmount}
                                            onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                                            onFocus={e => e.target.select()}
                                            onKeyDown={e => { if (e.key === 'Enter') handleCheckout(); }}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-lg pt-3 border-t border-dashed border-border">
                                    <span className="text-muted-foreground">Change Due</span>
                                    <span className={`font-bold text-xl ${paidAmount - grandTotal < 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                                        ₹{(paidAmount - grandTotal).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setPaymentStep('SELECT_MODE')} className="flex-1 h-14">
                                    Back
                                </Button>
                                <Button onClick={handleCheckout} disabled={processing || paidAmount < grandTotal} className="flex-[2] h-14 text-lg font-bold">
                                    {processing ? 'Processing...' : `Confirm (₹${grandTotal.toFixed(2)})`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {paymentStep === 'RECEIPT_OPTIONS' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-200">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground">Sale Completed!</h3>
                                <p className="text-muted-foreground">Bill No: <span className="font-mono font-bold text-foreground">{lastBill?.bill_no}</span></p>
                                <p className="text-sm text-muted-foreground">Change to Return: <span className="font-bold text-foreground">₹{(paidAmount - (lastBill?.total || 0)).toFixed(2)}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => printerService.printReceipt(lastBill)}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-all h-24"
                                >
                                    <Printer size={24} className="text-foreground" />
                                    <span className="font-medium text-sm">Print Receipt</span>
                                </button>
                                <button
                                    onClick={() => exportService.generateBillInvoice(lastBill)}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-all h-24"
                                >
                                    <FileText size={24} className="text-foreground" />
                                    <span className="font-medium text-sm">Print Invoice</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const bill = lastBill;
                                        if (!bill) return;

                                        let phone = bill.customer_phone;
                                        if (!phone) {
                                            setWhatsAppPhone('');
                                            setWhatsAppModalOpen(true);
                                            return;
                                        }

                                        // Clean phone number (remove spaces, dashes)
                                        phone = phone.replace(/\D/g, '');
                                        // Default to India +91 if not present and looks like mobile
                                        if (phone.length === 10) phone = '91' + phone;

                                        const customerName = bill.customer_name && bill.customer_name !== 'Walk-in Customer' ? bill.customer_name : 'Customer';
                                        const message = `Thank you ${customerName}! Here is your bill ${bill.bill_no} for ₹${bill.total}. Visit us again!`;
                                        const encodedMessage = encodeURIComponent(message);

                                        // Universal WhatsApp Link
                                        exportService.generateBillInvoice(bill);
                                        toast.success("Invoice PDF Generated. Please attach to WhatsApp.");
                                        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
                                    }}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-all h-24"
                                >
                                    <MessageSquare size={24} className="text-green-500" />
                                    <span className="font-medium text-sm">WhatsApp Bill</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setBillNotes(lastBill?.notes || '');
                                        setCommentModalOpen(true);
                                    }}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-all h-24"
                                >
                                    <Pencil size={24} className="text-foreground" />
                                    <span className="font-medium text-sm">Add Notes</span>
                                </button>
                            </div>

                            <Button onClick={() => { clearCart(); setPaymentModalOpen(false); setPaymentStep('SELECT_MODE'); }} className="w-full h-14 text-lg font-bold">
                                New Sale (Done)
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Discount Modal */}
            <Modal isOpen={discountModalOpen} onClose={() => setDiscountModalOpen(false)} title="Apply Discount">
                <div className="space-y-4 pt-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Discount Amount (₹)</label>
                        <input
                            type="number"
                            autoFocus
                            className="w-full text-2xl p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                            value={billDiscount || ''}
                            onChange={e => setBillDiscount(Number(e.target.value))}
                        />
                    </div>
                    <Button onClick={() => setDiscountModalOpen(false)} className="w-full">Apply Discount</Button>
                </div>
            </Modal>

            {/* Comment Modal */}
            <Modal isOpen={commentModalOpen} onClose={() => setCommentModalOpen(false)} title="Add Bill Note">
                <div className="space-y-4 pt-4">
                    <textarea
                        className="w-full p-3 border border-border rounded-lg h-32 bg-background text-foreground placeholder:text-muted-foreground"
                        placeholder="Type note or comment here..."
                        value={billNotes}
                        onChange={e => setBillNotes(e.target.value)}
                        autoFocus
                    />
                    <Button onClick={async () => {
                        if (paymentStep === 'RECEIPT_OPTIONS' && lastBill) {
                            await billService.updateNotes(lastBill.bill_no, billNotes);
                            setLastBill({ ...lastBill, notes: billNotes });
                            toast.success("Note saved to bill");
                        }
                        setCommentModalOpen(false);
                    }} className="w-full">Save Note</Button>
                </div>
            </Modal>

            {/* Quantity Modal */}
            <Modal isOpen={quantityModalOpen} onClose={() => setQuantityModalOpen(false)} title="Set Quantity">
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Quantity</label>
                            <input
                                ref={quantityInputRef}
                                type="number"
                                step="any" // Enable decimals
                                className="w-full text-3xl font-bold p-4 border border-border rounded-lg text-center bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                value={newQuantity}
                                onChange={e => setNewQuantity(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        if (selectedCartIndex !== null && cart[selectedCartIndex]) {
                                            setQuantity(cart[selectedCartIndex].id, parseFloat(newQuantity) || 1);
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {['1', '2', '3', '5', '10', '0.5', '0.25'].map(q => (
                            <button
                                key={q}
                                onClick={() => setNewQuantity(q)}
                                className="p-2 border border-border rounded hover:bg-muted text-foreground transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                        <button onClick={() => setNewQuantity((prev) => (parseFloat(prev || '0') + 1).toString())} className="p-2 border border-border rounded hover:bg-muted text-foreground transition-colors">+1</button>
                    </div>
                    <Button
                        onClick={() => {
                            if (selectedCartIndex !== null && cart[selectedCartIndex]) {
                                setQuantity(cart[selectedCartIndex].id, parseFloat(newQuantity) || 1);
                            }
                        }}
                        className="w-full h-12 text-lg"
                    >
                        Update Quantity
                    </Button>
                </div>
            </Modal>

            {/* WhatsApp Phone Modal */}
            <Modal isOpen={whatsAppModalOpen} onClose={() => setWhatsAppModalOpen(false)} title="Enter WhatsApp Number">
                <div className="space-y-4 pt-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Customer Phone Number</label>
                        <input
                            type="tel"
                            autoFocus
                            className="w-full text-2xl p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                            placeholder="e.g. 9876543210"
                            value={whatsAppPhone}
                            onChange={e => setWhatsAppPhone(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setWhatsAppModalOpen(false);
                                    let phone = whatsAppPhone.replace(/\D/g, '');
                                    if (phone.length === 10) phone = '91' + phone;

                                    if (lastBill) {
                                        const bill = lastBill;
                                        // WhatsApp logic continued...
                                    }
                                }
                            }}
                        />
                    </div>
                    <Button onClick={() => {
                        setWhatsAppModalOpen(false);
                        let phone = whatsAppPhone.replace(/\D/g, '');
                        if (phone.length === 10) phone = '91' + phone;

                        if (lastBill) {
                            const bill = lastBill;
                            const customerName = bill.customer_name && bill.customer_name !== 'Walk-in Customer' ? bill.customer_name : 'Customer';
                            const message = `Thank you ${customerName}! Here is your bill ${bill.bill_no} for ₹${bill.total}. Visit us again!`;
                            const encodedMessage = encodeURIComponent(message);

                            exportService.generateBillInvoice(bill).then(path => {
                                if (path && window.electronAPI && window.electronAPI.showItemInFolder) {
                                    window.electronAPI.showItemInFolder(path);
                                }
                                toast.success("Invoice PDF Generated. Drag & Drop to WhatsApp.");
                                window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
                            });
                        }
                    }} className="w-full mb-2">Open WhatsApp</Button>
                    <Button onClick={() => setWhatsAppModalOpen(false)} variant="secondary" className="w-full">Cancel</Button>
                </div>
            </Modal>

            {/* Customer Selection Modal */}
            <Modal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title="Select Customer">
                <div className="pt-4 flex flex-col h-[500px]">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search by name or phone..."
                                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                value={customerSearchTerm}
                                onChange={e => setCustomerSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => navigate('/customers')} variant="secondary">
                            <Plus size={16} className="mr-1" /> New
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-muted/10 p-1">
                        {customerResults.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <User size={48} className="opacity-20 mb-2" />
                                <p>No customers found</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {customerResults.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setCustomer(c);
                                            setCustomerModalOpen(false);
                                            toast.success(`Customer set to ${c.name}`);
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded hover:bg-primary/10 hover:border-primary border border-transparent transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-muted-foreground group-hover:text-primary group-hover:border-primary transition-colors">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground">{c.name}</div>
                                                <div className="text-xs text-muted-foreground">{c.phone || 'No Phone'}</div>
                                            </div>
                                        </div>
                                        {c.balance && c.balance !== 0 ? (
                                            <div className={`text-xs font-bold ${c.balance > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                                                {c.balance > 0 ? `Due: ₹${c.balance}` : `Credit: ₹${Math.abs(c.balance)}`}
                                            </div>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div >
    );
}
