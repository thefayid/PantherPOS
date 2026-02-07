export interface User {
    id: number;
    name: string;
    role: 'ADMIN' | 'CASHIER' | 'MANAGER';
    pin: string;
    salary: number;
    pending_salary: number;
    given_salary: number;
    created_at: string;
}

export interface StaffAttendance {
    id: number;
    user_id: number;
    date: string;
    check_in: string;
    check_out?: string;
    status: 'PRESENT' | 'ABSENT' | 'LEAVE';
}

export interface StaffPayment {
    id: number;
    user_id: number;
    date: string;
    amount: number;
    payment_mode: string;
    notes?: string;
}


export interface Product {
    id: number;
    name: string;
    barcode: string;
    cost_price: number;
    sell_price: number;
    stock: number;
    gst_rate: number;
    hsn_code?: string;
    min_stock_level: number;
    image?: string;
    variant_group_id?: string;
    attributes?: string; // JSON string
}

export interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    created_at: string;
    total_purchases: number;
    last_visit?: string;
    points: number;
    balance: number;
}

export interface CustomerLedger {
    id: number;
    customer_id: number;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    balance_after: number;
    description?: string;
    reference_id?: number;
    date: string;
}

export interface Promotion {
    id: number;
    name: string;
    type: 'COUPON' | 'AUTOMATED' | 'LOYALTY';
    code?: string;
    discount_type: 'PERCENT' | 'FIXED';
    discount_value: number;
    min_cart_value: number;
    max_discount: number;
    start_date?: string;
    end_date?: string;
    active: boolean;
    description?: string;
}

export interface LoyaltyConfig {
    id: number;
    key: string;
    value: string;
}

export interface Supplier {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
    created_at: string;
    balance: number;
}

export interface SupplierLedger {
    id: number;
    supplier_id: number;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    balance_after: number;
    description?: string;
    reference_id?: number;
    date: string;
}

export interface PurchaseOrder {
    id: number;
    order_no: string;
    supplier_id: number;
    date: string;
    total_amount: number;
    status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    notes?: string;
    receive_date?: string;
}

export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_id: number;
    quantity: number;
    cost_price: number;
    total_amount: number;
}

export interface Bill {
    id: number;
    bill_no: string;
    date: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst_total: number;
    total: number;
    payment_mode: 'CASH' | 'CARD' | 'UPI';
    status: 'PAID' | 'CANCELLED' | 'REFUNDED' | 'PARTIAL_RETURN' | 'RETURNED';
    customer_id?: number;
    discount_amount: number;
    points_redeemed: number;
    points_earned: number;
    promotion_id?: number;
    order_type?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    notes?: string;
}

export interface BillItem {
    id: number;
    bill_id: number;
    product_id: number;
    quantity: number;
    returned_quantity?: number;
    price: number;
    taxable_value: number;
    gst_rate: number;
    gst_amount: number;
}

export interface CashDrawerSession {
    id: number;
    user_id: number;
    start_time: string;
    end_time?: string;
    start_cash: number;
    end_cash?: number;
    expected_cash?: number;
    variance?: number;
    status: 'OPEN' | 'CLOSED';
}

export interface CashTransaction {
    id: number;
    session_id: number;
    type: 'OPENING' | 'PAYIN' | 'DROP' | 'PAYOUT' | 'CLOSING' | 'SALE' | 'REFUND';
    amount: number;
    reason: string;
    meta_json?: string;
    time: string;
}

export interface StocktakeSession {
    id: number;
    created_at: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    finalized_at?: string;
}

export interface StocktakeItem {
    id: number;
    session_id: number;
    product_id: number;
    system_stock: number;
    counted_stock: number;
    variance: number;
}

export interface InventoryLog {
    id: number;
    product_id: number;
    type: 'SALE' | 'RETURN' | 'RESTOCK' | 'SHRINKAGE' | 'STOCKTAKE_ADJUSTMENT';
    quantity_change: number;
    reason?: string;
    date: string;
    user_id?: number;
}

export interface ChatLog {
    id: number;
    sender: 'USER' | 'AI' | 'SYSTEM';
    text: string;
    action_taken?: string;
    timestamp: number;
    session_id?: string;
}

export interface CompanySettings {
    id: number;
    name: string;
    tax_number: string;
    street_name: string;
    building_number: string;
    additional_street_name: string;
    plot_identification: string;
    district: string;
    postal_code: string;
    city: string;
    state: string;
    country: string;
    phone_number: string;
    email: string;
    bank_acc_number: string;
    bank_details: string;
    logo: string;
    owner_whatsapp?: string;
}

export interface VoidReason {
    id: number;
    reason: string;
}

export interface Account {
    id: number;
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
    category?: string;
    balance: number;
    description?: string;
    is_system: boolean;
}

export interface Voucher {
    id: number;
    voucher_no: string;
    date: string;
    type: 'RECEIPT' | 'PAYMENT' | 'JOURNAL' | 'CONTRA' | 'SALES' | 'PURCHASE' | 'EXPENSE';
    total_amount: number;
    reference_id?: string;
    notes?: string;
    created_at: string;
}

export interface VoucherItem {
    id: number;
    voucher_id: number;
    account_id: number;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description?: string;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE' | 'ARCHIVED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    due_date?: string;
    start_date?: string;
    created_at: string;
    updated_at?: string;
    creator_id: number;
    assignee_id?: number;
    related_entity_type?: 'INVOICE' | 'CUSTOMER' | 'PRODUCT' | 'SUPPLIER';
    related_entity_id?: number;
    tags?: string; // JSON string array
    is_archived: boolean;
}

export interface TaskComment {
    id: number;
    task_id: number;
    user_id: number;
    comment: string;
    created_at: string;
}

export interface AutomationRule {
    id: number;
    name: string;
    trigger_type: 'NEW_SALE' | 'LOW_STOCK' | 'NEW_CUSTOMER' | 'INVOICE_OVERDUE';
    action_type: 'CREATE_TASK' | 'SEND_WHATSAPP';
    config_json: string; // JSON string
    is_active: boolean;
}
