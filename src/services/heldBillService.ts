import { databaseService } from './databaseService';

export interface HeldBill {
    id: number;
    customer_name: string | null;
    date: string;
    items_json: string;
    total_amount?: number; // Calculated on retrieval
    item_count?: number;   // Calculated on retrieval
}

export const heldBillService = {
    add: async (customerName: string | null, items: any[]): Promise<void> => {
        if (!items || items.length === 0) return;

        const json = JSON.stringify(items);
        const date = new Date().toISOString();

        await databaseService.query(
            "INSERT INTO held_bills (customer_name, date, items_json) VALUES (?, ?, ?)",
            [customerName, date, json]
        );
    },

    getAll: async (): Promise<HeldBill[]> => {
        const results = await databaseService.query("SELECT * FROM held_bills ORDER BY id DESC");
        const rows = Array.isArray(results) ? results : (results ? [results] : []);

        // Parse metadata for UI without full parse if possible, or just parse length
        return rows.map((row: any) => {
            let count = 0;
            let total = 0;
            try {
                const items = JSON.parse(row.items_json);
                count = items.length;
                total = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
            } catch (e) {
                // ignore parse error
            }
            return { ...row, item_count: count, total_amount: total };
        });
    },

    delete: async (id: number): Promise<void> => {
        await databaseService.query("DELETE FROM held_bills WHERE id = ?", [id]);
    },

    retrieve: async (id: number): Promise<any[]> => {
        const result = await databaseService.query("SELECT items_json FROM held_bills WHERE id = ?", [id]);
        if (!result || !result[0]) return [];

        try {
            const items = JSON.parse(result[0].items_json);
            // Delete after retrieval? Typically yes for "Move to Cart"
            await heldBillService.delete(id);
            return items;
        } catch (e) {
            console.error("Failed to parse held bill items", e);
            return [];
        }
    }
};
