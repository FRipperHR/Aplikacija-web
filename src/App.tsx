/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { UserRole } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Delivery from './pages/Delivery';
import Works from './pages/Works';
import Savings from './pages/Savings';
import Payments from './pages/Payments';
import Credits from './pages/Credits';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import AdminZone from './pages/AdminZone';
import ScannerPage from './pages/ScannerPage';
import Settings from './pages/Settings';
import Backup from './pages/Backup';
import { AnimatePresence, motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { cn } from './lib/utils';

function SyncBubble() {
  const { syncStatus } = useApp();

  let statusColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  let message = 'Synology sync ok';

  if (syncStatus === 'syncing') {
    statusColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse';
    message = 'Sinkronizacija...';
  } else if (syncStatus === 'error') {
    statusColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse';
    message = 'Greška pri spremanju';
  } else if (syncStatus === 'idle') {
    statusColor = 'bg-slate-300';
    message = 'Čekanje...'; // mostly won't be seen because after load it's success
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white/90 backdrop-blur-sm shadow border border-slate-200/60 rounded-full py-1.5 px-3 flex items-center gap-2 transition-all opacity-80 hover:opacity-100">
      <div className={cn("w-2 h-2 rounded-full", statusColor)} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
        {message}
      </span>
    </div>
  );
}

function AppContent() {

  const { currentUser, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('pocetna');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  
  // Theme management
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Učitavanje podataka...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'pocetna': return <Dashboard setActiveTab={setActiveTab} />;
      case 'materijali': return <Materials />;
      case 'dostava': return <Delivery />;
      case 'radovi': return <Works />;
      case 'ustede': return <Savings />;
      case 'uplate': return <Payments />;
      case 'kredit': return <Credits />;
      case 'kategorije': return <Categories />;
      case 'izvjesca': return <Reports />;
      case 'skeniranje': return <ScannerPage />;
      case 'admin': return <AdminZone />;
      case 'postavke': return <Settings />;
      case 'backup': return <Backup />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-300">
      <SyncBubble />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        theme={theme}
        setTheme={setTheme}
      />
      
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        collapsed ? "lg:pl-20" : "lg:pl-60"
      )}>
        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-sky-400 rounded-full" />
            <span className="text-xs font-black text-slate-800 dark:text-white tracking-tighter">RENOVACIJA</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

