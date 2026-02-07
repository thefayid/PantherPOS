
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function runDebug() {
    console.log('--- DEBUGGING BILLS & SUMMATIONS (Direct Logic) ---');
    const dbPath = path.resolve(__dirname, 'pos_database.sqlite'); // Assuming default name
    console.log('Opening DB:', dbPath);

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('DB Open Error:', err);
    });

    const query = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    try {
        // 1. Dump last 10 bills
        const bills = await query("SELECT id, bill_no, date, total, status FROM bills ORDER BY id DESC LIMIT 10");
        console.table(bills);

        // 2. Run Direct Summation
        const sumSimple = await query("SELECT SUM(total) as simple_total FROM bills");
        console.log('Simple SUM(total) (All time, all status):', sumSimple[0]);

        // 3. Conditional Summation
        const sumConditional = await query("SELECT SUM(CASE WHEN status IN ('PAID', 'REFUNDED') THEN total ELSE 0 END) as cond_total FROM bills");
        console.log("Conditional SUM (PAID + REFUNDED):", sumConditional[0]);

        // 4. Today Summation
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // We must mimic local time string construction if database stores ISO
        // If DB stores '2023-X-X T Z' (UTC), we need to check how 'date(date, localtime)' behaves.

        const isoStart = today.toISOString();
        console.log('Using Start Date ISO:', isoStart);

        const sumToday = await query(
            "SELECT SUM(CASE WHEN status IN ('PAID', 'REFUNDED') THEN total ELSE 0 END) as today_total FROM bills WHERE date >= ?",
            [isoStart]
        );
        console.log("Today's Conditional SUM (via >= ISO):", sumToday[0]);

        // 5. Today Summation using SQLite Date function (Service Logic mirror)
        const sumTodayService = await query(
            `SELECT SUM(CASE WHEN status IN ('PAID', 'REFUNDED') THEN total ELSE 0 END) as total 
             FROM bills 
             WHERE date(date, 'localtime') >= date('now', 'localtime')`
        );
        console.log("Today's Conditional SUM (via SQLite date function):", sumTodayService[0]);

    } catch (e) {
        console.error("Query Error:", e);
    } finally {
        db.close();
    }
}

runDebug();
