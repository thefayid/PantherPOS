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
    image TEXT
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
            "ALTER TABLE users ADD COLUMN given_salary REAL DEFAULT 0"
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
