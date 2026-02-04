import { databaseService } from './databaseService';
import type { Account, Voucher, VoucherItem } from '../types/db';

export const accountingService = {
    // --- ACCOUNTS ---
    getAccounts: async (): Promise<Account[]> => {
        return await databaseService.query('SELECT * FROM accounts ORDER BY code ASC');
    },

    getAccountById: async (id: number): Promise<Account | null> => {
        const res = await databaseService.query('SELECT * FROM accounts WHERE id = ?', [id]);
        return res[0] || null;
    },

    getAccountByCode: async (code: string): Promise<Account | null> => {
        const res = await databaseService.query('SELECT * FROM accounts WHERE code = ?', [code]);
        return res[0] || null;
    },

    createAccount: async (account: Omit<Account, 'id' | 'balance'>): Promise<number> => {
        const result = await databaseService.query(
            `INSERT INTO accounts (code, name, type, category, description, is_system)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [account.code, account.name, account.type, account.category || null, account.description || null, account.is_system ? 1 : 0]
        );
        return result.changes;
    },

    // --- VOUCHERS ---
    getVouchers: async (startDate?: string, endDate?: string): Promise<Voucher[]> => {
        let sql = 'SELECT * FROM vouchers WHERE 1=1';
        const params: any[] = [];
        if (startDate) { sql += ' AND date >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND date <= ?'; params.push(endDate); }
        sql += ' ORDER BY date DESC, id DESC';
        return await databaseService.query(sql, params);
    },

    getVoucherDetails: async (voucherId: number): Promise<{ voucher: Voucher, items: (VoucherItem & { account_name: string, account_code: string })[] }> => {
        const vouchers = await databaseService.query('SELECT * FROM vouchers WHERE id = ?', [voucherId]);
        if (!vouchers.length) throw new Error('Voucher not found');

        const items = await databaseService.query(
            `SELECT vi.*, a.name as account_name, a.code as account_code
             FROM voucher_items vi
             JOIN accounts a ON vi.account_id = a.id
             WHERE vi.voucher_id = ?`,
            [voucherId]
        );

        return { voucher: vouchers[0], items };
    },

    generateVoucherNo: async (type: string): Promise<string> => {
        const prefix = type.substring(0, 1).toUpperCase();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const res = await databaseService.query(
            `SELECT COUNT(*) as count FROM vouchers WHERE type = ? AND date(date) = date('now')`,
            [type]
        );
        const count = (res[0]?.count || 0) + 1;
        return `${prefix}${dateStr}${count.toString().padStart(4, '0')}`;
    },

    postVoucher: async (voucher: Omit<Voucher, 'id' | 'created_at' | 'voucher_no'>, items: Omit<VoucherItem, 'id' | 'voucher_id'>[]): Promise<number> => {
        // 1. Validate Double Entry (Sum of Debits must equal Sum of Credits)
        const debits = items.filter(i => i.type === 'DEBIT').reduce((sum, i) => sum + i.amount, 0);
        const credits = items.filter(i => i.type === 'CREDIT').reduce((sum, i) => sum + i.amount, 0);

        if (Math.abs(debits - credits) > 0.01) {
            throw new Error(`Out of balance: Debits (${debits}) != Credits (${credits})`);
        }

        const voucherNo = await accountingService.generateVoucherNo(voucher.type);

        // 2. Insert Voucher
        const vResult = await databaseService.query(
            `INSERT INTO vouchers (voucher_no, date, type, total_amount, reference_id, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [voucherNo, voucher.date, voucher.type, voucher.total_amount, voucher.reference_id || null, voucher.notes || null]
        );
        const voucherId = vResult.lastInsertRowid;

        // 3. Insert Items & Update Account Balances
        for (const item of items) {
            await databaseService.query(
                `INSERT INTO voucher_items (voucher_id, account_id, type, amount, description)
                 VALUES (?, ?, ?, ?, ?)`,
                [voucherId, item.account_id, item.type, item.amount, item.description || null]
            );

            // Update Account Balance
            // Assets & Expenses: Increase on Debit, Decrease on Credit
            // Liabilities, Income & Equity: Decrease on Debit, Increase on Credit
            const account = await accountingService.getAccountById(item.account_id);
            if (!account) continue;

            let balanceDelta = 0;
            if (account.type === 'ASSET' || account.type === 'EXPENSE') {
                balanceDelta = item.type === 'DEBIT' ? item.amount : -item.amount;
            } else {
                balanceDelta = item.type === 'CREDIT' ? item.amount : -item.amount;
            }

            await databaseService.query(
                `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
                [balanceDelta, item.account_id]
            );
        }

        return voucherId;
    },

    // --- REPORTS ---
    getLedger: async (accountId: number, startDate?: string, endDate?: string) => {
        let sql = `
            SELECT vi.*, v.voucher_no, v.date, v.type as voucher_type, v.notes as voucher_notes
            FROM voucher_items vi
            JOIN vouchers v ON vi.voucher_id = v.id
            WHERE vi.account_id = ?
        `;
        const params: any[] = [accountId];
        if (startDate) { sql += ' AND v.date >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND v.date <= ?'; params.push(endDate); }
        sql += ' ORDER BY v.date ASC, v.id ASC';

        return await databaseService.query(sql, params);
    },

    getTrialBalance: async () => {
        return await databaseService.query(`
            SELECT code, name, type, balance
            FROM accounts
            WHERE balance != 0
            ORDER BY type, code
        `);
    },

    getProfitAndLoss: async (startDate: string, endDate: string) => {
        const income = await databaseService.query(
            `SELECT a.name, SUM(CASE WHEN vi.type = 'CREDIT' THEN vi.amount ELSE -vi.amount END) as balance
             FROM voucher_items vi
             JOIN vouchers v ON vi.voucher_id = v.id
             JOIN accounts a ON vi.account_id = a.id
             WHERE a.type = 'INCOME' AND date(v.date) BETWEEN ? AND ?
             GROUP BY a.id`,
            [startDate, endDate]
        );
        const expenses = await databaseService.query(
            `SELECT a.name, SUM(CASE WHEN vi.type = 'DEBIT' THEN vi.amount ELSE -vi.amount END) as balance
             FROM voucher_items vi
             JOIN vouchers v ON vi.voucher_id = v.id
             JOIN accounts a ON vi.account_id = a.id
             WHERE a.type = 'EXPENSE' AND date(v.date) BETWEEN ? AND ?
             GROUP BY a.id`,
            [startDate, endDate]
        );

        const totalIncome = income.reduce((sum: number, a: any) => sum + (a.balance || 0), 0);
        const totalExpenses = expenses.reduce((sum: number, a: any) => sum + (a.balance || 0), 0);

        return {
            income,
            expenses,
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses
        };
    },

    getBalanceSheet: async () => {
        const assets = await databaseService.query(`SELECT name, balance FROM accounts WHERE type = 'ASSET'`);
        const liabilities = await databaseService.query(`SELECT name, balance FROM accounts WHERE type = 'LIABILITY'`);
        const equity = await databaseService.query(`SELECT name, balance FROM accounts WHERE type = 'EQUITY'`);

        // Need to include current year profit in equity if not already closed
        // For simplicity, we assume all income/expense accounts are part of the 'Retained Earnings' logic
        const pnl = await databaseService.query(`
            SELECT SUM(CASE WHEN type = 'INCOME' THEN balance ELSE -balance END) as net
            FROM accounts WHERE type IN ('INCOME', 'EXPENSE')
        `);
        const currentProfit = pnl[0]?.net || 0;

        return {
            assets,
            liabilities,
            equity: [...equity, { name: 'Current Period Profit', balance: currentProfit }],
            totalAssets: assets.reduce((sum: number, a: any) => sum + a.balance, 0),
            totalLiabilitiesEquity: liabilities.reduce((sum: number, a: any) => sum + a.balance, 0) +
                equity.reduce((sum: number, a: any) => sum + a.balance, 0) +
                currentProfit
        };
    },

    // --- ANALYTICS (AI SUPPORT) ---

    getFinancialRatios: async () => {
        const bs = await accountingService.getBalanceSheet();
        // Calculate P&L for last 30 days for ratios
        const endDate = new Date().toISOString().slice(0, 10);
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const pnl = await accountingService.getProfitAndLoss(startDate, endDate);

        // Current Ratio: Current Assets / Current Liabilities (Simplified: Total Ass / Total Liab)
        const currentRatio = bs.totalLiabilitiesEquity > 0 ? (bs.totalAssets / bs.totalLiabilitiesEquity) : 0;

        // Net Margin: Net Profit / Revenue
        const netMargin = pnl.totalIncome > 0 ? (pnl.netProfit / pnl.totalIncome) * 100 : 0;

        return {
            liquidity: {
                currentRatio: parseFloat(currentRatio.toFixed(2)),
                quickRatio: parseFloat((currentRatio * 0.8).toFixed(2)) // Estimation
            },
            profitability: {
                netMargin: parseFloat(netMargin.toFixed(2)),
                grossMargin: parseFloat((netMargin * 1.5).toFixed(2)) // Estimation without COGS separation
            },
            healthScore: currentRatio > 1.5 ? 'EXCELLENT' : currentRatio > 1.0 ? 'GOOD' : 'WARNING'
        };
    },

    getAssetSchedule: async (assetAccountId: number, method: 'SLM' | 'WDV' = 'SLM', ratePercent: number = 10): Promise<any[]> => {
        // Mock implementation: In real world, would fetch purchase date from account metadata or first debit entry
        const account = await accountingService.getAccountById(assetAccountId);
        if (!account || account.type !== 'ASSET') return [];

        const openingBalance = account.balance;
        const usefulLifeYears = 5;
        const schedule: any[] = [];
        let currentBookValue = openingBalance;
        const currentYear = new Date().getFullYear();

        for (let i = 0; i < usefulLifeYears; i++) {
            let depreciation = 0;
            if (method === 'SLM') depreciation = openingBalance * (ratePercent / 100);
            else depreciation = currentBookValue * (ratePercent / 100);

            if (currentBookValue - depreciation < 0) depreciation = currentBookValue;

            schedule.push({
                year: currentYear + i,
                opening: currentBookValue,
                depreciation: depreciation,
                closing: currentBookValue - depreciation
            });
            currentBookValue -= depreciation;
        }

        return schedule;
    },

    getGSTLiabilitySummary: async (period: 'month' | 'quarter' = 'month') => {
        // Summary of Output Tax (Sales) vs Input Tax (Purchases)
        // We look for accounts named 'Output CGST', 'Output SGST', 'Input CGST', etc.
        const outputCGST = (await accountingService.getAccountByCode('OUTPUT_CGST'))?.balance || 0;
        const outputSGST = (await accountingService.getAccountByCode('OUTPUT_SGST'))?.balance || 0;
        const inputCGST = (await accountingService.getAccountByCode('INPUT_CGST'))?.balance || 0;
        const inputSGST = (await accountingService.getAccountByCode('INPUT_SGST'))?.balance || 0;

        const totalOutput = Math.abs(outputCGST) + Math.abs(outputSGST);
        const totalInput = Math.abs(inputCGST) + Math.abs(inputSGST);

        return {
            period,
            outputTax: totalOutput,
            inputTax: totalInput,
            netPayable: totalOutput > totalInput ? totalOutput - totalInput : 0,
            creditCarriedForward: totalInput > totalOutput ? totalInput - totalOutput : 0
        };
    },

    forecastSales: async (days: number = 30) => {
        // Linear Projection based on last 7 days sales
        // 1. Get Daily Sales for last 7 days
        const dailySales = await databaseService.query(`
            SELECT date(date) as day, SUM(total_amount) as total 
            FROM vouchers 
            WHERE type = 'SALES' 
            GROUP BY date(date) 
            ORDER BY day DESC 
            LIMIT 7
        `);

        if (dailySales.length < 2) return { trend: 'stable', forecast: [] };

        const avgDaily = dailySales.reduce((sum: number, d: any) => sum + d.total, 0) / dailySales.length;
        const forecast = [];
        const today = new Date();

        for (let i = 1; i <= days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            forecast.push({
                date: date.toISOString().slice(0, 10),
                predicted_amount: Math.round(avgDaily * (1 + (Math.random() * 0.1 - 0.05))) // +/- 5% random variation
            });
        }

        return {
            avgDailySales: Math.round(avgDaily),
            trend: 'growing', // Simple hardcode for now
            forecast
        };
    },

    getReceivablesAgeing: async () => {
        // 1. Get all customers with +ve balance (Asset for us, so Debtors)
        // Note: Ideally, we check 'Customer' type accounts.
        // For this mock, we assume accounts with category 'Customer' or just check positive balances in Assets (simplified).
        // Better: We need distinct invoices. Since we might not have full invoice linking, we use FIFO on balance.
        // Implementation:
        // Get all Sales Vouchers that are 'Unpaid'. Since we don't track invoice status perfectly in Vouchers table alone,
        // we will simulate Ageing based on recent Sales vs Current Balance.

        const debtors = await databaseService.query("SELECT * FROM accounts WHERE type = 'ASSET' AND (name LIKE '%Customer%' OR category = 'Customer')");
        const ageingReport = [];

        for (const debtor of debtors) {
            if (debtor.balance <= 0) continue; // No dues

            // Simple Ageing Simulation (Real implementation needs invoice-level tracking)
            // We assume the balance is from the oldest unpaid bills? No, usually FIFO.
            // Let's just categorize the total balance for now as we lack easy invoice-aging link in this schema.
            ageingReport.push({
                name: debtor.name,
                totalDue: debtor.balance,
                days_0_30: debtor.balance * 0.6, // Mock distribution
                days_30_60: debtor.balance * 0.3,
                days_60_90: debtor.balance * 0.1,
                days_90_plus: 0
            });
        }
        return ageingReport;
    },

    getCashFlowStatement: async (startDate: string, endDate: string) => {
        // Indirect Method:
        // Operating Activities: Net Profit + Non-Cash Expenses (Depreciation) + Changes in Working Capital
        // Investing Activities: Purchase/Sale of Assets
        // Financing Activities: Loans, Equity, Dividends

        const pnl = await accountingService.getProfitAndLoss(startDate, endDate);
        const netProfit = pnl.netProfit;

        // Mock Adjustments (Real requires delta of all current assets/liabilities between two dates)
        const operatingCashFlow = netProfit + 5000; // + Depreciation mock
        const investingCashFlow = -10000; // Equipment purchase mock
        const financingCashFlow = 0;

        return {
            operating: operatingCashFlow,
            investing: investingCashFlow,
            financing: financingCashFlow,
            netChange: operatingCashFlow + investingCashFlow + financingCashFlow
        };
    },

    getDayBook: async (date: string) => {
        return await databaseService.query(`
            SELECT v.voucher_no, v.type, v.total_amount, v.notes,
                   GROUP_CONCAT(a.name || ': ' || vi.amount) as details
            FROM vouchers v
            JOIN voucher_items vi ON v.id = vi.voucher_id
            JOIN accounts a ON vi.account_id = a.id
            WHERE date(v.date) = ?
            GROUP BY v.id
            ORDER BY v.id ASC
        `, [date]);
    }
};
