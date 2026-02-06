import type { POSCommand } from './CommandGateway';
import { aliasService } from './aliasService';
import Fuse from 'fuse.js';

interface IntentPattern {
    regex: RegExp;
    intent: POSCommand['type'];
    extract: (matches: RegExpMatchArray) => any;
}

export class IntentEngine {
    private fuse: Fuse<any> | null = null;
    private stopWords = new Set(['please', 'can', 'you', 'show', 'give', 'me', 'the', 'is', 'i', 'want', 'to', 'need', 'get', 'calculate', 'check', 'for', 'about', 'on', 'with', 'a', 'towards']);
    private canonicalMap: Record<string, string> = {
        'paal': 'milk', 'paala': 'milk',
        'panjasara': 'sugar', 'panchar': 'sugar',
        'ari': 'rice', 'choru': 'rice',
        'vellam': 'water', 'water': 'water',
        'kadi': 'snacks', 'biscuit': 'biscuits',
        'mittayi': 'candy', 'chocolates': 'candy',
        'chaya': 'tea', 'tea': 'tea',
        'kappi': 'coffee', 'kaappi': 'coffee',
        'bill': 'billing', 'billu': 'billing',
        'paisa': 'payment', 'cash': 'cash',
        'printer': 'printing', 'print': 'printing'
    };

    constructor() {
        // No longer initializes Fuse with trainingData static import
    }

    private escapeRegex(s: string) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Optimized phrase matching for reportType extraction.
     * Previously this scanned a huge array on every REPORT_QUERY parse, which slowed voice commands.
     */
    private reportTypePhraseRegex: RegExp | null = null;

    public ingestTrainingData(data: any[]) {
        console.log('[IntentEngine] Ingesting training data for Fuse...', data.length, 'items');
        this.fuse = new Fuse(data, {
            keys: [
                { name: 'text', weight: 0.8 },
                { name: 'intent', weight: 0.2 }
            ],
            threshold: 0.4,
            distance: 100,
            includeScore: true,
            useExtendedSearch: true,
            ignoreLocation: true,
            minMatchCharLength: 2
        });
    }

