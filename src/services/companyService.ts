
import type { CompanySettings, VoidReason } from '../types/db';
import { databaseService } from './databaseService';
import { auditService } from './auditService';

export const companyService = {
    getSettings: async (): Promise<CompanySettings | null> => {
        const res = await databaseService.query('SELECT * FROM company_settings WHERE id = 1');
        return res[0] || null;
    },

    saveSettings: async (settings: Partial<CompanySettings>) => {
        // Upsert logic
        const existing = await companyService.getSettings();
        if (existing) {
            const keys = Object.keys(settings).filter(k => k !== 'id');
            if (keys.length === 0) return;
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const values = keys.map(k => (settings as any)[k]);
            await databaseService.query(
                `UPDATE company_settings SET ${setClause} WHERE id = 1`,
                values
            );
        } else {
            const keys = Object.keys(settings).filter(k => k !== 'id'); // Should include all, but filter id just in case we manually set it to 1
            const cols = ['id', ...keys].join(', ');
            const placeholders = ['1', ...keys.map(() => '?')].join(', ');
            const values = keys.map(k => (settings as any)[k]);
            await databaseService.query(
                `INSERT INTO company_settings (${cols}) VALUES (${placeholders})`,
                values
            );
        }
    },

    getVoidReasons: async (): Promise<VoidReason[]> => {
        return await databaseService.query('SELECT * FROM void_reasons');
    },

    addVoidReason: async (reason: string) => {
        await databaseService.query('INSERT INTO void_reasons (reason) VALUES (?)', [reason]);
    },

    deleteVoidReason: async (id: number) => {
        await databaseService.query('DELETE FROM void_reasons WHERE id = ?', [id]);
    },

    resetDatabase: async () => {
        await auditService.logChange('RESET_DATABASE', {
            entity: 'database',
            severity: 'CRITICAL',
            message: 'Factory reset initiated (business data wipe).',
            meta: { scope: 'business_data' }
        });

        // Dangerous operation. 
        // We typically wouldn't delete the company settings or user, just business data.
        // Let's clear: bills, bill_items, stocktake, customers, etc.
        const tables = [
            'bills', 'bill_items', 'bill_tenders', 'held_bills', 'returns', 'return_items',
            'customers', 'customer_ledger', 'suppliers', 'supplier_ledger', 'purchase_orders', 'purchase_order_items',
            'inventory_logs', 'stocktake_sessions', 'stocktake_items', 'cash_drawer_sessions', 'cash_transactions'
        ];

        for (const t of tables) {
            await databaseService.query(`DELETE FROM ${t}`);
            await databaseService.query(`DELETE FROM sqlite_sequence WHERE name='${t}'`);
        }

        // Reset stock?
        await databaseService.query(`UPDATE products SET stock = 0`);

        await auditService.logChange('RESET_DATABASE', {
            entity: 'database',
            severity: 'CRITICAL',
            message: 'Factory reset completed.',
            meta: { clearedTables: tables }
        });
    }
};
