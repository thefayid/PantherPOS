import React, { useState } from 'react';
import { X, FileText, Download, Calendar } from 'lucide-react';
import { Button } from './Button';
import { gstReportService } from '../services/gstReportService';
import { exportService } from '../services/exportService';
import toast from 'react-hot-toast';

interface GSTReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ReportType = 'GSTR-1' | 'GSTR-3B';
type DateRange = 'current-month' | 'last-month' | 'current-quarter' | 'custom';

export const GSTReportModal: React.FC<GSTReportModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [reportType, setReportType] = useState<ReportType>('GSTR-1');
    const [dateRange, setDateRange] = useState<DateRange>('current-month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const getDateRange = () => {
        const today = new Date();
        const start = new Date();
        const end = new Date();

        switch (dateRange) {
            case 'current-month':
                start.setDate(1);
                break;
            case 'last-month':
                start.setMonth(start.getMonth() - 1);
                start.setDate(1);
                end.setDate(0); // Last day of prev month
                break;
            case 'current-quarter':
                const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
                start.setMonth(quarterMonth);
                start.setDate(1);
                break;
            case 'custom':
                return {
                    start: new Date(customStartDate),
                    end: new Date(customEndDate)
                };
        }
        return { start, end };
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const { start, end } = getDateRange();

            // Format dates for SQL (YYYY-MM-DD)
            const startDateStr = start.toISOString().split('T')[0];
            const endDateStr = end.toISOString().split('T')[0];
            const filename = `${reportType}_${startDateStr}_to_${endDateStr}.xlsx`;

            if (reportType === 'GSTR-1') {
                const data = await gstReportService.getGSTR1Data(startDateStr, endDateStr + ' 23:59:59');

                // Prepare sheets for Excel
                await exportService.exportToExcelMultiSheet(filename, [
                    { name: 'B2B Invoices', data: data.b2b },
                    { name: 'B2CL (Large)', data: data.b2cl },
                    { name: 'B2CS (Small)', data: data.b2cs },
                    { name: 'HSN Summary', data: data.hsn },
                    { name: 'Docs Issued', data: data.docs }
                ]);
            } else {
                const data = await gstReportService.getGSTR3BData(startDateStr, endDateStr + ' 23:59:59');

                // Flatten structural data for single sheet export
                const exportData = [
                    { Section: '3.1 Details of Outward Supplies and inward supplies liable to reverse charge', Value: '' },
                    { Section: 'Total Taxable Value', Value: data.outward_taxable.taxable_value },
                    { Section: 'Integrated Tax (IGST)', Value: data.outward_taxable.igst },
                    { Section: 'Central Tax (CGST)', Value: data.outward_taxable.cgst },
                    { Section: 'State/UT Tax (SGST)', Value: data.outward_taxable.sgst },
                    { Section: '', Value: '' },
                    { Section: '4. Eligible ITC', Value: '' },
                    { Section: 'Import of Goods', Value: 0 },
                    { Section: 'Import of Services', Value: 0 },
                    { Section: 'Inward supplies liable to reverse charge', Value: 0 },
                    { Section: 'All other ITC', Value: 0 }
                ];

                await exportService.exportToExcelMultiSheet(filename, [
                    { name: 'GSTR-3B Summary', data: exportData }
                ]);
            }

            toast.success(`${reportType} exported successfully!`);
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(`Export failed: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <FileText className="text-blue-600" size={20} />
                        GST Compliance Reports
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Report Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Report Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setReportType('GSTR-1')}
                                className={`p-3 rounded-lg border text-left transition-all ${reportType === 'GSTR-1'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                    : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'
                                    }`}
                            >
                                <div className="font-bold">GSTR-1</div>
                                <div className="text-xs opacity-70">Sales & Outward Supplies</div>
                            </button>
                            <button
                                onClick={() => setReportType('GSTR-3B')}
                                className={`p-3 rounded-lg border text-left transition-all ${reportType === 'GSTR-3B'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                    : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'
                                    }`}
                            >
                                <div className="font-bold">GSTR-3B</div>
                                <div className="text-xs opacity-70">Monthly Summary Return</div>
                            </button>
                        </div>
                    </div>

                    {/* Date Range Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Period</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as DateRange)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="current-month">Current Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="current-quarter">Current Quarter</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {dateRange === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">End Date</label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={loading || (dateRange === 'custom' && (!customStartDate || !customEndDate))}
                        className="flex items-center gap-2"
                    >
                        {loading ? 'Generating...' : (
                            <>
                                <Download size={18} />
                                Export Excel
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
