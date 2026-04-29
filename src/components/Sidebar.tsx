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
  LogOut
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
  collapsed 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void, 
  collapsed: boolean,
  key?: string
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full p-3 my-1 rounded-xl transition-all duration-200 group relative",
        active 
          ? "bg-slate-800 text-white border-l-3 border-sky-400" 
          : "text-slate-400 hover:bg-white/5 hover:text-slate-50"
      )}
    >
      <Icon className={cn("w-5 h-5 min-w-[20px]", active ? "text-sky-400" : "group-hover:text-slate-50")} />
      {!collapsed && (
        <span className="ml-3 font-medium text-[13px] whitespace-nowrap overflow-hidden transition-all duration-300">
          {label}
        </span>
      )}
      {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />}
      
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
  setCollapsed
}: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  collapsed: boolean,
  setCollapsed: (collapsed: boolean) => void
}) => {
  const { currentUser, logout, state } = useApp();

  if (!currentUser) return null;

  const perms = currentUser.permissions;

  const menuItems = [
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

  const handleNav = (id: string) => {
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
              className="flex items-center gap-2"
            >
              <div className="w-2 h-6 bg-sky-400 rounded-full" />
              <div className="flex flex-col overflow-hidden max-w-[160px]">
                <span className="text-sm font-black text-sky-400 tracking-tighter leading-none truncate" title='RENOVACIJA'>RENOVACIJA</span>
                <span className="text-[10px] font-medium text-slate-500 tracking-widest leading-none mt-1 truncate">APARTMAN</span>
              </div>
            </motion.div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-sky-400 flex items-center justify-center text-slate-950 text-xs font-bold mx-auto">R</div>
          )}
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 hover:bg-white/10 rounded-md text-slate-500"
          >
            <Menu className="w-4 h-4" />
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
              onClick={() => handleNav(item.id)}
              collapsed={collapsed && !isOpen}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-950/50">
          <div className={cn("flex items-center", (collapsed && !isOpen) ? "justify-center" : "gap-3 px-2 bg-slate-800 py-2 rounded-2xl border border-white/5")}>
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold border border-white/10 shrink-0">
              {currentUser.username[0].toUpperCase()}
            </div>
            {(!collapsed || isOpen) && (
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-bold text-white truncate">{currentUser.username}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[9px] text-slate-400 uppercase font-black">{currentUser.role === UserRole.ADMIN ? 'Admin' : 'Član'}</p>
                </div>
              </div>
            )}
            {(!collapsed || isOpen) && (
              <button 
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-white transition-colors"
                title="Odjava"
              >
                <LogOut className="w-3.5 h-3.5" />
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
