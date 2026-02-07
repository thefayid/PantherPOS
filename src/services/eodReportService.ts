import type { User } from '../types/db';
import { cashService } from './cashService';
import { settingsService } from './settingsService';
import { exportService } from './exportService';
import { formatInr, type PosReportPdfInput, type PosTable } from './posReportPdfEngine';

function safeNum(n: any): number {
    const x = typeof n === 'number' && Number.isFinite(n) ? n : Number(n);
    return Number.isFinite(x) ? x : 0;
}

function formatMoney(n: number): string {
    return formatInr(safeNum(n));
}

export const eodReportService = {
    buildShiftReportPdfInput: async (sessionId: number, opts: {
        kind: 'X' | 'Z';
        countedCash?: number;
        approvedBy?: Pick<User, 'id' | 'name' | 'role'> | null;
    }): Promise<{ filename: string; input: PosReportPdfInput }> => {
        const session = await cashService.getSessionById(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const settings = await settingsService.getSettings();
        const businessName = settings.store_name || 'Business';

        const endTime = session.end_time || new Date().toISOString();
        const expectedCash = await cashService.getExpectedCash(sessionId);
        const countedCash = opts.countedCash ?? session.end_cash ?? null;
        const variance = countedCash === null ? null : safeNum(countedCash) - expectedCash;

        const txns = await cashService.getTransactions(sessionId);
        const sumType = (t: string) => txns.filter(x => x.type === t).reduce((a, b) => a + safeNum(b.amount), 0);

        const opening = safeNum(session.start_cash);
        const cashSales = sumType('SALE');
        const cashRefunds = sumType('REFUND');
        const payins = sumType('PAYIN');
        const payouts = sumType('PAYOUT');
        const drops = sumType('DROP');

        const tenderSummary = await cashService.getSessionSummary(sessionId, endTime);
        const tenderRows: unknown[][] = (tenderSummary || []).map((r: any) => [String(r.mode || ''), formatMoney(safeNum(r.amount))]);

        const tables: PosTable[] = [
            {
                title: 'Payment tenders (from bills)',
                headers: ['Payment mode', 'Amount'],
                rows: tenderRows.length ? tenderRows : [['Not available', 'Not available']],
                includeTotalsRow: false,
            },
            {
                title: 'Cash reconciliation (drawer)',
                headers: ['Metric', 'Amount'],
                rows: [
                    ['Opening float', formatMoney(opening)],
                    ['Cash sales (from cash transactions)', formatMoney(cashSales)],
                    ['Cash refunds (from cash transactions)', formatMoney(cashRefunds)],
                    ['Pay-ins', formatMoney(payins)],
                    ['Payouts', formatMoney(payouts)],
                    ['Drops', formatMoney(drops)],
                    ['Expected cash', formatMoney(expectedCash)],
                    ['Counted cash', countedCash === null ? 'Not available' : formatMoney(safeNum(countedCash))],
                    ['Variance', variance === null ? 'Not available' : formatMoney(variance)],
                ],
                includeTotalsRow: false,
            },
            {
                title: 'Session metadata',
                headers: ['Field', 'Value'],
                rows: [
                    ['Session ID', String(session.id)],
                    ['Status', String(session.status)],
                    ['Start time', new Date(session.start_time).toLocaleString()],
                    ['End time', session.end_time ? new Date(session.end_time).toLocaleString() : 'OPEN'],
                    ['Opened by user_id', String(session.user_id)],
                    ['Approved by', opts.approvedBy ? `${opts.approvedBy.name} (${opts.approvedBy.role})` : 'Not available'],
                ],
                includeTotalsRow: false,
            }
        ];

        const title = opts.kind === 'X'
            ? `X Report - Session #${session.id}`
            : `Z Report - Session #${session.id}`;

        const notesLines: string[] = [];
        if (opts.kind === 'X') {
            notesLines.push('X Report: Snapshot only. Register remains open.');
        } else {
            notesLines.push('Z Report: End-of-day close. Register session is finalized.');
        }
        notesLines.push('All values are computed from local transactions and recorded tenders.');

        const input: PosReportPdfInput = {
            posName: 'PantherPOS',
            title,
            businessName,
            reportDate: new Date().toLocaleDateString(),
            generatedTime: new Date().toLocaleString(),
            kpis: [
                { label: 'Expected cash', value: formatMoney(expectedCash) },
                { label: 'Counted cash', value: countedCash === null ? 'Not available' : formatMoney(safeNum(countedCash)) },
                { label: 'Variance', value: variance === null ? 'Not available' : formatMoney(variance) },
            ],
            introduction: 'This report summarizes the cash drawer session and payment tenders.',
            tables,
            notes: { title: 'Notes', lines: notesLines },
            closingLine: 'For internal operational control and reconciliation purposes.',
        };

        const safeDate = new Date().toISOString().slice(0, 10);
        const filename = `${opts.kind}_Report_Session_${session.id}_${safeDate}.pdf`;
        return { filename, input };
    },

    exportXReport: async (sessionId: number) => {
        const { filename, input } = await eodReportService.buildShiftReportPdfInput(sessionId, { kind: 'X' });
        return await exportService.generatePosReportPdf(filename, input);
    },

    exportZReport: async (sessionId: number, params: { countedCash: number; approvedBy?: Pick<User, 'id' | 'name' | 'role'> | null }) => {
        const { filename, input } = await eodReportService.buildShiftReportPdfInput(sessionId, {
            kind: 'Z',
            countedCash: params.countedCash,
            approvedBy: params.approvedBy || null,
        });
        return await exportService.generatePosReportPdf(filename, input);
    },
};

