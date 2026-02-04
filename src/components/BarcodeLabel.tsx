import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';

interface BarcodeLabelProps {
    value: string;
    type?: '1D' | '2D';
    name: string;
    price: number;
    className?: string;
}

export function BarcodeLabel({ value, type = '1D', name, price, className }: BarcodeLabelProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (type === '1D' && svgRef.current && value) {
            try {
                JsBarcode(svgRef.current, value, {
                    format: "CODE128",
                    width: 2,
                    height: 50,
                    displayValue: true,
                    fontSize: 14,
                    margin: 10,
                    background: "transparent",
                    lineColor: "#000000"
                });
            } catch (err) {
                console.error('Barcode generation failed:', err);
            }
        }
    }, [value, type]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const barcodeHtml = type === '1D'
            ? svgRef.current?.outerHTML || ''
            : `<div style="padding: 10px; background: white;"><div id="qr-container"></div></div>`;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Label - ${name}</title>
                    <style>
                        body { 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            height: 100vh; 
                            margin: 0; 
                            font-family: sans-serif;
                        }
                        .label-container {
                            border: 1px dashed #ccc;
                            padding: 20px;
                            text-align: center;
                            background: white;
                        }
                        .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; color: black; }
                        .price { font-size: 20px; font-weight: 900; margin-top: 10px; color: black; }
                        canvas, svg { max-width: 100%; }
                    </style>
                </head>
                <body>
                    <div class="label-container">
                        <div class="name">${name.toUpperCase()}</div>
                        ${barcodeHtml}
                        <div class="price">₹${price.toFixed(2)}</div>
                    </div>
                    <script>
                        ${type === '2D' ? `
                            // Minimal QR code generation logic if needed or just use SVG
                        ` : ''}
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className={`flex flex-col items-center p-4 bg-white rounded-xl shadow-lg border border-border ${className}`}>
            <div className="text-black font-black text-xs mb-2 uppercase tracking-tighter text-center line-clamp-1">{name}</div>

            {type === '1D' ? (
                <svg ref={svgRef} className="max-w-full h-auto"></svg>
            ) : (
                <div className="p-2 bg-white rounded-lg">
                    <QRCodeSVG
                        value={value}
                        size={80}
                        level="M"
                        includeMargin={false}
                    />
                </div>
            )}

            <div className="text-black font-black text-lg mt-2">₹{price.toFixed(2)}</div>
            <button
                onClick={handlePrint}
                className="mt-4 px-6 py-2 bg-primary text-primary-foreground font-black text-[10px] rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
            >
                Print Label
            </button>
        </div>
    );
}
