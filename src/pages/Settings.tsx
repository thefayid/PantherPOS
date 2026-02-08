import React, { useState, useEffect } from 'react';
import { settingsService, type AppSettings } from '../services/settingsService';
import { databaseService } from '../services/databaseService';
import { dbStorage } from '../services/dbStorage';
import { eventBus } from '../utils/EventBus';
import { cloudService } from '../services/cloudService';
import {
    Store,
    CreditCard,
    Printer,
    MonitorCog,
    Database,
    Building2,
    MapPin,
    Phone,
    FileText,
    Hash,
    Banknote,
    ScanBarcode,
    Trash2,
    Plus,
    Cloud,
    Lock,
    Smartphone,
    Monitor,
    ChevronRight,
    Save,
    Sun,
    Moon
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useUI } from '../context/UIContext';
import { cn } from '../utils/cn';
import { permissionsService } from '../services/permissionsService';
import { ManagerPinModal } from '../components/ManagerPinModal';
import toast from 'react-hot-toast';

export default function Settings() {
    const { isTouchMode, setTouchMode } = useUI();
    const currentUser = permissionsService.getCurrentUser();
    const canManageSettings = permissionsService.can('MANAGE_SETTINGS', currentUser);
    const [isPinOpen, setIsPinOpen] = useState(false);
    const [overrideGranted, setOverrideGranted] = useState(false);

    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'BILLING' | 'HARDWARE' | 'SYSTEM'>('PROFILE');
    const [taxRates, setTaxRates] = useState<any[]>([]);
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<any>(null);

    useEffect(() => { loadSettings(); loadTaxRates(); }, []);

    const loadSettings = async () => { setSettings(await settingsService.getSettings()); };
    const loadTaxRates = async () => { setTaxRates(await settingsService.getTaxRates()); };

    const canEdit = canManageSettings || overrideGranted;

    const handleSaveSetting = async (key: keyof AppSettings, value: any) => {
        if (!settings) return;
        if (!canEdit) { setIsPinOpen(true); return; }
        setSettings({ ...settings, [key]: value });
        await settingsService.updateSetting(key, value);
    };

    const handleSaveTax = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;
        try {
            await settingsService.saveTaxRate(editingTax);
            setIsTaxModalOpen(false);
            loadTaxRates();
            toast.success('Tax rate saved');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save tax rate');
        }
    };

    const handleDeleteTax = async (id: number) => {
        if (!canEdit) return;
        if (confirm('Delete this tax rate?')) {
            await settingsService.deleteTaxRate(id);
            loadTaxRates();
            toast.success('Tax rate deleted');
        }
    };

    const handleBackup = async () => {
        if (!canEdit) { setIsPinOpen(true); return; }
        try {
            const msg = await databaseService.createBackup();
            toast.success(msg);
        } catch (error: any) {
            toast.error('Backup failed: ' + error.message);
        }
    };

    if (!settings) return (
        <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
        </div>
    );

    const SidebarItem = ({ id, icon: Icon, label, description }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all mb-1",
                activeTab === id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} />
                <div>
                    <div className="text-sm font-semibold leading-none">{label}</div>
                    <div className="text-[10px] opacity-70 mt-1">{description}</div>
                </div>
            </div>
            {activeTab === id && <ChevronRight size={14} />}
        </button>
    );

    const SectionTitle = ({ title }: { title: string }) => (
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            {title} <div className="h-px flex-1 bg-border/50"></div>
        </h3>
    );

    const InputField = ({ label, icon: Icon, value, field, type = "text", placeholder, onChange, className }: any) => (
        <div className={cn("space-y-1.5", className)}>
            <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
            <div className="relative group">
                {Icon && <Icon size={14} className="absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                <input
                    type={type}
                    value={value || ''}
                    onChange={onChange || ((e: any) => handleSaveSetting(field, type === 'number' ? parseFloat(e.target.value) : e.target.value))}
                    placeholder={placeholder}
                    disabled={!canEdit}
                    className={cn(
                        "w-full bg-background border border-border rounded-lg h-10 px-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                        Icon && "pl-9"
                    )}
                />
            </div>
        </div>
    );

    return (
        <div className="h-full flex bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-border flex flex-col bg-muted/10">
                <div className="p-6 border-b border-border/50">
                    <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                    <p className="text-xs text-muted-foreground mt-1">Version 1.0.0</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <SidebarItem id="PROFILE" icon={Store} label="Store Profile" description="Identity & Branding" />
                    <SidebarItem id="BILLING" icon={CreditCard} label="Billing & Tax" description="Invoices & Rules" />
                    <SidebarItem id="HARDWARE" icon={Printer} label="Hardware" description="Printers & Devices" />
                    <SidebarItem id="SYSTEM" icon={MonitorCog} label="System" description="Data & Preferences" />
                </div>

                {!canEdit && (
                    <div className="p-4 border-t border-border/50">
                        <Button size="sm" variant="secondary" onClick={() => setIsPinOpen(true)} className="w-full justify-start text-orange-500 border-orange-200 bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20">
                            <Lock size={14} className="mr-2" /> Unlock Editing
                        </Button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-surface">
                <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* --- TAB: STORE PROFILE --- */}
                    {activeTab === 'PROFILE' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Store Profile</h2>
                                <p className="text-muted-foreground">Manage your business identity and contact information.</p>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <SectionTitle title="Basic Information" />
                                <div className="grid grid-cols-2 gap-6">
                                    <InputField label="Store Name" icon={Building2} value={settings.store_name} field="store_name" placeholder="My Awesome Store" />
                                    <InputField label="Phone Number" icon={Phone} value={settings.store_phone} field="store_phone" placeholder="+91 98765 43210" />
                                </div>
                                <div className="mt-4">
                                    <InputField label="Store Address" icon={MapPin} value={settings.store_address} field="store_address" placeholder="123 Main St, City, State" />
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <SectionTitle title="Legal & Branding" />
                                <div className="grid grid-cols-2 gap-6">
                                    <InputField label="GSTIN / VAT Number" icon={FileText} value={settings.gst_no} field="gst_no" placeholder="29ABCDE1234F1Z5" />
                                    <div>
                                        <div className="flex gap-2 mb-1.5">
                                            <label className="text-[11px] font-medium text-muted-foreground">Store Logo URL</label>
                                            {settings.store_logo && <span className="text-[10px] text-green-500 font-bold">✓ Set</span>}
                                        </div>
                                        <input
                                            type="text"
                                            value={settings.store_logo || ''}
                                            onChange={e => handleSaveSetting('store_logo', e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm"
                                            placeholder="https://example.com/logo.png"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: BILLING & TAX --- */}
                    {activeTab === 'BILLING' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Billing Configuration</h2>
                                <p className="text-muted-foreground">Customize invoice numbering, prefixes, and tax rules.</p>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <SectionTitle title="Invoice Sequencing" />
                                <div className="grid grid-cols-4 gap-4">
                                    <InputField label="Prefix" icon={FileText} value={settings.invoice_prefix} field="invoice_prefix" placeholder="INV-" />
                                    <InputField label="Start No." icon={Hash} value={settings.invoice_start_number} field="invoice_start_number" type="number" placeholder="1001" />
                                    <InputField label="Currency" icon={Banknote} value={settings.currency_symbol} field="currency_symbol" placeholder="₹" />
                                    <InputField label="Barcode Prefix" icon={ScanBarcode} value={settings.barcode_prefix} field="barcode_prefix" placeholder="GEN" />
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <SectionTitle title="Tax Rates" />
                                    <Button size="sm" variant="secondary" onClick={() => { setEditingTax({ name: '', rate: 0 }); setIsTaxModalOpen(true); }} disabled={!canEdit}>
                                        <Plus size={14} className="mr-1" /> Add Tax
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {taxRates.map((tax) => (
                                        <div key={tax.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center font-bold text-xs shadow-sm">
                                                    {tax.rate}%
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{tax.name}</span>
                                                    {tax.is_default && <span className="text-[10px] text-primary font-bold uppercase">Default</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingTax(tax); setIsTaxModalOpen(true); }}><MonitorCog size={14} /></Button>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteTax(tax.id)}><Trash2 size={14} /></Button>
                                            </div>
                                        </div>
                                    ))}
                                    {taxRates.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">No tax rates defined.</div>}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <SectionTitle title="Footer & Terms" />
                                <textarea
                                    value={settings.invoice_footer || ''}
                                    onChange={e => handleSaveSetting('invoice_footer', e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                                    placeholder="Thank you for your business!"
                                />
                            </div>
                        </div>
                    )}

                    {/* --- TAB: HARDWARE --- */}
                    {activeTab === 'HARDWARE' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Hardware</h2>
                                <p className="text-muted-foreground">Configure printers, scales, and peripherals.</p>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <SectionTitle title="Receipt Printer" />
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-muted-foreground">Connection Type</label>
                                        <select
                                            value={settings.printer_type}
                                            onChange={e => handleSaveSetting('printer_type', e.target.value)}
                                            disabled={!canEdit}
                                            className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                                        >
                                            <option value="USB_SHARED">USB Shared Printer</option>
                                            <option value="NETWORK">Network (LAN/WiFi)</option>
                                            <option value="SERIAL">Serial Port (COM)</option>
                                        </select>
                                    </div>
                                    <InputField label={settings.printer_type === 'NETWORK' ? 'IP Address:Port' : 'Interface Path'} value={settings.printer_interface} field="printer_interface" placeholder={settings.printer_type === 'NETWORK' ? '192.168.1.100:9100' : '\\\\PC\\Printer'} />
                                </div>
                                <div className="grid grid-cols-2 gap-6 mt-4">
                                    <InputField label="Paper Width (mm)" value={settings.printer_width} field="printer_width" type="number" placeholder="58" />
                                    <div className="flex items-end">
                                        <Button onClick={() => window.electronAPI?.printRaw([0x1B, 0x40, ...new TextEncoder().encode('Test Print\n\n\n'), 0x1D, 0x56, 0x41, 0x03])} variant="secondary" className="w-full border-border"> Test Connectivity</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: SYSTEM --- */}
                    {activeTab === 'SYSTEM' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">System & Data</h2>
                                <p className="text-muted-foreground">App preferences and data management.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setTouchMode(!isTouchMode)} className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all text-left", isTouchMode ? "bg-primary/5 border-primary" : "bg-card border-border hover:bg-muted/50")}>
                                    <div className={cn("p-2 rounded-lg", isTouchMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Smartphone size={20} /></div>
                                    <div>
                                        <div className="font-bold text-sm">Touch Mode</div>
                                        <div className="text-xs text-muted-foreground">{isTouchMode ? 'Enabled' : 'Disabled'}</div>
                                    </div>
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => eventBus.emit('THEME_CHANGE', 'light')} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-slate-300 transition-all text-left group shadow-sm text-slate-900">
                                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600"><Sun size={20} /></div>
                                        <div>
                                            <div className="font-bold text-sm">Light Mode</div>
                                            <div className="text-xs text-slate-500">Bright workspace</div>
                                        </div>
                                    </button>

                                    <button onClick={() => eventBus.emit('THEME_CHANGE', 'dark')} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-slate-950 hover:border-slate-700 transition-all text-left group text-slate-100">
                                        <div className="p-2 rounded-lg bg-slate-800 text-slate-400"><Moon size={20} /></div>
                                        <div>
                                            <div className="font-bold text-sm">Dark Mode</div>
                                            <div className="text-xs text-slate-500">Easy on eyes</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <SectionTitle title="Cloud Synchronization" />
                                <div className="grid grid-cols-2 gap-6 mb-4">
                                    <InputField label="Server URL" value={cloudService.getConfig().serverUrl} field="serverUrl" placeholder="https://api.pos.com" icon={Cloud} />
                                    <InputField label="API Key" value={cloudService.getConfig().apiKey} field="apiKey" type="password" placeholder="••••••" icon={Lock} />
                                </div>
                                <div className="flex gap-3">
                                    <Button size="sm" onClick={() => cloudService.uploadData().then(r => toast.success(r.message))} className="flex-1 bg-blue-600 text-white hover:bg-blue-700 border-0">Push Data to Cloud</Button>
                                    <Button size="sm" variant="secondary" onClick={() => cloudService.downloadData().then(r => toast.success(r.message))} className="flex-1">Pull Data from Cloud</Button>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-sm">Database Management</h4>
                                    <p className="text-xs text-muted-foreground">Create local backups or reset system.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={handleBackup}>Create Backup</Button>
                                    <Button size="sm" variant="danger" onClick={() => { if (confirm('Clear ALL data? This cannot be undone.')) dbStorage.clear().then(() => window.location.reload()) }}>Factory Reset</Button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Config Modals */}
            <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title={editingTax?.id ? "Edit Tax Rate" : "Add Tax Rate"}>
                <form onSubmit={handleSaveTax} className="space-y-4 pt-2">
                    <InputField label="Name" value={editingTax?.name} onChange={(e: any) => setEditingTax({ ...editingTax, name: e.target.value })} placeholder="e.g. GST 18%" />
                    <InputField label="Rate percentage (%)" value={editingTax?.rate} onChange={(e: any) => setEditingTax({ ...editingTax, rate: parseFloat(e.target.value) })} type="number" placeholder="18" />
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <input type="checkbox" checked={editingTax?.is_default} onChange={e => setEditingTax({ ...editingTax, is_default: e.target.checked })} id="def_tax" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="def_tax" className="text-sm font-medium">Set as Default Rate</label>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsTaxModalOpen(false)} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1">Save Changes</Button>
                    </div>
                </form>
            </Modal>

            <ManagerPinModal
                isOpen={isPinOpen}
                onClose={() => setIsPinOpen(false)}
                minRole={permissionsService.getOverrideMinRole('MANAGE_SETTINGS')}
                title="Unlock Settings"
                description="Enter manager PIN to change these settings."
                onApproved={() => { setIsPinOpen(false); setOverrideGranted(true); }}
            />
        </div>
    );
}
