import { useState, useEffect } from 'react';
import { supplierService } from '../services/supplierService';
import type { Supplier } from '../types/db';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Search, Plus, User, Phone, MapPin, Hash, Trash2, Edit } from 'lucide-react';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

    useEffect(() => { loadSuppliers(); }, []);

    const loadSuppliers = async () => { setSuppliers(await supplierService.getAll()); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSupplier?.id) { await supplierService.update(editingSupplier.id, editingSupplier); }
            else { await supplierService.create(editingSupplier as Omit<Supplier, 'id'>); }
            setIsModalOpen(false); loadSuppliers();
        } catch (error) { alert('Failed to save supplier'); }
    };

    const handleDelete = async (id: number) => { if (confirm('Are you sure?')) { await supplierService.delete(id); loadSuppliers(); } };

    const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search));

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground font-medium">Manage your vendor relationships</p>
                </div>
                <button onClick={() => { setEditingSupplier({ name: '', phone: '', address: '', gst_no: '' }); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl shadow-glow font-bold flex items-center gap-2 transition-all">
                    <Plus size={20} /> Add New Supplier
                </button>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input type="text" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-muted/20 border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:border-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50" />
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-border shadow-xl">
                <div className="h-full overflow-y-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-4 font-medium border-b border-border">Vendor Name</th>
                                <th className="p-4 font-medium border-b border-border">Contact</th>
                                <th className="p-4 font-medium border-b border-border">Tax Details</th>
                                <th className="p-4 font-medium border-b border-border text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.map(s => (
                                <tr key={s.id} className="hover:bg-muted/50 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-foreground text-lg">{s.name}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><MapPin size={12} className="opacity-50" /> {s.address || 'No address provided'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="text-sm font-bold text-foreground flex items-center gap-2 bg-muted/50 px-2.5 py-1 rounded-lg border border-border w-fit"><Phone size={12} className="text-primary" /> {s.phone || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border w-fit">{s.gst_no || 'NO GSTIN'}</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingSupplier(s); setIsModalOpen(true); }} className="p-2 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 rounded-lg transition-colors"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier?.id ? 'Edit Supplier' : 'Add New Supplier'}>
                <form onSubmit={handleSave} className="flex flex-col gap-5 p-1">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Company Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input required className="w-full bg-muted/20 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none transition-all" value={editingSupplier?.name || ''} onChange={e => setEditingSupplier({ ...editingSupplier, name: e.target.value })} placeholder="Vendor Pvt Ltd" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input className="w-full bg-muted/20 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none transition-all" value={editingSupplier?.phone || ''} onChange={e => setEditingSupplier({ ...editingSupplier, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">GSTIN / Tax ID</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input className="w-full bg-muted/20 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none transition-all font-mono" value={editingSupplier?.gst_no || ''} onChange={e => setEditingSupplier({ ...editingSupplier, gst_no: e.target.value })} placeholder="22AAAAA0000A1Z5" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Business Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-4 text-muted-foreground" size={16} />
                                <textarea className="w-full bg-muted/20 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none transition-all resize-none h-24" value={editingSupplier?.address || ''} onChange={e => setEditingSupplier({ ...editingSupplier, address: e.target.value })} placeholder="123 Commerce St, Industry City" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border mt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white shadow-glow">Save Supplier Profile</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
