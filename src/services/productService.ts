import type { Product } from '../types/db';
import { databaseService } from './databaseService';
import { inventoryService } from './inventoryService';

const STORAGE_KEY = 'mock_products';

const getMockProducts = (): Product[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        const initial: Product[] = [
            { id: 1, name: 'Sample Product 1', barcode: '1234567890123', cost_price: 100, sell_price: 150, stock: 50, gst_rate: 18, hsn_code: '1234', min_stock_level: 10 },
            { id: 2, name: 'Sample Product 2', barcode: '9876543210987', cost_price: 200, sell_price: 300, stock: 5, gst_rate: 12, hsn_code: '5678', min_stock_level: 10 },
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }
    return JSON.parse(stored);
};

const saveMockProducts = (products: Product[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const productService = {
    getAll: async (): Promise<Product[]> => {
        return await databaseService.query(`
            SELECT p.*, 
            CASE WHEN pb.id IS NOT NULL THEN 1 ELSE 0 END as is_bundle
            FROM products p
            LEFT JOIN (SELECT DISTINCT parent_product_id as id FROM product_bundles) pb ON p.id = pb.id
            ORDER BY p.name ASC
        `);
    },

    search: async (query: string): Promise<Product[]> => {
        const prefixTerm = `${query}%`;
        const centerTerm = `%${query}%`;
        return await databaseService.query(
            `SELECT * FROM products 
             WHERE name LIKE ? OR barcode LIKE ? OR hsn_code LIKE ?
             ORDER BY 
                CASE 
                    WHEN name LIKE ? THEN 1 
                    WHEN name LIKE ? THEN 2 
                    ELSE 3 
                END, 
                name ASC LIMIT 50`,
            [centerTerm, centerTerm, centerTerm, prefixTerm, centerTerm]
        );
    },

    // Lightweight local search used by some UI flows (e.g. Stocktake)
    // Works against mock products (non-Electron) and can be extended for cached datasets.
    searchProductsLocal: (query: string): Product[] => {
        const q = query.trim().toLowerCase();
        const products = getMockProducts();
        if (!q) return products;

        return products.filter((p) => {
            const nameMatch = p.name?.toLowerCase().includes(q);
            const barcodeMatch = p.barcode?.includes(query);
            const hsnMatch = p.hsn_code?.toLowerCase().includes(q);
            return nameMatch || barcodeMatch || hsnMatch;
        });
    },

    // --- BUNDLES ---
    getBundleComponents: async (parentId: number): Promise<{ product: Product, quantity: number }[]> => {
        return await databaseService.query(
            `SELECT p.*, pb.quantity 
             FROM product_bundles pb
             JOIN products p ON pb.child_product_id = p.id
             WHERE pb.parent_product_id = ?`,
            [parentId]
        );
    },

    saveBundleComponents: async (parentId: number, components: { id: number, quantity: number }[]) => {
        // Clear existing
        await databaseService.query('DELETE FROM product_bundles WHERE parent_product_id = ?', [parentId]);

        // Insert new
        for (const comp of components) {
            await databaseService.query(
                `INSERT INTO product_bundles (parent_product_id, child_product_id, quantity) VALUES (?, ?, ?)`,
                [parentId, comp.id, comp.quantity]
            );
        }
    },

    create: async (product: Omit<Product, 'id'> & { components?: { id: number, quantity: number }[] }): Promise<number> => {
        const result = await databaseService.query(
            `INSERT INTO products (name, barcode, cost_price, sell_price, stock, gst_rate, hsn_code, min_stock_level, image, variant_group_id, attributes, is_batch_tracked)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [product.name, product.barcode, product.cost_price, product.sell_price, product.stock, product.gst_rate, product.hsn_code, product.min_stock_level || 5, product.image || null, product.variant_group_id || null, product.attributes || null, product.is_batch_tracked || 0]
        );

        if (product.components && product.components.length > 0) {
            await productService.saveBundleComponents(result.lastInsertRowid, product.components);
        }

        return result.changes;
    },

    bulkCreate: async (products: Omit<Product, 'id'>[]): Promise<{ imported: number, failed: number }> => {
        let imported = 0;
        let failed = 0;
        for (const p of products) {
            try {
                // Check if barcode exists
                const existing = await productService.getByBarcode(p.barcode);
                if (existing) {
                    await productService.update({ ...existing, ...p, id: existing.id });
                } else {
                    await productService.create(p);
                }
                imported++;
            } catch (e) {
                console.error(`Failed to import ${p.name}:`, e);
                failed++;
            }
        }
        return { imported, failed };
    },


    bulkUpdate: async (ids: number[], updates: Partial<Product>): Promise<number> => {
        if (!ids.length) return 0;

        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);

        // Construct standard SQL place holders (?,?,?)
        const placeholders = ids.map(() => '?').join(',');

        const sql = `UPDATE products SET ${fields} WHERE id IN (${placeholders})`;

        // If stock is being updated, we should ideally log it. 
        // For SET operation on stock, calculating delta is expensive for bulk (N queries or 1 IN query + map).
        // Let's do it if 'stock' is in updates.
        if ('stock' in updates) {
            try {
                // Fetch old data
                const oldProducts = await databaseService.query(`SELECT id, stock FROM products WHERE id IN (${placeholders})`, ids);
                const newStock = updates.stock as number;

                for (const p of oldProducts) {
                    const diff = newStock - p.stock;
                    if (diff !== 0) {
                        await inventoryService.addLog(p.id, 'ADJUSTMENT', diff, 'Bulk Editor Update');
                    }
                }
            } catch (e) {
                console.error('Failed to log bulk stock update', e);
            }
        }

        const result = await databaseService.query(sql, [...values, ...ids]);
        return result.changes;
    },

    // Advanced formula update (e.g. increase price by 10%)
    bulkFormulaUpdate: async (ids: number[], field: 'sell_price' | 'cost_price' | 'stock', operation: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'SET', value: number): Promise<number> => {
        if (!ids.length) return 0;
        const placeholders = ids.map(() => '?').join(',');

        // Log inventory changes if stock is modified
        if (field === 'stock') {
            try {
                if (operation === 'ADD') {
                    // Easy, diff is +value
                    for (const id of ids) await inventoryService.addLog(id, 'ADJUSTMENT', value, 'Bulk Formula (Add)');
                } else if (operation === 'SUBTRACT') {
                    // Easy, diff is -value
                    for (const id of ids) await inventoryService.addLog(id, 'ADJUSTMENT', -value, 'Bulk Formula (Subtract)');
                } else if (operation === 'SET') {
                    // Harder, need delta. Re-use logic or fetch
                    const oldProducts = await databaseService.query(`SELECT id, stock FROM products WHERE id IN (${placeholders})`, ids);
                    for (const p of oldProducts) {
                        const diff = value - p.stock;
                        if (diff !== 0) await inventoryService.addLog(p.id, 'ADJUSTMENT', diff, 'Bulk Formula (Set)');
                    }
                } else if (operation === 'MULTIPLY') {
                    // Need delta
                    const oldProducts = await databaseService.query(`SELECT id, stock FROM products WHERE id IN (${placeholders})`, ids);
                    for (const p of oldProducts) {
                        const newQty = Math.round(p.stock * value); // float stock? usually int but schema says int.
                        const diff = newQty - p.stock;
                        if (diff !== 0) await inventoryService.addLog(p.id, 'ADJUSTMENT', diff, `Bulk Formula (Multiply ${value})`);
                    }
                }
            } catch (e) { console.error('Error logging bulk formula stock', e); }
        }

        let sql = '';
        if (operation === 'SET') {
            sql = `UPDATE products SET ${field} = ? WHERE id IN (${placeholders})`;
            return (await databaseService.query(sql, [value, ...ids])).changes;
        } else {
            const opMap = { 'ADD': '+', 'SUBTRACT': '-', 'MULTIPLY': '*' };
            const op = opMap[operation];
            sql = `UPDATE products SET ${field} = ${field} ${op} ? WHERE id IN (${placeholders})`;
            return (await databaseService.query(sql, [value, ...ids])).changes;
        }
    },

    update: async (product: Product & { components?: { id: number, quantity: number }[] }): Promise<number> => {
        if (!window.electronAPI) {
            const products = getMockProducts();
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                products[index] = product;
                saveMockProducts(products);
                return 1;
            }
            return 0;
        }

        const imgLen = product.image ? product.image.length : 0;
        console.log(`Updating product: ${product.name}, Image Length: ${imgLen}`);

        const result = await databaseService.query(
            `UPDATE products SET name=?, barcode=?, cost_price=?, sell_price=?, stock=?, gst_rate=?, hsn_code=?, min_stock_level=?, image=?, variant_group_id=?, attributes=?, is_batch_tracked=?
             WHERE id=?`,
            [product.name, product.barcode, product.cost_price, product.sell_price, product.stock, product.gst_rate, product.hsn_code, product.min_stock_level || 5, product.image || null, product.variant_group_id || null, product.attributes || null, product.is_batch_tracked || 0, product.id]
        );

        if (product.components) {
            await productService.saveBundleComponents(product.id, product.components);
        }

        return result.changes;
    },

    delete: async (id: number): Promise<number> => {
        const result = await databaseService.query('DELETE FROM products WHERE id=?', [id]);
        return result.changes;
    },

    getByBarcode: async (barcode: string): Promise<Product | undefined> => {
        const rows = await databaseService.query('SELECT * FROM products WHERE barcode = ?', [barcode]);
        return rows[0];
    },

    getLowStockProducts: async (): Promise<Product[]> => {
        return await databaseService.query(
            'SELECT * FROM products WHERE stock <= min_stock_level ORDER BY stock ASC'
        );
    },

    // --- VARIANTS ---
    getVariants: async (variantGroupId: string): Promise<Product[]> => {
        return await databaseService.query(
            'SELECT * FROM products WHERE variant_group_id = ? ORDER BY name ASC',
            [variantGroupId]
        );
    },

    createVariant: async (parentId: number, attributes: Record<string, string>, newBarcode: string): Promise<void> => {
        if (!window.electronAPI) return;

        // 1. Fetch Parent
        const parentRes = await databaseService.query('SELECT * FROM products WHERE id = ?', [parentId]);
        const parent = parentRes[0];
        if (!parent) throw new Error('Parent product not found');

        // 2. Generate or Reuse Group ID
        let groupId = parent.variant_group_id;
        if (!groupId) {
            groupId = crypto.randomUUID();
            await databaseService.query('UPDATE products SET variant_group_id = ? WHERE id = ?', [groupId, parentId]);
        }

        // 3. Create Name (Append attributes)
        // e.g. "Shirt" + " - Red" + " - M"
        const entries = Object.entries(attributes);
        const suffix = entries.map(([_, v]) => `${v}`).join(' ');
        const newName = `${parent.name} - ${suffix}`;

        // 4. Insert New Product
        await productService.create({
            ...parent,
            id: undefined, // Create new ID
            name: newName,
            barcode: newBarcode,
            variant_group_id: groupId,
            attributes: JSON.stringify(attributes),
            stock: 0 // Default 0 stock for new variant
        } as any);
    },

    // --- QUICK UPDATES (AI) ---
    updateStock: async (id: number, quantity: number): Promise<{ success: boolean; message?: string }> => {
        console.log(`[ProductService] updateStock: ID=${id}, Qty=${quantity}`);
        if (!window.electronAPI) {
            const products = getMockProducts();
            const product = products.find(p => p.id === id);
            if (product) {
                product.stock = quantity;
                saveMockProducts(products);
                return { success: true };
            }
            return { success: false, message: 'Mock product not found' };
        }
        try {
            const result = await databaseService.query('UPDATE products SET stock = ? WHERE id = ?', [quantity, id]);
            console.log('[ProductService] DB Result:', result);

            // If result exists, query ran. 
            // changes=0 implies value was already same OR id not found (but we checked existence).
            // We'll treat valid result as success.

            // Check for Automation (Low Stock)
            if (result.changes > 0) {
                const pRows = await databaseService.query('SELECT * FROM products WHERE id = ?', [id]);
                if (pRows && pRows.length > 0) {
                    const p = pRows[0];
                    if (p.stock <= (p.min_stock_level || 5)) {
                        import('./automationService').then(({ automationService }) => {
                            automationService.checkTriggers('LOW_STOCK', p);
                        });
                    }
                }
            }

            return { success: true, message: result.changes === 0 ? 'Value was already set' : undefined };
        } catch (e: any) {
            console.error('[ProductService] DB Error:', e);
            return { success: false, message: e.message };
        }
    },

    updatePrice: async (id: number, price: number): Promise<{ success: boolean; message?: string }> => {
        console.log(`[ProductService] updatePrice: ID=${id}, Price=${price}`);
        if (!window.electronAPI) {
            const products = getMockProducts();
            const product = products.find(p => p.id === id);
            if (product) {
                product.sell_price = price;
                saveMockProducts(products);
                return { success: true };
            }
            return { success: false, message: 'Mock product not found' };
        }
        try {
            const result = await databaseService.query('UPDATE products SET sell_price = ? WHERE id = ?', [price, id]);
            console.log('[ProductService] DB Result:', result);
            return { success: true, message: result.changes === 0 ? 'Value was already set' : undefined };
        } catch (e: any) {
            console.error('[ProductService] DB Error:', e);
            return { success: false, message: e.message };
        }
    }
};
