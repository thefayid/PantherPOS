import type { CashDrawerSession, CashTransaction } from '../types/db';
import { databaseService } from './databaseService';
import { auditService } from './auditService';
import { notificationService } from './notificationService';

export type DenominationBreakdown = Record<string, number>;

export const cashService = {
    startSession: async (userId: number, initialCash: number, metaJson?: string): Promise<number> => {
        // Only one open session per register/app instance.
        const existing = await cashService.getCurrentSession();
        if (existing) return existing.id;

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
            `INSERT INTO cash_transactions (session_id, type, amount, reason, meta_json, time) VALUES (?, 'OPENING', ?, 'Opening Balance', ?, ?)`,
            [newSessionId, initialCash, metaJson || null, startTime]
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

    endSession: async (sessionId: number, endCash: number, metaJson?: string): Promise<void> => {
        const before = await cashService.getSessionById(sessionId);
        const endTime = new Date().toISOString();
        const expected = await cashService.getExpectedCash(sessionId);
        const variance = (endCash || 0) - expected;

        await databaseService.query(
            `UPDATE cash_drawer_sessions 
             SET end_time = ?, end_cash = ?, expected_cash = ?, variance = ?, status = 'CLOSED' 
             WHERE id = ?`,
            [endTime, endCash, expected, variance, sessionId]
        );

        await databaseService.query(
            `INSERT INTO cash_transactions (session_id, type, amount, reason, meta_json, time) 
             VALUES (?, 'CLOSING', ?, ?, ?, ?)`,
            [
                sessionId,
                endCash,
                `Closing Count (Expected: ₹${expected.toFixed(2)}, Variance: ₹${variance.toFixed(2)})`,
                metaJson || null,
                endTime
            ]
        );

        try {
            const after = await cashService.getSessionById(sessionId);
            await auditService.logChange('CLOSE_REGISTER', {
                entity: 'cash_drawer_sessions',
                entityId: sessionId,
                before,
                after,
                severity: Math.abs(variance) >= 0.01 ? 'WARN' : 'INFO',
                message: `Register closed (expected ₹${expected.toFixed(2)}, counted ₹${Number(endCash || 0).toFixed(2)}, variance ₹${variance.toFixed(2)})`,
                meta: metaJson ? { metaJson } : undefined,
            });
        } catch (e) {
            // Do not block register close if audit write fails.
            console.warn('[cashService] audit log failed', e);
        }

        // Trigger actionable notification for large variances (offline, local-only).
        try {
            await notificationService.notifyCashVariance({
                sessionId,
                expected,
                counted: Number(endCash || 0),
                variance,
            });
        } catch (e) {
            // never block close
        }
    },

    addTransaction: async (
        sessionId: number,
        type: 'PAYIN' | 'DROP' | 'PAYOUT' | 'SALE' | 'REFUND',
        amount: number,
        reason: string,
        metaJson?: string
    ) => {
        const time = new Date().toISOString();
        await databaseService.query(
            `INSERT INTO cash_transactions (session_id, type, amount, reason, meta_json, time) VALUES (?, ?, ?, ?, ?, ?)`,
            [sessionId, type, amount, reason, metaJson || null, time]
        );
    },

    getTransactions: async (sessionId: number): Promise<CashTransaction[]> => {
        return await databaseService.query(
            `SELECT * FROM cash_transactions WHERE session_id = ? ORDER BY id DESC`,
            [sessionId]
        );
    },

    getSessionById: async (sessionId: number): Promise<CashDrawerSession | null> => {
        const rows = await databaseService.query(`SELECT * FROM cash_drawer_sessions WHERE id = ?`, [sessionId]);
        return rows?.[0] || null;
    },

    listSessions: async (limit: number = 25): Promise<CashDrawerSession[]> => {
        return await databaseService.query(
            `SELECT * FROM cash_drawer_sessions ORDER BY id DESC LIMIT ?`,
            [limit]
        );
    },

    getExpectedCash: async (sessionId: number): Promise<number> => {
        const sRes = await databaseService.query(`SELECT * FROM cash_drawer_sessions WHERE id = ?`, [sessionId]);
        const session = sRes[0];
        if (!session) return 0;

        const txns: CashTransaction[] = await cashService.getTransactions(sessionId);
        const delta = txns.reduce((acc, tx) => {
            // OPENING/CLOSING are informational; start_cash/end_cash live on the session itself.
            if (tx.type === 'SALE') return acc + tx.amount;
            if (tx.type === 'PAYIN') return acc + tx.amount;
            if (tx.type === 'PAYOUT') return acc - tx.amount;
            if (tx.type === 'DROP') return acc - tx.amount;
            if (tx.type === 'REFUND') return acc - tx.amount;
            return acc;
        }, 0);

        return Number(session.start_cash || 0) + delta;
    },

    getSessionSummary: async (sessionId: number, endTimeOverride?: string): Promise<{ mode: string; amount: number }[]> => {
        const session = await databaseService.query('SELECT * FROM cash_drawer_sessions WHERE id = ?', [sessionId]);
        if (!session.length) return [];
        const start = session[0].start_time;
        const end = endTimeOverride || session[0].end_time || null;
        // For open sessions, end time is now, but filtering by just start time for bills created AFTER session start is enough if we assume sequential sessions.
        // Better: Join bills and bill_tenders.

        // We want totals by payment mode for bills created during this session.
        // Assuming session is for the current user or global?
        // Prompt implies "Cash out all users" vs "Cash out", so maybe per user or global.
        // Let's stick to global sales for the "End of Day" scope usually.

        const endFilter = end ? ` AND b.date <= ?` : ``;
        const params = end ? [start, end] : [start];

        return await databaseService.query(`
            SELECT bt.mode, SUM(bt.amount) as amount
            FROM bill_tenders bt
            JOIN bills b ON bt.bill_id = b.id
            WHERE b.date >= ? ${endFilter} AND (b.status = 'PAID' OR b.status = 'PARTIAL_RETURN' OR b.status = 'REFUNDED')
            GROUP BY bt.mode
        `, params);
    }
};
