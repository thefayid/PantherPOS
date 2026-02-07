import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { cn } from '../utils/cn';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    className?: string;
    emptyMessage?: string;
    isLoading?: boolean;
}

export function Table<T extends { id: number | string }>({
    data,
    columns,
    onRowClick,
    className = "",
    emptyMessage = "No items found",
    isLoading = false
}: TableProps<T>) {
    const { isTouchMode } = useUI();

    // Removed inline styles in favor of Tailwind classes

    return (
        <div className={cn(
            "w-full h-full flex flex-col overflow-hidden bg-surface/50 backdrop-blur-md border border-border shadow-sm",
            isTouchMode ? "rounded-2xl" : "rounded-lg",
            className
        )}>
            <div className="flex-1 overflow-auto relative custom-scrollbar">
                <table className="w-full border-collapse border-spacing-0">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className={cn(
                                    "sticky top-0 z-10 bg-muted/80 backdrop-blur-sm text-left uppercase tracking-widest text-muted-foreground border-b border-border",
                                    isTouchMode ? "px-5 py-4 text-[11px] font-black" : "px-4 py-2 text-[10px] font-bold",
                                    col.className?.includes('right') ? 'text-right' : col.className?.includes('center') ? 'text-center' : 'text-left',
                                    col.className
                                )}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <Loader2 size={24} className="animate-spin text-primary" />
                                        <span className="text-xs font-medium">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length > 0 ? (
                            data.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        "border-b border-border transition-colors text-foreground group hover:bg-muted/50",
                                        isTouchMode ? "touch-row text-sm" : "text-xs",
                                        onRowClick ? 'cursor-pointer' : 'default'
                                    )}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} className={cn(
                                            "whitespace-nowrap",
                                            isTouchMode ? "px-5 py-4" : "px-4 py-2",
                                            col.className?.includes('right') ? 'text-right' : col.className?.includes('center') ? 'text-center' : 'text-left'
                                        )}>
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="py-24 text-center">
                                    <div className="flex flex-col items-center opacity-50">
                                        <span className="text-muted-foreground text-sm font-medium">
                                            {emptyMessage}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
