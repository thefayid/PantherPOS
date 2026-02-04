import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

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

    // Removed inline styles in favor of Tailwind classes

    return (
        <div className={clsx("w-full h-full flex flex-col rounded-2xl overflow-hidden bg-surface/50 backdrop-blur-md border border-border shadow-sm", className)}>
            <div className="flex-1 overflow-auto relative custom-scrollbar">
                <table className="w-full border-collapse border-spacing-0">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className={clsx(
                                    "sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border",
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
                                    className={clsx(
                                        "border-b border-border transition-colors text-foreground text-sm group",
                                        onRowClick ? 'cursor-pointer hover:bg-muted/50' : 'default'
                                    )}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} className={clsx(
                                            "px-4 py-3 whitespace-nowrap",
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