    private patterns: IntentPattern[] = [
        // EXPENSE: Top priority to prevent "expense" being treated as a product
        {
            regex: /\b(add|log|record)\s+(expense|cost|spending|payout)\b(.*)/i,
            intent: 'ADD_EXPENSE',
            extract: (matches) => {
                const tail = matches[3] ? matches[3].trim().toLowerCase() : "";

                // 1. Look for amount in the tail
                const amountMatch = tail.match(/(\d+(?:\.\d+)?)/);
                const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

                // 2. Look for reason
                let reason = "Miscellaneous";

                if (amountMatch) {
                    const cleanTail = tail.replace(amountMatch[0], '')
                        .replace(/\b(rupees|rs|inr)\b/g, '')
                        .replace(/\b(for|on)\b/g, '')
                        .trim();
                    if (cleanTail) reason = cleanTail;
                } else if (tail) {
                    reason = tail.replace(/\b(for|on)\b/g, '').trim();
                }

                return { amount, reason };
            }
        },
        // SWITCH THEME: "Turn on white mode", "Dark mode please", "night layout", "bright mode"
        {
            regex: /\b(turn|switch|enable|set|change|activate)?.*\b(white|light|day|bright|dark|night|dim|black)\s+(mode|theme|layout|interface|ui|appearance|style|background|screen)?/i,
            intent: 'SWITCH_THEME',
            extract: (matches) => {
                const text = matches[0].toLowerCase();
                const isDark = text.includes('dark') || text.includes('night') || text.includes('dim') || text.includes('black');
                return {
                    theme: isDark ? 'dark' : 'light'
                };
            }
        },
        // HARDWARE: "Open drawer", "Restart scanner", "Check paper roll"
        {
            regex: /\b(open|test|read|check|restart|reboot|reinitialize)\s+(drawer|printer|scale|weight|cash box|till|scanner|barcode reader|paper|paper roll)/i,
            intent: 'HARDWARE_ACTION',
            extract: (matches) => {
                const actionVerb = matches[1].toLowerCase();
                const target = matches[2].toLowerCase();

                if (target.includes('drawer') || target.includes('cash') || target.includes('till')) return { action: 'OPEN_DRAWER' };
                if (target.includes('printer')) {
                    if (actionVerb.includes('restart') || actionVerb.includes('reboot')) return { action: 'RESTART_PRINTER' };
                    return { action: 'TEST_PRINTER' };
                }
                if (target.includes('scanner') || target.includes('reader')) {
                    if (actionVerb.includes('restart') || actionVerb.includes('reboot') || actionVerb.includes('reinitialize')) return { action: 'RESTART_SCANNER' };
                    return { action: 'TEST_SCANNER' };
                }
                if (target.includes('paper')) return { action: 'CHECK_PAPER' };
                if (target.includes('scale') || target.includes('weight')) return { action: 'READ_SCALE' };

                return { action: 'OPEN_DRAWER' };
            }
        },
        // SYSTEM: "Check alerts", "Any warnings?", "System status"
        {
            regex: /\b(check|show|any)\s+(alerts|warnings|notifications)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: () => ({ subType: 'CHECK_ALERTS' })
        },
        // INVENTORY FORECAST: "When will I run out of stock?", "Show inventory forecast", "Predict stockouts"
        {
            regex: /\b(when|forecast|predict|projection|stockout|run\s+out)\s+.*\b(stock|inventory|stockout)\b/i,
            intent: 'INVENTORY_FORECAST',
            extract: () => ({})
        },
        {
            regex: /\b(generate|create|make|get)\s+.*\b(purchase\s+order|po|order\s+stock|procurement)\b/i,
            intent: 'GENERATE_PO',
            extract: () => ({})
        },
        // SYSTEM OPS: "System status", "Health check", "Reload app"
        {
            regex: /\b(system|health|connection|backup)\s+(status|check)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: () => ({ subType: 'SYSTEM_HEALTH' })
        },
        {
            regex: /\b(reload|restart|refresh|reset|fix)\s+(app|system|page|ui)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: () => ({ subType: 'SELF_HEAL' })
        },
        // ANALYTICS: "Compare sales", "Trending items", "Predict revenue", "Not selling"
        {
            regex: /\b(compare|growth|vs|versus|trending|trends|best\s+sell|top\s+sell|predict|forecast|projection|target|not\s+selling|worst\s+sell|least\s+sold|slow\s+moving|dead\s+stock)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: (matches) => {
                const text = (matches.input || "").toLowerCase();

                if (text.includes('predict') || text.includes('forecast') || text.includes('projection') || text.includes('target')) {
                    return { subType: 'PREDICT_SALES' };
                }

                if (text.includes('trending') || text.includes('trend') || text.includes('best sell') || text.includes('top sell') || text.includes('hot') || text.includes('popular')) {
                    return { subType: 'TRENDING_PRODUCTS' };
                }

                if (text.includes('dead')) {
                    return { subType: 'DEAD_STOCK' };
                }

                if (text.includes('not selling') || text.includes('worst') || text.includes('least') || text.includes('slow')) {
                    return { subType: 'WORST_SELLERS' };
                }

                // Default fallback to comparison (e.g. "compare sales")
                return { subType: 'COMPARE_SALES', period: 'today' };
            }
        },
        // DATA MODIFICATION: "Set price of milk to 20", "Update stock of sugar to 50"
        {
            // Improved Regex: Handles "Update THE stock...", "Set price FOR...", extra spaces
            regex: /\b(set|change|update|make)\s+(?:the\s+)?(price|rate|cost|stock|quantity|inventory)\s+(?:of|for)?\s+(.+)\s+(?:to|as|is)\s+(\d+(?:\.\d+)?)/i,
            intent: 'DATA_MODIFICATION',
            extract: (matches) => {
                const typeInfo = matches[2].toLowerCase();
                const target = (typeInfo.includes('stock') || typeInfo.includes('quantity') || typeInfo.includes('inventory')) ? 'stock' : 'price';
                return {
                    target: target,
                    productName: matches[3].trim(), // Capture group 3 is now product name
                    value: parseFloat(matches[4])   // Capture group 4 is value
                };
            }
        },
        // CLEARANCE SALE: "Clearance", "Start clearance", "Apply clearance"
        {
            regex: /\b(clearance|clear\s+stock|markdown\s+dead)\b/i,
            intent: 'AUTO_CLEARANCE',
            extract: (matches) => {
                const text = matches[0].toLowerCase();
                let percent = 25; // Default
                // Try to extract number if user said "Clearance 50%"
                const numberMatch = text.match(/(\d+)/);
                if (numberMatch) percent = parseInt(numberMatch[0]);

                return { discountPercent: percent };
            }
        },
        // REPORT: "Sales today", "Weekly report", "Show profit this month", "Wastage analysis", "AI stock forecast"
        {
            regex: /\b(comprehensive|detailed|full|sales|report|profit|revenue|gst|eod|dead\s+stock|low\s+stock|stock|performance|trend|analysis)\b.*?(today|yesterday|this week|last week|this month|last month|this year|daily|weekly|monthly|quarterly|yearly)?\s*(pdf|excel|csv)?/i,
            intent: 'REPORT_QUERY',
            extract: (matches) => {
                const fullText = (matches.input || matches[0] || "").toLowerCase();
                const matchedType = matches[1].toLowerCase();

                // 1. Better Report Type Extraction
                // Look for the "meat" of the report request
                let reportType = matchedType;

                // If the user mentioned a specific multi-word type that our regex might have partially captured.
                // NOTE: this list is intentionally large, so we compile it ONCE into a regex for speed.
                const types = [
                    'itemwise sales', 'category sales', 'top products', 'dead stock', 'low stock',
                    'gst', 'customer sales', 'payment mode summary', 'payment mode comparison',
                    'eod', 'financial summary', 'yearly comparison', 'revenue', 'sales forecast',
                    'revenue forecast', 'demand forecast', 'sales trend', 'product performance comparison',
                    'category performance analysis', 'hourly sales', 'peak hour sales', 'basket analysis',
                    'customer buying pattern', 'repeat customers', 'customer lifetime value',
                    'inventory aging', 'inventory turnover', 'inventory shrinkage', 'stock consumption',
                    'wastage expiry', 'purchase efficiency', 'supplier rating', 'margin analysis',
                    'margin comparison', 'tax liability', 'input tax credit', 'tax projection',
                    'store performance index', 'stock movement', 'reorder recommendations',
                    'safety stock analysis', 'stock coverage', 'stockout risk', 'overstock', 'understock',
                    'inventory valuation', 'slow moving items', 'fast moving items', 'non moving items',
                    'damage loss', 'incoming stock trend', 'outgoing stock trend', 'inventory forecast',
                    'demand based reorder', 'purchase to stock efficiency', 'stock holding cost',
                    'inventory accuracy', 'warehouse utilization', 'wastage analysis', 'wastage percentage',
                    'expiry products', 'expiring soon', 'expiry forecast', 'expired stock',
                    'stock spoilage', 'spoilage percentage', 'breakage', 'leakage damage',
                    'damage report', 'damaged quantity', 'loss analysis', 'loss percentage',
                    'expiry loss', 'wastage loss', 'stock discrepancy', 'system vs physical',
                    'shelf life analysis', 'low shelf life', 'shelf life distribution', 'expiry risk',
                    'wastage risk', 'spoilage risk', 'damage trend', 'wastage trend', 'shrinkage trend',
                    'expiry trend', 'category wastage', 'product expiry', 'batch expiry', 'batch damage',
                    'batch wastage', 'wastage cost', 'expiry cost', 'shrinkage cost',
                    'wastage shrinkage combined', 'spoilage cost', 'breakage cost', 'leakage cost',
                    'high wastage items', 'high expiry items', 'max shrinkage items', 'expiry timeline',
                    'expiry calendar', 'wastage reasons', 'damage reasons', 'inventory forecast',
                    'expiry prediction', 'wastage forecast', 'shrinkage prediction', 'stockout prediction',
                    'ai reorder suggestion', 'demand forecast', 'purchase planning ai',
                    'slow moving forecast', 'non moving prediction', 'expiry risk prediction',
                    'shelf life forecast', 'wastage reduction suggestions', 'damage trend prediction',
                    'spoilage detection ai', 'overstock forecast', 'understock forecast',
                    'inventory anomaly detection', 'consumption pattern ai', 'damage cost prediction',
                    'wastage cost forecast', 'shrinkage cost forecast', 'high risk scoring',
                    'optimized reorder ai', 'stock balancing ai', 'spoilage prediction',
                    'expiry clustering', 'wastage timeline forecast', 'high wastage prediction',
                    'future stock health', 'reorder date prediction', 'spoilage risk forecast',
                    'predicted expiry count', 'wastage anomaly detection', 'inventory gap forecast',
                    'shelf life loss estimate', 'damage probability', 'expiry probability',
                    'shrinkage estimate', 'inventory bottleneck detection', 'aging forecast',
                    'warehouse load forecast', 'ai expiry alerts', 'expiry loss forecast',
                    'damage loss forecast', 'wastage heatmap', 'expiry heatmap', 'wastage insight ai',
                    'dead stock forecast', 'non moving forecast', 'clearance recommendation',
                    'ai inventory prediction', 'stock forecast', 'demand projection',
                    'predictive sales insight', 'overstock detection', 'understock detection',
                    'reorder quantity estimate', 'usage projection', 'seasonal demand forecast',
                    'shrinkage forecast', 'waste prediction', 'expiry projection', 'spoilage projection',
                    'stock health forecast', 'purchase optimization ai', 'supplier delay prediction',
                    'ai stock levels', 'item demand projection', 'slow moving prediction',
                    'dead stock prediction', 'supply chain risk', 'future shortages',
                    'demand spike detection', 'demand drop detection', 'stock volatility',
                    'projected wastage', 'future expiry volume', 'restocking window prediction',
                    'inventory imbalance prediction', 'temperature risk analysis', 'spoilage probability',
                    'inventory loss forecast', 'logistic delay prediction', 'warehouse load prediction',
                    'item rotation prediction', 'inventory risk forecast', 'stock adjustment ai',
                    'stock anomaly detection', 'predictive reorder alert', 'inventory freshness score',
                    'stock balancing forecast', 'item level forecast', 'damage incidents projection',
                    'expiry window forecast', 'supply risk forecast', 'weighted demand analysis',
                    'incoming anomaly forecast', 'reorder cycle prediction', 'inventory accuracy forecast',
                    'spoilage hotspot analysis', 'tax liability', 'input tax credit', 'gst input', 'gst output',
                    'gst payable', 'profit margin', 'net profit', 'gross profit', 'current ratio', 'quick ratio',
                    'financial health', 'liquidity', 'solvency', 'turnover ratio'
                ];

                if (!this.reportTypePhraseRegex) {
                    // Prefer longer phrases first to avoid partial matches (e.g. "stock" before "low stock").
                    const sorted = [...types].sort((a, b) => b.length - a.length);
                    this.reportTypePhraseRegex = new RegExp(sorted.map(p => this.escapeRegex(p)).join('|'), 'i');
                }

                const phraseMatch = fullText.match(this.reportTypePhraseRegex);
                if (phraseMatch && phraseMatch[0]) {
                    reportType = phraseMatch[0].toLowerCase();
                }

                // 2. Format / Destination
                let format = 'text';
                if (/\b(pdf|download|comprehensive|detailed)\b/.test(fullText)) format = 'pdf';
                else if (/\b(excel|csv)\b/.test(fullText)) format = 'excel';

                return {
                    reportType: reportType,
                    period: matches[2] ? matches[2].toLowerCase() : 'today',
                    format: format
                };
            }
        },
        // BILL LOOKUP: "Show bill 123", "Get invoice 456"
        {
            regex: /\b(bill|invoice|receipt|no|number|#)\s*(?:no|number|#)?\s*(\d+)/i,
            intent: 'BILL_LOOKUP',
            extract: (matches) => ({
                billId: matches[2]
            })
        },
        // BILL MANAGEMENT: "Hold bill", "Resume last bill"
        {
            regex: /\b(hold|pause|save)\s+(?:the\s+)?(bill|invoice|process|transaction)\b/i,
            intent: 'HOLD_BILL',
            extract: () => ({})
        },
        {
            regex: /\b(resume|unhold|continue|back\s+to|previous)\s+(?:the\s+)?(bill|invoice|transaction|on-hold)\b/i,
            intent: 'UNHOLD_BILL',
            extract: () => ({})
        },
        // DISCOUNTS: "Apply 10% discount", "Give 5 percent off"
        {
            regex: /\b(apply|give|set|add)\s+(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:discount|off)?/i,
            intent: 'APPLY_DISCOUNT',
            extract: (matches) => ({
                discount: parseFloat(matches[2])
            })
        },
        // MODIFY ITEM: "Set quantity of milk to 6", "Change biscuits count to 4"
        {
            regex: /\b(set|change|update|make)\s+(?:the\s+)?(?:quantity|qty|count|amount)\s+(?:of|for)?\s+(.+)\s+(?:to|as|is)\s+(\d+)/i,
            intent: 'MODIFY_ITEM',
            extract: (matches) => ({
                productName: matches[2].trim(),
                quantity: parseInt(matches[3])
            })
        },
        // CUSTOMER LINK: "Add customer John to bill", "Link Rahul"
        {
            regex: /\b(add|link|attach|associate|connect)\s+(?:customer\s+)?(.+)\s+(?:to|on|for)\s+(?:the\s+)?(?:bill|invoice|transaction)/i,
            intent: 'ADD_CUSTOMER_TO_BILL',
            extract: (matches) => ({
                customerName: matches[2].trim()
            })
        },
        // NAVIGATE: "Go to settings", "Open billing section"
        {
            regex: /\b(go\s+to|open|navigate\s+to|show|move\s+to)\s+(?:the\s+)?(settings|billing|inventory|products|reports|analytics|help|dashboard|offers|low\s+stock|orders|accounting|gst)\b/i,
            intent: 'NAVIGATE',
            extract: (matches) => {
                const section = matches[2].toLowerCase();
                let route = `/${section}`;
                if (section === 'low stock') route = '/low-stock';
                return {
                    route: route,
                    label: section.charAt(0).toUpperCase() + section.slice(1)
                };
            }
        },
        // CUSTOMER LOOKUP: "Customer John", "Details of Rahul"
        {
            regex: /\b(customer|client)\s+(.+)/i,
            intent: 'CUSTOMER_LOOKUP',
            extract: (matches) => ({
                customerName: matches[2].trim()
            })
        },
        // INVENTORY/ALERTS: "Low stock", "Expiring items", "Negative stock"
        {
            regex: /\b(low stock|out of stock|dead stock|expiry|negative|alerts)/i,
            intent: 'INVENTORY_QUERY',
            extract: (matches) => ({
                queryType: matches[1].toLowerCase()
            })
        },
        // LEARN ALIAS: "Learn chaya is tea", "Teach mettt to sugar"
        {
            regex: /\b(?:learn|teach|set)\s+(.+)\s+(?:as|is|means|to)\s+(.+)/i,
            intent: 'LEARN_ALIAS',
            extract: (matches) => ({
                alias: matches[1].trim(),
                target: matches[2].trim()
            })
        },
        // CLEAR CART: "Clear cart", "Empty basket"
        {
            regex: /\b(clear|empty|reset)\s+(cart|basket|bill)/i,
            intent: 'CLEAR_CART',
            extract: () => ({})
        },
        // CHECK STOCK: "Stock of milk", "How much sugar"
        {
            regex: /\b(stock|quantity|count|ethra|evide)\s+(of\s+)?(.+)/i,
            intent: 'CHECK_STOCK',
            extract: (matches) => ({
                productName: matches[3].trim()
            })
        },
        // REMOVE ITEM: "Remove milk", "Delete soap"
        {
            regex: /\b(remove|delete|cancel|clear|kalayu|maatu)\s+(.+)/i,
            intent: 'REMOVE_ITEM',
            extract: (matches) => ({
                productName: matches[2].trim()
            })
        },
        // NAVIGATION: MOVED DOWN to prevent shadowing specific "Show/Open" intents
        // "Go to settings", "Open dashboard", "Show customers"
        {
            regex: /\b(go to|open|show|view|navigate to|launch)\s+(.+)/i,
            intent: 'NAVIGATE',
            extract: (matches) => {
                const target = matches[2].toLowerCase();
                if (target.includes('dashboard') || target.includes('home')) return { route: '/', label: 'Dashboard' };
                if (target.includes('bill') || target.includes('checkout') || target.includes('sales')) return { route: '/billing', label: 'Billing' };
                if (target.includes('settings') || target.includes('config')) return { route: '/settings', label: 'Settings' };
                if (target.includes('customer') || target.includes('client')) return { route: '/customers', label: 'Customers' };
                if (target.includes('stock') || target.includes('inventory')) return { route: '/stocktake', label: 'Stocktake' };
                if (target.includes('staff') || target.includes('employee')) return { route: '/staff', label: 'Staff Management' };

                return { route: '/', label: 'Home' }; // Fallback
            }
        },

        // ADD ITEM: "Add 2 milk", "Give me 5 kg sugar", "Need 1 soap"
        {
            regex: /\b(add|give|need|want|tharu|venam|edu)\s+(\d+(?:\.\d+)?)\s*(?:(kg|g|gm|gram|grams|pcs|nos|liter|litre|l|ml))?\s+(.+)/i,
            intent: 'ADD_ITEM',
            extract: (matches) => ({
                quantity: parseFloat(matches[2]),
                unit: matches[3],
                productName: matches[4].trim()
            })
        },
        // ACCOUNTING: "What is my current ratio?", "Show financial health"
        {
            regex: /\b(current\s+ratio|financial\s+health|quick\s+ratio|liquidity|profitability|solvency|turnover)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: (matches) => ({
                subType: 'SYSTEM_HEALTH'
            })
        },
        // ACCOUNTING: "Forecast sales", "Predict cashflow"
        {
            regex: /\b(forecast|predict|projection)\s+(sales|revenue|cashflow|cash|income)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: (matches) => ({
                subType: 'PREDICT_' + matches[2].toUpperCase()
            })
        },
        // ACCOUNTING: "GST Liability", "Tax Report", "Ageing", "Cashflow", "Daybook"
        {
            regex: /\b(gst|tax|ageing|receivables|payables|cashflow|cash\s+flow|day\s+book|daily\s+log)\b/i,
            intent: 'REPORT_QUERY',
            extract: (matches) => {
                const text = matches[0].toLowerCase();
                let type = 'unknown';
                if (text.includes('gst') || text.includes('tax')) type = 'gst';
                else if (text.includes('ageing') || text.includes('receiv') || text.includes('payable')) type = 'ageing';
                else if (text.includes('cash')) type = 'cashflow';
                else if (text.includes('day') || text.includes('log')) type = 'daybook';

                return { reportType: type };
            }
        },
        // ADD ITEM (No Qty, Default 1): "Add milk", "Give soap"
        // THIS IS THE CATCH-ALL FOR "GIVE..." SO IT MUST BE LAST
        {
            regex: /\b(add|give|need|want|tharu|venam|edu)\s+(.+)/i,
            intent: 'ADD_ITEM',
            extract: (matches) => ({
                quantity: undefined, // Undefined triggers "How much?" prompt
                productName: matches[2].trim()
            })
        }
    ];

    // Alias Map for Manglish / Synonyms
    private aliases: Record<string, string> = {
        'paal': 'milk',
        'panjasara': 'sugar',
        'ari': 'rice',
        'vellam': 'water',
        'kadi': 'snacks',
        'mittayi': 'candy',
        'soap': 'soap',
        'chaya': 'tea',
        'kappi': 'coffee'
    };

    public parse(text: string): POSCommand | null {
        // 1. Check Regex Patterns first (Strict Precision)
        for (const pattern of this.patterns) {
            const matches = text.match(pattern.regex);
            if (matches) {
                console.log(`[IntentEngine] Matched Regex: ${pattern.intent}`);
                const payload = pattern.extract(matches);
                if (payload.productName) payload.productName = this.resolveAlias(payload.productName);
                return { type: pattern.intent, payload: payload } as POSCommand;
            }
        }

        // 2. Semantic Preprocessing (Normalization)
        const cleanedText = this.preprocess(text);
        if (!cleanedText) return null;

        // 3. Fallback: Fuzzy Search Training Data (Extended Semantic Match)
        if (!this.fuse) {
            console.warn('[IntentEngine] Fuse not initialized yet. Skipping semantic match.');
            return null;
        }
        const results = this.fuse.search(cleanedText);

        // Lower threshold for direct execution to prevent typos from auto-running
        if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.1) {
            const match = results[0].item;
            const score = results[0].score;
            console.log(`[IntentEngine] Fuzzy Match: ${match.intent} (Score: ${score.toFixed(3)})`);

            // Initialize entities from training data
            const payload = { ...match.entities };

            // 4. SMART ENTITY RE-EXTRACTION
            // If the user provided specific values/names, override the training data's example entities
            const words = text.toLowerCase().split(/\s+/);

            // Extract Number/Quantity/Price
            const numMatch = text.match(/(\d+(?:\.\d+)?)/);
            if (numMatch) {
                const val = parseFloat(numMatch[0]);
                if (match.intent === 'ADD_ITEM' || match.intent === 'MODIFY_ITEM') payload.quantity = val;
                if (match.intent === 'DATA_MODIFICATION') payload.value = val;
                if (match.intent === 'BILL_LOOKUP') payload.billId = numMatch[0];
            }

            // Extract Product/Customer Names
            // We assume names are usually at the end or after a verb
            const possibleNames = words.filter(w => !this.stopWords.has(w) && isNaN(parseFloat(w)) && w.length > 2);
            if (possibleNames.length > 0) {
                const name = this.resolveAlias(possibleNames[possibleNames.length - 1]);
                if (match.intent === 'ADD_ITEM' || match.intent === 'CHECK_STOCK' || match.intent === 'REMOVE_ITEM') {
                    payload.productName = name;
                }
                if (match.intent === 'ADD_CUSTOMER_TO_BILL') {
                    payload.customerName = possibleNames[possibleNames.length - 1]; // Keep raw case for names?
                }
            }

            return { type: match.intent, payload: payload } as POSCommand;
        }

        return null;
    }

