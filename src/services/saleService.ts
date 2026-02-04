import type { Bill, BillItem } from '../types/db';
import { databaseService } from './databaseService';

export interface BillWithItems extends Bill {
    items: (BillItem & { productName: string; barcode: string })[];
}

export const saleService = {
    getSales: async (filters?: { search?: string; startDate?: string; endDate?: string; status?: string }): Promise<Bill[]> => {
        let sql = `SELECT * FROM bills WHERE 1=1`;
        const params: any[] = [];

        if (filters?.search) {
            sql += ` AND bill_no LIKE ?`;
            params.push(`%${filters.search}%`);
        }

        if (filters?.startDate) {
            sql += ` AND date >= ?`;
            params.push(filters.startDate);
        }

        if (filters?.endDate) {
            sql += ` AND date <= ?`;
            params.push(filters.endDate);
        }

        if (filters?.status && filters.status !== 'ALL') {
            sql += ` AND status = ?`;
            params.push(filters.status);
        }

        sql += ` ORDER BY date DESC LIMIT 1000`;
        return await databaseService.query(sql, params);
    },

    getSalesSummary: async (filters?: { search?: string; startDate?: string; endDate?: string; status?: string }): Promise<{ total: number; count: number }> => {
        let sql = `SELECT SUM(total) as total, COUNT(*) as count FROM bills WHERE 1=1`;
        const params: any[] = [];

        if (filters?.search) {
            sql += ` AND bill_no LIKE ?`;
            params.push(`%${filters.search}%`);
        }

        if (filters?.startDate) {
            sql += ` AND date >= ?`;
            params.push(filters.startDate);
        }

        if (filters?.endDate) {
            sql += ` AND date <= ?`;
            params.push(filters.endDate);
        }

        if (filters?.status && filters.status !== 'ALL') {
            sql += ` AND status = ?`;
            params.push(filters.status);
        } else if (!filters?.status || filters.status === 'ALL') {
            // If viewing ALL, distinct behavior? 
            // Usually "Total Sales" implies Revenue (PAID only). 
            // But if the user filters for "CANCELLED", they expect to see that total.
            // Let's stick to: sum of bills that match the filter.
            // But for the default view (ALL), we might only want to sum PAID for the "Revenue" figure?
            // To keep it simple and consistent with the list: Sum of what meets the criteria.
            // EXCEPT: Cancelled/Returned bills usually shouldn't add to "Total Sales" revenue if mixed.
            // Let's modify: If Status is ALL, we only sum PAID for the Total value, but Count includes all?
            // Actually, the previous getTodaySummary ONLY counted PAID.
            // Let's try to be smart:
            // If status is specific (e.g. CANCELLED), sum that.
            // If status is ALL or undefined, sum only PAID for 'total', but count all?
            // Or just simplify: "Total Transaction Value".

            // Let's stick to the previous behavior of getTodaySummary which was `status='PAID'`.
            // If the user wants to see Cancelled total, they select Cancelled.
            // So if status is 'ALL', we append "AND status = 'PAID'" for the SUM? 
            // But then the count would be off if we count everything?

            // Simplest approach: Just respect the filter. If I see a Cancelled bill of 500, and a Paid bill of 500. Total = 1000? 
            // Probably not ideal for "Sales".
            // Let's filter PAID by default if status is ALL.

            // WAIT: getSales shows EVERYTHING.
            // If I show "Count: 10" and "Total: 5000", but 5 are cancelled, the 5000 shouldn't include the cancelled ones.

            // Let's split logic:
            // If status is provided and != ALL -> query matches that status.
            // If status is ALL -> We match ALL for the list. 
            // For the SUMMARY "Total Sales", we probably only want PAID.
            // For "Bills Count", we probably want ALL (matching the list).

            // This is getting complex for a generic query.
            // Let's just do:
            // Total = Sum of 'total' where status = 'PAID' (and matches other filters)
            // Count = Count of 'id' (matches all filters)

            // Let's rewrite the query to do conditional summation.
        }

        // Revised Approach for Summary:
        // We want the summary to reflect the "Sales" (Revenue), so generally only PAID.
        // But if I strictly select "Refuned", I expect to see the refunded amount.

        let whereClause = `WHERE 1=1`;

        // Re-use logic
        if (filters?.search) { whereClause += ` AND bill_no LIKE ?`; }
        if (filters?.startDate) { whereClause += ` AND date >= ?`; }
        if (filters?.endDate) { whereClause += ` AND date <= ?`; }
        // Status handled inside query for total?

        // If specific status requested:
        if (filters?.status && filters.status !== 'ALL') {
            whereClause += ` AND status = ?`;
        }

        // Query:
        // If specific status: Simple SUM and COUNT.
        // If ALL: 
        //   Total = SUM(case when status='PAID' then total else 0 end)
        //   Count = COUNT(*)

        let selectSql = ``;
        if (filters?.status && filters.status !== 'ALL') {
            selectSql = `SELECT SUM(total) as total, COUNT(*) as count FROM bills ${whereClause}`;
        } else {
            selectSql = `SELECT SUM(CASE WHEN status = 'PAID' THEN total ELSE 0 END) as total, COUNT(*) as count FROM bills ${whereClause}`;
        }

        const result = await databaseService.query(selectSql, params);
        return {
            total: result[0]?.total || 0,
            count: result[0]?.count || 0
        };
    },

    getTodaySummary: async (): Promise<{ total: number; count: number }> => {
        // Keeping for backward compat or just redirecting
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return saleService.getSalesSummary({ startDate: today.toISOString(), status: 'ALL' });
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

    // ... existing cancel/refund methods ...
    refundBill: async (billId: number): Promise<void> => {
        const bill = await saleService.getBillDetails(billId);
        if (bill.status !== 'PAID') throw new Error('Bill is already ' + bill.status);
        await databaseService.query(`UPDATE bills SET status = 'REFUNDED' WHERE id = ?`, [billId]);
        for (const item of bill.items) {
            await databaseService.query(`UPDATE products SET stock = stock + ? WHERE id = ?`, [item.quantity, item.product_id]);
        }
    },

    cancelBill: async (billId: number): Promise<void> => {
        const bill = await saleService.getBillDetails(billId);
        if (bill.status !== 'PAID') throw new Error('Bill is already ' + bill.status);
        await databaseService.query(`UPDATE bills SET status = 'CANCELLED' WHERE id = ?`, [billId]);
        for (const item of bill.items) {
            await databaseService.query(`UPDATE products SET stock = stock + ? WHERE id = ?`, [item.quantity, item.product_id]);
        }
    },

    generateReturnNo: async (): Promise<string> => {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const prefix = `RET-${yyyy}${mm}${dd}`;

        const result = await databaseService.query(
            `SELECT count(*) as count FROM returns WHERE bill_no LIKE ?`,
            [`${prefix}%`]
        );

        const count = (result[0]?.count || 0) + 1;
        return `${prefix}-${String(count).padStart(4, '0')}`;
    },

    processReturn: async (originalBillId: number, items: { productId: number; quantity: number; refundAmount: number; billItemId: number }[], reason: string, paymentMode: string): Promise<string> => {
        const returnNo = await saleService.generateReturnNo();
        const dateStr = new Date().toISOString();
        const totalRefund = items.reduce((sum, item) => sum + item.refundAmount, 0);

        await databaseService.query(
            `INSERT INTO returns (original_bill_id, bill_no, date, total_refund, payment_mode, reason)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [originalBillId, returnNo, dateStr, totalRefund, paymentMode, reason]
        );

        const res = await databaseService.query(`SELECT id FROM returns WHERE bill_no = ?`, [returnNo]);
        const returnId = res[0].id;

        for (const item of items) {
            await databaseService.query(
                `INSERT INTO return_items (return_id, product_id, quantity, refund_amount)
                 VALUES (?, ?, ?, ?)`,
                [returnId, item.productId, item.quantity, item.refundAmount]
            );

            await databaseService.query(
                `UPDATE bill_items SET returned_quantity = returned_quantity + ? WHERE id = ?`,
                [item.quantity, item.billItemId]
            );

            await databaseService.query(
                `UPDATE products SET stock = stock + ? WHERE id = ?`,
                [item.quantity, item.productId]
            );
        }

        // Check if full bill is returned
        const bill = await saleService.getBillDetails(originalBillId);
        const totalItems = bill.items.reduce((sum, i) => sum + i.quantity, 0);
        const totalReturned = bill.items.reduce((sum, i) => sum + (i.returned_quantity || 0), 0);

        if (totalReturned >= totalItems) {
            await databaseService.query(`UPDATE bills SET status = 'RETURNED' WHERE id = ?`, [originalBillId]);
        } else {
            await databaseService.query(`UPDATE bills SET status = 'PARTIAL_RETURN' WHERE id = ?`, [originalBillId]);
        }

        return returnNo;
    }
};
