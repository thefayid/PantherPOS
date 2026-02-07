import { eventBus } from '../utils/EventBus';
import type { Product } from '../types/db';

export interface CartItem extends Product {
    quantity: number;
    amount: number;
}

class CartService {
    private items: CartItem[] = [];
    private readonly STORAGE_KEY = 'pos_cart_state';

    constructor() {
        this.load();
    }

    private load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.items = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load cart', e);
        }
    }

    private save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
            // Emit update so UI can refresh
            eventBus.emit('CART_UPDATED', this.items);
        } catch (e) {
            console.error('Failed to save cart', e);
        }
    }

    public getCart(): CartItem[] {
        return this.items;
    }

    public addItem(product: Product, quantity: number = 1) {
        console.log('[cartService] Adding Item:', product.id, quantity);
        const existing = this.items.find(p => p.id === product.id);
        if (existing) {
            this.items = this.items.map(p => p.id === product.id
                ? { ...p, quantity: p.quantity + quantity, amount: (p.quantity + quantity) * p.sell_price }
                : p
            );
        } else {
            this.items = [...this.items, { ...product, quantity, amount: product.sell_price * quantity }];
        }
        console.log('[cartService] Cart Value Now:', this.items);
        this.save();
    }

    public removeItem(productId: number) {
        this.items = this.items.filter(item => item.id !== productId);
        this.save();
    }

    public updateQuantity(productId: number, delta: number) {
        this.items = this.items.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty === 0) return item; // or remove? currently existing logic kept > 0. Let's allow negative but skip 0? 
                // Actually returning 0 might be desired to remove, but removeItem handles that.
                // For refund, -1 + (-1) = -2. -1 + 1 = 0.
                if (Math.abs(newQty) < 0.001) return item; // Prevent 0 usually, but allow negative.
                // simple round to 3 decimal places to avoid float errors
                const roundedQty = Math.round(newQty * 1000) / 1000;
                return { ...item, quantity: roundedQty, amount: roundedQty * item.sell_price };
            }
            return item;
        });
        this.save();
    }

    public setQuantity(productId: number, quantity: number) {
        this.items = this.items.map(item => {
            if (item.id === productId) {
                const newQty = quantity;
                if (Math.abs(newQty) < 0.001) return item;
                // simple round to 3 decimal places
                const roundedQty = Math.round(newQty * 1000) / 1000;
                return { ...item, quantity: roundedQty, amount: roundedQty * item.sell_price };
            }
            return item;
        });
        this.save();
    }

    public clear() {
        this.items = [];
        this.save();
    }
}

export const cartService = new CartService();
