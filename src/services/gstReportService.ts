import { databaseService } from './databaseService';
import { gstService } from './gstService';

export interface GSTR1Report {
    b2b: any[];
    b2cs: any[]; // B2C Small (intra-state or inter-state < 2.5L)
    b2cl: any[]; // B2C Large (inter-state > 2.5L)
    hsn: any[];
    docs: any[];
}

export interface GSTR3BReport {
    outward_taxable: any;
    inter_state_supplies: any[];
    eligible_itc: any; // Input Tax Credit (usually manual or from purchases)
    exempt_nil_non_gst: any;
}

export const gstReportService = {
    /**
     * Generate GSTR-1 Data (Outward Supplies)
     */
    getGSTR1Data: async (startDate: string, endDate: string): Promise<GSTR1Report> => {
        // 1. B2B Invoices (Customers with GSTIN)
        const b2b = await databaseService.query(`
            SELECT 
                b.bill_no, b.date, b.total, b.place_of_supply, 
                b.customer_gstin, c.name as customer_name,
                b.subtotal as taxable_value, 
                b.cgst, b.sgst, b.igst,
                CASE 
                    WHEN b.igst > 0 THEN 'Inter-State'
                    ELSE 'Intra-State'
                END as supply_type
            FROM bills b
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.date BETWEEN ? AND ? 
            AND b.customer_gstin IS NOT NULL
            AND b.status != 'CANCELLED'
        `, [startDate, endDate]);

        // 2. B2C Large (Inter-state > 2.5L)
        const b2cl = await databaseService.query(`
            SELECT 
                b.bill_no, b.date, b.total, b.place_of_supply,
                b.subtotal as taxable_value, b.igst
            FROM bills b
            WHERE b.date BETWEEN ? AND ?
            AND b.customer_gstin IS NULL
            AND b.total > 250000
            AND b.igst > 0
            AND b.status != 'CANCELLED'
        `, [startDate, endDate]);

        // 3. B2C Small (Everything else)
        // Grouped by Place of Supply and Rate
        // Note: This is an approximation. Ideally, we need item-level grouping relative to rate.
        // For simplicity in this SQLite implementation, we'll list aggregate bills.
        // A production GSTR-1 needs state-wise + rate-wise grouping for B2CS.
        const b2cs = await databaseService.query(`
            SELECT 
                b.place_of_supply, 
                SUM(b.subtotal) as taxable_value,
                SUM(b.cgst) as cgst,
                SUM(b.sgst) as sgst,
                SUM(b.igst) as igst,
                SUM(b.total) as total_value
            FROM bills b
            WHERE b.date BETWEEN ? AND ?
            AND b.customer_gstin IS NULL
            AND (b.total <= 250000 OR b.igst = 0)
            AND b.status != 'CANCELLED'
            GROUP BY b.place_of_supply
        `, [startDate, endDate]);

        // 4. HSN Summary (Using bill_items table)
        const billItemsData = await databaseService.query(`
            SELECT 
                bi.quantity, bi.taxable_value, bi.gst_amount, bi.gst_rate,
                p.hsn_code, p.name as product_name,
                b.place_of_supply, b.igst as bill_igst, b.customer_gstin
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            LEFT JOIN products p ON bi.product_id = p.id
            WHERE b.date BETWEEN ? AND ? 
            AND b.status != 'CANCELLED'
        `, [startDate, endDate]);

        const hsnMap = new Map<string, {
            hsn_code: string,
            description: string,
            uqc: string,
            total_qty: number,
            total_val: number, // Total value (Taxable + Tax)
            taxable_val: number,
            igst: number,
            cgst: number,
            sgst: number,
            cess: number
        }>();

        billItemsData.forEach((item: any) => {
            const hsn = item.hsn_code || 'Others';
            const entry = hsnMap.get(hsn) || {
                hsn_code: hsn,
                description: item.product_name || 'Unknown Product',
                uqc: 'OTH', // Unit Quantity Code
                total_qty: 0,
                total_val: 0,
                taxable_val: 0,
                igst: 0,
                cgst: 0,
                sgst: 0,
                cess: 0
            };

            const qty = item.quantity || 0;
            const taxable = item.taxable_value || 0;
            const taxAmount = item.gst_amount || 0;
            const total = taxable + taxAmount;

            entry.total_qty += qty;
            entry.total_val += total;
            entry.taxable_val += taxable;

            // Tax Logic based on Bill's Place of Supply
            // If bill has IGST > 0, then all items in it generally follow inter-state logic
            // OR checks place_of_supply vs Company State (assuming 'Home State' logic or similar)
            // Simplified: If bill_igst > 0, assign to IGST.

            if (item.bill_igst > 0) {
                entry.igst += taxAmount;
            } else {
                entry.cgst += taxAmount / 2;
                entry.sgst += taxAmount / 2;
            }

            hsnMap.set(hsn, entry);
        });

        // 5. Document Issued Summary
        const docs = await databaseService.query(`
            SELECT 
                COUNT(*) as total_docs,
                MIN(bill_no) as from_serial,
                MAX(bill_no) as to_serial
            FROM bills
            WHERE date BETWEEN ? AND ?
            AND status != 'CANCELLED'
        `, [startDate, endDate]);

        return {
            b2b,
            b2cs,
            b2cl,
            hsn: Array.from(hsnMap.values()),
            docs
        };
    },

    /**
     * Generate GSTR-3B Data (Summary)
     */
    getGSTR3BData: async (startDate: string, endDate: string): Promise<GSTR3BReport> => {
        const result = await databaseService.query(`
            SELECT 
                SUM(subtotal) as total_taxable,
                SUM(igst) as total_igst,
                SUM(cgst) as total_cgst,
                SUM(sgst) as total_sgst,
                SUM(total) as total_value
            FROM bills
            WHERE date BETWEEN ? AND ?
            AND status != 'CANCELLED'
        `, [startDate, endDate]);

        const summary = result[0] || {};

        return {
            outward_taxable: {
                taxable_value: summary.total_taxable || 0,
                igst: summary.total_igst || 0,
                cgst: summary.total_cgst || 0,
                sgst: summary.total_sgst || 0,
                cess: 0
            },
            inter_state_supplies: [], // breakdown by state
            eligible_itc: {
                igst: 0, cgst: 0, sgst: 0, cess: 0
            },
            exempt_nil_non_gst: {
                inter_state: 0,
                intra_state: 0
            }
        };
    }
};
