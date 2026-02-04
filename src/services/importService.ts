import * as XLSX from 'xlsx';

export interface ImportedProduct {
    name: string;
    barcode: string;
    sell_price: number;
    cost_price: number;
    stock: number;
    gst_rate?: number;
    hsn_code?: string;
    min_stock_level?: number;
    group_name?: string;
}

export const importService = {
    parseProductFile: async (file: File): Promise<ImportedProduct[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);

                    const products: ImportedProduct[] = jsonData.map((row: any) => ({
                        name: row['Name'] || row['name'] || 'Unknown Product',
                        barcode: (row['Barcode'] || row['barcode'] || '').toString(),
                        sell_price: parseFloat(row['Price'] || row['price'] || '0'),
                        cost_price: parseFloat(row['Cost'] || row['cost'] || '0'),
                        stock: parseFloat(row['Stock'] || row['Quantity'] || row['quantity'] || '0'),
                        gst_rate: parseFloat(row['Tax'] || row['tax'] || '0'),
                        hsn_code: (row['HSN'] || row['hsn'] || '').toString(),
                        min_stock_level: parseFloat(row['ReorderPoint'] || row['min_stock'] || '5'),
                        group_name: row['ProductGroup'] || row['Group'] || undefined
                    })).filter(p => p.name !== 'Unknown Product'); // Basic filtering

                    resolve(products);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);

            reader.readAsBinaryString(file);
        });
    }
};
