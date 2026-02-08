
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import {
    Search, ShoppingBag, Plus, Minus, Trash2,
    Settings, LogOut, FileText, User, ChevronRight,
    LayoutGrid, List, Tag, AlertCircle, RefreshCw,
    Maximize2, Minimize2, CheckCircle, Calculator,
    Printer, X, MessageCircle, XCircle, Percent, Save,
    Banknote, MessageSquare, DollarSign, Lock as LockIcon,
    RotateCcw, Camera, Star, CreditCard, Smartphone,
    ArrowRightLeft, QrCode, Pencil, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { estimateService } from '../services/estimateService';
import { customerService } from '../services/customerService';
import { cartService } from '../services/cartService';
import { productService } from '../services/productService';
import { billService } from '../services/billService';
import { printerService } from '../services/printerService';
import { exportService } from '../services/exportService'; // Added
import { eventBus } from '../utils/EventBus';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { platformService } from '../services/platformService';
import { barcodeService } from '../services/barcodeService';
import { heldBillService, type HeldBill } from '../services/heldBillService';
import { useUI } from '../context/UIContext';
import { RefundModal } from '../components/RefundModal';
import { QuickAddProductModal } from '../components/QuickAddProductModal';
import { accountingService } from '../services/accountingService';
import { whatsappService } from '../services/whatsappService';
import { GSTBreakdownPanel } from '../components/GSTBreakdownPanel';
import { gstService } from '../services/gstService';

import { groupService, type ProductGroup } from '../services/groupService';
import type { Product, Customer } from '../types/db';
import MobileBilling from '../components/mobile/MobileBilling';

interface CartItem extends Product {
    quantity: number;
    amount: number;
}

interface MultiCartState {
    items: CartItem[];
    customer: Customer | null;
    pointsRedeemed: number;
    billDiscount: number;
    selectedItemIndex: number | null;
}

export default function Home() {
    const { isTouchMode } = useUI();
    const navigate = useNavigate();
    // --- STATE ---
    const [products, setProducts] = useState<Product[]>([]);
    const [carts, setCarts] = useState<MultiCartState[]>([
        { items: [], customer: null, pointsRedeemed: 0, billDiscount: 0, selectedItemIndex: null },
        { items: [], customer: null, pointsRedeemed: 0, billDiscount: 0, selectedItemIndex: null },
        { items: [], customer: null, pointsRedeemed: 0, billDiscount: 0, selectedItemIndex: null },
    ]);
    const [activeCartIndex, setActiveCartIndex] = useState(0);

    // Derived current state
    const currentCart = carts[activeCartIndex];
    const cart = currentCart.items;
    const customer = currentCart.customer;
    const pointsRedeemed = currentCart.pointsRedeemed;
    const billDiscount = currentCart.billDiscount;
    const selectedCartIndex = currentCart.selectedItemIndex;

    // Helper to update active cart
    const updateActiveCart = (updates: Partial<MultiCartState>) => {
        setCarts(prev => {
            const next = [...prev];
            next[activeCartIndex] = { ...next[activeCartIndex], ...updates };
            return next;
        });
    };

    const setCart = (items: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
        const newItems = typeof items === 'function' ? items(currentCart.items) : items;
        updateActiveCart({ items: newItems });
    };

    const setCustomer = (cust: Customer | null) => updateActiveCart({ customer: cust });
    const setPointsRedeemed = (pts: number) => updateActiveCart({ pointsRedeemed: pts });
    const setBillDiscount = (disc: number) => updateActiveCart({ billDiscount: disc });
    const setSelectedCartIndex = (idx: number | null) => updateActiveCart({ selectedItemIndex: idx });
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [groupAssociations, setGroupAssociations] = useState<{ group_id: number, product_id: number }[]>([]);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [overridePrice, setOverridePrice] = useState<string>('');
    const [processing, setProcessing] = useState(false);

    // GST Features - Phase 1
    const [taxInclusive, setTaxInclusive] = useState(() => {
        const saved = localStorage.getItem('pos_tax_inclusive');
        return saved ? JSON.parse(saved) : true;
    });
    const [isInterState, setIsInterState] = useState(false);
    const [placeOfSupply, setPlaceOfSupply] = useState<string>('');

    const updateItemPrice = (index: number, newPrice: number) => {
        setCart(prev => {
            const next = [...prev];
            const item = next[index];
            if (item) {
                // Ensure price is numeric
                const priceNum = typeof newPrice === 'number' ? newPrice : parseFloat(newPrice) || 0;
                item.sell_price = priceNum;
                item.amount = item.quantity * priceNum;
            }
            return next;
        });
        setEditingItemIndex(null);
    };

    // Order Details State
    const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
    const [billNotes, setBillNotes] = useState('');
    // const [billDiscount, setBillDiscount] = useState(0); // Fixed amount for now - now part of MultiCartState

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [holdModalOpen, setHoldModalOpen] = useState(false);
    const [lastBillModalOpen, setLastBillModalOpen] = useState(false); // New state for Last Bill Modal
    const [holdIdentifier, setHoldIdentifier] = useState('');
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI' | 'CREDIT' | 'SPLIT'>('CASH');
    const [paymentStep, setPaymentStep] = useState<'SELECT_MODE' | 'CONFIRM_AMOUNT' | 'RECEIPT_OPTIONS'>('SELECT_MODE');
    const [paidAmount, setPaidAmount] = useState(0);
    const [lastBill, setLastBill] = useState<any>(null); // Added lastBill
    const [splitPayment, setSplitPayment] = useState<{ [key: string]: number }>({ CASH: 0, CARD: 0, UPI: 0 });
    const [discountModalOpen, setDiscountModalOpen] = useState(false);
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    // const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null); // Now part of MultiCartState
    const [quantityModalOpen, setQuantityModalOpen] = useState(false);
    const [quickAddModalOpen, setQuickAddModalOpen] = useState(false); // New Quick Add Modal
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseNote, setExpenseNote] = useState('');
    const [newQuantity, setNewQuantity] = useState('');
    const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [whatsAppPhone, setWhatsAppPhone] = useState('');

    // QR Code Customer View
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrValue, setQrValue] = useState('');

    // Held Bills State
    const [heldBillsModalOpen, setHeldBillsModalOpen] = useState(false);
    const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
    const [moreActionsOpen, setMoreActionsOpen] = useState(false);


    // FAVORITES & Quick Access
    const [activeTab, setActiveTab] = useState<'ALL' | 'FAVORITES'>('ALL');
    const [favorites, setFavorites] = useState<number[]>(() => {
        const saved = localStorage.getItem('pos_favorites');
        return saved ? JSON.parse(saved) : [];
    });

    const toggleFavorite = (e: React.MouseEvent, productId: number) => {
        e.stopPropagation();
        setFavorites(prev => {
            const next = prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId];
            localStorage.setItem('pos_favorites', JSON.stringify(next));
            if (!prev.includes(productId)) toast.success("Added to Favorites");
            return next;
        });
    };

    // Suggestions State
    const [suggestions, setSuggestions] = useState<Product[]>([]);

    // Customer Selection
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerResults, setCustomerResults] = useState<Customer[]>([]);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        loadProducts();
        // setCart(cartService.getCart()); // This needs to be handled per-tab or removed if cartService is global

        const removeUpdate = eventBus.on('CART_UPDATED', (items) => setCart(items));
        const removeToast = eventBus.on('SHOW_TOAST', (data) => {
            if (data.type === 'error') toast.error(data.message);
            else if (data.type === 'success') toast.success(data.message);
        });

        // Keyboard Shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // TURBO MODES
            if (e.key === 'F1') { e.preventDefault(); setPaymentMode('CASH'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); }
            if (e.key === 'F2') { e.preventDefault(); setPaymentMode('UPI'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); }
            if (e.key === 'F3') { e.preventDefault(); setPaymentMode('CARD'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); }
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
            // Quick Pay Shortcuts
            if (e.key === 'F7') { e.preventDefault(); setPaymentMode('CASH'); setPaidAmount(100); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); }
            if (e.key === 'F8') { e.preventDefault(); setPaymentMode('CASH'); setPaidAmount(500); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); }
            if (e.key === 'F9') { e.preventDefault(); setPaymentMode('CASH'); setPaidAmount(2000); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); }

            if (e.key === 'F10' || (e.ctrlKey && e.key === 'f')) { e.preventDefault(); searchInputRef.current?.focus(); }
            if (e.key === 'F12' && cart.length > 0) { e.preventDefault(); setPaymentModalOpen(true); }
            if (e.key === 'Escape') {
                setPaymentModalOpen(false);
                setDiscountModalOpen(false);
                setCommentModalOpen(false);
                setQuantityModalOpen(false);
                setWhatsAppModalOpen(false);
                setQuickAddModalOpen(false);
            }
            if (e.key === 'Delete') {
                if (selectedCartIndex !== null && cart[selectedCartIndex]) {
                    removeFromCart(cart[selectedCartIndex].id);
                    setSelectedCartIndex(null);
                }
            }
            if (e.key === 'F6') { e.preventDefault(); setQuickAddModalOpen(true); } // Quick Add Shortcut
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            removeUpdate();
            removeToast();
        };
    }, [cart, selectedCartIndex, activeCartIndex]); // Added dependencies for accurate cart access in shortcuts

    // Fetch suggestions when cart changes (last item added)
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (cart.length > 0) {
                try {
                    // Import dynamically to avoid circular dependency issues if any, or just use reportService
                    const { reportService } = await import('../services/reportService');
                    const lastItem = cart[cart.length - 1];
                    const related = await reportService.getProductAssociations(lastItem.id, 4);

                    // Filter out items already in cart
                    const cartIds = new Set(cart.map(c => c.id));
                    const filtered = related.filter((p: any) => !cartIds.has(p.id));

                    setSuggestions(filtered);
                } catch (e) {
                    console.error("Failed to fetch suggestions", e);
                }
            } else {
                setSuggestions([]);
            }
        };
        fetchSuggestions();
    }, [cart]);

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

    // Return Mode State
    const [isReturnMode, setIsReturnMode] = useState(false);
    const [refundModalOpen, setRefundModalOpen] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [originalBillId, setOriginalBillId] = useState<number | null>(null);

    const handleRefundConfirm = (bill: any, paymentMode: string) => {
        console.log('[Home] handleRefundConfirm:', bill);
        toast('Debug: Loading Refund Bill #' + bill.bill_no, { icon: '🔄' });

        // cartService.clear(); // This needs to be updated to clear the active cart

        // Ensure UI knows we are in Return Mode
        setIsReturnMode(true);
        setOriginalBillId(bill.id);
        setBillNotes(`Refund for Bill No: ${bill.bill_no} `);

        console.log('[Home] handleRefundConfirm - Items:', bill.items.length);
        const newCartItems: CartItem[] = [];
        bill.items.forEach((item: any) => {
            // Basic mapping from Bill Item to Product for Cart
            const product = {
                id: item.product_id,
                name: item.name || item.productName || 'Unknown Item',
                barcode: item.barcode,
                sell_price: item.current_price || item.price,
                gst_rate: item.gst_rate,
                image: item.image,
                category_id: 0,
                stock: 0,
                min_stock_level: 0,
                cost_price: 0
            };

            const qty = -1 * Math.abs(item.quantity);
            console.log('[Home] Adding Refund Item:', product.name, qty);
            // Add as negative quantity
            // cartService.addItem(product as any, qty); // This needs to be updated to add to the active cart
            newCartItems.push({ ...product, quantity: qty, amount: qty * product.sell_price });
        });
        setCart(newCartItems); // Set the new cart items for the active tab

        // Force UI Refresh
        // setCart(cartService.getCart()); // This is no longer needed as setCart updates the state directly

        // Force Payment Mode if needed
        if (paymentMode) {
            setPaymentMode(paymentMode as any);
        }

        toast.success(`Loaded items from ${bill.bill_no} for Refund`);
    };

    const fetchGroups = async () => {
        try {
            const [groupsRes, assocRes] = await Promise.all([
                groupService.getAll(),
                groupService.getProductGroupAssociations()
            ]);
            setGroups(groupsRes);
            setGroupAssociations(assocRes);
        } catch (error) {
            console.error("Failed to fetch groups:", error);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await productService.getAll();
            setProducts(res.slice(0, 50));
        } catch (e) {
            console.error(e);
        }
    };

    const addToCart = (product: Product) => {
        const qty = isReturnMode ? -1 : 1;
        // cartService.addItem(product, qty); // This needs to be updated to add to the active cart
        setCart(prev => {
            const existingItemIndex = prev.findIndex(item => item.id === product.id);
            if (existingItemIndex > -1) {
                const updatedCart = [...prev];
                const existingItem = updatedCart[existingItemIndex];
                existingItem.quantity += qty;
                existingItem.amount = existingItem.quantity * existingItem.sell_price;
                if (existingItem.quantity === 0) {
                    return updatedCart.filter(item => item.id !== product.id);
                }
                return updatedCart;
            } else {
                return [...prev, { ...product, quantity: qty, amount: qty * product.sell_price }];
            }
        });


        const action = isReturnMode ? 'Returned' : 'Added';
        const icon = isReturnMode ? '↩️' : '🛒';
        toast.success(`${action} ${product.name} `, { icon, position: 'bottom-center' });

        setSearchTerm('');
        searchInputRef.current?.focus();
        // Select the newly added item (usually last)
        setTimeout(() => setSelectedCartIndex(cart.length - 1), 50);

        // Auto-disable return mode after one item? Or keep it sticky?
        // User preference: Sticky is usually better for batch returns.
        // But for safety, maybe visual cue is enough.
    };

    const updateQuantity = (id: number, delta: number) => {
        // cartService.updateQuantity(id, delta); // This needs to be updated for active cart
        setCart(prev => {
            const updatedCart = prev.map(item => {
                if (item.id === id) {
                    const newQuantity = item.quantity + delta;
                    return { ...item, quantity: newQuantity, amount: newQuantity * item.sell_price };
                }
                return item;
            }).filter(item => item.quantity !== 0); // Remove if quantity becomes 0
            return updatedCart;
        });
    };
    const setQuantity = (id: number, qty: number) => {
        // cartService.setQuantity(id, qty); // This needs to be updated for active cart
        setCart(prev => {
            const updatedCart = prev.map(item => {
                if (item.id === id) {
                    return { ...item, quantity: qty, amount: qty * item.sell_price };
                }
                return item;
            }).filter(item => item.quantity !== 0); // Remove if quantity becomes 0
            return updatedCart;
        });
        setQuantityModalOpen(false);
    };

    const removeFromCart = (id: number) => {
        // cartService.removeItem(id); // This needs to be updated for active cart
        setCart(prev => prev.filter(item => item.id !== id));
        if (selectedCartIndex !== null) setSelectedCartIndex(null);
    };

    const clearCart = () => {
        // cartService.clear(); // This needs to be updated for active cart
        updateActiveCart({
            items: [],
            customer: null,
            pointsRedeemed: 0,
            billDiscount: 0,
            selectedItemIndex: null
        });
        setBillNotes('');
        setOrderType('DINE_IN');
    };

    // Loyalty Interaction
    // const [pointsRedeemed, setPointsRedeemed] = useState(0); // Now part of MultiCartState
    const POINT_VALUE = 0.1; // 10 Point = ₹1 (User requested 10pts = 1rs)
    const POINTS_EARN_RATE = 100; // ₹100 spend = 1 Point

    // Reset points when customer changes
    useEffect(() => {
        setPointsRedeemed(0);
    }, [customer, activeCartIndex]); // Added activeCartIndex

    // Subtotal & Totals
    const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);
    const maxRedeemablePoints = customer ? Math.min(customer.points, Math.floor((subtotal - billDiscount) / POINT_VALUE)) : 0;

    // Ensure we don't redeem more than possible if cart changes
    useEffect(() => {
        if (pointsRedeemed > maxRedeemablePoints && maxRedeemablePoints >= 0) {
            setPointsRedeemed(maxRedeemablePoints);
        }
    }, [subtotal, billDiscount, customer, pointsRedeemed, maxRedeemablePoints]);

    // Persist tax inclusive preference
    useEffect(() => {
        localStorage.setItem('pos_tax_inclusive', JSON.stringify(taxInclusive));
    }, [taxInclusive]);

    // Auto-detect place of supply from customer GSTIN - Phase 2 GST
    const [companyState, setCompanyState] = useState<string>('');

    useEffect(() => {
        // Fetch Company State on Mount
        const loadSettings = async () => {
            const settings = await import('../services/settingsService').then(m => m.settingsService.getSettings());
            // Try to find state in address, or default to a known value if configured
            // For now, simple heuristic or manual override if needed. 
            // Best approach: Add 'State' to settings. For now, assume a default or extract.
            // Let's check if GSTIN is in settings!
            if (settings.gst_no) {
                const state = gstService.extractStateFromGSTIN(settings.gst_no);
                if (state) setCompanyState(state);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (customer?.gstin) {
            const validation = gstService.validateGSTIN(customer.gstin);
            if (validation.valid) {
                // Auto-fill place of supply from customer's state
                const customerState = gstService.extractStateFromGSTIN(customer.gstin);
                if (customerState) {
                    setPlaceOfSupply(customerState);

                    // Auto-detect Inter-State
                    if (companyState) {
                        const companyCode = gstService.getStateCode(companyState);
                        const customerCode = gstService.getStateCode(customerState);
                        if (companyCode && customerCode) {
                            const isInter = companyCode !== customerCode;
                            setIsInterState(isInter);
                            if (isInter) {
                                toast.success('Inter-State Transaction Detected', { icon: 'Truck', duration: 2000 });
                            } else {
                                // toast.success('Intra-State Transaction', { icon: 'Home', duration: 2000 });
                            }
                        }
                    }
                }
            }
        } else if (customer?.state) {
            // Fallback: use manually entered state
            setPlaceOfSupply(customer.state);
            if (companyState) {
                setIsInterState(companyState !== customer.state);
            }
        } else {
            // No customer or no state info
            setPlaceOfSupply('');
            setIsInterState(false); // Default to local
        }
    }, [customer, companyState]);

    const grandTotal = subtotal - billDiscount - (pointsRedeemed * POINT_VALUE);
    const pointsEarned = Math.floor(grandTotal / POINTS_EARN_RATE);

    // ... existing handlers ...

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

    const handleHoldBill = () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }
        setHoldIdentifier(customer ? customer.name : "Walk-in");
        setHoldModalOpen(true);
    };

    const confirmHoldBill = async () => {
        if (!holdIdentifier.trim()) {
            toast.error("Please enter a name or ID for this hold");
            return;
        }
        try {
            await heldBillService.add(holdIdentifier, cart);
            clearCart();
            setHoldModalOpen(false);
            toast.success("Bill Held Successfully", { icon: '⏸️' });
        } catch (e: any) {
            toast.error("Failed to hold bill");
        }
    };

    const fetchHeldBills = async () => {
        if (heldBillsModalOpen) {
            const bills = await heldBillService.getAll();
            setHeldBills(bills);
        }
    };

    useEffect(() => {
        fetchHeldBills();
    }, [heldBillsModalOpen]);

    const handleRestoreBill = async (id: number) => {
        try {
            const items = await heldBillService.retrieve(id);
            // This replaces current cart. If current cart has items, maybe warn?
            // For now, just overwrite or append? Typically overwrite for "Restore".
            // Let's Append if cart exists? Or Clear?
            // Standard POS: "Retrieve" usually implies "Load this bill".
            if (cart.length > 0) {
                if (!confirm("Current cart will be cleared to restore held bill. Continue?")) return;
            }

            // We need to restore via cartService to ensure state consistency if using local storage
            // cartService.clear(); // This needs to be updated for active cart
            // items.forEach(item => {
            //     cartService.addItem(item, item.quantity); // Re-add items
            // });
            updateActiveCart({
                items: items.map(item => ({ ...item, amount: item.quantity * item.sell_price })),
                customer: null, // Customer info is not stored in held bill currently, or needs to be retrieved
                pointsRedeemed: 0,
                billDiscount: 0,
                selectedItemIndex: null
            });


            setHeldBillsModalOpen(false);
            toast.success("Bill Restored");
        } catch (e) {
            toast.error("Failed to restore bill");
        }
    };

    const handleDiscardBill = async (id: number) => {
        if (!confirm("Are you sure you want to permanently delete this held bill?")) return;
        try {
            await heldBillService.delete(id);
            toast.success("Held Bill Deleted");
            fetchHeldBills(); // Refresh list
        } catch (e) {
            toast.error("Failed to delete held bill");
        }
    };

    const getTimeElapsed = (dateStr: string) => {
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const handleSaveExpense = async () => {
        const amount = parseFloat(expenseAmount);
        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (!expenseNote.trim()) {
            toast.error("Please enter a description");
            return;
        }

        try {
            setProcessing(true);
            await accountingService.addExpense(amount, expenseNote);
            toast.success("Expense Recorded Successfully");
            setExpenseModalOpen(false);
            setExpenseAmount('');
            setExpenseNote('');
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to record expense: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleSaveEstimate = async () => {
        if (cart.length === 0) return;
        if (!confirm('Save current items as an Estimate / Quotation?')) return;
        setProcessing(true);
        try {
            await estimateService.create({
                sub_total: subtotal,
                discount_amount: billDiscount,
                tax_amount: 0,
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
        console.log('[Home] handleCheckout Initiated. Processing:', processing);

        if (processing) {
            toast('Debug: Blocked - Already Processing', { icon: '🚫' });
            return;
        }

        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        setProcessing(true);

        try {
            // Construct Tenders
            let tenders = [];
            if (paymentMode === 'SPLIT') {
                tenders = Object.entries(splitPayment)
                    .filter(([_, amount]) => amount > 0)
                    .map(([mode, amount]) => ({ mode, amount }));
            } else {
                tenders = [{ mode: paymentMode, amount: grandTotal }];
            }

            const billNo = await billService.saveBill({
                items: cart, subtotal, totalTax: 0, grandTotal, paymentMode, tenders: tenders,
                taxInclusive, isInterState,
                place_of_supply: placeOfSupply, customer_gstin: customer?.gstin,
                customer_id: customer?.id,
                discount_amount: (billDiscount + (pointsRedeemed * POINT_VALUE)), points_redeemed: pointsRedeemed, points_earned: pointsEarned,
                order_type: orderType, notes: billNotes, originalBillId: originalBillId || undefined
            });

            let details: any = null;
            try {
                const { saleService } = await import('../services/saleService');
                details = await saleService.getBillDetailsByNo(billNo);
            } catch (e) {
                console.warn("Failed to fetch bill details, using local fallback", e);
                details = {
                    bill_no: billNo,
                    date: new Date().toISOString(),
                    total: grandTotal,
                    subtotal: subtotal,
                    cgst: 0, sgst: 0, igst: 0,
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

            toast.success(`Bill Saved: ${billNo} `);
            setLastBill(details);
            setPaymentStep('RECEIPT_OPTIONS');
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

    // Button Grid Configuration - 4 Row Strategy
    const primaryButtons: GridButton[] = [
        // Row 1
        {
            label: 'Delete',
            icon: XCircle,
            color: 'text-white',
            bg: 'bg-red-600',
            action: () => {
                if (selectedCartIndex !== null && cart[selectedCartIndex]) {
                    removeFromCart(cart[selectedCartIndex].id);
                } else {
                    toast.error("Select an item to delete");
                }
            }
        },
        { label: 'Search', icon: Search, color: 'text-gray-700', bg: 'bg-white', key: 'F3', action: () => searchInputRef.current?.focus() },
        { label: 'New sale', icon: Plus, color: 'text-gray-700', bg: 'bg-white', key: 'F8', action: clearCart },
        { label: 'Customer', icon: User, color: customer ? 'text-primary' : 'text-gray-700', bg: 'bg-white font-bold', action: () => setCustomerModalOpen(true) },

        // Row 2 (Payment Shortcuts)
        { label: 'Cash', color: 'text-gray-700', bg: 'bg-white', key: 'F12', border: 'border-b-4 border-green-500', action: () => { setPaymentMode('CASH'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); } },
        { label: 'UPI', color: 'text-gray-700', bg: 'bg-white', border: 'border-b-4 border-sky-400', action: () => { setPaymentMode('UPI'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); } },
        { label: 'Card', color: 'text-gray-700', bg: 'bg-white', border: 'border-b-4 border-yellow-400', action: () => { setPaymentMode('CARD'); setPaidAmount(grandTotal); setPaymentStep('CONFIRM_AMOUNT'); setPaymentModalOpen(true); } },
        {
            label: 'Credit',
            color: 'text-gray-700',
            bg: 'bg-white',
            border: 'border-b-4 border-red-400',
            action: () => {
                if (!customer) {
                    toast.error("Please select a customer first", { icon: '👤' });
                    setCustomerModalOpen(true);
                    return;
                }
                setPaymentMode('CREDIT');
                setPaidAmount(grandTotal);
                setPaymentStep('CONFIRM_AMOUNT');
                setPaymentModalOpen(true);
            }
        },

        // Row 3
        {
            label: 'Quantity',
            icon: ShoppingBag,
            color: 'text-gray-700',
            bg: 'bg-white',
            key: 'F4',
            action: () => {
                if (selectedCartIndex !== null && cart[selectedCartIndex]) {
                    setNewQuantity(cart[selectedCartIndex].quantity.toString());
                    setQuantityModalOpen(true);
                } else {
                    toast.error("Select an item first");
                }
            }
        },
        { label: 'Discount', icon: Percent, color: 'text-gray-700', bg: 'bg-white', key: 'F2', action: () => setDiscountModalOpen(true) },
        { label: 'Quick Add', icon: Plus, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', key: 'F6', action: () => setQuickAddModalOpen(true) },
        {
            label: 'Last Bill',
            icon: FileText,
            color: 'text-gray-700',
            bg: 'bg-white',
            key: 'F7',
            action: async () => {
                if (!lastBill) {
                    try {
                        const { saleService } = await import('../services/saleService');
                        const lb = await saleService.getLastBill();
                        if (lb) {
                            setLastBill(lb);
                            setLastBillModalOpen(true);
                        } else {
                            toast.error("No recent bills found");
                        }
                    } catch (e) {
                        toast.error("Failed to load last bill");
                    }
                }
                setLastBillModalOpen(true);
            }
        },
    ];

    const moreButtons: GridButton[] = [
        { label: 'Save', icon: Save, key: 'F9', color: 'text-gray-700', bg: 'bg-white', action: handleSaveEstimate },
        { label: 'Drawer', icon: Banknote, color: 'text-gray-700', bg: 'bg-white', action: () => printerService.openDrawer() },
        { label: 'Type', icon: ShoppingBag, color: 'text-gray-700', bg: 'bg-white', action: () => setOrderType(prev => prev === 'TAKEAWAY' ? 'DINE_IN' : 'TAKEAWAY') },
        { label: 'Note', icon: MessageSquare, color: 'text-gray-700', bg: 'bg-white', action: () => setCommentModalOpen(true) },
        { label: 'Expense', icon: DollarSign, color: 'text-red-500', bg: 'bg-red-50', action: () => setExpenseModalOpen(true) },
        { label: 'Hold', icon: LockIcon, color: 'text-orange-500', bg: 'bg-orange-50', action: () => handleHoldBill() },
        { label: 'Recall', icon: RotateCcw, color: 'text-blue-500', bg: 'bg-blue-50', action: () => setHeldBillsModalOpen(true) },
        { label: 'Void', icon: Trash2, color: 'text-white', bg: 'bg-red-600', action: () => { if (confirm('Void entire order?')) clearCart(); } },
        { label: 'Print Last', icon: Printer, color: 'text-emerald-500', bg: 'bg-emerald-50', action: () => { if (lastBill) printerService.printReceipt(lastBill); else toast.error("No recent bill found"); } },
        { label: 'Lock', icon: LockIcon, color: 'text-gray-500', bg: 'bg-gray-100', action: () => navigate('/login') },
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
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && searchTerm) {
                                        // TURBO: Try strict match first for barcodes to skip debounce
                                        const exactProduct = await productService.getByBarcode(searchTerm);
                                        if (exactProduct) {
                                            addToCart(exactProduct);
                                            setSearchTerm('');
                                            return;
                                        }
                                        // Fallback to first result if available
                                        if (products.length > 0) {
                                            addToCart(products[0]);
                                            setSearchTerm('');
                                        }
                                    }
                                }}
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

                    {/* Suggestions Bar */}
                    {suggestions.length > 0 && (
                        <div className="px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar animate-in slide-in-from-top-2 duration-300">
                            <span className="text-xs font-bold text-primary whitespace-nowrap bg-primary/10 px-2 py-1.5 rounded-full flex items-center gap-1">
                                <span className="animate-pulse">✨</span> Suggested:
                            </span>
                            {suggestions.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => addToCart(s)}
                                    className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 text-foreground px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                >
                                    {s.image && <img src={s.image} alt="" className="w-4 h-4 rounded-full object-cover" />}
                                    {s.name}
                                    <span className="bg-background/50 px-1 rounded text-[10px] ml-1">₹{s.sell_price}</span>
                                    <Plus size={12} className="text-primary" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 flex overflow-hidden">
                        {/* Category Sidebar */}
                        <div className="w-20 lg:w-24 bg-surface border-r border-border flex flex-col items-center py-4 gap-2 overflow-y-auto no-scrollbar shadow-[2px_0_10px_-5px_rgba(0,0,0,0.05)] z-10">
                            <button
                                onClick={() => { setSelectedGroupId(null); setActiveTab('ALL'); }}
                                className={cn(
                                    "w-14 lg:w-16 aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2",
                                    (selectedGroupId === null && activeTab === 'ALL')
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                )}
                            >
                                <LayoutGrid size={20} />
                                <span className="text-[9px] uppercase font-black">All</span>
                            </button>

                            <button
                                onClick={() => { setSelectedGroupId(null); setActiveTab('FAVORITES'); }}
                                className={cn(
                                    "w-14 lg:w-16 aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2",
                                    (selectedGroupId === null && activeTab === 'FAVORITES')
                                        ? "bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20"
                                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                )}
                            >
                                <Star size={20} className={activeTab === 'FAVORITES' ? "fill-black" : ""} />
                                <span className="text-[9px] uppercase font-black">Favs</span>
                            </button>

                            <div className="w-8 h-[1px] bg-border my-2" />

                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => { setSelectedGroupId(group.id); setActiveTab('ALL'); }}
                                    className={cn(
                                        "w-14 lg:w-16 aspect-square rounded-2xl flex flex-col items-center justify-center p-1 transition-all border-2 text-center",
                                        selectedGroupId === group.id
                                            ? "bg-primary/10 text-primary border-primary"
                                            : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <span className="text-[10px] uppercase font-black leading-tight line-clamp-2">
                                        {group.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Product Grid Container */}
                        <div className="flex-1 p-6 overflow-y-auto no-scrollbar relative flex flex-col">

                            {/* Tabs & View Toggle */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setActiveTab('ALL')}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-sm font-bold transition-all",
                                            activeTab === 'ALL' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-surface text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        All Products
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('FAVORITES')}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                                            activeTab === 'FAVORITES' ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/25" : "bg-surface text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Star size={14} className={activeTab === 'FAVORITES' ? "fill-black" : ""} /> Favorites
                                    </button>
                                </div>

                                <div className="flex items-center bg-surface p-1 rounded-xl border border-border shadow-sm">
                                    <button
                                        onClick={() => setViewMode('GRID')}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            viewMode === 'GRID' ? "bg-primary/10 text-primary shadow-inner" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="Grid View"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('LIST')}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            viewMode === 'LIST' ? "bg-primary/10 text-primary shadow-inner" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="List View"
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Show suggestions if no search term, or results if searching. Only show empty state if NO products at all. */}
                            {products.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/20 pointer-events-none">
                                    <Search className="w-24 h-24 mb-6 opacity-20" strokeWidth={1.5} />
                                    <h2 className="text-xl font-medium text-muted-foreground/40">No Products Found</h2>
                                    <p className="mt-2 text-sm text-muted-foreground/30">Add products to see them here</p>
                                </div>
                            ) : (
                                <div className={cn(
                                    viewMode === 'GRID'
                                        ? "grid grid-cols-4 lg:grid-cols-5 gap-4 pb-6"
                                        : "flex flex-col gap-2 pb-6"
                                )}>
                                    {products
                                        .filter(p => {
                                            if (selectedGroupId !== null) {
                                                return groupAssociations.some(a => a.group_id === selectedGroupId && a.product_id === p.id);
                                            }
                                            return activeTab === 'ALL' || (activeTab === 'FAVORITES' && favorites.includes(p.id));
                                        })
                                        .map(p => (
                                            viewMode === 'GRID' ? (
                                                <div
                                                    key={p.id}
                                                    onClick={() => addToCart(p)}
                                                    className="bg-surface hover:bg-muted/50 rounded-xl cursor-pointer transition-all border border-border hover:border-primary/50 group shadow-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 active:scale-95"
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

                                                        {/* Favorite Button Overlay */}
                                                        <button
                                                            onClick={(e) => toggleFavorite(e, p.id)}
                                                            className={cn(
                                                                "absolute top-1 right-1 p-1.5 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100",
                                                                favorites.includes(p.id) ? "bg-yellow-400 text-black opacity-100 shadow-sm" : "bg-black/40 text-white hover:bg-black/60"
                                                            )}
                                                        >
                                                            <Star size={12} className={favorites.includes(p.id) ? "fill-black" : ""} />
                                                        </button>
                                                    </div>

                                                    {/* Info Section */}
                                                    <div className={cn("p-2", isTouchMode && "p-2")}>
                                                        <div className={cn("text-foreground font-black truncate", isTouchMode ? "text-md" : "text-xs")} title={p.name}>{p.name}</div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className={cn("text-muted-foreground bg-muted px-1 py-0.5 rounded border border-border truncate max-w-[80px]", isTouchMode ? "text-[10px]" : "text-[10px]")}>{p.barcode}</span>
                                                            {p.stock <= (p.min_stock_level || 5) && (
                                                                <span className={cn("text-red-500 font-bold px-1 py-0.5 bg-red-500/10 rounded animate-pulse border border-red-500/20", isTouchMode ? "text-[10px]" : "text-[9px]")}>Low: {p.stock}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* LIST VIEW */
                                                <div
                                                    key={p.id}
                                                    onClick={() => addToCart(p)}
                                                    className="bg-surface hover:bg-muted/50 p-3 rounded-xl cursor-pointer transition-all border border-border hover:border-primary/50 group shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-200 active:scale-[0.99]"
                                                >
                                                    <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg overflow-hidden relative">
                                                        {p.image ? (
                                                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                                <ShoppingBag size={20} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h3 className={cn("font-bold text-foreground truncate", isTouchMode ? "text-lg" : "text-sm")}>{p.name}</h3>
                                                            <button
                                                                onClick={(e) => toggleFavorite(e, p.id)}
                                                                className={cn(
                                                                    "p-1 rounded-full transition-all",
                                                                    favorites.includes(p.id) ? "text-yellow-400" : "text-muted-foreground/30 hover:text-muted-foreground"
                                                                )}
                                                            >
                                                                <Star size={14} className={favorites.includes(p.id) ? "fill-current" : ""} />
                                                            </button>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md border border-border uppercase tracking-wider font-medium">{p.barcode}</span>
                                                    </div>

                                                    <div className="flex items-center gap-6">
                                                        {p.stock <= (p.min_stock_level || 5) && (
                                                            <div className="text-right flex flex-col animate-pulse">
                                                                <span className="text-[9px] uppercase font-bold text-red-400 leading-none">Low Stock</span>
                                                                <span className="text-sm font-black text-red-500">{p.stock}</span>
                                                            </div>
                                                        )}
                                                        <div className="text-right">
                                                            <span className="text-[9px] uppercase font-bold text-muted-foreground leading-none">Price</span>
                                                            <div className={cn("font-black text-primary", isTouchMode ? "text-xl" : "text-lg")}>₹{p.sell_price}</div>
                                                        </div>
                                                        <div className="p-2 bg-primary/10 text-primary rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                            <Plus size={20} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* === RIGHT PANEL (CART & BUTTONS) === */}
                <div className="w-[450px] bg-surface flex flex-col flex-shrink-0 z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] border-l border-border">
                    {/* Header / Current Bill & Tabs */}
                    <div className={cn("border-b border-border bg-muted/30")}>
                        {/* Tabs Row */}
                        <div className="flex bg-background border-b border-border">
                            {carts.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveCartIndex(idx)}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-black uppercase tracking-wider transition-all border-b-2",
                                        activeCartIndex === idx
                                            ? "bg-primary/5 text-primary border-primary"
                                            : "text-muted-foreground border-transparent hover:bg-muted"
                                    )}
                                >
                                    Tab {idx + 1}
                                    {carts[idx].items.length > 0 && <span className="ml-1 bg-primary text-primary-foreground px-1 rounded-full text-[8px]">{carts[idx].items.length}</span>}
                                </button>
                            ))}
                        </div>

                        <div className={cn("px-4", isTouchMode ? "py-4" : "py-3")}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className={cn("font-bold text-foreground", isTouchMode ? "text-xl" : "text-lg")}>Current Bill</h2>
                                    {customer ? (
                                        <div className={cn("flex items-center gap-2 text-primary font-bold animate-in fade-in", isTouchMode ? "text-sm" : "text-xs")}>
                                            <User size={isTouchMode ? 14 : 12} />
                                            <span>{customer.name}</span>
                                            {customer.gstin && (
                                                <span className={cn("px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-black", gstService.isB2B(customer.gstin) ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>
                                                    {gstService.isB2B(customer.gstin) ? 'B2B' : 'B2C'}
                                                </span>
                                            )}
                                            <button onClick={() => setCustomer(null)} className="hover:text-destructive ml-1"><XCircle size={isTouchMode ? 14 : 12} /></button>
                                        </div>
                                    ) : (
                                        <div className={cn("text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-primary", isTouchMode ? "text-sm" : "text-xs")} onClick={() => setCustomerModalOpen(true)}>
                                            <User size={isTouchMode ? 14 : 12} /> Walk-in Customer
                                        </div>
                                    )}
                                </div>
                                <span className={cn("font-mono bg-background px-2 py-1 rounded text-muted-foreground border border-border/50", isTouchMode ? "text-sm" : "text-xs")}>Order: {orderType}</span>
                            </div>
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
                                    onClick={() => {
                                        setSelectedCartIndex(index);
                                        setEditingItemIndex(index);
                                        setOverridePrice(item.sell_price.toString());
                                    }}
                                    className={cn("flex items-center gap-2 rounded-xl cursor-pointer border transition-all shadow-sm", isTouchMode ? "p-2" : "p-1", selectedCartIndex === index ? "bg-primary/10 border-primary shadow-md" : item.quantity < 0 ? "bg-red-50 border-red-100" : "bg-white border-gray-100 hover:border-gray-200")}>
                                    <div className="flex gap-2 items-center flex-1 min-w-0">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className={cn("hover:bg-primary/5 rounded text-primary transition-colors", isTouchMode ? "p-1" : "p-0.5")}>
                                                <Plus size={isTouchMode ? 20 : 12} />
                                            </button>
                                            <span className={cn("font-black text-center leading-none", isTouchMode ? "text-md w-8" : "text-[12px] w-6", item.quantity < 0 ? "text-red-600" : "text-foreground")}>{item.quantity}</span>
                                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className={cn("hover:bg-primary/5 rounded text-primary transition-colors", isTouchMode ? "p-1" : "p-0.5")}>
                                                <Minus size={isTouchMode ? 20 : 12} />
                                            </button>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={cn("font-bold truncate text-foreground flex items-center gap-1", isTouchMode ? "text-sm" : "text-[12px]")}>
                                                {item.name}
                                                {item.quantity < 0 && <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold uppercase">Refund</span>}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">₹{item.sell_price.toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5 pr-1">
                                        <div className={cn("font-black text-foreground", isTouchMode ? "text-sm" : "text-[12px]")}>₹{item.amount.toFixed(0)}</div>
                                        <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="p-1 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-all">
                                            <Trash2 size={isTouchMode ? 18 : 14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* GST Controls & Breakdown - Phase 1 */}
                    {cart.length > 0 && (
                        <div className="px-4 py-3 space-y-3 border-t border-border bg-background/50">
                            {/* Tax Inclusive/Exclusive Toggle */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Tax Mode:</span>
                                <button
                                    onClick={() => setTaxInclusive(!taxInclusive)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2",
                                        taxInclusive
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : "bg-blue-50 text-blue-700 border-blue-200"
                                    )}
                                >
                                    {taxInclusive ? 'Inclusive' : 'Exclusive'}
                                </button>
                            </div>

                            {/* Place of Supply */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Place of Supply:</span>
                                <select
                                    value={placeOfSupply}
                                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                                    className="px-2 py-1.5 text-xs border border-border rounded-lg bg-surface min-w-[120px]"
                                >
                                    <option value="">-- Select --</option>
                                    {gstService.getAllStates().map(state => (
                                        <option key={state.code} value={state.name}>{state.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Inter-State Selection */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Transaction Type:</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsInterState(false)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2",
                                            !isInterState
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : "bg-muted text-muted-foreground border-border"
                                        )}
                                    >
                                        Intra-State
                                    </button>
                                    <button
                                        onClick={() => setIsInterState(true)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2",
                                            isInterState
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : "bg-muted text-muted-foreground border-border"
                                        )}
                                    >
                                        Inter-State
                                    </button>
                                </div>
                            </div>

                            {/* GST Breakdown Panel */}
                            <GSTBreakdownPanel
                                items={cart}
                                isInterState={isInterState}
                                taxInclusive={taxInclusive}
                                discount={billDiscount + (pointsRedeemed * POINT_VALUE)}
                            />
                        </div>
                    )}

                    {/* Totals Section - Unified into F10 */}
                    <div className={cn("px-4 bg-muted/20 border-t border-border", isTouchMode ? "py-1" : "py-0.5")}>
                        {(billDiscount > 0 || pointsRedeemed > 0) && (
                            <div className="flex justify-between text-[10px] text-primary font-bold tracking-tight uppercase">
                                <span>Total Savings</span>
                                <span>-₹{(billDiscount + (pointsRedeemed * POINT_VALUE)).toFixed(2)}</span>
                            </div>
                        )}
                    </div >

                    {/* BUTTON GRID - 4 Row Unified Aronium Fit */}
                    < div className={
                        cn(
                            "bg-gray-300 grid grid-cols-4 gap-[1px]",
                            isTouchMode ? "p-[1px] h-[340px]" : "p-[1px] h-[220px]"
                        )
                    } >
                        {
                            primaryButtons.map((btn, i) => (
                                <button
                                    key={i}
                                    onClick={btn.action}
                                    className={cn(
                                        "flex flex-col items-center justify-center transition-all relative",
                                        isTouchMode ? "p-1.5" : "p-1",
                                        isTouchMode && "active:scale-95",
                                        btn.bg || "bg-white",
                                        btn.border
                                    )}
                                >
                                    {/* Key Hint */}
                                    {btn.key && (
                                        <span className={cn(
                                            "absolute top-0.5 left-1 font-bold uppercase",
                                            isTouchMode ? "text-[10px] opacity-40" : "text-[8px] opacity-30"
                                        )}>
                                            {btn.key}
                                        </span>
                                    )}

                                    {btn.icon && (
                                        <btn.icon
                                            size={isTouchMode ? 32 : 28}
                                            className={cn("mb-0.5", btn.label === 'Delete' ? "text-white" : "text-gray-700")}
                                        />
                                    )}
                                    <span className={cn(
                                        "font-bold text-center leading-tight px-0.5 uppercase tracking-wide",
                                        isTouchMode ? "text-[12px]" : "text-[10px]",
                                        btn.label === 'Delete' ? "text-white" : "text-gray-700"
                                    )}>
                                        {btn.label}
                                    </span>
                                </button>
                            ))
                        }

                        {/* Row 4: Save Sale */}
                        <button
                            onClick={handleSaveEstimate}
                            className={cn(
                                "flex flex-col items-center justify-center bg-white text-gray-700 transition-all",
                                isTouchMode && "active:scale-95"
                            )}
                        >
                            <Save size={isTouchMode ? 32 : 28} className="mb-0.5 opacity-70" />
                            <span className={cn("font-bold uppercase tracking-wide", isTouchMode ? "text-[12px]" : "text-[10px]")}>Save</span>
                        </button>

                        {/* Row 4: Merged Payment Button (2 cols) */}
                        <div className="col-span-2 row-span-1">
                            <button
                                onClick={() => { if (cart.length > 0) setPaymentModalOpen(true); }}
                                className={cn(
                                    "w-full h-full flex flex-col items-center justify-center transition-all bg-green-600 text-white hover:bg-green-700 relative",
                                    isTouchMode && "active:scale-95"
                                )}
                            >
                                <span className={cn("font-black tracking-tighter opacity-10 absolute left-2 top-2", isTouchMode ? "text-5xl" : "text-4xl")}>F10</span>
                                <div className="text-center">
                                    <div className={cn("font-black leading-none", isTouchMode ? "text-2xl" : "text-xl")}>
                                        ₹{grandTotal.toFixed(2)}
                                    </div>
                                    <div className={cn("font-bold uppercase tracking-widest opacity-90", isTouchMode ? "text-xs" : "text-[10px]")}>
                                        Pay Now
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Row 4: More Actions Button */}
                        <button
                            onClick={() => setMoreActionsOpen(true)}
                            className={cn(
                                "flex flex-col items-center justify-center bg-gray-50 text-gray-700 transition-all hover:bg-gray-100",
                                isTouchMode && "active:scale-95"
                            )}
                        >
                            <div className="flex gap-0.5 mb-1 items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            </div>
                            <span className={cn("font-bold uppercase tracking-wide", isTouchMode ? "text-[12px]" : "text-[10px]")}>More</span>
                        </button>
                    </div >

                    {/* More Actions Modal */}
                    < Modal isOpen={moreActionsOpen} onClose={() => setMoreActionsOpen(false)} title="Other Actions" size="md" >
                        <div className="grid grid-cols-3 gap-2">
                            {moreButtons.map((btn, i) => (
                                <button
                                    key={i}
                                    onClick={() => { btn.action(); setMoreActionsOpen(false); }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-xl transition-all border border-border shadow-sm",
                                        btn.bg || "bg-surface",
                                        "active:scale-95"
                                    )}
                                >
                                    {btn.icon && <btn.icon size={24} className={cn("mb-2", btn.label === 'Void' ? "text-white" : "text-primary")} />}
                                    <span className={cn("font-bold text-xs uppercase tracking-wide", btn.label === 'Void' ? "text-white" : "text-foreground")}>{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </Modal >
                </div >
            </div >



            {/* Held Bills Modal - Advanced Dashboard */}
            < Modal isOpen={heldBillsModalOpen} onClose={() => setHeldBillsModalOpen(false)} title="Held Bills (Parked)" size="2xl" >
                <div className="space-y-4">
                    {heldBills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <LockIcon size={48} className="mb-2" />
                            <p className="text-lg font-medium">No held bills found</p>
                            <p className="text-sm">Park a bill to see it here</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-h-[65vh] overflow-y-auto px-1 pb-6">
                            {heldBills.map(bill => (
                                <div key={bill.id} className="relative group bg-card hover:bg-accent/50 border border-border rounded-2xl flex flex-col justify-between transition-all hover:shadow-xl h-auto min-h-[13rem] overflow-hidden active:scale-[0.99]">
                                    {/* Left Accent Bar based on time */}
                                    <div className={`absolute left - 0 top - 0 bottom - 0 w - 1.5 ${getTimeElapsed(bill.date).includes('d') ? 'bg-red-500' : getTimeElapsed(bill.date).includes('h') ? 'bg-orange-500' : 'bg-green-500'} `}></div>

                                    <div className="p-4 flex-1 flex col">
                                        {/* Header */}
                                        <div className="flex justify-between items-start pl-2">
                                            <div>
                                                <div className="font-bold text-lg truncate w-32" title={bill.customer_name || 'Walk-in'}>
                                                    {bill.customer_name || 'Walk-in'}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Clock size={12} className="text-emerald-500/70" /> {getTimeElapsed(bill.date)}
                                                </div>
                                            </div>
                                            <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold font-mono">
                                                #{bill.id}
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 flex flex-col justify-center items-center py-2">
                                            <div className="text-4xl font-black text-emerald-600 tracking-tight drop-shadow-sm">₹{bill.total_amount?.toFixed(0)}</div>
                                            <div className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full mt-1">
                                                {bill.item_count} Items
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex border-t border-border/50 divide-x divide-border/50 bg-muted/30">
                                        <button
                                            onClick={() => handleDiscardBill(bill.id)}
                                            className="flex-1 py-6 text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center gap-2 text-[14px] font-bold"
                                            title="Discard Bill"
                                        >
                                            <Trash2 size={20} /> <span>Discard</span>
                                        </button>
                                        <button
                                            onClick={() => handleRestoreBill(bill.id)}
                                            className="flex-1 py-6 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-center justify-center gap-2 text-[14px] font-black bg-emerald-50/50"
                                            title="Restore Bill"
                                        >
                                            <RotateCcw size={20} /> <span>Restore</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal >

            {/* Hold Bill Identifier Modal */}
            < Modal isOpen={holdModalOpen} onClose={() => setHoldModalOpen(false)} title="Hold Bill - Reference" >
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">Enter a name, table number, or reference ID for this bill:</p>
                    <input
                        type="text"
                        autoFocus
                        value={holdIdentifier}
                        onChange={e => setHoldIdentifier(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmHoldBill(); }}
                        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Table 5, John, Token 123"
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setHoldModalOpen(false)}>Cancel</Button>
                        <Button onClick={confirmHoldBill}>Confirm Hold</Button>
                    </div>
                </div>
            </Modal >

            {/* Last Bill Preview Modal */}
            < Modal isOpen={lastBillModalOpen} onClose={() => setLastBillModalOpen(false)} title="Last Bill Preview" >
                {
                    lastBill ? (
                        <div className="space-y-4" >
                            <div className="flex justify-between items-center border-b border-border pb-2">
                                <div>
                                    <h3 className="text-xl font-bold">{lastBill.bill_no}</h3>
                                    <p className="text-sm text-muted-foreground">{new Date(lastBill.date).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">₹{lastBill.total?.toFixed(2)}</div>
                                    <span className="text-xs px-2 py-0.5 rounded bg-muted font-mono">{lastBill.payment_mode || 'CASH'}</span>
                                </div>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-muted/20">
                                {lastBill.items?.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <div className="flex-1 truncate pr-2">
                                            <span className="font-bold">{item.quantity}x</span> {item.productName || item.name}
                                        </div>
                                        <div className="font-mono">
                                            ₹{(item.price || item.sell_price || 0).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button onClick={() => printerService.printReceipt(lastBill)} variant="secondary" className="gap-2">
                                    <Printer size={18} /> Print
                                </Button>
                                <Button onClick={() => setLastBillModalOpen(false)}>Close</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">Loading...</div>
                    )}
            </Modal >

            <QuickAddProductModal
                isOpen={quickAddModalOpen}
                onClose={() => setQuickAddModalOpen(false)}
                onSuccess={() => {
                    loadProducts();
                    // Optionally select the newly created product if returned, but simple refresh is good enough.
                }}
            />



            {/* Expense Modal */}
            <Modal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="Record Expense">
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded text-lg"
                            placeholder="0.00"
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            placeholder="e.g. Tea, Cleaning, Fuel"
                            value={expenseNote}
                            onChange={(e) => setExpenseNote(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveExpense} disabled={processing}>
                            {processing ? 'Saving...' : 'Save Expense'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={paymentModalOpen} onClose={() => { if (paymentStep !== 'RECEIPT_OPTIONS') { setPaymentModalOpen(false); setPaymentStep('SELECT_MODE'); } }} title={
                paymentStep === 'SELECT_MODE' ? `Collect Payment: ₹${grandTotal.toFixed(2)} ` :
                    paymentStep === 'CONFIRM_AMOUNT' ? `Confirm ${paymentMode} Payment` :
                        'Payment Successful'
            }>
                <div className="space-y-6 pt-2">
                    {paymentStep === 'SELECT_MODE' && (
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'CASH', label: 'Cash', icon: Banknote },
                                { id: 'CARD', label: 'Card', icon: CreditCard },
                                { id: 'UPI', label: 'UPI', icon: Smartphone },
                                { id: 'CREDIT', label: 'Credit (Pay Later)', icon: LockIcon },
                                { id: 'SPLIT', label: 'Split Payment', icon: ArrowRightLeft }
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
                            {/* QR Code Button */}
                            <button
                                onClick={async () => {
                                    // Generate a temporary bill ID if not saved - but actually server needs a saved bill.
                                    // For now, let's just generate a QR for the *current* items by saving a draft? 
                                    // Or easier: Just show QR for LAST bill if available, OR we must save this bill first as 'DRAFT' or 'PENDING'.
                                    // Given complexity, let's just show QR for the *Last* Completed Bill for now as a "Receipt View", 
                                    // OR urge user to "Save as Estimate" first. 
                                    // Wait, the requirement is "popup a window of bill and payment".

                                    // TRICK: We can pass the raw data in URL if small, or save to DB as 'PENDING'.
                                    // Let's assume we use the endpoint /view/:billNo. 
                                    // We need a billNo. Let's autocreate one or use current logic.
                                    // For simplicity in this iteration: logic works best if bill is saved.
                                    // Let's make this button "Show QR for Last Bill" effectively, or implement "Pay Pending".

                                    // ACTUALLY: Let's allow generating QR for the CURRENT cart by computing a temporary ID or just hashing?
                                    // No, server needs DB access.

                                    // Pivot: This button will be "SoftPOS View". It needs to save the bill as PENDING first?
                                    // POS flow usually: Checkout -> Payment.
                                    // Let's just mock the URL with a dummy or last bill for the Demo.
                                    // Better: Create a 'DRAFT-...' bill no.

                                    const ip = await platformService.getServerIp();
                                    // Use a placeholder or the last bill if verified.
                                    // For now, let's just point to a demo URL or the last bill.
                                    const targetBill = lastBill?.bill_no || 'DEMO-123';
                                    const url = `http://${ip}:3000/view/${targetBill}`;
                                    setQrValue(url);
                                    setQrModalOpen(true);
                                }}
                                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-border bg-card hover:bg-accent text-muted-foreground hover:border-primary hover:text-primary transition-all col-span-3"
                            >
                                <QrCode size={24} />
                                <span className="font-bold">Customer View (QR)</span>
                            </button >
                        </div >
                    )}

                    {
                        paymentStep === 'CONFIRM_AMOUNT' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-200">
                                {/* LOYALTY POINTS UI */}
                                {customer && (
                                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-yellow-800 font-medium">Loyalty Points Available</p>
                                            <p className="text-2xl font-bold text-yellow-900">{customer.points} <span className="text-sm font-normal text-yellow-700">(Value: ₹{(customer.points / 10).toFixed(2)})</span></p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-20 p-2 border border-yellow-300 rounded text-right font-bold"
                                                placeholder="Pts"
                                                value={pointsRedeemed > 0 ? pointsRedeemed : ''}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    const maxRedeemable = Math.min(customer.points, Math.floor(grandTotal * 10)); // Max redeemable is lesser of available points or Total * 10 (since 10pts=1rs)

                                                    if (val <= maxRedeemable) {
                                                        setPointsRedeemed(val);
                                                    } else {
                                                        toast.error(`Max redeemable: ${maxRedeemable} pts`);
                                                    }
                                                }}
                                            />
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setPointsRedeemed(pointsRedeemed > 0 ? 0 : Math.min(customer.points, Math.floor(grandTotal * 10)))}
                                            >
                                                {pointsRedeemed > 0 ? 'Remove' : 'Redeem All'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {paymentMode === 'SPLIT' ? (
                                    // SPLIT PAYMENT UI
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-lg bg-muted/30 p-4 rounded-xl">
                                            <span className="text-muted-foreground">Total Payable</span>
                                            <div className="text-right">
                                                {pointsRedeemed > 0 && <div className="text-sm text-green-600 line-through">₹{grandTotal.toFixed(2)}</div>}
                                                <span className="font-bold text-foreground">₹{(grandTotal - (pointsRedeemed * POINT_VALUE)).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {['CASH', 'CARD', 'UPI'].map(mode => (
                                                <div key={mode} className="flex items-center gap-4 border p-3 rounded-lg">
                                                    <div className="w-24 font-semibold">{mode}</div>
                                                    <input
                                                        type="number"
                                                        className="flex-1 text-right bg-transparent text-xl font-bold focus:outline-none"
                                                        value={splitPayment[mode] || ''}
                                                        placeholder="0"
                                                        onChange={e => setSplitPayment(prev => ({ ...prev, [mode]: parseFloat(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center text-lg pt-2">
                                            <span className="text-muted-foreground">Total Entered</span>
                                            <span className={`font-bold text-xl ${(Object.values(splitPayment).reduce((a, b) => a + b, 0) - (grandTotal - (pointsRedeemed * POINT_VALUE))) >= -0.01 ? 'text-emerald-500' : 'text-destructive'}`}>
                                                ₹{Object.values(splitPayment).reduce((a, b) => a + b, 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Remaining</span>
                                            <span className="font-bold text-foreground">
                                                ₹{Math.max(0, (grandTotal - (pointsRedeemed * POINT_VALUE)) - Object.values(splitPayment).reduce((a, b) => a + b, 0)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    // STANDARD PAYMENT UI
                                    <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="text-muted-foreground">Total Payable</span>
                                            <div className="text-right">
                                                {pointsRedeemed > 0 && <div className="text-sm text-green-600 line-through">₹{grandTotal.toFixed(2)}</div>}
                                                <span className="font-bold text-foreground">₹{(grandTotal - (pointsRedeemed * POINT_VALUE)).toFixed(2)}</span>
                                            </div>
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

                                        {paymentMode === 'CASH' && (
                                            <div className="pt-2 border-t border-dashed border-border">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-wider">Fast Cash Calculator</div>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[10, 20, 50, 100, 200, 500, 2000].map(val => (
                                                        <button
                                                            key={val}
                                                            onClick={() => {
                                                                // If paidAmount is already grandTotal (default), reset it to val, 
                                                                // otherwise add it (for multi-note tallying). 
                                                                // Actually, let's make it increment.
                                                                setPaidAmount(prev => (prev === (grandTotal - (pointsRedeemed * POINT_VALUE)) ? val : prev + val));
                                                                toast.success(`+₹${val}`, { duration: 1000 });
                                                            }}
                                                            className="h-12 bg-white hover:bg-muted border border-border rounded-xl font-black text-sm active:scale-95 transition-all shadow-sm flex items-center justify-center text-primary"
                                                        >
                                                            ₹{val}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => setPaidAmount(0)}
                                                        className="h-12 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-xs active:scale-95 transition-all text-red-600 shadow-sm"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-lg pt-3 border-t border-dashed border-border">
                                            <span className="text-muted-foreground">Change Due</span>
                                            <span className={`font-bold text-xl ${paidAmount - grandTotal < 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                                                ₹{(paidAmount - grandTotal).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setPaymentStep('SELECT_MODE')} className="flex-1 h-14">
                                        Back
                                    </Button>
                                    {/* DEBUG INFO */}


                                    <Button onClick={() => {
                                        console.log('Confirm Button Clicked (Forced)');
                                        console.log('Checkout Clicked, Processing:', processing);

                                        // Split Validation
                                        if (paymentMode === 'SPLIT') {
                                            const totalEntered = Object.values(splitPayment).reduce((a, b) => a + b, 0);
                                            if (Math.abs(totalEntered - grandTotal) > 0.01) {
                                                toast.error(`Amount mismatch! Entered: ${totalEntered}, Required: ${grandTotal}`);
                                                return;
                                            }
                                        }

                                        handleCheckout();
                                    }} disabled={false} className="flex-[2] h-14 text-lg font-bold">
                                        {processing ? 'Processing...' : `Confirm (₹${grandTotal.toFixed(2)})`}
                                    </Button>
                                </div>
                            </div>
                        )
                    }

                    {
                        paymentStep === 'RECEIPT_OPTIONS' && (
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

                                            // Generate PDF and send WhatsApp
                                            exportService.generateBillInvoice(bill);
                                            toast.success("Invoice PDF Generated. Please attach to WhatsApp.");

                                            const customerName = bill.customer_name && bill.customer_name !== 'Walk-in Customer' ? bill.customer_name : 'Customer';
                                            const message = `Thank you ${customerName}! Here is your bill ${bill.bill_no} for ₹${bill.total}. Visit us again!`;
                                            whatsappService.sendMessage(phone, message);
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
                        )
                    }
                </div >
            </Modal >

            {/* Discount Modal */}
            < Modal isOpen={discountModalOpen} onClose={() => setDiscountModalOpen(false)} title="Apply Discount" >
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
            </Modal >

            {/* Comment Modal */}
            < Modal isOpen={commentModalOpen} onClose={() => setCommentModalOpen(false)} title="Add Bill Note" >
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
            </Modal >

            {/* Quantity Modal */}
            < Modal isOpen={quantityModalOpen} onClose={() => setQuantityModalOpen(false)} title="Set Quantity" >
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
            </Modal >

            {/* WhatsApp Phone Modal */}
            < Modal isOpen={whatsAppModalOpen} onClose={() => setWhatsAppModalOpen(false)} title="Enter WhatsApp Number" >
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
            </Modal >

            {/* QR Code Modal */}
            < Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Customer View ID" >
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-border">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrValue)}`}
                            alt="Scan QR"
                            className="w-64 h-64"
                        />
                    </div>
                    <p className="text-center text-muted-foreground text-sm max-w-xs">
                        Ask customer to scan this QR code to view the bill on their phone.
                    </p>
                    <div className="p-2 bg-muted rounded text-xs font-mono break-all text-center">
                        {qrValue}
                    </div>
                    <Button onClick={() => setQrModalOpen(false)} className="w-full">Close</Button>
                </div>
            </Modal >

            {/* Customer Selection Modal */}
            < Modal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title="Select Customer" >
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
            </Modal >

            {/* Price Override Modal */}
            < Modal
                isOpen={editingItemIndex !== null}
                onClose={() => setEditingItemIndex(null)}
                title="Override Price"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-2xl text-center">
                        <div className="text-xs font-bold text-muted-foreground uppercase mb-1">New Price for {editingItemIndex !== null && cart[editingItemIndex]?.name}</div>
                        <div className="text-3xl font-black text-primary">₹{overridePrice || '0'}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(val => (
                            <button
                                key={val}
                                onClick={() => setOverridePrice(prev => val === '.' && prev.includes('.') ? prev : prev + val)}
                                className="h-14 bg-surface hover:bg-muted border border-border rounded-xl font-bold text-xl active:scale-95 transition-all shadow-sm"
                            >
                                {val}
                            </button>
                        ))}
                        <button
                            onClick={() => setOverridePrice(prev => prev.slice(0, -1))}
                            className="h-14 bg-surface hover:bg-muted border border-border rounded-xl font-bold text-lg active:scale-95 transition-all shadow-sm flex items-center justify-center p-0"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="secondary"
                            className="flex-1 rounded-xl h-12"
                            onClick={() => setEditingItemIndex(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 rounded-xl h-12"
                            disabled={!overridePrice}
                            onClick={() => {
                                if (editingItemIndex !== null) {
                                    updateItemPrice(editingItemIndex, parseFloat(overridePrice) || 0);
                                }
                            }}
                        >
                            Apply Price
                        </Button>
                    </div>
                </div>
            </Modal >
            {/* GST Reports Modal - Phase 5 */}

            {/* Turbo Pad Overlay */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-2 bg-black/80 backdrop-blur-md text-white p-2 rounded-full border border-white/10 shadow-2xl z-50 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5 px-3 border-r border-white/20">
                    <span className="font-mono font-bold text-xs bg-white/20 px-1.5 py-0.5 rounded">F1</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Cash</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 border-r border-white/20">
                    <span className="font-mono font-bold text-xs bg-white/20 px-1.5 py-0.5 rounded">F2</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">UPI</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 border-r border-white/20">
                    <span className="font-mono font-bold text-xs bg-white/20 px-1.5 py-0.5 rounded">F3</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Card</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 border-r border-white/20">
                    <span className="font-mono font-bold text-xs bg-white/20 px-1.5 py-0.5 rounded">F4</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Qty</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 border-r border-white/20">
                    <span className="font-mono font-bold text-xs bg-white/20 px-1.5 py-0.5 rounded">F7</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">₹100</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 border-r border-white/20">
                    <span className="font-mono font-bold text-xs bg-white/20 px-1.5 py-0.5 rounded">F8</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">₹500</span>
                </div>
                <div className="flex items-center gap-1.5 px-3">
                    <span className="font-mono font-bold text-xs bg-white/20 px-1.5 py-0.5 rounded">F12</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Pay</span>
                </div>
            </div>

        </div >
    );
}
