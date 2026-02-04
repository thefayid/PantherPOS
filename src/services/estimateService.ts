import { databaseService } from './databaseService';
import { billService } from './billService';

// Reusing Bill interface structures as they are identical
export interface Estimate {
    id: number;
    estimate_no: string;
    customer_id?: number | null;
    sub_total: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    payment_mode: string;
    date: string;
    valid_until?: string;
    notes?: string;
    status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED';
}

export interface EstimateItem {
    id: number;
    estimate_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    tax_rate: number;
    total_amount: number;
}

export const estimateService = {
    getAll: async (): Promise<(Estimate & { customer_name?: string })[]> => {
        return await databaseService.query(`
            SELECT e.*, c.name as customer_name 
            FROM estimates e
            LEFT JOIN customers c ON e.customer_id = c.id
            ORDER BY e.date DESC
        `);
    },

    getById: async (id: number): Promise<{ estimate: Estimate, items: EstimateItem[] } | null> => {
        const res = await databaseService.query('SELECT * FROM estimates WHERE id = ?', [id]);
        if (!res[0]) return null;

        const items = await databaseService.query('SELECT * FROM estimate_items WHERE estimate_id = ?', [id]);
        return { estimate: res[0], items };
    },

    create: async (data: Omit<Estimate, 'id' | 'estimate_no' | 'date'>, items: Omit<EstimateItem, 'id' | 'estimate_id'>[]): Promise<number> => {
        // Generate No
        const date = new Date();
        const prefix = `EST-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        const countRes = await databaseService.query('SELECT count(*) as c FROM estimates WHERE estimate_no LIKE ?', [`${prefix}%`]);
        const count = (countRes[0]?.c || 0) + 1;
        const estimateNo = `${prefix}-${count.toString().padStart(4, '0')}`;
        const now = new Date().toISOString();

        // Insert Header
        const result = await databaseService.query(
            `INSERT INTO estimates (estimate_no, date, customer_id, sub_total, discount_amount, tax_amount, total_amount, payment_mode, valid_until, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
            [estimateNo, now, data.customer_id || null, data.sub_total, data.discount_amount, data.tax_amount, data.total_amount, data.payment_mode, data.valid_until || null, data.notes || null]
        );
        const estimateId = result.changes;

        // Insert Items
        for (const item of items) {
            await databaseService.query(
                `INSERT INTO estimate_items (estimate_id, product_id, product_name, quantity, price, tax_rate, total_amount)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [estimateId, item.product_id, item.product_name, item.quantity, item.price, item.tax_rate, item.total_amount]
            );
        }
        return estimateId;
    },

    convertToBill: async (estimateId: number): Promise<number> => {
        const estData = await estimateService.getById(estimateId);
        if (!estData) throw new Error("Estimate not found");
        if (estData.estimate.status === 'CONVERTED') throw new Error("Already converted");

        // Create Bill (this will deduct stock as per billService logic)
        // We map estimate items to bill items
        const billId = await billService.createBill(
            {
                customer_id: estData.estimate.customer_id || undefined,
                subtotal: estData.estimate.sub_total,
                discount_amount: estData.estimate.discount_amount,
                totalTax: estData.estimate.tax_amount,
                grandTotal: estData.estimate.total_amount,
                paymentMode: estData.estimate.payment_mode || 'CASH',
                tenders: [{ mode: estData.estimate.payment_mode || 'CASH', amount: estData.estimate.total_amount }],
                taxInclusive: false, // Default for conversion
                isInterState: false, // Default for conversion
                points_earned: 0,
                points_redeemed: 0,
                items: [] // Will be populated by createBill wrapper
            },
            estData.items.map(i => ({
                id: i.product_id,
                name: i.product_name,
                sell_price: i.price,
                gst_rate: i.tax_rate,
                quantity: i.quantity,
                amount: i.total_amount
            }))
        );

        // Update Estimate Status
        await databaseService.query('UPDATE estimates SET status = ? WHERE id = ?', ['CONVERTED', estimateId]);

        return billId;
    }
};
