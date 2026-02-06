import initSqlJs from 'sql.js';
import { platformService } from './platformService';
import { dbStorage } from './dbStorage';
import toast from 'react-hot-toast';

let dbInstance: any = null;
let initPromise: Promise<void> | null = null;
let lastError: string | null = null;
let diagnosticLogs: string[] = [];

const log = (msg: string) => {
    const formatted = `[DB][${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(formatted);
    diagnosticLogs.push(formatted);
    if (diagnosticLogs.length > 50) diagnosticLogs.shift();
};

let remoteStatusListeners: ((connected: boolean) => void)[] = [];
let isRemoteConnected = false;
let lastRemoteError: string | null = null;

const SCHEMA = `
-- Core Tables
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    pin TEXT UNIQUE NOT NULL,
    salary REAL DEFAULT 0,
    pending_salary REAL DEFAULT 0,
    given_salary REAL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT,
    status TEXT DEFAULT 'PRESENT',
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS staff_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE NOT NULL,
    cost_price REAL DEFAULT 0,
    sell_price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    gst_rate REAL DEFAULT 0,
    hsn_code TEXT,
    min_stock_level INTEGER DEFAULT 5,
    image TEXT,
    variant_group_id TEXT,
    attributes TEXT -- JSON string
);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Sales & Billing
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
    discount_amount REAL DEFAULT 0,
    points_redeemed REAL DEFAULT 0,
    points_earned REAL DEFAULT 0,
    promotion_id INTEGER,
    order_type TEXT DEFAULT 'DINE_IN',
    notes TEXT,
    template_type TEXT DEFAULT 'THERMAL'
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

CREATE TABLE IF NOT EXISTS bill_tenders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    mode TEXT NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY(bill_id) REFERENCES bills(id)
);
CREATE INDEX IF NOT EXISTS idx_bill_tenders_bill_id ON bill_tenders(bill_id);

CREATE TABLE IF NOT EXISTS held_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    date TEXT NOT NULL,
    items_json TEXT NOT NULL
);

-- Customers & Loyalty
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    address TEXT,
    created_at TEXT NOT NULL,
    total_purchases REAL DEFAULT 0,
    last_visit TEXT,
    points REAL DEFAULT 0,
    balance REAL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

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
);

-- Inventory & Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    created_at TEXT NOT NULL,
    balance REAL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

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
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'DRAFT',
    notes TEXT,
    receive_date TEXT,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
);

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

CREATE TABLE IF NOT EXISTS inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    quantity_change REAL NOT NULL,
    reason TEXT,
    date TEXT NOT NULL,
    user_id INTEGER,
    FOREIGN KEY(product_id) REFERENCES products(id)
);

-- Cash Management
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

-- System & Settings
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

CREATE TABLE IF NOT EXISTS store_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS tax_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rate REAL NOT NULL,
    is_default BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS void_reasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    action_taken TEXT,
    timestamp INTEGER NOT NULL
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

