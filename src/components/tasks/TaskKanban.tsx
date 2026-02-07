import React, { useState, useEffect } from 'react';
import type { Task } from '../../types/db';
import { TaskCard } from './TaskCard';
import { taskService } from '../../services/taskService';
import { Database } from 'lucide-react';

interface TaskKanbanProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onTaskUpdate: () => void; // Trigger refresh
}

const COLUMNS = [
    { id: 'TODO', label: 'To Do', color: 'bg-gray-50' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50' },
    { id: 'WAITING', label: 'Waiting', color: 'bg-yellow-50' },
    { id: 'DONE', label: 'Done', color: 'bg-green-50' }
];

export const TaskKanban: React.FC<TaskKanbanProps> = ({ tasks, onTaskClick, onTaskUpdate }) => {
    const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        setDraggingTaskId(taskId);
        e.dataTransfer.setData('taskId', taskId.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        const taskIdStr = e.dataTransfer.getData('taskId');
        if (!taskIdStr) return;

        const taskId = parseInt(taskIdStr);
        setDraggingTaskId(null);

        // Optimistic update could happen here, but for simplicity we wait for DB
        try {
            await taskService.update(taskId, { status: status as any });
            onTaskUpdate();
        } catch (error) {
            console.error("Failed to move task", error);
        }
    };

    return (
        <div className="flex gap-4 overflow-x-auto h-full pb-2">
            {COLUMNS.map(col => {
                const colTasks = tasks.filter(t => t.status === col.id);

                return (
                    <div
                        key={col.id}
                        className={`flex-shrink-0 w-80 rounded-lg flex flex-col ${col.color} border border-transparent`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        <div className="p-3 font-semibold text-gray-700 flex justify-between items-center sticky top-0 bg-inherit rounded-t-lg z-10">
                            <h3>{col.label}</h3>
                            <span className="text-xs bg-white px-2 py-0.5 rounded-full shadow-sm text-gray-500">
                                {colTasks.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-3 min-h-[150px]">
                            {colTasks.map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className={`cursor-grab active:cursor-grabbing ${draggingTaskId === task.id ? 'opacity-50' : ''}`}
                                >
                                    <TaskCard
                                        task={task}
                                        onClick={() => onTaskClick(task)}
                                        compact
                                    />
                                </div>
                            ))}
                            {colTasks.length === 0 && (
                                <div className="h-24 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                    Empty
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
