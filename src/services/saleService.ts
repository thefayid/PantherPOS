import type { Bill, BillItem } from '../types/db';
import { databaseService } from './databaseService';

export interface BillWithItems extends Bill {
    items: (BillItem & { productName: string; barcode: string })[];
}

export const saleService = {
    getSales: async (filters?: { search?: string; startDate?: string; endDate?: string; status?: string }): Promise<(Bill & { customer_name?: string; customer_phone?: string })[]> => {
        let sql = `
            SELECT b.*, c.name as customer_name, c.phone as customer_phone 
            FROM bills b 
            LEFT JOIN customers c ON b.customer_id = c.id 
            WHERE 1=1`;
        const params: any[] = [];

        if (filters?.search) {
            sql += ` AND (b.bill_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters?.startDate) {
            sql += ` AND b.date >= ?`;
            params.push(filters.startDate);
        }

        if (filters?.endDate) {
            sql += ` AND b.date <= ?`;
            params.push(filters.endDate);
        }

        if (filters?.status && filters.status !== 'ALL') {
            sql += ` AND b.status = ?`;
            params.push(filters.status);
        }

        sql += ` ORDER BY b.date DESC LIMIT 1000`;
        return await databaseService.query(sql, params);
    },

    getSalesSummary: async (filters?: { search?: string; startDate?: string; endDate?: string; status?: string }): Promise<{ total: number; count: number; gross: number; refunds: number }> => {
        let whereClause = `WHERE 1=1`;
        const params: any[] = [];

        if (filters?.search) {
            whereClause += ` AND bill_no LIKE ?`;
            params.push(`%${filters.search}%`);
        }

        if (filters?.startDate) {
            whereClause += ` AND date >= ?`;
            params.push(filters.startDate);
        }

        if (filters?.endDate) {
            whereClause += ` AND date <= ?`;
            params.push(filters.endDate);
        }

        if (filters?.status && filters.status !== 'ALL') {
            whereClause += ` AND status = ?`;
            params.push(filters.status);
        } else {
            // Default: Exclude Cancelled
            whereClause += ` AND status != 'CANCELLED'`;
        }

        const selectSql = `
            SELECT 
                SUM(total) as net_total,
                SUM(CASE WHEN total > 0 THEN total ELSE 0 END) as gross_total,
                SUM(CASE WHEN total < 0 THEN total ELSE 0 END) as refund_total,
                COUNT(*) as count 
            FROM bills ${whereClause}
        `;

        console.log('[saleService] getSalesSummary SQL:', selectSql, params);
        const result = await databaseService.query(selectSql, params);
        console.log('[saleService] getSalesSummary Result:', result);

        return {
            total: result[0]?.net_total || 0,
            gross: result[0]?.gross_total || 0,
            refunds: result[0]?.refund_total || 0,
            count: result[0]?.count || 0
        };
    },

    getTodaySummary: async (): Promise<{ total: number; count: number; gross: number; refunds: number }> => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return saleService.getSalesSummary({ startDate: today.toISOString(), status: 'ALL' });
    },

    cancelBill: async (billId: number): Promise<void> => {
        // Start a transaction
        await databaseService.query('BEGIN TRANSACTION');
        try {
            // Get bill items to return to stock
            const items = await databaseService.query('SELECT * FROM bill_items WHERE bill_id = ?', [billId]);
            for (const item of items) {
                await databaseService.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
                // Log inventory change
                await databaseService.query(
                    'INSERT INTO inventory_logs (product_id, type, quantity_change, reason, date) VALUES (?, ?, ?, ?, ?)',
                    [item.product_id, 'RETURN', item.quantity, `Bill #${billId} Cancelled`, new Date().toISOString()]
                );
            }
            // Update bill status
            await databaseService.query("UPDATE bills SET status = 'CANCELLED' WHERE id = ?", [billId]);
            await databaseService.query('COMMIT');
        } catch (error) {
            await databaseService.query('ROLLBACK');
            throw error;
        }
    },
    getBillDetails: async (billId: number): Promise<BillWithItems> => {
        const billResult = await databaseService.query(`SELECT * FROM bills WHERE id = ?`, [billId]);
        if (billResult.length === 0) throw new Error('Bill not found');
        const bill = billResult[0];

        const items = await databaseService.query(
            `SELECT bi.*, p.name as productName, p.barcode, p.hsn_code 
             FROM bill_items bi 
             JOIN products p ON bi.product_id = p.id 
             WHERE bi.bill_id = ?`,
            [billId]
        );

        return { ...bill, items };
    },

    getBillDetailsByNo: async (billNo: string): Promise<BillWithItems> => {
        const billResult = await databaseService.query(`SELECT * FROM bills WHERE bill_no = ?`, [billNo]);
        if (billResult.length === 0) throw new Error('Bill not found');
        return saleService.getBillDetails(billResult[0].id);
    },

    getLastBill: async (): Promise<BillWithItems | null> => {
        const res = await databaseService.query("SELECT * FROM bills WHERE status != 'CANCELLED' ORDER BY id DESC LIMIT 1");
        if (!res || res.length === 0) return null;
        return await saleService.getBillDetails(res[0].id);
    },
};
