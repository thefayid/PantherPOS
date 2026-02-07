import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { billService } from '../services/billService';
import { Loader2, Search, Receipt, CreditCard, Banknote, Landmark, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (bill: any, paymentMode: string) => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [billNo, setBillNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundBill, setFoundBill] = useState<any>(null);
    const [paymentMode, setPaymentMode] = useState<string>('CASH');

    const handleSearch = async () => {
        if (!billNo.trim()) return;
        setLoading(true);
        toast('Debug: Searching for ' + billNo.trim(), { icon: '🔍' });
        try {
            const bill = await billService.getBillByNo(billNo.trim());
            console.log('[RefundModal] Search Result:', bill);

            if (bill) {
                setFoundBill(bill);
                toast.success('Bill Found: ID ' + bill.id);
            } else {
                toast.error('Bill not found in DB');
                setFoundBill(null);
            }
        } catch (e: any) {
            console.error(e);
            toast.error('Search Error: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!foundBill) return;
        onConfirm(foundBill, paymentMode);
        onClose();
    };

    const paymentModes = [
        { id: 'CASH', label: 'Cash', icon: Banknote },
        { id: 'UPI', label: 'UPI', icon: Wallet },
        { id: 'CARD', label: 'Card', icon: CreditCard },
        { id: 'CHECK', label: 'Check', icon: Landmark },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Process Refund / Return">
            <div className="space-y-6">

                {/* Search Section */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            placeholder="Scan or Enter Bill Number"
                            value={billNo}
                            onChange={(e) => setBillNo(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-9 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            autoFocus
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
                    </Button>
                </div>

                {/* Bill Details Preview */}
                {foundBill && (
                    <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between font-medium">
                            <span>Total Amount:</span>
                            <span>₹{foundBill.total}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Date: {new Date(foundBill.date).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Items: {foundBill.items.length}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 bg-yellow-500/10 text-yellow-600 p-2 rounded border border-yellow-500/20">
                            ⚠️ Note: All items will be loaded with NEGATIVE quantity. Remove items you do NOT want to return.
                        </div>
                    </div>
                )}

                {/* Payment Mode Selection */}
                {foundBill && (
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Refund Payment Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {paymentModes.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setPaymentMode(mode.id)}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg border transition-all
                                        ${paymentMode === mode.id
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                            : 'bg-surface hover:bg-muted border-border'
                                        }
                                    `}
                                >
                                    <mode.icon size={18} />
                                    <span className="font-medium text-sm">{mode.label}</span>
                                    {paymentMode === mode.id && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!foundBill} variant="danger">
                        Load for Refund
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
