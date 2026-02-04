import { useState, useEffect, useCallback } from 'react';
import { promotionService } from '../services/promotionService';
import type { Promotion, LoyaltyConfig } from '../types/db';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Plus, Pencil, Trash2, Tag, Award, Save, Info } from 'lucide-react';

export default function Promotions() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loyaltyConfigs, setLoyaltyConfigs] = useState<LoyaltyConfig[]>([]);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'OFFERS' | 'LOYALTY'>('OFFERS');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [promos, configs] = await Promise.all([
                promotionService.getAllPromotions(),
                promotionService.getLoyaltyConfigs()
            ]);
            setPromotions(promos);
            setLoyaltyConfigs(configs);
        } catch (error) {
            console.error('Failed to load promotions:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSavePromo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPromo?.id) {
                await promotionService.updatePromotion(editingPromo as Promotion);
            } else {
                await promotionService.createPromotion(editingPromo as Omit<Promotion, 'id'>);
            }
            setIsPromoModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save promotion');
        }
    };

    const handleDeletePromo = async (id: number) => {
        if (!confirm('Delete this promotion?')) return;
        await promotionService.deletePromotion(id);
        loadData();
    };

    const updateLoyaltyValue = async (key: string, value: string) => {
        await promotionService.updateLoyaltyConfig(key, value);
        loadData();
    };

    const openAddPromo = () => {
        setEditingPromo({
            name: '',
            type: 'COUPON',
            discount_type: 'PERCENT',
            discount_value: 0,
            min_cart_value: 0,
            max_discount: 0,
            active: true
        });
        setIsPromoModalOpen(true);
    };

    const openEditPromo = (promo: Promotion) => {
        setEditingPromo(promo);
        setIsPromoModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground uppercase tracking-tighter">Promotions & Loyalty</h1>
                    <p className="text-muted-foreground font-medium">Manage discounts, coupons and reward programs</p>
                </div>
                {activeTab === 'OFFERS' && (
                    <button
                        onClick={openAddPromo}
                        className="bg-primary hover:brightness-110 text-primary-foreground px-8 py-4 rounded-2xl shadow-glow font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                        <Plus size={18} /> Create Offer
                    </button>
                )}
            </div>

            <div className="flex gap-2 mb-6 p-1.5 bg-surface rounded-2xl border border-border w-fit shadow-sm">
                <button
                    onClick={() => setActiveTab('OFFERS')}
                    className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'OFFERS' ? 'bg-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    Discounts & Coupons
                </button>
                <button
                    onClick={() => setActiveTab('LOYALTY')}
                    className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'LOYALTY' ? 'bg-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    Loyalty Settings
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'OFFERS' ? (
                    <div className="h-full overflow-y-auto bg-surface rounded-2xl border border-border shadow-xl custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-md z-10">
                                <tr>
                                    <th className="p-5 border-b border-border">Promotion Package</th>
                                    <th className="p-5 border-b border-border">Benefit Model</th>
                                    <th className="p-5 border-b border-border">Current Status</th>
                                    <th className="p-5 border-b border-border text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {promotions.map(p => (
                                    <tr key={p.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
                                                    <Tag size={24} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-foreground flex items-center gap-2 text-sm uppercase tracking-tight">
                                                        {p.name}
                                                        {p.code && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20 font-mono tracking-widest">{p.code}</span>}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{p.type === 'COUPON' ? 'Coupon Driven' : 'Automated Algorthm'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-black text-xl text-primary">{p.discount_type === 'PERCENT' ? `${p.discount_value}%` : `₹${p.discount_value}`}</div>
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Threshold: ₹{p.min_cart_value}</div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${p.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm' : 'bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-sm'}`}>
                                                {p.active ? 'LIVE' : 'PAUSED'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditPromo(p)} className="p-3 hover:bg-blue-500/10 text-blue-500 rounded-xl transition-all shadow-sm">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => handleDeletePromo(p.id)} className="p-3 hover:bg-destructive/10 text-destructive rounded-xl transition-all shadow-sm">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {promotions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-20">
                                                <Tag size={64} strokeWidth={1} />
                                                <p className="font-black text-xs uppercase tracking-widest">No active promotion artifacts found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto pr-4 custom-scrollbar">
                        <div className="bg-surface rounded-2xl border border-border p-10 max-w-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-500">
                            <div className="flex items-center gap-5 mb-10 border-b border-border pb-8">
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 border border-purple-500/20 shadow-inner">
                                    <Award size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Loyalty Engine</h2>
                                    <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-70">Configure point accrual and redemption protocols</p>
                                </div>
                            </div>

                            <div className="grid gap-8">
                                {loyaltyConfigs.map((config) => (
                                    <div key={config.key} className="bg-muted/10 p-6 rounded-2xl border border-border/50 hover:border-primary/50 transition-all group shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{config.key.replace(/_/g, ' ')}</label>
                                            <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center text-primary/50 group-hover:scale-110 transition-transform">
                                                <Info size={14} />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={config.value}
                                                onChange={(e) => {
                                                    const newConfigs = loyaltyConfigs.map(c => c.key === config.key ? { ...c, value: e.target.value } : c);
                                                    setLoyaltyConfigs(newConfigs);
                                                }}
                                                onBlur={(e) => updateLoyaltyValue(config.key, e.target.value)}
                                                className="w-full h-14 px-5 bg-background text-foreground border border-border rounded-xl focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-black text-2xl shadow-inner pr-24"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 uppercase tracking-widest shadow-sm">
                                                {config.key.includes('rupee') ? 'POINTS' : 'COEFFICIENT'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title={editingPromo?.id ? 'Edit Offer Protocol' : 'Deploy New Offer'}>
                <div className="p-2 pt-4">
                    <form onSubmit={handleSavePromo} className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Deployment Model</label>
                                <select
                                    value={editingPromo?.type}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, type: e.target.value as any }))}
                                    className="w-full bg-muted/20 border border-border rounded-xl p-4 text-foreground font-bold focus:border-primary/50 focus:outline-none shadow-inner"
                                >
                                    <option value="COUPON" className="bg-surface font-bold">Manual Coupon Code</option>
                                    <option value="AUTOMATED" className="bg-surface font-bold">AI Automated Trigger</option>
                                </select>
                            </div>
                            {editingPromo?.type === 'COUPON' && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Secret Code</label>
                                    <input
                                        value={editingPromo?.code}
                                        onChange={e => setEditingPromo(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        className="w-full bg-muted/20 border border-border rounded-xl p-4 text-foreground focus:border-primary/50 focus:outline-none uppercase font-mono tracking-[0.3em] font-black shadow-inner"
                                        placeholder="CODE50"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Offer Label</label>
                            <input
                                value={editingPromo?.name}
                                onChange={e => setEditingPromo(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-muted/20 border border-border rounded-xl p-4 text-foreground font-black focus:border-primary/50 focus:outline-none shadow-inner"
                                placeholder="Public title for this offer"
                            />
                        </div>

                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 grid grid-cols-2 gap-6 items-center shadow-inner">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-primary uppercase tracking-widest">Benefit Type</label>
                                <select
                                    value={editingPromo?.discount_type}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, discount_type: e.target.value as any }))}
                                    className="w-full bg-background border border-primary/20 rounded-xl p-3 text-primary font-black focus:border-primary focus:outline-none shadow-sm"
                                >
                                    <option value="PERCENT" className="bg-surface">Relative Percent (%)</option>
                                    <option value="FLAT" className="bg-surface">Fixed Currency (₹)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-primary uppercase tracking-widest">Benefit Quantum</label>
                                <input
                                    type="number"
                                    value={editingPromo?.discount_value}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, discount_value: parseFloat(e.target.value) }))}
                                    className="w-full bg-background border border-primary/20 rounded-xl p-3 text-primary focus:border-primary focus:outline-none font-black text-2xl text-center shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Minimum Transaction</label>
                                <input
                                    type="number"
                                    value={editingPromo?.min_cart_value}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, min_cart_value: parseFloat(e.target.value) }))}
                                    className="w-full bg-muted/20 border border-border rounded-xl p-4 text-foreground font-bold focus:border-primary/50 focus:outline-none shadow-inner"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Operational Status</label>
                                <select
                                    value={editingPromo?.active ? 'true' : 'false'}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, active: e.target.value === 'true' }))}
                                    className="w-full bg-muted/20 border border-border rounded-xl p-4 text-foreground font-bold focus:border-primary/50 focus:outline-none shadow-inner"
                                >
                                    <option value="true" className="bg-surface">ACTIVE (LIVE)</option>
                                    <option value="false" className="bg-surface">PAUSED (OFFLINE)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
                            <Button variant="ghost" onClick={() => setIsPromoModalOpen(false)} type="button" className="flex-1 font-black uppercase tracking-widest text-[10px]">Decline</Button>
                            <Button type="submit" className="flex-1 bg-primary text-primary-foreground shadow-glow font-black uppercase tracking-widest text-[10px]">Deploy Protocol</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
