import React, { useState, useEffect } from 'react';
import { settingsService, type AppSettings } from '../services/settingsService';
import { databaseService } from '../services/databaseService';
import { dbStorage } from '../services/dbStorage';
import { eventBus } from '../utils/EventBus';
import { syncService } from '../services/syncService';
import { Receipt, Database, Percent, Trash2, Plus, Printer, Store, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useUI } from '../context/UIContext';
import { Smartphone, Monitor } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Settings() {
    const { isTouchMode, setTouchMode } = useUI();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'TAXES' | 'RECEIPT' | 'DATA'>('GENERAL');
    const [taxRates, setTaxRates] = useState<any[]>([]);
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<any>(null);

    useEffect(() => { loadSettings(); loadTaxRates(); }, []);

    const loadSettings = async () => { setSettings(await settingsService.getSettings()); };
    const loadTaxRates = async () => { setTaxRates(await settingsService.getTaxRates()); };

    const handleSaveSetting = async (key: keyof AppSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
        await settingsService.updateSetting(key, value);
    };

    const handleSaveTax = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await settingsService.saveTaxRate(editingTax);
            setIsTaxModalOpen(false);
            loadTaxRates();
        } catch (error) {
            console.error(error);
            alert('Failed to save tax rate');
        }
    };

    const handleDeleteTax = async (id: number) => {
        if (confirm('Delete this tax rate?')) {
            await settingsService.deleteTaxRate(id);
            loadTaxRates();
        }
    };

    const handleBackup = async () => {
        try {
            const msg = await databaseService.createBackup();
            alert(msg);
        } catch (error) {
            alert('Backup failed');
        }
    };

    if (!settings) return (
        <div className="p-8 text-foreground font-medium flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
            Loading Settings...
        </div>
    );

    const InputGroup = ({ label, value, field, type = "text", placeholder = "" }: any) => (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{label}</label>
            <input
                type={type}
                className="w-full bg-muted/20 border border-border text-foreground p-3 rounded-xl focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-bold placeholder:text-muted-foreground/30 text-sm"
                value={value || ''}
                onChange={(e) => handleSaveSetting(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6">
                <h1 className="text-3xl font-black tracking-tight">Settings</h1>
                <p className="text-muted-foreground font-medium">System Configuration & Preferences</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-72 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 shrink-0">
                    {[
                        { id: 'GENERAL', label: 'Store General', icon: Store },
                        { id: 'TAXES', label: 'Tax Rules', icon: Percent },
                        { id: 'RECEIPT', label: 'Receipt Template', icon: Receipt },
                        { id: 'DATA', label: 'Backup & Data', icon: Database },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all whitespace-nowrap lg:whitespace-normal group ${activeTab === tab.id
                                ? 'bg-primary/10 text-primary font-black border border-primary/30 shadow-sm'
                                : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
                                }`}
                        >
                            <tab.icon size={18} className={`${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}`} />
                            <span className="text-xs uppercase tracking-widest font-black">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-surface rounded-2xl border border-border p-8 overflow-y-auto shadow-xl custom-scrollbar">

                    {/* GENERAL SETTINGS */}
                    {activeTab === 'GENERAL' && (
                        <div className="max-w-2xl flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col gap-6">
                                <h2 className="text-lg font-black border-b border-border/50 pb-3 text-foreground uppercase tracking-tight">Store Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="Store Name" value={settings.store_name} field="store_name" />
                                    <InputGroup label="Phone Number" value={settings.store_phone} field="store_phone" />
                                </div>
                                <InputGroup label="Address (Main Branch)" value={settings.store_address} field="store_address" />
                                <InputGroup label="GSTIN / VAT ID" value={settings.gst_no} field="gst_no" />
                            </div>

                            <div className="flex flex-col gap-6">
                                <h2 className="text-lg font-black border-b border-border/50 pb-3 text-foreground uppercase tracking-tight">Visual Identity</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { eventBus.emit('THEME_CHANGE', 'dark'); }}
                                        className="p-6 border rounded-2xl bg-slate-900 border-slate-800 relative overflow-hidden group ring-2 ring-transparent focus:ring-primary hover:border-primary/50 transition-all text-left shadow-lg"
                                    >
                                        <div className="font-black text-slate-100 relative z-10 text-sm uppercase tracking-widest">Obsidian Dark</div>
                                        <div className="text-[10px] text-slate-400 relative z-10 font-bold mt-1">PRO OLED OPTIMIZED</div>
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-30" />
                                        <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest">DEFAULT</div>
                                    </button>

                                    <button
                                        onClick={() => { eventBus.emit('THEME_CHANGE', 'light'); }}
                                        className="p-6 border border-border rounded-2xl bg-white text-left hover:opacity-100 relative overflow-hidden transition-all shadow-md group"
                                    >
                                        <div className="font-black text-slate-900 relative z-10 text-sm uppercase tracking-widest">Bubblegum Light</div>
                                        <div className="text-[10px] text-slate-500 relative z-10 font-bold mt-1">CLEAN & AIRY</div>
                                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-20" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 border-t border-border/50 pt-6">
                                <h2 className="text-lg font-black border-b border-border/50 pb-3 text-foreground uppercase tracking-tight">System Optimization</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setTouchMode(false)}
                                        className={cn(
                                            "p-6 border rounded-2xl transition-all text-left flex flex-col gap-2 relative overflow-hidden group",
                                            !isTouchMode
                                                ? "bg-primary/10 border-primary shadow-sm"
                                                : "bg-surface border-border hover:border-primary/30"
                                        )}
                                    >
                                        <Monitor size={24} className={!isTouchMode ? "text-primary" : "text-muted-foreground"} />
                                        <div>
                                            <div className="font-black text-sm uppercase tracking-widest text-foreground">Normal Mode</div>
                                            <div className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Desktop & Mouse Optimized</div>
                                        </div>
                                        {!isTouchMode && <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest">ACTIVE</div>}
                                    </button>

                                    <button
                                        onClick={() => setTouchMode(true)}
                                        className={cn(
                                            "p-6 border rounded-2xl transition-all text-left flex flex-col gap-2 relative overflow-hidden group",
                                            isTouchMode
                                                ? "bg-primary/10 border-primary shadow-sm"
                                                : "bg-surface border-border hover:border-primary/30"
                                        )}
                                    >
                                        <Smartphone size={24} className={isTouchMode ? "text-primary" : "text-muted-foreground"} />
                                        <div>
                                            <div className="font-black text-sm uppercase tracking-widest text-foreground">Touch Screen</div>
                                            <div className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Tablet & Kiosk Optimized</div>
                                        </div>
                                        {isTouchMode && <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest">ACTIVE</div>}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 border-t border-border/50 pt-6">
                                <h2 className="text-lg font-black border-b border-border/50 pb-3 text-foreground uppercase tracking-tight">Software Update</h2>
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                                    <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
                                        <RefreshCw size={24} />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="font-black text-foreground uppercase tracking-tight text-sm">System Version</div>
                                        <div className="text-[10px] text-muted-foreground font-medium mt-1">
                                            Currently running version <span className="text-emerald-500 font-bold">1.0.0</span>. Check for latest features and security patches.
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.electronAPI) {
                                                window.electronAPI.checkUpdates();
                                            } else {
                                                alert("Updates only available in Desktop App");
                                            }
                                        }}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                                    >
                                        Check For Updates
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAX SETTINGS */}
                    {activeTab === 'TAXES' && (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end border-b border-border/50 pb-6">
                                <div>
                                    <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Tax Configuration</h2>
                                    <p className="text-xs text-muted-foreground font-medium mt-1">Define regional tax rules and applicability</p>
                                </div>
                                <button
                                    onClick={() => { setEditingTax({ name: '', rate: 0 }); setIsTaxModalOpen(true); }}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:brightness-110 text-primary-foreground rounded-xl shadow-glow font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    <Plus size={16} /> New Tax Rate
                                </button>
                            </div>

                            <div className="rounded-2xl overflow-hidden border border-border bg-muted/5 shadow-inner">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="p-5 border-b border-border">Description</th>
                                            <th className="p-5 border-b border-border text-center">Value (%)</th>
                                            <th className="p-5 border-b border-border text-center">Status</th>
                                            <th className="p-5 border-b border-border text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {taxRates.map((r) => (
                                            <tr key={r.id} className="hover:bg-primary/5 transition-colors group">
                                                <td className="p-5 font-bold text-foreground">{r.name}</td>
                                                <td className="p-5 text-center font-black text-primary">{r.rate}%</td>
                                                <td className="p-5 text-center">
                                                    {r.is_default ? (
                                                        <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest">Default</span>
                                                    ) : (
                                                        <span className="text-[8px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border font-black uppercase tracking-widest">Inactive</span>
                                                    )}
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingTax(r); setIsTaxModalOpen(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"><Plus size={16} className="rotate-45" /></button>
                                                        <button onClick={() => handleDeleteTax(r.id)} className="p-2.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {taxRates.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-30">
                                                        <Percent size={48} strokeWidth={1} />
                                                        <p className="font-black text-xs uppercase tracking-widest">No tax rates defined</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* RECEIPT SETTINGS */}
                    {activeTab === 'RECEIPT' && (
                        <div className="max-w-2xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-lg font-black border-b border-border/50 pb-3 text-foreground uppercase tracking-tight">Receipt Branding</h2>
                                <p className="text-xs text-muted-foreground font-medium mt-1">Configure thermal and digital receipt output</p>
                            </div>

                            <InputGroup label="Receipt Header (Welcome Message)" value={settings.receipt_header} field="receipt_header" placeholder="Welcome to our store!" />

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Receipt Footer / Policy Note</label>
                                <textarea
                                    className="w-full h-40 p-4 bg-muted/20 text-foreground border border-border rounded-2xl resize-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-bold placeholder:text-muted-foreground/30 text-sm shadow-inner"
                                    value={settings.invoice_footer || ''}
                                    onChange={(e) => handleSaveSetting('invoice_footer', e.target.value)}
                                    placeholder="e.g. Items purchased are non-refundable."
                                />
                            </div>

                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-5 shadow-sm">
                                <div className="p-4 bg-primary rounded-xl text-primary-foreground shadow-glow">
                                    <Printer size={28} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-black text-foreground uppercase tracking-tight text-sm">Hardware Link</div>
                                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">
                                        Printer detection is handled automatically. Adjust detailed peripheral settings in the <span className="text-primary font-bold">Hardware</span> tab for advanced routing.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DATA BACKUP */}
                    {activeTab === 'DATA' && (
                        <div className="max-w-2xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-lg font-black border-b border-border/50 pb-3 text-foreground uppercase tracking-tight">Safety & Portability</h2>
                                <p className="text-xs text-muted-foreground font-medium mt-1">Maintain ownership of your commercial data</p>
                            </div>

                            <div className="p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl flex flex-col gap-6 shadow-sm">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/30 shadow-inner">
                                        <Database size={28} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-blue-700 dark:text-blue-100 tracking-tight uppercase">System Snapshot</div>
                                        <div className="text-xs text-blue-800/60 dark:text-blue-200/60 font-medium">Generate a complete database dump for manual recovery.</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleBackup}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                >
                                    Initialize Backup
                                </button>
                            </div>

                            <div className="p-8 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl flex flex-col gap-8 shadow-sm">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-500/30 shadow-inner">
                                        <Database size={28} className="rotate-180" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-purple-700 dark:text-purple-100 tracking-tight uppercase">Multi-Term Sync</div>
                                        <div className="text-xs text-purple-800/60 dark:text-purple-200/60 font-medium">Replicate cloud/server data to this local terminal.</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black text-purple-800 dark:text-purple-200 uppercase tracking-widest ml-1">Terminal Gateway IP</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 bg-background border border-purple-500/30 text-foreground p-3.5 rounded-xl focus:border-purple-500 focus:outline-none transition-all font-mono font-bold text-sm"
                                                placeholder="0.0.0.0"
                                                defaultValue={syncService.getServerIp()}
                                                onBlur={(e) => syncService.setServerIp(e.target.value)}
                                            />
                                            <button
                                                onClick={async (e) => {
                                                    const btn = e.currentTarget;
                                                    const originalText = btn.innerText;
                                                    btn.disabled = true;
                                                    btn.innerText = 'WAITING...';

                                                    const result = await syncService.syncFromPc();
                                                    if (result.success) {
                                                        alert(result.message);
                                                        window.location.reload();
                                                    } else {
                                                        alert(result.message);
                                                        btn.disabled = false;
                                                        btn.innerText = originalText;
                                                    }
                                                }}
                                                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
                                            >
                                                Cloud Pull
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-2xl flex items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <Trash2 size={24} className="text-destructive opacity-30" />
                                    <div>
                                        <div className="font-black text-foreground uppercase tracking-tight text-xs">Clear Local Storage</div>
                                        <div className="text-[10px] text-muted-foreground font-medium">Wipe cache and local DB instance (Hard Reset).</div>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (confirm('Critical: This will wipe ALL cached data on this terminal. Continue?')) {
                                            localStorage.removeItem('pos_db_web');
                                            await dbStorage.clear();
                                            window.location.reload();
                                        }
                                    }}
                                    className="px-4 py-2 border border-destructive/50 text-destructive hover:bg-destructive hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Execute
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tax Rate Modal */}
            <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title={editingTax?.id ? "Update Tax Protocol" : "New Tax protocol"}>
                <form onSubmit={handleSaveTax} className="flex flex-col gap-6 pt-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Identifer</label>
                        <input className="w-full bg-muted/20 border border-border rounded-xl p-4 text-foreground font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner" value={editingTax?.name || ''} onChange={e => setEditingTax({ ...editingTax, name: e.target.value })} placeholder="e.g. Standard GST" required />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Percentage (%)</label>
                        <input type="number" step="0.01" className="w-full bg-muted/20 border border-border rounded-xl p-4 text-foreground font-black focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner" value={editingTax?.rate || ''} onChange={e => setEditingTax({ ...editingTax, rate: parseFloat(e.target.value) })} placeholder="0.00" required />
                    </div>
                    <div className="flex items-center gap-4 bg-muted/30 p-5 rounded-2xl border border-border cursor-pointer transition-all hover:bg-primary/5 group" onClick={() => setEditingTax({ ...editingTax, is_default: !editingTax?.is_default })}>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingTax?.is_default ? 'bg-primary border-primary shadow-glow' : 'border-border bg-background'}`}>
                            {editingTax?.is_default && <Check size={16} className="text-primary-foreground font-black" />}
                        </div>
                        <label className="font-black text-foreground cursor-pointer select-none text-xs uppercase tracking-tight">Assign as Primary Default Rate</label>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsTaxModalOpen(false)} className="flex-1 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                        <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-glow">Commit Changes</Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
}
