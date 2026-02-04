export const trainingData = [
    {
        "text": "Add expense 500 for taxi",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 500, "reason": "taxi" }
    },
    {
        "text": "Log spending 20 rupees for tea",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 20, "reason": "tea" }
    },
    {
        "text": "Record cost 1200 electricity bill",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 1200, "reason": "electricity bill" }
    },
    {
        "text": "Turn on dark mode",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Switch to light theme",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Open drawer",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "OPEN_DRAWER" }
    },
    {
        "text": "Test printer",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "TEST_PRINTER" }
    },
    {
        "text": "Check alerts",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "System status",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Reload app",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SELF_HEAL" }
    },
    {
        "text": "Compare sales",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Predict revenue",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Best selling items",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Dead stock",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Set price of milk to 50",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "milk", "value": 50 }
    },
    {
        "text": "Update stock of sugar to 100",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "sugar", "value": 100 }
    },
    {
        "text": "Start clearance sale",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 25 }
    },
    {
        "text": "Clearance 50%",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 50 }
    },
    {
        "text": "Sales today",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "Profit this month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this month" }
    },
    {
        "text": "Give me a pdf report of sales",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "pdf" }
    },
    {
        "text": "Comprehensive sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "pdf" }
    },
    {
        "text": "Detailed sales report for this month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "this month", "format": "pdf" }
    },
    {
        "text": "Full sales analysis pdf",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "pdf" }
    },
    {
        "text": "Suppliers list",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "suppliers" }
    },
    {
        "text": "Show bill 123",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "123" }
    },
    {
        "text": "Customer John Doe",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "John Doe" }
    },
    {
        "text": "Low stock items",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Learn chaya is tea",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "chaya", "target": "tea" }
    },
    {
        "text": "Clear cart",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Stock of milk",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "milk" }
    },
    {
        "text": "Remove milk",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "milk" }
    },
    {
        "text": "Go to settings",
        "intent": "NAVIGATE",
        "entities": { "route": "/settings" }
    },
    {
        "text": "Add 2 milk",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 2, "productName": "milk" }
    },
    {
        "text": "Give me 5 kg sugar",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 5, "unit": "kg", "productName": "sugar" }
    },
    {
        "text": "Add soap",
        "intent": "ADD_ITEM",
        "entities": { "productName": "soap" }
    },
    {
        "text": "Hello",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Greetings" }
    },
    {
        "text": "Who are you",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Identity" }
    },
    {
        "text": "How do I bill?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Billing Help" }
    },
    {
        "text": "Printer isn't working",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "text": "What is the return policy?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Return Policy" }
    },
    {
        "text": "Tell me a joke",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Joke" }
    },
    {
        "text": "Add 2 milk",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 2, "productName": "milk" }
    },
    {
        "text": "Give me 5 kg sugar",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 5, "unit": "kg", "productName": "sugar" }
    },
    {
        "text": "Add soap",
        "intent": "ADD_ITEM",
        "entities": { "productName": "soap" }
    },
    {
        "text": "Hello",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Greetings" }
    },
    {
        "text": "Who are you",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Identity" }
    },
    {
        "text": "How do I bill?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Billing Help" }
    },
    {
        "text": "Printer isn't working",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "text": "What is the return policy?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Return Policy" }
    },
    {
        "text": "Restart printer",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_PRINTER" }
    },
    {
        "text": "Check paper",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "CHECK_PAPER" }
    },
    {
        "text": "Scan barcode",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "SCAN_BARCODE" }
    },
    {
        "text": "Open cash drawer",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "OPEN_DRAWER" }
    },
    {
        "text": "Top customers this month",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TOP_CUSTOMERS" }
    },
    {
        "text": "Category wise sales",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CATEGORY_SALES" }
    },
    {
        "text": "GST collection report",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "GST_SUMMARY" }
    },
    {
        "text": "Show expense vs revenue",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "EXPENSE_VS_REVENUE" }
    },
    {
        "text": "Add new product Pepsi with price 40",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "addProduct", "productName": "Pepsi", "value": 40 }
    },
    {
        "text": "Delete product bread",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "deleteProduct", "productName": "bread" }
    },
    {
        "text": "Change GST of rice to 5 percent",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "gst", "productName": "rice", "value": 5 }
    },
    {
        "text": "Update expiry of milk to 10 Jan",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "expiry", "productName": "milk", "value": "10 Jan" }
    },
    {
        "text": "Give customer wise report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "customer" }
    },
    {
        "text": "Export sales to excel",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "excel" }
    },
    {
        "text": "Email me today's report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today", "method": "email" }
    },
    {
        "text": "Hold this bill",
        "intent": "HOLD_BILL",
        "entities": {}
    },
    {
        "text": "Resume last bill",
        "intent": "UNHOLD_BILL",
        "entities": {}
    },
    {
        "text": "Apply 10 percent discount",
        "intent": "APPLY_DISCOUNT",
        "entities": { "discount": 10 }
    },
    {
        "text": "Change quantity of milk to 3",
        "intent": "MODIFY_ITEM",
        "entities": { "productName": "milk", "quantity": 3 }
    },
    {
        "text": "Add customer Rahul to this bill",
        "intent": "ADD_CUSTOMER_TO_BILL",
        "entities": { "customerName": "Rahul" }
    },
    {
        "text": "Out of stock atta",
        "intent": "INVENTORY_STATUS",
        "entities": { "productName": "atta", "status": "out-of-stock" }
    },
    {
        "text": "Restock biscuits 200 units",
        "intent": "INVENTORY_UPDATE",
        "entities": { "productName": "biscuits", "quantity": 200 }
    },
    {
        "text": "How to connect weighing scale?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "weighing scale" }
    },
    {
        "text": "How to back up my data?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "backup" }
    },
    {
        "text": "What to do if printer prints blank?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "printer blank issue" }
    },
    {
        "text": "Add expense of 340 for mobile recharge",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 340, "reason": "mobile recharge" }
    },
    {
        "text": "Record an expense of 89 for snacks bought",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 89, "reason": "snacks" }
    },
    {
        "text": "Log 150 rupees spent on parking",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 150, "reason": "parking" }
    },
    {
        "text": "Add 420 as expense for petrol",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 420, "reason": "petrol" }
    },
    {
        "text": "Register 600 expense for internet bill",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 600, "reason": "internet bill" }
    },
    {
        "text": "Enable night theme",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Make the app light mode",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Turn UI to darker mode",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Switch interface to bright theme",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Apply dark appearance",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Printer test page please",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "TEST_PRINTER" }
    },
    {
        "text": "Run a print test",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "TEST_PRINTER" }
    },
    {
        "text": "Open the cash drawer now",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "OPEN_DRAWER" }
    },
    {
        "text": "Cash drawer open",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "OPEN_DRAWER" }
    },
    {
        "text": "Reload printer system",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_PRINTER" }
    },
    {
        "text": "Show system alerts list",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "Display any warnings",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "Check overall system health",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "How is the system running?",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Self heal the app",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SELF_HEAL" }
    },
    {
        "text": "Compare today’s sales with yesterday",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Give me a sales comparison",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Predict the upcoming revenue",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Forecast my sales",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Which items are selling best currently",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Best products this week",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Show non moving inventory",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Which items are not selling?",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Modify price of bread to 45",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "bread", "value": 45 }
    },
    {
        "text": "Update the rate for rice to 55",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "rice", "value": 55 }
    },
    {
        "text": "Increase stock of biscuits to 200 units",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "biscuits", "value": 200 }
    },
    {
        "text": "Set stock of oil to 50",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "oil", "value": 50 }
    },
    {
        "text": "Reduce stock of eggs to 12",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "eggs", "value": 12 }
    },
    {
        "text": "Start clearance mode with 30 percent off",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 30 }
    },
    {
        "text": "Apply 40% clearance",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 40 }
    },
    {
        "text": "Trigger a 60 percent clearance sale",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 60 }
    },
    {
        "text": "Set clearance discount to 15",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 15 }
    },
    {
        "text": "Activate 35% clearance",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 35 }
    },
    {
        "text": "Sales report for today",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "Show me monthly sales",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "this month" }
    },
    {
        "text": "Profit for this week",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this week" }
    },
    {
        "text": "Give purchase report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase" }
    },
    {
        "text": "Generate sales pdf",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "pdf" }
    },
    {
        "text": "Suppliers full report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "suppliers" }
    },
    {
        "text": "Find bill number 987",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "987" }
    },
    {
        "text": "Show me bill 456",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "456" }
    },
    {
        "text": "Search customer named Alice",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Alice" }
    },
    {
        "text": "Customer Rahul Sharma",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Rahul Sharma" }
    },
    {
        "text": "Show items with low stock",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Which products are about to run out?",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Learn biscuit is cookies",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "biscuit", "target": "cookies" }
    },
    {
        "text": "Alias chips as wafers",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "chips", "target": "wafers" }
    },
    {
        "text": "Empty the cart",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Clear the current cart",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Current stock of rice?",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "rice" }
    },
    {
        "text": "How many soaps are in stock?",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "soap" }
    },
    {
        "text": "Remove bread from cart",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "bread" }
    },
    {
        "text": "Delete sugar from cart",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "sugar" }
    },
    {
        "text": "Navigate to dashboard",
        "intent": "NAVIGATE",
        "entities": { "route": "/dashboard" }
    },
    {
        "text": "Go to report section",
        "intent": "NAVIGATE",
        "entities": { "route": "/reports" }
    },
    {
        "text": "Add 3 bread packets",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 3, "productName": "bread" }
    },
    {
        "text": "Add 2 kg rice",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 2, "unit": "kg", "productName": "rice" }
    },
    {
        "text": "Add one toothpaste",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 1, "productName": "toothpaste" }
    },
    {
        "text": "Hi",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Greetings" }
    },
    {
        "text": "Explain how billing works",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Billing Help" }
    },
    {
        "text": "Why isn’t my printer printing?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "text": "How to return an item?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Return Policy" }
    },
    {
        "text": "Tell me something funny",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Joke" }
    },
    {
        "text": "Add new product Pepsi for 40",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "addProduct", "productName": "Pepsi", "value": 40 }
    },
    {
        "text": "Delete product butter",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "deleteProduct", "productName": "butter" }
    },
    {
        "text": "Change GST of soap to 18 percent",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "gst", "productName": "soap", "value": 18 }
    },
    {
        "text": "Update expiry date of curd to 6 June",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "expiry", "productName": "curd", "value": "6 June" }
    },
    {
        "text": "Resume last held bill",
        "intent": "UNHOLD_BILL",
        "entities": {}
    },
    {
        "text": "Change quantity of sugar to 4",
        "intent": "MODIFY_ITEM",
        "entities": { "productName": "sugar", "quantity": 4 }
    },
    {
        "text": "Add customer John to bill",
        "intent": "ADD_CUSTOMER_TO_BILL",
        "entities": { "customerName": "John" }
    },
    {
        "text": "Add expense of 250 for office supplies",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 250, "reason": "office supplies" }
    },
    {
        "text": "Record 99 rupees for cleaning materials",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 99, "reason": "cleaning materials" }
    },
    {
        "text": "Log 45 for toll charges",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 45, "reason": "toll charges" }
    },
    {
        "text": "Add 700 as electricity top-up",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 700, "reason": "electricity top-up" }
    },
    {
        "text": "Note 180 for courier charges",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 180, "reason": "courier charges" }
    },
    {
        "text": "Switch the app to dark layout",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Use light interface",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Change theme to bright mode",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Activate dark UI",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Turn the screen theme white",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Restart the barcode scanner",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_SCANNER" }
    },
    {
        "text": "Test the barcode reader",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "TEST_SCANNER" }
    },
    {
        "text": "Open drawer immediately",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "OPEN_DRAWER" }
    },
    {
        "text": "Check the paper roll",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "CHECK_PAPER" }
    },
    {
        "text": "Reboot thermal printer",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_PRINTER" }
    },
    {
        "text": "Show me all alerts",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "Are there any warnings?",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "Health status of the system",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "How is the system health currently?",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Heal app errors",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SELF_HEAL" }
    },
    {
        "text": "Sales comparison for last week",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Compare last month’s sales",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Predict profit for next month",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Forecast revenue trend",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "What are top performing products?",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Show hot selling products",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Show items that haven’t sold for long",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Identify slow-moving inventory",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Change price of chocolate to 25",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "chocolate", "value": 25 }
    },
    {
        "text": "Update cost of paneer to 80",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "paneer", "value": 80 }
    },
    {
        "text": "Set stock of wheat flour to 90",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "wheat flour", "value": 90 }
    },
    {
        "text": "Reduce biscuits count to 150",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "biscuits", "value": 150 }
    },
    {
        "text": "Update available stock of rice to 100",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "rice", "value": 100 }
    },
    {
        "text": "Start 20 percent clearance",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 20 }
    },
    {
        "text": "Apply 45% sale",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 45 }
    },
    {
        "text": "Begin clearance at 70%",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 70 }
    },
    {
        "text": "Clearance discount set to 12 percent",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 12 }
    },
    {
        "text": "Use 28 percent clearance mode",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 28 }
    },
    {
        "text": "Show sales today",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "Give weekly profit details",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this week" }
    },
    {
        "text": "Report of stock purchases",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase" }
    },
    {
        "text": "Generate supplier PDF",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "suppliers", "format": "pdf" }
    },
    {
        "text": "Create monthly sales PDF",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "pdf", "period": "this month" }
    },
    {
        "text": "Find bill 789",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "789" }
    },
    {
        "text": "Search invoice 222",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "222" }
    },
    {
        "text": "Customer name David",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "David" }
    },
    {
        "text": "Look up customer Maya",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Maya" }
    },
    {
        "text": "Show me low stock alerts",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Check products nearly empty",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Learn that soda means soft drink",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "soda", "target": "soft drink" }
    },
    {
        "text": "Alias curd as yogurt",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "curd", "target": "yogurt" }
    },
    {
        "text": "Empty cart items",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Reset my cart",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Stock present for salt?",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "salt" }
    },
    {
        "text": "Check inventory of biscuits",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "biscuits" }
    },
    {
        "text": "Remove shampoo from cart",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "shampoo" }
    },
    {
        "text": "Delete rice packet",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "rice" }
    },
    {
        "text": "Open settings page",
        "intent": "NAVIGATE",
        "entities": { "route": "/settings" }
    },
    {
        "text": "Move to billing section",
        "intent": "NAVIGATE",
        "entities": { "route": "/billing" }
    },
    {
        "text": "Add 4 juice bottles",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 4, "productName": "juice" }
    },
    {
        "text": "Add 3 litre oil",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 3, "unit": "litre", "productName": "oil" }
    },
    {
        "text": "Add one packet noodles",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 1, "productName": "noodles" }
    },
    {
        "text": "Hello there",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Greetings" }
    },
    {
        "text": "Guide me on how to generate a bill",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Billing Help" }
    },
    {
        "text": "Printer light is blinking",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "text": "Tell me the refund rules",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Return Policy" }
    },
    {
        "text": "Crack a joke",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Joke" }
    },
    {
        "text": "Add new product Sprite at 38",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "addProduct", "productName": "Sprite", "value": 38 }
    },
    {
        "text": "Remove product cheese",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "deleteProduct", "productName": "cheese" }
    },
    {
        "text": "Set GST for ghee to 12 percent",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "gst", "productName": "ghee", "value": 12 }
    },
    {
        "text": "Update expiry of butter to 21 July",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "expiry", "productName": "butter", "value": "21 July" }
    },
    {
        "text": "Hold the current bill",
        "intent": "HOLD_BILL",
        "entities": {}
    },
    {
        "text": "Unhold previous bill",
        "intent": "UNHOLD_BILL",
        "entities": {}
    },
    {
        "text": "Give 5% discount",
        "intent": "APPLY_DISCOUNT",
        "entities": { "discount": 5 }
    },
    {
        "text": "Set quantity of milk to 6",
        "intent": "MODIFY_ITEM",
        "entities": { "productName": "milk", "quantity": 6 }
    },
    {
        "text": "Attach customer Priya to bill",
        "intent": "ADD_CUSTOMER_TO_BILL",
        "entities": { "customerName": "Priya" }
    },
    {
        "text": "Add expense of 520 for shop maintenance",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 520, "reason": "shop maintenance" }
    },
    {
        "text": "Record 130 rupees for cables",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 130, "reason": "cables" }
    },
    {
        "text": "Log 210 spent on decoration items",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 210, "reason": "decoration items" }
    },
    {
        "text": "Add 950 as water bill expense",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 950, "reason": "water bill" }
    },
    {
        "text": "Note 45 for photocopies",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 45, "reason": "photocopies" }
    },
    {
        "text": "Set theme to night mode",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Use white theme",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Switch to dim mode",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Make screen light-colored",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Activate darker UI style",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Test scanner connection",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "TEST_SCANNER" }
    },
    {
        "text": "Reinitialize barcode reader",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_SCANNER" }
    },
    {
        "text": "Open cashbox",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "OPEN_DRAWER" }
    },
    {
        "text": "Check if printer has paper",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "CHECK_PAPER" }
    },
    {
        "text": "Restart POS printer",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_PRINTER" }
    },
    {
        "text": "Any notifications?",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "View alerts",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "Show health diagnostics",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "System diagnostics status",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Fix errors automatically",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SELF_HEAL" }
    },
    {
        "text": "Compare weekly performance",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Sales comparison for quarter",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Predict next quarter's sales",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Sales forecast graph",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Top sale items today",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Show high demand items",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Dead inventory list",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Items that haven't moved in a month",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Set price of banana chips to 95",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "banana chips", "value": 95 }
    },
    {
        "text": "Update cost of detergent to 60",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "detergent", "value": 60 }
    },
    {
        "text": "Increase stock of chocolates to 300",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "chocolates", "value": 300 }
    },
    {
        "text": "Adjust stock of coffee powder to 40",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "coffee powder", "value": 40 }
    },
    {
        "text": "Reduce stock of onions to 25",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "onions", "value": 25 }
    },
    {
        "text": "Enable clearance sale of 55 percent",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 55 }
    },
    {
        "text": "Start 18 percent clearance",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 18 }
    },
    {
        "text": "Set discount for clearance at 22%",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 22 }
    },
    {
        "text": "Start markdown at 48 percent",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 48 }
    },
    {
        "text": "Trigger a clearance of 65 percent",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 65 }
    },
    {
        "text": "Give today's sales details",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "Report profit for this quarter",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this quarter" }
    },
    {
        "text": "Show me stock purchase history",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase" }
    },
    {
        "text": "Generate suppliers Excel report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "suppliers", "format": "excel" }
    },
    {
        "text": "Export profit report as PDF",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "format": "pdf" }
    },
    {
        "text": "Bring bill number 999",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "999" }
    },
    {
        "text": "Show invoice 301",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "301" }
    },
    {
        "text": "Look up customer Thomas",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Thomas" }
    },
    {
        "text": "Find customer Sneha",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Sneha" }
    },
    {
        "text": "Items running low in stock",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Inventory items nearly empty",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Learn that atta means wheat flour",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "atta", "target": "wheat flour" }
    },
    {
        "text": "Store alias juice as soft drink",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "juice", "target": "soft drink" }
    },
    {
        "text": "Clear everything in cart",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Reset cart instantly",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Stock level for mustard oil?",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "mustard oil" }
    },
    {
        "text": "Check the quantity of pen drives",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "pen drives" }
    },
    {
        "text": "Remove butter from cart",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "butter" }
    },
    {
        "text": "Delete chips item",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "chips" }
    },
    {
        "text": "Go to the orders page",
        "intent": "NAVIGATE",
        "entities": { "route": "/orders" }
    },
    {
        "text": "Navigate to help section",
        "intent": "NAVIGATE",
        "entities": { "route": "/help" }
    },
    {
        "text": "Add 6 cola bottles",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 6, "productName": "cola" }
    },
    {
        "text": "Add 1 kg flour",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 1, "unit": "kg", "productName": "flour" }
    },
    {
        "text": "Add two soaps",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 2, "productName": "soap" }
    },
    {
        "text": "Good morning",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Greetings" }
    },
    {
        "text": "Explain how to apply discounts",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Billing Help" }
    },
    {
        "text": "Printer is making noise",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "text": "How do I handle returns?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Return Policy" }
    },
    {
        "text": "Say something funny",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Joke" }
    },
    {
        "text": "Add new product KitKat with price 20",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "addProduct", "productName": "KitKat", "value": 20 }
    },
    {
        "text": "Remove product cereals",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "deleteProduct", "productName": "cereals" }
    },
    {
        "text": "Change GST of chips to 5 percent",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "gst", "productName": "chips", "value": 5 }
    },
    {
        "text": "Update expiry of bread to 11 August",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "expiry", "productName": "bread", "value": "11 August" }
    },
    {
        "text": "Hold the current invoice",
        "intent": "HOLD_BILL",
        "entities": {}
    },
    {
        "text": "Resume last saved bill",
        "intent": "UNHOLD_BILL",
        "entities": {}
    },
    {
        "text": "Apply 8 percent discount",
        "intent": "APPLY_DISCOUNT",
        "entities": { "discount": 8 }
    },
    {
        "text": "Set the quantity of tea to 10",
        "intent": "MODIFY_ITEM",
        "entities": { "productName": "tea", "quantity": 10 }
    },
    {
        "text": "Add customer Kavya to this bill",
        "intent": "ADD_CUSTOMER_TO_BILL",
        "entities": { "customerName": "Kavya" }
    },
    {
        "text": "Add expense of 310 for cleaning service",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 310, "reason": "cleaning service" }
    },
    {
        "text": "Record 150 rupees for phone accessories",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 150, "reason": "phone accessories" }
    },
    {
        "text": "Log 65 for stapler pins",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 65, "reason": "stapler pins" }
    },
    {
        "text": "Add 430 rupees spent on store paint",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 430, "reason": "store paint" }
    },
    {
        "text": "Add 125 expense for dustbin bags",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 125, "reason": "dustbin bags" }
    },
    {
        "text": "Theme switch to dark",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Use a light layout",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Change appearance to dark",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Set a bright theme",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "I want dark screen",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Run a scanner test",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "TEST_SCANNER" }
    },
    {
        "text": "Reboot the scanner",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_SCANNER" }
    },
    {
        "text": "Open my cash drawer",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "OPEN_DRAWER" }
    },
    {
        "text": "Paper check for printer",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "CHECK_PAPER" }
    },
    {
        "text": "Restart whole printer module",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_PRINTER" }
    },
    {
        "text": "View system errors",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "Any issues reported?",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "System health overview",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Diagnostics information",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Fix runtime bugs",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SELF_HEAL" }
    },
    {
        "text": "Weekly sale comparison",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Compare yesterday and today",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Predict future profit",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Give me a sales prediction",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Most sold items now",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Items trending in shop",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "List all dead stock products",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Dead stock for this month",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Set the price of orange juice to 55",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "orange juice", "value": 55 }
    },
    {
        "text": "Change rate of coffee to 95",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "coffee", "value": 95 }
    },
    {
        "text": "Set stock of almonds to 14",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "almonds", "value": 14 }
    },
    {
        "text": "Update stock of notebooks to 120",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "notebooks", "value": 120 }
    },
    {
        "text": "Reduce stock of chips to 50 packets",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "chips", "value": 50 }
    },
    {
        "text": "Start 29 percent clearance",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 29 }
    },
    {
        "text": "Clear everything at 42% off",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 42 }
    },
    {
        "text": "Enable 65 percent markdown",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 65 }
    },
    {
        "text": "Apply 11 percent clearance",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 11 }
    },
    {
        "text": "Start season clearance at 33%",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 33 }
    },
    {
        "text": "Show daily sales",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "Profit report for last month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "last month" }
    },
    {
        "text": "Show purchase transactions",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase" }
    },
    {
        "text": "Create PDF of today's revenue",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "pdf", "period": "today" }
    },
    {
        "text": "Export suppliers as excel",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "suppliers", "format": "excel" }
    },
    {
        "text": "Bill number 1456 please",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "1456" }
    },
    {
        "text": "Look for invoice 888",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "888" }
    },
    {
        "text": "Search customer named Noor",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Noor" }
    },
    {
        "text": "Find customer Anita",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Anita" }
    },
    {
        "text": "Low inventory alerts",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Products with low availability",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Teach that biscuits means cookies",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "biscuits", "target": "cookies" }
    },
    {
        "text": "Alias curd to yogurt",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "curd", "target": "yogurt" }
    },
    {
        "text": "Clear my shopping cart",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Reset all cart products",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Stock level for chocolates?",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "chocolates" }
    },
    {
        "text": "Check quantity for cheese",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "cheese" }
    },
    {
        "text": "Remove eggs from cart",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "eggs" }
    },
    {
        "text": "Delete butter item",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "butter" }
    },
    {
        "text": "Navigate to analytics",
        "intent": "NAVIGATE",
        "entities": { "route": "/analytics" }
    },
    {
        "text": "Go to product management page",
        "intent": "NAVIGATE",
        "entities": { "route": "/products" }
    },
    {
        "text": "Add 2 bread loaves",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 2, "productName": "bread" }
    },
    {
        "text": "Add 500 grams cashews",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 500, "unit": "grams", "productName": "cashews" }
    },
    {
        "text": "Add a bottle of sanitizer",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 1, "productName": "sanitizer" }
    },
    {
        "text": "Hi assistant",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Greetings" }
    },
    {
        "text": "How to add an item during billing?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Billing Help" }
    },
    {
        "text": "Printer is jammed",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "text": "What is the process for returns?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Return Policy" }
    },
    {
        "text": "Tell me a joke quickly",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Joke" }
    },
    {
        "text": "Add new product Lays at 20",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "addProduct", "productName": "Lays", "value": 20 }
    },
    {
        "text": "Delete product ketchup",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "deleteProduct", "productName": "ketchup" }
    },
    {
        "text": "GST for biscuits should be 12 percent",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "gst", "productName": "biscuits", "value": 12 }
    },
    {
        "text": "Update expiry date of juice to 14 September",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "expiry", "productName": "juice", "value": "14 September" }
    },
    {
        "text": "Hold this transaction",
        "intent": "HOLD_BILL",
        "entities": {}
    },
    {
        "text": "Unhold previously held bill",
        "intent": "UNHOLD_BILL",
        "entities": {}
    },
    {
        "text": "Apply 7% discount now",
        "intent": "APPLY_DISCOUNT",
        "entities": { "discount": 7 }
    },
    {
        "text": "Make quantity of coffee 3",
        "intent": "MODIFY_ITEM",
        "entities": { "productName": "coffee", "quantity": 3 }
    },
    {
        "text": "Add customer Meera to this invoice",
        "intent": "ADD_CUSTOMER_TO_BILL",
        "entities": { "customerName": "Meera" }
    },
    {
        "text": "Add expense of 275 for table repair",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 275, "reason": "table repair" }
    },
    {
        "text": "Record 145 rupees spent on tape rolls",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 145, "reason": "tape rolls" }
    },
    {
        "text": "Log 390 spent for pest control",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 390, "reason": "pest control" }
    },
    {
        "text": "Add 200 rupees tool expense",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 200, "reason": "tool expense" }
    },
    {
        "text": "Note down 80 for markers",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 80, "reason": "markers" }
    },
    {
        "text": "Put app in dark mode",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Change to light background",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Turn UI darker",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Activate soft light theme",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Use dark style interface",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Perform a barcode test",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "TEST_SCANNER" }
    },
    {
        "text": "Reset barcode module",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_SCANNER" }
    },
    {
        "text": "Open my drawer now",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "OPEN_DRAWER" }
    },
    {
        "text": "Check if paper roll is loaded",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "CHECK_PAPER" }
    },
    {
        "text": "Restart whole printing device",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_PRINTER" }
    },
    {
        "text": "Show alert notifications",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "Any critical alerts?",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "Get me system health data",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Health monitor details",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Heal errors in the system",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SELF_HEAL" }
    },
    {
        "text": "Sales comparison for today",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Compare this week’s sales",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Predict next week's income",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Forecast shop revenue",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Top selling stock today",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Show trending items for this week",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Show items not selling at all",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Identify all dead stock units",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Change cost of peanut butter to 150",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "peanut butter", "value": 150 }
    },
    {
        "text": "Update price of jam to 70",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "jam", "value": 70 }
    },
    {
        "text": "Set stock for sanitizer to 18",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "sanitizer", "value": 18 }
    },
    {
        "text": "Restock paper cups to 200",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "paper cups", "value": 200 }
    },
    {
        "text": "Decrease coffee stock to 25 units",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "coffee", "value": 25 }
    },
    {
        "text": "Enable 27 percent clearance discount",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 27 }
    },
    {
        "text": "Start 39 percent markdown sale",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 39 }
    },
    {
        "text": "Activate 72 percent clearance mode",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 72 }
    },
    {
        "text": "Set clearance rate to 19 percent",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 19 }
    },
    {
        "text": "Apply 54% clearance across store",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 54 }
    },
    {
        "text": "Today's sales breakdown",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "Monthly profit summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this month" }
    },
    {
        "text": "Show purchase ledger",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase" }
    },
    {
        "text": "Make PDF of profit details",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "format": "pdf" }
    },
    {
        "text": "Create excel of sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "excel" }
    },
    {
        "text": "Find bill 4509",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "4509" }
    },
    {
        "text": "Bring invoice 675",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "675" }
    },
    {
        "text": "Search for customer Ibrahim",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Ibrahim" }
    },
    {
        "text": "Show customer named Zoya",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Zoya" }
    },
    {
        "text": "List items that are nearly out of stock",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Check low availability items",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Learn bread is also loaf",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "bread", "target": "loaf" }
    },
    {
        "text": "Alias tea as chai",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "tea", "target": "chai" }
    },
    {
        "text": "Clear basket",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Remove everything in my cart",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "What is stock of peanuts?",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "peanuts" }
    },
    {
        "text": "Check stock of sugar packets",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "sugar packets" }
    },
    {
        "text": "Take out rice from cart",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "rice" }
    },
    {
        "text": "Delete noodles packet",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "noodles" }
    },
    {
        "text": "Navigate to accounting",
        "intent": "NAVIGATE",
        "entities": { "route": "/accounting" }
    },
    {
        "text": "Open GST report section",
        "intent": "NAVIGATE",
        "entities": { "route": "/gst" }
    },
    {
        "text": "Add 3 biscuit packs",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 3, "productName": "biscuits" }
    },
    {
        "text": "Add 5 litre mineral water",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 5, "unit": "litre", "productName": "mineral water" }
    },
    {
        "text": "Add one bottle ketchup",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 1, "productName": "ketchup" }
    },
    {
        "text": "Hello system",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Greetings" }
    },
    {
        "text": "How to cancel an item?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Billing Help" }
    },
    {
        "text": "Printer showing offline",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "text": "Explain the refund procedure",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Return Policy" }
    },
    {
        "text": "Give me a quick joke",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Joke" }
    },
    {
        "text": "Add new product Oreo priced 30",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "addProduct", "productName": "Oreo", "value": 30 }
    },
    {
        "text": "Remove product honey",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "deleteProduct", "productName": "honey" }
    },
    {
        "text": "Set GST for chips to 18 percent",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "gst", "productName": "chips", "value": 18 }
    },
    {
        "text": "Expiry of curd should be 20 October",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "expiry", "productName": "curd", "value": "20 October" }
    },
    {
        "text": "Hold the billing process",
        "intent": "HOLD_BILL",
        "entities": {}
    },
    {
        "text": "Continue with last held invoice",
        "intent": "UNHOLD_BILL",
        "entities": {}
    },
    {
        "text": "Give 3 percent discount",
        "intent": "APPLY_DISCOUNT",
        "entities": { "discount": 3 }
    },
    {
        "text": "Modify quantity of chocolate to 12",
        "intent": "MODIFY_ITEM",
        "entities": { "productName": "chocolate", "quantity": 12 }
    },
    {
        "text": "Add customer Ramesh to the bill",
        "intent": "ADD_CUSTOMER_TO_BILL",
        "entities": { "customerName": "Ramesh" }
    },
    {
        "text": "Add expense of 620 for shop banner printing",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 620, "reason": "banner printing" }
    },
    {
        "text": "Record 240 rupees for courier return",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 240, "reason": "courier return" }
    },
    {
        "text": "Log 170 for cable replacement",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 170, "reason": "cable replacement" }
    },
    {
        "text": "Add 520 as delivery fuel cost",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 520, "reason": "delivery fuel" }
    },
    {
        "text": "Note 110 rupees for stapler machine oil",
        "intent": "ADD_EXPENSE",
        "entities": { "amount": 110, "reason": "stapler oil" }
    },
    {
        "text": "Switch interface to dark style",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Apply a light UI theme",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Theme should be dark now",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Make UI white toned",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "light" }
    },
    {
        "text": "Change app theme to dark appearance",
        "intent": "SWITCH_THEME",
        "entities": { "theme": "dark" }
    },
    {
        "text": "Test code scanner",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "TEST_SCANNER" }
    },
    {
        "text": "Restart entire scanner module",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_SCANNER" }
    },
    {
        "text": "Pop open the cash drawer",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "OPEN_DRAWER" }
    },
    {
        "text": "Paper availability check",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "CHECK_PAPER" }
    },
    {
        "text": "Reboot the thermal printing system",
        "intent": "HARDWARE_ACTION",
        "entities": { "action": "RESTART_PRINTER" }
    },
    {
        "text": "See alert messages",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "Show warnings raised by system",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "CHECK_ALERTS" }
    },
    {
        "text": "What's the system health score?",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Show current diagnostics results",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SYSTEM_HEALTH" }
    },
    {
        "text": "Auto-heal the POS",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "SELF_HEAL" }
    },
    {
        "text": "Compare last 3 days sales",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Sales comparison for last hour",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "COMPARE_SALES" }
    },
    {
        "text": "Predict tomorrow's revenue",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Show revenue prediction graph",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "PREDICT_SALES" }
    },
    {
        "text": "Trending products during evenings",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "List hot selling products right now",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "TRENDING_PRODUCTS" }
    },
    {
        "text": "Identify all dead stock this quarter",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Products not sold for 60 days",
        "intent": "ANALYTICS_QUERY",
        "entities": { "subType": "DEAD_STOCK" }
    },
    {
        "text": "Change price of dates to 120",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "dates", "value": 120 }
    },
    {
        "text": "Set new price for raisins to 95",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "price", "productName": "raisins", "value": 95 }
    },
    {
        "text": "Adjust stock of pens to 140 units",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "pens", "value": 140 }
    },
    {
        "text": "Update stock for markers to 80",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "markers", "value": 80 }
    },
    {
        "text": "Reduce tomato stock to 20 units",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "stock", "productName": "tomatoes", "value": 20 }
    },
    {
        "text": "Begin 37 percent clearance",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 37 }
    },
    {
        "text": "Set markdown discount to 49 percent",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 49 }
    },
    {
        "text": "Launch 60% storewide clearance",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 60 }
    },
    {
        "text": "Clearance discount should be 23%",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 23 }
    },
    {
        "text": "Begin 32 percent reduction",
        "intent": "AUTO_CLEARANCE",
        "entities": { "discountPercent": 32 }
    },
    {
        "text": "Today’s revenue summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "Weekly profit breakdown",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this week" }
    },
    {
        "text": "Show purchase invoices",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase" }
    },
    {
        "text": "Download sales report as PDF",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "pdf" }
    },
    {
        "text": "Export purchase report in excel",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase", "format": "excel" }
    },
    {
        "text": "Show bill id 3212",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "3212" }
    },
    {
        "text": "Search invoice number 562",
        "intent": "BILL_LOOKUP",
        "entities": { "billId": "562" }
    },
    {
        "text": "Look up customer Varun",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Varun" }
    },
    {
        "text": "Search for customer Sameera",
        "intent": "CUSTOMER_LOOKUP",
        "entities": { "customerName": "Sameera" }
    },
    {
        "text": "Show low level inventory items",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Display items nearly finished",
        "intent": "INVENTORY_QUERY",
        "entities": { "queryType": "low stock" }
    },
    {
        "text": "Teach that curd means dahi",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "curd", "target": "dahi" }
    },
    {
        "text": "Alias chocolate as choco",
        "intent": "LEARN_ALIAS",
        "entities": { "alias": "chocolate", "target": "choco" }
    },
    {
        "text": "Clear the bill items",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Empty my current cart list",
        "intent": "CLEAR_CART",
        "entities": {}
    },
    {
        "text": "Stock for bread slices?",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "bread slices" }
    },
    {
        "text": "Check quantity of detergent powder",
        "intent": "CHECK_STOCK",
        "entities": { "productName": "detergent powder" }
    },
    {
        "text": "Remove tomatoes from billing",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "tomatoes" }
    },
    {
        "text": "Delete onion packet from cart",
        "intent": "REMOVE_ITEM",
        "entities": { "productName": "onion packet" }
    },
    {
        "text": "Navigate to offers section",
        "intent": "NAVIGATE",
        "entities": { "route": "/offers" }
    },
    {
        "text": "Go to low stock page",
        "intent": "NAVIGATE",
        "entities": { "route": "/low-stock" }
    },
    {
        "text": "Add 4 soap bars",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 4, "productName": "soap bars" }
    },
    {
        "text": "Add 2 kg basmati rice",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 2, "unit": "kg", "productName": "basmati rice" }
    },
    {
        "text": "Add a bottle of shampoo",
        "intent": "ADD_ITEM",
        "entities": { "quantity": 1, "productName": "shampoo" }
    },
    {
        "text": "Hey there",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Greetings" }
    },
    {
        "text": "How do I void an item?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Billing Help" }
    },
    {
        "text": "Printer printing faded text",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Printer Issue" }
    },
    {
        "text": "How are returns processed?",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Return Policy" }
    },
    {
        "text": "Give a humorous line",
        "intent": "KNOWLEDGE_QUERY",
        "entities": { "topic": "Joke" }
    },
    {
        "text": "Add new product Maggi priced 12",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "addProduct", "productName": "Maggi", "value": 12 }
    },
    {
        "text": "Delete product soda",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "deleteProduct", "productName": "soda" }
    },
    {
        "text": "GST for ghee should be 12 percent",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "gst", "productName": "ghee", "value": 12 }
    },
    {
        "text": "Expiry of milk should be 15 November",
        "intent": "DATA_MODIFICATION",
        "entities": { "target": "expiry", "productName": "milk", "value": "15 November" }
    },
    {
        "text": "Hold the invoice currently in progress",
        "intent": "HOLD_BILL",
        "entities": {}
    },
    {
        "text": "Resume the last on-hold bill",
        "intent": "UNHOLD_BILL",
        "entities": {}
    },
    {
        "text": "Give 9 percent discount",
        "intent": "APPLY_DISCOUNT",
        "entities": { "discount": 9 }
    },
    {
        "text": "Update quantity of biscuits to 14",
        "intent": "MODIFY_ITEM",
        "entities": { "productName": "biscuits", "quantity": 14 }
    },
    {
        "text": "Attach customer Vijay to the bill",
        "intent": "ADD_CUSTOMER_TO_BILL",
        "entities": { "customerName": "Vijay" }
    },
    {
        "text": "Sales report for today",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "Sales report for this week",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "this week" }
    },
    {
        "text": "Sales report for this month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "this month" }
    },
    {
        "text": "Sales report for last month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "last month" }
    },
    {
        "text": "Download sales report PDF",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "pdf" }
    },
    {
        "text": "Export sales report to excel",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "excel" }
    },
    {
        "text": "Profit report for today",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "today" }
    },
    {
        "text": "Profit report for this week",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this week" }
    },
    {
        "text": "Profit report for this month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this month" }
    },
    {
        "text": "Purchase report for today",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase", "period": "today" }
    },
    {
        "text": "Purchase report for this week",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase", "period": "this week" }
    },
    {
        "text": "Purchase report for this month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase", "period": "this month" }
    },
    {
        "text": "Supplier report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "suppliers" }
    },
    {
        "text": "Supplier report in excel",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "suppliers", "format": "excel" }
    },
    {
        "text": "Item wise sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "itemwise sales" }
    },
    {
        "text": "Category wise sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "category sales" }
    },
    {
        "text": "Top selling items report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "top products" }
    },
    {
        "text": "Dead stock report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "dead stock" }
    },
    {
        "text": "Low stock report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "low stock" }
    },
    {
        "text": "GST report for this month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "gst", "period": "this month" }
    },
    {
        "text": "GST report for last month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "gst", "period": "last month" }
    },
    {
        "text": "GST report in PDF",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "gst", "format": "pdf" }
    },
    {
        "text": "Customer wise sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "customer sales" }
    },
    {
        "text": "Payment mode report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "payment mode summary" }
    },
    {
        "text": "UPI and cash comparison report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "payment mode comparison" }
    },
    {
        "text": "End of day report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "eod", "period": "today" }
    },
    {
        "text": "Financial summary report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "financial summary" }
    },
    {
        "text": "Annual sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "this year" }
    },
    {
        "text": "Annual profit report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this year" }
    },
    {
        "text": "Yearly comparison report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "yearly comparison" }
    },
    {
        "text": "Show today's sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "Give me the sales report for this week",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "this week" }
    },
    {
        "text": "Show this month's sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "this month" }
    },
    {
        "text": "Get me last month's sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "last month" }
    },
    {
        "text": "Download the sales report in PDF",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "pdf" }
    },
    {
        "text": "Export sales report to Excel",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "format": "excel" }
    },
    {
        "text": "Show today's profit report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "today" }
    },
    {
        "text": "Give this week's profit report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this week" }
    },
    {
        "text": "Show this month's profit details",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this month" }
    },
    {
        "text": "Show today's purchase report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase", "period": "today" }
    },
    {
        "text": "Give me this week's purchase report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase", "period": "this week" }
    },
    {
        "text": "Show monthly purchase report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase", "period": "this month" }
    },
    {
        "text": "Show supplier report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "suppliers" }
    },
    {
        "text": "Download supplier report in Excel",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "suppliers", "format": "excel" }
    },
    {
        "text": "Show item wise sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "itemwise sales" }
    },
    {
        "text": "Show category wise sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "category sales" }
    },
    {
        "text": "Show report of top selling items",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "top products" }
    },
    {
        "text": "Show dead stock report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "dead stock" }
    },
    {
        "text": "Show low stock report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "low stock" }
    },
    {
        "text": "Show this month's GST report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "gst", "period": "this month" }
    },
    {
        "text": "Get last month's GST report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "gst", "period": "last month" }
    },
    {
        "text": "Download GST report in PDF",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "gst", "format": "pdf" }
    },
    {
        "text": "Show customer wise sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "customer sales" }
    },
    {
        "text": "Show payment mode wise report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "payment mode summary" }
    },
    {
        "text": "Show UPI and cash comparison report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "payment mode comparison" }
    },
    {
        "text": "Show end of day report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "eod", "period": "today" }
    },
    {
        "text": "Show full financial summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "financial summary" }
    },
    {
        "text": "Show this year's sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "this year" }
    },
    {
        "text": "Show this year's profit report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "period": "this year" }
    },
    {
        "text": "Show yearly comparison report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "yearly comparison" }
    },
    {
        "text": "show sales summary for the day",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "today" }
    },
    {
        "text": "give weekly revenue report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "revenue", "period": "this week" }
    },
    {
        "text": "show monthly revenue summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "revenue", "period": "this month" }
    },
    {
        "text": "show quarterly sales performance",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales", "period": "this quarter" }
    },
    {
        "text": "download revenue report pdf",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "revenue", "format": "pdf" }
    },
    {
        "text": "export profit details to excel",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "profit", "format": "excel" }
    },
    {
        "text": "show purchase comparison for this month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase comparison", "period": "this month" }
    },
    {
        "text": "show detailed supplier performance report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "supplier performance" }
    },
    {
        "text": "show item movement report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "item movement" }
    },
    {
        "text": "show stock valuation report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock valuation" }
    },
    {
        "text": "show inventory summary report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory summary" }
    },
    {
        "text": "show daily tax summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "tax summary", "period": "today" }
    },
    {
        "text": "show monthly tax summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "tax summary", "period": "this month" }
    },
    {
        "text": "download tax summary excel",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "tax summary", "format": "excel" }
    },
    {
        "text": "show payment settlement report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "payment settlement" }
    },
    {
        "text": "show outstanding customer balance report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "customer outstanding" }
    },
    {
        "text": "show outstanding supplier payment report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "supplier outstanding" }
    },
    {
        "text": "show cancelled bill report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "cancelled bills" }
    },
    {
        "text": "show refund report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "refunds" }
    },
    {
        "text": "show sales return report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales return" }
    },
    {
        "text": "show sales forecast report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales forecast" }
    },
    {
        "text": "show next week revenue prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "revenue forecast", "period": "next week" }
    },
    {
        "text": "show demand prediction report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "demand forecast" }
    },
    {
        "text": "show sales trend analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "sales trend" }
    },
    {
        "text": "give product performance comparison",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "product performance comparison" }
    },
    {
        "text": "show category performance analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "category performance analysis" }
    },
    {
        "text": "show hourly sales analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "hourly sales" }
    },
    {
        "text": "show peak hour sales report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "peak hour sales" }
    },
    {
        "text": "show basket analysis report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "basket analysis" }
    },
    {
        "text": "show customer buying pattern",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "customer buying pattern" }
    },
    {
        "text": "show repeat customer report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "repeat customers" }
    },
    {
        "text": "show customer lifetime value report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "customer lifetime value" }
    },
    {
        "text": "show inventory aging report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory aging" }
    },
    {
        "text": "show inventory turnover report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory turnover" }
    },
    {
        "text": "show shrinkage and loss report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory shrinkage" }
    },
    {
        "text": "show stock consumption analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock consumption" }
    },
    {
        "text": "show wastage and expiry report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage expiry" }
    },
    {
        "text": "show purchase efficiency report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase efficiency" }
    },
    {
        "text": "show supplier rating report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "supplier rating" }
    },
    {
        "text": "show costing and margin analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "margin analysis" }
    },
    {
        "text": "show profit margin comparison",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "margin comparison" }
    },
    {
        "text": "show tax liability summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "tax liability" }
    },
    {
        "text": "show input tax credit report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "input tax credit" }
    },
    {
        "text": "show yearly tax projection",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "tax projection", "period": "this year" }
    },
    {
        "text": "show store performance index",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "store performance index" }
    },
    {
        "text": "show inventory aging report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory aging" }
    },
    {
        "text": "show inventory turnover analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory turnover" }
    },
    {
        "text": "show stock movement report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock movement" }
    },
    {
        "text": "show stock consumption analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock consumption" }
    },
    {
        "text": "show reorder recommendation report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "reorder recommendations" }
    },
    {
        "text": "show safety stock analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "safety stock analysis" }
    },
    {
        "text": "show stock coverage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock coverage" }
    },
    {
        "text": "show stockout risk report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stockout risk" }
    },
    {
        "text": "show overstock report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "overstock" }
    },
    {
        "text": "show understock analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "understock" }
    },
    {
        "text": "show inventory valuation report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory valuation" }
    },
    {
        "text": "show slow moving items report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "slow moving items" }
    },
    {
        "text": "show fast moving items report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "fast moving items" }
    },
    {
        "text": "show non moving items analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "non moving items" }
    },
    {
        "text": "show wastage and expiry analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage expiry" }
    },
    {
        "text": "show damage and loss report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damage loss" }
    },
    {
        "text": "show shrinkage analysis report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory shrinkage" }
    },
    {
        "text": "show incoming stock trend",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "incoming stock trend" }
    },
    {
        "text": "show outgoing stock trend",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "outgoing stock trend" }
    },
    {
        "text": "show inventory forecast report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory forecast" }
    },
    {
        "text": "show demand based reorder report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "demand based reorder" }
    },
    {
        "text": "show purchase to stock efficiency",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase to stock efficiency" }
    },
    {
        "text": "show stock holding cost report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock holding cost" }
    },
    {
        "text": "show inventory accuracy report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory accuracy" }
    },
    {
        "text": "show warehouse utilization report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "warehouse utilization" }
    },
    {
        "text": "show shrinkage analysis report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory shrinkage" }
    },
    {
        "text": "show shrinkage summary for this month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory shrinkage", "period": "this month" }
    },
    {
        "text": "show daily shrinkage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory shrinkage", "period": "today" }
    },
    {
        "text": "show wastage analysis report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage analysis" }
    },
    {
        "text": "show monthly wastage summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage analysis", "period": "this month" }
    },
    {
        "text": "show wastage percentage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage percentage" }
    },
    {
        "text": "show expiry products report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry products" }
    },
    {
        "text": "show items expiring soon",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiring soon" }
    },
    {
        "text": "show expiry forecast report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry forecast" }
    },
    {
        "text": "show expired stock report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expired stock" }
    },
    {
        "text": "show stock spoilage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock spoilage" }
    },
    {
        "text": "show spoilage percentage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage percentage" }
    },
    {
        "text": "show item spoilage analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage analysis" }
    },
    {
        "text": "show breakage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "breakage" }
    },
    {
        "text": "show daily breakage summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "breakage", "period": "today" }
    },
    {
        "text": "show leakage and damage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "leakage damage" }
    },
    {
        "text": "show stock damage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damage report" }
    },
    {
        "text": "show damaged quantity summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damaged quantity" }
    },
    {
        "text": "show loss analysis report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "loss analysis" }
    },
    {
        "text": "show monthly loss percentage",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "loss percentage", "period": "this month" }
    },
    {
        "text": "show loss due to expiry",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry loss" }
    },
    {
        "text": "show loss due to wastage",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage loss" }
    },
    {
        "text": "show discrepancy report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock discrepancy" }
    },
    {
        "text": "show daily discrepancy report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock discrepancy", "period": "today" }
    },
    {
        "text": "show physical vs system stock difference",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "system vs physical" }
    },
    {
        "text": "show shelf life analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shelf life analysis" }
    },
    {
        "text": "show items with low shelf life",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "low shelf life" }
    },
    {
        "text": "show shelf life distribution",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shelf life distribution" }
    },
    {
        "text": "show expiry risk report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry risk" }
    },
    {
        "text": "show wastage risk report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage risk" }
    },
    {
        "text": "show spoilage risk analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage risk" }
    },
    {
        "text": "show damage trend report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damage trend" }
    },
    {
        "text": "show wastage trend analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage trend" }
    },
    {
        "text": "show shrinkage trend report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shrinkage trend" }
    },
    {
        "text": "show expiry trend report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry trend" }
    },
    {
        "text": "show category wise wastage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "category wastage" }
    },
    {
        "text": "show product wise expiry report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "product expiry" }
    },
    {
        "text": "show batch expiry report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "batch expiry" }
    },
    {
        "text": "show batch damage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "batch damage" }
    },
    {
        "text": "show batch wastage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "batch wastage" }
    },
    {
        "text": "show wastage cost analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage cost" }
    },
    {
        "text": "show expiry cost analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry cost" }
    },
    {
        "text": "show shrinkage cost analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shrinkage cost" }
    },
    {
        "text": "show combined wastage and shrinkage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage shrinkage combined" }
    },
    {
        "text": "show spoilage cost report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage cost" }
    },
    {
        "text": "show breakage cost report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "breakage cost" }
    },
    {
        "text": "show leakage cost summary",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "leakage cost" }
    },
    {
        "text": "show high wastage items",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "high wastage items" }
    },
    {
        "text": "show high expiry items",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "high expiry items" }
    },
    {
        "text": "show maximum shrinkage items",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "max shrinkage items" }
    },
    {
        "text": "show expiry timeline report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry timeline" }
    },
    {
        "text": "show expiry calendar report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry calendar" }
    },
    {
        "text": "show wastage reasons analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage reasons" }
    },
    {
        "text": "show damage reasons report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damage reasons" }
    },
    {
        "text": "show inventory forecast for next month",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory forecast", "period": "next month" }
    },
    {
        "text": "show expiry prediction for all items",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry prediction" }
    },
    {
        "text": "show wastage forecast report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage forecast" }
    },
    {
        "text": "show shrinkage prediction analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shrinkage prediction" }
    },
    {
        "text": "show ai basedstockout prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stockout prediction" }
    },
    {
        "text": "show ai reorder suggestions report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "ai reorder suggestion" }
    },
    {
        "text": "show demand forecast for next seven days",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "demand forecast", "period": "next 7 days" }
    },
    {
        "text": "show ai purchase planning report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase planning ai" }
    },
    {
        "text": "show slow moving forecast report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "slow moving forecast" }
    },
    {
        "text": "show non moving items prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "non moving prediction" }
    },
    {
        "text": "show expiry risk prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry risk prediction" }
    },
    {
        "text": "show shelf life forecast analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shelf life forecast" }
    },
    {
        "text": "show ai wastage reduction suggestions",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage reduction suggestions" }
    },
    {
        "text": "show damage trend prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damage trend prediction" }
    },
    {
        "text": "show ai spoilage detection report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage detection ai" }
    },
    {
        "text": "show forecast for overstock risk",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "overstock forecast" }
    },
    {
        "text": "show forecast for understock risk",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "understock forecast" }
    },
    {
        "text": "show ai anomaly detection in inventory",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory anomaly detection" }
    },
    {
        "text": "show ai consumption pattern analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "consumption pattern ai" }
    },
    {
        "text": "show predicted damage cost report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damage cost prediction" }
    },
    {
        "text": "show forecast for wastage cost",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage cost forecast" }
    },
    {
        "text": "show shrinkage cost forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shrinkage cost forecast" }
    },
    {
        "text": "show ai scoring for high risk items",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "high risk scoring" }
    },
    {
        "text": "show ai optimized reorder levels",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "optimized reorder ai" }
    },
    {
        "text": "show ai stock balancing suggestions",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock balancing ai" }
    },
    {
        "text": "show spoilage prediction report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage prediction" }
    },
    {
        "text": "show ai expiry clustering report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry clustering" }
    },
    {
        "text": "show predictive wastage timeline",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage timeline forecast" }
    },
    {
        "text": "show high wastage prediction items",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "high wastage prediction" }
    },
    {
        "text": "show future stock health report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "future stock health" }
    },
    {
        "text": "show ai reorder date prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "reorder date prediction" }
    },
    {
        "text": "show spoilage risk percentage forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage risk forecast" }
    },
    {
        "text": "show predicted expiry count",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "predicted expiry count" }
    },
    {
        "text": "show ai anomaly detection for wastage",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage anomaly detection" }
    },
    {
        "text": "show future inventory gap report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory gap forecast" }
    },
    {
        "text": "show estimated shelf life loss",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shelf life loss estimate" }
    },
    {
        "text": "show ai estimated damage probability",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damage probability" }
    },
    {
        "text": "show ai expiry probability report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry probability" }
    },
    {
        "text": "show future shrinkage estimate",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shrinkage estimate" }
    },
    {
        "text": "show ai bottleneck detection report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory bottleneck detection" }
    },
    {
        "text": "show aging forecast for all stock",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "aging forecast" }
    },
    {
        "text": "show warehouse load prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "warehouse load forecast" }
    },
    {
        "text": "show ai generated expiry alerts report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "ai expiry alerts" }
    },
    {
        "text": "show predicted loss due to expiry",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry loss forecast" }
    },
    {
        "text": "show predicted loss due to damage",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damage loss forecast" }
    },
    {
        "text": "show wastage heatmap report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage heatmap" }
    },
    {
        "text": "show expiry heatmap report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry heatmap" }
    },
    {
        "text": "show ai insight for stock wastage",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "wastage insight ai" }
    },
    {
        "text": "show future dead stock prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "dead stock forecast" }
    },
    {
        "text": "show predicted non moving stock",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "non moving forecast" }
    },
    {
        "text": "show ai recommended items to clear",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "clearance recommendation" }
    },
    {
        "text": "show ai inventory prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "ai inventory prediction" }
    },
    {
        "text": "show next week stock forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock forecast", "period": "next week" }
    },
    {
        "text": "show ai demand projection",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "demand projection" }
    },
    {
        "text": "show predictive sales insight",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "predictive sales insight" }
    },
    {
        "text": "show ai overstock detection",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "overstock detection" }
    },
    {
        "text": "show ai understock detection",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "understock detection" }
    },
    {
        "text": "show ai reorder quantity estimate",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "reorder quantity estimate" }
    },
    {
        "text": "show inventory usage projection",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "usage projection" }
    },
    {
        "text": "show ai seasonal demand forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "seasonal demand forecast" }
    },
    {
        "text": "show weekly shrinkage forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "shrinkage forecast", "period": "this week" }
    },
    {
        "text": "show waste generation prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "waste prediction" }
    },
    {
        "text": "show ai expiry projection",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry projection" }
    },
    {
        "text": "show expected spoilage report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage projection" }
    },
    {
        "text": "show stock health forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock health forecast" }
    },
    {
        "text": "show ai purchase optimization report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "purchase optimization ai" }
    },
    {
        "text": "show predicted supplier delays",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "supplier delay prediction" }
    },
    {
        "text": "show ai recommended stock levels",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "ai stock levels" }
    },
    {
        "text": "show projected item demand",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "item demand projection" }
    },
    {
        "text": "show ai slow moving prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "slow moving prediction" }
    },
    {
        "text": "show ai dead stock prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "dead stock prediction" }
    },
    {
        "text": "show ai supply chain risk report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "supply chain risk" }
    },
    {
        "text": "show predicted future shortages",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "future shortages" }
    },
    {
        "text": "show ai abnormal demand spike detection",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "demand spike detection" }
    },
    {
        "text": "show ai abnormal demand drop detection",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "demand drop detection" }
    },
    {
        "text": "show ai stock volatility report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock volatility" }
    },
    {
        "text": "show projected stock wastage",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "projected wastage" }
    },
    {
        "text": "show future expiry volume",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "future expiry volume" }
    },
    {
        "text": "show ai restocking window prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "restocking window prediction" }
    },
    {
        "text": "show predictive inventory imbalance report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory imbalance prediction" }
    },
    {
        "text": "show ai warehouse temperature risk analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "temperature risk analysis" }
    },
    {
        "text": "show ai spoilage probability distribution",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage probability" }
    },
    {
        "text": "show predicted inventory loss",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory loss forecast" }
    },
    {
        "text": "show ai logistic delay prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "logistic delay prediction" }
    },
    {
        "text": "show warehouse load prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "warehouse load prediction" }
    },
    {
        "text": "show ai item rotation prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "item rotation prediction" }
    },
    {
        "text": "show next month inventory risk report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory risk forecast", "period": "next month" }
    },
    {
        "text": "show ai stock adjustment suggestions",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock adjustment ai" }
    },
    {
        "text": "show anomaly detection in stock movement",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock anomaly detection" }
    },
    {
        "text": "show predictive reorder alert",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "predictive reorder alert" }
    },
    {
        "text": "show ai freshness score for inventory",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory freshness score" }
    },
    {
        "text": "show ai stock balancing forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "stock balancing forecast" }
    },
    {
        "text": "show item level forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "item level forecast" }
    },
    {
        "text": "show ai projected damage incidents",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "damage incidents projection" }
    },
    {
        "text": "show ai expiry window forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "expiry window forecast" }
    },
    {
        "text": "show predictive supply risk report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "supply risk forecast" }
    },
    {
        "text": "show ai weighted demand analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "weighted demand analysis" }
    },
    {
        "text": "show incoming stock anomaly forecast",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "incoming anomaly forecast" }
    },
    {
        "text": "show ai reorder cycle prediction",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "reorder cycle prediction" }
    },
    {
        "text": "show predictive inventory accuracy report",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "inventory accuracy forecast" }
    },
    {
        "text": "show ai spoilage hotspot analysis",
        "intent": "REPORT_QUERY",
        "entities": { "reportType": "spoilage hotspot analysis" }
    },
    {
        "text": "When will I run out of stock?",
        "intent": "INVENTORY_FORECAST",
        "entities": {}
    },
    {
        "text": "Predict stockouts for next month",
        "intent": "INVENTORY_FORECAST",
        "entities": {}
    },
    {
        "text": "Show inventory forecast",
        "intent": "INVENTORY_FORECAST",
        "entities": {}
    },
    {
        "text": "Generate purchase order",
        "intent": "GENERATE_PO",
        "entities": {}
    },
    {
        "text": "Create a PO for low stock",
        "intent": "GENERATE_PO",
        "entities": {}
    },
    {
        "text": "Order more stock based on forecast",
        "intent": "GENERATE_PO",
        "entities": {}
    }
];
