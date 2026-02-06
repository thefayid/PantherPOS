import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type PosReportType =
  | 'Daily Sales Report'
  | 'Accounting Sales Report'
  | 'Sales by Department'
  | 'Sales by Customer Group'
  | 'Payment Summary Report'
  | 'Tax / GST Report'
  | 'Inventory Summary'
  | 'Shift / Cashier Report';

export interface PosTable {
  title?: string;
  headers: string[];
  rows: unknown[][];
  // Optional: if provided, a totals row will be appended deterministically.
  includeTotalsRow?: boolean;
}

export interface PosReportPdfInput {
  posName: string;
  title: string;
  businessName: string;
  reportDate: string; // local date string
  generatedTime: string; // local date-time string
  // Tables already computed elsewhere (engine must not change values; only sanitize formatting)
  tables: PosTable[];

  // Optional KPI block (used for Daily Sales / Accounting)
  kpis?: { label: string; value: string; explanation?: string }[];
  introduction?: string;
  executiveSummary?: string;
  observations?: string[];
  suggestions?: string[];
  notes?: { title: string; lines: string[] };
  closingLine?: string;
}

// ----------------------------
// Sanitization & validation
// ----------------------------

export function sanitizeAscii(input: string): string {
  // Replace common unicode punctuation with ASCII equivalents
  const replaced = input
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '-') // bullet
    .replace(/\u00A0/g, ' ')
    .replace(/\u20B9/g, 'INR ') // rupee sign
    .replace(/\bRs\.\s*/gi, 'INR ');

  // Remove emojis / non-ascii characters deterministically
  // Keep newline + tab. Replace remaining non-ascii with space.
  return replaced.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ').replace(/[ ]{2,}/g, ' ').trimEnd();
}

export function formatInr(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const fixed = n.toFixed(2);
  // Use ASCII grouping
  const parts = fixed.split('.');
  const intPart = Number(parts[0]).toLocaleString('en-IN');
  return `INR ${intPart}.${parts[1] || '00'}`;
}

export function detectReportType(title: string, tables: PosTable[]): PosReportType {
  const t = (title || '').toLowerCase();
  const headers = tables.flatMap(tb => tb.headers.map(h => String(h).toLowerCase()));

  const has = (s: string) => t.includes(s);
  const headerHas = (s: string) => headers.some(h => h.includes(s));

  if (has('accounting') || headerHas('gross') || headerHas('net') || headerHas('refund') || headerHas('discount') || headerHas('tax') || headerHas('cost')) {
    return 'Accounting Sales Report';
  }
  if (has('daily') || (headerHas('transactions') && (headerHas('avg') || headerHas('average')))) {
    return 'Daily Sales Report';
  }
  if (headerHas('department') || headerHas('category')) return 'Sales by Department';
  if (headerHas('customer group') || headerHas('customer type')) return 'Sales by Customer Group';
  if (headerHas('payment') || headerHas('method') || headerHas('mode')) return 'Payment Summary Report';
  if (headerHas('gst') || headerHas('hsn') || headerHas('tax')) return 'Tax / GST Report';
  if (headerHas('stock') || headerHas('inventory') || headerHas('sku')) return 'Inventory Summary';
  if (headerHas('cashier') || headerHas('shift') || headerHas('register') || headerHas('drawer')) return 'Shift / Cashier Report';

  // Default conservative choice
  return 'Daily Sales Report';
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return 'Not available';
  if (typeof value === 'number' && Number.isFinite(value)) return sanitizeAscii(String(value));
  const s = sanitizeAscii(String(value));
  return s.length === 0 ? 'Not available' : s;
}

