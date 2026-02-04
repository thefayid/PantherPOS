import { databaseService } from './databaseService';

export const reportService = {
    // --- COMPREHENSIVE REPORT AGGREGATOR ---
    getComprehensiveReport: async (startDate: string, endDate: string) => {
        // Parallel fetch for performance
        const [
            sales = [],
            paymentSplit = [],
            gst = [],
            products = [],
            hourly = [],
            profit = [],
            refunds = [],
            discounts = [],
            topCustomers = [],
            cashSessions = [],
            staffPerformance = [],
            inventoryImpact = [],
            systemAlerts = {}
        ] = await Promise.all([
            reportService.getDailySales(startDate, endDate),
            reportService.getPaymentSplit(startDate, endDate),
            reportService.getGstSummary(startDate, endDate),
            reportService.getProductSales(startDate, endDate),
            reportService.getHourlySales(startDate, endDate),
            reportService.getProfitMargin(startDate, endDate),
            reportService.getRefundStats(startDate, endDate),
            reportService.getDiscountStats(startDate, endDate),
            reportService.getTopCustomers(startDate, endDate),
            reportService.getCashReconciliation(startDate, endDate),
            reportService.getStaffPerformance(startDate, endDate),
            reportService.getInventoryImpact(startDate, endDate),
            reportService.getSystemAlerts()
        ]);

        console.log('[DEBUG] Comprehensive Report Data:', {
            salesCount: sales?.length || 0,
            paymentModes: (paymentSplit || []).map((p: any) => p.payment_mode),
            gstRows: gst?.length || 0,
            productCount: products?.length || 0,
            hourlyRows: hourly?.length || 0,
            refundCount: refunds?.length || 0,
            discountCount: discounts?.length || 0,
            customerCount: topCustomers?.length || 0,
            cashSessionCount: cashSessions?.length || 0,
            staffPerformers: staffPerformance?.length || 0,
            inventoryImpactRows: inventoryImpact?.length || 0,
            systemAlerts: systemAlerts || {}
        });

        return {
            period: { start: startDate, end: endDate },
            generatedAt: new Date().toISOString(),
            salesSummary: sales,
            paymentSplit,
            taxDetails: gst,
            productAnalysis: products,
            timeAnalysis: hourly,
            profitMargins: profit,
            refunds,
            discounts,
            customerDetails: topCustomers,
            cashReconciliation: cashSessions,
            staffPerformance: staffPerformance,
            inventoryImpact: inventoryImpact,
            systemAlerts: systemAlerts
        };
    },

    getStaffPerformance: async (startDate: string, endDate: string) => {
        // Since user_id is not in bills, we use cash_drawer_sessions as a proxy for sales performed by users.
        // This will only count cash sales correctly. For a better implementation, bills table needs user_id.
        return await databaseService.query(`
            SELECT u.name, COUNT(ct.id) as txn_count, SUM(ct.amount) as total_cash_sales
            FROM users u
            JOIN cash_drawer_sessions cds ON u.id = cds.user_id
            JOIN cash_transactions ct ON cds.id = ct.session_id
            WHERE ct.type = 'SALE' AND date(ct.time, 'localtime') BETWEEN ? AND ?
            GROUP BY u.id
        `, [startDate, endDate]);
    },

    getInventoryImpact: async (startDate: string, endDate: string) => {
        return await databaseService.query(`
            SELECT p.name, SUM(bi.quantity) as qty_sold, p.stock as current_stock
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            JOIN products p ON bi.product_id = p.id
            WHERE b.status = 'PAID' AND date(b.date, 'localtime') BETWEEN ? AND ?
            GROUP BY p.id
            ORDER BY qty_sold DESC
        `, [startDate, endDate]);
    },

    getSystemAlerts: async () => {
        const lowStock = await databaseService.query(`
            SELECT COUNT(*) as count FROM products WHERE stock <= min_stock_level
        `);
        const totalProducts = await databaseService.query(`SELECT COUNT(*) as count FROM products`);

        return {
            lowStockCount: lowStock[0]?.count || 0,
            totalProducts: totalProducts[0]?.count || 0,
            backupStatus: "Auto-backup enabled (Hourly)"
        };
    },

    getRefundStats: async (startDate?: string, endDate?: string) => {
        let sql = `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM bills WHERE status IN ('REFUNDED', 'CANCELLED', 'RETURNED')`;
        const params: any[] = [];
        if (startDate) { sql += " AND date(date, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(date, 'localtime') <= ?"; params.push(endDate); }
        return await databaseService.query(sql, params);
    },

    getDiscountStats: async (startDate?: string, endDate?: string) => {
        let sql = `SELECT COUNT(*) as count, COALESCE(SUM(discount_amount), 0) as total_discount FROM bills WHERE status = 'PAID' AND discount_amount > 0`;
        const params: any[] = [];
        if (startDate) { sql += " AND date(date, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(date, 'localtime') <= ?"; params.push(endDate); }
        return await databaseService.query(sql, params);
    },

    getCashReconciliation: async (startDate?: string, endDate?: string) => {
        // Approximate by finding sessions closed within this range
        let sql = `SELECT * FROM cash_drawer_sessions WHERE status = 'CLOSED'`;
        const params: any[] = [];
        if (startDate) { sql += " AND date(end_time, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(end_time, 'localtime') <= ?"; params.push(endDate); }
        // Limit to prevent overflow
        sql += " ORDER BY end_time DESC LIMIT 10";
        return await databaseService.query(sql, params);
    },

    getDailySales: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT 
                date(date, 'localtime') as day, 
                COALESCE(SUM(total), 0) as total, 
                COUNT(*) as count,
                CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total), 0) / COUNT(*) ELSE 0 END as avg_ticket
            FROM bills
            WHERE (status = 'PAID' OR status IS NULL OR status = '')
        `;
        const params: any[] = [];
        // Use date() function with 'localtime' to align with user's day boundaries
        if (startDate) { sql += " AND date(date, 'localtime') >= ?"; params.push(startDate); }
        else { sql += " AND date(date, 'localtime') >= date('now', 'localtime', '-30 days')"; }

        if (endDate) { sql += " AND date(date, 'localtime') <= ?"; params.push(endDate); }

        sql += " GROUP BY day ORDER BY day DESC";
        return await databaseService.query(sql, params);
    },

    getOutstandingReceivables: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT 
                b.id, b.bill_no, b.date, b.total, b.status, 
                c.name as customer_name, c.phone as customer_phone,
                CAST((julianday('now') - julianday(b.date)) AS INTEGER) as days_overdue
            FROM bills b
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.status != 'PAID'
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND b.date >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND b.date <= ?"; params.push(endDate); }

        sql += " ORDER BY b.date DESC";
        return await databaseService.query(sql, params);
    },

    getPaymentSplit: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT bt.mode as payment_mode, COALESCE(SUM(bt.amount), 0) as total, COUNT(DISTINCT bt.bill_id) as count
            FROM bill_tenders bt
            JOIN bills b ON bt.bill_id = b.id
            WHERE (b.status = 'PAID' OR b.status IS NULL OR b.status = '')
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND date(b.date, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(b.date, 'localtime') <= ?"; params.push(endDate); }
        sql += " GROUP BY bt.mode";
        return await databaseService.query(sql, params);
    },

    getProductSales: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT p.name, p.barcode, COALESCE(SUM(bi.quantity), 0) as qty, COALESCE(SUM(bi.taxable_value + bi.gst_amount), 0) as total
            FROM bill_items bi
            JOIN products p ON bi.product_id = p.id
            JOIN bills b ON bi.bill_id = b.id
            WHERE (b.status = 'PAID' OR b.status IS NULL OR b.status = '')
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND date(b.date, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(b.date, 'localtime') <= ?"; params.push(endDate); }
        sql += " GROUP BY p.id ORDER BY qty DESC";
        return await databaseService.query(sql, params);
    },

    getGstSummary: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT 
                gst_rate, 
                COALESCE(SUM(taxable_value), 0) as taxable, 
                COALESCE(SUM(gst_amount), 0) as gst,
                COALESCE(SUM(gst_amount) / 2, 0) as cgst,
                COALESCE(SUM(gst_amount) / 2, 0) as sgst
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            WHERE b.status = 'PAID'
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND date(b.date, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(b.date, 'localtime') <= ?"; params.push(endDate); }
        sql += " GROUP BY gst_rate";
        return await databaseService.query(sql, params);
    },

    getHsnSummary: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT p.hsn_code, COALESCE(SUM(bi.taxable_value), 0) as taxable, COALESCE(SUM(gst_amount), 0) as gst
            FROM bill_items bi
            JOIN products p ON bi.product_id = p.id
            JOIN bills b ON bi.bill_id = b.id
            WHERE b.status = 'PAID'
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND date(b.date, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(b.date, 'localtime') <= ?"; params.push(endDate); }
        sql += " GROUP BY p.hsn_code";
        return await databaseService.query(sql, params);
    },

    getHourlySales: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT strftime('%H:00', date, 'localtime') as hour, COUNT(*) as count, COALESCE(SUM(total), 0) as total
            FROM bills
            WHERE status = 'PAID'
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND date(date, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(date, 'localtime') <= ?"; params.push(endDate); }
        sql += " GROUP BY hour ORDER BY hour";
        return await databaseService.query(sql, params);
    },

    getProfitMargin: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT 
                p.name, 
                p.barcode,
                COALESCE(SUM(bi.quantity), 0) as qty_sold,
                COALESCE(SUM(bi.quantity * bi.price), 0) as revenue,
                COALESCE(SUM(bi.quantity * p.cost_price), 0) as cost,
                (COALESCE(SUM(bi.quantity * bi.price), 0) - COALESCE(SUM(bi.quantity * p.cost_price), 0)) as profit,
                CASE 
                    WHEN COALESCE(SUM(bi.quantity * bi.price), 0) > 0 
                    THEN ((COALESCE(SUM(bi.quantity * bi.price), 0) - COALESCE(SUM(bi.quantity * p.cost_price), 0)) / COALESCE(SUM(bi.quantity * bi.price), 0)) * 100
                    ELSE 0 
                END as margin_percent
            FROM bill_items bi
            JOIN products p ON bi.product_id = p.id
            JOIN bills b ON bi.bill_id = b.id
            WHERE b.status = 'PAID'
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND date(b.date, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(b.date, 'localtime') <= ?"; params.push(endDate); }
        sql += " GROUP BY p.id ORDER BY profit DESC";
        return await databaseService.query(sql, params);
    },

    getStockMovement: async () => {
        // Since we don't have a dedicated stock movement table yet, we'll use Audit Logs
        // But Audit Logs are JSON unstructured. 
        // Ideally we need a 'stock_movements' table. 
        // For now, let's try to extract from audit_logs where action is related to stock.
        // This is a bit hacky but works for V1 without schema change.
        // BETTER: Use auditService.getLogs directly in frontend, or wrapper here.
        return [];
    },

    getTopCustomers: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT c.name, c.phone, COUNT(b.id) as visits, COALESCE(SUM(b.total), 0) as total_spent
            FROM bills b
            JOIN customers c ON b.customer_id = c.id
            WHERE b.status = 'PAID'
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND date(b.date, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(b.date, 'localtime') <= ?"; params.push(endDate); }
        sql += " GROUP BY c.id ORDER BY total_spent DESC LIMIT 20";
        return await databaseService.query(sql, params);
    },

    // --- PURCHASE REPORTS ---
    getPurchaseProducts: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT p.name, p.barcode, COALESCE(SUM(poi.quantity), 0) as qty_bought, COALESCE(SUM(poi.total_amount), 0) as total_spent
            FROM purchase_order_items poi
            JOIN products p ON poi.product_id = p.id
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            WHERE po.status = 'RECEIVED'
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND po.date >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND po.date <= ?"; params.push(endDate); }
        sql += " GROUP BY p.id ORDER BY total_spent DESC";
        return await databaseService.query(sql, params);
    },

    getSupplierList: async () => {
        return await databaseService.query("SELECT *, (SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = suppliers.id) as order_count FROM suppliers");
    },

    getUnpaidPurchases: async () => {
        // Assuming status 'ORDERED' implies pending payment/delivery validation
        return await databaseService.query("SELECT * FROM purchase_orders WHERE status != 'RECEIVED' ORDER BY date DESC");
    },

    getPurchaseInvoiceList: async (startDate?: string, endDate?: string) => {
        let sql = `
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE 1=1
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND po.date >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND po.date <= ?"; params.push(endDate); }
        sql += " ORDER BY po.date DESC";
        return await databaseService.query(sql, params);
    },

    // --- STOCK CONTROL ---
    getLowStockWarning: async () => {
        return await databaseService.query(`
            SELECT name, barcode, stock, min_stock_level 
            FROM products 
            WHERE stock <= min_stock_level AND stock > 0
            ORDER BY stock ASC
        `);
    },

    getReorderList: async () => {
        // Products with 0 or low stock
        return await databaseService.query(`
            SELECT name, barcode, stock, min_stock_level, (min_stock_level * 2) as suggested_order
            FROM products 
            WHERE stock <= min_stock_level
            ORDER BY stock ASC
        `);
    },

    // --- FINANCE ---
    getExpenses: async (startDate?: string, endDate?: string) => {
        let sql = `SELECT COALESCE(SUM(amount), 0) as total FROM cash_transactions WHERE type = 'PAYOUT'`;
        const params: any[] = [];
        if (startDate) { sql += " AND date(time, 'localtime') >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND date(time, 'localtime') <= ?"; params.push(endDate); }
        const res = await databaseService.query(sql, params);
        return res[0]?.total || 0;
    },


    getTransactionHistory: async (startDate?: string, endDate?: string) => {
        // Union of Sales (In) and Purchases (Out)
        // We will just return Sales for now as 'IN' transactions.
        let sql = `
            SELECT 
                'SALE' as type, 
                b.bill_no as ref, 
                b.date, 
                b.total as amount, 
                b.status,
                c.name as customer_name
            FROM bills b
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE 1=1
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND b.date >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND b.date <= ?"; params.push(endDate); }

        sql += " ORDER BY b.date DESC";
        return await databaseService.query(sql, params);
    },

    // --- LOSS & DAMAGE ---
    getLossAndDamage: async (startDate?: string, endDate?: string) => {
        // Using inventory_logs if populated, else falling back to empty
        // Assuming 'inventory_logs' table holds shrinkage data
        let sql = `
            SELECT il.*, p.name as product_name
            FROM inventory_logs il
            JOIN products p ON il.product_id = p.id
            WHERE il.quantity_change < 0 AND il.type IN ('SHRINKAGE', 'DAMAGE', 'LOSS')
        `;
        const params: any[] = [];
        if (startDate) { sql += " AND il.date >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND il.date <= ?"; params.push(endDate); }
        return await databaseService.query(sql, params);
    },

    // --- DASHBOARD ---
    getDashboardStats: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const salesRes = await databaseService.query(
            `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM bills WHERE date(date, 'localtime') >= date('now', 'localtime') AND (status = 'PAID' OR status IS NULL OR status = '')`
        );

        // 2. Low Stock Count
        const stockRes = await databaseService.query(
            `SELECT COUNT(*) as count FROM products WHERE stock <= min_stock_level`
        );

        // 3. Total Inventory Value (Approx Cost)
        const valueRes = await databaseService.query(
            `SELECT COALESCE(SUM(stock * cost_price), 0) as totalValue FROM products`
        );

        // 4. Sales Trend (Last 7 Days)
        const trendRes = await databaseService.query(
            `SELECT date(date) as day, SUM(total) as total 
             FROM bills 
             WHERE date >= date('now', '-7 days') AND status = 'PAID'
             GROUP BY day ORDER BY day ASC`
        );

        return {
            todaySales: salesRes[0]?.total || 0,
            billCount: salesRes[0]?.count || 0,
            lowStockCount: stockRes[0]?.count || 0,
            totalStockValue: valueRes[0]?.totalValue || 0,
            salesTrend: trendRes
        };
    },

    getRecentActivity: async () => {
        // Union Bills and Payments (if we had a unified activity log, but for now just recent bills)
        return await databaseService.query(
            `SELECT 
                b.id, b.bill_no, b.date, b.total, b.status, 'SALE' as type, c.name as customer_name
             FROM bills b
             LEFT JOIN customers c ON b.customer_id = c.id
             ORDER BY b.date DESC 
             LIMIT 5`
        );
    },

    // --- INTELLIGENT ANALYTICS (AI) ---
    getSalesComparison: async (period1Start: string, period1End: string, period2Start: string, period2End: string) => {
        const [sales1, sales2] = await Promise.all([
            databaseService.query(`SELECT COALESCE(SUM(total), 0) as total FROM bills WHERE date >= ? AND date <= ? AND status = 'PAID'`, [period1Start, period1End]),
            databaseService.query(`SELECT COALESCE(SUM(total), 0) as total FROM bills WHERE date >= ? AND date <= ? AND status = 'PAID'`, [period2Start, period2End])
        ]);

        const total1 = sales1[0]?.total || 0;
        const total2 = sales2[0]?.total || 0;

        let percentage = 0;
        if (total2 > 0) {
            percentage = ((total1 - total2) / total2) * 100;
        } else if (total1 > 0) {
            percentage = 100; // 0 to something is 100% growth effectively
        }

        return {
            currentTotal: total1,
            previousTotal: total2,
            percentageChange: percentage.toFixed(1),
            trend: percentage >= 0 ? 'UP' : 'DOWN'
        };
    },

    getTrendingProducts: async (limit: number = 5) => {
        // Trending in last 7 days
        return await databaseService.query(`
            SELECT p.name, SUM(bi.quantity) as qty_sold, SUM(bi.taxable_value + bi.gst_amount) as revenue
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            JOIN products p ON bi.product_id = p.id
            WHERE b.date >= date('now', '-7 days') AND b.status = 'PAID'
            GROUP BY p.id
            ORDER BY qty_sold DESC
            LIMIT ?
        `, [limit]);
    },

    getSalesProjection: async () => {
        // Simple linear projection for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const daysPassed = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        const salesRes = await databaseService.query(
            `SELECT COALESCE(SUM(total), 0) as total FROM bills WHERE date >= ? AND status = 'PAID'`,
            [startOfMonth]
        );

        const currentTotal = salesRes[0]?.total || 0;
        const dailyAverage = daysPassed > 0 ? currentTotal / daysPassed : 0;
        const projectedTotal = dailyAverage * daysInMonth;

        return {
            currentTotal,
            dailyAverage: dailyAverage.toFixed(2),
            projectedTotal: projectedTotal.toFixed(2),
            daysRemaining: daysInMonth - daysPassed
        };
    },

    getLeastSellingProducts: async (limit: number = 5) => {
        // Bottom selling items (excluding purely 0 if we want 'slow moving' among active, but user said 'not selling at all')
        // Actually, "not selling at all" means 0 sales.
        // Let's find items with 0 sales in last 30 days first.
        // OR items with lowest quantity sold.

        return await databaseService.query(`
            SELECT p.name, COALESCE(SUM(bi.quantity), 0) as qty_sold, COALESCE(SUM(bi.taxable_value + bi.gst_amount), 0) as revenue
            FROM products p
            LEFT JOIN bill_items bi ON p.id = bi.product_id 
            LEFT JOIN bills b ON bi.bill_id = b.id AND b.date >= date('now', '-30 days') AND b.status = 'PAID'
            GROUP BY p.id
            ORDER BY qty_sold ASC
            LIMIT ?
        `, [limit]);
    },

    getDeadStock: async (days: number = 180) => {
        // Find products with stock > 0 that have NOT been sold in the last X days
        return await databaseService.query(`
            SELECT p.name, p.barcode, p.stock, p.sell_price, p.cost_price, p.id
            FROM products p
            WHERE p.stock > 0 
            AND p.id NOT IN (
                SELECT bi.product_id 
                FROM bill_items bi
                JOIN bills b ON bi.bill_id = b.id
                WHERE b.date >= date('now', '-' || ? || ' days')
                AND b.status = 'PAID'
            )
            ORDER BY p.stock DESC
            LIMIT 50
        `, [days]);
    },

    getInventoryForecast: async () => {
        // 1. Get sales from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        const sales = await databaseService.query(`
            SELECT p.id, p.name, p.stock, p.min_stock_level, SUM(bi.quantity) as total_sold
            FROM products p
            LEFT JOIN bill_items bi ON p.id = bi.product_id
            LEFT JOIN bills b ON bi.bill_id = b.id AND date(b.date, 'localtime') >= ? AND b.status = 'PAID'
            GROUP BY p.id
        `, [startDate]);

        // 2. Calculate Velocity & Predictions
        const forecast = sales.map((item: any) => {
            const dailyVelocity = (item.total_sold || 0) / 30;
            const daysRemaining = dailyVelocity > 0 ? Math.floor(item.stock / dailyVelocity) : 999;
            const status = daysRemaining <= 7 ? 'CRITICAL' : daysRemaining <= 15 ? 'WARNING' : 'HEALTHY';
            const suggestedReorder = dailyVelocity > 0 ? Math.ceil(dailyVelocity * 30) : 0;

            return {
                ...item,
                dailyVelocity: dailyVelocity.toFixed(2),
                daysRemaining,
                status,
                suggestedReorder: Math.max(suggestedReorder, item.min_stock_level)
            };
        });

        // 3. Sort by urgency
        return forecast
            .filter((f: any) => f.daysRemaining < 45 || f.stock <= f.min_stock_level)
            .sort((a: any, b: any) => a.daysRemaining - b.daysRemaining);
    },

    // --- GST DASHBOARD ---
    getGstDashboardStats: async (startDate?: string, endDate?: string) => {
        const from = startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0]; // Start of month
        const to = endDate || new Date().toISOString().split('T')[0];

        // 1. Output GST (from Sales)
        const outputGst = await databaseService.query(`
            SELECT 
                COALESCE(SUM(gst_amount), 0) as total_gst,
                COALESCE(SUM(gst_amount)/2, 0) as cgst,
                COALESCE(SUM(gst_amount)/2, 0) as sgst
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            WHERE b.status = 'PAID' AND date(b.date, 'localtime') BETWEEN ? AND ?
        `, [from, to]);

        // 2. Input GST / ITC (from Purchases)
        const inputGst = await databaseService.query(`
            SELECT 
                COALESCE(SUM(poi.quantity * poi.cost_price * (p.gst_rate / 100.0)), 0) as total_itc,
                COALESCE(SUM(poi.quantity * poi.cost_price * (p.gst_rate / 100.0)) / 2, 0) as cgst,
                COALESCE(SUM(poi.quantity * poi.cost_price * (p.gst_rate / 100.0)) / 2, 0) as sgst
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            JOIN products p ON poi.product_id = p.id
            WHERE po.status = 'RECEIVED' AND date(po.date, 'localtime') BETWEEN ? AND ?
        `, [from, to]);

        const output = outputGst[0] || { total_gst: 0, cgst: 0, sgst: 0 };
        const input = inputGst[0] || { total_itc: 0, cgst: 0, sgst: 0 };

        return {
            output: {
                total: output.total_gst,
                cgst: output.cgst,
                sgst: output.sgst,
                igst: 0
            },
            input: {
                total: input.total_itc,
                cgst: input.cgst,
                sgst: input.sgst,
                igst: 0
            },
            payable: Math.max(0, output.total_gst - input.total_itc)
        };
    },

    getItcSummary: async (startDate?: string, endDate?: string) => {
        const from = startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
        const to = endDate || new Date().toISOString().split('T')[0];

        return await databaseService.query(`
            SELECT 
                s.name as party_name,
                p.gst_rate,
                SUM(poi.quantity * poi.cost_price * (p.gst_rate / 100.0)) as itc_amount,
                SUM(poi.total_amount) as total_received
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            JOIN suppliers s ON po.supplier_id = s.id
            JOIN products p ON poi.product_id = p.id
            WHERE po.status = 'RECEIVED' AND date(po.date, 'localtime') BETWEEN ? AND ?
            GROUP BY s.id, p.gst_rate
            ORDER BY itc_amount DESC
        `, [from, to]);
    },

    getGstr1Details: async (startDate?: string, endDate?: string) => {
        const from = startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
        const to = endDate || new Date().toISOString().split('T')[0];

        return await databaseService.query(`
            SELECT 
                b.bill_no,
                b.date as bill_date,
                COALESCE(c.name, 'Walk-in') as customer_name,
                bi.gst_rate,
                SUM(bi.taxable_value) as taxable_value,
                SUM(bi.gst_amount) as gst_amount,
                SUM(bi.gst_amount)/2 as cgst,
                SUM(bi.gst_amount)/2 as sgst
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.status = 'PAID' AND date(b.date, 'localtime') BETWEEN ? AND ?
            GROUP BY b.id, bi.gst_rate
            ORDER BY b.date DESC
        `, [from, to]);
    },

    getGstr3bSummary: async (startDate?: string, endDate?: string) => {
        const from = startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
        const to = endDate || new Date().toISOString().split('T')[0];

        // This is a summarized view for 3.1 Outward supplies and 4. Eligible ITC
        const outward = await databaseService.query(`
            SELECT 
                '3.1 (a) Outward Taxable Supplies' as nature_of_supplies,
                SUM(taxable_value) as total_taxable_value,
                SUM(gst_amount) as integrated_tax,
                SUM(gst_amount)/2 as central_tax,
                SUM(gst_amount)/2 as state_tax,
                0 as cess
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            WHERE b.status = 'PAID' AND date(b.date, 'localtime') BETWEEN ? AND ?
        `, [from, to]);

        const inward = await databaseService.query(`
            SELECT 
                '4 (A) (5) All other ITC' as nature_of_supplies,
                SUM(poi.quantity * poi.cost_price) as total_taxable_value,
                SUM(poi.quantity * poi.cost_price * (p.gst_rate / 100.0)) as integrated_tax,
                SUM(poi.quantity * poi.cost_price * (p.gst_rate / 100.0)) / 2 as central_tax,
                SUM(poi.quantity * poi.cost_price * (p.gst_rate / 100.0)) / 2 as state_tax,
                0 as cess
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            JOIN products p ON poi.product_id = p.id
            WHERE po.status = 'RECEIVED' AND date(po.date, 'localtime') BETWEEN ? AND ?
        `, [from, to]);

        return [...outward, ...inward];
    }
};
