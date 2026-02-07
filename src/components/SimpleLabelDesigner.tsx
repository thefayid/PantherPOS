import React from 'react';

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

interface SimpleLabelDesignerProps {
    config: LabelConfig;
    onChange: (config: LabelConfig) => void;
}

export default function SimpleLabelDesigner({ config, onChange }: SimpleLabelDesignerProps) {
    const handleChange = (key: keyof LabelConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="font-bold text-lg">Label Settings</h3>

            <div className="space-y-2">
                <label className="text-sm font-medium">Width (px)</label>
                <input
                    type="number"
                    value={config.width}
                    onChange={e => handleChange('width', Number(e.target.value))}
                    className="w-full border rounded p-2"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Height (px)</label>
                <input
                    type="number"
                    value={config.height}
                    onChange={e => handleChange('height', Number(e.target.value))}
                    className="w-full border rounded p-2"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Font Size (px)</label>
                <input
                    type="number"
                    value={config.fontSize}
                    onChange={e => handleChange('fontSize', Number(e.target.value))}
                    className="w-full border rounded p-2"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Columns</label>
                <input
                    type="number"
                    value={config.columns}
                    onChange={e => handleChange('columns', Number(e.target.value))}
                    className="w-full border rounded p-2"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Gap (px)</label>
                <input
                    type="number"
                    value={config.gap}
                    onChange={e => handleChange('gap', Number(e.target.value))}
                    className="w-full border rounded p-2"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={config.showName}
                    onChange={e => handleChange('showName', e.target.checked)}
                    id="showName"
                />
                <label htmlFor="showName" className="text-sm font-medium">Show Name</label>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={config.showPrice}
                    onChange={e => handleChange('showPrice', e.target.checked)}
                    id="showPrice"
                />
                <label htmlFor="showPrice" className="text-sm font-medium">Show Price</label>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Barcode Type</label>
                <select
                    value={config.barcodeType}
                    onChange={e => handleChange('barcodeType', e.target.value as '1D' | '2D')}
                    className="w-full border rounded p-2"
                >
                    <option value="1D">1D Barcode</option>
                    <option value="2D">QR Code</option>
                </select>
            </div>
        </div>
    );
}
