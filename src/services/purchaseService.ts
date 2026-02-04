import type { PurchaseOrder, PurchaseOrderItem } from '../types/db';
import { databaseService } from './databaseService';

export const purchaseService = {
    getAll: async (): Promise<(PurchaseOrder & { supplier_name: string })[]> => {
        return await databaseService.query(`
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            ORDER BY po.date DESC
        `);
    },

    getById: async (id: number): Promise<{ order: PurchaseOrder, items: any[] } | null> => {
        const orders = await databaseService.query(`
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.id = ?
        `, [id]);

        if (!orders[0]) return null;

        const items = await databaseService.query(`
            SELECT poi.*, p.name as product_name, p.barcode
            FROM purchase_order_items poi
            JOIN products p ON poi.product_id = p.id
            WHERE poi.purchase_order_id = ?
        `, [id]);

        return { order: orders[0], items };
    },

    generateOrderNo: async (): Promise<string> => {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const prefix = `PO-${yyyy}${mm}${dd}`;

        const result = await databaseService.query(
            `SELECT count(*) as count FROM purchase_orders WHERE order_no LIKE ?`,
            [`${prefix}%`]
        );

        const count = (result[0]?.count || 0) + 1;
        const sequence = String(count).padStart(4, '0');
        return `${prefix}-${sequence}`;
    },

    create: async (order: Omit<PurchaseOrder, 'id' | 'order_no' | 'date'>, items: Omit<PurchaseOrderItem, 'id' | 'purchase_order_id'>[]): Promise<number> => {
        const orderNo = await purchaseService.generateOrderNo();
        const dateStr = new Date().toISOString();

        const result = await databaseService.query(
            `INSERT INTO purchase_orders (order_no, supplier_id, date, total_amount, status, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderNo, order.supplier_id, dateStr, order.total_amount, order.status, order.notes || null]
        );

        const purchaseOrderId = result.changes;

        for (const item of items) {
            await databaseService.query(
                `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, cost_price, total_amount)
                 VALUES (?, ?, ?, ?, ?)`,
                [purchaseOrderId, item.product_id, item.quantity, item.cost_price, item.total_amount]
            );
        }

        return purchaseOrderId;
    },

    updateStatus: async (id: number, status: PurchaseOrder['status']): Promise<void> => {
        await databaseService.query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, id]);
    },

    receiveOrder: async (id: number): Promise<void> => {
        const data = await purchaseService.getById(id);
        if (!data) throw new Error('Order not found');
        if (data.order.status === 'RECEIVED') throw new Error('Order already received');

        // Start transaction-like flow (manual since we're using simple queries)
        // 1. Update stock for each item
        for (const item of data.items) {
            await databaseService.query(
                'UPDATE products SET stock = stock + ?, cost_price = ? WHERE id = ?',
                [item.quantity, item.cost_price, item.product_id]
            );
        }

        // 2. Mark order as received
        await databaseService.query(
            'UPDATE purchase_orders SET status = ?, receive_date = ? WHERE id = ?',
            ['RECEIVED', new Date().toISOString(), id]
        );

        // 3. Update Supplier Ledger (We owe them money)
        const amount = data.order.total_amount;

        // Fetch current balance
        const supRes = await databaseService.query('SELECT balance FROM suppliers WHERE id = ?', [data.order.supplier_id]);
        const currentBal = supRes[0]?.balance || 0;
        const newBal = currentBal + (amount || 0);

        await databaseService.query('UPDATE suppliers SET balance = ? WHERE id = ?', [newBal, data.order.supplier_id]);

        const date = new Date().toISOString();
        await databaseService.query(
            `INSERT INTO supplier_ledger (supplier_id, type, amount, balance_after, description, reference_id, date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [data.order.supplier_id, 'CREDIT', amount, newBal, `Purchase Order ${data.order.order_no}`, id, date]
        );

        // 4. Post Accounting Voucher
        try {
            const { accountingService } = await import('./accountingService');
            const invAcc = await accountingService.getAccountByCode('1004');
            const gstAcc = await accountingService.getAccountByCode('2002');
            const payableAcc = await accountingService.getAccountByCode('2001');

            if (invAcc && payableAcc && gstAcc) {
                // Calculate tax part (approximate from products in this order)
                let totalTaxable = 0;
                let totalGst = 0;

                for (const item of data.items) {
                    // Back-calculate taxable and GST if total_amount is inclusive
                    // OR if we assume prices in PO are taxable and we add GST on top.
                    // Given how reportService.getItcSummary works, it assumes cost_price is TAXABLE.
                    const itc = item.quantity * item.cost_price * (item.gst_rate / 100.0);
                    totalTaxable += (item.quantity * item.cost_price);
                    totalGst += itc;
                }

                await accountingService.postVoucher({
                    date: date,
                    type: 'PURCHASE',
                    total_amount: data.order.total_amount,
                    reference_id: data.order.order_no,
                    notes: `System generated purchase voucher for PO ${data.order.order_no}`
                }, [
                    { account_id: invAcc.id, type: 'DEBIT', amount: totalTaxable, description: `Inventory Increase - ${data.order.order_no}` },
                    { account_id: gstAcc.id, type: 'DEBIT', amount: totalGst, description: `ITC Claimed - ${data.order.order_no}` },
                    { account_id: payableAcc.id, type: 'CREDIT', amount: data.order.total_amount, description: `Payable to Supplier - ${data.order.order_no}` }
                ]);
            }
        } catch (e) {
            console.error('Accounting Post Failed (Purchase):', e);
        }
    },

    deleteDraft: async (id: number): Promise<void> => {
        const order = await databaseService.query('SELECT status FROM purchase_orders WHERE id = ?', [id]);
        if (order[0]?.status !== 'DRAFT') {
            throw new Error('Only draft orders can be deleted');
        }
        await databaseService.query('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
        await databaseService.query('DELETE FROM purchase_orders WHERE id = ?', [id]);
    }
};
