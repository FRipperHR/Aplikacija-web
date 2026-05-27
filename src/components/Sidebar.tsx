import React, { useState } from 'react';
import { 
  Home, 
  Package, 
  Truck, 
  Hammer, 
  PiggyBank, 
  CreditCard, 
  Wallet, 
  Tags, 
  BarChart3, 
  ShieldAlert, 
  UserCircle, 
  Database,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  LayoutDashboard,
  FileText,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  collapsed,
  isNew,
  locked
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void, 
  collapsed: boolean,
  key?: string,
  isNew?: boolean,
  locked?: boolean
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full p-3 my-1 rounded-xl transition-all duration-200 group relative",
        active 
          ? "bg-slate-800 text-white border-l-4 border-sky-400" 
          : "text-slate-400 hover:bg-white/5 hover:text-slate-50",
        isNew && !active && "bg-sky-500/5 border border-sky-500/20 my-2",
        locked && "opacity-70 grayscale-[0.5]"
      )}
    >
      <div className="relative">
        <Icon className={cn("w-5 h-5 min-w-[20px]", active ? "text-sky-400" : "group-hover:text-slate-50", isNew && !active && "text-sky-400")} />
        {locked && (
          <div className="absolute -top-1.5 -right-1.5 bg-slate-900 border border-slate-800 rounded-full p-0.5 z-10">
            <ShieldAlert className="w-2 h-2 text-amber-500" />
          </div>
        )}
      </div>
      {!collapsed && (
        <span className={cn(
          "ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 flex items-center gap-2",
          isNew ? "font-black text-[11px] uppercase tracking-wider text-sky-400" : "font-medium text-[13px]"
        )}>
          {label}
          {locked && <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter ml-1">Zaključano</span>}
        </span>
      )}
      
      {isNew && !collapsed && (
        <div className="ml-auto flex items-center gap-1.5 bg-sky-500/10 px-1.5 py-0.5 rounded-md border border-sky-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
          </span>
          <span className="text-[8px] font-black text-sky-400 uppercase tracking-tighter">NEW</span>
        </div>
      )}

      {active && !collapsed && !isNew && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />}
      
      {collapsed && (
        <div className="absolute left-16 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </button>
  );
};

export const Sidebar = ({ 
  activeTab, 
  setActiveTab,
  isOpen,
  setIsOpen,
  collapsed,
  setCollapsed,
  theme,
  setTheme
}: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  collapsed: boolean,
  setCollapsed: (collapsed: boolean) => void,
  theme: 'light' | 'dark',
  setTheme: (theme: 'light' | 'dark') => void
}) => {
  const { currentUser, logout, state } = useApp();

  if (!currentUser) return null;

  const perms = currentUser.permissions;

  const menuItems = [
    { id: 'skeniranje', label: 'AI Skeniranje', icon: Sparkles, show: true, isNew: true, locked: !(perms.canScanReceipts || currentUser.role === UserRole.ADMIN) },
    { id: 'pocetna', label: 'Početna', icon: Home, show: true },
    { id: 'materijali', label: 'Materijali', icon: Package, show: perms.materijali },
    { id: 'dostava', label: 'Dostava', icon: Truck, show: perms.dostava },
    { id: 'radovi', label: 'Radovi', icon: Hammer, show: perms.radovi },
    { id: 'ustede', label: 'Uštede', icon: PiggyBank, show: perms.ustede },
    { id: 'uplate', label: 'Uplate', icon: CreditCard, show: perms.uplate },
    { id: 'kredit', label: 'Kredit', icon: Wallet, show: perms.kredit },
    { id: 'kategorije', label: 'Kategorije', icon: Tags, show: perms.kategorije },
    { id: 'izvjesca', label: 'Izvješća', icon: BarChart3, show: perms.izvjesca },
    { id: 'admin', label: 'Admin zona', icon: ShieldAlert, show: currentUser.role === UserRole.ADMIN && perms.adminZona },
    { id: 'postavke', label: 'Postavke računa', icon: UserCircle, show: true },
    { id: 'backup', label: 'Backup podataka', icon: Database, show: perms.backup },
  ];

  const handleNav = (id: string, locked?: boolean) => {
    if (locked) {
      alert("Nemate dopuštenje za korištenje AI skeniranja. Obratite se administratoru.");
      return;
    }
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full bg-slate-950 border-r border-slate-900 transition-all duration-300 z-50 overflow-y-auto overflow-x-hidden flex flex-col",
          collapsed ? "lg:w-20" : "lg:w-60",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-5 flex items-center justify-between mb-2">
          {(!collapsed || isOpen) ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <motion.div 
                whileHover={{ rotate: 90 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-8 h-8 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0"
              >
                <LayoutDashboard className="w-4 h-4" />
              </motion.div>
              <div className="flex flex-col overflow-hidden max-w-[160px]">
                <span className="text-sm font-black text-sky-400 tracking-tighter leading-none truncate" title='RENOVACIJA'>RENOVACIJA</span>
                <span className="text-[10px] font-medium text-slate-500 tracking-widest leading-none mt-1 truncate">APARTMAN</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
               whileHover={{ scale: 1.1, rotate: 10 }}
               whileTap={{ scale: 0.9 }}
               className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-xl shadow-sky-500/20 flex items-center justify-center text-white mx-auto relative overflow-hidden group cursor-pointer"
               onClick={() => setCollapsed(!collapsed)}
            >
              <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              <Home className="w-5 h-5 drop-shadow-md" />
            </motion.div>
          )}
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all transform active:scale-95"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <Menu className="w-5 h-5" />
            </motion.div>
          </button>

          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2">
          {menuItems.filter(i => i.show).map(item => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => handleNav(item.id, (item as any).locked)}
              collapsed={collapsed && !isOpen}
              isNew={item.isNew}
              locked={(item as any).locked}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-950/50 flex flex-col gap-2">
          {/* Theme Toggle */}
          <div className={cn("flex items-center justify-center mb-2", (!collapsed || isOpen) ? "px-2" : "")}>
            <button
               onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
               className={cn(
                 "flex items-center justify-center text-slate-400 hover:text-white transition-all rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-800",
                 (!collapsed || isOpen) ? "w-full py-2 gap-2" : "w-10 h-10"
               )}
            >
               <motion.div
                 initial={false}
                 animate={{ rotate: theme === 'dark' ? 180 : 0, scale: theme === 'dark' ? 0.8 : 1 }}
                 className="flex-shrink-0"
               >
                 {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
               </motion.div>
               {(!collapsed || isOpen) && (
                 <span className="text-[11px] font-bold uppercase tracking-wider">
                   {theme === 'dark' ? 'Tamna tema' : 'Svijetla tema'}
                 </span>
               )}
            </button>
          </div>

          <div className={cn("flex items-center", (collapsed && !isOpen) ? "justify-center" : "gap-3 px-2 bg-slate-800 py-2 rounded-2xl border border-white/5")}>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold border border-white/10 shrink-0">
              {currentUser.avatar ? currentUser.avatar : (currentUser.displayName?.[0] || currentUser.username[0]).toUpperCase()}
            </div>
            {(!collapsed || isOpen) && (
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-bold text-white truncate">{currentUser.displayName || currentUser.username}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[9px] text-slate-400 uppercase font-black">{currentUser.role === UserRole.ADMIN ? 'Admin' : 'Član'}</p>
                </div>
              </div>
            )}
            {(!collapsed || isOpen) && (
              <button 
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                title="Odjava"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          {(collapsed && !isOpen) && (
             <button 
             onClick={logout}
             className="w-full mt-4 flex justify-center p-2 text-slate-500 hover:text-white transition-colors"
           >
             <LogOut className="w-4 h-4" />
           </button>
          )}
        </div>
      </aside>
    </>
  );
};
