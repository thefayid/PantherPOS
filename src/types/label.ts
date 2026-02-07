export type LabelElementType = 'TEXT' | 'BARCODE' | 'PRICE' | 'IMAGE' | 'QR' | 'RECT';

export interface LabelElement {
    id: string;
    type: LabelElementType;
    x: number; // usually mm
    y: number; // usually mm
    width: number; // usually mm
    height: number; // usually mm
    content?: string; // for static text
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    barcodeType?: 'CODE128' | 'EAN13';
    variableField?: 'product_name' | 'price' | 'barcode' | 'sku' | 'mrp' | 'none'; // for data binding
}

export interface LabelTemplate {
    id: string;
    name: string;
    width: number; // mm
    height: number; // mm
    elements: LabelElement[];
}

export const DEFAULT_TEMPLATES: LabelTemplate[] = [
    {
        id: 'default-50x25',
        name: 'Standard Sticker (50x25mm)',
        width: 50,
        height: 25,
        elements: [
            { id: '1', type: 'TEXT', x: 2, y: 2, width: 46, height: 8, variableField: 'product_name', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
            { id: '2', type: 'BARCODE', x: 5, y: 10, width: 40, height: 10, variableField: 'barcode', barcodeType: 'CODE128' },
            { id: '3', type: 'PRICE', x: 2, y: 20, width: 46, height: 5, variableField: 'price', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }
        ]
    }
];
