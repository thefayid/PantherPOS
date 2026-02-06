import { voiceCommandService, type VoiceStatus } from './voiceCommandService';
import { intentEngine } from './IntentEngine';
import { commandGateway } from './CommandGateway';
import { trainingService } from './trainingService';
import { knowledgeBase } from './KnowledgeBase';
import { databaseService } from './databaseService';
import { accountingAI } from './AccountingAI';
import { chatbotTrainingData } from '../data/chatbotTrainingData';

export interface ChatMessage {
    id: string;
    sender: 'USER' | 'AI' | 'SYSTEM';
    text: string;
    timestamp: number;
    actionTaken?: string;
    data?: any;
}

class AIChatbotService {
    private messages: ChatMessage[] = [];
    private listeners: ((messages: ChatMessage[]) => void)[] = [];
    private pendingContext: { type: string; payload: any } | null = null;

    // LEVEL 2: Context Memory
    private lastCommand: { type: string; payload: any } | null = null;

    constructor() {
        // Initialize Voice Service Callbacks
        voiceCommandService.setCallbacks(
            (text) => this.handleUserMessage(text),
            (status, msg) => this.handleVoiceStatus(status, msg)
        );



    }

    public subscribe(callback: (messages: ChatMessage[]) => void) {
        this.listeners.push(callback);
        callback(this.messages); // Initial state
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    public getMessages() {
        return this.messages;
    }

    public async loadHistory() {
        try {
            const history = await databaseService.query('SELECT * FROM chat_logs ORDER BY timestamp ASC LIMIT 50');
            if (history && Array.isArray(history)) {
                this.messages = history.map((row: any) => ({
                    id: row.id.toString(),
                    sender: row.sender as 'USER' | 'AI' | 'SYSTEM',
                    text: row.text,
                    timestamp: row.timestamp,
                    actionTaken: row.action_taken
                }));
                this.notifyListeners();
            }
        } catch (error) {
            console.error('[AIChatbot] Failed to load history:', error);
        }
    }

    private notifyListeners() {
        this.listeners.forEach(cb => cb(this.messages));
    }

    public async clearHistory() {
        this.messages = [];
        this.notifyListeners();

        try {
            await databaseService.query('DELETE FROM chat_logs');
        } catch (error) {
            console.error('[AIChatbot] Failed to clear history DB:', error);
        }
    }

    public async addMessage(sender: 'USER' | 'AI' | 'SYSTEM', text: string, actionTaken?: string, data?: any) {
        const msg: ChatMessage = {
            id: Date.now().toString() + Math.random(),
            sender,
            text,
            timestamp: Date.now(),
            actionTaken,
            data
        };
        this.messages = [...this.messages, msg];
        this.notifyListeners();

        // Persist to DB
        try {
            await databaseService.query(
                'INSERT INTO chat_logs (sender, text, action_taken, timestamp) VALUES (?, ?, ?, ?)',
                [sender, text, actionTaken || null, msg.timestamp]
            );
        } catch (error) {
            console.error('[AIChatbot] Failed to persist message:', error);
        }
    }

    // --- Core Logic ---

    public async handleUserMessage(text: string) {
        if (!text.trim()) return;

        this.addMessage('USER', text);

        // --- TRAINER INTERCEPTION ---
        if (trainingService.isActive()) {
            await new Promise(r => setTimeout(r, 600));
            const response = trainingService.handleInput(text);
            this.addMessage('AI', response);
            return;
        }

        if (!trainingService.isConfigured()) {
            const response = trainingService.startTraining();
            this.addMessage('AI', response);
            return;
        }
        // ----------------------------

        // 1. Pending Context Check (Specific Wait)
        if (this.pendingContext) {
            if (await this.resolvePendingContext(text)) return;
        }

        // 2. Intelligent Follow-up Check (Implicit Context)
        if (this.lastCommand && this.isFollowUpQuery(text)) {
            const followUpCmd = this.constructFollowUpCommand(text);
            if (followUpCmd) {
                this.addMessage('SYSTEM', `Context Inference: ${followUpCmd.type}...`);
                await this.executeCommand(followUpCmd);
                return;
            }
        }

        // 3. New Intent Parsing
        const command = intentEngine.parse(text);

        // INTELLIGENT ROUTING: Check if Accounting AI should handle this
        if (command && (command.type === 'ANALYTICS_QUERY' || command.type === 'REPORT_QUERY' || command.type === 'ADD_EXPENSE')) {
            const response = await accountingAI.resolveIntent(command.type, (command as any).payload);
            if (response) {
                this.addMessage('AI', response.explanation || 'Done.', response.action, response.details);
                return;
            }
        }

        // Manual Training Trigger
        if (!command && (text.toLowerCase().includes('training') || text.toLowerCase().includes('calibrate'))) {
            const response = trainingService.startTraining();
            this.addMessage('AI', response);
            return;
        }

        // Clear Chat Trigger
        if (text.toLowerCase().trim() === 'clear' || text.toLowerCase().trim() === 'wipe') {
            await this.clearHistory();
            this.addMessage('SYSTEM', 'Chat history cleared.');
            return;
        }

        if (command) {
            // Handle Knowledge Queries outside of Gateway
            if (command.type === 'KNOWLEDGE_QUERY' as any) {
                const topic = (command as any).payload?.topic;
                let knowledge = topic ? await knowledgeBase.getTopic(topic, text) : null;

                if (!knowledge) {
                    knowledge = await knowledgeBase.ask(text);
                }

                if (knowledge) {
                    if (typeof knowledge === 'string') {
                        this.addMessage('AI', knowledge);
                    } else {
                        this.addMessage('AI', knowledge.text, knowledge.action, knowledge.data);
                    }
                    return;
                }
            }
            await this.executeCommand(command);
        } else {
            // 4. Knowledge Base Fallback
            const knowledge = await knowledgeBase.ask(text);
            if (knowledge) {
                if (typeof knowledge === 'string') {
                    this.addMessage('AI', knowledge);
                } else {
                    this.addMessage('AI', knowledge.text, knowledge.action, knowledge.data);
                }
                return;
            }

            // 5. Fuzzy Suggestion Fallback
            const suggestion = intentEngine.getSuggestion(text);
            if (suggestion) {
                this.pendingContext = {
                    type: 'WAITING_FOR_CONFIRMATION',
                    payload: { suggestion: suggestion }
                };
                this.addMessage('AI', `I didn't quite catch that. Did you mean **"${suggestion.text}"**?`);
            } else {
                this.addMessage('AI', "I didn't catch that. Try saying 'Add 2 milk' or 'Show sales'.");
            }
        }
    }

    // --- Helper Methods ---

    private async executeCommand(command: any) {
        this.addMessage('SYSTEM', `Processing: ${command.type}...`);
        const result = await commandGateway.execute(command);

        if (result.success) {
            this.addMessage('AI', result.message, result.actionTaken);
            this.lastCommand = command; // Save successful command for context
        } else {
            // Check for specific prompts (basic context setting)
            if (result.message.includes('How much')) {
                const productMatch = result.message.match(/How much (.+) do you want/i);
                if (productMatch) {
                    this.pendingContext = {
                        type: 'WAITING_FOR_QTY',
                        payload: { productName: productMatch[1] }
                    };
                }
            }
            this.addMessage('AI', result.message, 'ERROR');
        }
    }

    private async resolvePendingContext(text: string): Promise<boolean> {
        if (this.pendingContext?.type === 'WAITING_FOR_QTY') {
            const qtyMatch = text.match(/(\d+(?:\.\d+)?)/);
            if (qtyMatch) {
                const qty = parseFloat(qtyMatch[1]);
                const product = this.pendingContext.payload.productName;
                const newCommand = {
                    type: 'ADD_ITEM',
                    payload: { productName: product, quantity: qty }
                };

                this.addMessage('SYSTEM', `Context Resolved: Adding ${qty} ${product}...`);
                this.pendingContext = null;
                await this.executeCommand(newCommand);
                return true;
            } else {
                // If text doesn't look like a number, assume they aborted context.
                this.pendingContext = null;
                return false; // Continue to normal parsing
            }
        }

        if (this.pendingContext?.type === 'WAITING_FOR_CONFIRMATION') {
            const lower = text.toLowerCase().trim();
            const isAffirmative = /\b(yes|yeah|yep|ok|okay|sure|do it|correct|confirm|y)\b/i.test(lower);
            const isNegative = /\b(no|nay|nope|wait|hold|cancel|stop|n)\b/i.test(lower);

            if (isAffirmative) {
                const suggestion = this.pendingContext.payload.suggestion;
                this.pendingContext = null;
                this.addMessage('SYSTEM', `Executing suggested command: ${suggestion.text}...`);

                // Construct the command again
                const command = intentEngine.parse(suggestion.text);
                if (command) {
                    await this.executeCommand(command);
                } else {
                    this.addMessage('AI', "Something went wrong. Please try typing the command fully.");
                }
                return true;
            } else if (isNegative) {
                this.pendingContext = null;
                this.addMessage('AI', "Okay, I won't do that. What else can I help you with?");
                return true;
            }
        }
        return false;
    }

    // Level 2 Intelligence: Detect casual follow-ups
    private isFollowUpQuery(text: string): boolean {
        const lower = text.toLowerCase();
        // Check for time-based follow-ups like "and yesterday?", "what about this week?"
        return /^(and|what about|how about)?\s*(yesterday|today|tomorrow|last\s+|this\s+)/.test(lower);
    }

    private constructFollowUpCommand(text: string): any | null {
        if (!this.lastCommand) return null;

        // Extract time period from follow-up
        const lower = text.toLowerCase();
        let period = null;
        if (lower.includes('yesterday')) period = 'yesterday';
        else if (lower.includes('today')) period = 'today';
        else if (lower.includes('week')) period = 'this week';
        else if (lower.includes('month')) period = 'this month';

        if (!period) return null;

        // If last command was a REPORT, re-run with new period
        if (this.lastCommand.type === 'REPORT_QUERY') {
            return {
                type: 'REPORT_QUERY',
                payload: {
                    ...this.lastCommand.payload,
                    period: period
                }
            };
        }

        return null;
    }

    private handleVoiceStatus(status: VoiceStatus, message?: string) {
        console.log(`Voice Status: ${status}`, message);
        if (status === 'ERROR' && message) {
            this.addMessage('SYSTEM', `Mic Error: ${message}`);
        }
    }

    public async sendText(text: string) {
        await this.handleUserMessage(text);
    }
}

export const aiChatbotService = new AIChatbotService();
