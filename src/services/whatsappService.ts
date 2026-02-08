
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
     * Formats and sends a detailed bill summary to a customer.
     */
    sendReceipt: (bill: any, customerName?: string) => {
        const phone = bill.customer_phone || '';
        if (!phone) {
            console.warn('[whatsappService] No phone number found for bill:', bill.bill_no);
            return false;
        }

        const name = (customerName && customerName !== 'Walk-in Customer') ? customerName : 'Customer';

        let itemLines = '';
        if (bill.items && bill.items.length > 0) {
            itemLines = '\nItems:\n' + bill.items.map((item: any) =>
                `- ${item.productName}: ${item.quantity} x ₹${item.price} = ₹${(item.quantity * item.price).toFixed(2)}`
            ).join('\n') + '\n';
        }

        const taxLines = bill.cgst > 0 ? `
CGST: ₹${bill.cgst.toFixed(2)}
SGST: ₹${bill.sgst.toFixed(2)}` : '';

        const message = `Thank you ${name}! 
Here is your bill summary:
Bill No: ${bill.bill_no}
Date: ${new Date(bill.date).toLocaleDateString()}
${itemLines}${taxLines}
----------------------------
Total: ₹${bill.total.toFixed(2)}
----------------------------

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
    },

    /**
     * Sends a balance reminder (Udhaar/Credit) to a customer.
     */
    sendBalanceReminder: (customer: any) => {
        const phone = customer.phone || '';
        if (!phone) return false;

        const balance = (customer.balance || 0).toFixed(2);
        const name = customer.name || 'Customer';

        const message = `Halo ${name},
This is a friendly reminder from *PantherPOS* regarding your outstanding balance of *₹${balance}*.

Please settle the amount at your earliest convenience. If you have already paid, please ignore this message.

Thank you!`;

        whatsappService.sendMessage(phone, message);
        return true;
    }
};
