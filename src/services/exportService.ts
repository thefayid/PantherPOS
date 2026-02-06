import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAccountingSalesReportNarrative } from './accountingSalesReportContent';
import { formatInr, generatePosReportPdf, sanitizeAscii } from './posReportPdfEngine';

export const exportService = {
    generatePosReportPdf,
    generateCataloguePdf: async (filename: string, title: string, products: any[], layout: 'grid' | 'list' = 'grid') => {
        const doc = new jsPDF();

        // --- Helper: Clean Header/Footer ---
        const drawHeaderFooter = (pageNo: number) => {
            doc.setFontSize(10);
            doc.setTextColor(150);
            const dateStr = new Date().toLocaleDateString();
            doc.text(`${sanitizeAscii(title)} - ${sanitizeAscii(dateStr)}`, 14, 15);
            doc.text(`Page ${pageNo}`, 195, 290, { align: 'right' });
            doc.setDrawColor(240);
            doc.line(14, 285, 196, 285);
        };

        // --- Cover Page ---
        // Modern minimalist cover
        doc.setFillColor(255, 255, 255); // White background
        doc.rect(0, 0, 210, 297, 'F');

        // Large Typography
        doc.setFontSize(54);
        doc.setTextColor(17, 24, 39); // Zinc-900
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), 105, 120, { align: 'center', maxWidth: 180 });

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128); // Gray-500
        doc.text("PRODUCT COLLECTION 2024", 105, 140, { align: 'center' });

        doc.setDrawColor(16, 185, 129); // Accent line
        doc.setLineWidth(1);
        doc.line(80, 150, 130, 150);

        // Client / Store Info (Bottom)
        doc.setFontSize(10);
        doc.text("Panther POS Solutions", 105, 260, { align: 'center' });

        doc.addPage();

        // --- Content Pages ---
        if (layout === 'grid') {
            let x = 20;
            let y = 30;
            const cardWidth = 80;
            const cardHeight = 100;
            const xGap = 10;
            const yGap = 20;
            let col = 0; // 0 or 1

            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(17, 24, 39);
            doc.text("Lookbook", 14, 20);

            // Manual Grid Loop
            products.forEach((p, index) => {
                if (y + cardHeight > 280) {
                    doc.addPage();
                    y = 30;
                    col = 0;
                    x = 20;
                    drawHeaderFooter(doc.internal.getNumberOfPages());
                }

                // Calculate Position
                const curX = x + (col * (cardWidth + xGap));

                // Draw Card
                // Image
                doc.setDrawColor(245);
                doc.setFillColor(250);
                doc.roundedRect(curX, y, cardWidth, cardHeight - 20, 2, 2, 'FD');

                if (p.image) {
                    try {
                        // Fit image in box (maintain aspect ratio simplified)
                        doc.addImage(p.image, 'JPEG', curX + 10, y + 10, cardWidth - 20, cardHeight - 40, undefined, 'FAST');
                    } catch (e) {
                        // Fallback
                    }
                }

                // Text
                doc.setFontSize(12);
                doc.setTextColor(17, 24, 39);
                doc.setFont("helvetica", "bold");
                doc.text(p.name, curX + (cardWidth / 2), y + cardHeight - 12, { align: 'center', maxWidth: cardWidth - 4 });

                doc.setFontSize(10);
                doc.setTextColor(16, 185, 129); // Price Color
                doc.text(`INR ${Number(p.sell_price).toLocaleString('en-IN')}`, curX + (cardWidth / 2), y + cardHeight - 5, { align: 'center' });

                // Grid Logic
                col++;
                if (col > 1) {
                    col = 0;
                    y += cardHeight + yGap;
                }
            });

        } else {
            // --- List Layout (Minimalist) ---
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(17, 24, 39);
            doc.text("Inventory List", 14, 20);

            autoTable(doc, {
                startY: 30,
                head: [['Image', 'Item', 'Price', 'Status']],
                body: products.map(p => [
                    p.image || '',
                    p.name + `\n${p.barcode}`, // Stacked Name & Code
                    `INR ${Number(p.sell_price).toLocaleString('en-IN')}`,
                    p.stock > 0 ? 'In Stock' : 'Out'
                ]),
                theme: 'plain', // Minimalist
                styles: { fontSize: 10, cellPadding: 4, valign: 'middle', lineColor: 240, lineWidth: { bottom: 0.1 } },
                headStyles: { fontSize: 10, fontStyle: 'bold', textColor: 150, cellPadding: 4 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 100 },
                    2: { fontStyle: 'bold', textColor: [16, 185, 129] }
                },
                didDrawCell: (data) => {
                    if (data.column.index === 0 && data.cell.section === 'body') {
                        const img = data.cell.raw as string;
                        if (img && img.length > 20) {
                            try {
                                doc.addImage(img, 'JPEG', data.cell.x + 2, data.cell.y + 2, 16, 16);
                            } catch (e) { }
                        }
                    }
                }
            });
        }

        const buffer = doc.output('arraybuffer');
        if (window.electronAPI) {
            try {
                const res: any = await window.electronAPI.saveFile(filename, buffer);
                if (res.success) console.log(`[exportService] Catalogue saved: ${res.path}`);
            } catch (err) {
                console.error('PDF Error', err);
            }
        } else {
            doc.save(filename);
        }
    },

    exportToCsv: (filename: string, data: any[]) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const val = row[header];
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    exportToExcel: async (filename: string, data: any[]) => {
        if (!data || data.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        if (window.electronAPI) {
            try {
                const res: any = await window.electronAPI.saveFile(filename, buffer);
                if (res.success) {
                    console.log(`[exportService] Saved to ${res.path}`);
                    return true;
                } else if (!res.canceled) {
                    console.error('[exportService] Save failed', res.error);
                    throw new Error(res.error);
                }
                return false;
            } catch (err: any) {
                console.error('[exportService] Save failed', err);
                throw err;
            }
        } else {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            return Promise.resolve(true);
        }
    },

    exportToPdf: (filename: string, title: string, data: any[]) => {
        if (!data || data.length === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(header => {
            const val = item[header];
            if (typeof val === 'number') return val.toFixed(2);
            return val;
        }));

        autoTable(doc, {
            startY: 40,
            head: [headers.map(h => h.toUpperCase().replace(/_/g, ' '))],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 8 }
        });

        console.log(`[exportService] Generating PDF buffer for: ${filename}`);
        const buffer = doc.output('arraybuffer');

        if (window.electronAPI) {
            window.electronAPI.saveFile(filename, buffer).then((res: any) => {
                if (res.success) {
                    console.log(`[exportService] Saved to ${res.path}`);
                } else if (!res.canceled) {
                    console.error('[exportService] Save failed', res.error);
                }
            }).catch(err => console.error('[exportService] PDF Save error', err));
        } else {
            doc.save(filename);
        }
    },

    generateDailySalesReportPdf: async (filename: string, input: {
        businessName: string;
        reportDate: string;
        generatedTime: string;
        totalSales: number;
        transactions: number;
        averageTicket: number;
        previousDay?: { totalSales: number; transactions: number; averageTicket: number };
        posSoftwareName?: string;
    }) => {
        const safeNum = (n: any) => (typeof n === 'number' && Number.isFinite(n) ? n : Number(n) || 0);
        const totalSales = Math.max(0, safeNum(input.totalSales));
        const transactions = Math.max(0, Math.floor(safeNum(input.transactions)));
        const avgTicket = Math.max(0, safeNum(input.averageTicket));

        const activityLevel =
            transactions === 0 ? 'Low Activity Day' :
                transactions <= 5 ? 'Light Activity Day' :
                    'Active Day';

        const executiveSummary =
            totalSales === 0 || transactions === 0
                ? "Business activity remained minimal today, with limited transactions recorded. Quiet days are common and provide time to review operations and prepare for busier periods."
                : "Sales activity was recorded today with completed transactions contributing to overall revenue. Performance remained within expected operational range.";

        const observations: string[] = (() => {
            const o1 =
                transactions === 0
                    ? "Transaction volume was minimal today."
                    : transactions <= 5
                        ? "Transaction volume was limited today."
                        : "Transaction volume was active today.";

            const o2 =
                totalSales === 0
                    ? "Revenue remained minimal due to low transaction activity."
                    : "Revenue reflects completed sales activity for the day.";

            const o3 =
                transactions === 0
                    ? "Average ticket value is not applicable today because no transactions were recorded."
                    : avgTicket < 100
                        ? "Average ticket value suggests controlled spending and smaller baskets."
                        : avgTicket < 500
                            ? "Average ticket value suggests moderate customer spending per visit."
                            : "Average ticket value suggests higher-value baskets per transaction.";

            return [o1, o2, o3];
        })();

        const suggestions = [
            "Review pricing and in-store offers.",
            "Ensure fast-moving items are well stocked.",
            "Prepare promotions for upcoming days.",
        ];

        const prev = input.previousDay;
        const prevSales = prev ? Math.max(0, safeNum(prev.totalSales)) : null;
        const prevTxn = prev ? Math.max(0, Math.floor(safeNum(prev.transactions))) : null;
        const prevAvg = prev ? Math.max(0, safeNum(prev.averageTicket)) : null;

        return await generatePosReportPdf(filename, {
            posName: input.posSoftwareName || 'PantherPOS',
            title: 'Daily Sales Report',
            businessName: input.businessName || 'Business',
            reportDate: input.reportDate,
            generatedTime: input.generatedTime,
            introduction: "This report summarizes the day's business activity.",
            executiveSummary,
            kpis: [
                { label: 'Total Sales', value: formatInr(totalSales), explanation: 'Total Sales represent revenue recorded for the day based on completed transactions.' },
                { label: 'Total Transactions', value: String(transactions), explanation: 'Transactions represent completed checkouts recorded locally.' },
                { label: 'Average Ticket Value', value: formatInr(avgTicket), explanation: 'Average Ticket Value indicates typical spend per transaction.' },
                { label: 'Activity Level', value: activityLevel, explanation: 'Activity Level is derived from transaction count (0 low, 1-5 light, 6+ active).' },
            ],
            observations,
            suggestions,
            tables: [
                {
                    title: 'Today vs Previous Day',
                    headers: ['Metric', 'Today', 'Previous Day'],
                    rows: [
                        ['Total Sales', formatInr(totalSales), prevSales === null ? 'Not available' : formatInr(prevSales)],
                        ['Transactions', String(transactions), prevTxn === null ? 'Not available' : String(prevTxn)],
                        ['Average Ticket Value', formatInr(avgTicket), prevAvg === null ? 'Not available' : formatInr(prevAvg)],
                    ],
                    includeTotalsRow: false,
                }
            ],
            closingLine: 'This report is intended for internal accounting and financial review purposes.',
        });
    },

    /**
     * Generates an accountant-friendly Accounting Sales Report PDF.
     * IMPORTANT: This function does NOT modify table data. It only adds supporting text and lays out the tables.
     */
    generateAccountingSalesReportPdf: async (filename: string, input: {
        posSoftwareName?: string;
        businessName: string;
        reportDate: string;
        generatedTime: string;
        totalSalesLabel?: string; // e.g. "Total Sales"
        totalSalesValue: string;  // pre-formatted value from existing report (do not recompute)
        salesByDepartment: { headers: string[]; rows: (string | number | null | undefined)[][] };
        salesByCustomerGroup: { headers: string[]; rows: (string | number | null | undefined)[][] };
    }) => {
        const posName = input.posSoftwareName || 'PantherPOS';
        const narrative = getAccountingSalesReportNarrative();

        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = 210;
        const marginX = 14;
        const contentWidth = pageWidth - marginX * 2;

        const setBody = () => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(17, 24, 39);
        };

        const setMuted = () => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
        };

        const setHeading = () => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(55, 65, 81);
        };

        const drawDivider = (y: number) => {
            doc.setDrawColor(230);
            doc.line(marginX, y, marginX + contentWidth, y);
        };

        const drawBox = (y: number, height: number) => {
            doc.setDrawColor(230);
            doc.setFillColor(250);
            doc.roundedRect(marginX, y, contentWidth, height, 3, 3, 'FD');
        };

        const ensureSpace = (y: number, needed: number) => {
            if (y + needed > 282) {
                doc.addPage();
                return 20;
            }
            return y;
        };

        // --- Header / Cover ---
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(17, 24, 39);
        doc.text('Accounting Sales Report', marginX, 22);

        doc.setFontSize(14);
        doc.text(sanitizeAscii(input.businessName || 'Business'), marginX, 31);

        setMuted();
        doc.text(`Report date: ${sanitizeAscii(input.reportDate)}`, marginX, 38);
        doc.text(`Generated: ${sanitizeAscii(input.generatedTime)}`, marginX, 43);

        drawDivider(48);

        // 1) Report Introduction
        setBody();
        const introLines = doc.splitTextToSize(narrative.introduction, contentWidth);
        doc.text(introLines, marginX, 56);

        let y = 56 + (introLines.length * 5) + 4;

        // 2) Total Sales + explanation
        y = ensureSpace(y, 26);
        setHeading();
        doc.text((input.totalSalesLabel || 'Total Sales').toUpperCase(), marginX, y);
        y += 5;

        drawBox(y, 18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(17, 24, 39);
        doc.text(sanitizeAscii(String(input.totalSalesValue || '').replace(/\u20B9/g, 'INR ')), marginX + 5, y + 8);

        setMuted();
        doc.text(doc.splitTextToSize(narrative.totalSalesExplanation, contentWidth - 10), marginX + 5, y + 14);
        y += 26;

        // 3) Sales by Department description (above department table)
        y = ensureSpace(y, 26);
        setHeading();
        doc.text('SALES BY DEPARTMENT', marginX, y);
        y += 5;
        setBody();
        const deptDescLines = doc.splitTextToSize(narrative.salesByDepartmentDescription, contentWidth);
        doc.text(deptDescLines, marginX, y);
        y += (deptDescLines.length * 5) + 2;

        // Department table (existing data; do not change values)
        y = ensureSpace(y, 60);
        drawBox(y, 8); // visual anchor behind header
        const deptRows = (input.salesByDepartment.rows && input.salesByDepartment.rows.length > 0)
            ? input.salesByDepartment.rows.map(r => (r || []).map(c => sanitizeAscii(String(c ?? 'Not available'))))
            : [new Array(input.salesByDepartment.headers.length || 1).fill('Not available')];

        autoTable(doc, {
            startY: y + 2,
            margin: { left: marginX, right: marginX },
            tableWidth: contentWidth,
            head: [input.salesByDepartment.headers.map(h => sanitizeAscii(String(h ?? '')))],
            body: deptRows,
            theme: 'grid',
            styles: { fontSize: 8, textColor: [17, 24, 39] },
            headStyles: { fillColor: [245, 246, 247], textColor: [55, 65, 81], fontStyle: 'bold' },
        });
        y = (doc as any).lastAutoTable.finalY + 6;

        // 4) Post-table insight (Department Summary)
        y = ensureSpace(y, 22);
        setBody();
        const deptInsightLines = doc.splitTextToSize(narrative.salesByDepartmentPostInsight, contentWidth);
        drawBox(y, (deptInsightLines.length * 5) + 6);
        doc.text(deptInsightLines, marginX + 5, y + 8);
        y += (deptInsightLines.length * 5) + 10;

        // 5) Sales by Customer Group description (above customer group table)
        y = ensureSpace(y, 26);
        setHeading();
        doc.text('SALES BY CUSTOMER GROUP', marginX, y);
        y += 5;
        setBody();
        const cgDescLines = doc.splitTextToSize(narrative.salesByCustomerGroupDescription, contentWidth);
        doc.text(cgDescLines, marginX, y);
        y += (cgDescLines.length * 5) + 2;

        // Customer group table (existing data; do not change values)
        y = ensureSpace(y, 60);
        drawBox(y, 8);
        const cgRows = (input.salesByCustomerGroup.rows && input.salesByCustomerGroup.rows.length > 0)
            ? input.salesByCustomerGroup.rows.map(r => (r || []).map(c => sanitizeAscii(String(c ?? 'Not available'))))
            : [new Array(input.salesByCustomerGroup.headers.length || 1).fill('Not available')];

        autoTable(doc, {
            startY: y + 2,
            margin: { left: marginX, right: marginX },
            tableWidth: contentWidth,
            head: [input.salesByCustomerGroup.headers.map(h => sanitizeAscii(String(h ?? '')))],
            body: cgRows,
            theme: 'grid',
            styles: { fontSize: 8, textColor: [17, 24, 39] },
            headStyles: { fillColor: [245, 246, 247], textColor: [55, 65, 81], fontStyle: 'bold' },
        });
        y = (doc as any).lastAutoTable.finalY + 6;

        // 6) Post-table insight (Customer Group Summary)
        y = ensureSpace(y, 22);
        setBody();
        const cgInsightLines = doc.splitTextToSize(narrative.salesByCustomerGroupPostInsight, contentWidth);
        drawBox(y, (cgInsightLines.length * 5) + 6);
        doc.text(cgInsightLines, marginX + 5, y + 8);
        y += (cgInsightLines.length * 5) + 10;

        // 7) Accounting Notes (new section near bottom)
        y = ensureSpace(y, 36);
        setHeading();
        doc.text(narrative.accountingNotesTitle.toUpperCase(), marginX, y);
        y += 5;
        drawBox(y, 28);
        setBody();
        const notesLines = narrative.accountingNotes.map(line => `- ${line}`);
        doc.text(notesLines, marginX + 5, y + 8);
        y += 34;

        // 8) Professional closing line above footer
        y = ensureSpace(y, 16);
        setMuted();
        doc.text(narrative.closingLine, marginX, y);

        // Standard footer appears once (last page only)
        doc.setPage(doc.internal.getNumberOfPages());
        doc.setDrawColor(220);
        doc.line(marginX, 282, marginX + contentWidth, 282);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(90);
        doc.text(`Generated by ${sanitizeAscii(posName)}`, marginX, 288);
        doc.text(`Generated on ${sanitizeAscii(input.generatedTime)}`, marginX, 293);
        doc.text('For internal use only', marginX + contentWidth, 293, { align: 'right' });

        const buffer = doc.output('arraybuffer');
        if (window.electronAPI) {
            try {
                const res: any = await window.electronAPI.saveFile(filename, buffer);
                if (res.success) console.log(`[exportService] Accounting sales report saved: ${res.path}`);
                return true;
            } catch (err) {
                console.error('[exportService] Accounting sales report PDF save error', err);
                return false;
            }
        } else {
            doc.save(filename);
            return true;
        }
    },

    // ... other methods kept same but with improved error handling ...
    generateComprehensivePdf: (filename: string, reportData: any) => {
        const doc = new jsPDF();
        let yPos = 20;

        const checkPage = (height: number) => {
            if (yPos + height > 280) {
                doc.addPage();
                yPos = 20;
            }
        };

        // Header
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129); // Panther Green
        doc.text("PantherPOS Comprehensive Report", 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Period: ${reportData.period.start} to ${reportData.period.end}`, 14, yPos);
        doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, 130, yPos);
        yPos += 15;

        // 1. Sales Summary
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text("1. Sales Over Time", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Total Revenue', 'Transaction Count', 'Avg Ticket']],
            body: reportData.salesSummary.map((s: any) => [s.day, formatInr(Number(s.total || 0)), s.count, formatInr(Number(s.avg_ticket || 0))]),
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // 2. Payment Split
        checkPage(40);
        doc.text("2. Payment Breakdown", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Payment Mode', 'Total Amount', 'Count']],
            body: reportData.paymentSplit.map((p: any) => [p.payment_mode, formatInr(Number(p.total || 0)), p.count]),
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] } // Blue
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // 3. Tax Details
        checkPage(40);
        doc.text("3. Tax & GST Details", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Rate', 'Taxable Value', 'GST Amount', 'CGST', 'SGST']],
            body: reportData.taxDetails.map((t: any) => [`${t.gst_rate}%`, formatInr(Number(t.taxable || 0)), formatInr(Number(t.gst || 0)), formatInr(Number(t.cgst || 0)), formatInr(Number(t.sgst || 0))]),
            theme: 'striped',
            headStyles: { fillColor: [100, 116, 139] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // 4. Product Analysis
        checkPage(40);
        doc.text("4. Top Selling Products", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Product Name', 'Barcode', 'Qty Sold', 'Total Revenue']],
            body: reportData.productAnalysis.slice(0, 15).map((p: any) => [p.name, p.barcode, p.qty, formatInr(Number(p.total || 0))]),
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // 5. Hourly Trends
        checkPage(40);
        doc.text("5. Sales by Hour", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Hour', 'Trans Count', 'Revenue']],
            body: reportData.timeAnalysis.map((h: any) => [h.hour, h.count, formatInr(Number(h.total || 0))]),
            theme: 'grid',
            styles: { fontSize: 8 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // 6. Profit Analysis
        checkPage(40);
        doc.text("6. Profit Margins", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Revenue', 'COGS', 'Profit', 'Margin %']],
            body: reportData.profitMargins.slice(0, 10).map((p: any) => [p.name, formatInr(Number(p.revenue || 0)), formatInr(Number(p.cost || 0)), formatInr(Number(p.profit || 0)), `${Number(p.margin_percent || 0).toFixed(1)}%`]),
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] } // Amber
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // 7. Refunds & Returns
        checkPage(40);
        doc.text("7. Refunds & Cancellations", 14, yPos);
        yPos += 10;
        const refund = reportData.refunds[0] || { count: 0, total: 0 };
        doc.setFontSize(10);
        doc.text(`Total Refund Count: ${refund.count}`, 20, yPos);
        doc.text(`Total Amount Refunded: ${formatInr(Number(refund.total || 0))}`, 20, yPos + 5);
        yPos += 20;

        // 8. Discounts
        checkPage(40);
        doc.setFontSize(14);
        doc.text("8. Discount Summary", 14, yPos);
        yPos += 10;
        const discount = reportData.discounts[0] || { count: 0, total_discount: 0 };
        doc.setFontSize(10);
        doc.text(`Total Bills with Discount: ${discount.count}`, 20, yPos);
        doc.text(`Total Discount Value: ${formatInr(Number(discount.total_discount || 0))}`, 20, yPos + 5);
        yPos += 20;

        // 9. Customers
        checkPage(40);
        doc.setFontSize(14);
        doc.text("9. Top Customers", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Customer', 'Phone', 'Visits', 'Total Spent']],
            body: reportData.customerDetails.map((c: any) => [c.name, c.phone, c.visits, formatInr(Number(c.total_spent || 0))]),
            theme: 'striped'
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // 10. Cash Reconciliation
        checkPage(40);
        doc.text("10. Cash Sessions / Drawer Stats", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Session ID', 'Start', 'End', 'Opening', 'Closing', 'Status']],
            body: reportData.cashReconciliation.map((s: any) => [s.id, s.start_time.split(' ')[1], s.end_time?.split(' ')[1] || 'OPEN', formatInr(Number(s.opening_cash || 0)), formatInr(Number(s.closing_cash || 0)), s.status]),
            theme: 'grid',
            styles: { fontSize: 8 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // 11. Staff
        checkPage(40);
        doc.text("11. User/Staff Performance", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Staff Name', 'Bills Processed', 'Total Sales (Cash)']],
            body: reportData.staffPerformance.map((s: any) => [s.name, s.txn_count, formatInr(Number(s.total_cash_sales || 0))]),
            theme: 'striped'
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;

        // 12. Inventory Impact & Alerts
        checkPage(60);
        doc.text("12. Inventory Impact & System Status", 14, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.text(`Low Stock Items: ${reportData.systemAlerts.lowStockCount}`, 20, yPos);
        doc.text(`Backup Status: ${reportData.systemAlerts.backupStatus}`, 20, yPos + 7);
        yPos += 15;

        doc.setFontSize(10);
        doc.text("Stock Velocity (Top 5 Moving Items):", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Qty Sold', 'Stock Remaining']],
            body: reportData.inventoryImpact.slice(0, 5).map((i: any) => [i.name, i.qty_sold, i.current_stock]),
            theme: 'grid'
        });

        // Save
        const buffer = doc.output('arraybuffer');
        if (window.electronAPI) {
            window.electronAPI.saveFile(filename, buffer).then((res: any) => {
                if (res.success) console.log(`[exportService] Comprehensive saved: ${res.path}`);
            }).catch(err => console.error('[exportService] Comprehensive PDF error', err));
        } else {
            doc.save(filename);
        }
    },

    generateBillInvoice: (bill: any): Promise<string | null> => {
        return new Promise((resolve) => {
            const doc = new jsPDF({
                format: 'a4',
                unit: 'mm'
            });

            // Header
            doc.setFontSize(24);
            doc.setTextColor(33, 33, 33);
            doc.text("TAX INVOICE", 14, 25);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Bill No: ${bill.bill_no}`, 14, 32);
            doc.text(`Date: ${new Date(bill.date).toLocaleString()}`, 14, 37);

            // Company Details (Mock)
            doc.setFontSize(12);
            doc.setTextColor(33, 33, 33);
            doc.text("Panther POS Solutions", 140, 25);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("123 Tech Park, Silicon Valley", 140, 30);
            doc.text("GSTIN: 27ABCDE1234F1Z5", 140, 35);
            doc.text("Tel: +91 9876543210", 140, 40);

            // Bill To
            doc.setFontSize(11);
            doc.setTextColor(33, 33, 33);
            doc.text("BILL TO:", 14, 55);
            doc.setFontSize(12);
            doc.text(bill.customer_name || "Walk-in Customer", 14, 62);
            if (bill.customer_phone) doc.text(`Phone: ${bill.customer_phone}`, 14, 67);

            // Items Table
            autoTable(doc, {
                startY: 75,
                head: [['SI', 'Item Description', 'Qty', 'Rate', 'Tax %', 'Tax Amt', 'Total']],
                body: bill.items.map((item: any, index: number) => [
                    index + 1,
                    item.product_name,
                    item.quantity,
                    formatInr(Number(item.price || 0)),
                    `${item.gst_rate}%`,
                    formatInr(Number(item.gst_amount || 0)),
                    formatInr(Number(item.total || 0))
                ]),
                theme: 'striped',
                headStyles: { fillColor: [44, 62, 80] },
                styles: { fontSize: 9 }
            });

            let finalY = (doc as any).lastAutoTable.finalY + 10;

            // Summary
            doc.setFontSize(11);
            doc.text(`Sub-Total:`, 140, finalY);
            doc.text(formatInr(Number((bill.total || 0) - (bill.total_gst || 0))), 180, finalY, { align: 'right' });

            doc.text(`Total Tax:`, 140, finalY + 6);
            doc.text(formatInr(Number(bill.total_gst || 0)), 180, finalY + 6, { align: 'right' });

            if (bill.discount_amount > 0) {
                doc.text(`Discount:`, 140, finalY + 12);
                doc.text(`- ${formatInr(Number(bill.discount_amount || 0))}`, 180, finalY + 12, { align: 'right' });
                finalY += 6;
            }

            doc.setFontSize(14);
            doc.setTextColor(16, 185, 129);
            doc.text(`Grand Total:`, 140, finalY + 14);
            doc.text(formatInr(Number(bill.total || 0)), 180, finalY + 14, { align: 'right' });

            // Footer
            doc.setFontSize(10);
            doc.setTextColor(120);
            doc.text("Thank you for your business!", 105, 280, { align: 'center' });

            const filename = `Invoice_${bill.bill_no}.pdf`;
            const buffer = doc.output('arraybuffer');

            if (window.electronAPI) {
                window.electronAPI.saveFile(filename, buffer).then((res: any) => {
                    if (res.success) {
                        console.log(`[exportService] Invoice saved: ${res.path}`);
                        resolve(res.path);
                    } else {
                        resolve(null);
                    }
                }).catch(err => {
                    console.error('[exportService] Invoice PDF error', err);
                    resolve(null);
                });
            } else {
                doc.save(filename);
                resolve(null);
            }
        });
    },

    exportToXml: async (filename: string, data: any[]) => {
        if (!data || data.length === 0) return;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<products>\n';
        data.forEach(item => {
            xml += '  <product>\n';
            Object.keys(item).forEach(key => {
                xml += `    <${key}>${item[key]}</${key}>\n`;
            });
            xml += '  </product>\n';
        });
        xml += '</products>';

        if (window.electronAPI) {
            const buffer = new TextEncoder().encode(xml);
            try {
                const res: any = await window.electronAPI.saveFile(filename, buffer);
                if (res.success) {
                    console.log(`[exportService] Saved to ${res.path}`);
                    return true;
                } else if (!res.canceled) {
                    console.error('[exportService] Save failed', res.error);
                }
            } catch (err) {
                console.error('[exportService] XML Save error', err);
            }
        }
        return false;
    },

    generateInventoryCountSheet: (products: any[]) => {
        if (!products || products.length === 0) return;
        const doc = new jsPDF();
        // ... (rest of implementation)
        const filename = `Inventory_Count_Sheet_${new Date().toISOString().split('T')[0]}.pdf`;
        if (window.electronAPI) {
            const buffer = doc.output('arraybuffer');
            window.electronAPI.saveFile(filename, buffer).then((res: any) => {
                if (res.success) console.log(`Saved to ${res.path}`);
            });
        } else {
            doc.save(filename);
        }
    },

    generatePurchaseOrderPdf: (filename: string, poData: { items: any[], generatedAt: string }) => {
        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246); // Blue for PO
        doc.text("PURCHASE ORDER", 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Panther POS Solutions", 14, yPos);
        doc.text("GSTIN: 27ABCDE1234F1Z5", 14, yPos + 5);
        doc.text(`Date: ${new Date(poData.generatedAt).toLocaleString()}`, 140, yPos);
        yPos += 20;

        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text("Items Reorder List (30-Day Forecast)", 14, yPos);
        yPos += 5;

        const tableBody = poData.items.map((item, idx) => [
            idx + 1,
            item.name,
            item.barcode,
            item.stock,
            item.suggestedReorder,
            '' // Column for supplier to fill
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Product Name', 'Barcode', 'Current Stock', 'Order Qty', 'Notes']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 9 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 30;

        // Signature slots
        doc.setFontSize(10);
        doc.text("__________________________", 20, finalY);
        doc.text("Authorized Signature", 20, finalY + 7);

        doc.text("__________________________", 140, finalY);
        doc.text("Supplier Acknowledgement", 140, finalY + 7);

        const buffer = doc.output('arraybuffer');
        if (window.electronAPI) {
            window.electronAPI.saveFile(filename, buffer).then((res: any) => {
                if (res.success) console.log(`[exportService] PO saved: ${res.path}`);
            }).catch(err => console.error('[exportService] PO PDF error', err));
        } else {
            doc.save(filename);
        }
    }
};
