import { databaseService } from './databaseService';
import { taskService } from './taskService';
import { whatsappService } from './whatsappService';
import { companyService } from './companyService';
import type { AutomationRule } from '../types/db';

export const automationService = {
    // Called when specific events happen in the system
    checkTriggers: async (triggerType: 'NEW_SALE' | 'LOW_STOCK' | 'NEW_CUSTOMER' | 'INVOICE_OVERDUE', payload: any) => {
        // Fetch active rules for this trigger
        const rules: AutomationRule[] = await databaseService.query(
            "SELECT * FROM automation_rules WHERE trigger_type = ? AND is_active = 1",
            [triggerType]
        ) || [];

        for (const rule of rules) {
            await automationService.executeRule(rule, payload);
        }
    },

    executeRule: async (rule: AutomationRule, payload: any) => {
        try {
            const config = JSON.parse(rule.config_json || '{}');

            if (rule.action_type === 'CREATE_TASK') {
                let title = config.titleTemplate || 'Automated Task';
                let description = config.descriptionTemplate || '';

                // Simple template replacement
                for (const key in payload) {
                    title = title.replace(`{{${key}}}`, String(payload[key]));
                    description = description.replace(`{{${key}}}`, String(payload[key]));
                }

                await taskService.create({
                    title,
                    description,
                    status: 'TODO',
                    priority: config.priority || 'MEDIUM',
                    creator_id: 0,
                    related_entity_type: config.related_entity_type,
                    related_entity_id: payload.id || null, // Assuming payload has ID
                    tags: JSON.stringify(['automation', rule.trigger_type])
                });
            } else if (rule.action_type === 'SEND_WHATSAPP') {
                const settings = await companyService.getSettings();
                const ownerPhone = settings?.owner_whatsapp || settings?.phone_number;

                if (ownerPhone) {
                    let message = config.messageTemplate || 'Automated Alert';
                    // Simple template replacement
                    for (const key in payload) {
                        message = message.replace(`{{${key}}}`, String(payload[key]));
                    }
                    whatsappService.sendMessage(ownerPhone, message);
                }
            }
        } catch (error) {
            console.error("Failed to execute automation rule:", error);
        }
    },

    seedDefaultRules: async () => {
        const count = await databaseService.query("SELECT COUNT(*) as count FROM automation_rules");
        if (count && count[0].count === 0) {
            console.log("Seeding default automation rules...");

            // Rule 1: Low Stock -> Create Restock Task
            const lowStockRule = {
                name: "Auto-Restock Task",
                trigger_type: "LOW_STOCK",
                action_type: "CREATE_TASK",
                config_json: JSON.stringify({
                    titleTemplate: "Restock: {{name}}",
                    descriptionTemplate: "Stock level is low ({{stock}}). Reorder required. Barcode: {{barcode}}",
                    priority: "HIGH",
                    related_entity_type: "PRODUCT"
                }),
                is_active: 1
            };

            await databaseService.query(
                "INSERT INTO automation_rules (name, trigger_type, action_type, config_json, is_active) VALUES (?, ?, ?, ?, ?)",
                [lowStockRule.name, lowStockRule.trigger_type, lowStockRule.action_type, lowStockRule.config_json, lowStockRule.is_active]
            );

            // Rule 2: Low Stock -> WhatsApp Alert (Option 2)
            const lowStockWhatsApp = {
                name: "WhatsApp Stock Alert",
                trigger_type: "LOW_STOCK",
                action_type: "SEND_WHATSAPP",
                config_json: JSON.stringify({
                    messageTemplate: "⚠️ Low Stock: {{name}} (Qty: {{stock}}). Barcode: {{barcode}}."
                }),
                is_active: 1
            };

            await databaseService.query(
                "INSERT INTO automation_rules (name, trigger_type, action_type, config_json, is_active) VALUES (?, ?, ?, ?, ?)",
                [lowStockWhatsApp.name, lowStockWhatsApp.trigger_type, lowStockWhatsApp.action_type, lowStockWhatsApp.config_json, lowStockWhatsApp.is_active]
            );
        }
    }
};
