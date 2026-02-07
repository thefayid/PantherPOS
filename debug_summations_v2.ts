
// Use relative path to avoid alias issues if possible, assuming run from root
import { databaseService } from './src/services/databaseService';

async function runDebug() {
    try {
        console.log('--- DEBUG V2 ---');
        // 1. Dump last 10 bills
        const bills = await databaseService.query("SELECT id, bill_no, date, total, status FROM bills ORDER BY id DESC LIMIT 10");
        console.log("Last 10 Bills:");
        console.table(bills);

        // 2. Direct Sum (PAID + REFUNDED)
        const sumConditional = await databaseService.query("SELECT SUM(CASE WHEN status IN ('PAID', 'REFUNDED') THEN total ELSE 0 END) as cond_total FROM bills");
        console.log("Total (PAID+REFUNDED):", sumConditional[0]);

    } catch (e) {
        console.error("Error:", e);
    }
}
runDebug();
