import type { CashDrawerSession, CashTransaction } from '../types/db';
import { databaseService } from './databaseService';

export const cashService = {
    startSession: async (userId: number, initialCash: number): Promise<number> => {
        const startTime = new Date().toISOString();
        await databaseService.query(
            `INSERT INTO cash_drawer_sessions (user_id, start_time, start_cash, status) VALUES (?, ?, ?, 'OPEN')`,
            [userId, startTime, initialCash]
        );

        // Also log as an initial transaction
        // Based on other services, let's select the last ID for this user.

        const sessionRes = await databaseService.query(
            `SELECT id FROM cash_drawer_sessions WHERE user_id = ? AND status = 'OPEN' ORDER BY id DESC LIMIT 1`,
            [userId]
        );
        const newSessionId = sessionRes[0].id;

        await databaseService.query(
            `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, 'OPENING', ?, 'Opening Balance', ?)`,
            [newSessionId, initialCash, startTime]
        );

        return newSessionId;
    },

    getCurrentSession: async (): Promise<CashDrawerSession | null> => {
        // We really need to know the logged in user, but for now let's find ANY open session if we treat registers as single-user-exclusive
        // OR we pass userId. Let's pass userId if possible, but for a global lock, checking any open session is safer for single-till.
        const res = await databaseService.query(
            `SELECT * FROM cash_drawer_sessions WHERE status = 'OPEN' LIMIT 1`
        );
        return res[0] || null;
    },

    endSession: async (sessionId: number, endCash: number): Promise<void> => {
        const endTime = new Date().toISOString();
        await databaseService.query(
            `UPDATE cash_drawer_sessions SET end_time = ?, end_cash = ?, status = 'CLOSED' WHERE id = ?`,
            [endTime, endCash, sessionId]
        );

        await databaseService.query(
            `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, 'CLOSING', ?, 'Closing Balance', ?)`,
            [sessionId, endCash, endTime]
        );
    },

    addTransaction: async (sessionId: number, type: 'DROP' | 'PAYOUT' | 'SALE' | 'REFUND' | 'PAYIN' | 'OPENING', amount: number, reason: string) => {
        const time = new Date().toISOString();
        await databaseService.query(
            `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, ?, ?, ?, ?)`,
            [sessionId, type, amount, reason, time]
        );
    },

    getTransactions: async (sessionId: number): Promise<CashTransaction[]> => {
        return await databaseService.query(
            `SELECT * FROM cash_transactions WHERE session_id = ? ORDER BY id DESC`,
            [sessionId]
        );
    },

    getSessionSummary: async (sessionId: number): Promise<{ mode: string; amount: number }[]> => {
        const session = await databaseService.query('SELECT * FROM cash_drawer_sessions WHERE id = ?', [sessionId]);
        if (!session.length) return [];
        const start = session[0].start_time;
        // For open sessions, end time is now, but filtering by just start time for bills created AFTER session start is enough if we assume sequential sessions.
        // Better: Join bills and bill_tenders.

        // We want totals by payment mode for bills created during this session.
        // Assuming session is for the current user or global?
        // Prompt implies "Cash out all users" vs "Cash out", so maybe per user or global.
        // Let's stick to global sales for the "End of Day" scope usually.

        return await databaseService.query(`
            SELECT bt.mode, SUM(bt.amount) as amount
            FROM bill_tenders bt
            JOIN bills b ON bt.bill_id = b.id
            WHERE b.date >= ? AND (b.status = 'PAID' OR b.status = 'PARTIAL_RETURN')
            GROUP BY bt.mode
        `, [start]);
    }
};
