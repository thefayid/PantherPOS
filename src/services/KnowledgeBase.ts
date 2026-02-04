import Fuse from 'fuse.js';

export interface KnowledgeEntry {
    topics: string[];
    response: string | (() => string); // Support dynamic responses
    keywords: string[];
}

export class KnowledgeBase {
    private knowledge: KnowledgeEntry[] = [
        // --- Greetings & Personality (Dynamic) ---
        {
            topics: ['Hello', 'Hi', 'Hey', 'Greetings'],
            keywords: ['hello', 'hi', 'hey', 'greetings', 'yo', 'sup'],
            response: () => {
                const hour = new Date().getHours();
                const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
                return `👋 **Good ${timeOfDay}!**\nI'm ready to help. Try "New Bill" or "Show Profit".`;
            }
        },
        {
            topics: ['Positive Feedback', 'Compliment'],
            keywords: ['great', 'awesome', 'good', 'nice', 'cool', 'thanks', 'thank', 'amazing', 'excellent', 'perfect'],
            response: () => {
                const replies = [
                    "😊 **Glad I could help!** Let me know if you need anything else.",
                    "🚀 **Awesome!** I'm here to keep things running smoothly.",
                    "🙌 **Great to hear!** Making your store smarter, one command at a time.",
                    "🤖 **You're welcome!** Just doing my job."
                ];
                return replies[Math.floor(Math.random() * replies.length)];
            }
        },
        {
            topics: ['Who are you', 'Identity'],
            keywords: ['who are you', 'identity', 'created by', 'your name', 'what are you'],
            response: "🤖 **I am POS-AI Gen2.**\nDesigned to manage your store efficiently. I don't sleep, I don't take breaks, and I love data."
        },
        {
            topics: ['How are you', 'Status'],
            keywords: ['how are you', 'system status', 'health check', 'operational'],
            response: "⚡ **Systems Operational.**\nDatabase: Connected\nSync: Active\nMood: Ambitious"
        },
        {
            topics: ['Joke', 'Fun'],
            keywords: ['joke', 'funny', 'laugh'],
            response: () => {
                const jokes = [
                    "Why did the database break up with the server? She found someone with more cache.",
                    "Reviewing sales data... 404 Profit Not Found. Just kidding! 🤑",
                    "I would tell you a UDP joke, but you might not get it."
                ];
                return `😂 **Here's one:**\n${jokes[Math.floor(Math.random() * jokes.length)]}`;
            }
        },

        // --- Core Features & Help ---
        {
            topics: ['Billing Help', 'How to bill'],
            keywords: ['bill', 'billing', 'invoice', 'sale', 'sell', 'checkout'],
            response: "🧾 **Billing Guide:**\n1. Scan product or press `F2` to search.\n2. Adjust qty with `+` / `-` keys.\n3. Press `F12` to Checkout.\n\n*Shortcut: Say 'Add 2 Milk' to skip steps.*"
        },
        {
            topics: ['Search Product', 'Find Item'],
            keywords: ['search', 'find', 'lookup', 'price', 'cost'],
            response: "🔍 **Product Search:**\nPress `F2` to open the global search bar. You can search by Name, Barcode, or even dynamic Alias."
        },
        {
            topics: ['Return Policy', 'Refunds'],
            keywords: ['return', 'refund', 'exchange', 'policy'],
            response: "🔄 **Official Return Policy:**\n\n- **Window**: Items are eligible for return within **7 days** with the original receipt.\n- **Condition**: Only unopened/non-perishable goods are accepted for full refund.\n- **Process**: Navigate to **Sales History**, locate the bill by ID scanning, and select **Void/Return**.\n- **Manager Override**: Items without a bill require a Manager PIN for approval."
        },

        // --- Troubleshooting ---
        {
            topics: ['Printer Issue', 'Print fail'],
            keywords: ['print', 'printer', 'paper', 'jam', 'receipt', 'faded', 'offline'],
            response: "🖨️ **Printer Master Guide:**\n\n- **Offline/No Response**: Check if the green power light is solid. Ensure the USB/LAN cable is firmly seated.\n- **Faded Text**: Your thermal head might be dirty or the paper roll is low quality. Clean with a dry cotton swab.\n- **Red Light Blinking**: Usually indicates a paper jam or open cover. Clear the path and press the **Feed** button.\n- **Shortcut**: You can say *\"Restart printer\"* to re-initialize the connection."
        },
        {
            topics: ['Scanner Issue'],
            keywords: ['scan', 'scanner', 'barcode', 'reader', 'not scanning', 'beep'],
            response: "🔫 **Scanner Troubleshooting:**\n\n1. **No Beep**: The connection is dead. Unplug and replug the scanner USB.\n2. **Beeps but no input**: The scanner is in 'Keyboard Wedge' mode. Ensure your cursor is focused inside the Search or Billing input fields.\n3. **Scanning slow**: Restart the system or say *\"Restart scanner\"* to reset the barcode module logic."
        },
        {
            topics: ['Login Failed', 'Password reset'],
            keywords: ['login', 'password', 'access', 'user'],
            response: "🔐 **Access Control:**\nIf you forgot your PIN, please contact the Store Administrator. Default Admin PIN is often `1234` or `0000`."
        },

        // --- Reports & Analytics ---
        {
            topics: ['Profit', 'Margin'],
            keywords: ['profit', 'margin', 'earn', 'revenue'],
            response: "💰 **Profitability:**\nI track your purchase vs sales price. Ask *\"Show profit today\"* to see your net earnings instantly."
        },
        {
            topics: ['Tax/GST'],
            keywords: ['tax', 'gst', 'vat', 'duty', 'tax invoice'],
            response: "🏛️ **Tax & GST Compliance:**\nThis system is GST-ready. \n\n- **GSTR-1**: All B2B and B2C sales are categorized automatically.\n- **Editing GST**: Go to **Inventory > Edit Product** to change tax slabs (5%, 12%, 18%, 28%).\n- **Reports**: Download the monthly Sales Summary for your accountant's filing."
        }
    ];

    private fuse: Fuse<KnowledgeEntry>;

    constructor() {
        this.fuse = new Fuse(this.knowledge, {
            keys: ['topics', 'keywords'],
            threshold: 0.4,
            distance: 100,
        });
    }

    public ask(query: string): string | null {
        // 1. Direct Keyword Check (Strict Word Boundary)
        for (const entry of this.knowledge) {
            for (const k of entry.keywords) {
                const regex = new RegExp(`\\b${k}\\b`, 'i');
                if (regex.test(query) && query.split(' ').length < 6) {
                    return this.resolveResponse(entry.response);
                }
            }
        }

        // 2. Fuzzy Search
        const results = this.fuse.search(query);
        if (results.length > 0) {
            const best = results[0];
            if (best.score && best.score < 0.5) {
                return this.resolveResponse(best.item.response);
            }
        }

        return null;
    }

    private resolveResponse(response: string | (() => string)): string {
        if (typeof response === 'function') {
            return response();
        }
        return response;
    }

    public getTopic(topicName: string): string | null {
        const entry = this.knowledge.find(e =>
            e.topics.some(t => t.toLowerCase() === topicName.toLowerCase())
        );
        return entry ? this.resolveResponse(entry.response) : null;
    }

    public addEntry(entry: KnowledgeEntry) {
        this.knowledge.push(entry);
        this.fuse.setCollection(this.knowledge);
    }
}

export const knowledgeBase = new KnowledgeBase();
