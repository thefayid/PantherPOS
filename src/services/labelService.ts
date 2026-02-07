import { DEFAULT_TEMPLATES } from '../types/label';
import type { LabelTemplate } from '../types/label';

const STORAGE_KEY = 'panther_label_templates';

export const labelService = {
    getTemplates: async (): Promise<LabelTemplate[]> => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // First run, save defaults
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
            return DEFAULT_TEMPLATES;
        }
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse label templates', e);
            return DEFAULT_TEMPLATES;
        }
    },

    saveTemplate: async (template: LabelTemplate) => {
        const templates = await labelService.getTemplates();
        const index = templates.findIndex(t => t.id === template.id);

        if (index >= 0) {
            templates[index] = template;
        } else {
            templates.push(template);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    },

    deleteTemplate: async (id: string) => {
        const templates = await labelService.getTemplates();
        const filtered = templates.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    },

    // Helper to get a blank template
    createTemplate: (): LabelTemplate => {
        return {
            id: Date.now().toString(),
            name: 'New Template',
            width: 50,
            height: 25,
            elements: []
        };
    }
};