function normalizeTable(headers: string[], rows: unknown[][], includeTotalsRow: boolean): { headers: string[]; rows: string[][] } {
  const safeHeaders = headers.map(h => sanitizeAscii(String(h || '')));
  const safeRows = rows.map(r => (r || []).map(normalizeCell));

  // Ensure rectangular
  const width = safeHeaders.length || Math.max(0, ...safeRows.map(r => r.length));
  const paddedRows = safeRows.map(r => {
    const out = [...r];
    while (out.length < width) out.push('Not available');
    return out.slice(0, width);
  });

  let finalRows = paddedRows;

  // Totals row (deterministic): sum numeric-looking cells per column.
  if (includeTotalsRow && finalRows.length > 0 && width > 1) {
    const sums: (number | null)[] = new Array(width).fill(null);
    for (let c = 0; c < width; c++) {
      let seenNumeric = 0;
      let sum = 0;
      for (const row of finalRows) {
        const raw = row[c];
        const normalized = raw.replace(/INR\s*/g, '').replace(/,/g, '').trim();
        const n = Number(normalized);
        if (Number.isFinite(n)) {
          seenNumeric++;
          sum += n;
        }
      }
      sums[c] = seenNumeric > 0 ? sum : null;
    }
    const totalsRow: string[] = new Array(width).fill('Not available');
    totalsRow[0] = 'Totals';
    for (let c = 1; c < width; c++) {
      totalsRow[c] = sums[c] === null ? 'Not available' : sanitizeAscii(String(sums[c]!.toFixed(2)));
    }
    finalRows = [...finalRows, totalsRow];
  }

  // If no rows, add a deterministic placeholder row (no empty cells)
  if (finalRows.length === 0) {
    finalRows = [new Array(width || 1).fill('Not available')];
  }

  return { headers: safeHeaders.length ? safeHeaders : new Array(width).fill('Not available'), rows: finalRows };
}

function getColumnDefinition(reportType: PosReportType, header: string): string {
  const h = sanitizeAscii(header).toLowerCase().replace(/\s+/g, ' ').trim();

  const common: Record<string, string> = {
    date: 'Local business date associated with the transaction or entry.',
    day: 'Local business date associated with the transaction or entry.',
    timestamp: 'Local date and time recorded for the transaction or entry.',
    hour: 'Time block used for grouping sales activity.',
    'time block': 'Time block used for grouping sales activity.',
    transactions: 'Number of completed transactions recorded locally.',
    'txn count': 'Number of completed transactions recorded locally.',
    count: 'Number of records included in this row.',
    qty: 'Quantity of items included in this row.',
    units: 'Quantity of items included in this row.',
    revenue: 'Sales value recorded for the grouping shown in the row.',
    total: 'Total value recorded for the grouping shown in the row.',
    amount: 'Monetary value recorded for the grouping shown in the row.',
    taxable: 'Taxable value used for tax calculation.',
    'taxable value': 'Taxable value used for tax calculation.',
    gst: 'GST amount calculated based on configured tax rules.',
    'total gst': 'GST amount calculated based on configured tax rules.',
    cgst: 'CGST amount calculated based on configured tax rules.',
    sgst: 'SGST amount calculated based on configured tax rules.',
    'gst rate': 'GST rate applied to taxable value for calculation.',
    slab: 'Tax slab or rate category used for grouping.',
    hsn: 'HSN code used for product tax classification.',
    'hsn report': 'HSN code used for product tax classification.',
    stock: 'Current stock level recorded locally.',
    'in stock': 'Current stock level recorded locally.',
    'min level': 'Minimum stock threshold used for low stock alerts.',
    'min stock level': 'Minimum stock threshold used for low stock alerts.',
    method: 'Payment method used to settle the sale (cash, card, UPI, etc.).',
    'payment mode': 'Payment method used to settle the sale (cash, card, UPI, etc.).',
    'payment method': 'Payment method used to settle the sale (cash, card, UPI, etc.).',
    department: 'Department or category used to group products for reporting.',
    category: 'Department or category used to group products for reporting.',
    customer: 'Customer name or identifier associated with the transaction.',
    'customer group': 'Customer segment used for grouping sales (walk-in, registered, wholesale, etc.).',
    type: 'Transaction or entry classification used by the system (sale, refund, etc.).',
    status: 'Operational status recorded for the transaction or entry.',
    profit: 'Profit value derived from revenue and cost values in the report table.',
    cost: 'Cost value used for margin and profitability review.',
    margin: 'Margin percentage derived from revenue and cost values.',
  };

  // Exact match first
  if (common[h]) return common[h];

  // Partial matches
  const key = Object.keys(common).find(k => h.includes(k));
  if (key) return common[key];

  // Type-aware fallback
  if (reportType === 'Payment Summary Report') return 'Value recorded for this payment column in the report table.';
  if (reportType === 'Tax / GST Report') return 'Value recorded for this tax column in the report table.';
  if (reportType === 'Inventory Summary') return 'Value recorded for this inventory column in the report table.';
  if (reportType === 'Shift / Cashier Report') return 'Value recorded for this shift column in the report table.';
  return 'Value recorded for this column in the report table.';
}

