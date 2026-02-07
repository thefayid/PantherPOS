import { useState, useEffect } from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';
import { auditService, type AuditLogEntry, type AuditSeverity } from '../services/auditService';
import { permissionsService } from '../services/permissionsService';
import { exportService } from '../services/exportService';
import { Button } from '../components/Button';

export default function AuditLogs() {
    const currentUser = permissionsService.getCurrentUser();
    const canView = permissionsService.can('VIEW_AUDIT_LOGS', currentUser);

    if (!canView) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-background text-foreground p-8">
                <div className="bg-surface border border-border rounded-2xl shadow-2xl p-10 max-w-xl w-full text-center space-y-3">
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Restricted</div>
                    <h2 className="text-2xl font-black tracking-tight">Audit Logs Locked</h2>
                    <p className="text-sm text-muted-foreground font-medium">
                        Audit logs are available to Managers and Administrators only.
                    </p>
                </div>
            </div>
        );
    }

    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [severityFilter, setSeverityFilter] = useState<'ALL' | AuditSeverity>('ALL');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.getLogs(200);
            setLogs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLogs(); }, []);

    const parseDetails = (details: string): { json: any | null; severity: AuditSeverity | null; preview: string } => {
        const trimmed = (details || '').trim();
        if (!trimmed) return { json: null, severity: null, preview: '-' };
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                const json = JSON.parse(trimmed);
                const severity = (json?.severity as AuditSeverity) || null;
                const preview =
                    typeof json?.message === 'string'
                        ? json.message
                        : typeof json?.kind === 'string'
                            ? `${json.kind}${json?.entity ? ` • ${json.entity}` : ''}`
                            : trimmed;
                return { json, severity, preview };
            } catch {
                return { json: null, severity: null, preview: trimmed };
            }
        }
        return { json: null, severity: null, preview: trimmed };
    };

    const actions = Array.from(new Set(logs.map(l => l.action))).sort();

    const filteredLogs = logs.filter(log => {
        const q = filter.trim().toLowerCase();
        const parsed = parseDetails(log.details);
        const preview = parsed.preview.toLowerCase();

        const matchesText =
            q.length === 0 ||
            log.user_name.toLowerCase().includes(q) ||
            log.action.toLowerCase().includes(q) ||
            preview.includes(q) ||
            (log.details || '').toLowerCase().includes(q);

        const matchesAction = actionFilter === 'ALL' ? true : log.action === actionFilter;
        const sev = (parsed.severity || 'INFO') as AuditSeverity;
        const matchesSeverity = severityFilter === 'ALL' ? true : sev === severityFilter;

        const ts = new Date(log.timestamp).getTime();
        const fromOk = dateFrom ? ts >= new Date(`${dateFrom}T00:00:00`).getTime() : true;
        const toOk = dateTo ? ts <= new Date(`${dateTo}T23:59:59`).getTime() : true;

        return matchesText && matchesAction && matchesSeverity && fromOk && toOk;
    });

    const exportRows = filteredLogs.map(l => {
        const parsed = parseDetails(l.details);
        const severity = (parsed.severity || 'INFO') as AuditSeverity;
        return {
            timestamp: l.timestamp,
            user: l.user_name,
            action: l.action,
            severity,
            details: parsed.json ? JSON.stringify(parsed.json) : l.details,
        };
    });

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                    <p className="text-muted-foreground">System security and activity history</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="border border-border"
                        onClick={() => exportService.exportToCsv(`audit_logs_${new Date().toISOString().slice(0, 10)}.csv`, exportRows)}
                        disabled={exportRows.length === 0}
                    >
                        <Download size={16} className="mr-2" /> Export CSV
                    </Button>
                    <Button
                        variant="ghost"
                        className="border border-border"
                        onClick={() => exportService.exportToPdf(`audit_logs_${new Date().toISOString().slice(0, 10)}.pdf`, 'Audit Logs', exportRows)}
                        disabled={exportRows.length === 0}
                    >
                        <Download size={16} className="mr-2" /> Export PDF
                    </Button>
                    <button
                        onClick={loadLogs}
                        className="p-3 bg-surface hover:bg-muted text-foreground rounded-xl border border-border transition-all shadow-sm group"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Filter logs by user, action, or details..."
                        className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-4 text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-lg placeholder:text-muted-foreground/50"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-surface border border-border rounded-xl p-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Action</div>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-bold"
                    >
                        <option value="ALL">All</option>
                        {actions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="bg-surface border border-border rounded-xl p-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Severity</div>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value as any)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-bold"
                    >
                        <option value="ALL">All</option>
                        <option value="INFO">INFO</option>
                        <option value="WARN">WARN</option>
                        <option value="ERROR">ERROR</option>
                        <option value="CRITICAL">CRITICAL</option>
                    </select>
                </div>
                <div className="bg-surface border border-border rounded-xl p-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">From</div>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-bold"
                    />
                </div>
                <div className="bg-surface border border-border rounded-xl p-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">To</div>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-bold"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-border shadow-xl flex flex-col">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-4 border-b border-border">Time</th>
                                <th className="p-4 border-b border-border">User</th>
                                <th className="p-4 border-b border-border">Action</th>
                                <th className="p-4 border-b border-border w-1/2">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log, idx) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-muted/50 transition-colors group cursor-pointer"
                                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                    >
                                        <td className="p-4">
                                            <div className="font-bold text-foreground text-sm">{new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="p-4 font-bold text-foreground">{log.user_name}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${log.action === 'LOGIN' || log.action === 'LOGOUT' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                log.action.includes('DELETE') || log.action.includes('REMOVE') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    log.action.includes('UPDATE') || log.action.includes('EDIT') ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                        'bg-muted text-muted-foreground border-border'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground font-mono text-xs max-w-xs group-hover:text-foreground transition-colors">
                                            <div className="truncate" title={log.details || ''}>
                                                {parseDetails(log.details).preview || '-'}
                                            </div>
                                            {expandedId === log.id && (
                                                <pre className="mt-2 whitespace-pre-wrap break-all bg-muted/30 border border-border rounded-lg p-3 text-[10px] text-muted-foreground">
                                                    {log.details || '-'}
                                                </pre>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Search size={48} />
                                            <p className="text-lg font-bold">No results found</p>
                                            <p className="text-sm">Try adjusting your search or filter criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