CREATE TABLE IF NOT EXISTS estimates (
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
    status TEXT DEFAULT 'ACTIVE',
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS estimate_items (
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
);

-- Accounting System Tables
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

export const databaseService = {
    runMigrations: async () => {
        log("Running platform-agnostic migrations...");
        const migrationQueries = [
            "ALTER TABLE users ADD COLUMN salary REAL DEFAULT 0",
            "ALTER TABLE users ADD COLUMN pending_salary REAL DEFAULT 0",
            "ALTER TABLE users ADD COLUMN given_salary REAL DEFAULT 0",

            // Keep products table aligned with renderer services
            "ALTER TABLE products ADD COLUMN image TEXT",
            "ALTER TABLE products ADD COLUMN variant_group_id TEXT",
            "ALTER TABLE products ADD COLUMN attributes TEXT"
        ];

        for (const sql of migrationQueries) {
            try {
                // Use low-level check if possible, or just try/catch
                if (dbInstance && !window.electronAPI) {
                    try { dbInstance.run(sql); } catch (e) { /* Ignore if column already exists */ }
                } else {
                    await databaseService.query(sql);
                }
            } catch (e) {
                // Likely column already exists or table doesn't exist yet
            }
        }

        // Special check: Initialize null values to 0 if columns existed but were null
        try {
            await databaseService.query("UPDATE users SET salary = 0 WHERE salary IS NULL");
            await databaseService.query("UPDATE users SET pending_salary = 0 WHERE pending_salary IS NULL");
            await databaseService.query("UPDATE users SET given_salary = 0 WHERE given_salary IS NULL");
        } catch (e) { /* Ignore if columns don't exist or other issues */ }
    },

    init: async () => {
        if (initPromise) return initPromise;

        initPromise = (async () => {
            const platform = platformService.getPlatform();
            log(`Initializing for ${platform}...`);

            if (platform === 'electron') {
                log("Electron platform detected. Initializing schema and migrations...");
                try {
                    // Run the full schema to ensure tables exist in local SQLite file
                    const schemaStatements = SCHEMA.split(';').filter(s => s.trim());
                    for (const statement of schemaStatements) {
                        await window.electronAPI.dbQuery(statement + ';');
                    }
                    await databaseService.runMigrations();
                } catch (e) {
                    log(`Electron Init Error: ${e}`);
                }
                return;
            }

            try {
                const SQL = await initSqlJs({
                    locateFile: file => {
                        log(`Requesting WASM file: ${file}`);
                        return `/${file}`;
                    }
                });

                const dbKey = 'pos_db_web';

                // Migration check: If data exists in localStorage but not in IndexedDB, move it.
                const localData = localStorage.getItem(dbKey);
                let savedDb = await dbStorage.getItem(dbKey);

                if (localData && !savedDb) {
                    log("Migrating data from localStorage to IndexedDB...");
                    const binary = atob(localData);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }
                    await dbStorage.setItem(dbKey, bytes);
                    savedDb = bytes;
                    localStorage.removeItem(dbKey);
                    log("Migration complete.");
                }

                if (savedDb) {
                    try {
                        let bytes: Uint8Array;
                        if (typeof savedDb === 'string') {
                            const binary = atob(savedDb);
                            bytes = new Uint8Array(binary.length);
                            for (let i = 0; i < binary.length; i++) {
                                bytes[i] = binary.charCodeAt(i);
                            }
                        } else {
                            bytes = savedDb;
                        }
                        dbInstance = new SQL.Database(bytes);
                        log(`Success: Database restored (${bytes.length || bytes.byteLength} bytes).`);

                        try {
                            const tables = dbInstance.exec("SELECT name FROM sqlite_master WHERE type='table'");
                            log(`Found ${tables[0]?.values.length || 0} tables in synced database.`);

                            dbInstance.run(SCHEMA);
                            log("Schema check complete (CREATE TABLE IF NOT EXISTS).");

                            // Verify columns exist and add them if missing
                            await databaseService.runMigrations();

                            log("Schema synchronized.");
                            await databaseService.save();
                            log("Migrations persisted.");
                        } catch (schemaErr: any) {
                            log(`Schema hint: ${schemaErr.message}`);
                        }
                    } catch (e: any) {
                        log(`DATABASE LOAD FAILED: ${e.message}.`);
                        dbInstance = new SQL.Database();
                        dbInstance.run(SCHEMA);
                    }
                } else {
                    log("Creating fresh DB...");
                    dbInstance = new SQL.Database();
                    dbInstance.run(SCHEMA);
                }

                const userCountRes = dbInstance.exec("SELECT COUNT(*) as count FROM users");
                const userCount = userCountRes[0].values[0][0];
                log(`Verified User Count: ${userCount}`);

                if (userCount === 0) {
                    log("Seeding default Administrator...");
                    dbInstance.run(
                        "INSERT INTO users (name, role, pin, created_at) VALUES (?, ?, ?, ?)",
                        ['Administrator', 'ADMIN', '1234', new Date().toISOString()]
                    );
                }

                // 2. Seed Tax Rates if empty
                const taxCountRes = dbInstance.exec("SELECT COUNT(*) FROM tax_rates");
                const taxCount = taxCountRes[0].values[0][0];
                if (taxCount === 0) {
                    log("Seeding default Tax Rates...");
                    dbInstance.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 0%', 0, 1)");
                    dbInstance.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 5%', 5, 0)");
                    dbInstance.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 12%', 12, 0)");
                    dbInstance.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 18%', 18, 0)");
                    dbInstance.run("INSERT INTO tax_rates (name, rate, is_default) VALUES ('GST 28%', 28, 0)");
                }

                // 3. Seed Store Settings if empty
                const settingCountRes = dbInstance.exec("SELECT COUNT(*) FROM store_settings");
                const settingCount = settingCountRes[0].values[0][0];
                if (settingCount === 0) {
                    log("Seeding default Store Settings...");
                    const defaultSettings = [
                        ['store_name', 'PantherPOS Store'],
                        ['address_line1', '123 Business Avenue'],
                        ['address_line2', 'Tech City'],
                        ['phone', '+91 00000 00000'],
                        ['gstin', 'XXABCDE1234F1Z5'],
                        ['receipt_header', 'Welcome to PantherPOS'],
                        ['receipt_footer', 'Thank you for your visit!'],
                        ['logo_path', '']
                    ];
                    for (const [k, v] of defaultSettings) {
                        dbInstance.run("INSERT INTO store_settings (key, value) VALUES (?, ?)", [k, v]);
                    }
                }

                // 4. Seed demo/mock data if database is empty (fresh install / preview)
                try {
                    const productCount = dbInstance.exec("SELECT COUNT(*) FROM products")[0].values[0][0];
                    const customerCount = dbInstance.exec("SELECT COUNT(*) FROM customers")[0].values[0][0];
                    const billCount = dbInstance.exec("SELECT COUNT(*) FROM bills")[0].values[0][0];

                    // Only seed when the operational tables are empty (avoid polluting real stores).
                    if (productCount === 0 && customerCount === 0 && billCount === 0) {
                        log("Seeding demo data (products/customers/sales)...");

                        // Groups
                        dbInstance.run(
                            "INSERT INTO product_groups (id, name, description, created_at) VALUES (1, ?, ?, ?)",
                            ["Beverages", "Tea, coffee, soft drinks", new Date().toISOString()]
                        );
                        dbInstance.run(
                            "INSERT INTO product_groups (id, name, description, created_at) VALUES (2, ?, ?, ?)",
                            ["Snacks", "Chips, biscuits, quick bites", new Date().toISOString()]
                        );
                        dbInstance.run(
                            "INSERT INTO product_groups (id, name, description, created_at) VALUES (3, ?, ?, ?)",
                            ["Household", "Everyday essentials", new Date().toISOString()]
                        );

                        // Products (explicit IDs so we can create demo bills reliably)
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
                            dbInstance.run(
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
                            dbInstance.run("INSERT INTO product_group_items (group_id, product_id) VALUES (?, ?)", [groupId, productId]);
                        }

                        // Customers
                        const now = new Date();
                        const isoDaysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
                        const demoCustomers: any[] = [
                            [1, "Walk-in Customer", null, null, null, isoDaysAgo(30), 0, null, 0, 0],
                            [2, "Rahul Sharma", "9000011111", "rahul@example.com", "12 Lake View Rd", isoDaysAgo(12), 2480, isoDaysAgo(2), 120, 0],
                            [3, "Aisha Khan", "9000022222", "aisha@example.com", "44 Market Street", isoDaysAgo(25), 1290, isoDaysAgo(5), 65, 180],
                            [4, "Suresh Traders", "9000033333", "accounts@sureshtraders.in", "Industrial Area, Phase 2", isoDaysAgo(60), 8450, isoDaysAgo(1), 420, 0],
                            [5, "Meera Nair", "9000044444", "meera@example.com", "9 Palm Grove", isoDaysAgo(7), 890, isoDaysAgo(0), 25, 0],
                        ];
                        for (const c of demoCustomers) {
                            // customers table supports balance in this schema; keep it deterministic.
                            dbInstance.run(
                                `INSERT INTO customers (id, name, phone, email, address, created_at, total_purchases, last_visit, points, balance)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                c
                            );
                        }

                        // Customer ledger for the one customer with balance due
                        dbInstance.run(
                            `INSERT INTO customer_ledger (customer_id, type, amount, balance_after, description, reference_id, date)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [3, "DEBIT", 180, 180, "Previous Due", null, isoDaysAgo(5)]
                        );

                        // Bills & bill items (simple demo history)
                        const demoBills: any[] = [
                            [1, "INV-0001", isoDaysAgo(5), 440, 0, 0, 0, 0, 440, "CASH", "PAID", 2],
                            [2, "INV-0002", isoDaysAgo(3), 158, 0, 0, 0, 0, 158, "UPI", "PAID", 3],
                            [3, "INV-0003", isoDaysAgo(1), 229, 0, 0, 0, 0, 229, "CARD", "PAID", 4],
                            // A discounted bill
                            [4, "INV-0004", isoDaysAgo(0), 120, 0, 0, 0, 0, 120, "CASH", "PAID", 5],

                            // A due/unpaid bill so "Outstanding Dues" has data
                            [5, "INV-0005", isoDaysAgo(2), 180, 0, 0, 0, 0, 180, "CASH", "DUE", 3],
                        ];
                        for (const b of demoBills) {
                            if (b[0] === 4) {
                                // Insert with discount_amount populated for reports
                                dbInstance.run(
                                    `INSERT INTO bills (id, bill_no, date, subtotal, cgst, sgst, igst, gst_total, total, payment_mode, status, customer_id, discount_amount)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [...b, 10]
                                );
                            } else {
                                dbInstance.run(
                                    `INSERT INTO bills (id, bill_no, date, subtotal, cgst, sgst, igst, gst_total, total, payment_mode, status, customer_id)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    b
                                );
                            }
                        }

                        const demoBillItems: any[] = [
                            // bill 1: coffee x1, milk x2
                            [1, 1, 1, 1, 320, 320, 5, 0],
                            [2, 1, 3, 2, 60, 120, 0, 0],
                            // bill 2: chips x2, water x1, biscuit x1
                            [3, 2, 6, 2, 40, 80, 12, 0],
                            [4, 2, 4, 1, 20, 20, 0, 0],
                            [5, 2, 7, 1, 35, 35, 12, 0],
                            // bill 3: dishwash x1, soap x2
                            [6, 3, 9, 1, 89, 89, 18, 0],
                            [7, 3, 12, 2, 28, 56, 18, 0],
                            // bill 4: green tea x1
                            [8, 4, 2, 1, 120, 120, 5, 0],

                            // bill 5 (DUE): sanitizer x1, noodles x2
                            [9, 5, 11, 1, 79, 79, 18, 0],
                            [10, 5, 8, 2, 18, 36, 0, 0],
                        ];
                        for (const bi of demoBillItems) {
                            dbInstance.run(
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
                            dbInstance.run(
                                `INSERT INTO bill_tenders (id, bill_id, mode, amount) VALUES (?, ?, ?, ?)`,
                                t
                            );
                        }

                        // Suppliers + Purchase Orders (so Purchase reports aren't empty)
                        const demoSuppliers: any[] = [
                            [1, "FreshFoods Distributors", "9000099991", "contact@freshfoods.in", "Warehouse Rd", "22AAAAA0000A1Z5", new Date().toISOString(), 0],
                            [2, "DailyNeeds Wholesale", "9000099992", "sales@dailyneeds.in", "Industrial Estate", "22BBBBB0000B1Z5", new Date().toISOString(), 0],
                        ];
                        for (const s of demoSuppliers) {
                            dbInstance.run(
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
                            dbInstance.run(
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
                            dbInstance.run(
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
                            dbInstance.run(
                                `INSERT INTO inventory_logs (id, product_id, type, quantity_change, reason, date, user_id)
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                il
                            );
                        }

                        // Cash sessions + transactions (Cash reconciliation / Staff performance)
                        dbInstance.run(
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
                            dbInstance.run(
                                `INSERT INTO cash_transactions (id, session_id, type, amount, reason, time)
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                ct
                            );
                        }

                        log("Demo data seeded.");
                    }
                } catch (seedErr: any) {
                    log(`Demo seed skipped/failed: ${seedErr?.message || seedErr}`);
                }

                databaseService.save();

                log("Database initialization complete.");
            } catch (err: any) {
                lastError = err.message;
                log(`FATAL INIT ERROR: ${err.message}`);
                toast.error('SQL.js Error: ' + err.message);
                throw err;
            }
        })();

        return initPromise;
    },

    save: () => {
        if (!dbInstance) return;
        try {
            const data = dbInstance.export();
            dbStorage.setItem('pos_db_web', data);
            log(`Database saved (${data.byteLength} bytes)`);
        } catch (e: any) {
            log(`Save Error: ${e.message}`);
        }
    },

    query: async (sql: string, params: any[] = []): Promise<any> => {
        const isElectron = platformService.isElectron();

        // 1. If Electron, always run locally
        if (isElectron) {
            const results = await window.electronAPI.dbQuery(sql, params);
            if (results && results.error) {
                throw new Error(results.error);
            }
            const isSelect = sql.trim().toLowerCase().startsWith('select');
            if (isSelect && results && !Array.isArray(results)) {
                return [results]; // Wrap if it's a single object
            }
            return results || [];
        }

        // 2. If Web/Mobile, attempt remote proxying if server IP is configured
        const serverIp = localStorage.getItem('pos_pc_server_ip');
        if (serverIp) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(`http://${serverIp}:3000/api/db/query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sql, params }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        if (!isRemoteConnected) {
                            console.log('[DB] Remote Connected!');
                            isRemoteConnected = true;
                            remoteStatusListeners.forEach(l => l(true));
                        }
                        return result.data;
                    } else {
                        throw new Error(`Api Error: ${result.error}`);
                    }
                } else {
                    throw new Error(`Http Error: ${response.status} ${response.statusText}`);
                }
            } catch (e: any) {
                if (isRemoteConnected) {
                    console.warn('[DB] Remote Disconnected:', e.message);
                    isRemoteConnected = false;
                    remoteStatusListeners.forEach(l => l(false));
                }
                lastRemoteError = `Network: ${e.message}`;
                // Fallback to local if server is unreachable
                log(`Remote query failed (${serverIp}), falling back to local: ${e.message}`);
            }
        }

        // 3. Local Fallback (Offline Mode)
        if (!dbInstance) await databaseService.init();
        if (!dbInstance) throw new Error('DB Instance null');

        log(`Local Query: ${sql}`);
        const command = sql.trim().toLowerCase();
        try {
            if (command.startsWith('select')) {
                const stmt = dbInstance.prepare(sql);
                stmt.bind(params);
                const rows = [];
                while (stmt.step()) {
                    rows.push(stmt.getAsObject());
                }
                stmt.free();
                return rows;
            } else {
                dbInstance.run(sql, params);
                databaseService.save();
                return {
                    changes: dbInstance.getRowsModified(),
                    lastInsertRowid: databaseService.getLastInsertId()
                };
            }
        } catch (err: any) {
            log(`Local Query Failed: ${err.message}`);
            throw err;
        }
    },

    getLastInsertId: () => {
        try {
            const res = dbInstance.exec("SELECT last_insert_rowid()");
            return res[0].values[0][0];
        } catch (e) { return 0; }
    },

    getDiagnostics: () => {
        let rawUsers = [];
        try {
            const res = dbInstance.exec("SELECT * FROM users");
            if (res.length > 0) {
                const cols = res[0].columns;
                rawUsers = res[0].values.map((row: any) => {
                    const obj: any = {};
                    cols.forEach((col: string, i: number) => obj[col] = row[i]);
                    return obj;
                });
            }
        } catch (e) { }

        return {
            platform: platformService.getPlatform(),
            dbReady: !!dbInstance,
            userCount: dbInstance ? dbInstance.exec("SELECT COUNT(*) FROM users")[0].values[0][0] : 'N/A',
            productCount: dbInstance ? dbInstance.exec("SELECT COUNT(*) FROM products")[0].values[0][0] : 'N/A',
            billCount: dbInstance ? dbInstance.exec("SELECT COUNT(*) FROM bills")[0].values[0][0] : 'N/A',
            rawUsers,
            lastError,
            lastRemoteError,
            logs: [...diagnosticLogs]
        };
    },

    forceSeed: async () => {
        await databaseService.init();
        if (dbInstance) {
            log("Forcing re-seed...");
            dbInstance.run("DELETE FROM users");
            dbInstance.run(
                "INSERT INTO users (name, role, pin, created_at) VALUES (?, ?, ?, ?)",
                ['Administrator', 'ADMIN', '1234', new Date().toISOString()]
            );
            databaseService.save();
            log("Re-seed complete.");
            return true;
        }
        return false;
    },

    /**
     * Seeds a minimal dataset specifically for the Reports screen when there are no bills.
     * This is intentionally conservative: it only runs if the `bills` table is empty.
     * Returns true if seed happened, false if skipped.
     */
    seedDemoReportsIfEmpty: async (): Promise<boolean> => {
        await databaseService.init();

        const alreadySeeded = localStorage.getItem('demo_reports_seeded_v1') === 'true';
        if (alreadySeeded) return false;

        const billCountRes = await databaseService.query(`SELECT COUNT(*) as count FROM bills`);
        const billCount = Number(billCountRes?.[0]?.count || 0);
        if (billCount > 0) return false;

        // Ensure at least a couple products exist
        let products = await databaseService.query(
            `SELECT id, name, sell_price, gst_rate, cost_price
             FROM products
             ORDER BY id ASC
             LIMIT 5`
        );

        if (!products || products.length < 2) {
            await databaseService.query(
                `INSERT INTO products (name, barcode, cost_price, sell_price, stock, gst_rate, hsn_code, min_stock_level)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['Demo Product A', `DEMO-${Date.now()}-A`, 50, 80, 25, 5, '0000', 5]
            );
            await databaseService.query(
                `INSERT INTO products (name, barcode, cost_price, sell_price, stock, gst_rate, hsn_code, min_stock_level)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['Demo Product B', `DEMO-${Date.now()}-B`, 20, 35, 10, 12, '0000', 5]
            );
            products = await databaseService.query(
                `SELECT id, name, sell_price, gst_rate, cost_price
                 FROM products
                 ORDER BY id ASC
                 LIMIT 5`
            );
        }

        // Ensure a customer exists (optional for reports, but useful)
        const custRes = await databaseService.query(`SELECT id FROM customers ORDER BY id ASC LIMIT 1`);
        let customerId: number | null = custRes?.[0]?.id ?? null;
        if (!customerId) {
            await databaseService.query(
                `INSERT INTO customers (name, phone, email, address, created_at, total_purchases, points, balance)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['Walk-in Customer', null, null, null, new Date().toISOString(), 0, 0, 0]
            );
            const c2 = await databaseService.query(`SELECT id FROM customers ORDER BY id ASC LIMIT 1`);
            customerId = c2?.[0]?.id ?? null;
        }

        const now = new Date();
        const isoDaysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
        const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');

        // Create 2 bills: PAID and DUE
        const billNoPaid = `DEMO-${ymd}-P-${String(Date.now()).slice(-6)}`;
        const billNoDue = `DEMO-${ymd}-D-${String(Date.now() + 1).slice(-6)}`;

        // Bill 1 (PAID)
        const p1 = products[0];
        const p2 = products[1];
        const qty1 = 2;
        const qty2 = 1;
        const taxable1 = qty1 * Number(p1.sell_price || 0);
        const taxable2 = qty2 * Number(p2.sell_price || 0);
        const gst1 = taxable1 * (Number(p1.gst_rate || 0) / 100);
        const gst2 = taxable2 * (Number(p2.gst_rate || 0) / 100);
        const paidSubtotal = taxable1 + taxable2;
        const paidGst = gst1 + gst2;
        const paidTotal = paidSubtotal + paidGst;

        await databaseService.query(
            `INSERT INTO bills (bill_no, date, subtotal, cgst, sgst, igst, gst_total, total, payment_mode, status, customer_id, discount_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [billNoPaid, isoDaysAgo(1), paidSubtotal, paidGst / 2, paidGst / 2, 0, paidGst, paidTotal, 'CASH', 'PAID', customerId, 10]
        );
        const billPaidIdRes = await databaseService.query(`SELECT id FROM bills WHERE bill_no = ?`, [billNoPaid]);
        const billPaidId = billPaidIdRes?.[0]?.id;

        if (billPaidId) {
            await databaseService.query(
                `INSERT INTO bill_items (bill_id, product_id, quantity, price, taxable_value, gst_rate, gst_amount)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [billPaidId, p1.id, qty1, Number(p1.sell_price || 0), taxable1, Number(p1.gst_rate || 0), gst1]
            );
            await databaseService.query(
                `INSERT INTO bill_items (bill_id, product_id, quantity, price, taxable_value, gst_rate, gst_amount)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [billPaidId, p2.id, qty2, Number(p2.sell_price || 0), taxable2, Number(p2.gst_rate || 0), gst2]
            );
            await databaseService.query(
                `INSERT INTO bill_tenders (bill_id, mode, amount) VALUES (?, ?, ?)`,
                [billPaidId, 'CASH', paidTotal]
            );
        }

        // Bill 2 (DUE) for Outstanding report
        const dueSubtotal = Number(p2.sell_price || 0);
        const dueGst = dueSubtotal * (Number(p2.gst_rate || 0) / 100);
        const dueTotal = dueSubtotal + dueGst;

        await databaseService.query(
            `INSERT INTO bills (bill_no, date, subtotal, cgst, sgst, igst, gst_total, total, payment_mode, status, customer_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [billNoDue, isoDaysAgo(3), dueSubtotal, dueGst / 2, dueGst / 2, 0, dueGst, dueTotal, 'CASH', 'DUE', customerId]
        );

        // Purchase seed (supplier + received PO)
        await databaseService.query(
            `INSERT OR IGNORE INTO suppliers (name, phone, email, address, gstin, created_at, balance)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Demo Supplier', '9000000000', 'demo@supplier.test', 'Demo Address', '22DEMO0000D1Z5', new Date().toISOString(), 0]
        );
        const supplierRes = await databaseService.query(`SELECT id FROM suppliers ORDER BY id ASC LIMIT 1`);
        const supplierId = supplierRes?.[0]?.id;
        if (supplierId) {
            const poNo = `DEMO-PO-${ymd}-${String(Date.now()).slice(-4)}`;
            await databaseService.query(
                `INSERT INTO purchase_orders (order_no, supplier_id, date, total_amount, status, notes, receive_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [poNo, supplierId, isoDaysAgo(10), 500, 'RECEIVED', 'Demo restock', isoDaysAgo(9)]
            );
            const poRes = await databaseService.query(`SELECT id FROM purchase_orders WHERE order_no = ?`, [poNo]);
            const poId = poRes?.[0]?.id;
            if (poId) {
                await databaseService.query(
                    `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, cost_price, total_amount)
                     VALUES (?, ?, ?, ?, ?)`,
                    [poId, p1.id, 2, Number(p1.cost_price || 0), 2 * Number(p1.cost_price || 0)]
                );
            }
        }

        // Loss & damage (inventory logs)
        await databaseService.query(
            `INSERT INTO inventory_logs (product_id, type, quantity_change, reason, date, user_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [p2.id, 'SHRINKAGE', -1, 'Demo shrinkage', isoDaysAgo(2), 1]
        );

        // Cash session + transactions (for finance-related report helpers)
        await databaseService.query(
            `INSERT INTO cash_drawer_sessions (user_id, start_time, end_time, start_cash, end_cash, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [1, isoDaysAgo(1), isoDaysAgo(1), 2000, 2500, 'CLOSED']
        );
        const sessionRes = await databaseService.query(`SELECT id FROM cash_drawer_sessions ORDER BY id DESC LIMIT 1`);
        const sessionId = sessionRes?.[0]?.id;
        if (sessionId) {
            await databaseService.query(
                `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, ?, ?, ?, ?)`,
                [sessionId, 'OPENING', 2000, 'Opening cash', isoDaysAgo(1)]
            );
            await databaseService.query(
                `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, ?, ?, ?, ?)`,
                [sessionId, 'SALE', paidTotal, billNoPaid, isoDaysAgo(1)]
            );
            await databaseService.query(
                `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, ?, ?, ?, ?)`,
                [sessionId, 'PAYOUT', 200, 'Demo expense', isoDaysAgo(1)]
            );
            await databaseService.query(
                `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, ?, ?, ?, ?)`,
                [sessionId, 'CLOSING', 2500, 'Closing cash', isoDaysAgo(1)]
            );
        }

        localStorage.setItem('demo_reports_seeded_v1', 'true');
        return true;
    },

    createBackup: async (): Promise<string> => {
        if (platformService.isElectron()) {
            const res = await window.electronAPI.createBackup();
            if (res.success) return `Backup created at: ${res.path}`;
            throw new Error(res.error || 'Backup failed');
        } else {
            databaseService.save();
            return "Database state saved to Browser LocalStorage.";
        }
    },

    onRemoteStatusChange: (callback: (connected: boolean) => void) => {
        remoteStatusListeners.push(callback);
        callback(isRemoteConnected);
        return () => {
            remoteStatusListeners = remoteStatusListeners.filter(l => l !== callback);
        };
    },

    isRemoteConnected: () => isRemoteConnected
};
