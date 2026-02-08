
import { useState, useEffect, useMemo } from 'react';
import type { ProductGroup } from '../services/groupService';
import { groupService } from '../services/groupService';
import { productService } from '../services/productService';
import type { Product } from '../types/db';
import { Button } from './Button';
import { Modal } from './Modal';
import { Plus, Trash2, Search, X, Folder, Package, Edit, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface GroupManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GroupManager({ isOpen, onClose }: GroupManagerProps) {
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);
    const [groupProducts, setGroupProducts] = useState<Product[]>([]);

    // Group Management State
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [groupForm, setGroupForm] = useState({ name: '', description: '' });
    const [groupSearch, setGroupSearch] = useState('');

    // Product Management State
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadGroups();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupProducts(selectedGroup.id);
        } else {
            setGroupProducts([]);
        }
    }, [selectedGroup]);

    // Product Search Debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (productSearch && isAddingProduct) {
                setSearchLoading(true);
                const results = await productService.search(productSearch);
                setSearchResults(results);
                setSearchLoading(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [productSearch, isAddingProduct]);

    const loadGroups = async () => {
        const data = await groupService.getAll();
        setGroups(data);
    };

    const loadGroupProducts = async (groupId: number) => {
        const prod = await groupService.getGroupProducts(groupId);
        setGroupProducts(prod);
    };

    const handleSaveGroup = async () => {
        if (!groupForm.name) return;
        try {
            if (isEditing && selectedGroup) {
                await groupService.update(selectedGroup.id, groupForm.name, groupForm.description);
                // Update local state to reflect changes immediately
                const updatedGroups = groups.map(g => g.id === selectedGroup.id ? { ...g, ...groupForm } : g);
                setGroups(updatedGroups);
                setSelectedGroup({ ...selectedGroup, ...groupForm });
            } else {
                await groupService.create(groupForm.name, groupForm.description);
                loadGroups();
            }
            setGroupForm({ name: '', description: '' });
            setIsCreating(false);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save group:', error);
            alert('Failed to save group.');
        }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!confirm('Delete this group? Items will not be deleted from inventory.')) return;
        await groupService.delete(id);
        if (selectedGroup?.id === id) {
            setSelectedGroup(null);
        }
        loadGroups();
    };

    const handleAddProduct = async (product: Product) => {
        if (!selectedGroup) return;
        await groupService.addProduct(selectedGroup.id, product.id);
        loadGroupProducts(selectedGroup.id);
        loadGroups(); // Update counts
        setProductSearch('');
    };

    const handleRemoveProduct = async (productId: number) => {
        if (!selectedGroup) return;
        if (!confirm('Remove this product from the group?')) return;
        await groupService.removeProduct(selectedGroup.id, productId);
        loadGroupProducts(selectedGroup.id);
        loadGroups(); // Update counts
    };

    const openEditGroup = (e: React.MouseEvent, group: ProductGroup) => {
        e.stopPropagation();
        setGroupForm({ name: group.name, description: group.description });
        setSelectedGroup(group);
        setIsEditing(true);
    };

    const filteredGroups = useMemo(() => {
        return groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()));
    }, [groups, groupSearch]);

    const groupTotalValue = useMemo(() => {
        return groupProducts.reduce((sum, p) => sum + (p.sell_price * p.stock), 0);
    }, [groupProducts]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Product Groups" size="xl">
            <div className="flex flex-col h-[700px] overflow-hidden">
                {/* Horizontal Group Carousel Section */}
                <div className="shrink-0 border-b border-border bg-muted/5 p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={groupSearch}
                                onChange={e => setGroupSearch(e.target.value)}
                                placeholder="Search groups..."
                                className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                            />
                        </div>
                        <Button onClick={() => { setIsCreating(true); setGroupForm({ name: '', description: '' }); }} className="gap-2">
                            <Plus size={16} /> New Group
                        </Button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                        {filteredGroups.map(group => (
                            <div
                                key={group.id}
                                onClick={() => { setSelectedGroup(group); setIsAddingProduct(false); }}
                                className={clsx(
                                    "shrink-0 w-64 p-4 rounded-2xl border transition-all cursor-pointer snap-start group relative overflow-hidden",
                                    selectedGroup?.id === group.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]"
                                        : "bg-surface border-border hover:border-primary/50 hover:shadow-md"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <Folder size={20} className={selectedGroup?.id === group.id ? "text-primary-foreground" : "text-primary"} />
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => openEditGroup(e, group)}
                                            className={clsx("p-1.5 rounded-lg transition-colors", selectedGroup?.id === group.id ? "hover:bg-white/20" : "hover:bg-muted")}
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                                            className={clsx("p-1.5 rounded-lg transition-colors", selectedGroup?.id === group.id ? "hover:bg-white/20 text-white" : "hover:bg-destructive/10 text-destructive")}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-black text-lg truncate mb-1">{group.name}</h3>
                                <p className={clsx("text-xs truncate mb-3", selectedGroup?.id === group.id ? "opacity-80" : "text-muted-foreground")}>
                                    {group.description || "No description"}
                                </p>
                                <div className={clsx("text-[10px] font-mono p-2 rounded-lg inline-block font-bold", selectedGroup?.id === group.id ? "bg-white/20" : "bg-muted")}>
                                    {group.item_count || 0} ITEMS
                                </div>
                            </div>
                        ))}

                        {filteredGroups.length === 0 && (
                            <div className="w-full text-center py-8 text-muted-foreground text-sm font-bold opacity-50 uppercase tracking-widest">
                                {groups.length === 0 ? "Create your first group" : "No groups found"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-surface flex flex-col min-h-0 relative">
                    {selectedGroup ? (
                        <>
                            {/* Group Header Stats */}
                            <div className="p-6 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">{selectedGroup.name}</h2>
                                        <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-md font-black tracking-widest border border-primary/20">
                                            ACTIVE
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-xs mt-1 font-medium flex items-center gap-2">
                                        Total Inventory Value: <span className="text-foreground font-bold">₹{groupTotalValue.toLocaleString()}</span>
                                    </p>
                                </div>

                                <Button
                                    onClick={() => { setIsAddingProduct(!isAddingProduct); setProductSearch(''); }}
                                    className={clsx("shadow-glow transition-all", isAddingProduct ? "bg-muted text-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground")}
                                >
                                    {isAddingProduct ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                                    {isAddingProduct ? "Close Product Search" : "Add Products"}
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-hidden relative">
                                {isAddingProduct ? (
                                    <div className="absolute inset-0 bg-background/50 backdrop-blur-md z-20 p-6 flex flex-col animate-in fade-in duration-200">
                                        <div className="max-w-2xl mx-auto w-full flex flex-col h-full bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                                            <div className="p-4 border-b border-border bg-muted/30">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        autoFocus
                                                        value={productSearch}
                                                        onChange={e => setProductSearch(e.target.value)}
                                                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary/50 outline-none font-bold shadow-inner"
                                                        placeholder="Search products to add..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-2">
                                                {searchResults.map(p => {
                                                    const isInGroup = groupProducts.some(gp => gp.id === p.id);
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            disabled={isInGroup}
                                                            onClick={() => handleAddProduct(p)}
                                                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-all disabled:opacity-50 group border border-transparent hover:border-border"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                                                                    <Package size={18} className="text-muted-foreground" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="font-bold text-sm text-foreground">{p.name}</div>
                                                                    <div className="text-[10px] font-mono text-muted-foreground">{p.barcode}</div>
                                                                </div>
                                                            </div>
                                                            {!isInGroup ? (
                                                                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">ADD +</span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-muted-foreground px-3">ADDED</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                                {!productSearch && (
                                                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                                                        <Search size={48} className="mb-4" strokeWidth={1} />
                                                        <p className="font-black uppercase tracking-widest text-xs">Type to search inventory</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                                        {groupProducts.map(p => (
                                            <div key={p.id} className="bg-background border border-border rounded-xl p-4 flex justify-between items-start group hover:border-primary/50 hover:shadow-lg transition-all relative">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center shrink-0">
                                                        <span className="text-xs font-black text-muted-foreground">{p.stock}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-foreground line-clamp-1">{p.name}</h4>
                                                        <p className="text-[10px] font-mono text-muted-foreground mt-1">₹{p.sell_price}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveProduct(p.id)}
                                                    className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {groupProducts.length === 0 && (
                                            <div className="col-span-full h-64 flex flex-col items-center justify-center opacity-20">
                                                <Package size={64} strokeWidth={1} className="mb-4" />
                                                <p className="font-black uppercase tracking-widest text-sm">No products in this group</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-6">
                            <Folder size={120} strokeWidth={0.5} />
                            <p className="font-black text-2xl uppercase tracking-[0.2em]">Select a Group</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal Overlay */}
            {(isCreating || isEditing) && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 ring-1 ring-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-lg uppercase tracking-wider">{isEditing ? 'Edit Group' : 'New Group'}</h3>
                            <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="hover:bg-muted p-1 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Group Name</label>
                                <input
                                    autoFocus
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold focus:border-primary focus:outline-none transition-all"
                                    placeholder="e.g., Summer Sale"
                                    value={groupForm.name}
                                    onChange={e => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Description</label>
                                <textarea
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all resize-none h-24"
                                    placeholder="Optional details..."
                                    value={groupForm.description}
                                    onChange={e => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="secondary" onClick={() => { setIsCreating(false); setIsEditing(false); }} className="flex-1">Cancel</Button>
                                <Button onClick={handleSaveGroup} className="flex-1 bg-primary text-primary-foreground shadow-glow">
                                    {isEditing ? 'Save Changes' : 'Create Group'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
