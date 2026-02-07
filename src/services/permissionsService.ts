import type { User } from '../types/db';

export type Role = User['role'];

export type Action =
    | 'CLOSE_REGISTER'
    | 'FINALIZE_Z_REPORT'
    | 'STOCK_ADJUST'
    | 'MANAGE_STAFF'
    | 'MANAGE_COMPANY'
    | 'MANAGE_SETTINGS'
    | 'EXPORT_DATA'
    | 'VIEW_AUDIT_LOGS'
    | 'RUN_STOCKTAKE';

export interface ActionPolicy {
    minRole: Role;
    /**
     * Whether a higher-privilege user can approve the action
     * for the current operator via PIN override.
     */
    allowOverride: boolean;
    /**
     * Minimum role required for the approving PIN.
     * Defaults to 'MANAGER' when `allowOverride` is true.
     */
    overrideMinRole?: Role;
}

const ROLE_RANK: Record<Role, number> = {
    CASHIER: 1,
    MANAGER: 2,
    ADMIN: 3,
};

const ACTION_POLICIES: Record<Action, ActionPolicy> = {
    CLOSE_REGISTER: { minRole: 'MANAGER', allowOverride: true, overrideMinRole: 'MANAGER' },
    FINALIZE_Z_REPORT: { minRole: 'MANAGER', allowOverride: true, overrideMinRole: 'MANAGER' },
    STOCK_ADJUST: { minRole: 'MANAGER', allowOverride: true, overrideMinRole: 'MANAGER' },
    MANAGE_STAFF: { minRole: 'ADMIN', allowOverride: true, overrideMinRole: 'ADMIN' },
    MANAGE_COMPANY: { minRole: 'ADMIN', allowOverride: true, overrideMinRole: 'ADMIN' },
    MANAGE_SETTINGS: { minRole: 'MANAGER', allowOverride: true, overrideMinRole: 'MANAGER' },
    EXPORT_DATA: { minRole: 'MANAGER', allowOverride: true, overrideMinRole: 'MANAGER' },
    VIEW_AUDIT_LOGS: { minRole: 'MANAGER', allowOverride: false },
    RUN_STOCKTAKE: { minRole: 'MANAGER', allowOverride: true, overrideMinRole: 'MANAGER' },
};

export const permissionsService = {
    getCurrentUser: (): User | null => {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) return null;
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    },

    roleAtLeast: (role: Role | null | undefined, minRole: Role): boolean => {
        if (!role) return false;
        return (ROLE_RANK[role] || 0) >= (ROLE_RANK[minRole] || 0);
    },

    getPolicy: (action: Action): ActionPolicy => ACTION_POLICIES[action],

    can: (action: Action, user?: Pick<User, 'role'> | null): boolean => {
        const role = user?.role ?? permissionsService.getCurrentUser()?.role ?? null;
        const policy = permissionsService.getPolicy(action);
        return permissionsService.roleAtLeast(role, policy.minRole);
    },

    requiresOverride: (action: Action, user?: Pick<User, 'role'> | null): boolean => {
        const policy = permissionsService.getPolicy(action);
        if (!policy.allowOverride) return false;
        return !permissionsService.can(action, user);
    },

    getOverrideMinRole: (action: Action): Role => {
        const policy = permissionsService.getPolicy(action);
        return policy.overrideMinRole || 'MANAGER';
    },

    /**
     * Minimal route gating used by the Sidebar (navigation-level hiding).
     * This does not enforce runtime access checks inside pages.
     */
    minRoleForPath: (path: string): Role => {
        if (path === '/staff') return 'ADMIN';
        if (path === '/my-company') return 'ADMIN';
        if (path === '/audit-logs') return 'MANAGER';
        if (path === '/end-of-day') return 'MANAGER';
        if (path === '/cash') return 'MANAGER';
        if (path === '/stocktake') return 'MANAGER';
        if (path === '/settings') return 'MANAGER';
        if (path === '/accounting') return 'MANAGER';
        return 'CASHIER';
    },
};

