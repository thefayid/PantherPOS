import { databaseService } from './databaseService';
import type { Task, TaskComment } from '../types/db';

export interface TaskFilter {
    status?: string[];
    priority?: string[];
    assignee_id?: number;
    search?: string;
}

// Re-writing service to be absolutely safe
export const taskService = {
    getAll: async (filter?: TaskFilter): Promise<Task[]> => {
        try {
            let query = "SELECT * FROM tasks WHERE is_archived = 0";
            const params: any[] = [];

            if (filter) {
                if (filter.status && filter.status.length > 0) {
                    const placeholders = filter.status.map(() => '?').join(',');
                    query += ` AND status IN (${placeholders})`;
                    params.push(...filter.status);
                }
                if (filter.priority && filter.priority.length > 0) {
                    const placeholders = filter.priority.map(() => '?').join(',');
                    query += ` AND priority IN (${placeholders})`;
                    params.push(...filter.priority);
                }
                if (filter.assignee_id) {
                    query += " AND assignee_id = ?";
                    params.push(filter.assignee_id);
                }
                if (filter.search) {
                    query += " AND (title LIKE ? OR description LIKE ?)";
                    params.push(`%${filter.search}%`, `%${filter.search}%`);
                }
            }

            query += " ORDER BY created_at DESC";
            const result = await databaseService.query(query, params);

            // Safety check for result type
            if (!result) return [];
            return Array.isArray(result) ? result : [result];
        } catch (error) {
            console.error("TaskService getAll error:", error);
            return [];
        }
    },

    getById: async (id: number): Promise<Task | null> => {
        try {
            const result = await databaseService.query("SELECT * FROM tasks WHERE id = ?", [id]);
            return (result && result.length > 0) ? result[0] : null;
        } catch (error) {
            console.error("TaskService getById error:", error);
            return null;
        }
    },

    create: async (task: Omit<Task, 'id' | 'created_at' | 'is_archived'>): Promise<number> => {
        const query = `
            INSERT INTO tasks (
                title, description, status, priority, due_date, start_date,
                creator_id, assignee_id, related_entity_type, related_entity_id, tags,
                created_at, is_archived
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `;

        const params = [
            task.title,
            task.description || '',
            task.status || 'TODO',
            task.priority || 'MEDIUM',
            task.due_date || null,
            task.start_date || null,
            task.creator_id,
            task.assignee_id || null,
            task.related_entity_type || null,
            task.related_entity_id || null,
            task.tags ? (typeof task.tags === 'string' ? task.tags : JSON.stringify(task.tags)) : null,
            new Date().toISOString()
        ];

        await databaseService.query(query, params);
        // Best effort to get ID
        try {
            const idRes = await databaseService.query("SELECT last_insert_rowid() as id");
            return idRes[0]?.id || 0;
        } catch (e) {
            return 0;
        }
    },

    update: async (id: number, updates: Partial<Task>): Promise<void> => {
        const fields: string[] = [];
        const values: any[] = [];

        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'created_at') {
                fields.push(`${key} = ?`);
                const val = (updates as any)[key];

                // Handle JSON serialization for tags if strictly needed, 
                // but usually the UI passes stringified tags. 
                // We'll trust the types primarily.
                values.push(val);
            }
        });

        values.push(new Date().toISOString()); // updated_at
        fields.push("updated_at = ?");

        values.push(id);

        const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
        await databaseService.query(query, values);
    },

    delete: async (id: number): Promise<void> => {
        await databaseService.query("UPDATE tasks SET is_archived = 1 WHERE id = ?", [id]);
    },

    addComment: async (taskId: number, userId: number, comment: string): Promise<void> => {
        await databaseService.query(
            "INSERT INTO task_comments (task_id, user_id, comment, created_at) VALUES (?, ?, ?, ?)",
            [taskId, userId, comment, new Date().toISOString()]
        );
    },

    getComments: async (taskId: number): Promise<TaskComment[]> => {
        try {
            const res = await databaseService.query(
                "SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC",
                [taskId]
            );
            return Array.isArray(res) ? res : [];
        } catch (e) {
            return [];
        }
    }
};
