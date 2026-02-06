
export const chatbotTrainingData = [
    {
        "intent": "KNOWLEDGE_QUERY", // Mapped from check_revenue
        "text": "What are my sales today?",
        "entities": { "topic": "Sales Report" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "How much money did we make?",
        "entities": { "topic": "Sales Report" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Show me today's revenue",
        "entities": { "topic": "Sales Report" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Total sales for today",
        "entities": { "topic": "Sales Report" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "How is business going?",
        "entities": { "topic": "Sales Report" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Current collection status",
        "entities": { "topic": "Sales Report" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "What's the counter total?",
        "entities": { "topic": "Sales Report" }
    },
    {
        "intent": "KNOWLEDGE_QUERY", // Mapped from check_profit
        "text": "What is my profit today?",
        "entities": { "topic": "Profit" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Are we profitable?",
        "entities": { "topic": "Profit" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Show me the profit margin",
        "entities": { "topic": "Profit" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "How much did I earn net?",
        "entities": { "topic": "Profit" }
    },
    {
        "intent": "KNOWLEDGE_QUERY", // Mapped from low_stock_check
        "text": "Which items are running low?",
        "entities": { "topic": "Low Stock" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "What do I need to reorder?",
        "entities": { "topic": "Low Stock" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Show low stock warnings",
        "entities": { "topic": "Low Stock" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Any products out of stock?",
        "entities": { "topic": "Low Stock" }
    },
    {
        "intent": "KNOWLEDGE_QUERY", // Mapped from top_selling_items
        "text": "What are my best sellers?",
        "entities": { "topic": "Top Selling Items" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "What is selling the most?",
        "entities": { "topic": "Top Selling Items" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Top trending products",
        "entities": { "topic": "Top Selling Items" }
    },
    {
        "intent": "KNOWLEDGE_QUERY", // Mapped from staff_performance_query
        "text": "Who is my best employee?",
        "entities": { "topic": "Staff Performance" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Show staff performance",
        "entities": { "topic": "Staff Performance" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Sales by cashier",
        "entities": { "topic": "Staff Performance" }
    },
    {
        "intent": "KNOWLEDGE_QUERY", // Mapped from gst_summary_query
        "text": "How much tax do I owe?",
        "entities": { "topic": "GST Summary" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Show GST summary",
        "entities": { "topic": "GST Summary" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Tax liability report",
        "entities": { "topic": "GST Summary" }
    },
    {
        "intent": "KNOWLEDGE_QUERY", // Mapped from customer_ageing_query
        "text": "Who owes me money?",
        "entities": { "topic": "Ageing" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Show outstanding details",
        "entities": { "topic": "Ageing" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Customer ageing report",
        "entities": { "topic": "Ageing" }
    },
    {
        "intent": "KNOWLEDGE_QUERY", // Mapped from printer_troubleshoot
        "text": "Printer is not working",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Receipt printer stuck",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "intent": "KNOWLEDGE_QUERY", // Mapped from scanner_troubleshoot
        "text": "Scanner not scanning",
        "entities": { "topic": "Scanner Issue" }
    },
    {
        "intent": "ADD_EXPENSE", // Direct Intent
        "text": "Add an expense",
        "entities": {}
    },
    {
        "intent": "ADD_EXPENSE",
        "text": "Record a payout",
        "entities": {}
    },
    {
        "intent": "ADD_EXPENSE",
        "text": "I paid for tea",
        "entities": {}
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Search for product",
        "entities": { "topic": "Search Product" }
    },
    {
        "intent": "KNOWLEDGE_QUERY",
        "text": "Check price",
        "entities": { "topic": "Search Product" }
    }
];
