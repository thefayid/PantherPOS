import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportService = {
    generateCataloguePdf: async (filename: string, title: string, products: any[], layout: 'grid' | 'list' = 'grid') => {
        const doc = new jsPDF();

        // --- Helper: Clean Header/Footer ---
        const drawHeaderFooter = (pageNo: number) => {
            doc.setFontSize(10);
            doc.setTextColor(150);
            const dateStr = new Date().toLocaleDateString();
            doc.text(`${title} • ${dateStr}`, 14, 15);
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
                doc.text(`Rs. ${Number(p.sell_price).toLocaleString()}`, curX + (cardWidth / 2), y + cardHeight - 5, { align: 'center' });

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
                    `Rs. ${Number(p.sell_price).toLocaleString()}`,
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
            body: reportData.salesSummary.map((s: any) => [s.day, `₹${Number(s.total || 0).toLocaleString()}`, s.count, `₹${Number(s.avg_ticket || 0).toFixed(2)}`]),
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
            body: reportData.paymentSplit.map((p: any) => [p.payment_mode, `₹${Number(p.total || 0).toLocaleString()}`, p.count]),
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
            body: reportData.taxDetails.map((t: any) => [`${t.gst_rate}%`, `₹${Number(t.taxable || 0).toLocaleString()}`, `₹${Number(t.gst || 0).toLocaleString()}`, `₹${Number(t.cgst || 0).toLocaleString()}`, `₹${Number(t.sgst || 0).toLocaleString()}`]),
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
            body: reportData.productAnalysis.slice(0, 15).map((p: any) => [p.name, p.barcode, p.qty, `₹${Number(p.total || 0).toLocaleString()}`]),
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
            body: reportData.timeAnalysis.map((h: any) => [h.hour, h.count, `₹${Number(h.total || 0).toLocaleString()}`]),
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
            body: reportData.profitMargins.slice(0, 10).map((p: any) => [p.name, `₹${Number(p.revenue || 0).toLocaleString()}`, `₹${Number(p.cost || 0).toLocaleString()}`, `₹${Number(p.profit || 0).toLocaleString()}`, `${Number(p.margin_percent || 0).toFixed(1)}%`]),
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
        doc.text(`Total Amount Refunded: ₹${Number(refund.total || 0).toLocaleString()}`, 20, yPos + 5);
        yPos += 20;

        // 8. Discounts
        checkPage(40);
        doc.setFontSize(14);
        doc.text("8. Discount Summary", 14, yPos);
        yPos += 10;
        const discount = reportData.discounts[0] || { count: 0, total_discount: 0 };
        doc.setFontSize(10);
        doc.text(`Total Bills with Discount: ${discount.count}`, 20, yPos);
        doc.text(`Total Discount Value: ₹${Number(discount.total_discount || 0).toLocaleString()}`, 20, yPos + 5);
        yPos += 20;

        // 9. Customers
        checkPage(40);
        doc.setFontSize(14);
        doc.text("9. Top Customers", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Customer', 'Phone', 'Visits', 'Total Spent']],
            body: reportData.customerDetails.map((c: any) => [c.name, c.phone, c.visits, `₹${Number(c.total_spent || 0).toLocaleString()}`]),
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
            body: reportData.cashReconciliation.map((s: any) => [s.id, s.start_time.split(' ')[1], s.end_time?.split(' ')[1] || 'OPEN', `₹${s.opening_cash}`, `₹${s.closing_cash || 0}`, s.status]),
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
            body: reportData.staffPerformance.map((s: any) => [s.name, s.txn_count, `₹${Number(s.total_cash_sales || 0).toLocaleString()}`]),
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
                    `₹${Number(item.price || 0).toLocaleString()}`,
                    `${item.gst_rate}%`,
                    `₹${Number(item.gst_amount || 0).toLocaleString()}`,
                    `₹${Number(item.total || 0).toLocaleString()}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [44, 62, 80] },
                styles: { fontSize: 9 }
            });

            let finalY = (doc as any).lastAutoTable.finalY + 10;

            // Summary
            doc.setFontSize(11);
            doc.text(`Sub-Total:`, 140, finalY);
            doc.text(`₹${Number((bill.total || 0) - (bill.total_gst || 0)).toLocaleString()}`, 180, finalY, { align: 'right' });

            doc.text(`Total Tax:`, 140, finalY + 6);
            doc.text(`₹${Number(bill.total_gst || 0).toLocaleString()}`, 180, finalY + 6, { align: 'right' });

            if (bill.discount_amount > 0) {
                doc.text(`Discount:`, 140, finalY + 12);
                doc.text(`- ₹${Number(bill.discount_amount || 0).toLocaleString()}`, 180, finalY + 12, { align: 'right' });
                finalY += 6;
            }

            doc.setFontSize(14);
            doc.setTextColor(16, 185, 129);
            doc.text(`Grand Total:`, 140, finalY + 14);
            doc.text(`₹${Number(bill.total || 0).toLocaleString()}`, 180, finalY + 14, { align: 'right' });

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
