import React, { useState, useEffect } from 'react';
import { User, LogOut, CheckCircle, History, X, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { cashService } from '../services/cashService';
import type { CashDrawerSession } from '../types/db';

const TABS = [
    { id: 'eod', label: 'End of day' },
    { id: 'history', label: 'History' }
];

export default function EndOfDay() {
    const [activeTab, setActiveTab] = useState('eod');
    const [session, setSession] = useState<CashDrawerSession | null>(null);
    const [summary, setSummary] = useState<{ mode: string; amount: number }[]>([]);
    const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
    const [cashOutAmount, setCashOutAmount] = useState('');
    const [cashOutReason, setCashOutReason] = useState('Safe Drop');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSessionData();
    }, []);

    const loadSessionData = async () => {
        setLoading(true);
        try {
            const currentSession = await cashService.getCurrentSession();
            setSession(currentSession);
            if (currentSession) {
                const summ = await cashService.getSessionSummary(currentSession.id);
                setSummary(summ);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleStartShift = async (amount: number) => {
        if (!amount && amount !== 0) return;
        try {
            // Need user ID. For now assuming global or single user context for simplicity or grabbing from auth context if avail.
            const userString = localStorage.getItem('user'); // Fallback or pass prop
            const user = userString ? JSON.parse(userString) : { id: 1 };

            await cashService.startSession(user.id, amount);
            alert('Shift Started');
            loadSessionData();
        } catch (err) {
            console.error(err);
            alert('Failed to start shift');
        }
    };

    const handleCashOut = async () => {
        if (!session || !cashOutAmount) return;
        const type = cashOutReason === 'Pay In' ? 'PAYIN' : 'DROP';
        try {
            await cashService.addTransaction(session.id, type as any, parseFloat(cashOutAmount), cashOutReason);
            setIsCashOutModalOpen(false);
            setCashOutAmount('');
            alert('Transaction recorded.');
            loadSessionData();
        } catch (error) {
            console.error(error);
            alert('Failed to record transaction.');
        }
    };

    const handleCloseRegister = async () => {
        if (!session) return;
        if (!confirm('Are you sure you want to close the register? This will end the current session.')) return;

        // In a real app, we'd ask for counted cash here to calculate variance.
        // For this MVP step, we'll just close it.
        try {
            // Calculate expected cash based on Opening + Sales (Cash) - Drops
            // This is complex, so for now passing 0 or implement a Count Modal later.
            // Let's just close it.
            await cashService.endSession(session.id, 0);
            alert('Register closed successfully.');
            setSession(null);
            setSummary([]);
        } catch (error) {
            alert('Failed to close register.');
        }
    };

    const totalRevenue = summary.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-border bg-surface">
                <span className="text-muted-foreground">Management •</span>
                <span className="font-bold text-lg">End of day</span>
            </div>

            {/* Error Banner Strip (Mockup Style) */}
            <div className="bg-destructive/10 border-b border-destructive/20 p-2 flex items-center gap-2 text-destructive text-sm px-4">
                <AlertCircle size={16} />
                <span>Printer is disabled or not selected. Reports may not be printed.</span>
                <button className="ml-auto hover:bg-destructive/20 p-1 rounded"><X size={14} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border bg-surface px-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {!session && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="p-6 bg-surface border border-border rounded-xl shadow-lg max-w-md w-full">
                        <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">Register Closed</h3>
                        <p className="text-muted-foreground mb-6">There is no active shift. Start a new session to manage transactions.</p>
                        <Button onClick={() => setIsCashOutModalOpen(true)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                            Open Register
                        </Button>
                    </div>
                    {/* Reuse Modal for Open Register logic if IsCashOutModalOpen is reused carefully or new state */}
                </div>
            )}

            {session && activeTab === 'eod' && (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-muted-foreground text-sm mb-4">Select cash out option</h3>
                        <div className="flex gap-4">
                            <ActionCard
                                icon={User}
                                label="Cash out"
                                color="bg-emerald-500 text-white hover:bg-emerald-600"
                                onClick={() => { setCashOutReason('Safe Drop'); setIsCashOutModalOpen(true); }}
                                disabled={!session}
                            />
                            <ActionCard
                                icon={User} // Should be multiple users icon
                                label="Cash out all users"
                                color="bg-surface text-foreground border border-border hover:bg-muted"
                                onClick={() => alert('Feature coming soon')}
                            />
                            <ActionCard
                                icon={LogOut}
                                label="Close register"
                                color="bg-surface text-foreground border border-border hover:bg-muted"
                                onClick={handleCloseRegister}
                                disabled={!session}
                            />

                            <div className="ml-auto">
                                <ActionCard
                                    icon={X}
                                    label="REPORT"
                                    subLabel="X"
                                    color="bg-surface text-foreground border border-border hover:bg-muted w-24 h-24 text-center justify-center"
                                    onClick={() => alert('X Report generated (mock)')}
                                    minimal
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[400px]">
                        {/* Left: Visualization */}
                        <div className="bg-surface border border-white/5 flex flex-col h-full min-h-[300px]">
                            <div className="p-3 bg-emerald-500 text-black font-bold text-sm uppercase tracking-wide">Open transactions</div>
                            <div className="flex-1 p-8 flex flex-col justify-end">
                                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                                    <span className="text-muted-foreground font-bold text-xl uppercase">TOTAL:</span>
                                    <span className="text-emerald-500 font-bold text-xl">{totalRevenue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Detailed list */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-light text-muted-foreground">Open transactions</h3>
                            <div className="uppercase text-xs font-bold text-muted-foreground tracking-wider">ADMIN</div>

                            <div className="space-y-2 mt-4">
                                {summary.map(s => (
                                    <div key={s.mode} className="flex justify-between text-sm py-2 border-b border-white/5">
                                        <span>{s.mode}</span>
                                        <span>{s.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/10">
                                <span className="font-bold text-xl">TOTAL:</span>
                                <span className="text-emerald-500 font-bold text-2xl">{totalRevenue.toFixed(2)}</span>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Footer Buttons */}
            <div className="p-4 border-t border-border bg-surface flex justify-end gap-3">
                <Button variant="danger" onClick={() => window.history.back()}>
                    <X size={16} className="mr-2" /> Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => window.history.back()}>
                    <CheckCircle size={16} className="mr-2" /> Continue
                </Button>
            </div>

            {/* Cash Out Modal */}
            <Modal isOpen={isCashOutModalOpen} onClose={() => setIsCashOutModalOpen(false)} title="Cash Out / Drop">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-border rounded bg-background"
                            value={cashOutAmount}
                            onChange={e => setCashOutAmount(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {!session ? (
                        // Start Shift Mode
                        <div>
                            <p className="text-sm text-muted-foreground mb-4">Enter opening cash float amount.</p>
                            <Button onClick={() => handleStartShift(parseFloat(cashOutAmount))} fullWidth>Start Shift</Button>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">Reason</label>
                                <select
                                    className="w-full p-2 border border-border rounded bg-background"
                                    value={cashOutReason}
                                    onChange={e => setCashOutReason(e.target.value)}
                                >
                                    <option value="Safe Drop">Safe Drop</option>
                                    <option value="Expense">Expense</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <Button onClick={handleCashOut} fullWidth>
                                Confirm Cash Out
                            </Button>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}

function ActionCard({ icon: Icon, label, subLabel, color, onClick, disabled, minimal }: any) {
    if (minimal) {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`flex flex-col items-center justify-center gap-2 p-2 rounded shadow-sm transition-all ${color} ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
                <Icon size={32} strokeWidth={2.5} />
                <div className="text-xs font-bold uppercase tracking-wider">{label}</div>
            </button>
        )
    }
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center gap-3 w-32 h-32 p-4 rounded shadow-sm transition-all ${color} ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
        >
            <Icon size={40} strokeWidth={1.5} />
            <div className="text-sm font-medium text-center leading-tight">{label}</div>
        </button>
    );
}
