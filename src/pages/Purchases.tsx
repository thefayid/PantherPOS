import { useState, useEffect, useCallback } from 'react';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../services/supplierService';
import { productService } from '../services/productService';
import type { PurchaseOrder, Supplier, Product } from '../types/db';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Search, Plus, Calendar, CheckCircle2, Trash2, Package, Info } from 'lucide-react';

interface POItem {
    product_id: number;
    name: string;
    barcode: string;
    quantity: number;
    cost_price: number;
    total_amount: number;
}

export default function Purchases() {
    const [orders, setOrders] = useState<(PurchaseOrder & { supplier_name: string })[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrderData, setSelectedOrderData] = useState<{ order: any, items: any[] } | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [newPO, setNewPO] = useState<{ supplier_id: number; notes: string; items: POItem[]; }>({ supplier_id: 0, notes: '', items: [] });

    const loadData = useCallback(async () => {
        try {
            const [orderData, supplierData, productData] = await Promise.all([
                purchaseService.getAll(),
                supplierService.getAll(),
                productService.getAll()
            ]);
            setOrders(orderData);
            setSuppliers(supplierData);
            setProducts(productData);
        } catch (error) {
            console.error('Failed to load purchase data:', error);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreatePO = async () => {
        if (newPO.supplier_id === 0 || newPO.items.length === 0) { alert('Please select a supplier and add at least one item.'); return; }
        try { const total = newPO.items.reduce((sum, item) => sum + item.total_amount, 0); await purchaseService.create({ supplier_id: newPO.supplier_id, total_amount: total, status: 'DRAFT', notes: newPO.notes }, newPO.items); setIsCreateModalOpen(false); setNewPO({ supplier_id: 0, notes: '', items: [] }); loadData(); } catch (error) { console.error(error); alert('Failed to create purchase order'); }
    };

    const handleReceiveOrder = async (id: number) => { if (!confirm('Are you sure you want to receive this order? This will increase product stock levels.')) return; try { await purchaseService.receiveOrder(id); if (isViewModalOpen) setIsViewModalOpen(false); loadData(); } catch (error: any) { alert(error.message || 'Failed to receive order'); } };
    const deleteDraft = async (id: number) => { if (!confirm('Delete this draft order?')) return; try { await purchaseService.deleteDraft(id); loadData(); } catch (error: any) { alert(error.message || 'Failed to delete order'); } };
    const viewOrder = async (id: number) => { const data = await purchaseService.getById(id); setSelectedOrderData(data); setIsViewModalOpen(true); };

    const addItem = (product: Product) => {
        const existing = newPO.items.find(i => i.product_id === product.id);
        if (existing) {
            setNewPO({ ...newPO, items: newPO.items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total_amount: (i.quantity + 1) * i.cost_price } : i) });
        } else {
            setNewPO({ ...newPO, items: [...newPO.items, { product_id: product.id, name: product.name, barcode: product.barcode, quantity: 1, cost_price: product.cost_price, total_amount: product.cost_price }] });
        }
        setProductSearch(''); setShowSuggestions(false);
    };

    const removeItem = (id: number) => { setNewPO({ ...newPO, items: newPO.items.filter(i => i.product_id !== id) }); };
    const updateItem = (id: number, field: keyof POItem, value: any) => {
        setNewPO({ ...newPO, items: newPO.items.map(i => { if (i.product_id === id) { const updated = { ...i, [field]: value }; updated.total_amount = updated.quantity * updated.cost_price; return updated; } return i; }) });
    };

    const filteredProducts = productSearch.length > 0 ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode.includes(productSearch)) : [];

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Purchase Orders</h1>
                    <p className="text-muted-foreground">Manage supplier orders and stock intake</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl shadow-glow font-bold flex items-center gap-2 transition-all"
                >
                    <Plus size={20} /> New Purchase Order
                </button>
            </div>

            <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-border shadow-xl">
                <div className="h-full overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-4 font-medium border-b border-border">Order #</th>
                                <th className="p-4 font-medium border-b border-border">Date</th>
                                <th className="p-4 font-medium border-b border-border">Supplier</th>
                                <th className="p-4 font-medium border-b border-border text-right">Amount</th>
                                <th className="p-4 font-medium border-b border-border text-center">Status</th>
                                <th className="p-4 font-medium border-b border-border text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.map(o => (
                                <tr key={o.id} className="hover:bg-muted/50 transition-colors group">
                                    <td className="p-4 font-mono font-bold text-muted-foreground">#{o.order_no}</td>
                                    <td className="p-4 text-muted-foreground font-medium">{new Date(o.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-foreground">{o.supplier_name}</td>
                                    <td className="p-4 text-right font-bold text-foreground">₹{o.total_amount.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${o.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => viewOrder(o.id)} className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-border">
                                                <Info size={14} /> View
                                            </button>
                                            {o.status === 'DRAFT' && (
                                                <button onClick={() => deleteDraft(o.id)} className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                                <Package size={32} className="opacity-50" />
                                            </div>
                                            <p>No purchase orders found. Create a new one to restock inventory.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE MODAL */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Purchase Order">
                <div className="flex flex-col gap-5 p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Select Supplier</label>
                            <select
                                value={newPO.supplier_id}
                                onChange={(e) => setNewPO({ ...newPO, supplier_id: Number(e.target.value) })}
                                className="w-full bg-muted/20 border border-border rounded-lg p-3 text-foreground focus:border-primary/50 focus:outline-none"
                            >
                                <option value={0} className="bg-surface">Select a Supplier...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id} className="bg-surface">{s.name}</option>)}
                            </select>
                        </div>
                        <div className="relative flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Add Product</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search product..."
                                    value={productSearch}
                                    onChange={(e) => { setProductSearch(e.target.value); setShowSuggestions(true); }}
                                    className="w-full bg-muted/20 border border-border rounded-lg pl-10 pr-3 py-3 text-foreground focus:border-primary/50 focus:outline-none"
                                />
                            </div>
                            {showSuggestions && filteredProducts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto mt-1">
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => addItem(p)}
                                            className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border flex justify-between items-center"
                                        >
                                            <span className="text-foreground font-medium">{p.name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">₹{p.cost_price}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-muted/10 border border-border rounded-xl p-4 min-h-[200px] flex flex-col">
                        <div className="flex-1 overflow-y-auto max-h-[300px]">
                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                                    <tr>
                                        <th className="text-left py-2 font-medium">Item</th>
                                        <th className="text-center py-2 font-medium">Qty</th>
                                        <th className="text-right py-2 font-medium">Total</th>
                                        <th className="py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {newPO.items.map(item => (
                                        <tr key={item.product_id}>
                                            <td className="py-3 text-foreground font-medium">{item.name}</td>
                                            <td className="py-3 text-center">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(item.product_id, 'quantity', Number(e.target.value))}
                                                    className="w-16 bg-muted/40 border border-border rounded-lg p-1 text-center text-foreground focus:border-primary/50 focus:outline-none"
                                                />
                                            </td>
                                            <td className="py-3 text-right text-emerald-600 font-bold">₹{item.total_amount.toFixed(2)}</td>
                                            <td className="py-3 text-right">
                                                <button onClick={() => removeItem(item.product_id)} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {newPO.items.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-muted-foreground italic">Add items to create an order</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex justify-end items-center gap-4">
                            <span className="text-muted-foreground text-sm uppercase font-bold tracking-wider">Total Amount</span>
                            <span className="text-2xl font-bold text-primary">₹{newPO.items.reduce((sum, i) => sum + i.total_amount, 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="flex-1">Discard</Button>
                        <Button onClick={handleCreatePO} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow">Place Order</Button>
                    </div>
                </div>
            </Modal>

            {/* VIEW MODAL */}
            {selectedOrderData && (
                <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`PO #${selectedOrderData.order.order_no}`}>
                    <div className="p-1 flex flex-col gap-6">
                        <div className="flex justify-between items-center bg-muted/30 p-5 rounded-xl border border-border">
                            <div>
                                <h2 className="font-bold text-xl text-foreground mb-1">{(selectedOrderData.order as any).supplier_name}</h2>
                                <p className="text-muted-foreground text-sm flex items-center gap-2">
                                    <Calendar size={14} /> {new Date(selectedOrderData.order.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-primary mb-1">₹{selectedOrderData.order.total_amount.toFixed(2)}</div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${selectedOrderData.order.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                    {selectedOrderData.order.status}
                                </span>
                            </div>
                        </div>

                        <div className="bg-surface rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3 text-left font-medium">Product</th>
                                        <th className="p-3 text-right font-medium">Qty</th>
                                        <th className="p-3 text-right font-medium">Cost</th>
                                        <th className="p-3 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {selectedOrderData.items.map((item: any, i: number) => (
                                        <tr key={i} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-3 text-foreground font-medium">{item.product_name}</td>
                                            <td className="p-3 text-right text-muted-foreground">{item.quantity}</td>
                                            <td className="p-3 text-right text-muted-foreground">₹{item.cost_price.toFixed(2)}</td>
                                            <td className="p-3 text-right text-emerald-600 font-bold">₹{item.total_amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {selectedOrderData.order.status === 'DRAFT' && (
                            <div className="flex justify-end pt-4 border-t border-border">
                                <Button onClick={() => handleReceiveOrder(selectedOrderData.order.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-glow border-none w-full">
                                    <CheckCircle2 size={18} className="mr-2" /> Receive Order & Update Stock
                                </Button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
