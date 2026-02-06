export interface AccountingSalesReportNarrative {
  introduction: string;
  totalSalesExplanation: string;
  salesByDepartmentDescription: string;
  salesByDepartmentPostInsight: string;
  salesByCustomerGroupDescription: string;
  salesByCustomerGroupPostInsight: string;
  accountingNotesTitle: string;
  accountingNotes: string[];
  closingLine: string;
}

/**
 * Offline-only explanatory content for an Accounting Sales Report.
 * Deterministic, concise, accountant-friendly. No internet references.
 * Plain text only (no emojis/icons).
 */
export function getAccountingSalesReportNarrative(): AccountingSalesReportNarrative {
  return {
    introduction:
      "This Accounting Sales Report provides a detailed breakdown of store sales performance for the selected date. The report includes net and gross sales, refunds, discounts, taxes, and cost values, categorized by department and customer group for accurate financial review.",

    totalSalesExplanation:
      "Total Sales represent net revenue after accounting for voids, promotions, discounts, taxes, and additional charges.",

    salesByDepartmentDescription:
      "The Sales by Department section summarizes revenue performance across different product categories. It highlights how each department contributes to overall sales, including gross revenue, refunds, discounts applied, tax collected, and associated costs.",

    salesByDepartmentPostInsight:
      "Department-level analysis shows that primary revenue contribution comes from high-volume categories, while smaller departments generate limited but consistent sales. Refunds and discounts remain controlled across all departments, indicating stable pricing and sales behavior.",

    salesByCustomerGroupDescription:
      "The Sales by Customer Group section categorizes sales based on customer types. This helps identify purchasing patterns among regular customers, VIP members, wholesale buyers, and walk-in customers.",

    salesByCustomerGroupPostInsight:
      "Customer group data indicates that the majority of sales originate from general and non-logged-in customers, while registered and wholesale customers contribute a smaller but structured portion of revenue.",

    accountingNotesTitle: "Accounting Notes",
    accountingNotes: [
      "Gross Sales represent total billed value before deductions",
      "Net Sales reflect actual revenue after refunds and discounts",
      "Tax values are calculated based on applicable tax rules",
      "Cost figures are included for margin and profitability analysis",
    ],

    closingLine:
      "This report is intended for internal accounting and financial review purposes.",
  };
}

