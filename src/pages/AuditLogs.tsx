import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { auditService, type AuditLogEntry } from '../services/auditService';

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

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

    const filteredLogs = logs.filter(log =>
        log.user_name.toLowerCase().includes(filter.toLowerCase()) ||
        log.action.toLowerCase().includes(filter.toLowerCase()) ||
        log.details.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                    <p className="text-muted-foreground">System security and activity history</p>
                </div>
                <button
                    onClick={loadLogs}
                    className="p-3 bg-surface hover:bg-muted text-foreground rounded-xl border border-border transition-all shadow-sm group"
                >
                    <RefreshCw size={20} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                </button>
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
                                    <tr key={idx} className="hover:bg-muted/50 transition-colors group">
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
                                        <td className="p-4 text-muted-foreground font-mono text-xs truncate max-w-xs group-hover:text-foreground transition-colors" title={log.details || ''}>
                                            {log.details || '-'}
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
