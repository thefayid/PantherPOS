import React from 'react';

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const getColors = (s: string) => {
        switch (s) {
            case 'TODO': return 'bg-gray-100 text-gray-800';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
            case 'WAITING': return 'bg-yellow-100 text-yellow-800';
            case 'DONE': return 'bg-green-100 text-green-800';
            case 'ARCHIVED': return 'bg-gray-200 text-gray-600';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatStatus = (s: string) => s.replace('_', ' ');

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getColors(status)}`}>
            {formatStatus(status)}
        </span>
    );
};

interface PriorityBadgeProps {
    priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
    const getColors = (p: string) => {
        switch (p) {
            case 'LOW': return 'bg-slate-100 text-slate-600';
            case 'MEDIUM': return 'bg-blue-50 text-blue-600';
            case 'HIGH': return 'bg-orange-100 text-orange-700';
            case 'CRITICAL': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <span className={`px-2 py-0.5 rounded border text-[10px] font-medium uppercase tracking-wider ${getColors(priority)}`}>
            {priority}
        </span>
    );
};