    public getSuggestion(text: string): { text: string; intent: string } | null {
        if (!this.fuse) return null;

        const cleanedText = this.preprocess(text);
        const results = this.fuse.search(cleanedText);

        // Catch anything that wasn't confident enough for direct execution
        if (results.length > 0 && results[0].score !== undefined) {
            const score = results[0].score;
            if (score >= 0.1 && score < 0.8) {
                return {
                    text: results[0].item.text,
                    intent: results[0].item.intent
                };
            }
        }
        return null;
    }

    private preprocess(text: string): string {
        const words = text.toLowerCase().trim().split(/\s+/);

        // 1. Remove Stop Words & Normalize
        const filtered = words
            .filter(w => !this.stopWords.has(w))
            .map(w => this.canonicalMap[w] || w);

        return filtered.join(' ');
    }

    private resolveAlias(word: string): string {
        const lower = word.toLowerCase();

        // 1. Check Canonical Map (Predefined dialects)
        if (this.canonicalMap[lower]) return this.canonicalMap[lower];

        // 2. Check Dynamic Aliases (User learned)
        const dynamic = aliasService.resolve(lower);
        if (dynamic !== lower) return dynamic;

        // 3. Fallback to hardcoded alias map (legacy/internal)
        return this.aliases[lower] || lower;
    }
}

export const intentEngine = new IntentEngine();
