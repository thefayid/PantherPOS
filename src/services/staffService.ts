import { databaseService } from './databaseService';
import type { StaffAttendance, StaffPayment } from '../types/db';

export const staffService = {
    // Attendance
    markAttendance: async (userId: number, status: StaffAttendance['status']): Promise<number> => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        const checkIn = now.toISOString();

        // Check if already marked for today
        const existing = await databaseService.query(
            'SELECT id FROM staff_attendance WHERE user_id = ? AND date = ?',
            [userId, today]
        );

        if (existing.length > 0) {
            const result = await databaseService.query(
                'UPDATE staff_attendance SET status = ? WHERE id = ?',
                [status, existing[0].id]
            );
            return result.changes;
        } else {
            const result = await databaseService.query(
                'INSERT INTO staff_attendance (user_id, date, check_in, status) VALUES (?, ?, ?, ?)',
                [userId, today, checkIn, status]
            );
            return result.changes;
        }
    },

    getAttendance: async (userId: number, month?: string): Promise<StaffAttendance[]> => {
        let sql = 'SELECT * FROM staff_attendance WHERE user_id = ?';
        const params: any[] = [userId];


        if (month) {
            sql += ' AND date LIKE ?';
            params.push(`${month}%`);
        }

        sql += ' ORDER BY date DESC';
        return await databaseService.query(sql, params);
    },

    // Salary Payments
    paySalary: async (userId: number, amount: number, mode: string, notes?: string): Promise<number> => {
        const date = new Date().toISOString();

        // Register payment
        const res = await databaseService.query(
            'INSERT INTO staff_payments (user_id, date, amount, payment_mode, notes) VALUES (?, ?, ?, ?, ?)',
            [userId, date, amount, mode, notes]
        );

        // Update user totals
        await databaseService.query(
            'UPDATE users SET pending_salary = pending_salary - ?, given_salary = given_salary + ? WHERE id = ?',
            [amount, amount, userId]
        );

        return res.changes;
    },

    getPaymentHistory: async (userId: number): Promise<StaffPayment[]> => {
        return await databaseService.query(
            'SELECT * FROM staff_payments WHERE user_id = ? ORDER BY date DESC',
            [userId]
        );
    },

    getStaffSummary: async (userId: number) => {
        const user = await databaseService.query('SELECT salary, pending_salary, given_salary FROM users WHERE id = ?', [userId]);
        const attendance = await staffService.getAttendance(userId);
        const payments = await staffService.getPaymentHistory(userId);

        return {
            ...user[0],
            attendance,
            payments
        };
    }
};
