import React from 'react';
import type { Task } from '../../types/db';
import { StatusBadge, PriorityBadge } from './TaskBadges';
import { Calendar, User as UserIcon, Tag } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    onClick?: () => void;
    compact?: boolean; // For Kanban view
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, compact }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE';

    return (
        <div
            onClick={onClick}
            className={`
                bg-white border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer relative group
                ${isOverdue ? 'border-l-4 border-l-red-500' : 'border-gray-200'}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <PriorityBadge priority={task.priority} />
                {!compact && <StatusBadge status={task.status} />}
            </div>

            <h3 className="font-medium text-gray-800 mb-1 line-clamp-2">{task.title}</h3>

            {!compact && task.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500">
                <div className="flex items-center gap-3">
                    {task.assignee_id && (
                        <div className="flex items-center gap-1" title="Assignee">
                            <UserIcon size={12} />
                            <span>user #{task.assignee_id}</span>
                        </div>
                    )}
                    {task.due_date && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            <Calendar size={12} />
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {task.tags && typeof task.tags === 'string' && (() => {
                    try {
                        const tags = JSON.parse(task.tags);
                        if (!Array.isArray(tags)) return null;
                        return (
                            <div className="flex gap-1">
                                {tags.slice(0, 2).map((tag: string, i: number) => (
                                    <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        );
                    } catch (e) {
                        return null;
                    }
                })()}
            </div>
        </div>
    );
};
