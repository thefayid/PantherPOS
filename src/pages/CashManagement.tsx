import { useState, useEffect } from 'react';
import { cashService } from '../services/cashService';
import type { CashDrawerSession, CashTransaction, User } from '../types/db';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Banknote, ArrowDownCircle, ArrowUpCircle, Lock, History } from 'lucide-react';
import { permissionsService } from '../services/permissionsService';
import { ManagerPinModal } from '../components/ManagerPinModal';

interface CashManagementProps {
    user: User;
}

export default function CashManagement({ user }: CashManagementProps) {
    const [currentSession, setCurrentSession] = useState<CashDrawerSession | null>(null);
    const [transactions, setTransactions] = useState<CashTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'DROP' | 'PAYOUT' | 'OPENING'>('DROP');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closeAmount, setCloseAmount] = useState('');
    const [expectedCash, setExpectedCash] = useState<number>(0);
    const [isManagerPinOpen, setIsManagerPinOpen] = useState(false);

    useEffect(() => { loadSessionData(); }, []);

    const loadSessionData = async () => {
        setLoading(true);
        try {
            const session = await cashService.getCurrentSession();
            setCurrentSession(session);
            if (session) {
                const tx = await cashService.getTransactions(session.id);
                setTransactions(tx);
                setExpectedCash(await cashService.getExpectedCash(session.id));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async () => {
        if (!currentSession || !amount || !reason) return;
        if (transactionType === 'OPENING') return;
        try {
            await cashService.addTransaction(currentSession.id, transactionType, parseFloat(amount), reason);
            setIsTransactionModalOpen(false);
            setAmount('');
            setReason('');
            loadSessionData();
            alert('Transaction Added Successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to add transaction');
        }
    };

    const handleCloseShift = async () => {
        if (!currentSession || !closeAmount) return;
        try {
            await cashService.endSession(currentSession.id, parseFloat(closeAmount));
            setIsCloseModalOpen(false);
            setCloseAmount('');
            loadSessionData();
            alert('Shift Closed Successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to close shift');
        }
    };

    const requestCloseRegister = () => {
        if (permissionsService.can('CLOSE_REGISTER', user)) {
            setIsCloseModalOpen(true);
            return;
        }
        setIsManagerPinOpen(true);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background text-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!currentSession) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-background text-foreground p-6">
                <div className="bg-surface p-12 rounded-2xl border border-border shadow-2xl flex flex-col items-center max-w-lg text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                        <Banknote size={40} />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 tracking-tight">No Active Shift</h2>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        There is no open cash drawer session. Start a new session to begin handling transactions.
                    </p>
                    <Button
                        onClick={() => { setTransactionType('OPENING'); setIsTransactionModalOpen(true); }}
                        className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow h-auto"
                    >
                        Open Register
                    </Button>
                </div>

                <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title="Open Register">
                    <div className="flex flex-col gap-6 p-1">
                        <div className="flex flex-col gap-2">
                            <label className="text-center block text-xs font-bold text-muted-foreground uppercase tracking-widest">Opening Amount</label>
                            <input
                                type="number"
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-muted/20 border border-border rounded-xl p-6 text-5xl font-bold text-center text-foreground focus:border-primary/50 focus:outline-none shadow-inner"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-border mt-2">
                            <Button variant="ghost" onClick={() => setIsTransactionModalOpen(false)} className="flex-1">Cancel</Button>
                            <Button
                                onClick={async () => {
                                    if (!amount) return;
                                    try {
                                        await cashService.startSession(user.id, parseFloat(amount));
                                        setIsTransactionModalOpen(false);
                                        loadSessionData();
                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to start shift');
                                    }
                                }}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
                            >
                                Start Shift
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // Expected cash = opening float + signed movements (CLOSING is informational)
    const currentBalance = expectedCash;
    const variance = closeAmount ? (parseFloat(closeAmount) - currentBalance) : 0;

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cash Management</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${currentSession.status === 'OPEN' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                        <span className="font-bold text-foreground">Session #{currentSession.id}</span>
                        <span className="mx-1">•</span>
                        <span>Started {new Date(currentSession.start_time).toLocaleString()}</span>
                    </div>
                </div>
                <button
                    onClick={requestCloseRegister}
                    className="flex items-center gap-2 bg-destructive text-white px-6 py-3 rounded-xl shadow-glow hover:bg-destructive-hover font-bold transition-all border-none"
                >
                    <Lock size={18} /> Close Register
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-2xl border border-border bg-surface shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Banknote size={64} className="text-blue-500" />
                    </div>
                    <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Opening Balance</div>
                    <div className="text-4xl font-black text-foreground tracking-tight">₹{currentSession.start_cash.toFixed(2)}</div>
                </div>

                <div className="p-6 rounded-2xl border border-border bg-surface shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Banknote size={64} className="text-emerald-500" />
                    </div>
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Current Cash in Drawer</div>
                    <div className="text-4xl font-black text-foreground tracking-tight">₹{currentBalance.toFixed(2)}</div>
                </div>

                <div className="flex flex-col gap-3 justify-center">
                    <button
                        onClick={() => { setTransactionType('DROP'); setIsTransactionModalOpen(true); }}
                        className="w-full py-4 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-orange-500/20 transition-all uppercase tracking-widest text-xs"
                    >
                        <ArrowDownCircle size={20} /> Drop Cash
                    </button>
                    <button
                        onClick={() => { setTransactionType('PAYOUT'); setIsTransactionModalOpen(true); }}
                        className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-red-500/20 transition-all uppercase tracking-widest text-xs"
                    >
                        <ArrowUpCircle size={20} /> Payout / Expense
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-border shadow-xl flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/30">
                    <History size={20} className="text-muted-foreground" />
                    <h3 className="text-lg font-bold text-foreground">Session History</h3>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted text-muted-foreground text-[10px] uppercase tracking-widest sticky top-0 backdrop-blur-md z-10 font-black">
                            <tr>
                                <th className="p-4 border-b border-border">Time</th>
                                <th className="p-4 border-b border-border">Type</th>
                                <th className="p-4 border-b border-border">Reason</th>
                                <th className="p-4 border-b border-border text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-4 text-muted-foreground font-mono text-sm">{new Date(tx.time).toLocaleTimeString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${tx.type === 'OPENING' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                            tx.type === 'PAYIN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            tx.type === 'DROP' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                tx.type === 'SALE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-foreground">{tx.reason || '-'}</td>
                                    <td className={`p-4 text-right font-black ${
                                        (tx.type === 'SALE' || tx.type === 'OPENING' || tx.type === 'PAYIN')
                                            ? 'text-emerald-500'
                                            : (tx.type === 'CLOSING' ? 'text-muted-foreground' : 'text-destructive')
                                    }`}>
                                        {(tx.type === 'SALE' || tx.type === 'OPENING' || tx.type === 'PAYIN') ? '+' : (tx.type === 'CLOSING' ? '' : '-') }
                                        ₹{tx.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-muted-foreground flex flex-col items-center justify-center">
                                        <History size={48} className="mb-4 opacity-20" />
                                        <p>No transactions recorded in this session yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={`${transactionType} CASH`}>
                <div className="flex flex-col gap-6 p-1">
                    <div className="flex flex-col gap-2">
                        <label className="text-center block text-xs font-bold text-muted-foreground uppercase tracking-widest">Amount</label>
                        <input
                            type="number"
                            autoFocus
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl p-6 text-5xl font-bold text-center text-foreground focus:border-primary/50 focus:outline-none shadow-inner"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Reason / Reference</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl p-4 text-foreground focus:border-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
                            placeholder={transactionType === 'DROP' ? "e.g. Bank Deposit" : "e.g. Vendor Payment"}
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-border mt-2">
                        <Button variant="ghost" onClick={() => setIsTransactionModalOpen(false)} className="flex-1">Cancel</Button>
                        <Button onClick={handleTransaction} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow">Save Transaction</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} title="Close Register">
                <div className="flex flex-col gap-6 p-1">
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-bold text-sm text-center uppercase tracking-widest flex items-center justify-center gap-2">
                        <Lock size={16} /> Ends the current shift
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex justify-between ml-1">
                            <span>Closing Cash Count</span>
                            <span className="text-emerald-500">Expected: ₹{currentBalance.toFixed(2)}</span>
                        </label>
                        <input
                            type="number"
                            autoFocus
                            value={closeAmount}
                            onChange={(e) => setCloseAmount(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl p-6 text-5xl font-bold text-center text-foreground focus:border-primary/50 focus:outline-none shadow-inner"
                            placeholder="0.00"
                        />
                    </div>
                    {closeAmount !== '' && (
                        <div className={`p-4 rounded-xl border text-sm font-bold text-center uppercase tracking-widest ${
                            Math.abs(variance) < 0.01
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                        }`}>
                            Variance: ₹{variance.toFixed(2)}
                        </div>
                    )}
                    <div className="flex gap-3 justify-end pt-4 border-t border-border mt-2">
                        <Button variant="ghost" onClick={() => setIsCloseModalOpen(false)} className="flex-1">Cancel</Button>
                        <Button onClick={handleCloseShift} className="flex-1 bg-destructive hover:bg-destructive-hover text-white shadow-glow">Close Shift</Button>
                    </div>
                </div>
            </Modal>

            <ManagerPinModal
                isOpen={isManagerPinOpen}
                onClose={() => setIsManagerPinOpen(false)}
                minRole={permissionsService.getOverrideMinRole('CLOSE_REGISTER')}
                title="Manager Approval Required"
                description="Closing the register requires Manager authorization."
                auditAction="MANAGER_OVERRIDE"
                auditDetails={{ action: 'CLOSE_REGISTER', page: 'CashManagement', sessionId: currentSession?.id }}
                onApproved={() => {
                    setIsManagerPinOpen(false);
                    setIsCloseModalOpen(true);
                }}
            />
        </div>
    );
}
