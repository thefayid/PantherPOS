import React, { useState, useRef, useEffect } from 'react';
import type { LabelTemplate, LabelElement, LabelElementType } from '../types/label';
import { Button } from './Button';
import { Plus, Type, Barcode as IconBarcode, QrCode, Image as IconImage, Save, Printer, Trash2, Move } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface LabelDesignerProps {
    template: LabelTemplate;
    onSave: (template: LabelTemplate) => void;
    onBack: () => void;
}

export const LabelDesigner: React.FC<LabelDesignerProps> = ({ template: initialTemplate, onSave, onBack }) => {
    const [template, setTemplate] = useState<LabelTemplate>(initialTemplate);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(3); // 1mm = 3px (approx screen DPI)

    const canvasRef = useRef<HTMLDivElement>(null);

    // Helpers
    const mmToPx = (mm: number) => mm * zoom;
    const pxToMm = (px: number) => px / zoom;

    const addElement = (type: LabelElementType) => {
        const newElement: LabelElement = {
            id: Date.now().toString(),
            type,
            x: 5,
            y: 5,
            width: type === 'BARCODE' ? 40 : 30,
            height: type === 'BARCODE' ? 10 : 8,
            content: type === 'TEXT' ? 'New Text' : '',
            fontSize: 12,
            fontWeight: 'normal',
            textAlign: 'left',
            variableField: 'none'
        };
        setTemplate(prev => ({
            ...prev,
            elements: [...prev.elements, newElement]
        }));
        setSelectedElementId(newElement.id);
    };

    const updateElement = (id: string, updates: Partial<LabelElement>) => {
        setTemplate(prev => ({
            ...prev,
            elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el)
        }));
    };

    const removeElement = (id: string) => {
        setTemplate(prev => ({
            ...prev,
            elements: prev.elements.filter(el => el.id !== id)
        }));
        setSelectedElementId(null);
    };

    // Drag Logic (Simple HTML5 DnD or Mouse Events)
    // Using Mouse Events for smoother absolute positioning without DnD API complexity
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        if (!canvasRef.current) return;

        e.stopPropagation();
        setSelectedElementId(id);

        const startX = e.clientX;
        const startY = e.clientY;
        const element = template.elements.find(el => el.id === id);
        if (!element) return;

        const startElX = mmToPx(element.x);
        const startElY = mmToPx(element.y);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            const newXPx = startElX + dx;
            const newYPx = startElY + dy;

            // Constrain to canvas? Optional.
            const newX = pxToMm(newXPx);
            const newY = pxToMm(newYPx);

            updateElement(id, { x: Math.max(0, newX), y: Math.max(0, newY) });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const selectedElement = template.elements.find(el => el.id === selectedElementId);

    return (
        <div className="flex h-full bg-background text-foreground">
            {/* Toolbar */}
            <div className="w-16 border-r border-border bg-muted/20 flex flex-col items-center py-4 gap-4">
                <button onClick={() => addElement('TEXT')} className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Add Text">
                    <Type size={20} />
                </button>
                <button onClick={() => addElement('BARCODE')} className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Add Barcode">
                    <IconBarcode size={20} />
                </button>
                <button onClick={() => addElement('PRICE')} className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Add Price">
                    <span className="font-bold text-lg">₹</span>
                </button>
                <button onClick={() => addElement('QR')} className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Add QR Code">
                    <QrCode size={20} />
                </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-muted/50 p-8 flex flex-col items-center justify-center overflow-auto relative">
                <div className="mb-4 flex gap-4">
                    <div className="bg-background border border-border rounded px-4 py-2 text-sm flex gap-4 items-center">
                        <label className="text-muted-foreground text-xs uppercase font-bold">Zoom</label>
                        <input type="range" min="1" max="10" step="0.5" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-24" />
                    </div>
                    <div className="bg-background border border-border rounded px-4 py-2 text-sm flex gap-4 items-center">
                        <label className="text-muted-foreground text-xs uppercase font-bold">Dimensions</label>
                        <input
                            type="number" value={template.width}
                            onChange={e => setTemplate({ ...template, width: parseFloat(e.target.value) })}
                            className="w-16 border rounded px-1"
                        />
                        <span className="text-muted-foreground">x</span>
                        <input
                            type="number" value={template.height}
                            onChange={e => setTemplate({ ...template, height: parseFloat(e.target.value) })}
                            className="w-16 border rounded px-1"
                        />
                        <span className="text-muted-foreground">mm</span>
                    </div>
                </div>

                <div
                    ref={canvasRef}
                    className="bg-white shadow-lg relative border border-gray-300"
                    style={{
                        width: `${mmToPx(template.width)}px`,
                        height: `${mmToPx(template.height)}px`,
                        backgroundImage: 'radial-gradient(#ddd 1px, transparent 1px)',
                        backgroundSize: `${mmToPx(5)}px ${mmToPx(5)}px` // Grid every 5mm
                    }}
                    onClick={() => setSelectedElementId(null)}
                >
                    {template.elements.map(el => (
                        <div
                            key={el.id}
                            className={clsx(
                                "absolute cursor-move group hover:outline hover:outline-1 hover:outline-blue-400",
                                selectedElementId === el.id ? "outline outline-2 outline-blue-600 z-10" : ""
                            )}
                            style={{
                                left: `${mmToPx(el.x)}px`,
                                top: `${mmToPx(el.y)}px`,
                                width: `${mmToPx(el.width)}px`,
                                height: `${mmToPx(el.height)}px`,
                                fontSize: `${el.fontSize || 12}px`, // This is simplified. Font size in px vs mm is tricky.
                                fontWeight: el.fontWeight,
                                textAlign: el.textAlign,
                                fontFamily: el.fontFamily || 'Arial'
                            }}
                            onMouseDown={(e) => handleMouseDown(e, el.id)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-full h-full overflow-hidden flex items-center justify-center pointer-events-none select-none">
                                {el.type === 'TEXT' && (el.variableField !== 'none' ? `{${el.variableField}}` : el.content)}
                                {el.type === 'PRICE' && (el.variableField !== 'none' ? `{${el.variableField}}` : '₹100.00')}
                                {el.type === 'BARCODE' && (
                                    <div className="w-full h-full bg-black/10 flex items-center justify-center text-[10px] flex-col">
                                        <div className="h-3/4 w-full bg-current opacity-50"></div>
                                        <span>{el.variableField || '123456'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Properties Panel */}
            <div className="w-64 border-l border-border bg-background p-4 flex flex-col gap-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Properties</h3>
                    <Button size="sm" onClick={() => onSave(template)}><Save className="w-4 h-4 mr-2" /> Save</Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Template Name</label>
                        <input
                            className="w-full border rounded p-2 bg-background"
                            value={template.name}
                            onChange={e => setTemplate({ ...template, name: e.target.value })}
                        />
                    </div>
                </div>

                {selectedElement ? (
                    <div className="space-y-4 border-t border-border pt-4 mt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-primary">Selected: {selectedElement.type}</span>
                            <button onClick={() => removeElement(selectedElement.id)} className="text-destructive p-1 hover:bg-destructive/10 rounded">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Common Position Props */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-muted-foreground uppercase">X (mm)</label>
                                <input type="number" className="w-full border rounded p-1 text-sm bg-background" value={Math.round(selectedElement.x * 10) / 10} onChange={e => updateElement(selectedElement.id, { x: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground uppercase">Y (mm)</label>
                                <input type="number" className="w-full border rounded p-1 text-sm bg-background" value={Math.round(selectedElement.y * 10) / 10} onChange={e => updateElement(selectedElement.id, { y: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground uppercase">W (mm)</label>
                                <input type="number" className="w-full border rounded p-1 text-sm bg-background" value={Math.round(selectedElement.width * 10) / 10} onChange={e => updateElement(selectedElement.id, { width: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground uppercase">H (mm)</label>
                                <input type="number" className="w-full border rounded p-1 text-sm bg-background" value={Math.round(selectedElement.height * 10) / 10} onChange={e => updateElement(selectedElement.id, { height: parseFloat(e.target.value) })} />
                            </div>
                        </div>

                        {/* Content Props */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Data Source</label>
                            <select
                                className="w-full border rounded p-2 text-sm bg-background"
                                value={selectedElement.variableField || 'none'}
                                onChange={e => updateElement(selectedElement.id, { variableField: e.target.value as any })}
                            >
                                <option value="none">Static Text</option>
                                <option value="product_name">Product Name</option>
                                <option value="price">Price</option>
                                <option value="barcode">Barcode</option>
                                <option value="sku">SKU / Code</option>
                            </select>
                        </div>

                        {selectedElement.variableField === 'none' && selectedElement.type === 'TEXT' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Content</label>
                                <input
                                    className="w-full border rounded p-2 text-sm bg-background"
                                    value={selectedElement.content || ''}
                                    onChange={e => updateElement(selectedElement.id, { content: e.target.value })}
                                />
                            </div>
                        )}

                        {/* Style Props */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-muted-foreground uppercase">Font Size</label>
                                <input type="number" className="w-full border rounded p-1 text-sm bg-background" value={selectedElement.fontSize} onChange={e => updateElement(selectedElement.id, { fontSize: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground uppercase">Weight</label>
                                <select className="w-full border rounded p-1 text-sm bg-background" value={selectedElement.fontWeight || 'normal'} onChange={e => updateElement(selectedElement.id, { fontWeight: e.target.value as any })}>
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] text-muted-foreground uppercase">Align</label>
                                <div className="flex border rounded overflow-hidden">
                                    <button onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })} className={clsx("flex-1 p-1 hover:bg-muted", selectedElement.textAlign === 'left' && "bg-primary/20")}>L</button>
                                    <button onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })} className={clsx("flex-1 p-1 hover:bg-muted", selectedElement.textAlign === 'center' && "bg-primary/20")}>C</button>
                                    <button onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })} className={clsx("flex-1 p-1 hover:bg-muted", selectedElement.textAlign === 'right' && "bg-primary/20")}>R</button>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="text-center text-muted-foreground text-sm mt-10">
                        Select an element to edit properties.
                    </div>
                )}
            </div>
        </div>
    );
};
