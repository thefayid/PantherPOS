/**
 * Lightweight offline intent dataset for AI Assist / Voice Assistant.
 *
 * Source: `chatbot_training_dataset.json` (copied into TS for fast offline bundling).
 * Keep this file small so intent parsing stays instant on low-end POS devices.
 */
export const chatbotTrainingDataset: Array<{
  text: string;
  intent: string;
  entities: Record<string, any>;
}> = [
  { text: 'Add expense 500 for taxi', intent: 'ADD_EXPENSE', entities: { amount: 500, reason: 'taxi' } },
  { text: 'Log spending 20 rupees for tea', intent: 'ADD_EXPENSE', entities: { amount: 20, reason: 'tea' } },
  { text: 'Record cost 1200 electricity bill', intent: 'ADD_EXPENSE', entities: { amount: 1200, reason: 'electricity bill' } },
  { text: 'Turn on dark mode', intent: 'SWITCH_THEME', entities: { theme: 'dark' } },
  { text: 'Switch to light theme', intent: 'SWITCH_THEME', entities: { theme: 'light' } },
  { text: 'Open drawer', intent: 'HARDWARE_ACTION', entities: { action: 'OPEN_DRAWER' } },
  { text: 'Test printer', intent: 'HARDWARE_ACTION', entities: { action: 'TEST_PRINTER' } },
  { text: 'Check alerts', intent: 'ANALYTICS_QUERY', entities: { subType: 'CHECK_ALERTS' } },
  { text: 'System status', intent: 'ANALYTICS_QUERY', entities: { subType: 'SYSTEM_HEALTH' } },
  { text: 'Reload app', intent: 'ANALYTICS_QUERY', entities: { subType: 'SELF_HEAL' } },
  { text: 'Compare sales', intent: 'ANALYTICS_QUERY', entities: { subType: 'COMPARE_SALES' } },
  { text: 'Predict revenue', intent: 'ANALYTICS_QUERY', entities: { subType: 'PREDICT_SALES' } },
  { text: 'Best selling items', intent: 'ANALYTICS_QUERY', entities: { subType: 'TRENDING_PRODUCTS' } },
  { text: 'Dead stock', intent: 'ANALYTICS_QUERY', entities: { subType: 'DEAD_STOCK' } },
  { text: 'Set price of milk to 50', intent: 'DATA_MODIFICATION', entities: { target: 'price', productName: 'milk', value: 50 } },
  { text: 'Update stock of sugar to 100', intent: 'DATA_MODIFICATION', entities: { target: 'stock', productName: 'sugar', value: 100 } },
  { text: 'Start clearance sale', intent: 'AUTO_CLEARANCE', entities: { discountPercent: 25 } },
  { text: 'Clearance 50%', intent: 'AUTO_CLEARANCE', entities: { discountPercent: 50 } },
  { text: 'Sales today', intent: 'REPORT_QUERY', entities: { reportType: 'sales', period: 'today' } },
  { text: 'Profit this month', intent: 'REPORT_QUERY', entities: { reportType: 'profit', period: 'this month' } },
  { text: 'Give me a pdf report of sales', intent: 'REPORT_QUERY', entities: { reportType: 'sales', format: 'pdf' } },
  { text: 'Suppliers list', intent: 'REPORT_QUERY', entities: { reportType: 'suppliers' } },
  { text: 'Show bill 123', intent: 'BILL_LOOKUP', entities: { billId: '123' } },
  { text: 'Customer John Doe', intent: 'CUSTOMER_LOOKUP', entities: { customerName: 'John Doe' } },
  { text: 'Low stock items', intent: 'INVENTORY_QUERY', entities: { queryType: 'low stock' } },
  { text: 'Learn chaya is tea', intent: 'LEARN_ALIAS', entities: { alias: 'chaya', target: 'tea' } },
  { text: 'Clear cart', intent: 'CLEAR_CART', entities: {} },
  { text: 'Stock of milk', intent: 'CHECK_STOCK', entities: { productName: 'milk' } },
  { text: 'Remove milk', intent: 'REMOVE_ITEM', entities: { productName: 'milk' } },
  { text: 'Go to settings', intent: 'NAVIGATE', entities: { route: '/settings' } },
  { text: 'Add 2 milk', intent: 'ADD_ITEM', entities: { quantity: 2, productName: 'milk' } },
  { text: 'Give me 5 kg sugar', intent: 'ADD_ITEM', entities: { quantity: 5, unit: 'kg', productName: 'sugar' } },
  { text: 'Add soap', intent: 'ADD_ITEM', entities: { productName: 'soap' } },
  { text: 'Hello', intent: 'KNOWLEDGE_QUERY', entities: { topic: 'Greetings' } },
  { text: 'Who are you', intent: 'KNOWLEDGE_QUERY', entities: { topic: 'Identity' } },
  { text: 'How do I bill?', intent: 'KNOWLEDGE_QUERY', entities: { topic: 'Billing Help' } },
  { text: \"Printer isn't working\", intent: 'KNOWLEDGE_QUERY', entities: { topic: 'Printer Issue' } },
  { text: 'What is the return policy?', intent: 'KNOWLEDGE_QUERY', entities: { topic: 'Return Policy' } },
  { text: 'Tell me a joke', intent: 'KNOWLEDGE_QUERY', entities: { topic: 'Joke' } },
];

