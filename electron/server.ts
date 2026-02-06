
import { app } from 'electron';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import os from 'os';
import fs from 'fs';

let server: any = null;

export const startServer = async (dbModule: any, log: (msg: string) => void = console.log) => {
    if (server) return; // Already running

    server = Fastify({ logger: false });

    // Enable CORS to allow requests from Android app on the network
    await server.register(cors, {
        origin: true, // Allow all origins (for local network simplicity)
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    });

    // --- ENDPOINTS ---

    // 1. Status Check
    server.get('/api/status', async () => {
        return {
            status: 'online',
            app_name: 'POS System',
            version: app.getVersion(),
            hostname: os.hostname()
        };
    });

    // 2. Products List
    server.get('/api/products', async () => {
        try {
            const sql = "SELECT * FROM products ORDER BY name ASC";
            const products = await dbModule.query(sql);
            return { success: true, count: products.length, data: products };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // 3. Customers List
    server.get('/api/customers', async () => {
        try {
            const sql = "SELECT * FROM customers ORDER BY name ASC";
            const customers = await dbModule.query(sql);
            return { success: true, count: customers.length, data: customers };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // 4. Create Order (Bill)
    server.post('/api/orders', async (request: any, reply: any) => {
        try {
            const { bill_no, date, subtotal, total, payment_mode, customer_id, items, tenders } = request.body;

            log(`[API] Received Order: ${bill_no} Total: ${total}`);

            // Basic Validation
            if (!bill_no || !items || items.length === 0) {
                return reply.code(400).send({ success: false, error: 'Invalid order data' });
            }

            // Using transaction if dbModule supports it, else sequential
            // Note: sql.js is synchronous, so simple sequence is fine

            // 1. Insert Bill
            const billSql = `
                INSERT INTO bills (bill_no, date, subtotal, total, payment_mode, customer_id, status)
                VALUES (?, ?, ?, ?, ?, ?, 'PAID')
            `;
            await dbModule.query(billSql, [bill_no, date, subtotal, total, payment_mode, customer_id]);

            // Get Bill ID
            const billIdRes = await dbModule.query("SELECT id FROM bills WHERE bill_no = ?", [bill_no]);
            if (!billIdRes || billIdRes.length === 0) throw new Error('Failed to retrieve bill ID');
            const billId = billIdRes[0].id;

            // 2. Insert Items
            for (const item of items) {
                await dbModule.query(
                    `INSERT INTO bill_items (bill_id, product_id, quantity, price, taxable_value, gst_rate, gst_amount)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [billId, item.product_id, item.quantity, item.price, item.taxable_value, item.gst_rate, item.gst_amount]
                );

                // Update Stock
                await dbModule.query(
                    "UPDATE products SET stock = stock - ? WHERE id = ?",
                    [item.quantity, item.product_id]
                );
            }

            // 3. Insert Tenders (if any)
            if (tenders && Array.isArray(tenders)) {
                for (const t of tenders) {
                    await dbModule.query(
                        "INSERT INTO bill_tenders (bill_id, mode, amount) VALUES (?, ?, ?)",
                        [billId, t.mode, t.amount]
                    );
                }
            }

            // 4. Update Customer Balance / Points (Optional - can be added later)
            // For now, simpler implementation

            return { success: true, bill_id: billId };
        } catch (e: any) {
            log(`[API] Order Error: ${e.message}`);
            return reply.code(500).send({ success: false, error: e.message });
        }
    });

    // 5. Database Export (Sync)
    server.get('/api/sync/export', async (request: any, reply: any) => {
        try {
            const dbPath = dbModule.getDbPath();
            if (!fs.existsSync(dbPath)) {
                return reply.code(404).send({ success: false, error: 'Database file not found' });
            }

            // Sync the in-memory state to disk before exporting
            // Assuming dbModule.query('VACUUM') or similar isn't needed here as save() is called on writes

            const buffer = fs.readFileSync(dbPath);
            const base64 = buffer.toString('base64');

            // Diagnostics info
            const products = await dbModule.query("SELECT COUNT(*) as count FROM products");
            const bills = await dbModule.query("SELECT COUNT(*) as count FROM bills");

            return {
                success: true,
                filename: 'pos.db',
                data: base64,
                size: buffer.byteLength,
                counts: {
                    products: products[0]?.count || 0,
                    bills: bills[0]?.count || 0
                },
                timestamp: new Date().toISOString()
            };
        } catch (e: any) {
            log(`[API] Export Error: ${e.message}`);
            return reply.code(500).send({ success: false, error: e.message });
        }
    });

    // 6. Remote Query Proxy (Two-Way Sync)
    server.post('/api/db/query', async (request: any, reply: any) => {
        try {
            const { sql, params } = request.body;
            if (!sql) {
                return reply.code(400).send({ success: false, error: 'SQL query is required' });
            }

            const result = await dbModule.query(sql, params || []);
            return { success: true, data: result };
        } catch (e: any) {
            log(`[API] Query Error: ${e.message}`);
            return reply.code(500).send({ success: false, error: e.message });
        }
    });

    // 7. Customer View (Mobile Bill)
    server.get('/view/:billNo', async (request: any, reply: any) => {
        try {
            const { billNo } = request.params;
            const bills = await dbModule.query("SELECT * FROM bills WHERE bill_no = ?", [billNo]);

            if (!bills || bills.length === 0) {
                return reply.type('text/html').send('<h1>Bill Not Found</h1>');
            }

            const bill = bills[0];
            const items = await dbModule.query("SELECT * FROM bill_items WHERE bill_id = ?", [bill.id]);
            const products = await dbModule.query("SELECT id, name FROM products");
            const productMap = new Map(products.map((p: any) => [p.id, p.name]));

            // Generate HTML
            const itemsHtml = items.map((item: any) => `
                <div class="item">
                    <div class="row">
                        <span class="name">${productMap.get(item.product_id) || 'Unknown Item'}</span>
                        <span class="price">₹${item.price}</span>
                    </div>
                    <div class="row sub">
                        <span>x${item.quantity}</span>
                        <span>₹${item.taxable_value + item.gst_amount}</span>
                    </div>
                </div>
            `).join('');

            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bill ${billNo}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; color: #18181b; }
        .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 24px; }
        .store-name { font-size: 24px; font-weight: 800; color: #27272a; margin-bottom: 4px; }
        .bill-no { color: #71717a; font-size: 14px; font-family: monospace; }
        .divider { height: 1px; background: #e4e4e7; margin: 16px 0; border: none; }
        .item { margin-bottom: 12px; }
        .row { display: flex; justify-content: space-between; align-items: baseline; }
        .name { font-weight: 500; }
        .sub { font-size: 13px; color: #71717a; margin-top: 2px; }
        .total-section { background: #f8fafc; margin: 20px -24px -24px; padding: 24px; border-radius: 0 0 16px 16px; border-top: 1px dashed #e2e8f0; }
        .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; margin-bottom: 16px; }
        .pay-btn { display: block; width: 100%; background: #22c55e; color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); }
        .pay-btn:active { transform: scale(0.98); }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="store-name">PantherPOS Store</div>
            <div class="bill-no">#${billNo}</div>
        </div>
        
        <div class="items">
            ${itemsHtml}
        </div>

        <div class="total-section">
            <div class="total-row">
                <span>Total Payload</span>
                <span>₹${bill.total}</span>
            </div>
            <!-- UPI Deep Link (Mock ID) -->
            <a href="upi://pay?pa=mockmerchant@upi&pn=PantherPOS&am=${bill.total}&tr=${billNo}&tn=Bill ${billNo}" class="pay-btn">
                Pay ₹${bill.total} with UPI
            </a>
        </div>
    </div>
</body>
</html>
            `;

            return reply.type('text/html').send(html);
        } catch (e: any) {
            return reply.code(500).send(`Error: ${e.message}`);
        }
    });
    // 8. IP Address Discovery
    log('Registering /api/ip endpoint...');
    server.get('/api/ip', async (request: any, reply: any) => {
        try {
            log('Hit /api/ip endpoint');
            const networks = os.networkInterfaces();
            let bestIp = 'localhost';

            for (const name of Object.keys(networks)) {
                for (const net of networks[name] || []) {
                    // Skip internal (127.0.0.1) and non-IPv4
                    if (net.family === 'IPv4' && !net.internal) {
                        // Prefer 192.168.x.x or 10.x.x.x
                        if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
                            log(`Found preferred IP: ${net.address}`);
                            return { ip: net.address };
                        }
                        bestIp = net.address;
                    }
                }
            }
            log(`Returning best match IP: ${bestIp}`);
            return { ip: bestIp };
        } catch (e: any) {
            log(`Error in /api/ip: ${e.message}`);
            return { ip: 'localhost' };
        }
    });

    // Start Listening
    try {
        const port = 3000;
        await server.listen({ port, host: '0.0.0.0' }); // Listen on all interfaces
        log(`API Server listening on http://0.0.0.0:${port}`);

        // Log IP addresses for user convenience
        const networks = os.networkInterfaces();
        for (const name of Object.keys(networks)) {
            for (const net of networks[name] || []) {
                if (net.family === 'IPv4' && !net.internal) {
                    log(`Network Interface: ${name} -> ${net.address}`);
                }
            }
        }
    } catch (err: any) {
        log(`Server startup error: ${err.message}`);
        process.exit(1);
    }
};
