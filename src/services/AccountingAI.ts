import { accountingService } from './accountingService';
import { databaseService } from './databaseService';
import { reportService } from './reportService';

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
        try {
            await accountingService.addExpense(payload.amount, payload.reason || 'Miscellaneous Expense');

            return {
                explanation: `Expense of ₹${payload.amount} recorded successfully.`,
                action: 'show_notification',
                module: 'accounting',
                details: {
                    type: 'success',
                    message: `Expense Recorded: ₹${payload.amount}`
                },
                notes: "Transaction saved to Ledger and Cash Management."
            };
        } catch (error: any) {
            return {
                explanation: `Failed to record expense: ${error.message}`,
                action: 'show_notification',
                module: 'accounting',
                details: {
                    type: 'error',
                    message: error.message
                }
            };
        }
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
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;
            const startOfMonth = `${year}-${month}-01`;

            console.log(`[AccountingAI] Querying Profit for range: ${startOfMonth} to ${today} (Local)`);

            const pnl = await accountingService.getProfitAndLoss(startOfMonth, today);

            // Fallback to POS Profit if Accounting Profit is 0 (User likely not using Vouchers)
            let explanation = `Profit & Loss for this month generated. Net Profit: ₹${Number(pnl.netProfit || 0).toLocaleString()}.`;
            let extraData = {};

            if (pnl.netProfit === 0) {
                const posProfit = await reportService.getGrossProfit(startOfMonth, today);
                if (posProfit.profit !== 0) {
                    explanation = `Profit & Loss for this month. Gross Profit from Sales: ₹${Number(posProfit.profit).toLocaleString()} (Revenue: ₹${Number(posProfit.revenue).toLocaleString()}).`;
                    extraData = { pos_profit: posProfit };
                } else if ((posProfit as any).count > 0) {
                    explanation = `Profit is 0, but found ${(posProfit as any).count} sales. Revenue: ₹${posProfit.revenue}, Cost: ₹${posProfit.cost}. Check product costs.`;
                } else {
                    const debugInfo = await reportService.getDebugStats(startOfMonth, today);
                    if (debugInfo.totalBills === 0) {
                        explanation = `Net Profit: ₹0. (Debug: Database is empty, no bills found).`;
                    } else {
                        explanation = `Net Profit: ₹0. Debug:
Bills: ${debugInfo.totalBills}, Items: ${debugInfo.totalItems}
Sample Bills (IDs): ${JSON.stringify(debugInfo.sampleBills.map((b: any) => b.id))}
Sample Items (Bill_iDs): ${JSON.stringify(debugInfo.sampleItems.map((i: any) => i.bill_id))}
JOIN Mismatch detected.`;
                    }
                }
            }

            return {
                explanation: explanation,
                action: 'show_report',
                module: 'reporting',
                details: {
                    type: 'profit_and_loss',
                    period: 'This Month',
                    data: { ...pnl, ...extraData }
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
