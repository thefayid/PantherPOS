import type { Supplier } from '../types/db';
import { databaseService } from './databaseService';

export const supplierService = {
    getAll: async (): Promise<Supplier[]> => {
        return await databaseService.query('SELECT * FROM suppliers ORDER BY name ASC');
    },

    search: async (query: string): Promise<Supplier[]> => {
        const term = `%${query}%`;
        return await databaseService.query(
            'SELECT * FROM suppliers WHERE name LIKE ? OR contact_person LIKE ? OR phone LIKE ? ORDER BY name ASC',
            [term, term, term]
        );
    },

    getById: async (id: number): Promise<Supplier | null> => {
        const results = await databaseService.query('SELECT * FROM suppliers WHERE id = ?', [id]);
        return results[0] || null;
    },

    create: async (supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<number> => {
        const result = await databaseService.query(
            `INSERT INTO suppliers (name, contact_person, phone, email, address, gstin, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [supplier.name, supplier.contact_person || null, supplier.phone || null, supplier.email || null, supplier.address || null, supplier.gstin || null, new Date().toISOString()]
        );
        return result.changes;
    },

    update: async (supplier: Supplier): Promise<number> => {
        const result = await databaseService.query(
            `UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=?, gstin=? WHERE id=?`,
            [supplier.name, supplier.contact_person || null, supplier.phone || null, supplier.email || null, supplier.address || null, supplier.gstin || null, supplier.id]
        );
        return result.changes;
    },

    delete: async (id: number): Promise<number> => {
        // Check if supplier has any purchase orders before deleting
        const orders = await databaseService.query('SELECT count(*) as count FROM purchase_orders WHERE supplier_id = ?', [id]);
        if (orders[0].count > 0) {
            throw new Error('Cannot delete supplier with existing purchase orders');
        }
        const result = await databaseService.query('DELETE FROM suppliers WHERE id = ?', [id]);
        return result.changes;
    },

    // --- LEDGER ---
    getLedger: async (supplierId: number): Promise<any[]> => {
        return await databaseService.query(
            `SELECT * FROM supplier_ledger WHERE supplier_id = ? ORDER BY date DESC`,
            [supplierId]
        );
    },

    updateBalance: async (supplierId: number, amount: number, type: 'DEBIT' | 'CREDIT', description: string, refId?: number) => {
        // 1. Get current balance
        const res = await databaseService.query(`SELECT balance FROM suppliers WHERE id = ?`, [supplierId]);
        const currentBalance = res[0]?.balance || 0;

        // 2. Calculate new balance
        // CREDIT means we OWE MORE (Purchase) -> Increase Balance
        // DEBIT means we PAID (Payment) -> Decrease Balance
        let newBalance = currentBalance;
        if (type === 'CREDIT') {
            newBalance += amount;
        } else {
            newBalance -= amount;
        }

        // 3. Update Supplier Balance
        await databaseService.query(`UPDATE suppliers SET balance = ? WHERE id = ?`, [newBalance, supplierId]);

        // 4. Insert Ledger Entry
        const date = new Date().toISOString();
        await databaseService.query(
            `INSERT INTO supplier_ledger (supplier_id, type, amount, balance_after, description, reference_id, date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [supplierId, type, amount, newBalance, description, refId || null, date]
        );
    },

    addPayment: async (supplierId: number, amount: number, mode: string, notes?: string) => {
        await supplierService.updateBalance(supplierId, amount, 'DEBIT', `Payment Out (${mode}) ${notes ? '- ' + notes : ''}`);

        // Post Accounting Voucher
        try {
            const { accountingService } = await import('./accountingService');
            const payableAcc = await accountingService.getAccountByCode('2001');
            const cashAcc = await accountingService.getAccountByCode(mode === 'CASH' ? '1001' : '1002');

            if (payableAcc && cashAcc) {
                await accountingService.postVoucher({
                    date: new Date().toISOString(),
                    type: 'PAYMENT',
                    total_amount: amount,
                    notes: `Supplier Payment: ${notes || 'Payment Out'}`
                }, [
                    { account_id: payableAcc.id, type: 'DEBIT', amount: amount, description: `Liability Reduction - Supplier ID: ${supplierId}` },
                    { account_id: cashAcc.id, type: 'CREDIT', amount: amount, description: `Cash/Bank Paid out via ${mode}` }
                ]);
            }
        } catch (e) {
            console.error('Accounting Post Failed (Supplier Payment):', e);
        }
    }
};
