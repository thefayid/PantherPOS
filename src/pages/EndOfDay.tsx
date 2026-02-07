import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, History, Lock, Printer } from 'lucide-react';
import { Button } from '../components/Button';
import { cashService } from '../services/cashService';
import type { CashDrawerSession } from '../types/db';
import { permissionsService } from '../services/permissionsService';
import { ManagerPinModal } from '../components/ManagerPinModal';
import { eodReportService } from '../services/eodReportService';

const TABS = [
    { id: 'eod', label: 'End of day' },
    { id: 'history', label: 'History' }
];

export default function EndOfDay() {
    const navigate = useNavigate();
    const currentUser = permissionsService.getCurrentUser();
    const canAccess = permissionsService.roleAtLeast(currentUser?.role, 'MANAGER');
    const [overrideGranted, setOverrideGranted] = useState(false);
    const [isPinOpen, setIsPinOpen] = useState(false);

    if (!canAccess && !overrideGranted) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-background text-foreground p-8">
                <div className="bg-surface border border-border rounded-2xl shadow-2xl p-10 max-w-xl w-full text-center space-y-4">
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Restricted</div>
                    <h2 className="text-2xl font-black tracking-tight">End of Day Locked</h2>
                    <p className="text-sm text-muted-foreground font-medium">
                        End-of-day reconciliation is restricted to Managers and Administrators.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                        <Button variant="ghost" onClick={() => window.history.back()}>Go Back</Button>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white border-none" onClick={() => setIsPinOpen(true)}>
                            Manager PIN Override
                        </Button>
                    </div>
                </div>

                <ManagerPinModal
                    isOpen={isPinOpen}
                    onClose={() => setIsPinOpen(false)}
                    minRole="MANAGER"
                    title="Manager Authorization"
                    description="Enter a Manager/Admin PIN to access End of Day."
                    auditAction="MANAGER_OVERRIDE"
                    auditDetails={{ action: 'END_OF_DAY_ACCESS', page: 'EndOfDay' }}
                    onApproved={() => {
                        setIsPinOpen(false);
                        setOverrideGranted(true);
                    }}
                />
            </div>
        );
    }

    const [activeTab, setActiveTab] = useState<'eod' | 'history'>('eod');
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<CashDrawerSession | null>(null);
    const [expectedCash, setExpectedCash] = useState<number>(0);
    const [tenderSummary, setTenderSummary] = useState<{ mode: string; amount: number }[]>([]);
    const [countedCash, setCountedCash] = useState('');
    const [sessions, setSessions] = useState<CashDrawerSession[]>([]);

    const [isSignoffOpen, setIsSignoffOpen] = useState(false);
    const [signoffMeta, setSignoffMeta] = useState<{ approverId: number; approverName: string; approverRole: string } | null>(null);

    const variance = useMemo(() => {
        if (countedCash.trim() === '') return null;
        const c = Number(countedCash);
        if (!Number.isFinite(c)) return null;
        return c - expectedCash;
    }, [countedCash, expectedCash]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const current = await cashService.getCurrentSession();
            setSession(current);
            if (current) {
                setExpectedCash(await cashService.getExpectedCash(current.id));
                setTenderSummary(await cashService.getSessionSummary(current.id));
            } else {
                setExpectedCash(0);
                setTenderSummary([]);
            }

            const history = await cashService.listSessions(25);
            setSessions(history);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleExportX = async () => {
        if (!session) return;
        try {
            await eodReportService.exportXReport(session.id);
            alert('X report exported.');
        } catch (e: any) {
            console.error(e);
            alert(e?.message || 'Failed to export X report.');
        }
    };

    const handleRequestZ = () => {
        if (!session) return;
        if (countedCash.trim() === '') {
            alert('Enter counted cash to close the register.');
            return;
        }
        const c = Number(countedCash);
        if (!Number.isFinite(c)) {
            alert('Invalid counted cash amount.');
            return;
        }
        setIsSignoffOpen(true);
    };

    const finalizeZ = async (approver: any) => {
        if (!session) return;
        const c = Number(countedCash);
        if (!Number.isFinite(c)) return;

        setLoading(true);
        try {
            setSignoffMeta({ approverId: approver.id, approverName: approver.name, approverRole: approver.role });

            await cashService.endSession(
                session.id,
                c,
                JSON.stringify({ kind: 'Z_REPORT', countedCash: c, approvedBy: { id: approver.id, name: approver.name, role: approver.role } })
            );

            await eodReportService.exportZReport(session.id, {
                countedCash: c,
                approvedBy: { id: approver.id, name: approver.name, role: approver.role },
            });

            alert('Z report exported and register closed.');
            setCountedCash('');
            await loadAll();
        } catch (e: any) {
            console.error(e);
            alert(e?.message || 'Failed to finalize Z report.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-5 border-b border-border bg-surface">
                <div>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Management •</div>
                    <div className="font-black text-xl tracking-tight">End of Day</div>
                </div>
                <button
                    onClick={loadAll}
                    className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted/30 text-xs font-black uppercase tracking-widest"
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border bg-surface px-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'eod' && (
                    <div className="space-y-6">
                        {!session ? (
                            <div className="bg-surface border border-border rounded-2xl shadow-xl p-10 text-center space-y-3 max-w-2xl mx-auto">
                                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Register</div>
                                <h2 className="text-2xl font-black tracking-tight">No Active Shift</h2>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Open the register to start recording cash sales, drops, and payouts.
                                </p>
                                <div className="pt-3 flex justify-center gap-3">
                                    <Button onClick={() => navigate('/cash')} className="bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                                        Open Register
                                    </Button>
                                    <Button variant="ghost" onClick={() => setActiveTab('history')}>
                                        <History size={16} className="mr-2" /> View History
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-5xl mx-auto space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-6 bg-surface border border-border rounded-2xl shadow-lg">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Session</div>
                                        <div className="text-2xl font-black tracking-tight">#{session.id}</div>
                                        <div className="text-xs text-muted-foreground font-medium mt-1">
                                            Started {new Date(session.start_time).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-6 bg-surface border border-border rounded-2xl shadow-lg">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Expected cash</div>
                                        <div className="text-3xl font-black text-emerald-500 tracking-tight">₹{expectedCash.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground font-medium mt-1">Computed from cash transactions.</div>
                                    </div>
                                    <div className="p-6 bg-surface border border-border rounded-2xl shadow-lg">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Counted cash</div>
                                        <input
                                            type="number"
                                            value={countedCash}
                                            onChange={(e) => setCountedCash(e.target.value)}
                                            className="w-full mt-2 bg-muted/20 border border-border rounded-xl p-4 text-2xl font-black text-center text-foreground focus:border-primary/50 focus:outline-none shadow-inner"
                                            placeholder="0.00"
                                        />
                                        {variance !== null && (
                                            <div className={`mt-3 p-3 rounded-xl border text-center text-[10px] font-black uppercase tracking-widest ${Math.abs(variance) < 0.01
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                                : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                                                }`}>
                                                Variance: ₹{variance.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
                                    <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                                        <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Payment tenders</div>
                                        <div className="text-[10px] text-muted-foreground font-bold">
                                            From bills during this session
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="space-y-2">
                                            {tenderSummary.length === 0 ? (
                                                <div className="text-sm text-muted-foreground">No tenders recorded yet.</div>
                                            ) : (
                                                tenderSummary.map((s) => (
                                                    <div key={s.mode} className="flex justify-between border-b border-border/50 py-2 text-sm">
                                                        <span className="font-bold">{s.mode}</span>
                                                        <span className="font-black">₹{Number(s.amount || 0).toFixed(2)}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-3 justify-end">
                                    <Button
                                        variant="ghost"
                                        className="border border-border"
                                        onClick={handleExportX}
                                        disabled={loading}
                                    >
                                        <Printer size={16} className="mr-2" /> Export X Report
                                    </Button>
                                    <Button
                                        className="bg-destructive hover:bg-destructive-hover text-white border-none"
                                        onClick={handleRequestZ}
                                        disabled={loading}
                                    >
                                        <Lock size={16} className="mr-2" /> Close Register (Z)
                                    </Button>
                                </div>

                                {signoffMeta && (
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-right">
                                        Last approval: {signoffMeta.approverName} ({signoffMeta.approverRole})
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="max-w-6xl mx-auto space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">History</div>
                                <div className="text-xl font-black tracking-tight">Cash Drawer Sessions</div>
                            </div>
                        </div>

                        <div className="bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4 border-b border-border">Session</th>
                                        <th className="p-4 border-b border-border">Status</th>
                                        <th className="p-4 border-b border-border">Start</th>
                                        <th className="p-4 border-b border-border">End</th>
                                        <th className="p-4 border-b border-border text-right">Expected</th>
                                        <th className="p-4 border-b border-border text-right">Counted</th>
                                        <th className="p-4 border-b border-border text-right">Variance</th>
                                        <th className="p-4 border-b border-border text-right">Export</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sessions.map((s) => (
                                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-black">#{s.id}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.status === 'CLOSED'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-primary/10 text-primary border-primary/20'
                                                    }`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-muted-foreground font-mono">{new Date(s.start_time).toLocaleString()}</td>
                                            <td className="p-4 text-xs text-muted-foreground font-mono">{s.end_time ? new Date(s.end_time).toLocaleString() : 'OPEN'}</td>
                                            <td className="p-4 text-right font-black">₹{Number(s.expected_cash || 0).toFixed(2)}</td>
                                            <td className="p-4 text-right font-black">₹{Number(s.end_cash || 0).toFixed(2)}</td>
                                            <td className={`p-4 text-right font-black ${Number(s.variance || 0) === 0 ? 'text-muted-foreground' : Number(s.variance || 0) > 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                ₹{Number(s.variance || 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/30 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                                    disabled={s.status !== 'CLOSED' || s.end_cash === null || s.end_cash === undefined}
                                                    onClick={async () => {
                                                        try {
                                                            await eodReportService.exportZReport(s.id, { countedCash: Number(s.end_cash || 0), approvedBy: null });
                                                            alert('Z report exported.');
                                                        } catch (e: any) {
                                                            console.error(e);
                                                            alert(e?.message || 'Failed to export Z report.');
                                                        }
                                                    }}
                                                >
                                                    <Download size={14} /> Z
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {sessions.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-12 text-center text-muted-foreground">
                                                No sessions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <ManagerPinModal
                isOpen={isSignoffOpen}
                onClose={() => setIsSignoffOpen(false)}
                minRole={permissionsService.getOverrideMinRole('FINALIZE_Z_REPORT')}
                title="Manager Sign-off"
                description="Enter a Manager/Admin PIN to close the register and finalize the Z report."
                auditAction="MANAGER_OVERRIDE"
                auditDetails={{ action: 'FINALIZE_Z_REPORT', page: 'EndOfDay', sessionId: session?.id, countedCash }}
                onApproved={(approver) => {
                    setIsSignoffOpen(false);
                    finalizeZ(approver);
                }}
            />
        </div>
    );
}
