import { Settings2, Maximize2, Type, Eye, EyeOff, LayoutGrid, Barcode, QrCode } from 'lucide-react';

export interface LabelConfig {
    width: number;
    height: number;
    fontSize: number;
    showName: boolean;
    showPrice: boolean;
    columns: number;
    gap: number;
    barcodeType: '1D' | '2D';
}

interface LabelDesignerProps {
    config: LabelConfig;
    onChange: (config: LabelConfig) => void;
}

export default function LabelDesigner({ config, onChange }: LabelDesignerProps) {
    const updateConfig = (key: keyof LabelConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <Settings2 size={18} className="text-primary" />
                <h3 className="font-black text-sm tracking-wide uppercase text-foreground">Label Designer</h3>
            </div>

            <div className="p-4 space-y-6">
                {/* Barcode Type */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Barcode size={12} /> Barcode Type
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateConfig('barcodeType', '1D')}
                            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-2 ${config.barcodeType === '1D' ? 'bg-primary/10 border-primary/50 text-primary shadow-sm' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                                }`}
                        >
                            <Barcode size={24} />
                            Code 128 (1D)
                        </button>
                        <button
                            onClick={() => updateConfig('barcodeType', '2D')}
                            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-2 ${config.barcodeType === '2D' ? 'bg-primary/10 border-primary/50 text-primary shadow-sm' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                                }`}
                        >
                            <QrCode size={24} />
                            QR Code (2D)
                        </button>
                    </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Maximize2 size={12} /> Dimensions (px)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground">Width</span>
                            <input
                                type="number"
                                value={config.width}
                                onChange={e => updateConfig('width', parseInt(e.target.value))}
                                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 outline-none transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground">Height</span>
                            <input
                                type="number"
                                value={config.height}
                                onChange={e => updateConfig('height', parseInt(e.target.value))}
                                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 outline-none transition-all font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid Settings */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <LayoutGrid size={12} /> Grid Layout
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground">Columns</span>
                            <select
                                value={config.columns}
                                onChange={e => updateConfig('columns', parseInt(e.target.value))}
                                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 outline-none appearance-none cursor-pointer font-bold"
                            >
                                {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c} className="bg-surface text-foreground">{c} Columns</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground">Gap</span>
                            <input
                                type="number"
                                value={config.gap}
                                onChange={e => updateConfig('gap', parseInt(e.target.value))}
                                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 outline-none transition-all font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Typography */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Type size={12} /> Typography
                    </label>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground">Base Font Size</span>
                        <input
                            type="range"
                            min="8"
                            max="24"
                            value={config.fontSize}
                            onChange={e => updateConfig('fontSize', parseInt(e.target.value))}
                            className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                            <span>8px</span>
                            <span className="text-primary font-black">{config.fontSize}px</span>
                            <span>24px</span>
                        </div>
                    </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Eye size={12} /> Visibility
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateConfig('showName', !config.showName)}
                            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-black transition-all flex items-center justify-center gap-2 ${config.showName ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-muted/30 border-border text-muted-foreground'
                                }`}
                        >
                            {config.showName ? <Eye size={14} /> : <EyeOff size={14} />} Name
                        </button>
                        <button
                            onClick={() => updateConfig('showPrice', !config.showPrice)}
                            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-black transition-all flex items-center justify-center gap-2 ${config.showPrice ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-muted/30 border-border text-muted-foreground'
                                }`}
                        >
                            {config.showPrice ? <Eye size={14} /> : <EyeOff size={14} />} Price
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-muted/20 border-t border-border mt-4">
                <p className="text-[10px] text-muted-foreground leading-relaxed italic font-medium">
                    * Tip: Use 1 column for Thermal Label printers and 4 columns for A4 sticky sheets.
                </p>
            </div>
        </div>
    );
}
