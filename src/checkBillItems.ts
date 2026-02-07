
import { databaseService } from './services/databaseService';

async function checkBill() {
    console.log('--- CHECKING BILL ITEMS ---');
    await databaseService.init();

    const billNo = 'BILL-20260207-0020'; // From screenshot
    console.log(`Checking Bill: ${billNo}`);

    const bills = await databaseService.query('SELECT * FROM bills WHERE bill_no = ?', [billNo]);
    console.log('Bills Found:', bills.length);
    if (bills.length > 0) {
        const bill = bills[0];
        console.log('Bill Header:', bill);

        console.log(`Checking Items for Bill ID: ${bill.id}`);
        const items = await databaseService.query('SELECT * FROM bill_items WHERE bill_id = ?', [bill.id]);
        console.log('Items Found in DB:', items.length);
        console.log('Items:', items);
    } else {
        console.log('Bill not found in DB');
    }
}

// Mock Browser Globals for Node Execution
if (typeof window === 'undefined') {
    (global as any).window = {
        location: { hostname: 'localhost' },
        electronAPI: undefined
    };
    (global as any).navigator = { userAgent: 'Node' };
    (global as any).localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { }
    };
}

checkBill().catch(console.error);
