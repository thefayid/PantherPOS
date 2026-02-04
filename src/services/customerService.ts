import type { Customer } from '../types/db';
import { databaseService } from './databaseService';
export type { Customer };

export const customerService = {
    getAll: async (): Promise<Customer[]> => {
        return await databaseService.query('SELECT * FROM customers ORDER BY name ASC');
    },

    getById: async (id: number): Promise<Customer | null> => {
        const res = await databaseService.query('SELECT * FROM customers WHERE id = ?', [id]);
        return res[0] || null;
    },

    search: async (query: string): Promise<Customer[]> => {
        const term = `%${query}%`;
        return await databaseService.query(
            'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC LIMIT 20',
            [term, term]
        );
    },

    create: async (customer: Omit<Customer, 'id' | 'total_purchases' | 'created_at'>): Promise<number> => {
        const result = await databaseService.query(
            `INSERT INTO customers (name, phone, email, address, created_at, total_purchases)
             VALUES (?, ?, ?, ?, ?, 0)`,
            [customer.name, customer.phone || null, customer.email || null, customer.address || null, new Date().toISOString()]
        );
        return result.changes;
    },

    update: async (customer: Customer): Promise<number> => {
        const result = await databaseService.query(
            `UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?`,
            [customer.name, customer.phone || null, customer.email || null, customer.address || null, customer.id]
        );
        return result.changes;
    },

    delete: async (id: number): Promise<number> => {
        const result = await databaseService.query('DELETE FROM customers WHERE id = ?', [id]);
        return result.changes;
    },

    getPurchaseHistory: async (customerId: number): Promise<any[]> => {
        return await databaseService.query(
            `SELECT b.*, COUNT(bi.id) as item_count 
             FROM bills b 
             LEFT JOIN bill_items bi ON b.id = bi.bill_id 
             WHERE b.customer_id = ? 
             GROUP BY b.id 
             ORDER BY b.date DESC`,
            [customerId]
        );
    },

    updateStats: async (customerId: number, purchaseAmount: number): Promise<void> => {
        await databaseService.query(
            `UPDATE customers 
             SET total_purchases = COALESCE(total_purchases, 0) + ?, last_visit = ? 
             WHERE id = ?`,
            [purchaseAmount, new Date().toISOString(), customerId]
        );
    },

    updatePoints: async (customerId: number, pointsDelta: number): Promise<void> => {
        await databaseService.query(
            `UPDATE customers SET points = points + ? WHERE id = ?`,
            [pointsDelta, customerId]
        );
    },

    // Ledger System
    getLedger: async (customerId: number): Promise<any[]> => {
        return await databaseService.query(
            `SELECT * FROM customer_ledger WHERE customer_id = ? ORDER BY date DESC`,
            [customerId]
        );
    },

    updateBalance: async (customerId: number, amount: number, type: 'DEBIT' | 'CREDIT', description: string, refId?: number): Promise<void> => {
        const date = new Date().toISOString();
        // 1. Update Customer Balance
        await databaseService.query(
            `UPDATE customers SET balance = balance + ? WHERE id = ?`,
            [amount, customerId]
        );

        // 2. Get new balance
        const res = await databaseService.query(`SELECT balance FROM customers WHERE id = ?`, [customerId]);
        const newBalance = res[0]?.balance || 0;

        // 3. Insert Ledger Entry
        await databaseService.query(
            `INSERT INTO customer_ledger (customer_id, type, amount, balance_after, description, reference_id, date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [customerId, type, amount, newBalance, description, refId || null, date]
        );
    },

    addPayment: async (customerId: number, amount: number, notes?: string): Promise<void> => {
        // Payment reduces the balance (which represents debt), so we pass negative amount
        await customerService.updateBalance(customerId, -amount, 'CREDIT', notes || 'Payment Received');

        // Post Accounting Voucher
        try {
            const { accountingService } = await import('./accountingService');
            const cashAcc = await accountingService.getAccountByCode('1001');
            const receivableAcc = await accountingService.getAccountByCode('1003');

            if (cashAcc && receivableAcc) {
                await accountingService.postVoucher({
                    date: new Date().toISOString(),
                    type: 'RECEIPT',
                    total_amount: amount,
                    notes: `Customer Payment: ${notes || 'Payment Received'}`
                }, [
                    { account_id: cashAcc.id, type: 'DEBIT', amount: amount, description: `Cash Received - Customer ID: ${customerId}` },
                    { account_id: receivableAcc.id, type: 'CREDIT', amount: amount, description: `Balance Reduction - Customer ID: ${customerId}` }
                ]);
            }
        } catch (e) {
            console.error('Accounting Post Failed (Customer Payment):', e);
        }
    }
};
