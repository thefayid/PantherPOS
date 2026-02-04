import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertTriangle, Building, Upload, Trash2, Plus, Ban, RotateCcw, HelpCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { companyService } from '../services/companyService';
import type { CompanySettings as CompanySettingsType, VoidReason } from '../types/db';

const TABS = [
    { id: 'data', label: 'Company data' },
    { id: 'void', label: 'Void reasons' },
    { id: 'logo', label: 'My logo' },
    { id: 'reset', label: 'Reset database' }
];

export default function CompanySettings() {
    const [activeTab, setActiveTab] = useState('data');
    const [settings, setSettings] = useState<CompanySettingsType>({
        id: 1,
        name: '', tax_number: '', street_name: '', building_number: '',
        additional_street_name: '', plot_identification: '', district: '', postal_code: '',
        city: '', state: '', country: '', phone_number: '', email: '',
        bank_acc_number: '', bank_details: '', logo: ''
    });
    const [voidReasons, setVoidReasons] = useState<VoidReason[]>([]);
    const [newVoidReason, setNewVoidReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const s = await companyService.getSettings();
            if (s) setSettings(s);
            const v = await companyService.getVoidReasons();
            setVoidReasons(Array.isArray(v) ? v : []);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const handleSaveSettings = async () => {
        try {
            await companyService.saveSettings(settings);
            alert('Settings saved successfully.');
        } catch (error) {
            alert('Failed to save settings.');
        }
    };

    const handleAddVoidReason = async () => {
        if (!newVoidReason.trim()) return;
        await companyService.addVoidReason(newVoidReason);
        setNewVoidReason('');
        loadData();
    };

    const handleDeleteVoidReason = async (id: number) => {
        if (!confirm('Delete this reason?')) return;
        await companyService.deleteVoidReason(id);
        loadData();
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings({ ...settings, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResetDatabase = async () => {
        const confirm1 = confirm('DANGER: This will delete ALL business data (Bills, Customers, Sales, Stock). Are you absolutely sure?');
        if (!confirm1) return;
        const confirm2 = confirm('Final Warning: This action cannot be undone. All data will be wiped.');
        if (confirm2) {
            await companyService.resetDatabase();
            alert('Database reset complete. Please restart the application.');
        }
    };

    return (
        <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 p-5 border-b border-border bg-surface shadow-sm">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Management •</span>
                <span className="font-black text-xl tracking-tight">My Company</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border bg-surface px-4 gap-1">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Toolbar */}
            <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between px-6 h-14">
                <div className="flex items-center gap-4">
                    {activeTab === 'data' && (
                        <>
                            <button onClick={handleSaveSettings} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-glow transition-all">
                                <Save size={14} /> Save Changes
                            </button>
                            <button onClick={() => alert('Fill in your company details to appear on invoices.')} className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">
                                <HelpCircle size={14} /> Help
                            </button>
                        </>
                    )}
                </div>
                {isLoading && <div className="text-[10px] font-black text-primary animate-pulse tracking-widest uppercase">Syncing...</div>}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/5 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-surface border border-border rounded-2xl shadow-xl p-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {activeTab === 'data' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight border-b border-border pb-3 mb-6 flex items-center gap-2 text-foreground">
                                        <Building className="text-primary" size={20} />
                                        Company Identity
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">Company Name <span className="text-destructive font-black">*</span></label>
                                            <input
                                                className={`w-full p-3 border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm ${!settings.name ? 'border-destructive/30' : 'border-border'}`}
                                                value={settings.name}
                                                onChange={e => setSettings({ ...settings, name: e.target.value })}
                                                placeholder="Enter registered business name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">Tax Number (GSTIN)</label>
                                            <input
                                                className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm"
                                                value={settings.tax_number}
                                                onChange={e => setSettings({ ...settings, tax_number: e.target.value })}
                                                placeholder="e.g. 29ABCDE1234F1Z5"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">Street Address</label>
                                            <input
                                                className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm"
                                                value={settings.street_name}
                                                onChange={e => setSettings({ ...settings, street_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 col-span-2">
                                            <div>
                                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">Bulding / Floor</label>
                                                <input
                                                    className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm"
                                                    value={settings.building_number}
                                                    onChange={e => setSettings({ ...settings, building_number: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">City</label>
                                                <input
                                                    className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm"
                                                    value={settings.city}
                                                    onChange={e => setSettings({ ...settings, city: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">State</label>
                                            <input
                                                className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm"
                                                value={settings.state}
                                                onChange={e => setSettings({ ...settings, state: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">Country</label>
                                            <select
                                                className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm"
                                                value={settings.country}
                                                onChange={e => setSettings({ ...settings, country: e.target.value })}
                                            >
                                                <option value="India">India</option>
                                                <option value="USA">USA</option>
                                                <option value="UK">UK</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black tracking-tight border-b border-border pb-3 mb-6 text-foreground">Contact & Finances</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">Phone</label>
                                            <input
                                                className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm"
                                                value={settings.phone_number}
                                                onChange={e => setSettings({ ...settings, phone_number: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">Email</label>
                                            <input
                                                className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm"
                                                value={settings.email}
                                                onChange={e => setSettings({ ...settings, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">Bank Account Number</label>
                                            <input
                                                className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-sm"
                                                value={settings.bank_acc_number}
                                                onChange={e => setSettings({ ...settings, bank_acc_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 ml-1">Bank Details (Branch, IFSC)</label>
                                            <textarea
                                                className="w-full p-3 border border-border rounded-xl bg-background outline-none h-24 focus:ring-1 focus:ring-primary transition-all font-bold text-sm resize-none"
                                                value={settings.bank_details}
                                                onChange={e => setSettings({ ...settings, bank_details: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'void' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-black tracking-tight border-b border-border pb-3 mb-6 text-foreground">Void Reasons</h3>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 p-3 border border-border rounded-xl bg-background font-bold outline-none focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Enter reason for cancelling/voiding bills..."
                                        value={newVoidReason}
                                        onChange={e => setNewVoidReason(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddVoidReason()}
                                    />
                                    <Button onClick={handleAddVoidReason} className="font-black uppercase tracking-widest text-[10px]">
                                        <Plus size={14} className="mr-2" /> Add Reason
                                    </Button>
                                </div>
                                <div className="space-y-2 mt-4">
                                    {(voidReasons || []).map(vr => (
                                        <div key={vr.id} className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl hover:bg-muted/40 hover:border-primary/30 transition-all group">
                                            <span className="font-bold text-foreground">{vr.reason}</span>
                                            <button onClick={() => handleDeleteVoidReason(vr.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {voidReasons.length === 0 && (
                                        <div className="text-center py-12 bg-muted/5 border border-dashed border-border rounded-2xl">
                                            <p className="text-muted-foreground font-bold">No void reasons defined yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'logo' && (
                            <div className="space-y-8 flex flex-col items-center justify-center py-10">
                                <div className="w-full mb-4">
                                    <h3 className="text-lg font-black tracking-tight border-b border-border pb-3 text-foreground mb-6">Business Branding</h3>
                                </div>
                                <div className="w-80 h-80 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden bg-muted/20 shadow-inner group">
                                    {settings.logo ? (
                                        <>
                                            <img src={settings.logo} alt="Company Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <label className="p-3 bg-white text-black rounded-full cursor-pointer hover:scale-110 transition-transform"><Upload size={20} /><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto border border-border">
                                                <Building size={32} className="text-muted-foreground opacity-30" />
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground uppercase tracking-widest text-[10px]">No Logo Uploaded</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG or SVG formats</p>
                                            </div>
                                        </div>
                                    )}
                                    {!settings.logo && (
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleLogoUpload}
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="font-black uppercase tracking-widest text-[10px] px-8 py-3">
                                        <Upload size={14} className="mr-2" />
                                        {settings.logo ? 'Change Brand Image' : 'Select Business Image'}
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">* Standard square aspect ratio recommended (e.g. 512x512)</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reset' && (
                            <div className="space-y-8">
                                <h3 className="text-lg font-black tracking-tight border-b border-destructive/20 pb-3 mb-6 text-destructive flex items-center gap-2">
                                    <AlertTriangle size={20} />
                                    Security & System Reset
                                </h3>
                                <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-10 text-center space-y-6">
                                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive border border-destructive/20 shadow-inner">
                                        <Ban size={40} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xl text-foreground uppercase tracking-tight">Factory Reset</h4>
                                        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
                                            This will permanently clear all inventory records, sales history, customer databases, and system logs.
                                            <span className="block mt-2 font-bold text-destructive underline uppercase tracking-tighter">This action is permanent and cannot be reversed.</span>
                                        </p>
                                    </div>
                                    <Button variant="danger" onClick={handleResetDatabase} className="w-full max-w-xs mx-auto py-4 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/20">
                                        <RotateCcw size={16} className="mr-2" />
                                        Confirm Permanent Wipe
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
