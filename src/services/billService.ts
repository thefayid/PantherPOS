import type { Product } from '../types/db';
import { cashService } from './cashService';
import { customerService } from './customerService';
import { eventBus } from '../utils/EventBus';
import { databaseService } from './databaseService';
import toast from 'react-hot-toast';

export interface TransactionData {
    items: (Product & { quantity: number; amount: number })[];
    subtotal: number;
    totalTax: number;
    grandTotal: number;
    paymentMode: string; // Legacy field, will be "SPLIT" or the single mode
    tenders: { mode: string; amount: number }[];
    taxInclusive: boolean;
    isInterState: boolean;
    customer_id?: number;
    discount_amount: number;
    points_redeemed: number;
    points_earned: number;
    promotion_id?: number;
    order_type?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    notes?: string;
    originalBillId?: number;
}

export const billService = {
    generateBillNo: async (): Promise<string> => {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const prefix = `BILL-${yyyy}${mm}${dd}`;

        // Get count of bills today to generate sequence
        const result = await databaseService.query(
            `SELECT count(*) as count FROM bills WHERE bill_no LIKE ?`,
            [`${prefix}%`]
        );

        const count = (result[0]?.count || 0) + 1;
        const sequence = String(count).padStart(4, '0');
        return `${prefix}-${sequence}`;
    },

    saveBill: async (data: TransactionData): Promise<string> => {
        const billNo = await billService.generateBillNo();
        const dateStr = new Date().toISOString();

        // Calculate tax breakdown
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (data.isInterState) {
            igst = data.totalTax;
        } else {
            cgst = data.totalTax / 2;
            sgst = data.totalTax / 2;
        }

        // If multi-tender, use "SPLIT" as the primary mode in bills table
        const primaryPaymentMode = data.tenders.length > 1 ? 'SPLIT' : (data.tenders[0]?.mode || 'CASH');

        // Determine Status based on total
        const status = data.grandTotal < 0 ? 'REFUNDED' : 'PAID';

        console.log('[billService] Debug - Saving Bill:', { total: data.grandTotal, status });
        // toast('Debug: Saving Bill ' + status + ' ₹' + data.grandTotal, { icon: '🐛' });

        const insertResult = await databaseService.query(
            `INSERT INTO bills (bill_no, date, subtotal, cgst, sgst, igst, gst_total, total, payment_mode, customer_id, discount_amount, points_redeemed, points_earned, promotion_id, order_type, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [billNo, dateStr, data.subtotal, cgst, sgst, igst, data.totalTax, data.grandTotal, primaryPaymentMode, data.customer_id || null, data.discount_amount, data.points_redeemed, data.points_earned, data.promotion_id || null, data.order_type || 'DINE_IN', data.notes || '', status]
        );

        if (insertResult.error) {
            toast.error('Debug: DB Insert Failed: ' + insertResult.error);
            throw new Error(`Database Insert Error: ${insertResult.error}`);
        }

        console.log('[billService] Insert Result:', insertResult);

        // Get the ID directly from the insert result
        let billId = insertResult.lastInsertRowid;
        console.log('[billService] Generated Bill ID (Initial):', billId);

        // Fallback: If ID is missing (IPC issue), fetch it by bill_no
        if (!billId) {
            console.warn('[billService] ID missing from insert result. Attempting fallback fetch...');
            try {
                const idRes = await databaseService.query('SELECT id FROM bills WHERE bill_no = ?', [billNo]);
                if (idRes && idRes.length > 0) {
                    billId = idRes[0].id;
                    console.log('[billService] Fallback ID fetched:', billId);
                }
            } catch (e) {
                console.error('[billService] Fallback fetch failed:', e);
            }
        }

        if (!billId) {
            console.error('[billService] CRITICAL: Bill ID is null/undefined!');
            toast.error('Error: Failed to generate Bill ID');
            throw new Error('Failed to generate Bill ID');
        }

        // toast('Debug: Bill Saved ID=' + billId, { icon: '✅' });

        // 1b. Insert Tenders
        for (const tender of data.tenders) {
            await databaseService.query(
                `INSERT INTO bill_tenders (bill_id, mode, amount) VALUES (?, ?, ?)`,
                [billId, tender.mode, tender.amount]
            );

            // Handle Credit Ledger
            if (tender.mode === 'CREDIT' && data.customer_id) {
                // Import dynamically to avoid circular dependency if possible, or assume it's safe since billService doesn't import customerService yet.
                // Actually better to import at top if simple.
                // Assuming customerService is imported.
                await customerService.updateBalance(data.customer_id, tender.amount, 'DEBIT', `Bill Sale: ${billNo}`, billId);
            }
        }

        // 1c. Update Customer Loyalty Points & Stats
        if (data.customer_id) {
            // Update purchase stats
            await customerService.updateStats(data.customer_id, data.grandTotal);

            // Update Points: Add earned, subtract redeemed
            const netPoints = (data.points_earned || 0) - (data.points_redeemed || 0);
            if (netPoints !== 0) {
                await customerService.updatePoints(data.customer_id, netPoints);
            }
        }

        // 2. Insert Bill Items
        console.log('[billService] Inserting Items. Count:', data.items.length);
        for (const item of data.items) {
            console.log('[billService] Saving Item:', item.id, item.name, item.quantity);
            let taxableValue = 0;
            let gstAmount = 0;

            if (data.taxInclusive) {
                const totalAmount = item.sell_price * item.quantity;
                taxableValue = totalAmount / (1 + item.gst_rate / 100);
                gstAmount = totalAmount - taxableValue;
            } else {
                taxableValue = item.sell_price * item.quantity;
                gstAmount = (taxableValue * item.gst_rate) / 100;
            }

            await databaseService.query(
                `INSERT INTO bill_items (bill_id, product_id, quantity, price, taxable_value, gst_rate, gst_amount)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [billId, item.id, item.quantity, item.sell_price, taxableValue, item.gst_rate, gstAmount]
            );

            // 3. Update Stock
            await databaseService.query(
                `UPDATE products SET stock = stock - ? WHERE id = ?`,
                [item.quantity, item.id]
            );
        }

        // 4. Record Cash Transaction if applicable
        const cashTenders = data.tenders.filter(t => t.mode === 'CASH');
        const totalCash = cashTenders.reduce((sum, t) => sum + t.amount, 0);

        if (totalCash !== 0) {
            const session = await cashService.getCurrentSession();
            if (session) {
                const type = totalCash > 0 ? 'SALE' : 'REFUND';
                await cashService.addTransaction(
                    session.id,
                    type,
                    Math.abs(totalCash),
                    `Bill ${type === 'SALE' ? 'Sale' : 'Refund'}: ${billNo}`
                );
            } else {
                console.error('No active cash session found for bill:', billNo);
                throw new Error("No Active Cash Session. Please 'Open Register' in Cash Management before processing Cash transactions.");
            }
        }

        // 5. Post Accounting Voucher
        try {
            const { accountingService } = await import('./accountingService');
            const salesAcc = await accountingService.getAccountByCode('4001');
            const gstAcc = await accountingService.getAccountByCode('2002');
            const cashAcc = await accountingService.getAccountByCode('1001');
            const bankAcc = await accountingService.getAccountByCode('1002');
            const receivableAcc = await accountingService.getAccountByCode('1003');

            if (salesAcc && gstAcc) {
                const voucherItems = [];

                // Credit Sales (Taxable Value)
                voucherItems.push({
                    account_id: salesAcc.id,
                    type: 'CREDIT' as const,
                    amount: data.subtotal,
                    description: `Sales Revenue - ${billNo}`
                });

                // Credit GST
                if (data.totalTax > 0) {
                    voucherItems.push({
                        account_id: gstAcc.id,
                        type: 'CREDIT' as const,
                        amount: data.totalTax,
                        description: `GST collected - ${billNo}`
                    });
                }

                // Debits (Payments)
                for (const tender of data.tenders) {
                    let accId = cashAcc?.id;
                    if (tender.mode === 'CARD' || tender.mode === 'UPI') accId = bankAcc?.id;
                    if (tender.mode === 'CREDIT') accId = receivableAcc?.id;

                    if (accId) {
                        voucherItems.push({
                            account_id: accId,
                            type: 'DEBIT' as const,
                            amount: tender.amount,
                            description: `Payment ${tender.mode} - ${billNo}`
                        });
                    }
                }

                await accountingService.postVoucher({
                    date: dateStr,
                    type: 'SALES',
                    total_amount: data.grandTotal,
                    reference_id: billNo,
                    notes: `System generated sale voucher for ${billNo}`
                }, voucherItems);
            }
        } catch (e) {
            console.error('Accounting Post Failed:', e);
            // We don't throw here to avoid failing the bill save which is critical.
        }

        // Emit Sale Completed Event
        eventBus.emit('SALE_COMPLETED', undefined);

        // 6. Trigger Tally Sync (Background)
        // We do not await this so it doesn't block the UI
        import('./tally/TallyService').then(async ({ tallyService }) => {
            const config = tallyService.getConfig();
            if (config.autoSync) {
                // Construct Invoice Object for Tally
                const tallyInvoice = {
                    id: billNo,
                    date: dateStr.split('T')[0],
                    customerName: data.customer_id ? (await customerService.getById(data.customer_id))?.name : 'Walk-in',
                    items: data.items.map(i => ({
                        name: i.name,
                        quantity: i.quantity,
                        price: i.sell_price
                    })),
                    tax: data.totalTax
                };

                tallyService.pushSalesVoucher(tallyInvoice).then(res => {
                    if (res.status === 'FAILURE') {
                        console.error("Auto-Push to Tally Failed:", res.message);
                        // Future: Add to Retry Queue
                    } else {
                        console.log("Auto-Pushed to Tally:", billNo);
                    }
                });
            }
        });

        // 7. Trigger Automation (Background)
        import('./automationService').then(({ automationService }) => {
            automationService.checkTriggers('NEW_SALE', {
                id: billId,
                billNo,
                grandTotal: data.grandTotal,
                customer_id: data.customer_id
            });
        });

        // 5. Update Original Bill if this is a Refund (REMOVED)
        // Feature disabled by user request.

        return billNo;
    },

    holdBill: async (items: any[], customerName?: string): Promise<void> => {
        const dateStr = new Date().toISOString();
        const itemsJson = JSON.stringify(items);
        await databaseService.query(
            `INSERT INTO held_bills (customer_name, date, items_json) VALUES (?, ?, ?)`,
            [customerName || 'Walk-in Customer', dateStr, itemsJson]
        );
    },

    getHeldBills: async (): Promise<any[]> => {
        return await databaseService.query(`SELECT * FROM held_bills ORDER BY date DESC`);
    },

    deleteHeldBill: async (id: number): Promise<void> => {
        await databaseService.query(`DELETE FROM held_bills WHERE id = ?`, [id]);
    },

    // Alias for consistency
    createBill: async (data: TransactionData, items: any[]): Promise<number> => {
        // Adapt TransactionData to saveBill signature or just use logic. 
        // saveBill takes (data: TransactionData).
        // The items arg in createBill(data, items) from estimateService seems redundant if data has items.
        // Let's fix the call in estimateService or just make this wrapper robust.

        // Actually estimateService calls: createBill( { ...header }, [...items] )
        // saveBill takes { items: ..., ...header }
        // So we need to merge.
        const fullData = { ...data, items } as TransactionData;
        const billNo = await billService.saveBill(fullData);

        // Return ID
        const res = await databaseService.query('SELECT id FROM bills WHERE bill_no = ?', [billNo]);
        return res[0].id;
    },

    updateBill: async (billId: number, data: TransactionData): Promise<void> => {
        // 1. Get Old Bill Items to Reverse Stock
        const oldItems = await databaseService.query('SELECT * FROM bill_items WHERE bill_id = ?', [billId]);

        // 2. Reverse Stock
        for (const item of oldItems) {
            await databaseService.query(
                'UPDATE products SET stock = stock + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // 3. Clear Old Items and Tenders
        await databaseService.query('DELETE FROM bill_items WHERE bill_id = ?', [billId]);
        await databaseService.query('DELETE FROM bill_tenders WHERE bill_id = ?', [billId]);

        // 4. Update Bill Header
        let cgst = 0, sgst = 0, igst = 0;
        if (data.isInterState) igst = data.totalTax;
        else { cgst = data.totalTax / 2; sgst = data.totalTax / 2; }

        await databaseService.query(
            `UPDATE bills SET subtotal=?, cgst=?, sgst=?, igst=?, gst_total=?, total=?, payment_mode=?, customer_id=?, discount_amount=?, status=?
             WHERE id=?`,
            [data.subtotal, cgst, sgst, igst, data.totalTax, data.grandTotal, data.tenders[0]?.mode || 'CASH', data.customer_id || null, data.discount_amount, 'PAID', billId]
        );

        // 5. Insert New Tenders
        for (const tender of data.tenders) {
            await databaseService.query(
                `INSERT INTO bill_tenders (bill_id, mode, amount) VALUES (?, ?, ?)`,
                [billId, tender.mode, tender.amount]
            );
        }

        // 6. Insert New Items & Deduct Stock
        for (const item of data.items) {
            let taxableValue = 0;
            let gstAmount = 0;

            if (data.taxInclusive) {
                const totalAmount = item.sell_price * item.quantity;
                taxableValue = totalAmount / (1 + item.gst_rate / 100);
                gstAmount = totalAmount - taxableValue;
            } else {
                taxableValue = item.sell_price * item.quantity;
                gstAmount = (taxableValue * item.gst_rate) / 100;
            }

            await databaseService.query(
                `INSERT INTO bill_items (bill_id, product_id, quantity, price, taxable_value, gst_rate, gst_amount)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [billId, item.id, item.quantity, item.sell_price, taxableValue, item.gst_rate, gstAmount]
            );

            await databaseService.query(
                `UPDATE products SET stock = stock - ? WHERE id = ?`,
                [item.quantity, item.id]
            );
        }
    },

    getBill: async (identifier: string | number): Promise<any> => {
        // Try searching by Bill No first, then by ID
        let sql = `
            SELECT b.*, c.name as customer_name, c.phone as customer_phone 
            FROM bills b
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.bill_no = ? OR b.id = ?
        `;
        const result = await databaseService.query(sql, [identifier, identifier]);

        if (result.length === 0) return null;

        const bill = result[0];

        // Get items
        const items = await databaseService.query(
            `SELECT bi.*, p.name as product_name 
             FROM bill_items bi
             LEFT JOIN products p ON bi.product_id = p.id
             WHERE bi.bill_id = ?`,
            [bill.id]
        );

        return { ...bill, items };
    },

    updateNotes: async (billNo: string, notes: string) => {
        return databaseService.query(
            'UPDATE bills SET notes = ? WHERE bill_no = ?',
            [notes, billNo]
        );
    },

    getBillByNo: async (billNo: string) => {
        const billQuery = `
            SELECT b.*, c.name as customer_name, c.phone as customer_phone 
            FROM bills b
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.bill_no = ?
        `;
        const bills = await databaseService.query(billQuery, [billNo]);

        if (!bills || bills.length === 0) return null;

        const bill = bills[0];
        console.log('[billService] getBillByNo - Found Bill:', bill.id, bill.bill_no);

        // DEBUG: Check raw items
        try {
            const rawItems = await databaseService.query('SELECT * FROM bill_items WHERE bill_id = ?', [bill.id]);
            console.log('[billService] Raw Bill Items:', rawItems);
            if (rawItems.length === 0) {
                console.warn('[billService] WARNING: No items found in bill_items for bill_id:', bill.id);
            }
        } catch (e) {
            console.error('[billService] Error checking raw items:', e);
        }

        // Fetch items
        const itemsQuery = `
            SELECT bi.*, p.name, p.barcode, p.image, p.sell_price as current_price
            FROM bill_items bi
            LEFT JOIN products p ON bi.product_id = p.id
            WHERE bi.bill_id = ?
        `;
        const items = await databaseService.query(itemsQuery, [bill.id]);

        return { ...bill, items };
    }
};
