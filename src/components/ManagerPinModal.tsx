import { useEffect, useRef, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { databaseService } from '../services/databaseService';
import { auditService } from '../services/auditService';
import type { User } from '../types/db';
import type { Role } from '../services/permissionsService';

interface ManagerPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApproved: (approver: User) => void;
    title?: string;
    description?: string;
    minRole?: Role;
    auditAction?: string;
    auditDetails?: any;
}

const ROLE_WHITELIST_BY_MIN: Record<Role, Role[]> = {
    CASHIER: ['CASHIER', 'MANAGER', 'ADMIN'],
    MANAGER: ['MANAGER', 'ADMIN'],
    ADMIN: ['ADMIN'],
};

export function ManagerPinModal({
    isOpen,
    onClose,
    onApproved,
    title = 'Manager Authorization',
    description = 'Enter a Manager/Admin PIN to approve this action.',
    minRole = 'MANAGER',
    auditAction = 'MANAGER_OVERRIDE',
    auditDetails = {},
}: ManagerPinModalProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setPin('');
        setError('');
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 120);
    }, [isOpen]);

    const verifyPin = async (enteredPin: string): Promise<User | null> => {
        const roles = ROLE_WHITELIST_BY_MIN[minRole] || ROLE_WHITELIST_BY_MIN.MANAGER;
        const placeholders = roles.map(() => '?').join(', ');
        const rows = await databaseService.query(
            `SELECT * FROM users WHERE pin = ? AND role IN (${placeholders}) LIMIT 1`,
            [enteredPin, ...roles]
        );
        return (rows?.[0] as User) || null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin.trim()) return;
        setLoading(true);
        setError('');
        try {
            const approver = await verifyPin(pin.trim());
            if (!approver) {
                setError('Invalid PIN or insufficient privileges.');
                return;
            }

            await auditService.log(auditAction, {
                approverId: approver.id,
                approverName: approver.name,
                minRole,
                ...auditDetails,
            });

            onApproved(approver);
            onClose();
        } catch (err) {
            console.error(err);
            setError('Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="flex flex-col items-center justify-center p-4">
                <div className="bg-orange-500/10 p-4 rounded-full mb-4">
                    <Lock className="w-8 h-8 text-orange-500" />
                </div>

                <p className="text-mac-text-secondary text-sm text-center mb-6">
                    {description}
                </p>

                <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center tracking-[0.5em] font-black text-xl focus:border-orange-500/50 outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                            placeholder="ENTER PIN"
                            maxLength={8}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs text-center font-bold animate-pulse">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-mac-text-secondary text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || pin.trim().length < 4}
                            className="py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                            Approve
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

