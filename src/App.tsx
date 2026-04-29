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
import Loan from './pages/Loan';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import AdminZone from './pages/AdminZone';
import Settings from './pages/Settings';
import Backup from './pages/Backup';
import { AnimatePresence, motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { cn } from './lib/utils';

function SyncBubble() {
  const { state } = useApp();
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const lastModTime = state.lastModified ? new Date(state.lastModified).getTime() : 0;
  const lastSyncTime = state.lastSynced ? new Date(state.lastSynced).getTime() : 0;
  
  const hasUnsyncedChanges = lastModTime > lastSyncTime;
  const timeSinceChange = now - lastModTime;
  
  let status = 'green';
  if (hasUnsyncedChanges) {
     status = timeSinceChange > 24 * 60 * 60 * 1000 ? 'red' : 'orange';
  }

  const formatTime = (isoString?: string) => {
     if (!isoString) return 'Nikad';
     const d = new Date(isoString);
     return d.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString('hr-HR') + ')';
  };

  const displayTime = hasUnsyncedChanges ? state.lastModified : (state.lastSynced || state.lastModified);

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 md:top-4 z-50 bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-full py-1.5 px-3 md:py-2 md:px-4 flex items-center gap-2 cursor-help transition-all group hover:scale-105">
      <div className={cn(
        "w-2.5 h-2.5 rounded-full",
        status === 'green' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
        status === 'red' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" :
        "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse"
      )} />
      <div className="flex flex-col">
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none mb-0.5">
          {hasUnsyncedChanges ? 'Nespremljeno' : 'Backup OK'}
        </span>
        <span className="text-[10px] md:text-[11px] font-bold text-slate-700 leading-none">
           Ažurirano: {formatTime(displayTime)}
        </span>
      </div>
    </div>
  );
}

function AppContent() {

  const { currentUser, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('pocetna');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
      case 'kredit': return <Loan />;
      case 'kategorije': return <Categories />;
      case 'izvjesca': return <Reports />;
      case 'admin': return <AdminZone />;
      case 'postavke': return <Settings />;
      case 'backup': return <Backup />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <SyncBubble />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-sky-400 rounded-full" />
            <span className="text-xs font-black text-slate-800 tracking-tighter">RENOVACIJA</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 border border-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className={cn(
          "flex-1 p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-x-hidden transition-all duration-300",
          collapsed ? "lg:ml-20" : "lg:ml-60"
        )}>
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

