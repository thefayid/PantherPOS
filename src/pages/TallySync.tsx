
import { useState, useEffect } from 'react';
import {
    RefreshCw,
    Wifi,
    WifiOff,
    Settings,
    FileText,
    UploadCloud,
    DownloadCloud,
    CheckCircle,
    XCircle,
    Server,
    Activity,
    ArrowRight
} from 'lucide-react';
import { tallyService } from '../services/tally/TallyService';
import { Button } from '../components/Button';
import { toast } from 'react-hot-toast';

export default function TallySync() {
    const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTED' | 'SYNCING'>('DISCONNECTED');
    const [config, setConfig] = useState(tallyService.getConfig());
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CONFIG' | 'LOGS'>('DASHBOARD');
    const [syncStats, setSyncStats] = useState({
        pendingVouchers: 12,
        failedVouchers: 2,
        lastSync: 'Unknown'
    });

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        const res = await tallyService.checkConnection();
        setStatus(res.connected ? 'CONNECTED' : 'DISCONNECTED');
    };

    const handleConnect = async () => {
        setStatus('SYNCING');
        toast.loading("Connecting to Tally...", { id: 'tally-conn' });

        try {
            const res = await tallyService.checkConnection();
            if (res.connected) {
                setStatus('CONNECTED');
                toast.success(`Connected to Tally!`, { id: 'tally-conn' });
            } else {
                setStatus('ERROR');
                toast.error(`Connection Failed: ${res.error}`, { id: 'tally-conn', duration: 5000 });
            }
        } catch (e) {
            setStatus('ERROR');
            toast.error("Unexpected Error", { id: 'tally-conn' });
        }
    };

    const handleSaveConfig = () => {
        tallyService.saveConfig(config);
        toast.success("Configuration Saved");
        checkStatus();
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-hidden">

            {/* Header */}
            <div className="shrink-0 p-6 border-b border-border bg-surface flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase flex items-center gap-3">
                        Tally Integration
                        <span className={`text-[10px] px-3 py-1 border rounded-full tracking-widest font-black uppercase flex items-center gap-2 ${status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                            {status === 'CONNECTED' ? <Wifi size={12} /> : <WifiOff size={12} />}
                            {status}
                        </span>
                    </h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                        {config.tallyUrl} • {config.targetCompany || 'No Company Selected'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setActiveTab('DASHBOARD')} variant={activeTab === 'DASHBOARD' ? 'primary' : 'secondary'} size="sm">Dashboard</Button>
                    <Button onClick={() => setActiveTab('CONFIG')} variant={activeTab === 'CONFIG' ? 'primary' : 'secondary'} size="sm">Configuration</Button>
                    <Button onClick={() => setActiveTab('LOGS')} variant={activeTab === 'LOGS' ? 'primary' : 'secondary'} size="sm">Logs</Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">

                {/* DASHBOARD TAB */}
                {activeTab === 'DASHBOARD' && (
                    <div className="space-y-6 max-w-5xl mx-auto">

                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Connection Card */}
                            <div className="p-6 rounded-3xl bg-surface border border-border shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Server size={100} />
                                </div>
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Connection</h3>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${status === 'CONNECTED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">{status === 'CONNECTED' ? 'Online' : 'Offline'}</p>
                                        <p className="text-xs text-muted-foreground">{new URL(config.tallyUrl).port ? `Port: ${new URL(config.tallyUrl).port}` : 'Default Port'}</p>
                                    </div>
                                </div>
                                <Button onClick={handleConnect} disabled={status === 'SYNCING'} className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                                    {status === 'SYNCING' ? 'Checking...' : 'Retry Connection'}
                                </Button>
                            </div>

                            {/* Pending Sync */}
                            <div className="p-6 rounded-3xl bg-surface border border-border shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <UploadCloud size={100} />
                                </div>
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Pending Uploads</h3>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-4xl font-black">{syncStats.pendingVouchers}</span>
                                    <span className="text-xs font-bold text-muted-foreground mb-1.5 uppercase">Vouchers</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mb-6">Waiting to be pushed to Tally</p>
                                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                                    Push Data Now
                                </Button>
                            </div>

                            {/* Errors */}
                            <div className="p-6 rounded-3xl bg-surface border border-border shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <XCircle size={100} />
                                </div>
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Sync Errors</h3>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-4xl font-black text-destructive">{syncStats.failedVouchers}</span>
                                    <span className="text-xs font-bold text-muted-foreground mb-1.5 uppercase">Failed</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mb-6">Requires manual attention</p>
                                <Button variant="secondary" className="w-full text-xs uppercase font-bold">
                                    View Error Log
                                </Button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="rounded-3xl bg-surface border border-border shadow-xl overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/5 flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest">Master Sync Status</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-primary text-[10px] uppercase font-bold"
                                    onClick={async () => {
                                        toast.loading("Syncing Masters...", { id: 'sync-masters' });
                                        const res = await tallyService.syncMasters();
                                        if (res.status === 'SUCCESS') {
                                            toast.success(`Synced ${res.count} ledgers!`, { id: 'sync-masters' });
                                        } else {
                                            toast.error(res.message, { id: 'sync-masters' });
                                        }
                                    }}
                                >
                                    <RefreshCw size={12} className="mr-2" /> Sync Masters
                                </Button>
                            </div>
                            <div className="p-0">
                                <div className="grid grid-cols-4 gap-4 p-4 text-[10px] font-bold text-muted-foreground border-b border-border/50 uppercase tracking-wider">
                                    <span>Master Type</span>
                                    <span>Last Sync</span>
                                    <span>Status</span>
                                    <span>Count</span>
                                </div>
                                {[
                                    { type: 'Ledgers (Customers)', time: '10 mins ago', status: 'Success', count: 145 },
                                    { type: 'Stock Items', time: '10 mins ago', status: 'Success', count: 850 },
                                    { type: 'Tax Ledgers', time: '2 days ago', status: 'Warning', count: 4 },
                                ].map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-4 gap-4 p-4 text-xs font-medium border-b border-border/50 hover:bg-muted/5 transition-colors">
                                        <span className="font-bold text-foreground">{item.type}</span>
                                        <span>{item.time}</span>
                                        <span className={item.status === 'Success' ? 'text-emerald-500' : 'text-orange-500'}>{item.status}</span>
                                        <span>{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CONFIG TAB */}
                {activeTab === 'CONFIG' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="p-6 rounded-3xl bg-surface border border-border shadow-xl">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Settings size={20} className="text-primary" />
                                Connection Settings
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Tally API URL</label>
                                    <input
                                        type="text"
                                        value={config.tallyUrl}
                                        onChange={(e) => setConfig({ ...config, tallyUrl: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:border-primary focus:outline-none font-mono"
                                        placeholder="http://localhost:9000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Target Tally Company Name</label>
                                    <input
                                        type="text"
                                        value={config.targetCompany}
                                        onChange={(e) => setConfig({ ...config, targetCompany: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:border-primary focus:outline-none"
                                        placeholder="e.g., My Company (FY 24-25)"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">* Should match exactly with Tally open company</p>
                                </div>
                                <div className="flex items-center gap-4 py-2">
                                    <input
                                        type="checkbox"
                                        checked={config.autoSync}
                                        onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                    <label className="text-sm font-medium">Auto-Sync Vouchers on save</label>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end gap-3">
                                    <Button onClick={handleSaveConfig} className="bg-primary text-primary-foreground shadow-glow">Save Configuration</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* LOGS TAB */}
                {activeTab === 'LOGS' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="p-12 text-center text-muted-foreground">
                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold">Log viewer coming soon...</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
