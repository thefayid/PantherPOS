import { databaseService } from './databaseService';

export interface AppSettings {
    store_name: string;
    store_address: string;
    store_phone: string;
    gst_no: string;
    printer_enabled: boolean;
    printer_name: string;
    drawer_enabled: boolean;
    pulse_on: number;
    pulse_off: number;
    store_logo: string;
    receipt_header: string;
    invoice_terms: string;
    invoice_footer: string;
    scale_protocol: string;
    touch_mode: boolean;
}

let initPromise: Promise<void> | null = null;

export const settingsService = {
    init: async () => {
        if (initPromise) return initPromise;

        initPromise = (async () => {
            // We don't need to skip init in browser anymore as databaseService handles it.
            // But we can still create the 'settings' table if it doesn't exist in the master SCHEMA yet or for legacy support.
            await databaseService.query(`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            `);

            // Check if default settings exist, if not, create them
            const keys = [
                ['store_name', 'PantherPOS Store'],
                ['store_address', '123 Business Avenue, Tech Park'],
                ['store_phone', '+91 98765 43210'],
                ['gst_no', '29ABCDE1234F1Z5'],
                ['printer_enabled', 'false'],
                ['printer_name', 'Thermal Printer'],
                ['drawer_enabled', 'true'],
                ['pulse_on', '25'],
                ['pulse_off', '250'],
                ['store_logo', ''],
                ['receipt_header', 'Welcome to PantherPOS'],
                ['invoice_terms', '1. Goods once sold will not be taken back.\n2. Interest @18% will be charged if not paid within 7 days.'],
                ['invoice_footer', 'Thank you for your business!'],

                ['scale_enabled', 'false'],
                ['scale_port', 'COM1'],
                ['scale_baud_rate', '9600'],
                ['scale_protocol', 'GENERIC'],
                ['touch_mode', 'false']
            ];

            // Use INSERT OR IGNORE to avoid race conditions and UNIQUE constraint errors
            for (const [key, defaultValue] of keys) {
                await databaseService.query(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, [key, defaultValue]);
            }
        })();

        return initPromise;
    },

    getSettings: async (): Promise<AppSettings> => {
        const result = await databaseService.query(`SELECT * FROM settings`);
        const settings: any = {};
        result.forEach((row: { key: string; value: string }) => {
            if (row.key === 'printer_enabled' || row.key === 'drawer_enabled' || row.key === 'scale_enabled' || row.key === 'touch_mode') {
                settings[row.key] = row.value === 'true';
            } else if (row.key === 'pulse_on' || row.key === 'pulse_off' || row.key === 'scale_baud_rate') {
                settings[row.key] = parseInt(row.value);
            } else {
                settings[row.key] = row.value;
            }
        });
        return settings as AppSettings;
    },

    updateSetting: async (key: keyof AppSettings, value: string | number | boolean) => {
        await databaseService.query(
            `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            [key, String(value)]
        );
    },

    // --- TAX RATES ---
    getTaxRates: async (): Promise<{ id: number; name: string; rate: number; is_default: boolean }[]> => {
        const res = await databaseService.query(`SELECT * FROM tax_rates ORDER BY rate ASC`);
        return res.map((r: any) => ({ ...r, is_default: r.is_default === 1 }));
    },

    saveTaxRate: async (rate: { id?: number; name: string; rate: number; is_default: boolean }) => {
        if (rate.is_default) {
            await databaseService.query(`UPDATE tax_rates SET is_default = 0`);
        }

        if (rate.id) {
            await databaseService.query(
                `UPDATE tax_rates SET name = ?, rate = ?, is_default = ? WHERE id = ?`,
                [rate.name, rate.rate, rate.is_default ? 1 : 0, rate.id]
            );
        } else {
            await databaseService.query(
                `INSERT INTO tax_rates (name, rate, is_default) VALUES (?, ?, ?)`,
                [rate.name, rate.rate, rate.is_default ? 1 : 0]
            );
        }
    },

    deleteTaxRate: async (id: number) => {
        await databaseService.query(`DELETE FROM tax_rates WHERE id = ?`, [id]);
    }
};