function shouldRenderColumnDefinitions(reportType: PosReportType): boolean {
  return (
    reportType === 'Payment Summary Report' ||
    reportType === 'Tax / GST Report' ||
    reportType === 'Inventory Summary' ||
    reportType === 'Shift / Cashier Report'
  );
}

function drawFooterOnce(doc: jsPDF, posName: string, generatedTime: string) {
  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  doc.setDrawColor(220);
  doc.line(marginX, 282, marginX + contentWidth, 282);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(`Generated by ${sanitizeAscii(posName)}`, marginX, 288);
  doc.text(`Generated on ${sanitizeAscii(generatedTime)}`, marginX, 293);
  doc.text('For internal use only', marginX + contentWidth, 293, { align: 'right' });
}

// ----------------------------
// Main engine
// ----------------------------

export async function generatePosReportPdf(filename: string, input: PosReportPdfInput): Promise<boolean> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  const reportType = detectReportType(input.title, input.tables || []);

  const title = sanitizeAscii(input.title || reportType);
  const businessName = sanitizeAscii(input.businessName || 'Business');
  const reportDate = sanitizeAscii(input.reportDate || '');
  const generatedTime = sanitizeAscii(input.generatedTime || '');

  // Ensure there is always at least one table (tables > graphics rule).
  if (!input.tables || input.tables.length === 0) {
    if (input.kpis && input.kpis.length > 0) {
      input.tables = [
        {
          title: 'Summary Table',
          headers: ['Metric', 'Value'],
          rows: input.kpis.map(k => [k.label, k.value]),
          includeTotalsRow: false,
        },
      ];
    } else {
      input.tables = [
        {
          title: 'Summary Table',
          headers: ['Field', 'Value'],
          rows: [['Not available', 'Not available']],
          includeTotalsRow: false,
        },
      ];
    }
  }

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text(title, marginX, 20);

  doc.setFontSize(12);
  doc.text(businessName, marginX, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Report date: ${reportDate}`, marginX, 35);
  doc.text(`Generated: ${generatedTime}`, marginX, 40);

  doc.setDrawColor(230);
  doc.line(marginX, 44, marginX + contentWidth, 44);

  let y = 52;

  // Introduction / executive summary blocks (already computed elsewhere)
  const blocks: { heading: string; text?: string; lines?: string[] }[] = [];
  const ensureContent = () => {
    // Deterministic default content so the report never feels empty.
    if (!input.introduction) {
      const introByType: Record<PosReportType, string> = {
        'Daily Sales Report':
          "This daily report summarizes store sales activity based on locally recorded transactions for the selected date.",
        'Accounting Sales Report':
          "This accounting report provides a structured breakdown of sales values for the selected date to support internal review and reconciliation.",
        'Sales by Department':
          "This report summarizes sales totals by department to help understand category contribution and product mix.",
        'Sales by Customer Group':
          "This report summarizes sales totals by customer group to support segmentation, loyalty review, and purchasing pattern analysis.",
        'Payment Summary Report':
          "This report summarizes payment totals by method to support reconciliation, settlement checks, and internal review.",
        'Tax / GST Report':
          "This report summarizes tax values by slab and code to support compliance review and audit-friendly reporting.",
        'Inventory Summary':
          "This report summarizes stock levels and inventory status to support replenishment planning and stock control.",
        'Shift / Cashier Report':
          "This report summarizes shift activity and cash handling totals to support drawer balancing and internal controls.",
      };
      input.introduction = introByType[reportType];
    }

    if (!input.executiveSummary) {
      const execByType: Record<PosReportType, string> = {
        'Daily Sales Report':
          "This report provides a clear snapshot of the day's sales results and transaction activity for operational review.",
        'Accounting Sales Report':
          "This report is prepared for accounting review and focuses on sales values, adjustments, and categorizations used in financial reporting.",
        'Sales by Department':
          "Department-level totals help validate category performance and support margin and pricing review.",
        'Sales by Customer Group':
          "Customer group totals support internal analysis of buying behavior and identification of repeat or structured purchasing patterns.",
        'Payment Summary Report':
          "Payment totals support reconciliation against terminal settlements and cash drawer balances.",
        'Tax / GST Report':
          "Tax totals support review of taxable value and tax collected by slab for the selected period.",
        'Inventory Summary':
          "Inventory totals support identification of low stock, reorder needs, and stock movement trends.",
        'Shift / Cashier Report':
          "Shift totals support cashier accountability, reconciliation, and review of cash handling activity.",
      };
      input.executiveSummary = execByType[reportType];
    }

    if (!input.closingLine) {
      input.closingLine = 'This report is intended for internal accounting and financial review purposes.';
    }

    if (!input.notes) {
      const notesByType: Record<PosReportType, { title: string; lines: string[] }> = {
        'Daily Sales Report': {
          title: 'Notes',
          lines: [
            'Totals are based on locally recorded completed transactions for the selected date.',
            'Currency values are presented as INR and rounded to two decimals.',
          ],
        },
        'Accounting Sales Report': {
          title: 'Accounting Notes',
          lines: [
            'Gross Sales represent billed value before deductions.',
            'Net Sales reflect revenue after refunds and discounts.',
            'Tax values are calculated based on applicable tax rules.',
            'Cost figures support margin and profitability analysis.',
          ],
        },
        'Sales by Department': {
          title: 'Notes',
          lines: [
            'Department totals help identify category contribution to overall revenue.',
            'Refunds, discounts, and cost values support audit and margin review.',
          ],
        },
        'Sales by Customer Group': {
          title: 'Notes',
          lines: [
            'Customer group totals support segmentation and loyalty analysis.',
            'Walk-in vs logged-in group behavior can be compared without changing transaction values.',
          ],
        },
        'Payment Summary Report': {
          title: 'Notes',
          lines: [
            'Payment totals support reconciliation against settlement reports.',
            'Review cash totals against drawer balances and counted cash.',
          ],
        },
        'Tax / GST Report': {
          title: 'Notes',
          lines: [
            'Taxable value and tax totals should be reviewed for compliance and internal audit.',
            'Validate tax slabs and codes against configured tax rules.',
          ],
        },
        'Inventory Summary': {
          title: 'Notes',
          lines: [
            'Inventory values support stock control and replenishment planning.',
            'Review low stock and reorder thresholds for critical items.',
          ],
        },
        'Shift / Cashier Report': {
          title: 'Notes',
          lines: [
            'Shift totals support drawer balancing and internal controls.',
            'Review cash in/out transactions and verify supporting notes.',
          ],
        },
      };
      input.notes = notesByType[reportType];
    }

    // Default observations & suggestions (deterministic, non-speculative)
    if ((!input.observations || input.observations.length === 0) && reportType === 'Daily Sales Report') {
      input.observations = [
        'Review transaction count to understand store traffic for the day.',
        'Review total sales to confirm expected revenue for the selected date.',
        'Review average ticket value to understand typical spend per transaction.',
      ];
    }
    if ((!input.suggestions || input.suggestions.length === 0) && reportType === 'Daily Sales Report') {
      input.suggestions = [
        'Review pricing and in-store offers for clarity and consistency.',
        'Ensure fast-moving items are in stock and easy to locate.',
        'Confirm cashier and drawer procedures for smooth checkout flow.',
      ];
    }
  };

  ensureContent();

  blocks.push({ heading: 'Report Introduction', text: input.introduction });
  blocks.push({ heading: 'Executive Summary', text: input.executiveSummary });

  // Type-specific explanatory blocks (plain ASCII, no numbers)
  if (reportType === 'Accounting Sales Report') {
    blocks.push({
      heading: 'Net vs Gross Sales',
      text:
        'Gross Sales represent billed value before deductions. Net Sales reflect revenue after refunds and discounts. These definitions support consistent accounting review and reconciliation.',
    });
    blocks.push({
      heading: 'Department Contribution',
      text:
        'Department totals show how product categories contribute to overall revenue. Refunds, discounts, tax, and cost columns support audit review and margin analysis without changing the underlying transaction values.',
    });
    blocks.push({
      heading: 'Customer Group Interpretation',
      text:
        'Customer group totals categorize sales by customer segment. This supports review of walk-in vs registered behavior and helps validate loyalty and wholesale activity using locally stored data.',
    });
  }
  if (reportType === 'Sales by Department') {
    blocks.push({
      heading: 'Section Description',
      text:
        'The Sales by Department table summarizes revenue performance across product categories. It supports category contribution review, margin analysis, and operational decision-making.',
    });
    blocks.push({
      heading: 'Audit Notes',
      text:
        'Discounts and refunds indicate adjustments that impact net revenue. Cost values support profitability review. Department totals should be consistent with overall sales for the same date range.',
    });
  }
  if (reportType === 'Sales by Customer Group') {
    blocks.push({
      heading: 'Customer Segmentation',
      text:
        'The Sales by Customer Group table categorizes sales by customer type or group. This supports loyalty review, purchasing pattern analysis, and internal reporting.',
    });
    blocks.push({
      heading: 'Logged-in vs Walk-in',
      text:
        'Comparing registered and walk-in groups helps evaluate customer capture at checkout and supports structured marketing and loyalty planning without relying on external analytics.',
    });
  }
  if (reportType === 'Payment Summary Report') {
    blocks.push({
      heading: 'Definitions',
      text:
        'Payment method totals summarize how sales were settled. These values support reconciliation against settlement reports and cash drawer balancing for internal controls.',
    });
  }
  if (reportType === 'Tax / GST Report') {
    blocks.push({
      heading: 'Definitions',
      text:
        'Tax and GST columns summarize taxable value and tax collected by code or slab. These values support compliance review and audit-friendly reporting for the selected period.',
    });
  }
  if (reportType === 'Inventory Summary') {
    blocks.push({
      heading: 'Definitions',
      text:
        'Inventory columns summarize current stock position and status. This supports reorder planning, shrinkage review, and stock control using locally stored inventory data.',
    });
  }
  if (reportType === 'Shift / Cashier Report') {
    blocks.push({
      heading: 'Definitions',
      text:
        'Shift and cashier totals summarize drawer activity and cashier handling. This supports balancing, reconciliation, and internal accountability.',
    });
  }

  // KPI block
  if (input.kpis && input.kpis.length) {
    blocks.push({ heading: 'Key Metrics', lines: input.kpis.map(k => `${sanitizeAscii(k.label)}: ${sanitizeAscii(k.value)}`) });
    const expl = input.kpis.map(k => k.explanation).filter(Boolean).map(s => sanitizeAscii(String(s)));
    if (expl.length) blocks.push({ heading: 'Key Metrics Notes', lines: expl });
  }

  if (input.observations && input.observations.length) blocks.push({ heading: 'Observations', lines: input.observations });
  if (input.suggestions && input.suggestions.length) blocks.push({ heading: 'Actionable Suggestions', lines: input.suggestions });
  if (input.notes) blocks.push({ heading: input.notes.title, lines: input.notes.lines });
  if (input.closingLine) blocks.push({ heading: 'Internal Use', text: input.closingLine });

  const ensureSpace = (needed: number) => {
    if (y + needed > 270) {
      doc.addPage();
      y = 20;
    }
  };

  const drawBlock = (heading: string, text?: string, lines?: string[]) => {
    ensureSpace(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text(sanitizeAscii(heading).toUpperCase(), marginX, y);
    y += 5;

    doc.setDrawColor(230);
    doc.setFillColor(250);
    // Estimate height
    const bodyLines: string[] = [];
    if (text) bodyLines.push(...doc.splitTextToSize(sanitizeAscii(text), contentWidth - 10));
    if (lines) bodyLines.push(...lines.map(l => sanitizeAscii(l)));

    const height = Math.max(12, bodyLines.length * 4.5 + 6);
    ensureSpace(height + 8);
    doc.roundedRect(marginX, y, contentWidth, height, 3, 3, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);

    let ty = y + 7;
    for (const line of bodyLines) {
      const safe = sanitizeAscii(line);
      doc.text(safe, marginX + 5, ty, { maxWidth: contentWidth - 10 });
      ty += 4.5;
    }
    y += height + 8;
  };

  for (const b of blocks) drawBlock(b.heading, b.text, b.lines);

  // Tables
  const shouldIncludeTotals = (headers: string[]) => {
    const h = headers.map(x => String(x || '').toLowerCase()).join(' ');
    return /\b(total|amount|revenue|sales|tax|gst|cost|profit)\b/.test(h);
  };

  for (const tbl of input.tables) {
    if (tbl.title) drawBlock(tbl.title);
    ensureSpace(40);

    const includeTotalsRow = typeof tbl.includeTotalsRow === 'boolean'
      ? tbl.includeTotalsRow
      : shouldIncludeTotals(tbl.headers);

    const normalized = normalizeTable(tbl.headers, tbl.rows, includeTotalsRow);

    // Optional "Column Definitions" table for audit-friendly exports
    if (shouldRenderColumnDefinitions(reportType)) {
      const defRows = normalized.headers.map(h => [h, getColumnDefinition(reportType, h)]);
      ensureSpace(26);
      autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX },
        tableWidth: contentWidth,
        head: [['Column', 'Definition']],
        body: defRows,
        theme: 'grid',
        styles: { fontSize: 8, textColor: [17, 24, 39], cellPadding: 2 },
        headStyles: { fillColor: [245, 246, 247], textColor: [55, 65, 81], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
        rowPageBreak: 'avoid',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Numeric alignment heuristic: right-align columns with mostly numeric cells
    const numericCols: Record<number, boolean> = {};
    for (let c = 0; c < normalized.headers.length; c++) {
      let numericCount = 0;
      let totalCount = 0;
      for (const r of normalized.rows) {
        const s = (r[c] || '').replace(/INR\s*/g, '').replace(/,/g, '').trim();
        if (s.length === 0) continue;
        totalCount++;
        if (Number.isFinite(Number(s))) numericCount++;
      }
      numericCols[c] = totalCount > 0 && numericCount / totalCount >= 0.7;
    }

    const columnStyles: Record<number, any> = {};
    for (const [k, isNum] of Object.entries(numericCols)) {
      const idx = Number(k);
      if (isNum && idx > 0) columnStyles[idx] = { halign: 'right' };
    }

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      tableWidth: contentWidth,
      head: [normalized.headers],
      body: normalized.rows,
      theme: 'grid',
      styles: { fontSize: 8, textColor: [17, 24, 39], cellPadding: 2 },
      headStyles: { fillColor: [245, 246, 247], textColor: [55, 65, 81], fontStyle: 'bold' },
      columnStyles,
      rowPageBreak: 'avoid',
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Final validation (text-only): ensure no non-ascii survived in key strings
  const validate = (s: string) => /^[\x09\x0A\x0D\x20-\x7E]*$/.test(s);
  const critical = [title, businessName, reportDate, generatedTime];
  if (!critical.every(validate)) {
    // Defensive: re-sanitize and continue (doc content already sanitized; this is just a safety check)
  }

  // Footer appears once per report (last page only)
  doc.setPage(doc.internal.getNumberOfPages());
  drawFooterOnce(doc, input.posName, input.generatedTime);

  const buffer = doc.output('arraybuffer');
  if ((window as any).electronAPI) {
    try {
      const res: any = await (window as any).electronAPI.saveFile(filename, buffer);
      return !!res?.success;
    } catch {
      return false;
    }
  }

  doc.save(filename);
  return true;
}

