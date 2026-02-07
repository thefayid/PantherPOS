
import { productService } from './productService';
import { databaseService } from './databaseService';

export interface Notification {
    id: number;
    type: 'LOW_STOCK' | 'SYSTEM' | 'CASH_VARIANCE' | 'STOCKTAKE_OVERDUE';
    title: string;
    message: string;
    is_read: number; // 0 or 1
    created_at: string;
}

export const notificationService = {
    add: async (n: { type: Notification['type']; title: string; message: string }) => {
        return await window.electronAPI.addNotification(n);
    },

    // Queries the DB and generates triggers
    checkStockLevels: async () => {
        try {
            // 1. Get all products with stock <= min_stock
            const products = await productService.getAll();
            const lowStockItems = products.filter(p => p.stock <= (p.min_stock_level || 5));

            if (lowStockItems.length === 0) return;

            // 2. Get existing unread notifications to avoid duplication
            // A smarter way would be to check if we alerted 'recently', but for now, 
            // if an unread alert exists for "Low Stock", we might group them or just append.
            // Simpler: Just create a "Low Stock Alert" summary.

            // Or better: Create individual alerts for critical items, but maybe cap it.
            // Let's create one summary alert if many, or individuals if few.

            if (lowStockItems.length > 5) {
                await window.electronAPI.addNotification({
                    type: 'LOW_STOCK',
                    title: 'Multiple Low Stock Items',
                    message: `${lowStockItems.length} products are below their minimum stock level. Please check inventory.`
                });
            } else {
                for (const item of lowStockItems) {
                    // Check if we already have an unread notification for this specific item? 
                    // Since we don't store product_id in notification table (simplified schema), 
                    // we'll rely on string matching or just allow duplicates for now (user reads and clears).
                    // To prevent spam on EVERY restart, we could check if the latest notification title contains the item name.

                    const recent = await window.electronAPI.getNotifications(true); // Unread only
                    const alreadyAlerted = recent.some((n: any) => n.title.includes(item.name));

                    if (!alreadyAlerted) {
                        await window.electronAPI.addNotification({
                            type: 'LOW_STOCK',
                            title: `Low Stock: ${item.name}`,
                            message: `Current Stock: ${item.stock}. Minimum: ${item.min_stock_level || 5}. Please restock.`
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Stock check failed', e);
        }
    },

    checkOverdueStocktake: async (days: number = 7) => {
        try {
            // Ensure we don't spam: if an unread overdue alert exists within last 24h, skip.
            const unread = await window.electronAPI.getNotifications(true);
            const recentOverdue = (unread || []).some((n: any) => {
                if (n.type !== 'STOCKTAKE_OVERDUE') return false;
                const ts = new Date(n.created_at).getTime();
                return Number.isFinite(ts) && ts > Date.now() - 24 * 60 * 60 * 1000;
            });
            if (recentOverdue) return;

            const last = await databaseService.query(
                `SELECT COALESCE(finalized_at, created_at) as last_at
                 FROM stocktake_sessions
                 WHERE status = 'COMPLETED'
                 ORDER BY COALESCE(finalized_at, created_at) DESC
                 LIMIT 1`
            );

            const lastAtStr = last?.[0]?.last_at as string | undefined;
            const lastAt = lastAtStr ? new Date(lastAtStr).getTime() : NaN;
            const daysSince = Number.isFinite(lastAt) ? Math.floor((Date.now() - lastAt) / (24 * 60 * 60 * 1000)) : null;

            if (daysSince === null || daysSince >= days) {
                await notificationService.add({
                    type: 'STOCKTAKE_OVERDUE',
                    title: 'Stocktake overdue',
                    message: daysSince === null
                        ? `No completed stocktake found. Run a stocktake to reconcile inventory.`
                        : `Last stocktake was ${daysSince} day(s) ago. Recommended every ${days} day(s).`,
                });
            }
        } catch (e) {
            console.error('Stocktake overdue check failed', e);
        }
    },

    notifyCashVariance: async (params: { sessionId: number; expected: number; counted: number; variance: number; threshold?: number }) => {
        const threshold = params.threshold ?? 50; // INR threshold (tunable)
        try {
            if (Math.abs(params.variance) < threshold) return;

            const unread = await window.electronAPI.getNotifications(true);
            const already = (unread || []).some((n: any) =>
                n.type === 'CASH_VARIANCE' && String(n.title || '').includes(`#${params.sessionId}`)
            );
            if (already) return;

            await notificationService.add({
                type: 'CASH_VARIANCE',
                title: `Cash variance detected • Session #${params.sessionId}`,
                message: `Expected: ₹${params.expected.toFixed(2)} • Counted: ₹${params.counted.toFixed(2)} • Variance: ₹${params.variance.toFixed(2)} (threshold ₹${threshold.toFixed(2)})`,
            });
        } catch (e) {
            console.error('Cash variance notification failed', e);
        }
    },

    getAll: async (unreadOnly = false) => {
        return await window.electronAPI.getNotifications(unreadOnly);
    },

    markRead: async (id: number) => {
        return await window.electronAPI.markNotificationRead(id);
    },

    markAllRead: async () => {
        return await window.electronAPI.markAllNotificationsRead();
    }
};
