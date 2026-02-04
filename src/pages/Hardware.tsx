import { useState, useEffect } from 'react';
import { Printer, Power, CheckCircle2, AlertCircle, Store, Image, Upload, FileText, Trash2, Scale } from 'lucide-react';
import { Button } from '../components/Button';
import { settingsService, type AppSettings } from '../services/settingsService';
import { printerService } from '../services/printerService';
import { scaleService } from '../services/scaleService';

export default function Hardware() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setSettings(await settingsService.getSettings());
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load hardware settings");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const update = async (key: keyof AppSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
        try {
            await settingsService.updateSetting(key, value);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTestPrint = async () => {
        if (!settings) return;
        try {
            const res = await printerService.printReceipt({ bill_no: 'TEST', date: new Date().toISOString(), total: 0 });
            if (res.success) alert('Test print successful');
            else alert('Error: ' + res.error);
        } catch {
            alert('Failed to send test print');
        }
    };

    const handleTestScale = async () => {
        try {
            const res = await scaleService.readWeight();
            if (res.success) alert(`Current Weight: ${res.weight}`);
            else alert(`Scale Error: ${res.error}`);
        } catch {
            alert('Failed to connect to scale');
        }
    };

    if (loading) return <div className="p-8 text-foreground font-medium flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full"></div> Loading Hardware Settings...</div>;
    if (error || !settings) return <div className="p-8 text-destructive font-bold flex items-center gap-2"><AlertCircle size={20} /> Error: {error}</div>;

    const InputGroup = ({ label, value, field, type = "text", placeholder = "", rows }: any) => (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{label}</label>
            {rows ? (
                <textarea
                    className="w-full min-h-[100px] p-4 bg-muted/20 text-foreground border border-border rounded-xl focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-bold resize-none placeholder:text-muted-foreground/30 text-sm"
                    value={value || ''}
                    onChange={(e) => update(field, e.target.value)}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    className="w-full h-12 px-4 bg-muted/20 text-foreground border border-border rounded-xl focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-bold placeholder:text-muted-foreground/30 text-sm"
                    value={value || ''}
                    onChange={(e) => update(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    placeholder={placeholder}
                />
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6">
                <h1 className="text-3xl font-black tracking-tight text-foreground">Hardware Settings</h1>
                <p className="text-muted-foreground font-medium">Configure POS Peripherals & Diagnostics</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="max-w-4xl flex flex-col gap-6 pb-20">

                    {/* THERMAL PRINTER */}
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
                                <Printer size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-foreground">Thermal Printer</h2>
                                <p className="text-xs text-muted-foreground font-medium">Configure receipt printer settings</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted/10 rounded-2xl border border-border/50">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black border transition-colors ${settings.printer_enabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                                {settings.printer_enabled ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {settings.printer_enabled ? 'PRINTER READY' : 'PRINTER DISABLED'}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    onClick={() => update('printer_enabled', !settings.printer_enabled)}
                                    variant={settings.printer_enabled ? 'secondary' : 'primary'}
                                    className={`flex-1 sm:flex-none font-black ${settings.printer_enabled ? 'hover:bg-destructive hover:text-white' : 'shadow-glow'}`}
                                >
                                    <Power size={14} className="mr-2" /> {settings.printer_enabled ? 'Disable' : 'Enable'}
                                </Button>
                                {settings.printer_enabled && (
                                    <Button onClick={handleTestPrint} variant="ghost" className="flex-1 sm:flex-none font-bold text-xs opacity-70 hover:opacity-100 uppercase tracking-tighter">
                                        Test Print
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* WEIGHING SCALE */}
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 shadow-inner">
                                    <Scale size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground">Weighing Scale</h2>
                                    <p className="text-xs text-muted-foreground font-medium">Connect Serial/USB Scale</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-xl border border-border shadow-sm">
                                <label htmlFor="scale_toggle" className="text-[10px] font-black text-muted-foreground cursor-pointer select-none tracking-widest">ENABLE</label>
                                <input
                                    id="scale_toggle"
                                    type="checkbox"
                                    checked={settings.scale_enabled}
                                    onChange={(e) => update('scale_enabled', e.target.checked)}
                                    className="w-5 h-5 accent-primary cursor-pointer rounded-lg"
                                />
                            </div>
                        </div>

                        {settings.scale_enabled && (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="Serial Port" value={settings.scale_port} field="scale_port" placeholder="COM1" />
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Baud Rate</label>
                                        <select
                                            value={settings.scale_baud_rate}
                                            onChange={e => update('scale_baud_rate', parseInt(e.target.value))}
                                            className="w-full h-12 px-4 bg-muted/20 text-foreground border border-border rounded-xl focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-black text-sm appearance-none cursor-pointer"
                                        >
                                            {[2400, 4800, 9600, 19200, 38400, 57600, 115200].map(b => (
                                                <option key={b} value={b} className="bg-surface text-foreground">{b} bps</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <Button variant="secondary" onClick={handleTestScale} className="w-full font-black bg-muted/30 hover:bg-muted/50 border border-border/50 text-foreground transition-all">
                                    Test Scale Connectivity
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* STORE IDENTITY */}
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                                <Store size={20} />
                            </div>
                            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Store Identity</h2>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Store Name" value={settings.store_name} field="store_name" />
                                <InputGroup label="Store GSTIN" value={settings.gst_no} field="gst_no" />
                            </div>
                            <InputGroup label="Address" value={settings.store_address} field="store_address" rows={true} />
                        </div>
                    </div>

                    {/* BUSINESS LOGO */}
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-400 border border-blue-400/20 shadow-inner">
                                <Image size={20} />
                            </div>
                            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Business Logo</h2>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <div className="w-40 h-40 border-2 border-dashed border-border/50 rounded-2xl flex items-center justify-center bg-muted/20 overflow-hidden relative group shrink-0 shadow-inner">
                                {settings.store_logo ? (
                                    <>
                                        <img src={settings.store_logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                        <button
                                            onClick={() => update('store_logo', '')}
                                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="text-red-500" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                                        <Upload size={32} strokeWidth={1.5} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No Logo</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 w-full">
                                <InputGroup label="Logo URL (Base64)" value={settings.store_logo} field="store_logo" placeholder="Paste Base64 Image string here..." />
                                <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-relaxed">
                                        Pro Tip: Use a Base64 string for maximum offline reliability across all terminals.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INVOICE TERMS */}
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-yellow-600/10 flex items-center justify-center text-yellow-600 border border-yellow-600/20 shadow-inner">
                                <FileText size={20} />
                            </div>
                            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Invoice Terms & Conditions</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Terms (Detailed)" value={settings.invoice_terms} field="invoice_terms" rows={true} />
                            <InputGroup label="Footer (Greeting)" value={settings.invoice_footer} field="invoice_footer" rows={true} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
