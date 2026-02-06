import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import initSqlJs from 'sql.js';

let db: any = null;
let dbPath: string = '';
let backupDir: string = '';

export const initDb = async (log: (msg: string) => void = console.log) => {
    try {
        const isDev = !app.isPackaged || !!process.env.VITE_DEV_SERVER_URL;

        dbPath = isDev
            ? path.join(__dirname, '../pos.db')
            : path.join(app.getPath('userData'), 'pos.db');

        backupDir = path.join(app.getPath('userData'), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        log(`Initializing DB (sql.js) at: ${dbPath}`);
        log(`Backup Directory: ${backupDir}`);

        const wasmPath = isDev
            ? path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm')
            : path.join(process.resourcesPath, 'sql-wasm.wasm');

        log(`Mode: ${isDev ? 'Development' : 'Production'}`);
        log(`WASM Path: ${wasmPath}`);
        log(`WASM Exists: ${fs.existsSync(wasmPath)}`);

        const SQL = await initSqlJs({
            locateFile: () => wasmPath
        });

        log('SQL.js initialized');

        let buffer;
        if (fs.existsSync(dbPath)) {
            buffer = fs.readFileSync(dbPath);
        }

        db = new SQL.Database(buffer);

        // Initialize schema
        const schema = `
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            barcode TEXT UNIQUE NOT NULL,
            cost_price REAL DEFAULT 0,
            sell_price REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            gst_rate REAL DEFAULT 0,
            hsn_code TEXT,
            min_stock_level INTEGER DEFAULT 5
        );
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_name TEXT,
            action TEXT NOT NULL,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL, -- 'LOW_STOCK', 'SYSTEM'
            title TEXT NOT NULL,
            message TEXT,
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_no TEXT UNIQUE NOT NULL,
            date TEXT NOT NULL,
            subtotal REAL NOT NULL,
            cgst REAL DEFAULT 0,
            sgst REAL DEFAULT 0,
            igst REAL DEFAULT 0,
            gst_total REAL DEFAULT 0,
            total REAL NOT NULL,
            payment_mode TEXT DEFAULT 'CASH',
            status TEXT DEFAULT 'PAID',
            customer_id INTEGER,
            FOREIGN KEY(customer_id) REFERENCES customers(id)
        );
        CREATE INDEX IF NOT EXISTS idx_bills_bill_no ON bills(bill_no);

        CREATE TABLE IF NOT EXISTS bill_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            returned_quantity INTEGER DEFAULT 0,
            price REAL NOT NULL,
            taxable_value REAL NOT NULL,
            gst_rate REAL NOT NULL,
            gst_amount REAL NOT NULL,
            FOREIGN KEY(bill_id) REFERENCES bills(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS held_bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT,
            date TEXT NOT NULL,
            items_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_bill_id INTEGER NOT NULL,
            bill_no TEXT UNIQUE NOT NULL,
            date TEXT NOT NULL,
            total_refund REAL NOT NULL,
            payment_mode TEXT DEFAULT 'CASH',
            reason TEXT,
            FOREIGN KEY(original_bill_id) REFERENCES bills(id)
        );

        CREATE TABLE IF NOT EXISTS return_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            refund_amount REAL NOT NULL,
            FOREIGN KEY(return_id) REFERENCES returns(id)
        );

        CREATE TABLE IF NOT EXISTS bill_tenders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_id INTEGER NOT NULL,
            mode TEXT NOT NULL,
            amount REAL NOT NULL,
            FOREIGN KEY(bill_id) REFERENCES bills(id)
        );
        CREATE INDEX IF NOT EXISTS idx_bill_tenders_bill_id ON bill_tenders(bill_id);

        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE,
            email TEXT,
            address TEXT,
            created_at TEXT NOT NULL,
            total_purchases REAL DEFAULT 0,
            last_visit TEXT,
            points REAL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
        CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

        CREATE TABLE IF NOT EXISTS promotions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- 'COUPON', 'AUTOMATED', 'LOYALTY'
            code TEXT UNIQUE, -- only for COUPON
            discount_type TEXT NOT NULL, -- 'PERCENT', 'FIXED'
            discount_value REAL NOT NULL,
            min_cart_value REAL DEFAULT 0,
            max_discount REAL DEFAULT 0,
            start_date TEXT,
            end_date TEXT,
            active INTEGER DEFAULT 1,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS loyalty_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            gstin TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

        CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_no TEXT UNIQUE NOT NULL,
            supplier_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'
            notes TEXT,
            receive_date TEXT,
            FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
        );
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_no ON purchase_orders(order_no);

        CREATE TABLE IF NOT EXISTS purchase_order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            cost_price REAL NOT NULL,
            total_amount REAL NOT NULL,
            FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            pin TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cash_drawer_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            start_cash REAL NOT NULL,
            end_cash REAL,
            status TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS cash_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            reason TEXT,
            time TEXT NOT NULL,
            FOREIGN KEY(session_id) REFERENCES cash_drawer_sessions(id)
        );

        CREATE TABLE IF NOT EXISTS stocktake_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            finalized_at TEXT
        );

        CREATE TABLE IF NOT EXISTS stocktake_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            system_stock REAL NOT NULL,
            counted_stock REAL NOT NULL,
            variance REAL NOT NULL,
            FOREIGN KEY(session_id) REFERENCES stocktake_sessions(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS inventory_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            quantity_change REAL NOT NULL,
            reason TEXT,
            date TEXT NOT NULL,
            user_id INTEGER,
            FOREIGN KEY(product_id) REFERENCES products(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS product_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS product_group_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            FOREIGN KEY(group_id) REFERENCES product_groups(id) ON DELETE CASCADE,
            FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS company_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT,
            tax_number TEXT,
            street_name TEXT,
            building_number TEXT,
            additional_street_name TEXT,
            plot_identification TEXT,
            district TEXT,
            postal_code TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            phone_number TEXT,
            email TEXT,
            bank_acc_number TEXT,
            bank_details TEXT,
            logo TEXT
        );

        CREATE TABLE IF NOT EXISTS void_reasons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reason TEXT NOT NULL
        );

        -- ACCOUNTING SYSTEM TABLES
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY')) NOT NULL,
            category TEXT, -- e.g., 'Current Asset', 'Fixed Asset'
            balance REAL DEFAULT 0,
            description TEXT,
            is_system BOOLEAN DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS vouchers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voucher_no TEXT UNIQUE NOT NULL,
            date TEXT NOT NULL,
            type TEXT CHECK(type IN ('RECEIPT', 'PAYMENT', 'JOURNAL', 'CONTRA', 'SALES', 'PURCHASE')) NOT NULL,
            total_amount REAL NOT NULL,
            reference_id TEXT, -- e.g., 'BILL-123', 'PO-456'
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS voucher_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voucher_id INTEGER NOT NULL,
            account_id INTEGER NOT NULL,
            type TEXT CHECK(type IN ('DEBIT', 'CREDIT')) NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            FOREIGN KEY(voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
            FOREIGN KEY(account_id) REFERENCES accounts(id)
        );

        CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
        CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);
        `;

        // Initialize schema
        try {
            db.exec(schema);
            console.log('Schema executed successfully (db.exec).');

            // Verify users table creation
            const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
            console.log('Users table check:', JSON.stringify(tableCheck));
        } catch (err) {
            console.error('Schema execution failed:', err);
            // Try to create users table explicitly if schema failed
            try {
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    pin TEXT UNIQUE NOT NULL,
                    created_at TEXT NOT NULL
                )`);
                console.log('Explicitly created users table fallback');
            } catch (e) {
                console.error('Fallback users creation failed:', e);
            }
        }

        // Migrations
        try {
            db.run("ALTER TABLE bills ADD COLUMN status TEXT DEFAULT 'PAID'");
        } catch (e) { }

        try {
            db.run("ALTER TABLE bill_items ADD COLUMN returned_quantity INTEGER DEFAULT 0");
        } catch (e) { }

        try {
            db.run("ALTER TABLE products ADD COLUMN min_stock_level INTEGER DEFAULT 5");
        } catch (e) { }

        try {
            db.run("ALTER TABLE products ADD COLUMN image TEXT");
            log('Migration: Successfully added image column to products');
        } catch (e: any) {
            log(`Migration Note (image column): ${e.message}`);
        }

        try {
            db.run("ALTER TABLE bills ADD COLUMN customer_id INTEGER");
        } catch (e) { }

        try {
            db.run("ALTER TABLE customers ADD COLUMN points REAL DEFAULT 0");
        } catch (e) { }

        try {
            db.run("ALTER TABLE bills ADD COLUMN discount_amount REAL DEFAULT 0");
        } catch (e) { }

        try {
            db.run("ALTER TABLE bills ADD COLUMN points_redeemed REAL DEFAULT 0");
        } catch (e) { }

        try {
            db.run("ALTER TABLE bills ADD COLUMN points_earned REAL DEFAULT 0");
        } catch (e) { }

        try {
            db.run("ALTER TABLE bills ADD COLUMN promotion_id INTEGER");
        } catch (e) { }

        try {
            db.run(`
                CREATE TABLE IF NOT EXISTS product_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at TEXT NOT NULL
                )
            `);
        } catch (e) {
            console.error('Migration Error (product_groups):', e);
        }

        // Migration: Add order_type and notes to bills
        try {
            db.run("ALTER TABLE bills ADD COLUMN order_type TEXT DEFAULT 'DINE_IN'"); // DINE_IN, TAKEAWAY, DELIVERY
        } catch (e) { }

        try {
            db.run("ALTER TABLE bills ADD COLUMN notes TEXT");
        } catch (e) { }

        try {
            db.run(`
                CREATE TABLE IF NOT EXISTS product_group_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    FOREIGN KEY(group_id) REFERENCES product_groups(id) ON DELETE CASCADE,
                    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            `);
        } catch (e) {
            console.error('Migration Error (product_group_items):', e);
        }

        // Ledger System Migrations
        try {
            db.run("ALTER TABLE customers ADD COLUMN balance REAL DEFAULT 0");
            log('Migration: Added balance column to customers');
        } catch (e) { }

        try {
            db.run(`
                CREATE TABLE IF NOT EXISTS customer_ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    amount REAL NOT NULL,
                    balance_after REAL NOT NULL,
                    description TEXT,
                    reference_id INTEGER,
                    date TEXT NOT NULL,
                    FOREIGN KEY(customer_id) REFERENCES customers(id)
                )
            `);
            log('Migration: Created customer_ledger table');
        } catch (e: any) {
            log(`Migration Note (ledger): ${e.message}`);
        }

        // Initial Loyalty Configs
        const loyaltyDefaults = [
            ['points_per_rupee', '1'],
            ['rupees_per_point', '0.1'], // 10 points = 1 rupee
            ['min_redeem_points', '100']
        ];
        for (const [key, val] of loyaltyDefaults) {
            try {
                db.run("INSERT OR IGNORE INTO loyalty_configs (key, value) VALUES (?, ?)", [key, val]);
            } catch (e) { }
        }

        // Migration for bill_tenders table for existing databases
        try {
            db.run(`
                CREATE TABLE IF NOT EXISTS bill_tenders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bill_id INTEGER NOT NULL,
                    mode TEXT NOT NULL,
                    amount REAL NOT NULL,
                    FOREIGN KEY(bill_id) REFERENCES bills(id)
                )
            `);
            db.run("CREATE INDEX IF NOT EXISTS idx_bill_tenders_bill_id ON bill_tenders(bill_id)");
        } catch (e) { }

        // Phase 3: Global Settings & Tax Migrations
        try {
            db.run(`
                CREATE TABLE IF NOT EXISTS tax_rates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    rate REAL NOT NULL,
                    is_default BOOLEAN DEFAULT 0
                )
            `);

            // Seed default rates if empty
            const taxCount = db.exec("SELECT COUNT(*) as count FROM tax_rates")[0].values[0][0];
            if (taxCount === 0) {
                db.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 0%', 0, 1)");
                db.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 5%', 5, 0)");
                db.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 12%', 12, 0)");
                db.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 18%', 18, 0)");
                db.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 28%', 28, 0)");
            }
        } catch (e) {
            console.error("Migration failed: tax_rates", e);
        }

        try {
            db.run(`
                CREATE TABLE IF NOT EXISTS store_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            `);
            // Seed default settings if empty
            const settingCount = db.exec("SELECT COUNT(*) as count FROM store_settings")[0].values[0][0];
            if (settingCount === 0) {
                const keys = [
                    ['store_name', 'PantherPOS Store'],
                    ['address_line1', '123 Business Avenue'],
                    ['address_line2', 'Tech City'],
                    ['phone', '+91 00000 00000'],
                    ['gstin', 'XXABCDE1234F1Z5'],
                    ['receipt_header', 'Welcome to PantherPOS'],
                    ['receipt_footer', 'Thank you for your visit!'],
                    ['logo_path', '']
                ];
                for (const [k, v] of keys) {
                    db.run("INSERT INTO store_settings (key, value) VALUES (?, ?)", [k, v]);
                }
            }
        } catch (e) {
            console.error("Migration failed: store_settings", e);
        }

        // Phase 4: Supplier Ledger Migrations
        try {
            db.run("ALTER TABLE suppliers ADD COLUMN balance REAL DEFAULT 0");
        } catch (e: any) { }

        try {
            db.run(`
                CREATE TABLE IF NOT EXISTS supplier_ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    supplier_id INTEGER NOT NULL,
                    type TEXT CHECK(type IN ('DEBIT', 'CREDIT')) NOT NULL,
                    amount REAL NOT NULL,
                    balance_after REAL,
                    description TEXT,
                    reference_id INTEGER,
                    date TEXT NOT NULL,
                    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
                )
            `);
        } catch (e) {
            console.error("Migration failed: supplier_ledger", e);
        }

        // Phase 5: Advanced Inventory (Variants)
        try {
            db.run("ALTER TABLE products ADD COLUMN variant_group_id TEXT");
            db.run("ALTER TABLE products ADD COLUMN attributes TEXT"); // JSON string like {"Color":"Red", "Size":"M"}
        } catch (e) { }

        // Phase 6: Billing & Invoices
        try {
            db.run(`CREATE TABLE IF NOT EXISTS estimates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                estimate_no TEXT UNIQUE NOT NULL,
                customer_id INTEGER,
                sub_total REAL NOT NULL,
                discount_amount REAL DEFAULT 0,
                tax_amount REAL DEFAULT 0,
                total_amount REAL NOT NULL,
                payment_mode TEXT,
                date TEXT NOT NULL,
                valid_until TEXT,
                notes TEXT,
                status TEXT DEFAULT 'ACTIVE', -- ACTIVE, CONVERTED, EXPIRED
                FOREIGN KEY(customer_id) REFERENCES customers(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS estimate_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                estimate_id INTEGER NOT NULL,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                tax_rate REAL DEFAULT 0,
                total_amount REAL NOT NULL,
                FOREIGN KEY(estimate_id) REFERENCES estimates(id),
                FOREIGN KEY(product_id) REFERENCES products(id)
            )`);

            // Migration: Add template_type to bills if not exists
            try {
                const columns = db.exec("PRAGMA table_info(bills)")[0].values.map((row: any) => ({ name: row[1] }));
                if (!columns.some((c: any) => c.name === 'template_type')) {
                    db.exec('ALTER TABLE bills ADD COLUMN template_type TEXT DEFAULT "THERMAL"');
                }
            } catch (e) { console.log('Bill template_type migration error:', e); }

            // Migration: Audit Logs
            db.exec(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    user_name TEXT,
                    action TEXT,
                    details TEXT,
                    severity TEXT DEFAULT 'INFO',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

        } catch (e) { console.error("Migration failed: Estimates", e); }

        // Seed Default Admin User
        try {
            console.log('Checking for existing Admin user...');
            const adminExists = db.exec("SELECT id FROM users WHERE role = 'ADMIN'");
            console.log('Admin verification result:', JSON.stringify(adminExists));

            if (!adminExists.length || !adminExists[0].values.length) {
                console.log('No Admin found. Seeding default Admin...');
                db.run("INSERT INTO users (name, role, pin, created_at) VALUES (?, ?, ?, ?)",
                    ['Administrator', 'ADMIN', '1234', new Date().toISOString()]);
                console.log('Admin seeded successfully.');
            } else {
                console.log('Admin already exists.');
            }
        } catch (e) {
            console.error('Error seeding admin:', e);
        }

        // Seed Initial Chart of Accounts
        try {
            const accountCount = db.exec("SELECT COUNT(*) as count FROM accounts")[0].values[0][0];
            if (accountCount === 0) {
                log('Seeding initial Chart of Accounts...');
                const initialAccounts = [
                    ['1001', 'Cash in Hand', 'ASSET', 'Cash', 1],
                    ['1002', 'Bank Account', 'ASSET', 'Bank', 1],
                    ['1003', 'Accounts Receivable', 'ASSET', 'Receivables', 1],
                    ['1004', 'Inventory', 'ASSET', 'Inventory', 1],
                    ['2001', 'Accounts Payable', 'LIABILITY', 'Payables', 1],
                    ['2002', 'GST Payable', 'LIABILITY', 'Duties & Taxes', 1],
                    ['3001', 'Capital Account', 'EQUITY', 'Equity', 1],
                    ['4001', 'Sales Revenue', 'INCOME', 'Sales', 1],
                    ['4002', 'Other Income', 'INCOME', 'Other', 1],
                    ['5001', 'Cost of Goods Sold', 'EXPENSE', 'Direct Expenses', 1],
                    ['5002', 'Rent Expense', 'EXPENSE', 'Indirect Expenses', 0],
                    ['5003', 'Electricity Bill', 'EXPENSE', 'Indirect Expenses', 0],
                    ['5004', 'Staff Salary', 'EXPENSE', 'Indirect Expenses', 0],
                    ['5005', 'General Expenses', 'EXPENSE', 'Indirect Expenses', 0]
                ];
                for (const [code, name, type, cat, system] of initialAccounts) {
                    db.run("INSERT INTO accounts (code, name, type, category, is_system) VALUES (?, ?, ?, ?, ?)",
                        [code, name, type, cat, system]);
                }
                log('Chart of Accounts seeded.');
            }
        } catch (e: any) {
            log(`Error seeding accounts: ${e.message}`);
        }

        // Seed demo/mock data for fresh databases only
        try {
            const productCount = db.exec("SELECT COUNT(*) as count FROM products")[0].values[0][0];
            const customerCount = db.exec("SELECT COUNT(*) as count FROM customers")[0].values[0][0];
            const billCount = db.exec("SELECT COUNT(*) as count FROM bills")[0].values[0][0];

            if (productCount === 0 && customerCount === 0 && billCount === 0) {
                log('Seeding demo data (products/customers/sales)...');

                const now = new Date();
                const isoDaysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

                // Groups
                db.run("INSERT INTO product_groups (id, name, description, created_at) VALUES (1, ?, ?, ?)", ["Beverages", "Tea, coffee, soft drinks", now.toISOString()]);
                db.run("INSERT INTO product_groups (id, name, description, created_at) VALUES (2, ?, ?, ?)", ["Snacks", "Chips, biscuits, quick bites", now.toISOString()]);
                db.run("INSERT INTO product_groups (id, name, description, created_at) VALUES (3, ?, ?, ?)", ["Household", "Everyday essentials", now.toISOString()]);

                // Products
                const demoProducts: any[] = [
                    [1, "Arabica Coffee 250g", "8901234500011", 220, 320, 25, 5, "0901", 5],
                    [2, "Green Tea (25 bags)", "8901234500012", 75, 120, 40, 5, "0902", 8],
                    [3, "Milk 1L", "8901234500013", 42, 60, 18, 0, "0401", 10],
                    [4, "Mineral Water 1L", "8901234500014", 10, 20, 55, 0, "2201", 12],
                    [5, "Cola 500ml", "8901234500015", 18, 35, 30, 12, "2202", 10],
                    [6, "Potato Chips 90g", "8901234500016", 22, 40, 14, 12, "2005", 6],
                    // Intentionally low so Low Stock / Reorder reports show data
                    [7, "Chocolate Biscuit Pack", "8901234500017", 20, 35, 5, 12, "1905", 6],
                    [8, "Instant Noodles", "8901234500018", 12, 18, 70, 0, "1902", 15],
                    // Intentionally low so Low Stock / Reorder reports show data
                    [9, "Dishwash Liquid 500ml", "8901234500019", 58, 89, 3, 18, "3402", 4],
                    // Intentionally low so Low Stock / Reorder reports show data
                    [10, "Toilet Paper (6 rolls)", "8901234500020", 90, 140, 2, 12, "4818", 3],
                    [11, "Hand Sanitizer 200ml", "8901234500021", 45, 79, 12, 18, "3808", 4],
                    [12, "Bath Soap Bar", "8901234500022", 18, 28, 35, 18, "3401", 10],
                ];
                for (const p of demoProducts) {
                    db.run(
                        `INSERT INTO products (id, name, barcode, cost_price, sell_price, stock, gst_rate, hsn_code, min_stock_level)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        p
                    );
                }

                // Group associations
                const groupLinks: any[] = [
                    [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
                    [2, 6], [2, 7], [2, 8],
                    [3, 9], [3, 10], [3, 11], [3, 12],
                ];
                for (const [groupId, productId] of groupLinks) {
                    db.run("INSERT INTO product_group_items (group_id, product_id) VALUES (?, ?)", [groupId, productId]);
                }

                // Customers (balance column exists via migration earlier)
                const demoCustomers: any[] = [
                    [1, "Walk-in Customer", null, null, null, isoDaysAgo(30), 0, null, 0, 0],
                    [2, "Rahul Sharma", "9000011111", "rahul@example.com", "12 Lake View Rd", isoDaysAgo(12), 2480, isoDaysAgo(2), 120, 0],
                    [3, "Aisha Khan", "9000022222", "aisha@example.com", "44 Market Street", isoDaysAgo(25), 1290, isoDaysAgo(5), 65, 180],
                    [4, "Suresh Traders", "9000033333", "accounts@sureshtraders.in", "Industrial Area, Phase 2", isoDaysAgo(60), 8450, isoDaysAgo(1), 420, 0],
                    [5, "Meera Nair", "9000044444", "meera@example.com", "9 Palm Grove", isoDaysAgo(7), 890, isoDaysAgo(0), 25, 0],
                ];
                for (const c of demoCustomers) {
                    db.run(
                        `INSERT INTO customers (id, name, phone, email, address, created_at, total_purchases, last_visit, points, balance)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        c
                    );
                }

                // Customer ledger for the one customer with balance due
                db.run(
                    `INSERT INTO customer_ledger (customer_id, type, amount, balance_after, description, reference_id, date)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [3, "DEBIT", 180, 180, "Previous Due", null, isoDaysAgo(5)]
                );

                // Bills and bill items
                const demoBills: any[] = [
                    [1, "INV-0001", isoDaysAgo(5), 440, 0, 0, 0, 0, 440, "CASH", "PAID", 2],
                    [2, "INV-0002", isoDaysAgo(3), 158, 0, 0, 0, 0, 158, "UPI", "PAID", 3],
                    [3, "INV-0003", isoDaysAgo(1), 229, 0, 0, 0, 0, 229, "CARD", "PAID", 4],
                    [4, "INV-0004", isoDaysAgo(0), 120, 0, 0, 0, 0, 120, "CASH", "PAID", 5],
                    // A due/unpaid bill so "Outstanding Dues" has data
                    [5, "INV-0005", isoDaysAgo(2), 180, 0, 0, 0, 0, 180, "CASH", "DUE", 3],
                ];
                for (const b of demoBills) {
                    if (b[0] === 4) {
                        // Insert with discount_amount populated for reports
                        db.run(
                            `INSERT INTO bills (id, bill_no, date, subtotal, cgst, sgst, igst, gst_total, total, payment_mode, status, customer_id, discount_amount)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [...b, 10]
                        );
                    } else {
                        db.run(
                            `INSERT INTO bills (id, bill_no, date, subtotal, cgst, sgst, igst, gst_total, total, payment_mode, status, customer_id)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            b
                        );
                    }
                }

                const demoBillItems: any[] = [
                    [1, 1, 1, 1, 320, 320, 5, 0],
                    [2, 1, 3, 2, 60, 120, 0, 0],
                    [3, 2, 6, 2, 40, 80, 12, 0],
                    [4, 2, 4, 1, 20, 20, 0, 0],
                    [5, 2, 7, 1, 35, 35, 12, 0],
                    [6, 3, 9, 1, 89, 89, 18, 0],
                    [7, 3, 12, 2, 28, 56, 18, 0],
                    [8, 4, 2, 1, 120, 120, 5, 0],
                    // bill 5 (DUE): sanitizer x1, noodles x2
                    [9, 5, 11, 1, 79, 79, 18, 0],
                    [10, 5, 8, 2, 18, 36, 0, 0],
                ];
                for (const bi of demoBillItems) {
                    db.run(
                        `INSERT INTO bill_items (id, bill_id, product_id, quantity, price, taxable_value, gst_rate, gst_amount)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        bi
                    );
                }

                // Bill tenders (used by Payment Methods report)
                const demoTenders: any[] = [
                    [1, 1, "CASH", 440],
                    [2, 2, "UPI", 158],
                    [3, 3, "CARD", 229],
                    [4, 4, "CASH", 120],
                    [5, 5, "CASH", 180],
                ];
                for (const t of demoTenders) {
                    db.run(`INSERT INTO bill_tenders (id, bill_id, mode, amount) VALUES (?, ?, ?, ?)`, t);
                }

                // Suppliers + Purchase Orders (so Purchase reports aren't empty)
                const demoSuppliers: any[] = [
                    [1, "FreshFoods Distributors", "9000099991", "contact@freshfoods.in", "Warehouse Rd", "22AAAAA0000A1Z5", new Date().toISOString(), 0],
                    [2, "DailyNeeds Wholesale", "9000099992", "sales@dailyneeds.in", "Industrial Estate", "22BBBBB0000B1Z5", new Date().toISOString(), 0],
                ];
                for (const s of demoSuppliers) {
                    db.run(
                        `INSERT INTO suppliers (id, name, phone, email, address, gstin, created_at, balance)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        s
                    );
                }

                const demoPurchaseOrders: any[] = [
                    [1, "PO-0001", 1, isoDaysAgo(10), 1320, "RECEIVED", "Weekly restock", isoDaysAgo(9)],
                    [2, "PO-0002", 2, isoDaysAgo(2), 980, "ORDERED", "Pending delivery", null],
                ];
                for (const po of demoPurchaseOrders) {
                    db.run(
                        `INSERT INTO purchase_orders (id, order_no, supplier_id, date, total_amount, status, notes, receive_date)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        po
                    );
                }

                const demoPurchaseItems: any[] = [
                    // PO-0001 received
                    [1, 1, 1, 3, 220, 660],
                    [2, 1, 6, 10, 22, 220],
                    [3, 1, 9, 5, 58, 290],
                    [4, 1, 2, 1, 75, 75],
                    [5, 1, 4, 10, 10, 100],

                    // PO-0002 ordered (unpaid/pending)
                    [6, 2, 10, 4, 90, 360],
                    [7, 2, 11, 4, 45, 180],
                    [8, 2, 12, 10, 18, 180],
                    [9, 2, 7, 4, 20, 80],
                    [10, 2, 3, 4, 42, 168],
                    [11, 2, 5, 2, 18, 36],
                ];
                for (const poi of demoPurchaseItems) {
                    db.run(
                        `INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, cost_price, total_amount)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        poi
                    );
                }

                // Inventory loss/damage logs (Loss & Damage report)
                const demoInventoryLogs: any[] = [
                    [1, 6, "DAMAGE", -1, "Damaged pack", isoDaysAgo(4), 1],
                    [2, 10, "LOSS", -1, "Lost in transit", isoDaysAgo(8), 1],
                    [3, 3, "SHRINKAGE", -2, "Expired stock", isoDaysAgo(1), 1],
                ];
                for (const il of demoInventoryLogs) {
                    db.run(
                        `INSERT INTO inventory_logs (id, product_id, type, quantity_change, reason, date, user_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        il
                    );
                }

                // Cash sessions + transactions (Cash reconciliation / Staff performance)
                db.run(
                    `INSERT INTO cash_drawer_sessions (id, user_id, start_time, end_time, start_cash, end_cash, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [1, 1, isoDaysAgo(1), isoDaysAgo(1), 2000, 2600, "CLOSED"]
                );
                const demoCashTx: any[] = [
                    [1, 1, "OPENING", 2000, "Opening cash", isoDaysAgo(1)],
                    [2, 1, "SALE", 440, "INV-0001", isoDaysAgo(5)],
                    [3, 1, "SALE", 120, "INV-0004", isoDaysAgo(0)],
                    [4, 1, "PAYOUT", 200, "Electricity bill", isoDaysAgo(1)],
                    [5, 1, "CLOSING", 2600, "Closing cash", isoDaysAgo(1)],
                ];
                for (const ct of demoCashTx) {
                    db.run(
                        `INSERT INTO cash_transactions (id, session_id, type, amount, reason, time)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        ct
                    );
                }

                log('Demo data seeded.');
            }
        } catch (e: any) {
            log(`Demo seed skipped/failed: ${e?.message || e}`);
        }

        save(); // Save initial schema
    } catch (error) {
        console.error('Failed to init DB:', error);
        throw error;
    }
};

const save = () => {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
};

export function query(sql: string, params: any[] = []): any {
    if (!db) throw new Error('Database not initialized');

    const command = sql.trim().toLowerCase();

    // sql.js 'exec' returns [{columns, values}], 'run' returns null (void).
    // To match previous API (array of objects), we need a helper.

    if (command.startsWith('select')) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    } else {
        db.run(sql, params);
        const changes = db.getRowsModified();
        save(); // Auto-save on writes
        let lastInsertRowid;
        try {
            lastInsertRowid = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
        } catch (e) { }

        return { changes, lastInsertRowid };
    }
}

export const backup = () => {
    if (!db || !dbPath) return { success: false, error: "DB not ready" };
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.db`;
        const dest = path.join(backupDir, filename);

        // Ensure current state is saved to disk first
        save();
        fs.copyFileSync(dbPath, dest);

        cleanOldBackups();
        return { success: true, path: dest, filename };
    } catch (e: any) {
        console.error("Backup failed", e);
        return { success: false, error: e.message };
    }
};

export const cleanOldBackups = () => {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
            .map(f => ({
                name: f,
                path: path.join(backupDir, f),
                time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // Newest first

        // Keep last 50 backups (approx 2 days if hourly, or more if manually triggered)
        const toDelete = files.slice(50);
        toDelete.forEach(f => fs.unlinkSync(f.path));
        console.log(`Cleaned ${toDelete.length} old backups.`);
    } catch (e) {
        console.error("Cleanup failed", e);
    }
};

export const getBackups = () => {
    try {
        if (!fs.existsSync(backupDir)) return [];
        return fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
            .map(f => {
                const stat = fs.statSync(path.join(backupDir, f));
                return {
                    filename: f,
                    path: path.join(backupDir, f),
                    created: stat.birthtime,
                    size: stat.size
                };
            })
            .sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (e) {
        return [];
    }
};

export const restoreBackup = (filename: string) => {
    try {
        const source = path.join(backupDir, filename);
        if (!fs.existsSync(source)) throw new Error('Backup file not found');

        // Backup current before restoring, just in case
        backup();

        fs.copyFileSync(source, dbPath);

        // Reload DB in memory
        const buffer = fs.readFileSync(dbPath);
        // @ts-ignore
        const SQL = require('sql.js'); // Re-init not trivial here without async. 
        // Actually, initDb calls this. We might need to restart the app or reconstruct the db object.
        // For simplicity, we will instruct main.ts to restart the app after restore.
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

export const importDb = (sourcePath: string) => {
    try {
        if (!fs.existsSync(sourcePath)) throw new Error('File not found');
        backup(); // Safety backup
        fs.copyFileSync(sourcePath, dbPath);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

export const getDbPath = () => dbPath;

// Audit Helpers
export const addAuditLog = (userId: number, userName: string, action: string, details: string) => {
    try {
        if (!db) return { success: false, error: 'DB not initialized' };
        db.run(
            `INSERT INTO audit_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`,
            [userId, userName, action, details]
        );
        save();
        return { success: true };
    } catch (e: any) {
        console.error('Audit Log Error:', e);
        return { success: false, error: e.message };
    }
};

export const getAuditLogs = (limit: number = 100) => {
    try {
        if (!db) return [];
        const stmt = db.prepare(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`);
        stmt.bind([limit]);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    } catch (e) {
        console.error('Get Audit Logs Error:', e);
        return [];
    }
};

// Notification Helpers
export const addNotification = (type: string, title: string, message: string) => {
    try {
        if (!db) return { success: false };
        db.run(
            `INSERT INTO notifications (type, title, message) VALUES (?, ?, ?)`,
            [type, title, message]
        );
        save();
        return { success: true };
    } catch (e) {
        return { success: false };
    }
};

export const getNotifications = (unreadOnly: boolean = false) => {
    try {
        if (!db) return [];
        const sql = unreadOnly
            ? `SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC`
            : `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`;

        const stmt = db.prepare(sql);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    } catch (e) {
        return [];
    }
};

export const markNotificationRead = (id: number) => {
    try {
        if (!db) return { success: false };
        db.run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
        save();
        return { success: true };
    } catch (e) {
        return { success: false };
    }
};

export const markAllNotificationsRead = () => {
    try {
        if (!db) return { success: false };
        db.run(`UPDATE notifications SET is_read = 1 WHERE is_read = 0`);
        save();
        return { success: true };
    } catch (e) {
        return { success: false };
    }
};
