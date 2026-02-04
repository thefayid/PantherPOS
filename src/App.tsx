import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Home from './pages/Home';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Hardware from './pages/Hardware';
import Promotions from './pages/Promotions';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import CashManagement from './pages/CashManagement';
import Estimates from './pages/Estimates';
import Stocktake from './pages/Stocktake';
import AuditLogs from './pages/AuditLogs';
import StaffPage from './pages/StaffPage';
import Notifications from './pages/Notifications';
import Barcodes from './pages/Barcodes';
import Marketing from './pages/Marketing';
import Dashboard from './pages/Dashboard';
import AIAssist from './pages/AIAssist';
import GstDashboard from './pages/GstDashboard';
import AccountingDashboard from './pages/AccountingDashboard';
import Vouchers from './pages/Vouchers';
import ChartOfAccounts from './pages/ChartOfAccounts';
import TrialBalance from './pages/TrialBalance';
import BalanceSheet from './pages/BalanceSheet';
import CompanySettings from './pages/CompanySettings';
import EndOfDay from './pages/EndOfDay';
import { cashService } from './services/cashService';
import { Modal } from './components/Modal';

import { useState, useEffect } from 'react';
import Login from './pages/Login';
import type { User } from './types/db';
import { settingsService } from './services/settingsService';
import { databaseService } from './services/databaseService';
import { notificationService } from './services/notificationService';

import { proactiveService } from './services/proactiveService';
import { commandGateway } from './services/CommandGateway';
import { eventBus } from './utils/EventBus';
import { trainingService } from './services/trainingService';
import { intentEngine } from './services/IntentEngine';
import TallySync from './pages/TallySync';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    window.onerror = (msg, _url, line, col, _error) => {
      setInitError(`Global Error: ${msg} at ${line}:${col}`);
      return false;
    };
    window.onunhandledrejection = (event) => {
      setInitError(`Unhandled Promise Rejection: ${event.reason}`);
    };
  }, []);

  useEffect(() => {
    console.log("Current Hash:", window.location.hash);
  }, [window.location.hash]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    commandGateway.init();
    proactiveService.init();
    eventBus.emit('APP_INIT', undefined);

    const removeThemeListener = eventBus.on('THEME_CHANGE', (newTheme: 'light' | 'dark') => {
      setTheme(newTheme);
    });
    return () => removeThemeListener();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await settingsService.init();
        await databaseService.init();
        if (window.electronAPI) {
          console.log('DB Ready');
        }
        if (localStorage.getItem('disableAnimations') === 'true') {
          document.body.classList.add('no-animations');
        }
        setTimeout(() => {
          notificationService.checkStockLevels();
          import('./data/trainingData').then((module) => {
            const data = module.trainingData || (module as any).default || [];
            trainingService.ingestTrainingData(data);
            intentEngine.ingestTrainingData(data);
          }).catch(err => console.error("Failed to load training data", err));
        }, 2000);
      } catch (err) {
        setInitError(`Init Error: ${err}`);
      }
    };
    init();
  }, []);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    try {
      const session = await cashService.getCurrentSession();
      if (!session) {
        setIsShiftModalOpen(true);
      }
    } catch (e) {
      console.error("Error checking session", e);
    }
  };

  const handleStartShift = async () => {
    if (!user || openingBalance === '') return;
    try {
      await cashService.startSession(user.id, parseFloat(openingBalance));
      setIsShiftModalOpen(false);
    } catch (error) {
      console.error("Error starting shift", error);
      alert("Failed to start shift");
    }
  };

  if (initError) {
    return (
      <div className="h-screen w-screen bg-[#0a0f1c] text-red-500 p-10 font-mono overflow-auto flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4 whitespace-nowrap">🚫 Critical Startup Error</h1>
        <div className="bg-black/50 p-6 rounded-xl border border-red-500/30 max-w-2xl w-full shadow-2xl">
          <pre className="whitespace-pre-wrap break-all text-sm">{initError}</pre>
        </div>
        <div className="flex gap-4 mt-8">
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors">Retry</button>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors">Clear Data & Restart</button>
        </div>
      </div>
    );
  }

  const isStandalone = window.location.href.includes('standalone=true');
  if (isStandalone) {
    return (
      <Router>
        <div className="h-screen w-screen bg-mac-bg overflow-hidden text-white">
          <Routes>
            <Route path="*" element={<Products />} />
          </Routes>
        </div>
      </Router>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <AppShell user={user} onLogout={() => setUser(null)}>
        <Routes>
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/barcodes" element={<Barcodes />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Products />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/my-company" element={<CompanySettings />} />
          <Route path="/end-of-day" element={<EndOfDay />} />
          <Route path="/hardware" element={<Hardware />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/cash" element={<CashManagement user={user} />} />
          <Route path="/stocktake" element={<Stocktake />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/taxation" element={<GstDashboard />} />
          <Route path="/accounting" element={<AccountingDashboard />} />
          <Route path="/accounting/vouchers" element={<Vouchers />} />
          <Route path="/accounting/chart" element={<ChartOfAccounts />} />
          <Route path="/accounting/reports/tb" element={<TrialBalance />} />
          <Route path="/accounting/reports/bs" element={<BalanceSheet />} />
          <Route path="/accounting/tally" element={<TallySync />} />
          <Route path="/ai-assist" element={<AIAssist />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Home />} />
        </Routes>

        <Modal isOpen={isShiftModalOpen} onClose={() => { }} title="START SHIFT">
          <div className="space-y-4">
            <p className="text-mac-text-secondary font-bold">Please enter the opening cash balance for this register.</p>
            <div>
              <label className="text-xs font-bold text-mac-text-secondary uppercase tracking-wider mb-1 block">Opening Balance</label>
              <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} className="mac-input w-full h-12 text-lg font-black" placeholder="0.00" autoFocus />
            </div>
            <div className="flex gap-3 mt-6">
              <button className="mac-button-secondary flex-1" onClick={() => setIsShiftModalOpen(false)}>Skip / Start Later</button>
              <button className="mac-button-ghost flex-1" onClick={() => setUser(null)}>Logout</button>
              <button className="mac-button-primary flex-1" onClick={handleStartShift}>Start Shift</button>
            </div>
          </div>
        </Modal>
      </AppShell>
    </Router>
  );
}

export default App;
