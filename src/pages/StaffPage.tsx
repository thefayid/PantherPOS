import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types/db';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Trash2, DollarSign, CalendarCheck, FileEdit, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { staffService } from '../services/staffService';
import { databaseService } from '../services/databaseService';
import { permissionsService } from '../services/permissionsService';
import { ManagerPinModal } from '../components/ManagerPinModal';



export default function StaffPage() {
    const currentUser = permissionsService.getCurrentUser();
    const canManageStaff = permissionsService.can('MANAGE_STAFF', currentUser);
    const [overrideGranted, setOverrideGranted] = useState(false);
    const [isPinOpen, setIsPinOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [isaddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [role, setRole] = useState<User['role']>('CASHIER');
    const [salary, setSalary] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentNotes, setPaymentNotes] = useState('');

    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));


    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try { const data = await authService.getUsers(); setUsers(data); } catch (error) { console.error(error); toast.error('Failed to load staff'); }
    };

    const loadAttendance = async (userId: number, month: string) => {
        setIsLoading(true);
        try {
            const data = await staffService.getAttendance(userId, month);
            setAttendanceHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load attendance history');
            setAttendanceHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); if (!name || !pin) return; setIsLoading(true);
        try { await authService.createUser({ name, pin, role, salary: Number(salary) || 0, pending_salary: Number(salary) || 0, given_salary: 0 }); toast.success('Staff member added'); setIsAddModalOpen(false); resetForm(); loadUsers(); } catch (error: any) { toast.error(error.message || 'Failed to create user'); } finally { setIsLoading(false); }
    };

    const handleMarkAttendance = async (userId: number, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
        try { await staffService.markAttendance(userId, status); toast.success(`Attendance marked as ${status}`); } catch (error) { toast.error('Failed to mark attendance'); }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !paymentAmount) return;
        setIsLoading(true);
        try {
            await staffService.paySalary(selectedUser.id, Number(paymentAmount), paymentMode, paymentNotes);
            toast.success('Salary payment recorded');
            setIsPaymentModalOpen(false);
            setPaymentAmount('');
            setPaymentNotes('');
            loadUsers();
        } catch (error) {
            toast.error('Payment failed');
        } finally {
            setIsLoading(false);
        }
    };


    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser || !name) return;
        setIsLoading(true);
        try {
            await authService.updateUser(editingUser.id, {
                name,
                role,
                pin: pin || undefined,
                salary: Number(salary) || 0
            });

            // Refresh editing user's current values for the following check
            const newSalary = Number(salary) || 0;
            if (!(editingUser.salary > 0) && newSalary > 0) {
                await databaseService.query('UPDATE users SET pending_salary = ? WHERE id = ?', [newSalary, editingUser.id]);
            } else {
                // Also update pending if salary changed?
                // For now just ensuring it's not null
                await databaseService.query('UPDATE users SET pending_salary = COALESCE(pending_salary, 0) WHERE id = ?', [editingUser.id]);
            }
            await databaseService.query('UPDATE users SET given_salary = COALESCE(given_salary, 0) WHERE id = ?', [editingUser.id]);

            toast.success('Staff details updated');
            setIsEditModalOpen(false);
            setEditingUser(null);
            resetForm();
            loadUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !pin) return;

        const cleanPin = pin.trim();
        if (!cleanPin) {
            toast.error('PIN cannot be empty');
            return;
        }

        setIsLoading(true);
        try {
            console.log(`[StaffPage] Updating PIN for user ${selectedUser.id} (${selectedUser.name}) to '${cleanPin}'`);
            const changes = await authService.updateUser(selectedUser.id, { pin: cleanPin });

            console.log(`[StaffPage] Update result (changes):`, changes);

            if (changes > 0) {
                toast.success('PIN updated successfully. Please test login.');
                setIsPinModalOpen(false);
                setPin('');
                setSelectedUser(null);
                loadUsers(); // Refresh list potentially
            } else {
                toast.error('Update failed: Database reported no changes.');
            }
        } catch (error: any) {
            console.error('[StaffPage] Update error:', error);
            toast.error(error.message || 'Failed to update PIN');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setName(user.name);
        setRole(user.role);
        setSalary((user.salary ?? 0).toString());
        setPin(''); // Don't show PIN
        setIsEditModalOpen(true);
    };

    const handleAttendanceClick = (user: User) => {
        setSelectedUser(user);
        setIsAttendanceModalOpen(true);
        setAttendanceHistory([]); // Clear previous
        const currentMonth = new Date().toISOString().substring(0, 7);
        setSelectedMonth(currentMonth);
        loadAttendance(user.id, currentMonth);
    };

    const handleDelete = async (id: number, userName: string) => {

        if (!confirm(`Are you sure you want to delete ${userName}?`)) return;
        try { await authService.deleteUser(id); toast.success('User deleted'); loadUsers(); } catch (error: any) { toast.error(error.message || 'Failed to delete user'); }
    };

    const resetForm = () => { setName(''); setPin(''); setRole('CASHIER'); setSalary(''); };

    if (!canManageStaff && !overrideGranted) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-background text-foreground p-8">
                <div className="bg-surface border border-border rounded-2xl shadow-2xl p-10 max-w-xl w-full text-center space-y-4">
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Restricted</div>
                    <h2 className="text-2xl font-black tracking-tight">Staff Management Locked</h2>
                    <p className="text-sm text-muted-foreground font-medium">
                        Only Administrators can manage staff accounts and salaries.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                        <Button variant="ghost" onClick={() => window.history.back()}>Go Back</Button>
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white border-none"
                            onClick={() => setIsPinOpen(true)}
                        >
                            <Lock size={16} className="mr-2" /> Admin PIN Override
                        </Button>
                    </div>
                </div>

                <ManagerPinModal
                    isOpen={isPinOpen}
                    onClose={() => setIsPinOpen(false)}
                    minRole={permissionsService.getOverrideMinRole('MANAGE_STAFF')}
                    title="Admin Authorization"
                    description="Enter an Admin PIN to access Staff Management."
                    auditAction="MANAGER_OVERRIDE"
                    auditDetails={{ action: 'MANAGE_STAFF', page: 'StaffPage' }}
                    onApproved={() => {
                        setIsPinOpen(false);
                        setOverrideGranted(true);
                    }}
                />
            </div>
        );
    }


    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Management</h1>
                    <p className="text-muted-foreground">Manage access and permissions for your team.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl shadow-glow font-bold transition-all flex items-center gap-2"
                >
                    <span className="text-xl leading-none mb-0.5">+</span> Add Staff
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-6">
                {users.map(user => (
                    <div key={user.id} className="bg-surface border border-border rounded-xl p-6 shadow-lg flex flex-col gap-4 relative group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold text-xl text-foreground">{user.name}</div>
                                <span className={`text-xs font-bold px-2 py-1 rounded border mt-2 inline-block ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    user.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-lg">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <button
                                onClick={() => handleEditClick(user)}
                                className="absolute top-2 right-12 p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
                                title="Edit User"
                            >
                                <FileEdit size={16} />
                            </button>
                            <button
                                onClick={() => { setSelectedUser(user); setPin(''); setIsPinModalOpen(true); }}
                                className="absolute top-2 right-2 p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
                                title="Change PIN"
                            >
                                <Lock size={16} />
                            </button>
                        </div>


                        <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Salary</span>
                                <span className="text-sm font-bold text-foreground">₹{user.salary ?? 0}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Pending</span>
                                <span className="text-sm font-bold text-orange-500">₹{user.pending_salary ?? 0}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Given</span>
                                <span className="text-sm font-bold text-emerald-500">₹{user.given_salary ?? 0}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex gap-2">
                            <button
                                onClick={() => { setSelectedUser(user); setIsPaymentModalOpen(true); }}
                                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs py-2 rounded-lg font-bold border border-emerald-500/10 flex items-center justify-center gap-1.5 transition-all"
                            >
                                <DollarSign size={14} /> Pay Salary
                            </button>
                            <button
                                onClick={() => handleAttendanceClick(user)}
                                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs py-2 rounded-lg font-bold border border-blue-500/10 flex items-center justify-center gap-1.5 transition-all"
                            >
                                <CalendarCheck size={14} /> Attendance
                            </button>
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                            <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                <span className="opacity-50 text-[8px]">PIN</span> ****
                            </div>
                            <button
                                onClick={() => handleDelete(user.id, user.name)}
                                className="text-muted-foreground hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Delete User"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                    </div>
                ))}
            </div>

            <Modal isOpen={isaddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Team Member">
                <form onSubmit={handleCreate} className="flex flex-col gap-6 p-1">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Full Name</label>
                        <input
                            type="text"
                            placeholder="e.g. John Doe"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/30 font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Monthly Salary (Base)</label>
                        <input
                            type="number"
                            placeholder="e.g. 15000"
                            value={salary}
                            onChange={e => setSalary(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/30 font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Role & Permissions</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['CASHIER', 'MANAGER', 'ADMIN'] as const).map((r) => (
                                <label key={r} className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${role === r
                                    ? 'bg-primary/20 border-primary text-foreground shadow-glow-sm font-bold'
                                    : 'bg-muted/10 border-border text-muted-foreground hover:bg-muted/20'
                                    }`}>
                                    <input type="radio" name="role" className="hidden" checked={role === r} onChange={() => setRole(r)} />
                                    <span className="text-sm font-bold block mt-1">{r}</span>
                                    <span className="text-[10px] opacity-60 block">{r === 'CASHIER' ? 'Basic Sales' : r === 'MANAGER' ? 'Reports & Stock' : 'Full Access'}</span>
                                </label>
                            ))}
                        </div>
                    </div>


                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Security PIN</label>
                        <input
                            type="password"
                            placeholder="4-8 digits"
                            required
                            maxLength={8}
                            pattern="[0-9]{4,}"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/30 font-mono tracking-widest text-center text-lg"
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg shadow-glow mt-2">
                        {isLoading ? 'Creating...' : 'Create Account'}
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingUser(null); resetForm(); }} title="Edit Staff Member">
                <form onSubmit={handleUpdate} className="flex flex-col gap-6 p-1">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Full Name</label>
                        <input
                            type="text"
                            placeholder="e.g. John Doe"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/30 font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Monthly Salary (Base)</label>
                        <input
                            type="number"
                            placeholder="e.g. 15000"
                            value={salary}
                            onChange={e => setSalary(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/30 font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Role & Permissions</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['CASHIER', 'MANAGER', 'ADMIN'] as const).map((r) => (
                                <label key={r} className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${role === r
                                    ? 'bg-primary/20 border-primary text-foreground shadow-glow-sm font-bold'
                                    : 'bg-muted/10 border-border text-muted-foreground hover:bg-muted/20'
                                    }`}>
                                    <input type="radio" name="role" className="hidden" checked={role === r} onChange={() => setRole(r)} />
                                    <span className="text-sm block mt-1">{r}</span>
                                    <span className="text-[10px] opacity-60 block">{r === 'CASHIER' ? 'Basic Sales' : r === 'MANAGER' ? 'Reports & Stock' : 'Full Access'}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Update Security PIN (Optional)</label>
                        <input
                            type="password"
                            placeholder="Leave blank to keep current"
                            maxLength={8}
                            pattern="[0-9]{4,}"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/30 font-mono tracking-widest text-center text-lg"
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg shadow-glow mt-2">
                        {isLoading ? 'Updating...' : 'Save Changes'}
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Pay Salary: ${selectedUser?.name}`}>

                <form onSubmit={handlePayment} className="flex flex-col gap-6 p-1">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Amount to Pay</label>
                        <input
                            type="number"
                            required
                            max={selectedUser?.pending_salary}
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none font-bold text-xl"
                        />
                        <p className="text-[10px] text-orange-400 mt-1 uppercase font-bold">Max: ₹{selectedUser?.pending_salary}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {['CASH', 'UPI', 'CARD'].map(mode => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setPaymentMode(mode)}
                                className={`py-3 rounded-xl border text-sm font-bold transition-all ${paymentMode === mode ? 'bg-primary/20 border-primary text-foreground' : 'bg-muted/10 border-border text-muted-foreground hover:bg-muted/20'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Jan 2024 full payment"
                            value={paymentNotes}
                            onChange={e => setPaymentNotes(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none"
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-600 text-white py-4 text-lg shadow-lg">
                        {isLoading ? 'Processing...' : 'Record Payment'}
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title={`Attendance: ${selectedUser?.name}`}>
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(e.target.value);
                                if (selectedUser) loadAttendance(selectedUser.id, e.target.value);
                            }}
                            className="bg-muted/20 border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:border-primary"
                        />
                        <button
                            onClick={() => selectedUser && handleMarkAttendance(selectedUser.id, 'PRESENT').then(() => loadAttendance(selectedUser.id, selectedMonth))}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
                        >
                            + Mark Today
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center p-8 text-muted-foreground">Loading History...</div>
                        ) : !Array.isArray(attendanceHistory) || attendanceHistory.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">No records found for this month.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Time</th>
                                        <th className="p-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(attendanceHistory || []).map((rec: any) => (
                                        <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3 text-sm text-foreground">{new Date(rec.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td className="p-3 text-xs text-muted-foreground">
                                                {rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rec.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                    {rec.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isPinModalOpen} onClose={() => { setIsPinModalOpen(false); setPin(''); setSelectedUser(null); }} title={`Change PIN: ${selectedUser?.name}`}>
                <form onSubmit={handlePinUpdate} className="flex flex-col gap-6 p-1">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">New Security PIN</label>
                        <input
                            type="password"
                            placeholder="4-8 digits"
                            required
                            maxLength={8}
                            pattern="[0-9]{4,}"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/30 font-mono tracking-widest text-center text-3xl"
                            autoFocus
                        />
                    </div>
                    <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg shadow-glow mt-2">
                        {isLoading ? 'Updating...' : 'Update PIN'}
                    </Button>
                </form>
            </Modal>

        </div>
    );
}
