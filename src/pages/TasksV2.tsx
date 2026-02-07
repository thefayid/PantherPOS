import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Plus, Search, Filter, LayoutGrid, List as ListIcon, Calendar as CalendarIcon, CheckSquare } from 'lucide-react';
import type { Task } from '../types/db';
import { taskService, type TaskFilter } from '../services/taskService';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskKanban } from '../components/tasks/TaskKanban';
import { TaskForm } from '../components/tasks/TaskForm';
import { TopBar } from '../components/TopBar';

const TaskManagementPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // console.log("Fetching tasks from Database...");
            const filter: TaskFilter = {
                search: search || undefined,
                status: statusFilter.length > 0 ? statusFilter : undefined,
                priority: priorityFilter.length > 0 ? priorityFilter : undefined
            };

            const data = await taskService.getAll(filter);

            if (Array.isArray(data)) {
                setTasks(data);
            } else {
                // If service returns single item or null, handle safely
                setTasks([]);
            }
        } catch (error: any) {
            console.error("Failed to fetch tasks", error);
            setError(error.message || "Failed to load tasks");
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, priorityFilter]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };

    const handleCreateTask = () => {
        setEditingTask(undefined);
        setIsFormOpen(true);
    };

    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], value: string) => {
        if (current.includes(value)) {
            setter(current.filter(v => v !== value));
        } else {
            setter([...current, value]);
        }
    };

    if (error) {
        return (
            <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
                <TopBar title="Task Management" />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-red-600">
                    <h2 className="text-lg font-bold">Something went wrong</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <TopBar title="Task Management" />

            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                {/* Header Controls */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Simple Filter Toggles */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 mr-1 flex items-center gap-1">
                                <Filter size={14} /> Priority:
                            </span>
                            {['HIGH', 'CRITICAL'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => toggleFilter(setPriorityFilter, priorityFilter, p)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${priorityFilter.includes(p)
                                        ? 'bg-blue-100 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white border rounded-lg p-1 flex">
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'LIST' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                title="List View"
                            >
                                <ListIcon size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('KANBAN')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'KANBAN' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                title="Kanban View"
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>

                        <button
                            onClick={handleCreateTask}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                        >
                            <Plus size={20} />
                            New Task
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">Loading tasks...</div>
                    ) : (
                        <>
                            {viewMode === 'LIST' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                                    {tasks.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onClick={() => handleEditTask(task)}
                                        />
                                    ))}
                                    {tasks.length === 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400">
                                            <CheckSquare size={48} className="mb-4 opacity-20" />
                                            <p>No tasks found</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {viewMode === 'KANBAN' && (
                                <TaskKanban
                                    tasks={tasks}
                                    onTaskClick={handleEditTask}
                                    onTaskUpdate={fetchTasks}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            <TaskForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                task={editingTask}
                onSuccess={fetchTasks}
            />
        </div>
    );
};

export default TaskManagementPage;
