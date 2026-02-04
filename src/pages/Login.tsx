import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types/db';
import { Eye, EyeOff, ShieldCheck, User as UserIcon, Terminal, X } from 'lucide-react';
import { databaseService } from '../services/databaseService';

interface LoginProps {
    onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'ADMIN' | 'CASHIER'>('ADMIN');

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Diagnostics
    const [logoTaps, setLogoTaps] = useState(0);
    const [showDiag, setShowDiag] = useState(false);
    const [diagInfo, setDiagInfo] = useState<any>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setInitializing(true);
        try {
            const allUsers = await authService.getUsers();
            setUsers(allUsers);
        } catch (e) {
            console.error("Failed to load users", e);
            setError("Database Error: Failed to load user list.");
        } finally {
            setInitializing(false);
            refreshDiag();
        }
    };

    const refreshDiag = () => {
        if (databaseService.getDiagnostics) {
            setDiagInfo(databaseService.getDiagnostics());
        }
    };

    const handleLogoTap = () => {
        const newTaps = logoTaps + 1;
        setLogoTaps(newTaps);
        if (newTaps >= 5) {
            setShowDiag(true);
            setLogoTaps(0);
            refreshDiag();
        }
    };

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (users.length === 0) {
                const reloaded = await authService.getUsers();
                if (reloaded.length === 0) {
                    setError('Database appears empty. Open diagnostics to check.');
                    setLoading(false);
                    return;
                }
                setUsers(reloaded);
            }

            const targetUser = users.find(u => u.name.toLowerCase() === username.toLowerCase().trim());
            if (!targetUser) {
                setError('User not found');
                setLoading(false);
                return;
            }

            if (activeTab === 'ADMIN' && targetUser.role !== 'ADMIN') {
                setError('This user is not an Admin');
                setLoading(false);
                return;
            }

            const loggedInUser = await authService.login(password);
            if (loggedInUser && loggedInUser.id === targetUser.id) {
                onLogin(loggedInUser);
            } else {
                setError('Invalid Password/PIN');
            }
        } catch (err) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground font-sans flex flex-col relative overflow-hidden">
            {initializing && (
                <div className="absolute inset-0 z-[100] bg-background flex flex-col items-center justify-center animate-pulse">
                    <img src="/pantherpos_logo.png" alt="Logo" className="h-24 w-auto mb-4" />
                    <p className="text-primary font-bold tracking-widest text-xs uppercase">Initializing System...</p>
                </div>
            )}
            {/* Background Glows (Themed) */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="w-full p-4 md:p-6 flex justify-end items-center z-10">
                <button className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-colors text-[10px] md:text-sm font-medium">
                    Support
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 z-10 w-full overflow-hidden">
                <div className="w-full max-w-4xl bg-surface/80 backdrop-blur-xl border border-border rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden my-auto max-h-[90vh]">

                    {/* Left Side: Branding */}
                    <div className="w-full md:w-1/2 p-4 md:p-12 flex flex-col items-center justify-center bg-black border-b md:border-b-0 md:border-r border-white/10 animate-in fade-in slide-in-from-left-8 duration-700 relative overflow-hidden">
                        {/* Ambient Background Effects */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-900/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative group cursor-pointer z-10" onClick={handleLogoTap}>
                            <img
                                src="/panther_logo.jpg"
                                alt="PantherPOS Logo"
                                className="h-32 md:h-56 w-auto object-contain relative transition-transform duration-700 hover:scale-105"
                            />
                        </div>
                        <div className="mt-4 md:mt-8 text-center z-10">
                            <h2 className="text-xl md:text-3xl font-black tracking-widest text-white uppercase">PantherPOS</h2>
                            <p className="text-gray-400 text-[10px] font-bold tracking-[0.4em] mt-1 md:mt-2 uppercase opacity-70">Enterprise Edition</p>
                        </div>
                        <div className="hidden md:grid mt-12 grid-cols-2 gap-4 w-full max-w-[280px] z-10">
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center backdrop-blur-sm">
                                <p className="text-xs font-bold text-green-400">Offline</p>
                                <p className="text-[10px] text-gray-500">Local Database</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center backdrop-blur-sm">
                                <p className="text-xs font-bold text-blue-400">Secure</p>
                                <p className="text-[10px] text-gray-500">256-Bit Encryp.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="md:w-1/2 p-6 md:p-10 animate-in fade-in slide-in-from-right-8 duration-700">
                        <div className="text-center mb-4 md:mb-8">
                            <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 italic text-foreground">Welcome Back</h1>
                            <p className="text-muted-foreground text-[10px] md:text-sm">Access your workspace with your secure role</p>
                        </div>

                        <div className="bg-muted p-1 rounded-xl flex mb-4 md:mb-8 border border-border">
                            <button
                                type="button"
                                onClick={() => { setActiveTab('ADMIN'); setUsername(''); }}
                                className={`flex-1 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ADMIN' ? 'bg-background text-primary shadow-lg border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ShieldCheck size={16} />
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveTab('CASHIER'); setUsername(''); }}
                                className={`flex-1 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'CASHIER' ? 'bg-background text-foreground shadow-lg border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <UserIcon size={16} />
                                Cashier
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">Account Identity</label>
                                <div className="relative group">
                                    {users.length > 0 ? (
                                        <select
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground focus:outline-none focus:border-primary/50 appearance-none font-medium"
                                        >
                                            <option value="" disabled>Select User</option>
                                            {users.filter(u => activeTab === 'ADMIN' ? u.role === 'ADMIN' : true).map(u => (
                                                <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                            placeholder={activeTab === 'ADMIN' ? 'admin' : 'cashier1'}
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">Access Key</label>
                                    <button type="button" className="text-xs text-primary hover:text-primary/80 font-medium">Forgot?</button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium tracking-widest placeholder:tracking-normal"
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg border border-destructive/20 font-bold">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 text-primary-foreground font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base border-none"
                            >
                                {loading ? 'Validating Token...' : 'Enter Workspace'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full p-4 md:p-6 text-center z-10 space-y-1 md:space-y-2">
                <p className="text-muted-foreground text-[10px] md:text-xs">
                    Need help? <button className="text-primary hover:text-primary/80">Contact Support</button>
                </p>
                <div className="pt-1">
                    <button
                        onClick={() => {
                            if (confirm("This will clear all local data on this device. Continue?")) {
                                localStorage.removeItem('pos_db_web');
                                window.location.reload();
                            }
                        }}
                        className="text-[9px] md:text-[10px] text-muted-foreground hover:text-destructive transition-colors uppercase tracking-widest font-bold"
                    >
                        Reset Local Database
                    </button>
                </div>
            </div>
            {/* Diagnostic Overlay (Themed) */}
            {
                showDiag && diagInfo && (
                    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-md p-6 overflow-y-auto font-mono text-xs">
                        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                            <h2 className="text-primary font-bold flex items-center gap-2 uppercase tracking-widest">
                                <Terminal size={16} /> System Diagnostics
                            </h2>
                            <button onClick={() => setShowDiag(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-muted rounded-lg border border-border">
                                <p className="text-muted-foreground uppercase text-[10px] font-bold">Platform</p>
                                <p className="font-bold text-foreground">{diagInfo.platform}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg border border-border">
                                <p className="text-muted-foreground uppercase text-[10px] font-bold">DB Ready</p>
                                <p className={`font-bold ${diagInfo.dbReady ? 'text-emerald-500' : 'text-destructive'}`}>
                                    {diagInfo.dbReady ? 'YES' : 'NO'}
                                </p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg border border-border">
                                <p className="text-muted-foreground uppercase text-[10px] font-bold">User Count</p>
                                <p className="font-bold text-foreground">{diagInfo.userCount}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg border border-border">
                                <p className="text-muted-foreground uppercase text-[10px] font-bold">Product Count</p>
                                <p className="font-bold text-primary">{diagInfo.productCount}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <button
                                onClick={async () => {
                                    await databaseService.forceSeed();
                                    loadUsers();
                                    alert("Administrator re-seeded!");
                                }}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 border-none"
                            >
                                Force Seed Admin Account
                            </button>
                        </div>

                        <div className="bg-surface p-4 rounded-xl border border-border mb-6">
                            <p className="text-muted-foreground mb-4 uppercase text-[10px] font-bold tracking-widest">Database Users (Raw Records)</p>
                            {diagInfo.rawUsers.length === 0 ? (
                                <p className="text-destructive italic">No users found in database table.</p>
                            ) : (
                                <div className="space-y-2">
                                    {diagInfo.rawUsers.map((u: any, i: number) => (
                                        <div key={i} className="p-3 bg-muted rounded-lg border border-border">
                                            <p className="font-bold text-primary">{u.name}</p>
                                            <p className="text-[10px] text-muted-foreground">ROLE: {u.role} | PIN: {u.pin}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-surface p-4 rounded-xl border border-border">
                            <p className="text-muted-foreground mb-4 uppercase text-[10px] font-bold tracking-widest">System Event Logs</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                                {diagInfo.logs.map((log: string, i: number) => (
                                    <p key={i} className="text-muted-foreground break-all border-b border-border/50 pb-1 last:border-0">{log}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
