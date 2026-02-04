"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const electron_1 = require("electron");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
let server = null;
const startServer = async (dbModule, log = console.log) => {
    if (server)
        return; // Already running
    server = (0, fastify_1.default)({ logger: false });
    // Enable CORS to allow requests from Android app on the network
    await server.register(cors_1.default, {
        origin: true, // Allow all origins (for local network simplicity)
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    });
    // --- ENDPOINTS ---
    // 1. Status Check
    server.get('/api/status', async () => {
        return {
            status: 'online',
            app_name: 'POS System',
            version: electron_1.app.getVersion(),
            hostname: os_1.default.hostname()
        };
    });
    // 2. Products List
    server.get('/api/products', async () => {
        try {
            const sql = "SELECT * FROM products ORDER BY name ASC";
            const products = await dbModule.query(sql);
            return { success: true, count: products.length, data: products };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // 3. Customers List
    server.get('/api/customers', async () => {
        try {
            const sql = "SELECT * FROM customers ORDER BY name ASC";
            const customers = await dbModule.query(sql);
            return { success: true, count: customers.length, data: customers };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // 4. Create Order (Bill)
    server.post('/api/orders', async (request, reply) => {
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
            if (!billIdRes || billIdRes.length === 0)
                throw new Error('Failed to retrieve bill ID');
            const billId = billIdRes[0].id;
            // 2. Insert Items
            for (const item of items) {
                await dbModule.query(`INSERT INTO bill_items (bill_id, product_id, quantity, price, taxable_value, gst_rate, gst_amount)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`, [billId, item.product_id, item.quantity, item.price, item.taxable_value, item.gst_rate, item.gst_amount]);
                // Update Stock
                await dbModule.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id]);
            }
            // 3. Insert Tenders (if any)
            if (tenders && Array.isArray(tenders)) {
                for (const t of tenders) {
                    await dbModule.query("INSERT INTO bill_tenders (bill_id, mode, amount) VALUES (?, ?, ?)", [billId, t.mode, t.amount]);
                }
            }
            // 4. Update Customer Balance / Points (Optional - can be added later)
            // For now, simpler implementation
            return { success: true, bill_id: billId };
        }
        catch (e) {
            log(`[API] Order Error: ${e.message}`);
            return reply.code(500).send({ success: false, error: e.message });
        }
    });
    // 5. Database Export (Sync)
    server.get('/api/sync/export', async (request, reply) => {
        try {
            const dbPath = dbModule.getDbPath();
            if (!fs_1.default.existsSync(dbPath)) {
                return reply.code(404).send({ success: false, error: 'Database file not found' });
            }
            // Sync the in-memory state to disk before exporting
            // Assuming dbModule.query('VACUUM') or similar isn't needed here as save() is called on writes
            const buffer = fs_1.default.readFileSync(dbPath);
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
        }
        catch (e) {
            log(`[API] Export Error: ${e.message}`);
            return reply.code(500).send({ success: false, error: e.message });
        }
    });
    // 6. Remote Query Proxy (Two-Way Sync)
    server.post('/api/db/query', async (request, reply) => {
        try {
            const { sql, params } = request.body;
            if (!sql) {
                return reply.code(400).send({ success: false, error: 'SQL query is required' });
            }
            const result = await dbModule.query(sql, params || []);
            return { success: true, data: result };
        }
        catch (e) {
            log(`[API] Query Error: ${e.message}`);
            return reply.code(500).send({ success: false, error: e.message });
        }
    });
    // Start Listening
    try {
        const port = 3000;
        await server.listen({ port, host: '0.0.0.0' }); // Listen on all interfaces
        log(`API Server listening on http://0.0.0.0:${port}`);
        // Log IP addresses for user convenience
        const networks = os_1.default.networkInterfaces();
        for (const name of Object.keys(networks)) {
            for (const net of networks[name] || []) {
                if (net.family === 'IPv4' && !net.internal) {
                    log(`Network Interface: ${name} -> ${net.address}`);
                }
            }
        }
    }
    catch (err) {
        log(`Server startup error: ${err.message}`);
        process.exit(1);
    }
};
exports.startServer = startServer;
