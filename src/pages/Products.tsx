import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import { productService } from '../services/productService';
import type { Product } from '../types/db';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ProductForm } from '../components/ProductForm';
import { Plus, Pencil, Trash2, Barcode, TrendingDown, Folder, Package, Search, Printer, FileText, Tag, ArrowUpDown, TrendingUp, Download, Upload, HelpCircle, FileSpreadsheet, Code, ClipboardList, Zap, LayoutGrid, List, Maximize2, Minimize2, Sparkles, X } from 'lucide-react';
import { useKeyboard } from '../hooks/useKeyboard';
import { commandGateway } from '../services/CommandGateway';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { auditService } from '../services/auditService';
import { notificationService } from '../services/notificationService';
import { inventoryService } from '../services/inventoryService';
import { exportService } from '../services/exportService';
import { GroupManager } from '../components/GroupManager';
import { groupService, type ProductGroup } from '../services/groupService';
import { InventoryStats } from '../components/InventoryStats';
import { QuickInventoryModal } from '../components/QuickInventoryModal';
import type { SortType } from '../components/FilterBar';
import MobileInventory from '../components/mobile/MobileInventory';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [viewingBarcode, setViewingBarcode] = useState<Product | undefined>(undefined);
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'all'>('all');
    const [search, setSearch] = useState('');
    const [groupSearch, setGroupSearch] = useState('');
    const [sortType, setSortType] = useState<SortType>('name_asc');
    const [isShrinkageModalOpen, setIsShrinkageModalOpen] = useState(false);
    const [shrinkageProduct, setShrinkageProduct] = useState<Product | undefined>(undefined);
    const [shrinkageQty, setShrinkageQty] = useState('');

    const [shrinkageReason, setShrinkageReason] = useState('Damaged');
    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
    const [isQuickInventoryOpen, setIsQuickInventoryOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState<'csv' | 'xml'>('csv');
    const [isGridView, setIsGridView] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Bulk Edit State
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<'EDIT' | 'DELETE' | 'PRINT'>('EDIT');
    const [bulkEditConfig, setBulkEditConfig] = useState<{
        field: 'sell_price' | 'cost_price' | 'stock' | 'gst_rate' | 'min_stock_level',
        operation: 'SET' | 'ADD' | 'SUBTRACT' | 'MULTIPLY',
        value: number
    }>({ field: 'sell_price', operation: 'SET', value: 0 });

    const loadProducts = useCallback(async () => {
        try {
            let data: Product[] = [];
            if (selectedGroupId === 'all') {
                data = await productService.getAll();
            } else {
                data = await groupService.getGroupProducts(selectedGroupId);
            }

            // Enrich with Group Info
            const associations = await groupService.getProductGroupAssociations();
            const productGroupMap = new Map<number, number>(); // ProductID -> GroupID (first found)

            associations.forEach(assoc => {
                if (!productGroupMap.has(assoc.product_id)) {
                    productGroupMap.set(assoc.product_id, assoc.group_id);
                }
            });

            const enriched = data.map(p => ({
                ...p,
                group_id: productGroupMap.get(p.id)
            }));

            setProducts(enriched);
        } catch (error) { console.error('Failed to load products:', error); }
    }, [selectedGroupId]);

    const loadGroups = useCallback(async () => { try { const data = await groupService.getAll(); setGroups(data); } catch (error) { console.error('Failed to load groups:', error); } }, []);

    useEffect(() => { loadProducts(); loadGroups(); const interval = setInterval(() => { loadProducts(); }, 5000); return () => clearInterval(interval); }, [loadProducts, loadGroups]);

    const processedProducts = useMemo(() => {
        let result = [...products];
        if (search) { const q = search.toLowerCase(); result = result.filter(p => p.name.toLowerCase().includes(q) || p.barcode.includes(q) || (p.hsn_code && p.hsn_code.includes(q))); }
        // Filter logic removed or needs update if filterType was used
        result.sort((a, b) => {
            if (sortType === 'name_asc') return a.name.localeCompare(b.name);
            if (sortType === 'price_desc') return b.sell_price - a.sell_price;
            if (sortType === 'stock_asc') return a.stock - b.stock;
            if (sortType === 'stock_desc') return b.stock - a.stock;
            return 0;
        });
        return result;
    }, [products, search, sortType]);

    useKeyboard({ 'f': (e) => { if (e.ctrlKey) { e.preventDefault(); (document.querySelector('input[placeholder="Search products..."]') as HTMLInputElement)?.focus(); } } });

    const handleSave = async (data: Omit<Product, 'id'>) => {
        try { if (editingProduct) { await productService.update({ ...data, id: editingProduct.id }); } else { await productService.create(data); } setIsModalOpen(false); setEditingProduct(undefined); loadProducts(); } catch (error) { alert('Failed to save product.'); console.error(error); }
    };
    const handleDelete = async (id: number) => { if (!confirm('Are you sure you want to delete this product?')) return; try { await productService.delete(id); await auditService.log('PRODUCT_DELETE', { id }); loadProducts(); } catch (error) { console.error(error); } };
    const openEdit = (product: Product) => { setEditingProduct(product); setIsModalOpen(true); };
    const openAdd = () => { setEditingProduct(undefined); setIsModalOpen(true); };
    const handleReportShrinkage = async () => {
        if (!shrinkageProduct || !shrinkageQty) return;
        try { await inventoryService.reportShrinkage(shrinkageProduct.id, parseFloat(shrinkageQty), shrinkageReason); setIsShrinkageModalOpen(false); setShrinkageQty(''); loadProducts(); await auditService.log('SHRINKAGE_REPORT', { product: shrinkageProduct.name, qty: parseFloat(shrinkageQty), reason: shrinkageReason }); notificationService.checkStockLevels(); alert('Shrinkage reported successfully.'); } catch (error) { console.error(error); alert('Failed to report shrinkage.'); }
    };

    const handleSmartPurchase = async () => {
        try {
            const result = await commandGateway.execute({ type: 'GENERATE_PO', payload: {} });
            if (result.success) {
                alert(result.message.replace(/\*\*/g, '').replace(/\\n/g, '\n'));
            } else {
                alert('Smart Purchase failed: ' + result.message);
            }
        } catch (error) {
            console.error('Smart Purchase Error:', error);
            alert('An error occurred during Smart Purchase generation.');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedProductIds(processedProducts.map(p => p.id));
        } else {
            setSelectedProductIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedProductIds(prev => [...prev, id]);
        } else {
            setSelectedProductIds(prev => prev.filter(pid => pid !== id));
        }
    };

    const executeBulkEdit = async () => {
        if (!selectedProductIds.length) return;
        if (!confirm(`Are you sure you want to update ${selectedProductIds.length} products?`)) return;

        const toastId = toast.loading('Applying bulk updates...');
        try {
            if (bulkEditConfig.operation === 'SET') {
                // Simple update
                await productService.bulkUpdate(selectedProductIds, { [bulkEditConfig.field]: bulkEditConfig.value });
            } else {
                // Formula update
                await productService.bulkFormulaUpdate(selectedProductIds, bulkEditConfig.field as any, bulkEditConfig.operation, bulkEditConfig.value);
            }
            toast.success('Bulk update complete!', { id: toastId });
            setIsBulkEditModalOpen(false);
            setSelectedProductIds([]);
            loadProducts();
        } catch (e) {
            console.error(e);
            toast.error('Failed to update products', { id: toastId });
        }
    };

    const executeBulkDelete = async () => {
        if (!selectedProductIds.length) return;
        if (!confirm(`WARNING: You are about to DELETE ${selectedProductIds.length} products. This cannot be undone. Confirm?`)) return;

        const toastId = toast.loading('Deleting products...');
        try {
            for (const id of selectedProductIds) {
                await productService.delete(id);
            }
            await auditService.log('BULK_DELETE', { count: selectedProductIds.length, ids: selectedProductIds });
            toast.success('Products deleted', { id: toastId });
            setSelectedProductIds([]);
            loadProducts();
        } catch (e) {
            toast.error('Failed to delete some products', { id: toastId });
        }
    };

    return (
        <div className="h-full bg-background text-foreground overflow-hidden relative">

            {/* Bulk Action Bar (Floating) */}
            {selectedProductIds.length > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-background border border-primary/50 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                    <span className="font-bold text-primary">{selectedProductIds.length} Selected</span>
                    <div className="h-4 w-px bg-border" />
                    <Button size="sm" onClick={() => { setBulkAction('EDIT'); setIsBulkEditModalOpen(true); }} className="rounded-full">
                        <Pencil size={14} className="mr-2" /> Bulk Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => alert('Coming soon')} className="rounded-full">
                        <Barcode size={14} className="mr-2" /> Print Labels
                    </Button>
                    <Button size="sm" variant="danger" onClick={executeBulkDelete} className="rounded-full">
                        <Trash2 size={14} className="mr-2" /> Delete
                    </Button>
                    <div className="h-4 w-px bg-border" />
                    <button onClick={() => setSelectedProductIds([])} className="text-muted-foreground hover:text-foreground">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Bulk Edit Modal */}
            <Modal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} title={`Bulk Edit ${selectedProductIds.length} Products`}>
                <div className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Field to Update</label>
                            <select
                                className="w-full p-2 border rounded bg-background"
                                value={bulkEditConfig.field}
                                onChange={e => setBulkEditConfig({ ...bulkEditConfig, field: e.target.value as any })}
                            >
                                <option value="sell_price">Selling Price</option>
                                <option value="cost_price">Cost Price</option>
                                <option value="stock">Stock Quantity</option>
                                <option value="gst_rate">GST Rate (%)</option>
                                <option value="min_stock_level">Min Stock Level</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Action</label>
                            <select
                                className="w-full p-2 border rounded bg-background"
                                value={bulkEditConfig.operation}
                                onChange={e => setBulkEditConfig({ ...bulkEditConfig, operation: e.target.value as any })}
                            >
                                <option value="SET">Set To (Fixed Value)</option>
                                <option value="ADD">Increase By (+)</option>
                                <option value="SUBTRACT">Decrease By (-)</option>
                                {['sell_price', 'cost_price'].includes(bulkEditConfig.field) && (
                                    <option value="MULTIPLY">Multiply By (e.g. 1.10 for +10%)</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Value</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded bg-background"
                            value={bulkEditConfig.value}
                            onChange={e => setBulkEditConfig({ ...bulkEditConfig, value: parseFloat(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {bulkEditConfig.operation === 'MULTIPLY' ? 'Example: 1.10 = +10%, 0.90 = -10%' : 'Enter the value to apply'}
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setIsBulkEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={executeBulkEdit}>Apply Updates</Button>
                    </div>
                </div>
            </Modal>

            {/* Mobile View */}
            <div className="md:hidden h-full">
                <MobileInventory
                    products={processedProducts}
                    search={search}
                    onSearchChange={setSearch}
                    onAdd={openAdd}
                    onEdit={openEdit}
                    groups={groups}
                    selectedGroupId={selectedGroupId}
                    onSelectGroup={setSelectedGroupId}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex flex-col h-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                        <p className="text-muted-foreground">Manage your inventory and pricing</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => setIsShrinkageModalOpen(true)} variant="secondary" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                            <TrendingDown size={18} className="mr-2" />
                            Report Shrinkage
                        </Button>
                        <Button
                            onClick={handleSmartPurchase}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg border-none animate-in zoom-in-95 duration-300"
                        >
                            <Sparkles size={18} className="mr-2" />
                            Smart Purchase
                        </Button>
                        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                            <Plus size={20} className="mr-2" />
                            Add Product
                        </Button>
                    </div>
                </div>

                {/* Toolbar Options */}
                <div className="mb-6 flex flex-wrap gap-2">
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => window.print()}>
                        <Printer size={16} className="mr-2" /> Print
                    </Button>
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => exportService.generateInventoryCountSheet(processedProducts)}>
                        <ClipboardList size={16} className="mr-2" /> Inventory count report
                    </Button>
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => setIsQuickInventoryOpen(true)}>
                        <Zap size={16} className="mr-2" /> Quick inventory
                    </Button>
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => exportService.exportToPdf('Product_List.pdf', 'Product List', processedProducts.map(p => ({ Name: p.name, Barcode: p.barcode, Price: p.sell_price, Stock: p.stock })))}>
                        <FileText size={16} className="mr-2" /> Save PDF
                    </Button>
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => alert('Feature coming soon: Bulk Price Tag Printing')}>
                        <Tag size={16} className="mr-2" /> Price tags
                    </Button>
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => {
                        const next = sortType === 'name_asc' ? 'price_desc' : sortType === 'price_desc' ? 'stock_asc' : sortType === 'stock_asc' ? 'stock_desc' : 'name_asc';
                        setSortType(next as any);
                    }}>
                        <ArrowUpDown size={16} className="mr-2" /> Sorting
                    </Button>
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => {
                        const totalCost = processedProducts.reduce((sum, p) => sum + (p.cost_price * p.stock), 0);
                        const totalStock = processedProducts.reduce((sum, p) => sum + p.stock, 0);
                        const avg = totalStock ? (totalCost / totalStock).toFixed(2) : 0;
                        alert(`Average Moving Price (Inventory Value / Total Units): ₹${avg}`);
                    }}>
                        <TrendingUp size={16} className="mr-2" /> Mov. avg
                    </Button>
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => document.getElementById('import-input')?.click()}>
                        <Download size={16} className="mr-2" /> Import
                    </Button>
                    <input
                        id="import-input"
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const toastId = toast.loading('Reading file...');
                            try {
                                // Dynamic import to avoid bundle size if not used
                                const { importService } = await import('../services/importService');
                                const products = await importService.parseProductFile(file);

                                if (products.length === 0) {
                                    toast.error('No valid products found in file.', { id: toastId });
                                    return;
                                }

                                toast.loading(`Importing ${products.length} products...`, { id: toastId });

                                // Map imported items to strict Product type (ensure no undefined numbers)
                                const validProducts = products.map(p => ({
                                    ...p,
                                    gst_rate: p.gst_rate || 0,
                                    hsn_code: p.hsn_code || '',
                                    min_stock_level: p.min_stock_level || 5, // Default to 5
                                    image: undefined, // Explicit undefined for optional matches
                                    variant_group_id: undefined,
                                    attributes: undefined
                                }));

                                const result = await productService.bulkCreate(validProducts);

                                toast.success(`Imported: ${result.imported}, Failed: ${result.failed}`, { id: toastId });
                                loadProducts();
                            } catch (error: any) {
                                console.error('Import failed', error);
                                toast.error(`Import Failed: ${error.message}`, { id: toastId });
                            } finally {
                                // Reset input
                                e.target.value = '';
                            }
                        }}
                    />
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => setIsExportModalOpen(true)}>
                        <Upload size={16} className="mr-2" /> Export
                    </Button>
                    <Button variant="secondary" className="bg-surface border-border hover:bg-muted" onClick={() => alert('Product Management Help:\n\n- Add/Edit: Use buttons or click row\n- Import: CSV format (Name, Barcode, Price, Cost, Stock)\n- Sorting: Toggles Name/Price/Stock')}>
                        <HelpCircle size={16} className="mr-2" /> Help
                    </Button>
                    <div className="flex-1" />
                    <div className="flex gap-2 bg-surface p-1 rounded-lg border border-border shadow-sm">
                        <button
                            onClick={() => setIsGridView(false)}
                            className={`p-1.5 rounded-md transition-all ${!isGridView ? 'bg-primary text-white shadow-glow' : 'text-muted-foreground hover:bg-muted'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setIsGridView(true)}
                            className={`p-1.5 rounded-md transition-all ${isGridView ? 'bg-primary text-white shadow-glow' : 'text-muted-foreground hover:bg-muted'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    <Button
                        variant="secondary"
                        className={`border-border ${isFullScreen ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface hover:bg-muted'}`}
                        onClick={() => setIsFullScreen(!isFullScreen)}
                    >
                        {isFullScreen ? <Minimize2 size={18} className="mr-2" /> : <Maximize2 size={18} className="mr-2" />}
                        {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                    </Button>
                </div>

                {/* Quick Stats */}
                {!isFullScreen && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <InventoryStats products={products} />
                    </div>
                )}

                {/* Main Content Area - Split View (Sidebar + Table) */}
                <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">

                    {/* Left Sidebar: Groups */}
                    {!isFullScreen && (
                        <div className="w-64 flex flex-col bg-surface rounded-xl border border-border shadow-lg overflow-hidden shrink-0 animate-in slide-in-from-left-4 duration-300">
                            <div className="p-4 border-b border-border bg-muted/10 space-y-3">
                                <h2 className="font-bold text-foreground flex items-center gap-2">
                                    <Folder size={18} className="text-primary" />
                                    Groups
                                </h2>
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3" />
                                    <input
                                        type="text"
                                        placeholder="Find group..."
                                        value={groupSearch}
                                        onChange={e => setGroupSearch(e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-lg pl-7 pr-2 py-1.5 text-xs focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                <button
                                    onClick={() => setSelectedGroupId('all')}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between group ${selectedGroupId === 'all' ? 'bg-primary text-white shadow-glow' : 'hover:bg-muted text-muted-foreground'}`}
                                >
                                    <span>All Products</span>
                                    {selectedGroupId === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </button>
                                {groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase())).map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setSelectedGroupId(g.id)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between group ${selectedGroupId === g.id ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted text-muted-foreground text-foreground'}`}
                                    >
                                        <span className={selectedGroupId === g.id ? 'font-bold' : ''}>{g.name}</span>
                                        {g.item_count ? (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedGroupId === g.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                {g.item_count}
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                            <div className="p-2 border-t border-border bg-muted/5">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full justify-center text-xs"
                                    onClick={() => setIsGroupManagerOpen(true)}
                                >
                                    <Folder size={14} className="mr-2" />
                                    Manage Groups
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Right Content: Search & Table */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">

                        {/* Search & Filter Bar */}
                        <div className="bg-surface p-3 rounded-xl border border-border flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-muted/20 text-foreground pl-9 pr-4 py-2 rounded-lg border border-border focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border">
                                    <Package size={14} />
                                    <span>{processedProducts.length} Items</span>
                                </div>
                                <select
                                    value={sortType}
                                    onChange={(e) => setSortType(e.target.value as SortType)}
                                    className="bg-muted/20 border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none cursor-pointer hover:bg-muted/30 transition-colors"
                                >
                                    <option value="name_asc">Name (A-Z)</option>
                                    <option value="price_desc">Price (High-Low)</option>
                                    <option value="stock_asc">Stock (Low-High)</option>
                                </select>
                            </div>
                        </div>

                        {/* Table or Grid Area */}
                        <div className="flex-1 bg-surface rounded-xl border border-border flex flex-col overflow-hidden shadow-xl transition-all duration-300">
                            <div className="flex-1 overflow-auto p-1">
                                {!isGridView ? (
                                    <Table
                                        data={processedProducts}
                                        columns={[
                                            {
                                                header: (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                            checked={selectedProductIds.length === processedProducts.length && processedProducts.length > 0}
                                                            onChange={e => handleSelectAll(e.target.checked)}
                                                        />
                                                        <span>Product Details</span>
                                                    </div>
                                                ),
                                                accessor: (p) => (
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex items-center h-full pt-2" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                checked={selectedProductIds.includes(p.id)}
                                                                onChange={e => handleSelectOne(p.id, e.target.checked)}
                                                            />
                                                        </div>
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-muted to-background border border-border flex items-center justify-center flex-shrink-0">
                                                            <span className="text-lg font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                                                {p.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">
                                                                    {p.barcode}
                                                                </span>
                                                                {(p as any).group_id && (
                                                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/10">
                                                                        {groups.find(g => g.id === (p as any).group_id)?.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                                className: 'w-[40%]'
                                            },
                                            {
                                                header: 'Price (₹)',
                                                accessor: (p) => (
                                                    <div>
                                                        <div className="font-bold text-emerald-500">₹{p.sell_price.toFixed(2)}</div>
                                                        <div className="text-xs text-muted-foreground">Cost: ₹{p.cost_price}</div>
                                                    </div>
                                                )
                                            },
                                            {
                                                header: 'Stock',
                                                accessor: (p) => (
                                                    <div>
                                                        <div className={`font-bold ${p.stock <= (p.min_stock_level || 5) ? 'text-destructive' : 'text-foreground'}`}>
                                                            {p.stock}
                                                        </div>
                                                        {p.stock <= (p.min_stock_level || 5) && (
                                                            <span className="text-[10px] text-destructive animate-pulse font-medium">Low Stock</span>
                                                        )}
                                                    </div>
                                                )
                                            },
                                            {
                                                header: 'Actions',
                                                className: 'text-right',
                                                accessor: (p) => (
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setViewingBarcode(p); }}
                                                            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                            title="Print Barcode"
                                                        >
                                                            <Barcode size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                                                            className="p-2 hover:bg-blue-500/10 rounded-lg text-muted-foreground hover:text-blue-500 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                                            className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )
                                            }
                                        ]}
                                    />
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 p-3">
                                        {processedProducts.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => openEdit(p)}
                                                className="group relative bg-muted/10 border border-border hover:border-primary/50 rounded-xl p-3 transition-all hover:shadow-lg cursor-pointer flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <span className="text-lg font-bold text-primary">
                                                        {p.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="w-full flex flex-col items-center">
                                                    <div className="font-bold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors" title={p.name}>
                                                        {p.name}
                                                    </div>
                                                    <div className="text-xs font-mono text-muted-foreground mb-2 opacity-50">
                                                        {p.barcode}
                                                    </div>
                                                    <div className="w-full flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                                                        <span className="text-emerald-500 font-bold text-xs font-mono">₹{p.sell_price}</span>
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-[10px] font-bold ${p.stock <= (p.min_stock_level || 5) ? 'text-destructive' : 'text-foreground'}`}>
                                                                Qty: {p.stock}
                                                            </span>
                                                            {p.stock <= (p.min_stock_level || 5) && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Hover Actions */}
                                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setViewingBarcode(p); }}
                                                        className="p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-muted-foreground hover:text-foreground shadow-sm"
                                                    >
                                                        <Barcode size={12} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                                        className="p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-muted-foreground hover:text-destructive shadow-sm"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
                <ProductForm initialData={editingProduct} onSubmit={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <Modal isOpen={!!viewingBarcode} onClose={() => setViewingBarcode(undefined)} title="Product Barcode">
                {viewingBarcode && <BarcodeLabel value={viewingBarcode.barcode} name={viewingBarcode.name} price={viewingBarcode.sell_price} />}
            </Modal>

            {/* Group Manager handles its own Modal */}
            <GroupManager onClose={() => setIsGroupManagerOpen(false)} isOpen={isGroupManagerOpen} />

            <QuickInventoryModal
                isOpen={isQuickInventoryOpen}
                onClose={() => setIsQuickInventoryOpen(false)}
                onUpdate={loadProducts}
            />

            <Modal isOpen={isShrinkageModalOpen} onClose={() => setIsShrinkageModalOpen(false)} title="Report Shrinkage">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Select Product</label>
                        <select
                            className="w-full bg-muted/20 border border-border rounded p-2 text-foreground"
                            onChange={e => {
                                const p = products.find(prod => prod.id === parseInt(e.target.value));
                                setShrinkageProduct(p);
                            }}
                            value={shrinkageProduct?.id || ''}
                        >
                            <option value="">Select a product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Quantity Lost</label>
                        <input
                            type="number"
                            className="w-full bg-muted/20 border border-border rounded p-2 text-foreground"
                            value={shrinkageQty}
                            onChange={e => setShrinkageQty(e.target.value)}
                            placeholder="e.g. 1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Reason</label>
                        <select
                            className="w-full bg-muted/20 border border-border rounded p-2 text-foreground"
                            value={shrinkageReason}
                            onChange={e => setShrinkageReason(e.target.value)}
                        >
                            <option value="Damaged">Damaged</option>
                            <option value="Expired">Expired</option>
                            <option value="Theft">Theft</option>
                            <option value="Consumed">Internal Consumption</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setIsShrinkageModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleReportShrinkage}>Report Loss</Button>
                    </div>
                </div>
            </Modal>


            <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Select export type">
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <button
                            onClick={() => setExportType('csv')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${exportType === 'csv' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/50'}`}
                        >
                            <FileSpreadsheet size={20} />
                            <span className="font-medium">CSV (Excel)</span>
                        </button>

                        <button
                            onClick={() => setExportType('xml')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${exportType === 'xml' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/50'}`}
                        >
                            <Code size={20} />
                            <span className="font-medium">XML</span>
                        </button>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border border-border text-sm space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Items to export:</span>
                            <span className="font-bold text-foreground">{processedProducts.length}</span>
                        </div>
                        {selectedGroupId !== 'all' && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Filter (Group):</span>
                                <span className="font-bold text-primary">{groups.find(g => g.id === selectedGroupId)?.name}</span>
                            </div>
                        )}
                        {search && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Filter (Search):</span>
                                <span className="font-bold text-primary">"{search}"</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                        <Button variant="ghost" onClick={() => setIsExportModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={async () => {
                                try {
                                    // Filter out large fields like images to prevent Excel limit errors
                                    const exportData = processedProducts.map(p => {
                                        const groupName = groups.find(g => g.id === (p as any).group_id)?.name || 'General';
                                        const cost = p.cost_price || 0;
                                        const price = p.sell_price || 0;
                                        const markup = cost > 0 ? ((price - cost) / cost * 100).toFixed(2) : '0';

                                        return {
                                            Name: p.name,
                                            ProductGroup: groupName,
                                            SKU: p.barcode, // Fallback to barcode as SKU
                                            Barcode: p.barcode,
                                            MeasurementUnit: 'Unit', // Default
                                            Cost: cost,
                                            Markup: markup,
                                            Price: price,
                                            Tax: p.gst_rate || 0,
                                            IsTaxInclusivePrice: 'FALSE',
                                            IsPriceChangeAllowed: 'TRUE',
                                            IsUsingDefaultQuantity: 'TRUE',
                                            IsService: 'FALSE',
                                            IsEnabled: 'TRUE',
                                            Description: '',
                                            Quantity: p.stock || 0,
                                            Supplier: 'General', // No direct supplier link in Product table yet
                                            ReorderPoint: p.min_stock_level || 5,
                                            PreferredQuantity: (p.min_stock_level || 5) * 2, // Arbitrary logic: 2x min stock
                                            LowStockWarning: (p.stock || 0) <= (p.min_stock_level || 5) ? 'TRUE' : 'FALSE',
                                            WarningQuantity: p.min_stock_level || 5
                                        };
                                    });

                                    console.log('Starting export...', exportType);
                                    if (exportType === 'csv') {
                                        await exportService.exportToExcel('Products.xlsx', exportData);
                                    } else {
                                        await exportService.exportToXml('Products.xml', exportData);
                                    }
                                    setIsExportModalOpen(false);
                                    // alert('Export initiated properly. check downloads or save location.');
                                } catch (error: any) {
                                    console.error('Export failed:', error);
                                    alert(`Export failed: ${error.message || error}`);
                                }
                            }}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </Modal>


            {/* Print Styles */}
            <style>{`
                @media print {
                    .w-64, /* Sidebar */
                    button, /* All buttons */
                    input, select, /* Inputs */
                    .mb-6.flex, /* Header/Toolbar containers */
                    .border-b /* Separators */
                    { display: none !important; }
                    
                    /* Exception: Keep Table Headers content visible but maybe style differently? Table handles itself usually. */
                    
                    /* Maximize Table */
                    .overflow-auto { overflow: visible !important; }
                    .h-full { height: auto !important; }
                    
                    body { background: white !important; color: black !important; }
                }
            `}</style>
        </div>
    );
}
