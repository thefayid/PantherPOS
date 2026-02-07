
export interface AuditLogEntry {
    id: number;
    user_id: number;
    user_name: string;
    action: string;
    details: string;
    timestamp: string;
}

export type AuditSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface AuditChangePayload {
    entity: string;
    entityId?: string | number;
    before?: any;
    after?: any;
    severity?: AuditSeverity;
    message?: string;
    meta?: any;
}

export const auditService = {
    log: async (action: string, details: any = {}) => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return; // Should rarely happen if we are logged in, but for generic protection

            const user = JSON.parse(userStr);

            // Format details as string if it's an object
            const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

            await window.electronAPI.addAuditLog({
                userId: user.id || 0,
                userName: user.name || 'System',
                action,
                details: detailsStr
            });
        } catch (e) {
            console.error('Failed to write audit log', e);
        }
    },

    /**
     * Helper for recording before/after changes in a consistent shape.
     * These details remain a string in the DB, but the UI can parse JSON.
     */
    logChange: async (action: string, payload: AuditChangePayload) => {
        return await auditService.log(action, {
            kind: 'CHANGE',
            severity: payload.severity || 'INFO',
            entity: payload.entity,
            entityId: payload.entityId ?? null,
            message: payload.message || null,
            before: payload.before ?? null,
            after: payload.after ?? null,
            meta: payload.meta ?? null,
        });
    },

    getLogs: async (limit: number = 100): Promise<AuditLogEntry[]> => {
        try {
            return await window.electronAPI.getAuditLogs(limit);
        } catch (e) {
            console.error('Failed to fetch audit logs', e);
            return [];
        }
    }
};
