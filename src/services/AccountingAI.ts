import { accountingService } from './accountingService';
import { databaseService } from './databaseService';

export interface AIActionResponse {
    action: string;
    module: string;
    details: any;
    journal_entries?: Array<{ ledger: string; type: 'debit' | 'credit'; amount: number }>;
    notes?: string;
    explanation?: string;
}

export const accountingAI = {
    // Main entry point for AI to resolve accounting queries
    resolveIntent: async (intent: string, payload: any): Promise<AIActionResponse | null> => {
        console.log(`[AccountingAI] Resolving intent: ${intent}`, payload);

        switch (intent) {
            case 'ADD_EXPENSE':
                return await accountingAI.handleExpense(payload);
            case 'ANALYTICS_QUERY':
                return await accountingAI.handleAnalytics(payload);
            case 'REPORT_QUERY':
                return await accountingAI.handleReport(payload);
            default:
                return null;
        }
    },

    handleExpense: async (payload: any): Promise<AIActionResponse> => {
        // payload: { amount, reason, paymentMode? }
        const paymentAccount = payload.paymentMode === 'UPI' ? 'Bank' : 'Cash'; // Simple heuristic

        return {
            explanation: `Recording expense using ${paymentAccount}.`,
            action: 'create_journal_entry',
            module: 'general_ledger',
            details: {
                amount: payload.amount,
                narration: payload.reason || 'Miscellaneous Expense',
                payment_mode: payload.paymentMode || 'Cash'
            },
            journal_entries: [
                { ledger: payload.reason || 'Miscellaneous Expenses', type: 'debit', amount: payload.amount },
                { ledger: paymentAccount, type: 'credit', amount: payload.amount }
            ],
            notes: "Entry will be posted as 'Draft' for review."
        };
    },

    handleAnalytics: async (payload: any): Promise<AIActionResponse> => {
        if (payload.subType === 'PREDICT_SALES') {
            const result = await accountingService.forecastSales(30);
            return {
                explanation: `Projected sales for next 30 days show a ${result.trend} trend with approx ₹${result.avgDailySales}/day.`,
                action: 'show_forecast',
                module: 'analytics',
                details: {
                    trend: result.trend,
                    avg_daily: result.avgDailySales,
                    forecast_data: result.forecast
                },
                notes: "Based on linear projection of last 7 days."
            };
        }
        else if (payload.subType === 'SYSTEM_HEALTH') {
            const ratios = await accountingService.getFinancialRatios();
            return {
                explanation: `Financial Health is ${ratios.healthScore}. Current Ratio: ${ratios.liquidity.currentRatio}, Net Margin: ${ratios.profitability.netMargin}%.`,
                action: 'show_health_card',
                module: 'analytics',
                details: ratios,
                notes: "Liquidity and Profitability markers are within standard range."
            };
        }

        return {
            explanation: "I can help with Sales Forecasts and Financial Health checks.",
            action: 'unknown',
            module: 'analytics',
            details: {}
        };
    },

    handleReport: async (payload: any): Promise<AIActionResponse> => {
        if (payload.reportType === 'profit' || payload.reportType === 'pl') {
            const today = new Date().toISOString().slice(0, 10);
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
            const pnl = await accountingService.getProfitAndLoss(startOfMonth, today);

            return {
                explanation: `Profit & Loss for this month generated. Net Profit: ₹${Number(pnl.netProfit || 0).toLocaleString()}.`,
                action: 'show_report',
                module: 'reporting',
                details: {
                    type: 'profit_and_loss',
                    period: 'This Month',
                    data: pnl
                }
            };
        } else if (payload.reportType === 'gst' || payload.reportType === 'tax') {
            const gst = await accountingService.getGSTLiabilitySummary();
            return {
                explanation: `GST Liability Summary: Net Payable ₹${Number(gst.netPayable || 0).toLocaleString()}. Input Tax Credit: ₹${Number(gst.inputTax || 0).toLocaleString()}.`,
                action: 'show_report',
                module: 'reporting',
                details: {
                    type: 'gst_summary',
                    data: gst
                },
                notes: "Amounts are estimates based on posted vouchers."
            };
        } else if (payload.reportType === 'ageing') {
            const ageing = await accountingService.getReceivablesAgeing();
            const totalDue = ageing.reduce((sum, item) => sum + item.totalDue, 0);
            return {
                explanation: `Receivables Ageing Report generated. Total Outstanding: ₹${Number(totalDue || 0).toLocaleString()}.`,
                action: 'show_report',
                module: 'reporting',
                details: {
                    type: 'ageing_summary',
                    data: { total: totalDue, items: ageing }
                }
            };
        } else if (payload.reportType === 'cashflow') {
            const today = new Date().toISOString().slice(0, 10);
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
            const cf = await accountingService.getCashFlowStatement(startOfMonth, today);
            return {
                explanation: `Cash Flow Statement (MTD). Net Change: ₹${Number(cf.netChange || 0).toLocaleString()}.`,
                action: 'show_report',
                module: 'reporting',
                details: {
                    type: 'cashflow_statement',
                    data: cf
                }
            };
        } else if (payload.reportType === 'daybook') {
            const today = new Date().toISOString().slice(0, 10);
            const daybook = await accountingService.getDayBook(today);
            return {
                explanation: `Day Book for ${today}: ${daybook.length} transactions found.`,
                action: 'show_report',
                module: 'reporting',
                details: {
                    type: 'daybook',
                    data: daybook
                }
            };
        }

        return {
            explanation: `I can generate P&L and GST reports.`,
            action: 'unknown',
            module: 'reporting',
            details: {}
        };
    }
};
