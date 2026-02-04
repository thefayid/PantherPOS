import type { InventoryLog, StocktakeItem, StocktakeSession } from '../types/db';
import { databaseService } from './databaseService';

export const inventoryService = {
    // Inventory Logs
    addLog: async (
        productId: number,
        type: InventoryLog['type'],
        qtyChange: number,
        reason: string,
        userId?: number
    ) => {
        const date = new Date().toISOString();
        await databaseService.query(
            `INSERT INTO inventory_logs (product_id, type, quantity_change, reason, date, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [productId, type, qtyChange, reason, date, userId || null]
        );
    },

    getLogs: async (productId?: number): Promise<InventoryLog[]> => {
        let query = `SELECT * FROM inventory_logs`;
        const params = [];
        if (productId) {
            query += ` WHERE product_id = ?`;
            params.push(productId);
        }
        query += ` ORDER BY date DESC LIMIT 100`;
        return await databaseService.query(query, params);
    },

    // Stocktaking Sessions
    startStocktake: async (notes?: string): Promise<number> => {
        const createdAt = new Date().toISOString();
        const result = await databaseService.query(
            `INSERT INTO stocktake_sessions (created_at, status, notes) VALUES (?, 'IN_PROGRESS', ?)`,
            [createdAt, notes || '']
        );
        // Assuming we are using a method to get the last ID, similar to cashService or rely on a wrapper result
        // For now, let's fetch the latest open session
        const sess = await databaseService.query(`SELECT id FROM stocktake_sessions WHERE status = 'IN_PROGRESS' ORDER BY id DESC LIMIT 1`);
        return sess[0]?.id || result.lastInsertRowid; // Fallback attempts
    },

    getActiveSession: async (): Promise<StocktakeSession | null> => {
        const rows = await databaseService.query(`SELECT * FROM stocktake_sessions WHERE status = 'IN_PROGRESS' LIMIT 1`);
        return rows[0] || null;
    },

    saveCount: async (sessionId: number, productId: number, countedQty: number) => {
        // Get current system stock for snapshot
        const prodRes = await databaseService.query(`SELECT stock FROM products WHERE id = ?`, [productId]);
        const systemStock = prodRes[0]?.stock || 0;
        const variance = countedQty - systemStock;

        // Check if item already counted in this session
        const existing = await databaseService.query(
            `SELECT id FROM stocktake_items WHERE session_id = ? AND product_id = ?`,
            [sessionId, productId]
        );

        if (existing.length > 0) {
            await databaseService.query(
                `UPDATE stocktake_items SET counted_stock = ?, variance = ?, system_stock = ? WHERE id = ?`,
                [countedQty, variance, systemStock, existing[0].id]
            );
        } else {
            await databaseService.query(
                `INSERT INTO stocktake_items (session_id, product_id, system_stock, counted_stock, variance) VALUES (?, ?, ?, ?, ?)`,
                [sessionId, productId, systemStock, countedQty, variance]
            );
        }
    },

    deleteCount: async (sessionId: number, productId: number) => {
        await databaseService.query(`DELETE FROM stocktake_items WHERE session_id = ? AND product_id = ?`, [sessionId, productId]);
    },

    getSessionItems: async (sessionId: number): Promise<any[]> => {
        return await databaseService.query(
            `SELECT si.*, p.name, p.barcode 
             FROM stocktake_items si 
             JOIN products p ON si.product_id = p.id 
             WHERE si.session_id = ?`,
            [sessionId]
        );
    },

    finalizeStocktake: async (sessionId: number) => {
        const finalizedAt = new Date().toISOString();

        // 1. Get all items in the session
        const items = await databaseService.query(`SELECT * FROM stocktake_items WHERE session_id = ?`, [sessionId]);

        // 2. Update actual product stock and log changes
        for (const item of items) {
            if (item.variance !== 0) {
                // Update Product
                await databaseService.query(
                    `UPDATE products SET stock = ? WHERE id = ?`,
                    [item.counted_stock, item.product_id]
                );
                // Log Inventory Change
                await inventoryService.addLog(
                    item.product_id,
                    'STOCKTAKE_ADJUSTMENT',
                    item.variance,
                    `Audit #${sessionId} Variance`
                );
            }
        }

        // 3. Close Session
        await databaseService.query(
            `UPDATE stocktake_sessions SET status = 'COMPLETED', finalized_at = ? WHERE id = ?`,
            [finalizedAt, sessionId]
        );
    },

    // Shrinkage Helper
    reportShrinkage: async (productId: number, qtyToReduce: number, reason: string, userId?: number) => {
        // Reduce stock
        await databaseService.query(
            `UPDATE products SET stock = stock - ? WHERE id = ?`,
            [qtyToReduce, productId]
        );
        // Log
        await inventoryService.addLog(productId, 'SHRINKAGE', -qtyToReduce, reason, userId);
    }
};
