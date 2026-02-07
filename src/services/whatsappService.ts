
import type { Bill } from '../types/db';

export const whatsappService = {
    /**
     * Centralized method to format and open a WhatsApp link.
     * In the future, this can be swapped with a server-side API call.
     */
    sendMessage: (phone: string, message: string) => {
        if (!phone) return;

        // Clean phone number (remove spaces, dashes, etc.)
        let cleanPhone = phone.replace(/\D/g, '');

        // Default to India +91 if not present and looks like mobile
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

        console.log('[whatsappService] Opening WhatsApp Link:', url);
        window.open(url, '_blank');
    },

    /**
     * Formats and sends a bill summary to a customer.
     */
    sendReceipt: (bill: Bill, customerName?: string) => {
        const phone = (bill as any).customer_phone || '';
        if (!phone) {
            console.warn('[whatsappService] No phone number found for bill:', bill.bill_no);
            return false;
        }

        const name = (customerName && customerName !== 'Walk-in Customer') ? customerName : 'Customer';
        const message = `Thank you ${name}! 
Here is your bill summary:
Bill No: ${bill.bill_no}
Total: ₹${bill.total}
Date: ${new Date(bill.date).toLocaleDateString()}

Visit us again!`;

        whatsappService.sendMessage(phone, message);
        return true;
    },

    /**
     * Formats and sends a low stock alert to the owner.
     */
    sendLowStockAlert: (ownerPhone: string, productName: string, stock: number) => {
        const message = `⚠️ LOW STOCK ALERT
Product: ${productName}
Current Stock: ${stock}
Please restock as soon as possible.`;

        whatsappService.sendMessage(ownerPhone, message);
    }
};
