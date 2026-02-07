import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils/cn';

interface CartItem {
    id: number;
    name: string;
    sell_price: number;
    gst_rate: number;
    quantity: number;
    amount: number;
    hsn_code?: string;
}

interface GSTBreakdownPanelProps {
    items: CartItem[];
    isInterState: boolean;
    taxInclusive: boolean;
    discount?: number;
}

interface GSTRateGroup {
    rate: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    items: CartItem[];
}

interface GSTHSNGroup {
    hsn: string;
    rate: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    quantity: number;
    items: CartItem[];
}

export const GSTBreakdownPanel: React.FC<GSTBreakdownPanelProps> = ({
    items,
    isInterState,
    taxInclusive,
    discount = 0
}) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [viewMode, setViewMode] = React.useState<'RATE' | 'HSN'>('RATE');

    // Calculate GST breakdown by rate
    const calculateGSTBreakdown = (): GSTRateGroup[] => {
        const groups: Map<number, GSTRateGroup> = new Map();

        items.forEach(item => {
            const rate = item.gst_rate || 0;

            if (!groups.has(rate)) {
                groups.set(rate, {
                    rate,
                    taxableValue: 0,
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    totalTax: 0,
                    items: []
                });
            }

            const group = groups.get(rate)!;
            const itemTotal = item.sell_price * item.quantity;

            let taxableValue: number;
            let gstAmount: number;

            if (taxInclusive) {
                // Tax is included in the price
                taxableValue = itemTotal / (1 + rate / 100);
                gstAmount = itemTotal - taxableValue;
            } else {
                // Tax is added on top
                taxableValue = itemTotal;
                gstAmount = itemTotal * (rate / 100);
            }

            group.taxableValue += taxableValue;
            group.totalTax += gstAmount;

            if (isInterState) {
                group.igst += gstAmount;
            } else {
                group.cgst += gstAmount / 2;
                group.sgst += gstAmount / 2;
            }

            group.items.push(item);
        });

        return Array.from(groups.values()).sort((a, b) => a.rate - b.rate);
    };

    // Calculate GST breakdown by HSN
    const calculateHSNBreakdown = (): GSTHSNGroup[] => {
        const groups: Map<string, GSTHSNGroup> = new Map();

        items.forEach(item => {
            const hsn = item.hsn_code || 'N/A';
            const rate = item.gst_rate || 0;

            if (!groups.has(hsn)) {
                groups.set(hsn, {
                    hsn,
                    rate,
                    taxableValue: 0,
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    totalTax: 0,
                    quantity: 0,
                    items: []
                });
            }

            const group = groups.get(hsn)!;
            const itemTotal = item.sell_price * item.quantity;

            let taxableValue: number;
            let gstAmount: number;

            if (taxInclusive) {
                taxableValue = itemTotal / (1 + rate / 100);
                gstAmount = itemTotal - taxableValue;
            } else {
                taxableValue = itemTotal;
                gstAmount = itemTotal * (rate / 100);
            }

            group.taxableValue += taxableValue;
            group.totalTax += gstAmount;
            group.quantity += item.quantity;

            if (isInterState) {
                group.igst += gstAmount;
            } else {
                group.cgst += gstAmount / 2;
                group.sgst += gstAmount / 2;
            }

            group.items.push(item);
        });

        return Array.from(groups.values()).sort((a, b) => a.hsn.localeCompare(b.hsn));
    };

    // Color coding for tax rates
    const getRateColor = (rate: number): string => {
        if (rate === 0) return 'text-gray-500';
        if (rate <= 5) return 'text-green-600';
        if (rate <= 12) return 'text-blue-600';
        if (rate <= 18) return 'text-orange-600';
        return 'text-red-600';
    };

    const getRateBg = (rate: number): string => {
        if (rate === 0) return 'bg-gray-50';
        if (rate <= 5) return 'bg-green-50';
        if (rate <= 12) return 'bg-blue-50';
        if (rate <= 18) return 'bg-orange-50';
        return 'bg-red-50';
    };

    if (items.length === 0) return null;

    const breakdown = viewMode === 'RATE' ? calculateGSTBreakdown() : null;
    const hsnBreakdown = viewMode === 'HSN' ? calculateHSNBreakdown() : null;

    const totalTaxableValue = viewMode === 'RATE'
        ? breakdown!.reduce((sum, g) => sum + g.taxableValue, 0)
        : hsnBreakdown!.reduce((sum, g) => sum + g.taxableValue, 0);
    const totalTax = viewMode === 'RATE'
        ? breakdown!.reduce((sum, g) => sum + g.totalTax, 0)
        : hsnBreakdown!.reduce((sum, g) => sum + g.totalTax, 0);
    const grandTotal = totalTaxableValue + totalTax - discount;

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between hover:from-primary/10 hover:to-primary/15 transition-all"
            >
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase tracking-wide text-foreground">
                        GST Breakdown
                    </span>
                    <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-semibold",
                        isInterState ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    )}>
                        {isInterState ? 'IGST' : 'CGST+SGST'}
                    </span>
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Breakdown Content */}
            {isExpanded && (
                <div className="p-4 space-y-3">
                    {/* View Toggle */}
                    <div className="flex gap-2 pb-2 border-b border-border">
                        <button
                            onClick={() => setViewMode('RATE')}
                            className={cn(
                                "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
                                viewMode === 'RATE'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            By Rate
                        </button>
                        <button
                            onClick={() => setViewMode('HSN')}
                            className={cn(
                                "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
                                viewMode === 'HSN'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            By HSN
                        </button>
                    </div>

                    {/* Rate View */}
                    {viewMode === 'RATE' && breakdown && breakdown.map((group, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "rounded-lg p-3 border border-border/50",
                                getRateBg(group.rate)
                            )}
                        >
                            {/* Rate Header */}
                            <div className="flex items-center justify-between mb-2">
                                <span className={cn("font-bold text-sm", getRateColor(group.rate))}>
                                    @ {group.rate}% GST
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {group.items.length} item{group.items.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Tax Breakdown */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Taxable Value:</span>
                                    <span className="font-semibold">₹{group.taxableValue.toFixed(2)}</span>
                                </div>

                                {isInterState ? (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">IGST ({group.rate}%):</span>
                                        <span className="font-semibold text-blue-600">₹{group.igst.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">CGST ({group.rate / 2}%):</span>
                                            <span className="font-semibold text-green-600">₹{group.cgst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">SGST ({group.rate / 2}%):</span>
                                            <span className="font-semibold text-green-600">₹{group.sgst.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* HSN View */}
                    {viewMode === 'HSN' && hsnBreakdown && hsnBreakdown.map((group, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "rounded-lg p-3 border border-border/50",
                                getRateBg(group.rate)
                            )}
                        >
                            {/* HSN Header */}
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <span className="font-bold text-sm text-foreground">
                                        HSN: {group.hsn}
                                    </span>
                                    <span className={cn("ml-2 text-xs", getRateColor(group.rate))}>
                                        @ {group.rate}%
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    Qty: {group.quantity}
                                </span>
                            </div>

                            {/* Tax Breakdown */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Taxable Value:</span>
                                    <span className="font-semibold">₹{group.taxableValue.toFixed(2)}</span>
                                </div>

                                {isInterState ? (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">IGST ({group.rate}%):</span>
                                        <span className="font-semibold text-blue-600">₹{group.igst.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">CGST ({group.rate / 2}%):</span>
                                            <span className="font-semibold text-green-600">₹{group.cgst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">SGST ({group.rate / 2}%):</span>
                                            <span className="font-semibold text-green-600">₹{group.sgst.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Summary */}
                    <div className="pt-3 border-t border-border space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Taxable:</span>
                            <span className="font-bold">₹{totalTaxableValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Tax:</span>
                            <span className="font-bold text-primary">₹{totalTax.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Discount:</span>
                                <span className="font-bold text-red-600">-₹{discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base pt-2 border-t border-border">
                            <span className="font-black">Grand Total:</span>
                            <span className="font-black text-lg text-primary">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
