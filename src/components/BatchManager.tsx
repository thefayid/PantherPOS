import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { inventoryService } from '../services/inventoryService';
import type { Product, ProductBatch } from '../types/db';
import { Button } from './Button';
import { Plus, Trash2, AlertTriangle, Calendar } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface BatchManagerProps {
    product: Product;
    onUpdate?: () => void;
}

export const BatchManager: React.FC<BatchManagerProps> = ({ product, onUpdate }) => {
    const [batches, setBatches] = useState<ProductBatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [newBatchCode, setNewBatchCode] = useState('');
    const [newExpiryDate, setNewExpiryDate] = useState('');
    const [newQuantity, setNewQuantity] = useState('');

    useEffect(() => {
        if (product?.id) {
            loadBatches();
        }
    }, [product]);

    const loadBatches = async () => {
        setLoading(true);
        try {
            const data = await inventoryService.getBatches(product.id);
            setBatches(data);
        } catch (e) {
            console.error('Failed to load batches', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBatchCode || !newExpiryDate || !newQuantity) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            await inventoryService.addBatchStock(
                product.id,
                newBatchCode,
                newExpiryDate,
                parseInt(newQuantity)
            );
            toast.success('Batch added successfully');
            setShowAddForm(false);
            setNewBatchCode('');
            setNewExpiryDate('');
            setNewQuantity('');
            loadBatches();
            if (onUpdate) onUpdate();
        } catch (e) {
            console.error(e);
            toast.error('Failed to add batch');
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg border border-border">
                <div className="text-sm">
                    <span className="text-muted-foreground mr-2">Total System Stock:</span>
                    <span className="font-mono font-bold text-lg">{product.stock}</span>
                </div>
                <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "secondary" : "primary"}>
                    {showAddForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Add Batch</>}
                </Button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddBatch} className="bg-muted/50 p-4 rounded-lg border border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-sm text-primary mb-2">New Batch Entry</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Batch Code</label>
                            <input
                                type="text"
                                className="w-full p-2 rounded border border-input bg-background text-sm"
                                placeholder="e.g. BATCH-001"
                                value={newBatchCode}
                                onChange={e => setNewBatchCode(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Expiry Date</label>
                            <input
                                type="date"
                                className="w-full p-2 rounded border border-input bg-background text-sm"
                                value={newExpiryDate}
                                onChange={e => setNewExpiryDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Quantity</label>
                            <input
                                type="number"
                                className="w-full p-2 rounded border border-input bg-background text-sm"
                                placeholder="0"
                                value={newQuantity}
                                onChange={e => setNewQuantity(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" size="sm">Save Batch & Add Stock</Button>
                    </div>
                </form>
            )}

            <div className="flex-1 overflow-auto border border-border rounded-lg bg-background">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground sticky top-0">
                        <tr>
                            <th className="p-3 font-semibold">Batch Code</th>
                            <th className="p-3 font-semibold">Expiry Date</th>
                            <th className="p-3 font-semibold text-right">Quantity</th>
                            <th className="p-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading batches...</td></tr>
                        ) : batches.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No batches found.</td></tr>
                        ) : (
                            batches.map(batch => {
                                const isExpired = new Date(batch.expiry_date) < new Date();
                                const daysToExpiry = Math.ceil((new Date(batch.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                const isExpiringSoon = !isExpired && daysToExpiry <= 30;

                                return (
                                    <tr key={batch.id} className="hover:bg-muted/10">
                                        <td className="p-3 font-medium">{batch.batch_code}</td>
                                        <td className="p-3">
                                            <div className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                                                {new Date(batch.expiry_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-mono">{batch.quantity}</td>
                                        <td className="p-3">
                                            {isExpired ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-destructive/10 text-destructive">
                                                    <AlertTriangle className="w-3 h-3 mr-1" /> EXPIRED
                                                </span>
                                            ) : isExpiringSoon ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">
                                                    Expires in {daysToExpiry} days
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                                                    Valid
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
