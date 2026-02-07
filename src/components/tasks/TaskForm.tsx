import React, { useState, useEffect } from 'react';
import type { Task } from '../../types/db';
import { taskService } from '../../services/taskService';
import { X, Calendar, User, Tag, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskFormProps {
    task?: Task; // If provided, edit mode
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, isOpen, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<string>('MEDIUM');
    const [status, setStatus] = useState<string>('TODO');
    const [dueDate, setDueDate] = useState('');
    const [assigneeId, setAssigneeId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setStatus(task.status);
            setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
            setAssigneeId(task.assignee_id ? String(task.assignee_id) : '');
        } else {
            // Reset for new task
            setTitle('');
            setDescription('');
            setPriority('MEDIUM');
            setStatus('TODO');
            setDueDate('');
            setAssigneeId('');
        }
    }, [task, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data: any = {
                title,
                description,
                priority,
                status,
                due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
                assignee_id: assigneeId ? parseInt(assigneeId) : undefined,
                creator_id: 1 // Default to admin for now
            };

            if (task) {
                await taskService.update(task.id, data);
                toast.success('Task updated');
            } else {
                await taskService.create(data);
                toast.success('Task created');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save task');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">{task ? 'Edit Task' : 'New Task'}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Call supplier regarding order"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Add details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <div className="relative">
                                <Flag size={16} className="absolute left-3 top-3 text-gray-400" />
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="WAITING">Waiting</option>
                                <option value="DONE">Done</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text" // Simple ID input for now, ideally a User Select
                                    value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}
                                    placeholder="User ID"
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                </form>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
                    </button>
                </div>
            </div>
        </div>
    );
};
